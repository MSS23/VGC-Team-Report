# C4: Security Audit — Run 2026-06-10

## Positive Findings — Well-Implemented

- No hardcoded secrets detected (all sensitive env vars use `process.env`)
- All three webhook handlers (Clerk, Linear, PostHog) properly verify signatures using timing-safe comparison
- SQL injection prevention: parameterized queries throughout; no string interpolation in sql`` templates
- XSS protection: dangerouslySetInnerHTML properly escapes user input (JsonLd.tsx)
- SSRF protection: sprite proxy validates host and path allowlist
- PostHog HogQL injection prevented: uses parameterized `values` binding
- Rate limiting via apiGuard on most sensitive POST/PUT/DELETE routes
- Auth checks comprehensive: Clerk auth() on user-scoped routes, isCronAuthorized() on cron routes

## Critical Findings

### 1. PostHog error message leakage (HIGH)
**File:** `src/app/api/cron/posthog-errors/route.ts:307`
**Issue:** Error messages from PostHog API failures returned directly in 500 responses.
**Fix:** Return generic error to client; log full error server-side only.

### 2. Collaborators PATCH missing rate limiting (HIGH)
**File:** `src/app/api/share/[id]/collaborators/route.ts:155-181 (PATCH)`
**Issue:** PATCH endpoint that regenerates edit tokens lacks rate limiting.
**Fix:** Add `apiGuard` call with `{ rateLimit: { key: "collab-revoke", max: 5 } }`.

### 3. npm: js-cookie ≤3.0.5 (HIGH)
**Package:** js-cookie via @clerk/shared
**Issue:** Per-instance prototype hijack in assign() — cookie-attribute injection (CVSS 7.5).
**Fix:** Upgrade @clerk/shared.

### 4. npm: tmp <0.2.6 (HIGH)
**Package:** tmp
**Issue:** Path traversal (CWE-22).
**Fix:** Upgrade tmp to ≥0.2.6.

### 5. @clerk/shared transitive js-cookie (HIGH)
Cascades from upstream — patched by upgrading @clerk/shared.

## Conflict-Risk Check
None of the top 5 are in `.swarm/main-changed-files.md`.
