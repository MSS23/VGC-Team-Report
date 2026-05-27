# Code Review — Last 20 Commits (main)

**Date:** 2026-05-27  
**Range:** `03c1547..850e91c` (20 commits)  
**Reviewer:** Claude (automated audit)

---

## Prioritized Findings

### 1. Dock UX Churn — Built, Rewritten, and Deleted in 8 Hours (HIGH)

**Commits:** `b1af62f` (create) -> `3ace051` (rewrite) -> `850e91c` (delete)

`ShareDock.tsx`, `FloatingReactionDock.tsx`, and `useTouchIdleHide.ts` were created, significantly rewritten (brief-flash + peek-tab + data-vgc-dock), and then entirely deleted — all on 2026-05-20. The 345-line `DoubleTapLikeOverlay.tsx` was also added in the same rewrite and survives. Net churn: ~600 lines added then removed in a single day.

**Impact:** Wasted review bandwidth and inflated the diff. The intermediate commits are noise in `git blame` and `git bisect`. **Follow-up:** No action needed now (files are gone), but future UI experiments should be prototyped in a branch rather than committed to main in rapid succession.

---

### 2. Weekly Digest N+1 Query Still Present Per-User (HIGH)

**File:** `src/app/api/cron/weekly-digest/route.ts` lines 312-323

The Clerk N+1 was fixed (VGC-201), but a per-user engagement stats query remains inside the loop:

```sql
SELECT ... FROM shares r LEFT JOIN comments c ... LEFT JOIN reactions rc ...
WHERE r.owner_id = ${userId} AND r.deleted_at IS NULL
```

With 500 users, this is 500 sequential DB queries inside a single serverless invocation. At scale this will timeout the Vercel function (default 10s on Pro). **Follow-up ticket:** Batch the engagement stats query — a single `GROUP BY owner_id` CTE returning all 500 users' stats eliminates the loop.

---

### 3. Email Unsubscribe Link Is a Dead End (HIGH — CAN-SPAM)

**File:** `src/app/api/cron/weekly-digest/route.ts` lines 111, 204

Both email templates say "To unsubscribe from weekly digests, visit your notification preferences" but no `/notification-preferences` or `/unsubscribe` page exists. The opt-out check (`user.publicMetadata?.digestUnsubscribed`) works server-side, but users have no self-service way to set that flag. Under CAN-SPAM and GDPR, every marketing email must contain a functional unsubscribe mechanism. **Follow-up ticket: P0** — add `/dashboard/notifications/preferences` page or a one-click unsubscribe token link.

---

### 4. SQL Injection Surface in Champions Meta CTE (MEDIUM)

**File:** `src/app/api/champions/meta/route.ts` (commit `282aef1`)

The 6-CTE query uses `regexp_split_to_table` on user-submitted paste text stored in `data->>'paste'`. While the paste is not interpolated (it comes from the DB, not the request), the regex operations run on arbitrary user content. A paste containing pathological regex patterns (e.g., deeply nested `((((...))))` blocks) could cause exponential backtracking in PostgreSQL. Low probability, but worth noting. **Mitigation:** Add a `LENGTH(paste) < 10000` guard in the `filtered` CTE.

---

### 5. Clerk Webhook `as unknown as` Type Cast (MEDIUM)

**File:** `src/app/api/webhooks/clerk/route.ts` line 46

```typescript
const data = event.data as unknown as ClerkUserCreatedData;
```

This double-cast bypasses TypeScript's type system entirely. If Clerk changes the `user.created` event payload shape, the code will silently access undefined properties (e.g., `data.email_addresses` could be missing) with no compile-time warning. **Follow-up:** Use Zod to validate `event.data` at runtime, matching the pattern used in the notifications PATCH route.

---

### 6. `page.tsx` Complexity Continues to Grow (MEDIUM)

**File:** `src/app/page.tsx`

Across these 20 commits, `page.tsx` was touched in 4 of them. The `HomeContent` component now manages share state, localStorage persistence, fork status, presentation mode, theme overrides, and more — all in a single function component. The localStorage effect added in `850e91c` (lines 623-637) is clean but adds yet another effect to an already effect-heavy component.

**Follow-up ticket:** Extract `useShareCtaPersistence(activeShareId)` custom hook to encapsulate the localStorage read/write + state, reducing `HomeContent`'s effect count.

---

### 7. Swarm Nightly Commits Bundle Too Much (LOW-MEDIUM, recurring)

**Commits:** `767ef07`, `6f1e552`, `b1e95df`, `90c57c2`, `7dd9900`

Each "swarm: nightly improvements" PR merges 8-18 sub-commits spanning security fixes, a11y work, new features, SEO changes, i18n additions, and research docs. Example: `b1e95df` (18-05-26) mixes a critical share INSERT column mismatch fix with a brand-new weekly-digest cron route and i18n extraction — all in one merge commit. Bisecting a regression across any of these is painful. The column mismatch bug itself (17-05-26 swarm introduced `is_unlisted` value without the column name) shows the risk of large bundled commits.

---

### 8. InstallPrompt iOS Engagement Gate Race (LOW)

**File:** `src/components/ui/InstallPrompt.tsx` (commit `09c073c`, fixed in `90c57c2`)

The iOS Safari branch checks `if (scrollFired)` inside a `setTimeout(60000)`, but if the user scrolls after the timer fires, the prompt never shows. Commit `90c57c2` (VGC-193) added a `pageIsShort` fallback, but the general case (user scrolls at second 61) still silently drops the prompt. Low priority — iOS A2HS is niche.

---

## Positive Patterns

- **Accessibility work is consistent.** Every swarm nightly includes WCAG fixes (aria-pressed, aria-live, focus management, 44px touch targets). The MatchTracker Escape-key + focus-return pattern (VGC-194) is well done.
- **Security improvements are proactive.** XSS fix in digest emails, CRLF injection guard on RESEND_FROM_EMAIL, Zod validation on notification PATCH, Next.js 16.2.6 pin for SSRF/auth CVEs.
- **VGC-182 SQL migration is excellent.** Moving species aggregation from JS to a 6-CTE query is a textbook performance win — 5MB transfer eliminated.
- **Error handling is uniform.** API routes consistently use try/catch with structured JSON error responses. The DoubleTapLikeOverlay has proper cleanup (timer refs, listener removal, unmount guards).

---

## Priority Follow-Up Tickets

| Priority | Title |
|---|---|
| P0 | Add functional email unsubscribe mechanism (CAN-SPAM/GDPR) |
| P1 | Batch weekly-digest engagement stats into single GROUP BY query |
| P1 | Validate Clerk webhook payload with Zod instead of double-cast |
| P2 | Extract `useShareCtaPersistence` hook from page.tsx |
| P2 | Add LENGTH guard to champions/meta CTE for paste text |
| P3 | Separate swarm research docs from production code in future commits |
