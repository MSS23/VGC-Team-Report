# Security Audit — VGC Team Report
**Date:** 2026-05-25  
**Auditor:** Claude Code (Security Engineer role)  
**Scope:** Full codebase at `/home/user/VGC-Team-Report`

---

## 1. npm audit Summary

| Severity | Count |
|----------|-------|
| Critical | 0 |
| High | 2 |
| Moderate | 10 |
| Low | 0 |

### High-Severity Vulnerabilities

1. **js-cookie <= 3.0.5** (GHSA-qjx8-664m-686j, CVSS 7.5)
   - Prototype hijack in `assign()` enables cookie-attribute injection
   - Via: `@clerk/shared` → `js-cookie`
   - Fix available: update `@clerk/shared` to latest

2. **@clerk/shared** (indirect via js-cookie)
   - Affected range: `0.18.0-mytag.691991c` through `4.13.1-canary.v20260522193509`
   - Fix available: `npm update @clerk/shared`

### Notable Moderate

- **postcss < 8.5.10**: XSS via unescaped `</style>` in stringify output (via `next`)
- **brace-expansion 5.0.2–5.0.5**: DoS via large numeric ranges
- **uuid** (via `@cypress/request`, `@sentry/webpack-plugin`): dev dependency, no prod impact

---

## 2. Hardcoded Secrets Scan

### P1 — Hardcoded Discord Application Public Key

**File:** `src/app/api/discord/route.ts:6`
```ts
const DISCORD_PUBLIC_KEY = "44b2cb02932ad5b5eae681352246314ffb23ecd299c2490d7875d5883e5596ae";
```

**Severity: LOW (not a secret)**  
This is the Discord application's **public** key used to verify incoming interaction signatures (Ed25519). It is intentionally public — Discord's documentation instructs developers to use this in request validation. It is NOT a token, API key, or signing secret. It grants no access. **Not a P0.**

### Scan Results

- No `sk-*`, `ghp_*`, `xoxb-*`, `AKIA*`, `whsec_*`, `sk_live_*`, `pk_live_*`, or `AIza*` patterns found in source
- No Discord/Slack webhook URLs hardcoded in source
- No hardcoded passwords, tokens, or API keys
- All secrets properly loaded via `process.env.*`

**Verdict: PASS — No hardcoded secrets found.**

---

## 3. OWASP Top 10 — API Route Review

### 3.1 SQL Injection

**Status: PASS**

All database queries use parameterized tagged template literals via the `postgres` library (`sql\`...\``). Values are bound as parameters, never interpolated.

One instance of string interpolation in a **GraphQL** query (not SQL):
- `src/app/api/cron/daily-ops/route.ts:84` — `teamId` interpolated into Linear GraphQL query string
- **Risk: Low** — `teamId` comes from `process.env.LINEAR_TEAM_ID` (server-controlled), not user input. No injection vector.

### 3.2 XSS

**Status: PASS**

- User input is sanitized with `escapeHtml()` before storage (feedback, comments, profiles)
- Word filter applied to user-generated content
- Responses are JSON (not HTML), so reflected XSS is not applicable
- CSP is comprehensive (see section 5)

### 3.3 SSRF

**Status: PASS**

- `/api/pokepaste` — URL validated with Zod `.url()` + hostname restricted to `pokepast.es` only
- `/api/sprite` — Strict allowlist: only `play.pokemonshowdown.com` host + `/sprites/` path prefix
- PostHog webhook — `sessionId` validated as UUID before use in API call; host is server-controlled env var
- No user-controlled fetch URLs without validation

### 3.4 Authentication / Authorization

**Status: PASS (mostly)**

| Route | Auth | Notes |
|-------|------|-------|
| `/api/share` (POST) | Clerk `auth()` | Required for create + update |
| `/api/feedback` (POST) | Clerk `auth()` | Required |
| `/api/comments` (POST) | `apiGuard` only | No auth required — anonymous commenting allowed by design (session-based) |
| `/api/user/*` | Clerk `auth()` | All user routes require auth |
| `/api/match-log` | Clerk `auth()` | Required |
| `/api/webhooks/clerk` | `verifyWebhook()` signature | Proper |
| `/api/webhooks/linear` | HMAC SHA-256 + `timingSafeEqual` | Proper |
| `/api/webhooks/posthog` | Token + `timingSafeEqual` | Proper |
| `/api/cron/*` | `isCronAuthorized()` with `timingSafeEqual` | Proper |
| `/api/bot` | `CRON_SECRET` bearer + `timingSafeEqual` | Proper |
| `/api/discord` | Ed25519 signature verification | Proper |
| `/api/migrate` | `MIGRATE_SECRET` body comparison | **Finding below** |
| `/api/cleanup` (DELETE) | Bearer token comparison | **Finding below** |

#### Finding: Non-timing-safe comparison in `/api/cleanup` DELETE handler

**File:** `src/app/api/cleanup/route.ts:100`
```ts
if (!CLEANUP_SECRET || authHeader !== `Bearer ${CLEANUP_SECRET}`) {
```

**Severity: LOW** — Uses simple `!==` instead of `timingSafeEqual`. Theoretical timing oracle, but impractical over network. The GET handler correctly uses `isCronAuthorized()` with timing-safe comparison.

#### Finding: Non-timing-safe comparison in `/api/migrate`

**File:** `src/app/api/migrate/route.ts:23`
```ts
if (!secret || secret !== process.env.MIGRATE_SECRET) {
```

**Severity: LOW** — Same pattern. Admin-only endpoint, practical risk is negligible.

### 3.5 Rate Limiting

**Status: PASS**

All public-facing endpoints use `apiGuard()` with `isRateLimitedAsync()` (Upstash-backed distributed rate limiting):
- Explore: 30/min
- Share: 20/min
- Comments read: 60/min, write: 5/min
- Pokepaste: 20/min
- Views: 60/min
- Feedback: 3/min (per userId)
- Match log: 60/min
- Profile: 30/min read, 10/min write

### 3.6 Insecure Direct Object References (IDOR)

**Status: PASS**

- Share updates require valid `editToken` (64-char hex, cryptographically random)
- Match log delete verifies `user_id = ${userId}` (ownership check)
- User routes scoped to authenticated user's own data
- Report visibility changes enforce owner-only check

---

## 4. Input Validation

**Status: PASS**

Zod is used extensively across all API routes:
- `src/app/api/share/route.ts` — `ShareBodySchema`
- `src/app/api/feedback/route.ts` — `FeedbackBody`
- `src/app/api/comments/[shareId]/route.ts` — `CommentBody`
- `src/app/api/pokepaste/route.ts` — `PokePasteCreateSchema`, `PokePasteUrlSchema`
- `src/app/api/match-log/route.ts` — `MatchLogBody`
- `src/app/api/user/profile/route.ts` — `ProfileBody`
- `src/app/api/views/[shareId]/route.ts` — `ViewBody`

Share ID validated with regex (`/^[a-zA-Z0-9_-]{6,16}$/`). UUID validation on delete params.

---

## 5. CORS / CSP / Security Headers

### CORS (`src/lib/security/cors.ts` + `src/middleware.ts`)

**Status: PASS**

- Strict origin allowlist (production domain, Vercel preview deploys)
- Cross-origin API requests from unknown origins blocked at middleware level
- CORS headers only reflect allowed origins
- Webhooks/Discord exempted (server-to-server, no browser origin)

### CSP (`next.config.ts`)

**Status: PASS — Comprehensive**

- `default-src 'self'`
- `script-src` allows: self, inline (needed for Next.js), Clerk, Vercel, Sentry, PostHog, Cloudflare
- `object-src 'none'`
- `frame-ancestors 'none'`
- `upgrade-insecure-requests`
- `form-action` restricted to self + Clerk OAuth

**Note:** `'unsafe-inline'` in `script-src` weakens CSP but is required by Next.js. This is standard.

### Additional Headers

- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` blocks camera, mic, geo, payment, USB, sensors
- `Cross-Origin-Opener-Policy: unsafe-none` (required for Clerk OAuth popups)

### CSRF Protection (`src/middleware.ts` + `src/lib/security/csrf.ts`)

- Double-submit cookie pattern
- Enforced on cross-origin state-changing requests
- Same-origin requests (no Origin header) pass through (safe by CORS)

### Bot Detection (`src/middleware.ts`)

- Known scraper user-agents blocked
- Suspicious request heuristics on API routes
- Cron/webhook routes exempted (authenticated by secrets)

---

## 6. Summary of Findings

| ID | Severity | Finding | Recommendation |
|----|----------|---------|----------------|
| S1 | HIGH | `js-cookie` prototype pollution via `@clerk/shared` | Run `npm update @clerk/shared` or pin `js-cookie >= 3.0.6` |
| S2 | LOW | Non-timing-safe secret comparison in `/api/cleanup` DELETE | Replace `!==` with `timingSafeEqual` (match GET handler pattern) |
| S3 | LOW | Non-timing-safe secret comparison in `/api/migrate` | Replace `!==` with `timingSafeEqual` |
| S4 | INFO | `teamId` interpolated in GraphQL string (daily-ops cron) | Use GraphQL variables for consistency (no exploitability — env-only value) |
| S5 | INFO | `unsafe-inline` in CSP `script-src` | Standard for Next.js; consider nonce-based CSP if feasible in future |

---

## 7. Positive Security Patterns Observed

- Webhook signature verification uses `timingSafeEqual` throughout (Clerk, Linear, PostHog)
- Distributed rate limiting via Upstash (survives Lambda cold starts)
- SSRF mitigated via strict host/path allowlists
- SQL injection impossible via tagged template parameterization
- Proper auth boundaries (owner-only visibility changes, IDOR prevention)
- Deduplication on PostHog webhook prevents ticket flooding
- AbortController timeouts on all external fetches (3-8s)
- Comprehensive CSP with `frame-ancestors 'none'` and `upgrade-insecure-requests`
