# Security Audit Report -- VGC Team Report

**Date:** 2026-05-26
**Auditor:** Claude Code (Opus 4.7, Security Engineer)
**Scope:** `src/`, `.env.example`, API routes, webhook handlers, email templates
**Previous audit:** 2026-05-09 (this supersedes it)

---

## Executive Summary

No **critical** issues found. No hardcoded secrets in source, no SQL injection, all webhook endpoints verify signatures using timing-safe comparisons. The codebase demonstrates strong security hygiene: Zod schemas validate input, SQL uses parameterized queries via `postgres` tagged templates, CORS + CSRF protections are applied in middleware, and rate limiting is distributed via Upstash Redis.

Two **high-severity** findings (email HTML injection) and two **medium** findings are detailed below.

---

## 1. Dependency Vulnerabilities (`npm audit`)

| Severity | Count |
|----------|-------|
| Critical | 0     |
| High     | 2     |
| Moderate | 10    |
| Low      | 0     |

### HIGH: `js-cookie <= 3.0.5` (GHSA-qjx8-664m-686j)
- **Impact:** Prototype hijack in `assign()` enables cookie-attribute injection.
- **Path:** `@clerk/shared` -> `js-cookie`
- **Fix:** `npm audit fix` or update `@clerk/shared` when a patched version ships.

### HIGH: `@clerk/shared` (via js-cookie above)
- **Impact:** Same vulnerability surface via transitive dependency.

### MODERATE highlights:
- `postcss < 8.5.10` -- XSS via unescaped `</style>` in CSS stringify output (Next.js transitive)
- `brace-expansion 5.0.2-5.0.5` -- DoS via large numeric ranges
- `uuid` (via `@cypress/request`, `@sentry/webpack-plugin`) -- various issues

**Note vs. previous audit:** The previous CRITICAL Clerk middleware bypass CVEs (GHSA-vqx2-fgx2-5wq9, GHSA-w24r-5266-9c3c) and protobufjs ACE (GHSA-xq3m-2v4x-88gg) are no longer flagged, indicating those packages were updated. The axios CVEs (HIGH-1 in previous audit) are also resolved.

---

## 2. Hardcoded Secrets Scan

### PASS -- No hardcoded API keys or tokens found in `src/`

Searched for patterns: `sk-*`, `ghp_*`, `whsec_*`, `lin_api_*`, `xoxb-*`, `xoxp-*`, inline string assignments to `secret`/`token`/`api_key` variables. **No real credentials detected.**

### INFO: Hardcoded Discord public key (not a secret)
- **File:** `src/app/api/discord/route.ts:6`
- `DISCORD_PUBLIC_KEY = "44b2cb..."`
- **Assessment:** This is a **public** verification key, not a secret. Standard Discord practice. No action needed, but moving to an env var would be cleaner for key rotation.

### PASS -- `.env.example` contains only placeholder values
- All values are `your-*-here`, `xxxx/xxxx`, or `lin_api_xxxx...` placeholders.
- No real credentials leaked.

---

## 3. OWASP Top-10 Analysis -- API Routes

### 3.1 SQL Injection -- PASS

All database queries use the `postgres` tagged template literal (`sql\`...\``) which auto-parameterizes. No raw string concatenation into SQL was found anywhere in the codebase. The PostHog webhook handler uses parameterized HogQL `values` for session timeline queries.

### 3.2 XSS -- TWO FINDINGS

#### FINDING H-1 (HIGH): Email HTML injection via unescaped `reportTitle` in comment notification emails

- **File:** `src/lib/email.ts:130-135` **(recently changed file)**
- **File:** `src/app/api/comments/[shareId]/route.ts:132`

The `commenterName` and `commentBody` are HTML-escaped via `escapeHtml()` before being passed to `sendCommentNotificationEmail()`. However, `reportTitle` is read directly from the database (`shareData.tournamentName || shareData.creatorName`) and is **NOT escaped** before being interpolated into the HTML email template:

```typescript
// comments/route.ts:132 -- value comes directly from DB, no escaping
const reportTitle = (shareData.tournamentName as string) || ...;

// email.ts:130 -- injected directly into HTML
<strong>${commenterName}</strong> commented on <strong>${reportTitle}</strong>

// email.ts:78 -- also in subject line
subject: `New comment on "${opts.reportTitle}"`,
```

**Attack vector:** A user sets their `tournamentName` to `<img src=x onerror=alert(1)>` or a tracking pixel URL. When someone comments on their report, the owner receives an email with executable HTML. Most modern email clients block scripts, but image-based tracking and CSS-based data exfiltration remain viable.

**Recommendation:** Escape `reportTitle` before passing to the email builder:
```typescript
const reportTitle = escapeHtml(
  (shareData.tournamentName as string) || (shareData.creatorName as string) || "your report"
);
```

#### FINDING H-2 (HIGH): Email HTML injection in weekly summary email -- `item.title` and `req.title`

- **File:** `src/lib/email.ts:339,346`
- **File:** `src/app/api/bot/route.ts:154`

The `buildWeeklySummaryHtml()` function interpolates `item.title` and `req.title` directly into HTML without escaping. These values come from the `feedback` table. While feedback titles ARE escaped before database insertion (`escapeHtml(rawTitle)` in the feedback route), the email template relies solely on write-time sanitization. If any other code path (migration, direct DB edit, admin tool) writes unescaped titles, the email template is vulnerable.

**Recommendation:** Apply `escapeHtml()` at render-time inside `buildWeeklySummaryHtml()` as defense-in-depth.

### 3.3 CSRF -- PASS

Strong CSRF protection is implemented:
- CORS origin validation in middleware blocks unknown origins
- Double-submit cookie pattern via `X-CSRF-Token` header
- CSRF enforcement for cross-origin mutating requests
- `SameSite=Strict` on CSRF cookie

### 3.4 Rate Limiting -- PASS (with note)

Rate limiting is applied broadly:
- Upstash Redis distributed rate limiter with in-memory fallback
- `apiGuard()` utility applied to most routes
- Feedback route: 3 req/min per user
- Comments: 5 req/min per IP
- Share reads: 60 req/min per IP
- Share writes: 20 req/min per IP

**Note:** The `/api/migrate` and `/api/setup` routes do NOT have rate limiting. Both are protected by secret tokens, so this is acceptable but could allow brute-force attacks against the secret (see M-1).

### 3.5 Authentication Bypass -- PASS

- All user-mutating routes require Clerk authentication
- Share writes require auth (edit token alone is insufficient -- anonymous sessions cannot mutate)
- Cron routes check `CRON_SECRET` via `isCronAuthorized()` with timing-safe comparison
- Webhook routes verify signatures (Clerk via SDK, Linear via HMAC-SHA256, PostHog via token)
- `/api/bot` uses timing-safe comparison for Bearer token

### 3.6 Mass Assignment -- PASS

The share POST route uses a strict Zod schema (`ShareBodySchema`) with `.strip()` which removes unknown fields. Feedback uses `FeedbackBody` schema. Comments use `CommentBody` schema. No mass assignment vulnerabilities found.

### 3.7 Timing-Safe Comparison -- FINDING M-1 (MEDIUM)

- **File:** `src/app/api/migrate/route.ts:23`
- **File:** `src/app/api/setup/route.ts:7`

Both routes compare secrets using `===` (JavaScript string equality) instead of `timingSafeEqual`:

```typescript
// migrate/route.ts:23
if (!secret || secret !== process.env.MIGRATE_SECRET) {

// setup/route.ts:7
if (!secret || authHeader !== `Bearer ${secret}`) {
```

This is a timing side-channel vulnerability. An attacker can measure response times to incrementally guess the secret byte-by-byte. Other routes (cron, bot, webhooks) correctly use `timingSafeEqual`.

**Recommendation:** Use `timingSafeEqual` from `crypto` module, consistent with `cron-auth.ts` and `bot/route.ts`.

---

## 4. Webhook Security

### 4.1 Clerk Webhook (`/api/webhooks/clerk`) -- PASS
- Uses `@clerk/nextjs/webhooks` `verifyWebhook()` for signature verification
- Fails closed when `CLERK_WEBHOOK_SIGNING_SECRET` is not set
- Proper error handling

### 4.2 Linear Webhook (`/api/webhooks/linear`) -- PASS
- HMAC-SHA256 signature verification using `createHmac` + `timingSafeEqual`
- Compares buffer lengths before `timingSafeEqual` (correct)
- Fails closed when `LINEAR_WEBHOOK_SIGNING_SECRET` is missing

**Note vs. previous audit:** The previous HIGH-4 finding (Linear webhook had no signature verification) is now fully resolved. HMAC-SHA256 verification with timing-safe comparison has been implemented.

### 4.3 PostHog Webhook (`/api/webhooks/posthog`) -- PASS
- Token-based auth via `x-posthog-token` header
- Uses `timingSafeEqual` for comparison
- Deduplication window prevents ticket flooding
- HogQL queries use parameterized `values` (not string interpolation)
- 5-second timeout on outbound requests to Linear and PostHog APIs
- Fails closed when `POSTHOG_WEBHOOK_SECRET` is not set

---

## 5. Recently-Changed Files Assessment

### `src/app/api/cron/weekly-digest/route.ts` (recently changed)
- **Auth:** Uses `isCronAuthorized()` -- PASS
- **SQL:** All queries parameterized -- PASS
- **Email:** Uses `escapeHtml()` for `firstName` and trending report titles -- PASS
- **Privacy:** Respects `digestUnsubscribed` user preference -- PASS
- **Scale:** Caps at 500 users (`MAX_USERS`), batches Clerk API calls (100/batch) and email sends (15/batch) -- PASS
- **No issues found in this file.**

### `src/app/api/newsletter/route.ts` (recently changed)
- **File does not exist.** No findings.

### `src/lib/email.ts` (recently changed)
- **H-1 finding:** `buildCommentNotificationHtml()` does not escape `commenterName`, `commentBody`, or `reportTitle` parameters internally. The caller (`comments/route.ts`) escapes `commenterName` and `commentBody` but NOT `reportTitle`. See finding H-1 above.
- **H-2 finding:** `buildWeeklySummaryHtml()` does not escape `item.title` or `req.title`. See finding H-2 above.
- **LOW finding:** `buildWelcomeEmailHtml()` interpolates `firstName` without escaping. The `firstName` comes from Clerk (user-provided at signup), so this is a minor XSS vector in email. Severity: LOW (email clients strip scripts, but tracking pixels remain possible).
- **Positive:** `buildDigestEmailHtml()` and `buildTrendingDigestHtml()` correctly escape `firstName` via `escapeHtml()`.

---

## 6. Summary of Findings

| ID   | Severity | Category        | File(s) | Description |
|------|----------|-----------------|---------|-------------|
| H-1  | HIGH     | XSS (Email)     | `src/lib/email.ts:130-135`, `src/app/api/comments/[shareId]/route.ts:132` | `reportTitle` not HTML-escaped in comment notification email |
| H-2  | HIGH     | XSS (Email)     | `src/lib/email.ts:339,346`, `src/app/api/bot/route.ts:154` | `item.title`/`req.title` not escaped in weekly summary email |
| M-1  | MEDIUM   | Timing Attack   | `src/app/api/migrate/route.ts:23`, `src/app/api/setup/route.ts:7` | Secret comparison uses `===` instead of `timingSafeEqual` |
| M-2  | MEDIUM   | Dependencies    | `package.json` | 2 high-severity npm vulnerabilities (js-cookie prototype hijack via @clerk/shared) |
| L-1  | LOW      | XSS (Email)     | `src/lib/email.ts:219` | `firstName` not escaped in welcome email HTML |
| I-1  | INFO     | Best Practice   | `src/app/api/discord/route.ts:6` | Discord public key hardcoded (not a secret, but env var is cleaner) |
| I-2  | INFO     | Rate Limiting   | `src/app/api/migrate/route.ts`, `src/app/api/setup/route.ts` | No rate limiting on secret-protected admin routes |

---

## 7. Resolved Findings (from previous audit 2026-05-09)

| Previous ID | Status | Notes |
|-------------|--------|-------|
| CRITICAL-1 (Clerk middleware bypass) | RESOLVED | Clerk packages updated |
| CRITICAL-2 (Clerk auth bypass) | RESOLVED | Clerk packages updated |
| CRITICAL-3 (protobufjs ACE) | RESOLVED | Dependency updated |
| HIGH-1 (axios CVEs) | RESOLVED | axios updated or removed |
| HIGH-3 (bot secret in query param) | RESOLVED | Now uses `Authorization: Bearer` header with timing-safe comparison |
| HIGH-4 (Linear webhook no sig verification) | RESOLVED | HMAC-SHA256 + timingSafeEqual implemented |
| HIGH-5 (vite path traversal) | RESOLVED | No longer flagged by npm audit |

---

## 8. Positive Security Observations

The codebase demonstrates above-average security practices:

1. **Parameterized SQL everywhere** -- no raw string concatenation in queries
2. **Zod schema validation** with `.strip()` on all user-facing POST bodies to prevent mass assignment
3. **Timing-safe comparisons** on all high-traffic auth paths (cron, webhooks, bot)
4. **CORS + CSRF** double protection in middleware
5. **Bot detection** in middleware for non-cron API routes
6. **Input sanitization** (`escapeHtml`, `containsBlockedWords`) on user-generated content
7. **Rate limiting** with distributed Redis (Upstash) + in-memory fallback
8. **Auth-gated mutations** -- edit token alone cannot mutate; Clerk session required
9. **Webhook signature verification** on all three webhook endpoints (Clerk SDK, Linear HMAC, PostHog token)
10. **Body size limits** on share POST (512KB max)
11. **Canonical redirect** prevents staging URL leakage
12. **Session UUID validation** before use in PostHog HogQL queries

---

## 9. Prioritized Action List

| Priority | Finding | Action |
|----------|---------|--------|
| P0 | H-1 | Escape `reportTitle` with `escapeHtml()` in `comments/[shareId]/route.ts:132` before passing to email builder |
| P0 | H-2 | Add `escapeHtml()` at render-time in `buildWeeklySummaryHtml()` for `item.title` and `req.title` |
| P1 | M-1 | Replace `===` with `timingSafeEqual` in `migrate/route.ts` and `setup/route.ts` |
| P1 | M-2 | Monitor `@clerk/shared` for js-cookie fix; run `npm audit fix` when available |
| P2 | L-1 | Escape `firstName` in `buildWelcomeEmailHtml()` (already done in `buildDigestEmailHtml`) |
| P3 | I-1 | Move Discord public key to env var for operational flexibility |
