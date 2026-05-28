# Security Audit Report

**Date:** 2026-05-28
**Scope:** Full application security audit of VGC Team Report
**Auditor:** Automated security analysis (Claude)

---

## 1. npm audit Results

**Summary:** 13 vulnerabilities (10 moderate, 3 high, 0 critical)

| Package | Severity | Issue | Fix Available |
|---------|----------|-------|---------------|
| `@clerk/shared` (via `js-cookie`) | **High** | Prototype hijack in `assign()` enables cookie-attribute injection (GHSA-qjx8-664m-686j) | Yes |
| `tmp` | **High** | Path traversal via unsanitized prefix/postfix (GHSA-ph9p-34f9-6g65) | Yes |
| `uuid` | **Moderate** (CVSS 7.5) | Missing buffer bounds check in v3/v5/v6 (GHSA-w5hq-g745-h8pq) | Yes |
| `postcss` (via `next`) | Moderate | XSS via unescaped `</style>` in CSS stringify (GHSA-qx2v-qp2m-jg93) | Blocked by `@sentry/nextjs` |
| `brace-expansion` | Moderate | DoS via large numeric range (GHSA-jxxr-4gwj-5jf2) | Yes |
| `qs` (via `cypress`) | Moderate | DoS via null entries in comma-format arrays (GHSA-q8mj-m7cp-5q26) | Yes |

**Recommendation:** Run `npm audit fix` to resolve the 3 high-severity issues. The `js-cookie` prototype pollution in `@clerk/shared` is the most concerning as it affects authentication infrastructure.

---

## 2. Hardcoded Secrets Scan

**Result: PASS -- No hardcoded secrets found.**

All secrets are loaded from `process.env.*` at runtime. The `.gitignore` correctly excludes `.env*` files (except `.env.example`). The `.env.example` file contains placeholder values only.

The Discord public key in `/src/app/api/discord/route.ts` line 7 is a public verification key (not a secret) -- this is expected and correct per Discord's interaction endpoint specification.

---

## 3. OWASP Top-10 Analysis

### 3.1 SQL Injection -- PASS

All database queries use the Neon `sql` tagged template literal, which automatically parameterizes values. No string interpolation or concatenation in SQL was found. Example from `src/app/api/comments/[shareId]/route.ts`:
```typescript
sql`SELECT ... WHERE share_id = ${shareId} AND id < ${parseInt(cursor, 10)}`
```

### 3.2 XSS (Cross-Site Scripting) -- FINDING (P2: Medium)

**3.2a. Email HTML injection via user-controlled fields**

In `src/lib/email.ts`, the `buildCommentNotificationHtml` function (lines 89-158) directly interpolates user-controlled values into HTML templates without escaping:

```typescript
<strong>${commenterName}</strong> commented on <strong>${reportTitle}</strong>
...
<p ...>${commentBody}</p>
```

While `commenterName` and `commentBody` are HTML-escaped via `escapeHtml()` at the call site in `src/app/api/comments/[shareId]/route.ts` (lines 93-94), `reportTitle` is sourced from the database (`shareData.tournamentName` or `shareData.creatorName`) and is NOT escaped before being passed into the email template (line 132). A malicious report creator could inject HTML/JavaScript into their tournament name that would execute in the email client of any commenter notification recipient.

Similarly, in `buildWelcomeEmailHtml` (line 219):
```typescript
Welcome to VGC Team Report, ${firstName}!
```
The `firstName` comes from Clerk and is generally safe, but defense-in-depth would dictate escaping.

**3.2b. Weekly summary email template**

In `buildWeeklySummaryHtml` (lines 327-502), `item.title`, `item.submitter`, `req.title` and other feedback-sourced values are interpolated directly into HTML without escaping. Feedback titles ARE escaped before database insertion (`src/app/api/feedback/route.ts` line 98), so this is mitigated -- but the template itself should not rely on pre-sanitized data.

**3.2c. `dangerouslySetInnerHTML` usage**

- `src/components/seo/JsonLd.tsx`: Properly escapes `</script>` tags. Acceptable use.
- `src/app/layout.tsx`: Inline theme script. Static content, no user input. Acceptable use.

### 3.3 CSRF Protection -- PASS (with note)

CSRF protection is implemented via double-submit cookie pattern (`src/lib/security/csrf.ts`) enforced in middleware (`src/middleware.ts`). The implementation correctly:
- Only enforces on state-changing methods (POST/PUT/DELETE/PATCH)
- Uses `SameSite=Strict` cookies
- Generates cryptographically random tokens

**Note:** The CSRF check is only enforced for truly cross-origin requests (line 133 in middleware: `isTrueCrossOrigin`). Same-origin requests (including requests from allowed origins like the app itself) skip CSRF validation. This is by design and documented, and is acceptable since CORS already blocks unknown origins.

### 3.4 Authentication/Authorization -- PASS (Good)

- All user-mutating API routes check `auth()` from Clerk
- Share updates require both edit token AND authenticated session (line 91 in `src/app/api/share/route.ts`)
- Visibility changes require owner verification (lines 163-178)
- Collaborator access properly scoped with status check
- Cron routes use `isCronAuthorized()` with timing-safe comparison
- Webhook routes verify signatures (Linear HMAC-SHA256, Clerk SDK verification, Discord Ed25519, PostHog token)

### 3.5 Rate Limiting -- PASS (Good)

Comprehensive rate limiting via Upstash Redis (distributed) with in-memory fallback:
- All public and authenticated API routes have rate limits via `apiGuard()`
- Feedback: 3 per minute per user
- Comments: 5 per minute per IP
- Account delete: 2 per minute
- Read endpoints: 30-60 per minute

### 3.6 Missing Security Headers

The middleware does not set several recommended security headers:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY` (for non-embed pages)
- `Strict-Transport-Security` (HSTS)
- `Content-Security-Policy`

These may be set at the Vercel platform level but are not enforced in application code.

---

## 4. GraphQL Injection -- FINDING (P3: Low)

**Location:** `src/app/api/cron/daily-ops/route.ts` (line 84), `src/app/api/cron/weekly-report/route.ts` (lines 30-32)

These files use string interpolation for `teamId` in GraphQL queries:
```typescript
query: `{ team(id: "${teamId}") { issues(...) } }`
```

While `teamId` comes from `process.env.LINEAR_TEAM_ID` (server-controlled, not user input), this is a bad pattern. If the env var were ever misconfigured with special characters, it could break the query or enable injection.

**Contrast with good practice elsewhere:** `src/lib/linear.ts` and `src/app/api/webhooks/posthog/route.ts` correctly use GraphQL variables:
```typescript
linearQuery(`query($teamId: String!) { team(id: $teamId) { ... } }`, { teamId })
```

**Affected queries (4 total):**
- `src/app/api/cron/daily-ops/route.ts` line 84
- `src/app/api/cron/weekly-report/route.ts` line 30
- `src/app/api/cron/weekly-report/route.ts` line 31
- `src/app/api/cron/weekly-report/route.ts` line 32

**Recommendation:** Refactor these 4 queries to use parameterized GraphQL variables.

---

## 5. Email Template HTML Injection -- FINDING (P2: Medium)

See Section 3.2a above. Summary:

| Template | Field | Escaped? | Risk |
|----------|-------|----------|------|
| `buildCommentNotificationHtml` | `commenterName` | Yes (at call site) | Low |
| `buildCommentNotificationHtml` | `commentBody` | Yes (at call site) | Low |
| `buildCommentNotificationHtml` | `reportTitle` | **NO** | **Medium** |
| `buildCommentNotificationHtml` | `reportUrl` | Constructed from shareId (validated regex) | Low |
| `buildWelcomeEmailHtml` | `firstName` | No (Clerk-sourced) | Low |
| `buildWeeklySummaryHtml` | `item.title` | Pre-escaped at DB insert | Low |
| `buildWeeklySummaryHtml` | `req.title` | Pre-escaped at DB insert | Low |

**Recommendation:** Apply `escapeHtml()` to all user-derived values directly inside email template functions, regardless of whether they were escaped at the call site. Defense-in-depth principle.

---

## 6. Timing-Safe Comparison -- FINDING (P3: Low)

**Routes using timing-safe comparison (GOOD):**
- `src/lib/cron-auth.ts` -- `timingSafeEqual` for `CRON_SECRET`
- `src/app/api/webhooks/linear/route.ts` -- `timingSafeEqual` for HMAC signature
- `src/app/api/webhooks/posthog/route.ts` -- `timingSafeEqual` for webhook secret
- `src/app/api/bot/route.ts` -- `timingSafeEqual` for `CRON_SECRET`

**Routes using plain string comparison (VULNERABLE):**
- `src/app/api/cleanup/route.ts` line 100: `authHeader !== \`Bearer ${CLEANUP_SECRET}\``
- `src/app/api/setup/route.ts` line 7: `authHeader !== \`Bearer ${secret}\``
- `src/app/api/migrate/route.ts` line 23: `secret !== process.env.MIGRATE_SECRET`

These three routes compare secrets using JavaScript's `!==` operator, which is vulnerable to timing side-channel attacks. An attacker could potentially determine the secret value character-by-character by measuring response times.

**Mitigating factors:**
- These are admin-only endpoints (not publicly discoverable)
- `cleanup` and `setup` require specific secrets separate from the main app
- `migrate` requires a POST body with the secret

**Recommendation:** Replace all `!==` secret comparisons with `crypto.timingSafeEqual()`.

---

## 7. CORS Configuration -- PASS (Good)

CORS is properly configured in `src/lib/security/cors.ts`:
- Explicit allowlist of production domains
- Vercel preview deployments allowed via regex
- `localhost` only in development
- `Access-Control-Allow-Credentials: true` properly scoped to allowed origins
- Middleware blocks cross-origin API requests from unknown origins
- Webhook and cron routes exempted (server-to-server, not browser-initiated)

The Vercel preview regex `/^https:\/\/vgc-team-report[a-z0-9-]*\.vercel\.app$/` is appropriately restrictive.

---

## 8. Additional Findings

### 8.1 Bot Detection Blocks Legitimate Development Tools (P4: Info)

`src/lib/security/bot-detection.ts` blocks `curl` and `wget` user-agents. This is intentional for scraper protection but may interfere with legitimate monitoring, health checks, or developer testing.

### 8.2 Edit Token Returned in User Reports Listing (P4: Info)

`src/app/api/user/reports/route.ts` returns `editToken` in the response payload for authenticated users' own reports. This is needed for the client to enable editing, and is properly gated behind Clerk authentication. Not a vulnerability but worth noting that the token is transmitted over the wire.

### 8.3 In-Memory Dedup in PostHog Webhook (P4: Info)

The dedup map in `src/app/api/webhooks/posthog/route.ts` is per-Lambda-instance. Cold starts reset it. This is acknowledged in comments and is best-effort by design.

### 8.4 Missing `shareId` Validation on Views Endpoint (P3: Low)

`src/app/api/views/[shareId]/route.ts` does not validate the format of `shareId` before using it in a database query (unlike comments and reactions routes which check `SHARE_ID_RE`). The parameterized SQL prevents injection, but invalid IDs could waste DB queries.

---

## Summary of Findings by Priority

| Priority | Count | Findings |
|----------|-------|----------|
| P0 (Critical) | 0 | -- |
| P1 (High) | 0 | -- |
| P2 (Medium) | 2 | Email HTML injection (reportTitle), npm high-severity deps |
| P3 (Low) | 3 | GraphQL string interpolation, timing-unsafe secret comparison (3 routes), missing shareId validation |
| P4 (Info) | 3 | Bot detection scope, edit token in response, dedup scope |

---

## Recommended Actions

1. **[P2] Fix email template injection** -- Apply `escapeHtml()` to `reportTitle` in `buildCommentNotificationHtml` and all user-derived template values.
2. **[P2] Run `npm audit fix`** -- Resolve `js-cookie` prototype pollution and `tmp` path traversal.
3. **[P3] Use timing-safe comparison** in `cleanup/route.ts`, `setup/route.ts`, and `migrate/route.ts`.
4. **[P3] Parameterize GraphQL queries** in `daily-ops/route.ts` and `weekly-report/route.ts`.
5. **[P3] Add shareId validation** to the views endpoint.
6. **Consider adding security headers** (`X-Content-Type-Options`, `X-Frame-Options`, CSP) in middleware or `next.config`.
