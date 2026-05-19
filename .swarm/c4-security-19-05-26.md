# Security Audit Report: VGC Team Report (18-05-26 Swarm Run)
**Date:** May 19, 2026  
**Scope:** New features added in 18-05-26 swarm run  
**Auditor:** Claude Code Security Analysis  

---

## Executive Summary

This audit reviewed 5 critical new files added in the 18-05-26 swarm run:
- Clerk webhook handler (signature verification, user.created event)
- Weekly digest cron job (CRON_SECRET validation, email generation)
- Notifications API (auth, integer ID validation, pagination)
- NotificationsContent client component (XSS, data binding)
- Email library (template injection, header injection risks)

**Risk Assessment:**
- **Critical Issues:** 0
- **High Issues:** 2
- **Medium Issues:** 3
- **Low Issues:** 4
- **Next.js CVE-2025-29927:** NOT VULNERABLE (v16.2.6 < 14.2.29 but safe in v16.x line)

---

## Detailed Findings

### CRITICAL ISSUES
None identified.

---

### HIGH SEVERITY

#### 1. Email Header Injection via USER-CONTROLLED FROM ADDRESS
**File:** `src/lib/email.ts` (lines 34, 42)  
**Severity:** HIGH  
**Risk:** If `RESEND_FROM_EMAIL` env var is compromised or user input reaches it, email headers can be injected.

**Current Code:**
```typescript
const from = process.env.RESEND_FROM_EMAIL || DEFAULT_FROM;
body: JSON.stringify({
  from,
  to: opts.to,
  subject: opts.subject,
  html: opts.html,
}),
```

**Issue:** While current code doesn't accept user input for `from`, the env var itself is a security boundary. If `.env` is leaked or compromised, header injection becomes possible (CRLF in FROM field could inject BCC, CC, etc.).

**Recommendation:**
- Validate `from` address format before use: `const from = (process.env.RESEND_FROM_EMAIL || DEFAULT_FROM).replace(/[\r\n]/g, '');`
- Or restrict to a whitelist of known-safe addresses in production

---

#### 2. Insufficient CRON_SECRET Validation on Rate Limits
**File:** `src/app/api/cron/weekly-digest/route.ts` (lines 215-217)  
**Severity:** HIGH  
**Risk:** Cron endpoint validates CRON_SECRET but processes 500 users without per-operation rate limits. A single valid request could spawn 500 emails and 500 Clerk API calls.

**Current Code:**
```typescript
if (!isCronAuthorized(request)) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
// ... then sends 500 emails in a loop
```

**Issues:**
- No per-email rate limiting (Resend API could be abused if token is stolen)
- Clerk API calls (500 `getUser()`) could be expensive if accessed directly
- MAX_USERS cap is soft (500) but not enforced against replay attacks with valid CRON_SECRET

**Recommendation:**
- Add distributed rate limiting on per-request basis: `await isRateLimitedAsync('cron:digest', 1, 86400000)` (1 per day)
- Or track last execution timestamp and skip if run within 23 hours
- Consider batching Clerk API calls or using service token with lower rate limits

---

### MEDIUM SEVERITY

#### 1. XSS RISK: Notification.message Rendered Without Sanitization
**File:** `src/app/notifications/NotificationsContent.tsx` (lines 101)  
**Severity:** MEDIUM  
**Risk:** `notification.message` is rendered directly in JSX without sanitization. If the backend ever writes user-controlled HTML into the `message` field, XSS is possible.

**Current Code:**
```tsx
<p className={`text-sm leading-relaxed ...`}>
  {notification.message}
</p>
```

**Current Status:** Safe today because backend only generates safe strings. But risk tier: MEDIUM (mutation vulnerability).

**Recommendation:**
- Add schema validation in backend to enforce message format (no HTML allowed, max length 500 chars)
- Consider: `z.string().max(500).regex(/^[^<>]*$/)` in notifications PATCH/POST endpoints
- Add lint rule or sanitizer if messages ever become user-generated

---

#### 2. IDOR Risk: User ID Not Verified in Notification IDs
**File:** `src/app/api/user/notifications/route.ts` (lines 84-86)  
**Severity:** MEDIUM  
**Risk:** PATCH endpoint updates notifications by ID array without verifying they belong to the authenticated user.

**Current Code:**
```typescript
} else if (body.ids && body.ids.length > 0) {
  await sql`UPDATE notifications SET read = TRUE WHERE user_id = ${userId} AND id = ANY(${body.ids})`;
}
```

**Current Status:** SAFE because `WHERE user_id = ${userId}` ensures only own notifications are updated. BUT: If query is miswritten (e.g., someone removes the `AND user_id`), IDOR is automatic.

**Recommendation:**
- Add server-side validation after PATCH: query `SELECT COUNT(*) FROM notifications WHERE user_id != ${userId} AND id = ANY(${body.ids})` and return error if any rows found
- Or add unit test to verify only authenticated user's notifications are updated

---

#### 3. Insufficient Input Validation on Email Addresses
**File:** `src/app/api/webhooks/clerk/route.ts` (lines 53-62)  
**Severity:** MEDIUM  
**Risk:** Email address from Clerk is not validated before passing to `sendWelcomeEmail()`. If Clerk data is corrupted, invalid emails could reach Resend API.

**Current Code:**
```typescript
if (!primaryEmail?.email_address) {
  console.warn("Clerk user.created event has no primary email — skipping welcome email", {
    userId: data.id,
  });
  return NextResponse.json({ ok: true });
}

await sendWelcomeEmail({
  to: primaryEmail.email_address,  // No validation
  firstName: data.first_name,
});
```

**Recommendation:**
- Add email validation: `const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; if (!emailRegex.test(email)) { ... }`
- Or use Zod: `z.string().email()` on the TypeScript interface

---

### LOW SEVERITY

#### 1. Timing-Safe Comparison Correctly Implemented
**File:** `src/lib/cron-auth.ts` (lines 14-17)  
**Severity:** LOW (Positive Finding)  
**Status:** SECURE

Uses `timingSafeEqual()` for CRON_SECRET comparison — prevents timing-based enumeration attacks.

---

#### 2. Notification Pagination: No DOS via Offset
**File:** `src/app/api/user/notifications/route.ts` (lines 19-20)  
**Severity:** LOW (Minor)  
**Risk:** Offset is not validated; attacker could request `offset=999999999`, scanning the entire notifications table.

**Current Code:**
```typescript
const limit = Math.min(Number(url.searchParams.get("limit") ?? 50), 100);
const offset = Number(url.searchParams.get("offset") ?? 0);  // No max
```

**Recommendation:**
- Cap offset: `const offset = Math.min(Number(url.searchParams.get("offset") ?? 0), 100000);`
- Or add `LIMIT ${limit} OFFSET ${offset}` with hard cap (PostgreSQL will refuse queries with offset > some threshold)

---

#### 3. Silent Error Suppression in Client Hook
**File:** `src/hooks/useNotifications.ts` (lines 29-31)  
**Severity:** LOW  
**Risk:** Fetch errors are silently caught and ignored, hiding network failures or 500 errors.

**Current Code:**
```typescript
const res = await fetch("/api/user/notifications?limit=50&offset=0");
if (!res.ok) return;
const data = await res.json();
```

**Recommendation:**
- Log errors for debugging: `console.error('Failed to fetch notifications:', res.status);`
- Consider exponential backoff for retry logic

---

#### 4. Missing Content-Type Validation on Clerk Webhook
**File:** `src/app/api/webhooks/clerk/route.ts`  
**Severity:** LOW  
**Risk:** Webhook does not enforce `Content-Type: application/json`, could accept malformed requests.

**Current Status:** Clerk SDK's `verifyWebhook()` likely handles this internally.

**Recommendation:**
- Explicit check: Add `apiGuard(request, { requireContentType: true })` guard at start (optional, Clerk may handle)

---

## Next.js CVE-2025-29927 Assessment

**Status:** NOT VULNERABLE

- **CVE-2025-29927:** Affects Next.js < 14.2.29 and < 15.2.3
- **App Version:** 16.2.6
- **Assessment:** Version 16.2.6 is in the 16.x release line (post-15.x), which has a separate security track. The app is safe from this CVE.
- **Ticket:** VGC-191 (Next.js upgrade ticket) is logged but not urgent for this CVE.

**Recommendation:** Still upgrade to latest 16.x stable in next planning cycle for general security hardening.

---

## Package Dependency Risk Summary

| Package | Version | Risk |
|---------|---------|------|
| next | 16.2.6 | LOW (not affected by CVE-2025-29927) |
| @clerk/nextjs | ^7.3.2 | LOW (webhook verification trusted) |
| @upstash/ratelimit | ^2.0.8 | LOW (distributed rate limiting good) |
| zod | ^4.3.6 | LOW (input validation solid) |
| tweetnacl | ^1.0.3 | LOW (only used by Clerk internally) |

---

## Recommended Immediate Actions

1. **Validate email addresses** in Clerk webhook (MEDIUM)
2. **Add per-cron rate limiting** to prevent digest email floods (HIGH)
3. **Validate notification.message** to prevent XSS mutations (MEDIUM)
4. **Cap notification pagination offset** to prevent table scans (LOW)
5. **Sanitize RESEND_FROM_EMAIL** env var to block header injection (HIGH)

---

## Summary of Changes Reviewed

1. ✅ `src/app/api/webhooks/clerk/route.ts` — Signature verification: SECURE. Payload validation: NEEDS email regex.
2. ✅ `src/app/api/cron/weekly-digest/route.ts` — CRON_SECRET: SECURE. Rate limiting: MISSING. SQL: SAFE (parameterized).
3. ✅ `src/app/api/user/notifications/route.ts` — Auth: SECURE. Integer ID validation: GOOD. IDOR: PROTECTED. Pagination: needs offset cap.
4. ✅ `src/app/notifications/NotificationsContent.tsx` — XSS: Currently safe, needs schema enforcement.
5. ✅ `src/lib/email.ts` — Template injection: SAFE (no user input in templates). Header injection: MEDIUM risk on FROM address.

---

## Conclusion

The 18-05-26 swarm additions introduce **2 high-severity and 3 medium-severity issues**, all of which are fixable in 1-2 hours of development time. No critical vulnerabilities were identified. The codebase demonstrates solid security fundamentals (parameterized queries, timing-safe comparison, proper auth checks), but edge cases around rate limiting, email validation, and header sanitization need attention before production deployment.

**Risk Rating:** MEDIUM (2 HIGH issues require remediation before full production traffic)

