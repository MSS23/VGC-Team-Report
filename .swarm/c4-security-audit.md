# Security Audit -- OWASP Top 10 (2026-05-27)

**Auditor:** Claude Code (Security Agent)
**Scope:** All 50 API routes in `src/app/api/`, webhook handlers, security utilities, npm dependencies

## P0 -- Critical

**No P0 findings.** No hardcoded secrets in source. All three webhook handlers (Clerk, Linear, PostHog) verify signatures correctly using timing-safe comparison. No SQL injection anywhere -- the codebase uses parameterized tagged-template queries throughout.

## P1 -- High

### 1. GraphQL Injection in daily-ops cron (A03: Injection)
**File:** `src/app/api/cron/daily-ops/route.ts:84`
`teamId` is string-interpolated into a GraphQL query literal: `` `{ team(id: "${teamId}") { ... } }` ``. The value comes from `process.env.LINEAR_TEAM_ID` (not user input), but other GraphQL calls in the same file correctly use `$variables`. Violates defense-in-depth. **Fix:** use parameterized variables.

### 2. js-cookie prototype pollution via @clerk/shared (A06: Vulnerable Components)
`@clerk/shared` depends on `js-cookie <=3.0.5` (GHSA-qjx8-664m-686j, CVSS 7.5). Enables cookie-attribute injection via prototype hijack. Fix available via `@clerk/shared` upgrade.

### 3. Error detail leak in /api/setup (A05: Security Misconfiguration)
**File:** `src/app/api/setup/route.ts:20` -- returns `String(e)` in error response, potentially leaking DB connection strings or internal paths to an authenticated caller.

## P2 -- Medium

### 4. Unauthenticated comment deletion via flag abuse (A01: Broken Access Control)
**File:** `src/app/api/comments/flag/route.ts` -- No auth required, deduplication by client-provided `sessionId` only. Three flags auto-delete any comment. Attacker forges 3 session IDs to delete arbitrary comments. **Fix:** require Clerk auth or IP-based dedup.

### 5. Body-size check bypassable via chunked encoding (A04: Insecure Design)
**File:** `src/lib/security/api-guard.ts:53` -- Checks `Content-Length` header only. A malicious client can omit it while sending a large chunked body. **Fix:** also verify actual body size after reading.

### 6. View count inflation (A01: Broken Access Control)
**File:** `src/app/api/views/[shareId]/route.ts` -- Dedup key is client-provided `sessionId`, not IP or auth. Rotating session IDs trivially inflates view counts.

### 7. 12 npm vulnerabilities (10 moderate, 2 high) (A06: Vulnerable Components)
PostCSS XSS (GHSA-qx2v-qp2m-jg93), brace-expansion ReDoS, uuid/qs issues in Cypress. Most fixable; the `next`/`postcss` chain has no fix available yet.

### 8. Rate limiting keyed on IP, not userId (A07: Identification Failures)
Authenticated routes key rate limits on `x-forwarded-for` IP. Behind shared NAT or CDN, legitimate users share a bucket. Mutation routes should key on `userId`.

## Positive Findings

- **SQL injection: NONE.** All queries use parameterized `sql` tagged templates.
- **XSS: Well-controlled.** `dangerouslySetInnerHTML` used safely (JsonLd escapes `</script>`, layout script is static). User content sanitized via `escapeHtml()` + Zod.
- **Webhook verification: Excellent.** All three handlers use timing-safe comparison.
- **Auth coverage: Strong.** All mutation routes require Clerk auth. Cron routes use `isCronAuthorized`.
- **CSRF: Mitigated.** JSON-only API routes + SameSite cookies via Clerk.
- **Secrets: Properly managed.** `.env*` gitignored, no secrets in source.
- **Input validation: Comprehensive.** Zod schemas on all POST bodies, regex on IDs, word filter on UGC.
