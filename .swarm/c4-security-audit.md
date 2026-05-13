# Security Audit — VGC Team Report

**Date:** 2026-05-13
**Auditor:** Claude Code (Security Agent)
**Scope:** `src/app/api/`, `src/lib/`, `src/lib/security/`, `next.config.ts`, `src/middleware.ts`

---

## 1. npm audit Summary

**Total vulnerabilities: 7** (as of audit run)

| Severity | Count | Packages |
|----------|-------|----------|
| Critical | 1 | `semver` (ReDoS via untrusted version string) |
| High | 3 | `next` (DoS with Server Components), `fast-uri` (path traversal + host confusion), `protobufjs` (code injection, DoS) |
| Moderate | 3 | `@protobufjs/utf8` (overlong UTF-8 decode), `dompurify` (FORBID_TAGS bypass × 4 advisories), `vite` (path traversal, arbitrary file read via dev-server WebSocket) |

All have fixes available (`npm audit fix` should resolve most). The `dompurify` advisories affect versions `<=3.3.3`; upgrade to `>=3.4.0`. The `next` DoS is in the direct dependency; ensure `next` is pinned to a patched release.

---

## 2. OWASP Top 10 Analysis

### 2.1 SQL Injection

**Status: LOW RISK — parameterized queries used throughout**

The codebase uses Neon's `@neondatabase/serverless` tagged-template client (`sql\`...\``), which parameterises every interpolation. No raw SQL string concatenation was found. All API routes querying the DB pass user-controlled values as template arguments, never as interpolated string fragments.

No findings.

---

### 2.2 Cross-Site Scripting (XSS)

#### Finding 1 — `dangerouslySetInnerHTML` with user-controlled JSON-LD data
- **OWASP Category:** A03:2021 – Injection (XSS)
- **File:** `src/components/seo/JsonLd.tsx:5`, used at `src/app/s/[id]/page.tsx:195`
- **Severity:** Medium
- **Details:** The `JsonLd` component renders `JSON.stringify(data)` directly into a `<script type="application/ld+json">` tag via `dangerouslySetInnerHTML`. On the `/s/[id]` share page, the `data` object is built from DB-stored user content: `creatorName`, `tournamentName`, `teamSummary`, and collaborator `user_name` values are all user-supplied. If any of these fields contain the string `</script>`, a browser may terminate the script block early, potentially injecting arbitrary HTML.
- **Fix:** Escape `</script>` in the serialised string after `JSON.stringify`. Standard approach: `JSON.stringify(data).replace(/<\/script>/gi, '<\\/script>')`.

#### Finding 2 — `dangerouslySetInnerHTML` in `layout.tsx` (inline theme script)
- **OWASP Category:** A03:2021 – Injection (XSS)
- **File:** `src/app/layout.tsx:96`
- **Severity:** Low (static content, no user data injected)
- **Details:** A static inline script uses `dangerouslySetInnerHTML`. Content is 100% hardcoded; no user input is interpolated. Not exploitable in isolation but represents a pattern to monitor.
- **Fix:** No immediate action required; document as intentional.

#### Finding 3 — CSP uses `'unsafe-inline'` for scripts
- **OWASP Category:** A05:2021 – Security Misconfiguration
- **File:** `next.config.ts:85`
- **Severity:** Medium
- **Details:** `script-src` includes `'unsafe-inline'`, which negates most XSS protection the CSP would otherwise provide. Any reflected or stored XSS payload (including the JSON-LD issue above) can execute inline scripts without restriction.
- **Fix:** Migrate to nonce-based CSP (`'nonce-{nonce}'`) using Next.js middleware to inject a per-request nonce, removing `'unsafe-inline'` from `script-src`. For `style-src`, also remove `'unsafe-inline'` where possible.

---

### 2.3 Insecure Authentication / Broken Access Control

#### Finding 4 — Non-timing-safe secret comparison in `/api/bot`
- **OWASP Category:** A07:2021 – Identification and Authentication Failures
- **File:** `src/app/api/bot/route.ts:39`
- **Severity:** Medium
- **Details:** Auth check `authHeader !== \`Bearer ${expectedSecret}\`` uses JavaScript `!==`, which is not constant-time. A timing oracle could allow incremental brute-force of `CRON_SECRET`. The Linear webhook (`src/app/api/webhooks/linear/route.ts`) correctly uses `crypto.timingSafeEqual`; this endpoint does not.
- **Fix:** Use `crypto.timingSafeEqual` with a length guard (check lengths are equal first to avoid exceptions), matching the pattern in the Linear webhook handler.

#### Finding 5 — `CRON_SECRET` unset allows trivial bypass in `/api/bot`
- **OWASP Category:** A07:2021 – Identification and Authentication Failures
- **File:** `src/app/api/bot/route.ts:38-40`
- **Severity:** Medium
- **Details:** When `CRON_SECRET` is undefined, `expectedSecret` is `undefined`. The check `authHeader !== "Bearer undefined"` only blocks a literal `Bearer undefined` string. A missing env var silently degrades security. The `isCronAuthorized` helper correctly returns `false` when `cronSecret` is falsy, but `/api/bot` does not use that helper.
- **Fix:** Add `if (!expectedSecret) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });` before the comparison. Alternatively, refactor to use `isCronAuthorized`.

#### Finding 6 — Secret passed in request body (not header) on `/api/migrate`
- **OWASP Category:** A02:2021 – Cryptographic Failures
- **File:** `src/app/api/migrate/route.ts:22-23`
- **Severity:** Low-Medium
- **Details:** The `MIGRATE_SECRET` is sent as `{ secret: "..." }` in the JSON request body. This risks the secret appearing in CDN access logs, application logs that log request bodies, or browser network tab history. Other protected endpoints (`/api/setup`, `/api/cleanup`) correctly use the `Authorization: Bearer` header.
- **Fix:** Change `/api/migrate` to accept `Authorization: Bearer <MIGRATE_SECRET>` header, matching the pattern used by all other protected endpoints.

#### Finding 7 — Discord public key hardcoded in source
- **OWASP Category:** A02:2021 – Cryptographic Failures (key management)
- **File:** `src/app/api/discord/route.ts:6`
- **Severity:** Low (public key — not a secret credential)
- **Details:** `DISCORD_PUBLIC_KEY` is an Ed25519 public key embedded as a literal string. Discord public keys are intended to be public (they verify signatures from Discord's servers), so this is not a credential leak. However, if the Discord application is re-registered or rotated, the value must be updated in code.
- **Fix:** Move to `process.env.DISCORD_PUBLIC_KEY` for operational flexibility without a code change on rotation.

---

### 2.4 SSRF (Server-Side Request Forgery)

#### Finding 8 — `NEXT_PUBLIC_POSTHOG_HOST` used in server-side fetch without allowlist validation
- **OWASP Category:** A10:2021 – Server-Side Request Forgery
- **File:** `src/app/api/webhooks/posthog/route.ts:23-40`, `src/app/api/cron/posthog-errors/route.ts:63,142`
- **Severity:** Low (environment-variable-controlled, not user-controlled)
- **Details:** `NEXT_PUBLIC_POSTHOG_HOST` is read from an env var and used to construct server-side fetch URLs. This is not a runtime SSRF (user cannot set it), but misconfiguration or supply-chain compromise could redirect PostHog calls to an attacker host that would receive the PostHog API key.
- **Fix:** Validate the env var at startup against a hardcoded pattern: e.g. `if (!/^https:\/\/[a-z.-]+\.posthog\.com(\/.*)?$/.test(host)) throw new Error("Invalid PostHog host");`.

All other server-side fetch calls use hardcoded URLs or validated allowlists (sprite proxy, pokepaste proxy, Linear API). No user-controlled URL fetch was found.

---

### 2.5 Hardcoded Secrets

**Status: PASS — No hardcoded credentials found.**

All secrets (DATABASE_URL, API keys, webhook tokens, CRON_SECRET) are correctly loaded from `process.env`. The `DISCORD_PUBLIC_KEY` (Finding 7) is a public verification key by design, not a secret.

---

### 2.6 Rate Limiting Coverage

Routes **with** rate limiting (via `apiGuard` or explicit `isRateLimitedAsync`):
All user-facing data-read and write endpoints are covered: `share`, `explore`, `comments`, `reactions`, `views`, `feedback`, `match-log`, `pokepaste`, `user/*`, `changelog`, `creator`, `spotlight`, `oembed`, `sync`, `share/*/collaborators`, `share/*/versions`, `share/*/fork`.

Routes **without standard rate limiting:**

| Route | Auth | Risk |
|-------|------|------|
| `GET /api/sprite` | None | Low — edge-cached, strict allowlist |
| `GET /api/keep-alive` | None | Low — static 200 |
| `POST /api/webhooks/linear` | HMAC signature | Low |
| `POST /api/webhooks/posthog` | Token header | Low |
| `GET /api/setup` | Bearer secret | Medium — runs DDL |
| `POST /api/migrate` | Body secret | Medium — batch DB writes |

#### Finding 9 — No rate limiting on `/api/setup` and `/api/migrate`
- **OWASP Category:** A05:2021 – Security Misconfiguration
- **File:** `src/app/api/setup/route.ts`, `src/app/api/migrate/route.ts`
- **Severity:** Medium
- **Details:** Both endpoints are secret-gated but lack rate limiting. Repeated requests with wrong secrets could be used to brute-force values (compounding Finding 4). Even with correct secrets, rapid calls could hammer the database.
- **Fix:** Add `apiGuard` with a tight IP-based rate limit (e.g. `max: 5, windowMs: 60_000`) as a first line before the secret check.

---

## 3. Security Utilities (`src/lib/security/`) — Assessment

| Utility | Assessment |
|---------|-----------|
| `api-guard.ts` | Good — wraps rate limiting, Content-Type, and body-size checks. Used consistently across most routes. |
| `cors.ts` | Good — strict allowlist with regex for Vercel previews. `isAllowedOrigin` correctly returns `true` for no-origin (same-origin) requests. |
| `csrf.ts` | Good — double-submit cookie with constant-length token check. `httpOnly: false` is intentional to allow JS access. |
| `input-validation.ts` | Good — null-byte stripping, injection pattern matching, IP validation. Note: `containsInjection` regex can be bypassed with character encoding tricks; should be supplementary, not primary defence. |
| `bot-detection.ts` | Good — comprehensive scanner/scraper blocklist with legitimate bot allowlist. |

**Weakness:** `containsInjection` in `input-validation.ts:12-21` uses simple regex patterns. An attacker could bypass with unicode escapes, null bytes between characters, or CSS encoding. The codebase correctly uses this only as a supplementary check alongside `escapeHtml`; ensure it is never used as the sole defence.

---

## 4. CSP and Security Headers (`next.config.ts`)

**Headers correctly set:**
- `X-Frame-Options: DENY` ✓
- `X-Content-Type-Options: nosniff` ✓
- `Referrer-Policy: strict-origin-when-cross-origin` ✓
- `Permissions-Policy` — camera/mic/geolocation/payment disabled ✓
- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` ✓
- `Content-Security-Policy` — comprehensive, covering all major directive categories ✓

**CSP Issues:**

| Issue | Severity | Detail |
|-------|----------|--------|
| `script-src 'unsafe-inline'` | Medium | Nullifies inline-script XSS protection (see Finding 3) |
| `style-src 'unsafe-inline'` | Low | Permits CSS injection; lower risk for most threat models |
| `Cross-Origin-Opener-Policy: unsafe-none` | Low | Required for Clerk OAuth popups; acceptable trade-off but documented |

---

## 5. Prioritised Fix List

| Priority | Severity | Finding | Location |
|----------|----------|---------|----------|
| 1 | High | `npm audit fix` — semver (Critical ReDoS), next DoS, fast-uri, dompurify | `package.json` |
| 2 | Medium | JSON-LD XSS: `</script>` in user content in `<script>` tag | `src/components/seo/JsonLd.tsx:5` |
| 3 | Medium | `'unsafe-inline'` in `script-src` CSP — switch to nonce-based | `next.config.ts:85` |
| 4 | Medium | Non-timing-safe secret comparison in `/api/bot` | `src/app/api/bot/route.ts:39` |
| 5 | Medium | `CRON_SECRET` unset allows `Bearer undefined` bypass | `src/app/api/bot/route.ts:38-40` |
| 6 | Medium | No rate limiting on `/api/setup` and `/api/migrate` | respective route files |
| 7 | Low-Med | Secret in request body on `/api/migrate` (should be Authorization header) | `src/app/api/migrate/route.ts:22` |
| 8 | Low | Discord public key hardcoded (move to env var for rotation ease) | `src/app/api/discord/route.ts:6` |
| 9 | Low | `NEXT_PUBLIC_POSTHOG_HOST` lacks allowlist validation before server-side fetch | `src/app/api/webhooks/posthog/route.ts:23` |
| 10 | Low | Export endpoint rate limit not resilient to Redis cache failure | `src/app/api/user/export/route.ts` |
