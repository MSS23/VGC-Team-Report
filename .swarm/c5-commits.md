# C5: Recent Commits Review

## Top findings

### 1. Linear webhook handler: 8 consecutive identical fix proposals
The changelog explicitly documents: "8th consecutive fix proposal — please merge!"
Repeating commits across nights have re-attempted the same fix. By merge commit 1a30839, all 8 repeating proposals were force-merged into one clean pass. Current code IS correct — the persistent failure must be env-var config on Vercel.

### 2. Webhook routes silently return 200 on errors to prevent auto-disable
Linear/Clerk/PostHog webhooks catch and return 200 without logging (route.ts line 68-71).
Problem: transient errors (timeouts, DB failures) swallowed without observability.

### 3. Email XSS vulnerabilities fixed twice
Changelog v5.22 and v5.20: stored-XSS in email templates (welcomeEmail, commentNotification) requiring `escapeHtml()` to be lifted from weekly-digest into shared scope. Persistent re-fix pattern.

### 4. Fire-and-forget SQL without await
Five `sql\`...\`.catch(…)` patterns running without await. On Vercel + Neon HTTP, the lambda freezes when the response returns, cancelling these in-flight — so changelog inserts and draft cleanup silently failed.

### 5. Database corruption: share owner_id misalignment (resolved v5.17)
INSERT column-position mismatch put boolean in owner_id, Clerk user ID in search_vector. Repair script drafted as VGC-195.

### 6. Timing-safe comparisons added across many routes
Multiple commits (709ca2d, 484fa50, 6981f23) added `crypto.timingSafeEqual` to /api/migrate, /api/setup, /api/cleanup — indicates prior plain `!==` comparison (timing oracle vulnerability).

## Top 5 Follow-Up Ticket Candidates

1. **[INFRA] Linear webhook env-var standardization** — Eliminate dual `LINEAR_WEBHOOK_SIGNING_SECRET` / `LINEAR_WEBHOOK_SECRET` fallback once Vercel env confirmed. Single canonical name.
2. **[OBS] Webhook error observability** — Add structured logging on all webhook 200-on-error catches so silent failures are visible.
3. **[BUG] Audit fire-and-forget SQL** — Grep all `.catch()` without `await` in API routes; convert to `waitUntil()` or `await` as appropriate.
4. **[DATA] Verify VGC-195 repair completeness** — Audit DB for any remaining rows with corrupted owner_id from May 17-28 window.
5. **[SEC] Audit all secret comparisons for timing safety** — Sweep for any remaining `!== EXPECTED_SECRET` patterns.
