# C4 Security Audit — VGC Team Report
**Date:** 2026-05-14
**Scope:** src/app/api/, src/lib/

---

## FINDING 1 — VGC-173 RESOLVED: HogQL Injection Already Patched

**Severity:** INFO (previously HIGH — now fixed)
**File:** `src/app/api/webhooks/posthog/route.ts`

Linear ticket VGC-173 described a HogQL injection at lines 33-34 using string interpolation and a naive `replace(/'/g, '')` quote-strip. **This vulnerability is NOT present in the current codebase.** The code was already patched.

**Current (safe) implementation (lines 46-52):**
```typescript
query:
  "SELECT event, timestamp, properties FROM events WHERE properties.$session_id = {session_id} AND timestamp <= {before_ts} ORDER BY timestamp DESC LIMIT 15",
values: { session_id: sessionId, before_ts: beforeTimestamp },
```

Variables are bound via PostHog's `values` parameter map — never interpolated into the query string. Additionally, `sessionId` is validated against a strict UUID regex before use (lines 28-29):
```typescript
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
if (!UUID_RE.test(sessionId)) return [];
```

No remediation needed.

---

## FINDING 2 — GraphQL String Interpolation in Cron Routes (LOW-MEDIUM)

**Severity:** LOW-MEDIUM
**Files:**
- `src/app/api/cron/daily-ops/route.ts:84`
- `src/app/api/cron/weekly-report/route.ts:30-32`

Several cron routes build Linear GraphQL queries via template literal interpolation of environment-sourced values:

**daily-ops/route.ts line 84:**
```typescript
query: `{ team(id: "${teamId}") { issues(filter: { state: { name: { eq: "In Progress" } } }, first: 50) { nodes { identifier title updatedAt } } } }`,
```

**weekly-report/route.ts lines 30-32:**
```typescript
const completed = await query(`{ team(id: "${teamId}") { issues(filter: { state: { type: { eq: "completed" } }, completedAt: { gte: "${oneWeekAgo}" } }, first: 50) { nodes { identifier title } } } }`);
const inProgress = await query(`{ team(id: "${teamId}") { issues(filter: { state: { name: { eq: "In Progress" } } }, first: 50) { nodes { identifier title } } } }`);
const inReview   = await query(`{ team(id: "${teamId}") { issues(filter: { state: { name: { eq: "In Review" } } }, first: 50) { nodes { identifier title } } } }`);
```

**Risk assessment:** `teamId` and `oneWeekAgo` are both sourced exclusively from `process.env` and `new Date()` — not from user input. Exploitability is low in the current threat model. However, the pattern is fragile: if a future refactor passes `teamId` from a request parameter, injection becomes possible.

**Contrast:** `getOrCreateOpsLabel()` in `daily-ops/route.ts` (lines 173, 183-188) correctly uses GraphQL `$variables` for the same Linear API — inconsistent pattern within the same file.

**Proposed fix — use GraphQL variables consistently:**
```typescript
// Instead of:
body: JSON.stringify({
  query: `{ team(id: "${teamId}") { ... } }`,
})

// Use:
body: JSON.stringify({
  query: `query($teamId: String!) { team(id: $teamId) { issues(filter: { state: { name: { eq: "In Progress" } } }, first: 50) { nodes { identifier title updatedAt } } } }`,
  variables: { teamId },
})
```

---

## FINDING 3 — VGC-174 CONFIRMED: Timing-Safe Bot Auth Applied Correctly

**Severity:** INFO (fix verified)
**File:** `src/app/api/bot/route.ts:44-47`

The bot route uses `crypto.timingSafeEqual` correctly to prevent timing oracle attacks on the CRON_SECRET:
```typescript
const { timingSafeEqual } = await import("crypto");
const aLen = Math.max(authHeader.length, expected.length);
if (!timingSafeEqual(Buffer.from(authHeader.padEnd(aLen)), Buffer.from(expected.padEnd(aLen))) || authHeader.length !== expected.length) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
```

The padding + length check combination is sound — constant-time compare on padded buffers, then explicit length check to reject wrong-length inputs that would pass the padded comparison.

**Secondary finding — `isCronAuthorized()` uses naive string comparison (LOW):**

`src/lib/cron-auth.ts:10` uses a simple `===` comparison:
```typescript
return authHeader === `Bearer ${cronSecret}`;
```

This function is used by `daily-ops`, `weekly-report`, `posthog-errors`, and `cleanup` cron routes. The bot route correctly does its own timing-safe check and does NOT use `isCronAuthorized()`. The cron routes using `isCronAuthorized()` are only callable by Vercel's cron infrastructure (reducing practical exploitability), but the inconsistency is a hazard.

**Proposed fix for `src/lib/cron-auth.ts`:**
```typescript
import { timingSafeEqual } from "crypto";

export function isCronAuthorized(request: Request): boolean {
  const authHeader = request.headers.get("authorization") ?? "";
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return false;

  const expected = `Bearer ${cronSecret}`;
  if (authHeader.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(authHeader), Buffer.from(expected));
}
```

---

## FINDING 4 — Hardcoded Linear Label UUIDs (INFO)

**Severity:** INFO
**Files:**
- `src/app/api/webhooks/posthog/route.ts:407-413`
- `src/app/api/cron/posthog-errors/route.ts:25-27`

Linear label IDs are hardcoded as UUIDs in both files:
```typescript
const LABELS = {
  bug: "bbd03f4e-be6f-4617-ad7d-b9fdc596ce5c",
  improvement: "06d28974-98c3-457a-bbab-ab85456e51f0",
  webApp: "1f355942-6143-47a8-93be-4a5cbe0de0b0",
  mobile: "5389312c-66f8-4ced-a840-ff3cd46b68aa",
  analytics: "a13703f8-0865-4a6d-b74c-56a7abc2f563",
  infrastructure: "a0e2ddf6-557d-4164-b049-a4ee36ee342f",
};
```

These are Linear workspace-internal label IDs — not secrets (no auth capability, no token). Safe to commit. No remediation needed.

---

## FINDING 5 — No Hardcoded API Keys or Secrets Found

**Severity:** INFO (pass)

A scan of all files in `src/lib/` and `src/app/api/` found no hardcoded API keys, tokens, passwords, or secrets. All sensitive values are correctly read from `process.env`. No remediation needed.

---

## FINDING 6 — SSRF: Sprite and PokePaste Proxies Are Properly Allow-Listed

**Severity:** INFO (pass)
**Files:** `src/app/api/sprite/route.ts`, `src/app/api/pokepaste/route.ts`

The sprite proxy enforces host and path allow-lists before fetching:
```typescript
const ALLOWED_HOSTS = new Set(["play.pokemonshowdown.com"]);
if (!ALLOWED_HOSTS.has(target.hostname)) return new NextResponse("Host not allowed", { status: 400 });
if (!target.pathname.startsWith("/sprites/")) return new NextResponse("Path not allowed", { status: 400 });
```

The PokePaste proxy enforces `hostname === "pokepast.es"` via Zod schema validation. No SSRF risk.

---

## FINDING 7 — XSS: JSON-LD Script Injection Properly Mitigated

**Severity:** INFO (pass)
**File:** `src/components/seo/JsonLd.tsx`

`dangerouslySetInnerHTML` is used to inject JSON-LD but the output is escaped:
```typescript
const safe = JSON.stringify(data).replace(/<\/script>/gi, "<\\/script>");
```

This prevents `</script>` tag injection. Commit `58b5c7a` (VGC-174) applied this fix. Valid mitigation.

---

## FINDING 8 — PostHog Webhook: Non-Timing-Safe Token Comparison (LOW)

**Severity:** LOW
**File:** `src/app/api/webhooks/posthog/route.ts:170-172`

The PostHog webhook verifies the shared token using direct string equality:
```typescript
const token = request.headers.get("x-posthog-token");
if (!process.env.POSTHOG_WEBHOOK_SECRET || token !== process.env.POSTHOG_WEBHOOK_SECRET) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
```

Susceptible to timing oracle attacks. Practical exploitability is low (network jitter dominates timing), but the fix is trivial given that `bot/route.ts` already sets the pattern.

**Proposed fix:**
```typescript
import { timingSafeEqual } from "crypto";

const token = request.headers.get("x-posthog-token") ?? "";
const secret = process.env.POSTHOG_WEBHOOK_SECRET;
if (!secret) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
if (token.length !== secret.length || !timingSafeEqual(Buffer.from(token), Buffer.from(secret))) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
```

---

## Summary Table

| # | Finding | Severity | Status | File |
|---|---------|----------|--------|------|
| 1 | VGC-173 HogQL injection | ~~HIGH~~ INFO | Fixed | webhooks/posthog/route.ts |
| 2 | GraphQL string interpolation in cron (env-only values) | LOW-MEDIUM | Open | cron/daily-ops:84, cron/weekly-report:30-32 |
| 3 | VGC-174 timing-safe bot auth | INFO | Verified ✓ | api/bot/route.ts:44-47 |
| 3b | `isCronAuthorized()` naive `===` compare | LOW | Open | lib/cron-auth.ts:10 |
| 4 | Hardcoded Linear label UUIDs | INFO | Acceptable | webhooks/posthog, cron/posthog-errors |
| 5 | Hardcoded API keys/secrets | INFO | None found ✓ | All |
| 6 | SSRF via sprite/pokepaste proxy | INFO | Mitigated ✓ | api/sprite, api/pokepaste |
| 7 | XSS via JSON-LD injection | INFO | Fixed ✓ | components/seo/JsonLd.tsx |
| 8 | PostHog webhook non-timing-safe compare | LOW | Open | webhooks/posthog/route.ts:170-172 |

## Recommended Actions (Prioritized)

1. **Update `src/lib/cron-auth.ts`** to use `timingSafeEqual` — 5-minute fix affecting 4 cron routes.
2. **Update PostHog webhook token check** (`webhooks/posthog/route.ts:170-172`) to use `timingSafeEqual`.
3. **Refactor cron GraphQL queries** to use `$variables` pattern consistently (daily-ops:84, weekly-report:30-32) — eliminates injection risk entirely if env vars are ever replaced with request-derived data.
