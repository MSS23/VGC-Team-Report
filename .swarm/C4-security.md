# Security Audit — VGC Team Report

**Date:** 2026-05-07
**Auditor:** Claude (automated, read-only)

---

## 1. Dependency Vulnerabilities

### Critical

**[CRITICAL]** `@clerk/nextjs` (v7.0.0–7.2.3) — Middleware-based route protection bypass (CVSS 9.1)
- Advisory: GHSA-vqx2-fgx2-5wq9
- Allows unauthenticated requests to bypass Clerk middleware protection entirely.
- Fix available: upgrade to ≥7.2.1 (route bypass) and ≥7.2.4 (org/billing bypass)

**[CRITICAL]** `@clerk/nextjs` (v7.0.0–7.2.3) — Authorization bypass on org/billing/reverification checks
- Advisory: GHSA-w24r-5266-9c3c
- Fix available: upgrade to ≥7.2.4

**[CRITICAL]** `@clerk/shared` (v4.0.0–4.8.2) — Same two Clerk advisories as above (transitive)
- Fix available: resolved by upgrading `@clerk/nextjs`

**[CRITICAL]** `protobufjs` (<7.5.5) — Arbitrary code execution
- Advisory: GHSA-xq3m-2v4x-88gg
- Fix available: upgrade dependency that pulls in protobufjs

### High

**[HIGH]** `@clerk/backend` (v3.0.0–3.2.13) — Authorization bypass (GHSA-w24r-5266-9c3c)

**[HIGH]** `@clerk/react` (v6.0.0–6.4.2) — Authorization bypass (GHSA-w24r-5266-9c3c)

**[HIGH]** `axios` (v1.0.0–1.15.1) — 13 separate high-severity advisories including:
- SSRF via NO_PROXY hostname normalization bypass (GHSA-3p68-rc4w-qgx5)
- Cloud metadata exfiltration via header injection (GHSA-fvcv-3m26-pcqx)
- Authentication bypass via prototype pollution (GHSA-w9j2-pvgh-6h63)
- CRLF injection in multipart/form-data (GHSA-445q-vr5w-6q77)
- Unbounded recursion DoS (GHSA-62hf-57xw-28j9)
- Multiple prototype pollution gadgets (SSRF, credential injection, request hijacking)
- Fix available: upgrade to ≥1.15.2

**[HIGH]** `next` (v9.3.4–16.3.0-canary.5) — Denial of Service with Server Components (GHSA-q4gf-8mx6-v5v3)
- Fix available: upgrade to ≥16.3.0

**[HIGH]** `vite` (v8.0.0–8.0.4) — 3 advisories: path traversal in optimized deps, `server.fs.deny` bypass, arbitrary file read via WebSocket
- Fix available: upgrade to ≥8.0.5
- Note: vite is a dev dependency; not exposed in production builds

---

## 2. Secret Scanning

### Hardcoded Value (Non-Sensitive Public Key)

The Discord Ed25519 public key is hardcoded in source:
```
src/app/api/discord/route.ts:6
const DISCORD_PUBLIC_KEY = "44b2cb02932ad5b5eae681352246314ffb23ecd299c2490d7875d5883e5596ae";
```
This is a **public key** used for signature verification (not a secret), and Discord documents it as safe to embed in source. No remediation required, but it should ideally be an env var for flexibility.

### No Hardcoded Secrets Found

- No API keys, passwords, or bearer tokens hardcoded in `src/`
- All secrets (`DISCORD_BOT_TOKEN`, `LINEAR_API_KEY`, `CRON_SECRET`, `MIGRATE_SECRET`, `CLEANUP_SECRET`, `POSTHOG_PERSONAL_API_KEY`, `POSTHOG_WEBHOOK_SECRET`) are read from `process.env` correctly
- No hardcoded URLs containing auth tokens found

---

## 3. OWASP API Security

### 3a. Missing Authentication — Linear Webhook

**[CRITICAL]** `src/app/api/webhooks/linear/route.ts` — No authentication or signature verification.
- Any actor can POST to `/api/webhooks/linear` and have the request accepted (currently returns `{ ok: true }`)
- While the route has no side effects today, it will if webhook handling is ever implemented
- **Fix:** Validate Linear's `x-linear-signature` HMAC header using `LINEAR_WEBHOOK_SIGNING_SECRET`

### 3b. Secret Passed as Query Parameter

**[HIGH]** `src/app/api/bot/route.ts` — CRON_SECRET is accepted as a plaintext URL query parameter (`?secret=...`).
- Query strings are logged by web servers, proxies, Vercel request logs, and browser history
- **Fix:** Move secret to `Authorization: Bearer <secret>` header (as done correctly in `/api/cleanup` and `/api/keep-alive`)

### 3c. String Interpolation in HogQL Query (Weak Sanitization)

**[MEDIUM]** `src/app/api/webhooks/posthog/route.ts:33–35` — sessionId and beforeTimestamp are sanitized only by stripping single-quotes (`replace(/'/g, "")`), then interpolated directly into a HogQL query string.
- This is not parameterized querying; it relies on minimal character-stripping
- While HogQL is not SQL, injection of other SQL metacharacters (e.g. `--`, `;`, backticks, `$`) is not prevented
- The `sessionId` value originates from the PostHog webhook payload — if POSTHOG_WEBHOOK_SECRET is compromised, an attacker controls this field
- **Fix:** Use parameterized HogQL variables or stricter allow-list validation (e.g. UUID format for sessionId, ISO timestamp for beforeTimestamp)

### 3d. Input Validation — Generally Good

Most routes use Zod for input validation:
- `/api/feedback`, `/api/share`, `/api/views/[shareId]`, `/api/pokepaste`, `/api/user/follow`, `/api/user/saved`, `/api/user/collections`, `/api/user/drafts` — all use Zod schemas
- `/api/sprite` validates the upstream host against an `ALLOWED_HOSTS` allowlist
- No SQL injection risk found in Postgres queries — all use tagged template literals (postgres.js parameterized queries)

### 3e. Authentication Coverage

All sensitive user-data routes (`/api/user/*`, `/api/share`, `/api/reactions`, `/api/explore`, `/api/comments`) correctly call `auth()` from `@clerk/nextjs/server` and check `userId` before proceeding.

Cron/admin routes are protected by bearer token (`CRON_SECRET` / `CLEANUP_SECRET` / `MIGRATE_SECRET`).

### 3f. CORS

CORS is handled centrally in `src/middleware.ts` via `getCorsHeaders`/`isAllowedOrigin` from `src/lib/security/cors`. Cross-origin requests from unknown origins are blocked at middleware level before reaching route handlers. No misconfigured wildcard CORS on sensitive routes.

The `/api/sprite` route sets `Access-Control-Allow-Origin: *` — intentional and appropriate for a public image proxy.

---

## 4. Environment Variable Exposure

### NEXT_PUBLIC_ Variables in Use

| Variable | Exposure | Assessment |
|---|---|---|
| `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` | Client-side | **Expected** — PostHog ingestion token is designed to be public |
| `NEXT_PUBLIC_POSTHOG_HOST` | Client-side | Safe — just a URL |
| `NEXT_PUBLIC_CLARITY_ID` | Client-side | Safe — Microsoft Clarity site ID is public |

No sensitive secrets (API keys, signing secrets, database passwords, bearer tokens) are exposed via `NEXT_PUBLIC_` prefix. All server-side secrets are accessed only via non-prefixed `process.env` in server components/routes.

---

## 5. Summary of Findings by Severity

| Severity | Count | Issues |
|---|---|---|
| CRITICAL | 5 | Clerk auth bypass (2 advisories × 2 packages), protobufjs RCE, Linear webhook unauth |
| HIGH | 16 | Clerk (backend+react), axios (13 advisories), Next.js DoS, bot secret in query param |
| MEDIUM | 1 | HogQL string interpolation (weak sanitization) |
| LOW / INFO | 1 | Discord public key hardcoded (not a secret; cosmetic) |

---

## 6. Recommended Actions (Priority Order)

1. **Immediately:** `npm update @clerk/nextjs` to ≥7.2.4 — active auth bypass in production
2. **Immediately:** Add HMAC signature verification to `/api/webhooks/linear`
3. **This week:** `npm update axios` to ≥1.15.2 — 13 high vulns including SSRF
4. **This week:** Move `/api/bot` secret from query param to `Authorization` header
5. **This week:** `npm update next` to ≥16.3.0 — DoS via Server Components
6. **This week:** `npm update protobufjs` (or the package pulling it in) to ≥7.5.5
7. **Soon:** Parameterize or strictly validate sessionId/timestamp in `/api/webhooks/posthog` HogQL query
8. **Backlog:** Move Discord public key to env var for operational flexibility
