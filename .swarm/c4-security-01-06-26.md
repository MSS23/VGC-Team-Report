# C4 Security Audit — 2026-06-01

Scope: npm audit (HIGH/CRITICAL CVEs), hardcoded secrets, OWASP on `src/app/api/**`, headers/CSP, dangerouslySetInnerHTML.

Cross-referenced with `.swarm/main-changed-files.md` for conflict_risk.

---

## TL;DR

- **No P0s.** No real hardcoded secret values, no critical CVEs, no auth-bypassed mutation endpoints.
- npm audit reports 13 vulns (10 moderate / 3 high / 0 critical). All three highs are reachable only from dev-only paths (`cypress`, sentry build plugin) or already mitigated client-side; **none are exploitable in the deployed Next.js app**.
- Security posture is mature: CSP, HSTS preload, X-Frame-Options DENY, frame-ancestors none, CORS allowlist + double-submit CSRF, timing-safe HMAC / bearer comparisons across every webhook + cron route, all Neon SQL via tagged templates (parameterised), SSRF allowlists on the two outbound-fetch routes (`/api/sprite`, `/api/pokepaste`).
- One **moderate** finding: GET `/api/share/{id}/collaborators` is missing `apiGuard`/rate-limit (auth-gated, low impact but inconsistent with siblings).
- Two **low** quality findings: middleware regex coverage for `Origin not allowed`, plus the `qs/uuid/tmp/js-cookie` advisories all have `fixAvailable: true` and should be cleared in the next housekeeping pass.

---

## 1. npm audit — HIGH/CRITICAL only

| Pkg | Severity | Reachable in prod? | Disposition |
|-----|----------|--------------------|-------------|
| `js-cookie` (≤3.0.5) GHSA-qjx8-664m-686j | **HIGH** — prototype hijack in `assign()` enabling cookie-attribute injection | Only via `@clerk/shared` (browser auth bundle). Clerk uses it for its own session cookie, not for user-controllable cookie names. `fixAvailable: true` by bumping `@clerk/shared`. | Bump `@clerk/nextjs` patch (advisory says fix is available). Low actual blast radius. |
| `tmp` (<0.2.6) GHSA-ph9p-34f9-6g65 | **HIGH** — path traversal via unsanitized prefix/postfix | Pulled in by **devDependencies only** (sentry/webpack-plugin build chain). Never shipped to runtime. | Dev-only — fix on next dep bump. |
| `@clerk/shared` 0.18→3.47.5 | **HIGH (transitive)** | Same root cause as `js-cookie`. | Fixed by the same `@clerk/nextjs` bump. |
| `next` (16.x via `postcss` XSS GHSA-qx2v) | Moderate | The CVE is in postcss's `</style>` stringification — not exercised by our build (we don't run user-supplied CSS through PostCSS at runtime). Not exploitable in our app. | No action required; will flow in on next Next.js patch. |
| `qs`, `uuid`, `@cypress/request`, `cypress`, `brace-expansion`, `@sentry/webpack-plugin` | Moderate | All dev-only (cypress, sentry build plugin, eslint typescript-estree). | Clear on next `npm audit fix`. |

**No CRITICAL CVEs reported.** Metadata: `{info:0, low:0, moderate:10, high:3, critical:0}`.

---

## 2. Hardcoded Secrets Scan

`grep -rIn -E "(api[_-]?key|secret|token|password|signing)" src/ --include='*.ts' --include='*.tsx'` returned 115 lines. Every hit is one of:

- env-var reference (`process.env.LINEAR_API_KEY`, `process.env.CRON_SECRET`, etc.) — **OK**;
- a string referring to the word "token"/"secret" in comments or variable names — **OK**;
- the column name `edit_token` (per-share random hex, generated server-side) — **OK**;
- the literal `"my-secret"` in `src/lib/__tests__/cron-auth.test.ts` — **test fixture**, expected;
- one hardcoded hex value: `DISCORD_PUBLIC_KEY = "44b2cb02932ad5b5..."` in `src/app/api/discord/route.ts:6` — this is the **Discord application public key** used for ed25519 verification. It is *intentionally public* (Discord publishes it); shipping it in source is the correct pattern.

**No leaked secret values.** No `sk_…`, `AKIA…`, `ghp_…`, `xoxb…`, or other obvious credential shapes anywhere under `src/` or `.env.example`.

---

## 3. OWASP scan on `src/app/api/**`

### 3a. SQL injection
All queries use `@neondatabase/serverless` tagged template literals (`sql\`SELECT … WHERE id = ${id}\``), which parameterise — never raw concat. Reviewed every SQL hit produced by `grep -rIn -E "(SELECT|UPDATE|INSERT|DELETE).*\\$\\{"` (≈50 lines). Includes dynamic composition in `explore/route.ts` via `sql\`\`` empty fragments, which is the documented safe composition pattern in `@neondatabase/serverless`. **No SQLi exposure.**

### 3b. SSRF
Two routes make outbound fetches with any user-influenced URL:

- `src/app/api/sprite/route.ts:40-45` — host allowlist (`ALLOWED_HOSTS = {play.pokemonshowdown.com}`) + path prefix check `/sprites/`. Safe.
- `src/app/api/pokepaste/route.ts:12-21` — Zod refinement enforces `hostname === "pokepast.es"` on the GET; POST writes to a hardcoded URL. Safe.

All cron/webhook routes (`daily-ops`, `weekly-report`, `posthog-errors`, `discord`, `bot`) hit hardcoded API endpoints (Linear/PostHog/Discord/npm registry). No user-controlled URL reaches `fetch()`. **No SSRF exposure.**

### 3c. Open redirects
Only one server-side redirect (`src/middleware.ts:98`) — target is the hardcoded `CANONICAL_HOST`. Client-side: `ShareRedirectClient` in `src/app/s/[id]/redirect.tsx` redirects to a path string built server-side in `s/[id]/page.tsx:219` from the share's own ID + sanitized querystring. **No open-redirect exposure.**

### 3d. Auth-bypass
Routes that mutate state and are intentionally public-but-guarded (Clerk webhook, Linear webhook, PostHog webhook, Discord interactions, `/api/views`, cron routes) — every one of them either:

- verifies an HMAC signature (Clerk via `verifyWebhook`, Linear via crypto.createHmac + timingSafeEqual, Discord via `nacl.sign.detached.verify`), or
- requires a bearer token via `verifyBearer()` / `isCronAuthorized()`, both of which use `crypto.timingSafeEqual` with equal-length guard, or
- gates on session-id dedup and `is_public = TRUE` (the views counter).

All `/api/user/**`, `/api/share` POST/PATCH/DELETE, `/api/share/[id]/collaborators` POST/PATCH/DELETE, `/api/feedback` POST, `/api/share/[id]/fork`, `/api/match-log` POST require `auth()` from `@clerk/nextjs/server` and short-circuit on `!userId`. Verified via `grep -rln "auth()" src/app/api/`. **No bypassable mutation endpoint found.**

### 3e. Rate limiting
Exhaustive `grep` for `apiGuard | isRateLimited | isCronAuthorized | verifyBearer | verifyWebhook | timingSafeEqual` across all 50 `route.ts` files. Unrate-limited routes:

1. `src/app/api/sprite/route.ts` — intentionally bypasses middleware + apiGuard for edge-cache reasons (documented at middleware:50-61). Allowlist gate is sufficient.
2. `src/app/api/discord/route.ts` — ed25519 signature gate replaces rate-limit (Discord enforces its own).
3. `src/app/api/user/export/route.ts` — auth-gated + custom 24h cooldown via Redis. Equivalent to rate limit. **OK.**
4. `src/app/api/share/[id]/collaborators/route.ts` **GET handler (line 28)** — missing `apiGuard`. Auth-gated (`!userId → 401`), so abuse impact is bounded to one Clerk-authenticated user enumerating their own collaborator lists. Still inconsistent with siblings. **Moderate.**

Everything else uses `apiGuard({ rateLimit: ... })` or a per-user cooldown.

---

## 4. Headers / CSP

`next.config.ts` ships a comprehensive header set on every route:

- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` (2y, preload-eligible)
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` — disables camera/mic/geo/payment/usb/sensors
- `Cross-Origin-Opener-Policy: unsafe-none` (required for Clerk OAuth popups; noted as deliberate trade-off in the config comment — correct call given OAuth requirement)
- `Cross-Origin-Resource-Policy: cross-origin` (required for showdown sprite img tags)
- A detailed `Content-Security-Policy` with `frame-ancestors 'none'`, `object-src 'none'`, `upgrade-insecure-requests`, `base-uri 'self'`, and tight per-directive allowlists for Clerk/Sentry/PostHog/Vercel/Showdown.

**One CSP weakness:** `script-src` includes `'unsafe-inline'` (next.config.ts:85). Required by the head-script in `src/app/layout.tsx:101` (theme preflight to prevent FOUC). Mitigated by `frame-ancestors 'none'` + the absence of any user-content injection path into `<script>`. Long-term fix: move the theme preflight to a nonce'd inline script. **Low.**

Middleware (`src/middleware.ts`) adds canonical-host redirect, bot detection, CORS allowlist for API, and CSRF double-submit cookie. All correct.

---

## 5. `dangerouslySetInnerHTML` audit

Only two real call-sites:

1. `src/app/layout.tsx:101` — theme preflight script, **static literal**, no user data interpolated. Safe.
2. `src/components/seo/JsonLd.tsx:9` — JSON-LD output. Wraps `JSON.stringify(data)` and explicitly escapes `</script>` (line 5: `.replace(/<\/script>/gi, "<\\/script>")`). This is the documented Next.js-safe pattern and was the fix shipped in v5.13 changelog. Safe.

No other DSI uses anywhere under `src/`.

---

## Top 5 Actionable Findings

| # | Severity | File:line | Issue | Proposed fix |
|---|----------|-----------|-------|--------------|
| 1 | **Moderate** | `src/app/api/share/[id]/collaborators/route.ts:28` | GET handler lacks `apiGuard` / rate-limit (sibling POST/PATCH/DELETE all guard). Authenticated abuse vector. | Add `const guard = await apiGuard(request, { rateLimit: { key: "collab-list", max: 60 } }); if (guard) return guard;` immediately after the `params` await. |
| 2 | **Moderate (dev)** | `package.json` deps (`js-cookie`, `tmp`, `qs`, `uuid`, `cypress`) | 3× HIGH + 7× moderate advisories, all `fixAvailable: true`. | `npm audit fix` + bump `@clerk/nextjs` to clear the `js-cookie` chain. Single PR. |
| 3 | **Low** | `next.config.ts:85` | `script-src 'unsafe-inline'` required only for the theme preflight script. | Replace inline `<script>` in `src/app/layout.tsx:101` with a Next.js `<Script>` carrying a per-request nonce, then drop `'unsafe-inline'`. |
| 4 | **Low** | `src/app/api/webhooks/linear/route.ts:68-71` | Bare `catch {}` returns 200 — masks all parser errors after signature verification. Right call for Linear's auto-disable behaviour, but consider logging the error so signature-valid malformed payloads aren't invisible. | Add `console.error("Linear webhook handler error:", e);` inside the catch. Pure observability fix. |
| 5 | **Low** | `src/app/api/cron/daily-ops/route.ts:40-44` | Health-check treats `401` as "alive" when `CRON_SECRET` is unset — fine, but the comment understates that this also masks a misconfigured prod env. | Add a separate Discord alert when `!process.env.CRON_SECRET` in prod. |

---

## Conflict Risk vs `.swarm/main-changed-files.md`

The changed-files list overlaps heavily with the files inspected here. Conflict risk tags below — none are blockers because every finding above is additive (no overlapping line edits).

- `conflict_risk:LOW` — Finding #1 touches `src/app/api/share/[id]/collaborators/route.ts` (in changed-files), but only a single-line insertion at the top of the GET handler. Should rebase cleanly on any sibling change.
- `conflict_risk:NONE` — Findings #2, #3 touch `package.json`/`next.config.ts`/`src/app/layout.tsx`; none are in `main-changed-files.md`.
- `conflict_risk:NONE` — Finding #4 touches `src/app/api/webhooks/linear/route.ts` (in changed-files) — single-line `console.error` add, no semantic overlap.
- `conflict_risk:NONE` — Finding #5 touches `src/app/api/cron/daily-ops/route.ts` (in changed-files) — single conditional add.

No findings require changes to `src/middleware.ts`, the SQL layer, or any Clerk integration code, so no contention with the heavier-touch swarm members.
