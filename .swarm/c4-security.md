# C4 Security Audit — 2026-05-24

**Repo:** `/home/user/VGC-Team-Report`
**Auditor:** C4 (overnight swarm)
**Scope:** npm audit, hardcoded secrets sweep, API route auth/SSRF/SQLi/CSRF/rate-limiting, middleware, security headers.

---

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
