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
# C4 Security Audit — 2026-05-24

**Repo:** `/home/user/VGC-Team-Report`
**Auditor:** C4 (overnight swarm)
**Scope:** npm audit, hardcoded secrets sweep, API route auth/SSRF/SQLi/CSRF/rate-limiting, middleware, security headers.

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

### MODERATE highlights:
- `postcss < 8.5.10` -- XSS via unescaped `</style>` in CSS stringify output (Next.js transitive)
- `brace-expansion 5.0.2-5.0.5` -- DoS via large numeric ranges
- `uuid` (via `@cypress/request`, `@sentry/webpack-plugin`) -- various issues

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

### 3.4 Rate Limiting -- PASS (with note)

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
## Hardcoded-Secret Findings — None (P0 clean)

No webhook secrets, API keys, bearer tokens, AWS keys, or private keys are committed in `src/` or config files. All sensitive material is read from `process.env`. The one literal that looks like a secret is the **Discord Ed25519 public key** in `src/app/api/discord/route.ts:6` — that is correctly a public value (used by `nacl.sign.detached.verify` to verify Discord-signed interactions), and is the value Discord publishes for the application. Not a finding.

Searched patterns: `LINEAR_WEBHOOK_*_SECRET` literals, `lin_api*`, `sk_live`, `sk_test`, `AKIA*`, `ghp_/gho_/ghs_/github_pat_`, `xoxb-`, `BEGIN RSA/PRIVATE KEY`, `password = "…"`, `secret = "…"`, `Bearer <literal>`. All hits resolved to `process.env.*` references.

---

## Top 5 Findings (ordered by severity)

### 1. `src/app/api/migrate/route.ts:23` — MIGRATE_SECRET compared with `!==` (timing side-channel) — **MEDIUM**
The migrate POST handler uses `secret !== process.env.MIGRATE_SECRET`. A naive string `!==` short-circuits character-by-character, leaking the secret one byte at a time over many requests. The route triggers a full table rewrite (`UPDATE shares`) — high blast radius if guessed.
**Fix:** Use the same `timingSafeEqual(Buffer.from(...), Buffer.from(...))` pattern already in `src/lib/cron-auth.ts`. While there, also accept the secret via `Authorization: Bearer` header instead of in the JSON body so it doesn't end up in request-body logs.

### 2. `src/app/api/setup/route.ts:7` and `src/app/api/cleanup/route.ts:100` — `!==` bearer comparison — **MEDIUM**
Same class of issue: `authHeader !== \`Bearer ${secret}\`` is non-constant-time. Both routes are destructive (table init / mass delete).
**Fix:** Replace both with `isCronAuthorized(request)` or an inline `timingSafeEqual` call.

### 3. `src/app/api/bot/route.ts:64-66` — tangled custom timing-safe compare — **LOW (defence-in-depth)**
Pads to equal length before `timingSafeEqual` then trails a `|| authHeader.length !== expected.length` check. Functionally safe (the pads prevent the throw path; the length check rejects matching-prefix attacks), but unnecessarily clever. **Fix:** rewrite using the simple pattern in `src/lib/cron-auth.ts` (length check first, then `timingSafeEqual`).

### 4. `src/app/api/comments/flag/route.ts:14` — client-supplied `sessionId` lets attackers brigade-hide comments — **LOW**
The flag endpoint dedups on `(comment_id, session_id)` where `session_id` is taken from the request body. 3 unique flags auto-deletes a comment. An attacker rotating sessionIds (rate limited 10/min per IP, but trivially distributable) can hide any comment.
**Fix:** derive the flagger identity server-side — hash `(ip + UA + day)` or require Clerk auth for flagging.

### 5. `src/app/api/views/[shareId]/route.ts:18` — missing `shareId` format validation — **LOW**
Unlike `comments/[shareId]` (which checks `SHARE_ID_RE`), the `views`, `reactions`, `changelog`, and `team-graphic` routes pass the raw `shareId` straight into SQL params and Upstash keys (`view:${shareId}:…`). SQL is safe (parameterised), but a 10 KB shareId would burn Upstash storage and request size, and yields 200 OKs on garbage input.
**Fix:** add `if (!/^[A-Za-z0-9_-]{6,16}$/.test(shareId)) return 400` at the top of all four routes.

---

## npm audit summary

| severity | count |
|----------|-------|
| critical | 0 |
| **high** | **2** |
| moderate | 10 |
| low | 0 |
| **total** | **12** |

High-severity advisories:
- **`@clerk/shared`** (transitive via Clerk) — pulled in by an older Clerk version; upgrading the top-level Clerk SDK clears it.
- **`js-cookie`** — GHSA covering "per-instance prototype hijack in `assign()` enables cookie-attribute injection". `fixAvailable: true` per the audit JSON.

Moderate cluster includes `qs` (DoS via null/undefined in `qs.stringify` comma-format) and `uuid <11.1.1` (buffer bounds check). Both ship via `@cypress/request` (dev-only) and `@sentry/webpack-plugin` — not exposed in the production runtime path.

**Action:** `npm audit fix` clears the moderates without major bumps. The two highs need `npm i @clerk/nextjs@latest` (verify Clerk middleware still works — review `src/middleware.ts:42`).

---

## What's already good (don't regress)

- **CSP** in `next.config.ts:81-113` is comprehensive: explicit `default-src 'self'`, `object-src 'none'`, `frame-ancestors 'none'`, `base-uri 'self'`, `upgrade-insecure-requests`. Only weak spot is `script-src 'unsafe-inline'` (required by Clerk + the theme-bootstrap inline script in `src/app/layout.tsx:102`).
- **HSTS** at 2-year preload, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Permissions-Policy` locking down sensors — all set.
- **Cron auth** (`src/lib/cron-auth.ts`) uses `timingSafeEqual` correctly. All cron routes and `keep-alive`/`cleanup GET` route through it.
- **SSRF closed**: `sprite/route.ts:40-45` enforces host *and* path allowlist (Showdown only); `pokepaste/route.ts:12-21` requires hostname === `pokepast.es` via Zod refine. No reflective fetch of user-controlled URLs elsewhere.
- **SQLi closed**: every `getDb()` call uses tagged-template parameter binding (Neon serverless driver). No `sql.unsafe` / `sql.raw` / string-concat queries found.
- **Webhook signature verification**: Discord uses Ed25519 via `tweetnacl` (`src/app/api/discord/route.ts:45`), Linear uses HMAC-SHA256 + `timingSafeEqual` (`src/app/api/webhooks/linear/route.ts:20-30`), Clerk uses `@clerk/nextjs/webhooks` `verifyWebhook` (`src/app/api/webhooks/clerk/route.ts:38`).
- **Middleware** (`src/middleware.ts`) enforces CORS allowlist, CSRF double-submit for true-cross-origin state-changing requests, bot/suspicious-UA blocking, and canonical-host redirect — layered defence is in place.
- **JsonLd** (`src/components/seo/JsonLd.tsx:5`) escapes `</script>` before `dangerouslySetInnerHTML` to neutralise the obvious break-out vector.
- **Feedback / comments** apply `escapeHtml` to user strings before persisting, and `containsBlockedWords` runs against raw content.

---

## Systemic Recommendations

1. **Centralise bearer-token auth.** Three routes (`migrate`, `setup`, `cleanup DELETE`) re-implement bearer-token comparison with `!==`. Promote `isCronAuthorized` to a generic `verifyBearer(request, envVarName)` helper and switch all four privileged routes to it. Removes a recurring timing-side-channel bug class.
2. **Adopt a shared `shareId` validator.** Half the `[shareId]` routes validate format, half don't. Add `assertValidShareId(shareId)` (regex `/^[A-Za-z0-9_-]{6,16}$/`, throws → 400) and apply uniformly in `views`, `reactions`, `changelog`, `team-graphic`. Closes the cache-bloat and 404-storm vectors.
3. **Quarterly dependency hygiene.** With 2 high + 10 moderate advisories pending, schedule `/security-audit` as a Friday cron (it already exists per `CLAUDE.md` slash commands). Lift Sentry + Cypress + Clerk minor versions in one batched push so it's one Vercel build, not many.
