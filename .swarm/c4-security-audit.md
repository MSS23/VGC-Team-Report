# VGC Team Report - Security Audit

**Date:** May 10, 2026  
**Scope:** Full codebase security review  
**Focus Areas:** API routes, authentication, data validation, injection risks, secret handling

---

## Executive Summary

The application demonstrates a **solid security foundation** with Clerk-based authentication, Zod input validation, parameterized SQL queries (via `postgres.js`), and comprehensive Content Security Policy. However, several **medium-to-high severity issues** were identified, primarily:

1. **HogQL Query Injection** (Medium) — String interpolation in PostHog queries
2. **CSP Allows `unsafe-eval`** (Medium) — Too permissive script policy
3. **Missing Timeout on External Fetches** (Medium) — Potential DoS/hang vectors
4. **Linear GraphQL Query Injection Risk** (Low) — Hardcoded `teamId` in query strings
5. **Error Information Leakage** (Low) — Stack traces in 500 responses

---

## Detailed Findings

### CRITICAL ISSUES
None identified at this time.

---

### HIGH SEVERITY ISSUES
None identified at this time.

---

### MEDIUM SEVERITY ISSUES

#### 1. HogQL Query Injection in PostHog Webhook Handler
**File:** `/home/user/VGC-Team-Report/src/app/api/webhooks/posthog/route.ts`  
**Lines:** 33-34  
**Severity:** MEDIUM  
**Type:** Query Injection

**Issue:**
```typescript
const query = `
  SELECT event, timestamp, properties
  FROM events
  WHERE properties.$session_id = '${sessionId.replace(/'/g, "")}'
    AND timestamp <= '${beforeTimestamp.replace(/'/g, "")}'
  ORDER BY timestamp DESC
  LIMIT 15
`;
```

While the code attempts to sanitize by stripping single quotes (`replace(/'/g, "")`), this is **insufficient protection** against HogQL injection. An attacker who controls `sessionId` or `beforeTimestamp` (from PostHog webhook payload) could:
- Break the query logic with comment injection (`--`, `//`)
- Inject operators or functions
- Bypass the timestamp filter

**Recommended Fix:**
Use PostHog's official SDK with parameterized query support, or switch to GraphQL queries with variables:

```typescript
// Use variables instead of string interpolation
const res = await fetch(`${host}/api/projects/${projectId}/query/`, {
  method: "POST",
  headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
  body: JSON.stringify({
    query: { 
      kind: "HogQLQuery", 
      query: "SELECT event, timestamp, properties FROM events WHERE properties.$session_id = {sessionId} AND timestamp <= {timestamp} ORDER BY timestamp DESC LIMIT 15",
      values: { sessionId, timestamp: beforeTimestamp }
    }
  }),
});
```

---

#### 2. CSP Header Allows `unsafe-eval` and `unsafe-inline`
**File:** `/home/user/VGC-Team-Report/next.config.ts`  
**Line:** 81  
**Severity:** MEDIUM  
**Type:** Content Security Policy Weakness

**Issue:**
```
script-src 'self' 'unsafe-inline' 'unsafe-eval' 
  https://*.clerk.accounts.dev https://*.clerk.com ...
```

**Problem:**
- `'unsafe-eval'` allows `eval()`, `Function()`, `setTimeout(code, delay)` — undermines CSP's primary defense against XSS
- `'unsafe-inline'` weakens inline script protection
- While Clerk integration legitimately requires these for OAuth, the policy is unnecessarily broad

**Impact:**
An XSS vulnerability would have higher impact under this permissive CSP. The code itself doesn't use `eval()` or `new Function()`, but the CSP permits it.

**Recommended Fix:**
```typescript
// In next.config.ts
"script-src 'self' 'unsafe-inline' https://*.clerk.accounts.dev https://*.clerk.com https://clerk.pokemonvgcteamreport.com https://va.vercel-scripts.com https://vercel.live https://*.vercel.live https://*.sentry.io https://challenges.cloudflare.com https://eu-assets.i.posthog.com",
```

- Remove `'unsafe-eval'` (not needed for Clerk OAuth)
- Document why `'unsafe-inline'` is required (Clerk SDK) and plan migration

---

#### 3. Missing Timeouts on External Fetch Calls
**Files:**
- `/home/user/VGC-Team-Report/src/app/api/webhooks/posthog/route.ts` (line 201)
- `/home/user/VGC-Team-Report/src/app/api/pokepaste/route.ts` (lines 57-59)
- `/home/user/VGC-Team-Report/src/app/api/discord/route.ts` (line 23)
- `/home/user/VGC-Team-Report/src/app/api/cron/daily-ops/route.ts` (multiple)

**Severity:** MEDIUM  
**Type:** Denial of Service / Resource Exhaustion

**Issue:**
Multiple `fetch()` calls to external APIs (PostHog, PokéPaste, Linear, Discord) **lack timeout configuration**. If an external service hangs, the serverless function will block indefinitely, consuming resource slots.

**Example from pokepaste:**
```typescript
const [rawRes, htmlRes] = await Promise.all([
  fetch(rawUrl, { headers: { "User-Agent": "VGC-Team-Report/1.0" } }),
  fetch(htmlUrl, { headers: { "User-Agent": "VGC-Team-Report/1.0" } }),
]);
// No timeout — could hang forever
```

**Recommended Fix:**
```typescript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

try {
  const res = await fetch(url, { 
    signal: controller.signal,
    headers: { "User-Agent": "..." }
  });
  clearTimeout(timeoutId);
  // ... handle response
} catch (e) {
  if (e.name === 'AbortError') {
    return NextResponse.json({ error: "External service timeout" }, { status: 504 });
  }
  throw e;
}
```

---

### LOW SEVERITY ISSUES

#### 4. Linear GraphQL Query Hardcodes `teamId` in Query String
**File:** `/home/user/VGC-Team-Report/src/app/api/cron/daily-ops/route.ts`  
**Line:** 79  
**Severity:** LOW  
**Type:** GraphQL Injection

**Issue:**
```typescript
body: JSON.stringify({
  query: `{ team(id: "${teamId}") { issues(...) } }`,
})
```

While `teamId` comes from a trusted environment variable (not user input), this pattern creates a theoretical injection risk if the env var were ever compromised or malformed. GraphQL queries should use variables.

**Recommended Fix:**
```typescript
body: JSON.stringify({
  query: `query($teamId: String!) { team(id: $teamId) { issues(...) } }`,
  variables: { teamId },
})
```

---

#### 5. Error Stack Traces Leaked in 500 Responses
**Files:** All API routes  
**Severity:** LOW  
**Type:** Information Disclosure

**Issue:**
Error handlers log stack traces to `console.error()`:
```typescript
} catch (e) {
  console.error("Share fetch error:", e); // Stack trace to logs (ok)
  return NextResponse.json(
    { error: "Failed to load share" },
    { status: 500 }
  );
}
```

While the **client-facing response is safe** (generic error message), server logs (CloudWatch, Vercel) may be accessible to unauthorized personnel. This is **not a direct vulnerability** but a data sensitivity concern.

**Recommended Fix:**
```typescript
} catch (e) {
  const errorId = crypto.randomUUID();
  console.error(`[${errorId}] Share fetch error:`, e);
  return NextResponse.json(
    { error: "Failed to load share", errorId }, // For debugging
    { status: 500 }
  );
}
```

Correlate logs by `errorId` so users can report issues without exposing stack traces.

---

#### 6. Missing Input Validation in SHARE_ID_RE Regex
**Files:** Multiple comment/changelog/reactions routes  
**Severity:** LOW  
**Type:** Input Validation

**Issue:**
```typescript
const SHARE_ID_RE = /^[a-zA-Z0-9_-]{6,16}$/;
```

Share IDs are validated against this regex, but the database query in `/share/route.ts` expects exactly 8 alphanumeric characters (from `generateId()`):

```typescript
const IdSchema = z.string().regex(/^[A-Za-z0-9]{8}$/, "Invalid share ID");
```

Inconsistency between read and write schemas could allow edge cases (though current logic doesn't create IDs outside [A-Za-z0-9]).

**Recommended Fix:**
Standardize to `^[A-Za-z0-9]{8}$` across all routes.

---

### POSITIVE SECURITY PRACTICES

The following security measures are **well-implemented**:

1. **Parameterized SQL Queries** ✅  
   All database queries use `postgres.js` template literals with automatic parameterization — no raw SQL concatenation.

2. **Zod Input Validation** ✅  
   Every API route uses Zod schemas to validate request bodies and query parameters.

3. **Authentication via Clerk** ✅  
   Clerk OAuth is properly integrated. Edit tokens require both the token AND authenticated Clerk session (no anonymous mutations).

4. **Rate Limiting** ✅  
   `apiGuard()` enforces per-IP rate limits on all user-facing routes (20 req/min for shares, 5 req/min for comments, etc.).

5. **CSRF Protection** ✅  
   Double-submit cookies validate cross-origin requests; same-origin requests exempt (correct pattern).

6. **CORS Policy** ✅  
   CORS origins validated via `isAllowedOrigin()` before allowing cross-origin requests.

7. **XSS Prevention** ✅  
   - `escapeHtml()` used on comment/feedback text
   - Word filter blocks common vulgarities
   - `dangerouslySetInnerHTML` removed (per changelog note line 34)
   - JsonLd JSON is safe (not evaluated)

8. **Webhook Signature Verification** ✅  
   - Linear webhooks validated with HMAC-SHA256 and timing-safe comparison
   - Discord webhooks verified with Ed25519 signatures
   - PostHog webhooks checked against `POSTHOG_WEBHOOK_SECRET`

9. **CRON Secret Validation** ✅  
   `isCronAuthorized()` properly validates `Bearer ${CRON_SECRET}` on cron routes.

10. **Security Headers** ✅  
    ```
    X-Frame-Options: DENY          ← prevents clickjacking
    X-Content-Type-Options: nosniff ← prevents MIME sniffing
    Strict-Transport-Security: max-age=63072000 ← enforces HTTPS
    Referrer-Policy: strict-origin-when-cross-origin
    Permissions-Policy: disables camera/mic/geo/payment/etc.
    ```

---

## Summary Table

| Issue | Severity | Type | File | Line | Impact | Fix Effort |
|-------|----------|------|------|------|--------|-----------|
| HogQL Query Injection | MEDIUM | Injection | webhooks/posthog/route.ts | 33-34 | Bypass filters, data exposure | Medium |
| CSP `unsafe-eval` | MEDIUM | CSP | next.config.ts | 81 | XSS impact increase | Low |
| Missing Fetch Timeouts | MEDIUM | DoS | pokepaste/route.ts, others | 57-59, multi | Function hangs, resource exhaustion | Low |
| Linear Query Hardcoding | LOW | Injection | cron/daily-ops/route.ts | 79 | Theoretical injection | Low |
| Error Stack Traces | LOW | Info Disclosure | All routes | various | Log exposure | Low |
| SHARE_ID_RE Mismatch | LOW | Validation | comments/reactions | various | Edge cases | Low |

---

## Remediation Priority

1. **High Priority (address in next sprint):**
   - Fix HogQL query injection (use variables instead of string interpolation)
   - Add timeouts to all external fetch calls

2. **Medium Priority (next quarter):**
   - Remove `'unsafe-eval'` from CSP
   - Standardize share ID validation regex
   - Implement error ID correlation in logs

3. **Low Priority (backlog):**
   - Migrate Linear queries to GraphQL variables
   - Review third-party service integrations for additional timeout configurations

---

## No Issues Found

The following checks passed:

- ✅ No hardcoded API keys or secrets in source files (env vars only)
- ✅ No `eval()` or `new Function()` usage in application code
- ✅ No raw SQL injection (all parameterized)
- ✅ No `dangerouslySetInnerHTML` in active components
- ✅ All user input is escaped or sanitized before storage
- ✅ Cron routes properly authenticated with `CRON_SECRET`
- ✅ No unvalidated redirects (share/fork uses explicit URL construction)
- ✅ Account deletion properly cascades foreign keys and anonymizes PII

---

## Conclusion

The VGC Team Report application has a **strong security posture**. The identified issues are **moderate in severity** and do not represent critical vulnerabilities. All high-risk patterns (SQLi, XSS, CSRF, broken auth) are properly mitigated. Addressing the three MEDIUM-severity findings will bring the application to a **high security standard**.

Recommended next steps:
1. Implement fetch timeouts across all external API calls
2. Refactor HogQL query to use parameterized variables
3. Remove `unsafe-eval` from CSP and test Clerk OAuth compatibility
