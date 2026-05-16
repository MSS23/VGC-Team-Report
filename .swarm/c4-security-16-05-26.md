# Security Audit — VGC Team Report
**Date:** 2026-05-16
**Auditor:** Claude Code (Sonnet 4.6)
**Scope:** API routes, package.json, next.config.ts, recent commits

---

## 1. SQL Injection

### Finding 1.1 — No SQL injection found (parameterized queries throughout)
**Severity:** N/A (informational — PASS)

All database interactions use the `@neondatabase/serverless` tagged-template (`sql\`...\``) which passes values as bind parameters. No string interpolation into raw SQL was found. Reviewed all 47 API routes.

---

## 2. Input Validation / Missing Zod Parsing

### Finding 2.1 — `POST /api/comments/[shareId]/[commentId]` — editToken / sessionId untyped cast
**File:** `src/app/api/comments/[shareId]/[commentId]/route.ts` — lines 6-10, 34-48  
**Severity:** Low

The `DeleteBody` Zod schema accepts `editToken` and `sessionId` as optional strings with no length or format constraints. A very long string in either field would be passed directly to the SQL query as a bind parameter. No injection risk exists (parameterized), but unbounded strings could cause unexpected DB behavior or DoS through large query parameters.

**Fix:** Add `.max(64)` to `editToken` (it is a 64-hex token) and `.max(128)` to `sessionId` in the schema.

---

### Finding 2.2 — `PATCH /api/user/notifications` — `body.ids` array is not validated with Zod
**File:** `src/app/api/user/notifications/route.ts` — lines 61-62  
**Severity:** Medium

```ts
} else if (Array.isArray(body.ids) && body.ids.length > 0) {
  await sql`UPDATE notifications SET read = TRUE WHERE user_id = ${userId} AND id = ANY(${body.ids})`;
}
```

`body.ids` is consumed directly from `request.json()` with no Zod parsing and no element type validation. An attacker can send `{"ids": [true, null, {}, 999999999999]}`. The `ANY(...)` binding is parameterized so SQL injection is prevented, but there is no limit on array length (DoS: pass millions of IDs) and no validation that elements are integers, which could trigger unexpected Postgres behaviour depending on driver casting.

**Fix:** Add a Zod schema: `z.object({ ids: z.array(z.number().int().positive()).max(100).optional(), markAllRead: z.boolean().optional() })` and parse `body` through it before use.

---

### Finding 2.3 — `GET /api/views/[shareId]` — shareId not format-validated
**File:** `src/app/api/views/[shareId]/route.ts` — lines 14-18  
**Severity:** Low

Unlike sibling routes (`/api/share/[id]`, `/api/sync/[id]`) which validate the ID against `/^[A-Za-z0-9]{8}$/`, the views route passes the raw `shareId` from the URL directly into the Redis cache key and the SQL WHERE clause:

```ts
const isFirstView = await cacheSetIfAbsent(`view:${shareId}:${parsed.data.sessionId}`, 600);
...WHERE id = ${shareId} AND is_public = TRUE
```

Since the DB query is parameterized this is not exploitable for SQL injection. However, an attacker can craft arbitrary Redis cache keys by providing a long or specially-formatted shareId, potentially poisoning or exhausting Redis key-space.

**Fix:** Add the same regex validation as other routes (`/^[A-Za-z0-9]{8,16}$/`) and return 404 on mismatch.

---

### Finding 2.4 — `GET /api/user/reports/[shareId]` — shareId not format-validated
**File:** `src/app/api/user/reports/[shareId]/route.ts` — lines 28, 93  
**Severity:** Low

Same pattern as 2.3 — the `shareId` from the URL is used in SQL queries without format validation. No injection risk (parameterized), but the absence of validation is inconsistent with the rest of the codebase.

**Fix:** Same regex guard as Finding 2.3.

---

## 3. Authentication — Missing or Weak Auth

### Finding 3.1 — `GET /api/keep-alive` — User-Agent bypass
**File:** `src/app/api/keep-alive/route.ts` — lines 11-18  
**Severity:** Medium

```ts
const isVercelCron = userAgent.includes("vercel-cron");
const hasValidSecret = cronSecret && authHeader === `Bearer ${cronSecret}`;
if (!isVercelCron && !hasValidSecret) { ... }
```

`User-Agent` headers are trivially forgeable. Any unauthenticated HTTP client that sets `User-Agent: vercel-cron` bypasses the bearer-token check entirely. While this endpoint only runs `SELECT 1` against the DB (low data exposure), it keeps the Neon connection warm on demand — a potential minor DoS vector to inflate cold-start metrics.

**Fix:** Remove the `isVercelCron` path entirely; require `CRON_SECRET` Bearer token unconditionally, matching the pattern used in `isCronAuthorized()` in all other cron routes.

---

### Finding 3.2 — `POST /api/webhooks/linear` — signature verification skipped when `LINEAR_WEBHOOK_SECRET` is unset
**File:** `src/app/api/webhooks/linear/route.ts` — lines 17-37  
**Severity:** Medium

```ts
if (webhookSecret) {
  // verify ...
} else {
  console.warn("LINEAR_WEBHOOK_SECRET is not set — skipping signature verification (local dev mode)");
}
```

If `LINEAR_WEBHOOK_SECRET` is absent from the production environment (misconfiguration, accidental deletion), the endpoint falls through and processes any arbitrary POST body. Currently the route only handles `url_verification` and ignores other events, so exploitation impact is limited. However, this pattern is a dangerous precedent.

**Fix:** Return 401 immediately when `webhookSecret` is not set rather than warn-and-continue.

---

### Finding 3.3 — `POST /api/comments/[shareId]` — unauthenticated comment posting
**File:** `src/app/api/comments/[shareId]/route.ts` — lines 75-173  
**Severity:** Low (by design, but worth noting)

Comments do not require authentication — anyone can post using an arbitrary `sessionId` string. Rate limiting is applied (5/min per IP), the report must be public with `allowComments: true`, and content is HTML-escaped and word-filtered. This appears intentional but means spam/abuse is only limited by rate limiting and word filters, not identity. There is also no CAPTCHA.

**Fix:** Consider requiring authentication for comment posting, or adding stricter rate limits. At minimum, document this as an intentional design decision.

---

## 4. Hardcoded Values in Source Code

### Finding 4.1 — Discord bot public key hardcoded in source
**File:** `src/app/api/discord/route.ts` — line 6  
**Severity:** Low

```ts
const DISCORD_PUBLIC_KEY = "44b2cb02932ad5b5eae681352246314ffb23ecd299c2490d7875d5883e5596ae";
```

Discord interaction endpoints must use the application's public key for Ed25519 signature verification. This key is intentionally public (it is listed in the Discord Developer Portal and must be committed for the endpoint to function). This is not a secret, but it should be noted — if the Discord application is ever rotated, this hardcoded value must be updated.

**Fix:** Move to `DISCORD_PUBLIC_KEY` environment variable to allow rotation without code changes.

---

### Finding 4.2 — Linear label UUIDs hardcoded in two files
**Files:**
- `src/app/api/webhooks/posthog/route.ts` — lines 423-430
- `src/app/api/cron/posthog-errors/route.ts` — lines 24-28

**Severity:** Low

Linear label IDs (e.g., `"bbd03f4e-be6f-4617-ad7d-b9fdc596ce5c"`) are hardcoded in source. These are not secrets, but if labels are deleted and recreated in Linear, the integration silently fails without error.

**Fix:** Move label IDs to environment variables or fetch them dynamically from the Linear API at startup.

---

### Finding 4.3 — No actual secrets hardcoded (PASS)
**Severity:** N/A

A full scan of all API routes found no hardcoded API keys, database connection strings, passwords, or bearer tokens. All secrets are read from `process.env.*`.

---

## 5. package.json — Dependency Vulnerabilities

### Finding 5.1 — `next` ^16.2.2 — Multiple High/Critical CVEs
**File:** `package.json` — line (dependencies)  
**Severity:** HIGH

`npm audit` reports the installed version matches multiple CVEs:

| CVE / Advisory | Severity | Description |
|---|---|---|
| GHSA-q4gf-8mx6-v5v3 | High | DoS via Server Components (< 16.2.3) |
| GHSA-8h8q-6873-q5fj | High | DoS via Server Components (< 16.2.5) |
| GHSA-mg66-mrh9-m8jx | High | DoS via Cache Components connection exhaustion (< 16.2.5) |
| GHSA-c4j6-fc7j-m34r | High | SSRF via WebSocket upgrades (< 16.2.5, CVSS 8.6) |
| GHSA-492v-c6pp-mqqv | High | Middleware/proxy bypass via dynamic route parameter injection (< 16.2.5, CVSS 8.1) |
| GHSA-267c-6grr-h53f | High | App Router middleware/proxy bypass via segment-prefetch (< 16.2.5) |
| GHSA-26hh-7cqf-hhc6 | High | Middleware/proxy bypass — incomplete fix follow-up (< 16.2.6) |
| GHSA-36qx-fr4f-26g5 | High | Middleware/proxy bypass via i18n pages router (< 16.2.5) |

**Fix:** Upgrade `next` to `^16.2.6` or the latest stable release immediately. The SSRF (GHSA-c4j6-fc7j-m34r) and middleware bypass (GHSA-492v-c6pp-mqqv) are the most critical — both are network-exploitable without authentication.

---

### Finding 5.2 — `protobufjs` (transitive) — Critical Arbitrary Code Execution
**Severity:** Critical (transitive — via `@opentelemetry` packages)

`npm audit` reports `protobufjs <= 7.5.5` (transitive dependency via OpenTelemetry) has:
- GHSA-xq3m-2v4x-88gg — Arbitrary code execution (CVSS 9.8 Critical)
- GHSA-75px-5xx7-5xc7 — Code generation gadget after prototype pollution (CVSS 8.1 High)
- GHSA-jvwf-75h9-cwgg — Process-wide DoS through unsafe option paths

The `protobufjs` exposure is in server-side telemetry code (`@opentelemetry/exporter-logs-otlp-http`). Exploitation likely requires control over protobuf schema input.

**Fix:** `npm audit fix` or upgrade `@opentelemetry/exporter-logs-otlp-http` and related OTel packages to pick up a fixed `protobufjs >= 7.5.6`.

---

### Finding 5.3 — `fast-uri` (transitive) — High Path Traversal / Host Confusion
**Severity:** High (transitive)

Two advisories for `fast-uri <= 3.1.1`:
- GHSA-q3j6-qgpj-74h6 — Path traversal via percent-encoded dot segments (CVSS 7.5)
- GHSA-v39h-62p7-jpjc — Host confusion via percent-encoded authority delimiters (CVSS 7.5)

**Fix:** Run `npm audit fix` to update transitive dependencies.

---

### Finding 5.4 — `vite` (transitive dev dep, `vitest`) — High Arbitrary File Read
**Severity:** High (dev-only — not shipped to production)

`vite >= 8.0.0, <= 8.0.4` has three high-severity vulnerabilities including GHSA-p9ff-h696-f583 (arbitrary file read via dev server WebSocket). This is a dev-dependency via `vitest`, not deployed to Vercel.

**Fix:** Upgrade `vitest` to pull in a fixed Vite version. No production risk, but CI/CD pipelines that run `vitest` in untrusted environments could be affected.

---

## 6. next.config.ts — CSP Headers

### Finding 6.1 — `unsafe-inline` in `script-src`
**File:** `next.config.ts` — CSP header, `script-src` directive  
**Severity:** Medium

```
script-src 'self' 'unsafe-inline' https://*.clerk.accounts.dev ...
```

`'unsafe-inline'` in `script-src` effectively disables XSS protection from CSP for scripts. Any reflected or stored XSS vulnerability would be exploitable even with this CSP in place.

**Note:** This is almost certainly required by Clerk's JavaScript bundle and/or Vercel Live toolbar. However, the combination of `'unsafe-inline'` and `'self'` provides weaker XSS protection than nonce-based or hash-based CSP.

**Fix:** Investigate whether Clerk supports a nonce-based CSP and replace `'unsafe-inline'` with `'nonce-{nonce}'` using Next.js middleware to inject the nonce per request. See [Clerk CSP docs](https://clerk.com/docs/security/clerk-csp).

---

### Finding 6.2 — No `unsafe-eval` (PASS)
**Severity:** N/A

`unsafe-eval` is not present in the CSP. Good.

---

### Finding 6.3 — `Cross-Origin-Opener-Policy: unsafe-none`
**File:** `next.config.ts` — COOP header  
**Severity:** Low

COOP is set to `unsafe-none` (the least restrictive value) to support Clerk OAuth popups. This disables cross-origin isolation, preventing use of `SharedArrayBuffer` and high-resolution timers. The comment in the config explains the reason correctly.

**Fix:** No action needed unless `SharedArrayBuffer` is required. Document this trade-off in the codebase.

---

## 7. Recently Changed Files — Security-Relevant

### Finding 7.1 — VGC-182: Champions meta SQL pushed into DB
**Commit:** `282aef1`  
**File:** `src/app/api/champions/meta/route.ts`  
**Severity:** Low (informational)

The large SQL CTE pushed in this commit uses only static string interpolation for `LIMIT ${TOP_N}` where `TOP_N` is a module-level constant (`20`). No user input flows into the query. No new attack surface introduced.

---

### Finding 7.2 — `swarm: fix dead exports` — `src/lib/security/input-validation.ts` modified
**Commit:** `761a10d`  
**File:** `src/lib/security/input-validation.ts`  
**Severity:** Low (informational)

This commit touched the security utilities. No regression was identified — the changes were TypeScript type fixes. The `getClientIp()` and `hasValidContentType()` functions appear correct.

---

## Summary Table

| # | File | Severity | Issue |
|---|------|----------|-------|
| 2.1 | `api/comments/[shareId]/[commentId]/route.ts` | Low | Unbound editToken/sessionId in Zod schema |
| 2.2 | `api/user/notifications/route.ts` | Medium | `body.ids` array unparsed — no length limit |
| 2.3 | `api/views/[shareId]/route.ts` | Low | shareId not format-validated before Redis key use |
| 2.4 | `api/user/reports/[shareId]/route.ts` | Low | shareId not format-validated |
| 3.1 | `api/keep-alive/route.ts` | Medium | User-Agent forgery bypasses secret auth |
| 3.2 | `api/webhooks/linear/route.ts` | Medium | Signature verification skipped if env var missing |
| 3.3 | `api/comments/[shareId]/route.ts` | Low | Comments unauthenticated (by design) |
| 4.1 | `api/discord/route.ts` | Low | Discord public key hardcoded |
| 4.2 | `api/webhooks/posthog/route.ts`, `cron/posthog-errors/route.ts` | Low | Linear label UUIDs hardcoded |
| 5.1 | `package.json` | **High** | `next` 16.2.2 — SSRF + middleware bypass CVEs |
| 5.2 | `package.json` (transitive) | **Critical** | `protobufjs` arbitrary code execution |
| 5.3 | `package.json` (transitive) | High | `fast-uri` path traversal / host confusion |
| 5.4 | `package.json` (dev, transitive) | High | `vite` arbitrary file read (dev-only) |
| 6.1 | `next.config.ts` | Medium | `unsafe-inline` in CSP `script-src` |
| 6.3 | `next.config.ts` | Low | COOP `unsafe-none` (required by Clerk OAuth) |

---

## Priority Fixes

1. **Immediate:** Upgrade `next` to `>=16.2.6` — multiple high-severity CVEs including SSRF and middleware auth bypass.
2. **Immediate:** Run `npm audit fix` for `protobufjs` (critical) and `fast-uri` (high) transitive deps.
3. **Short-term:** Fix `api/keep-alive` user-agent bypass (2 lines).
4. **Short-term:** Fix `api/webhooks/linear` to fail closed when `LINEAR_WEBHOOK_SECRET` is unset.
5. **Short-term:** Add Zod validation to `notifications` PATCH `body.ids` (Finding 2.2).
6. **Medium-term:** Investigate nonce-based CSP to eliminate `unsafe-inline` from `script-src`.
