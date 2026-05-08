# Security Audit — VGC Team Report
**Date:** 2026-05-08  
**Auditor:** Claude (read-only analysis)  
**Scope:** `/src/` API routes, middleware, security libs, npm dependencies

---

## 1. Dependency Vulnerabilities

### CRITICAL — @clerk/nextjs (7.0.0–7.2.3) | CVSS 9.1
**Advisory:** GHSA-vqx2-fgx2-5wq9 — Middleware-based route protection bypass  
**CWE:** CWE-436 (Interpretation Conflict), CWE-863 (Incorrect Authorization)  
Clerk middleware can be bypassed entirely, granting unauthenticated access to routes that appear protected. This is the most dangerous vulnerability in the app — it directly undermines the auth layer.  
**Fix:** `npm install @clerk/nextjs@^7.2.1` (fix available)

### CRITICAL — @clerk/shared (4.0.0–4.8.2) | CVSS 9.1
**Advisory:** GHSA-vqx2-fgx2-5wq9 — same middleware bypass as above (transitive dependency)  
**Fix:** Resolved by upgrading `@clerk/nextjs`

### CRITICAL — protobufjs (<7.5.5)
**Advisory:** Prototype pollution / unsafe deserialization  
Transitive dependency. Low direct exposure but could be leveraged in chained exploits.  
**Fix:** `npm audit fix --force` or identify which package pulls it in

### HIGH — next (9.3.4-canary – 16.3.0-canary.5)
Multiple CVEs in Next.js itself (exact advisory not shown in audit output but range is flagged HIGH). The app is on Next.js 16, which is within the affected range.  
**Fix:** Update to the latest Next.js 16 patch release

### HIGH — @clerk/backend (3.0.0–3.2.13)
**Advisory:** GHSA-w24r-5266-9c3c — Authorization bypass when combining org/billing/reverification checks  
**Fix:** Resolved by upgrading `@clerk/nextjs`

### HIGH — @clerk/react (6.0.0–6.4.2)
Same org/billing authorization bypass. Transitive via `@clerk/nextjs`.  
**Fix:** Resolved by upgrading `@clerk/nextjs`

### HIGH — axios (1.0.0–1.15.1)
**Advisory:** GHSA-3p68-rc4w-qgx5 — NO_PROXY hostname normalization bypass → SSRF  
**Advisory:** GHSA-fvcv-3m26-pcqx — Unrestricted cloud metadata exfiltration via header injection  
Axios is a transitive dependency. Direct SSRF risk depends on which packages use it internally; at minimum it widens the SSRF attack surface.  
**Fix:** `npm audit fix` or upgrade the direct dependency pulling axios

### HIGH — vite (8.0.0–8.0.4)
Dev-dependency only. Lower production risk but dev machines and CI are affected.  
**Fix:** `npm install vite@latest -D`

### MODERATE — dompurify (<=3.3.3)
XSS bypass in certain HTML sanitization scenarios.  
**Fix:** `npm install dompurify@latest`

### MODERATE — follow-redirects (<=1.15.11)
SSRF via open redirect following. Transitive.  
**Fix:** Resolved by upgrading the direct package that pulls it

### MODERATE — postcss (<8.5.10)
CSS injection/parsing vulnerability. Dev-only impact likely.  
**Fix:** `npm install postcss@latest -D`

---

## 2. Hardcoded Secrets / Sensitive Values

### MEDIUM — Discord Public Key hardcoded in source
**File:** `src/app/api/discord/route.ts:6`  
```ts
const DISCORD_PUBLIC_KEY = "44b2cb02932ad5b5eae681352246314ffb23ecd299c2490d7875d5883e5596ae";
```
This is a **public key** (used only for Ed25519 signature verification), not a secret. However, hardcoding it in source means that rotating the Discord app's public key requires a code deploy rather than an env var change. Best practice is to read from `process.env.DISCORD_PUBLIC_KEY`.  
**Severity:** LOW (public key, not secret — but violates key rotation hygiene)

### INFO — No hardcoded secrets found in `src/`
All actual secrets (API keys, tokens) are properly read from `process.env.*`. The grep scan confirmed all sensitive string references are environment variable lookups. No `sk_live_`, `Bearer [literal]`, or raw passwords found.

---

## 3. API Route Security (OWASP Top-10)

### HIGH — Linear Webhook: No Signature Verification (A07: Auth Failure)
**File:** `src/app/api/webhooks/linear/route.ts`  
The Linear webhook endpoint accepts any POST without verifying the Linear webhook signature. Linear sends an `x-linear-signature` HMAC-SHA256 header for each event.  
**Current code:** Immediately processes the body with no auth check.  
**Impact:** Anyone can POST fake Linear events to this endpoint (e.g., spoofed `url_verification` challenges or future event handlers).  
**Fix:** Verify `x-linear-signature` with HMAC-SHA256 using `LINEAR_WEBHOOK_SECRET`.

### MEDIUM — Migrate Endpoint: Secret in JSON Body (A07: Auth Failure)
**File:** `src/app/api/migrate/route.ts:22–24`  
```ts
const { secret } = await request.json().catch(() => ({ secret: "" }));
if (!secret || secret !== process.env.MIGRATE_SECRET) {
```
The `MIGRATE_SECRET` is passed as a JSON body field rather than an `Authorization: Bearer` header. This means the secret travels in the request body which may be logged by proxies, CDNs, or middleware. Compare to `cleanup/route.ts` which correctly uses the `Authorization` header.  
**Fix:** Switch to `Authorization: Bearer <MIGRATE_SECRET>` header check, consistent with other admin routes.

### MEDIUM — Unvalidated `shareId` in Reactions and Comments Routes (A03: Injection)
**Files:** `src/app/api/reactions/[shareId]/route.ts`, `src/app/api/comments/[shareId]/route.ts`  
The `shareId` path parameter is used directly in parameterized SQL queries without first validating its format. While parameterized queries prevent SQL injection, an unvalidated shareId (e.g., an extremely long string, unicode, or control characters) still reaches the DB layer.  
Compare to `share/[id]/route.ts` which applies `IdSchema = z.string().regex(/^[A-Za-z0-9]{8}$/)` before any DB call.  
**Fix:** Apply `IdSchema` validation at the top of both route handlers, same as the share GET route.

### MEDIUM — HogQL Injection via Untrusted Webhook Data (A03: Injection)
**File:** `src/app/api/webhooks/posthog/route.ts:31–36`  
```ts
const query = `
  SELECT event, timestamp, properties
  FROM events
  WHERE properties.$session_id = '${sessionId.replace(/'/g, "")}'
    AND timestamp <= '${beforeTimestamp.replace(/'/g, "")}'
```
String replacement of single-quotes is not sufficient escaping for HogQL. The `sessionId` and `beforeTimestamp` values come directly from the PostHog webhook payload (external, attacker-controlled if POSTHOG_WEBHOOK_SECRET is compromised). A more robust approach is parameterized HogQL queries or strict allowlist validation of the `sessionId` format.  
**Fix:** Validate `sessionId` matches `/^[a-zA-Z0-9_-]{10,60}$/` and `beforeTimestamp` matches ISO-8601 before interpolating. Alternatively use PostHog's parameterized query API if available.

### LOW — Rate-Limit Fallback is Per-Instance (A06: Vulnerable Components)
**File:** `src/lib/rate-limit.ts:33–58`  
When `UPSTASH_REDIS_REST_URL` is not configured, the rate limiter falls back to in-memory state. On Vercel's serverless platform, each function instance has its own memory — so the in-memory fallback provides **no protection** against distributed requests hitting multiple cold-start instances simultaneously.  
**Fix:** Ensure `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are always set in Vercel environment variables. Consider failing closed (returning 500) if Redis is unavailable rather than silently falling back.

### LOW — Bot Detection Bypassed for Cron/Webhook Routes
**File:** `src/middleware.ts:33`  
Cron routes (`/api/cron/*`, `/api/webhooks/*`, `/api/keep-alive`, `/api/setup`) skip bot detection entirely. This is intentional for legitimate cron callers. However, `/api/setup` skipping bot detection is slightly broader than needed — that route is protected by `MIGRATE_SECRET`/`CRON_SECRET` but still benefits from bot filtering as defense-in-depth.

### LOW — CSRF Only Enforced on True Cross-Origin Requests
**File:** `src/middleware.ts:96–109`  
CSRF validation is skipped for `isTrueCrossOrigin === false`, which means same-origin requests never see CSRF checks. This is the standard double-submit pattern and is architecturally correct, but worth documenting: if a CORS misconfiguration ever allows an unintended origin, the CSRF layer is the second line of defense — and it only validates `cookieToken === headerToken` with no constant-time comparison, which in theory enables timing attacks (negligible risk in practice at this traffic level).

---

## 4. Content Security Policy

### LOW — CSP Uses `unsafe-inline` and `unsafe-eval` for Scripts
**File:** `next.config.ts:81`  
```
"script-src 'self' 'unsafe-inline' 'unsafe-eval' ..."
```
These directives significantly weaken the XSS protection that CSP provides. `unsafe-eval` is required by some third-party libraries; `unsafe-inline` is required for the theme-initialization inline `<script>` in `layout.tsx`. Both are common Next.js trade-offs but represent an accepted risk.  
**Recommendation:** Consider nonce-based CSP for inline scripts rather than blanket `unsafe-inline`.

---

## 5. `dangerouslySetInnerHTML` Usage

### INFO — Two instances, both appear safe
1. `src/app/layout.tsx:97` — Theme init script with a fully static string literal. No user input interpolated.
2. `src/components/seo/JsonLd.tsx:5` — `JSON.stringify(data)` where `data` is server-constructed structured data. `JSON.stringify` escapes `<`, `>`, and `&` when used inside `<script>` tags in React, making this XSS-safe.

No `eval()` or `new Function()` calls found in the codebase.

---

## 6. Summary by Severity

| # | Severity | Finding |
|---|----------|---------|
| 1 | CRITICAL | `@clerk/nextjs` middleware route protection bypass (CVSS 9.1) |
| 2 | CRITICAL | `@clerk/shared` same bypass (transitive) |
| 3 | CRITICAL | `protobufjs` prototype pollution |
| 4 | HIGH | Linear webhook — no signature verification |
| 5 | HIGH | `next` package HIGH CVE in current version range |
| 6 | HIGH | `axios` SSRF via NO_PROXY bypass (transitive) |
| 7 | HIGH | `@clerk/backend` + `@clerk/react` auth bypass (transitive) |
| 8 | MEDIUM | `migrate` route sends secret in request body |
| 9 | MEDIUM | `shareId` unvalidated in reactions + comments routes |
| 10 | MEDIUM | HogQL injection via webhook `sessionId`/`beforeTimestamp` |
| 11 | LOW | Rate-limit in-memory fallback ineffective on serverless |
| 12 | LOW | Discord public key hardcoded (rotation requires deploy) |
| 13 | LOW | CSP `unsafe-inline` + `unsafe-eval` weakens XSS protection |
| 14 | INFO | `dangerouslySetInnerHTML` — static content only, safe |

---

## 7. Immediate Action Items

1. **Run `npm install @clerk/nextjs@latest`** — resolves the CRITICAL auth bypass (items 1, 2, 6, 7 in one shot)
2. **Add Linear webhook signature verification** in `src/app/api/webhooks/linear/route.ts`
3. **Move migrate secret to Authorization header** in `src/app/api/migrate/route.ts`
4. **Add `IdSchema` validation** to reactions and comments `shareId` params
5. **Validate `sessionId` format** before HogQL interpolation in posthog webhook
6. **Verify Upstash Redis env vars are set** in all Vercel environments (never rely on in-memory fallback)
