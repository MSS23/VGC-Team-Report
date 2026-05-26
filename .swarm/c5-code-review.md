# C5 Code Review — Last 20 Commits (26-05-26)

Reviewed: `03c1547` through `850e91c` (20 commits on `origin/main`).

---

## CRITICAL: XSS in Comment Notification Email (src/lib/email.ts)

**Commit**: `b1e95df` (swarm 18-05-26, VGC-125 welcome email + comment notifications)
**File**: `src/lib/email.ts`, lines 89-136
**Risk**: HIGH — stored XSS via email injection

The `buildCommentNotificationHtml()` function interpolates `commenterName`, `commentBody`, and `reportTitle` directly into HTML template literals with **zero escaping**:

```ts
<strong>${commenterName}</strong> commented on <strong>${reportTitle}</strong>
...
<p ...>${commentBody}</p>
```

An attacker can set their Clerk display name or submit a comment containing `<script>` or `<img onerror=...>` tags. While most modern email clients strip scripts, many still render arbitrary HTML, enabling phishing links disguised as UI elements, form injection, and CSS-based data exfiltration.

The weekly-digest cron (`src/app/api/cron/weekly-digest/route.ts`) has its own local `escapeHtml()` (added in `6f1e552`), but `src/lib/email.ts` has **no** escape function at all. The `buildWelcomeEmailHtml()` function (same file, line 219) also interpolates `firstName` raw.

**Fix**: Add `escapeHtml()` to `src/lib/email.ts` and apply it to all user-controlled interpolations in `buildCommentNotificationHtml()` and `buildWelcomeEmailHtml()`. Consider extracting the helper to a shared `src/lib/utils/escape-html.ts` to avoid the duplicate in weekly-digest.

**Follow-up ticket**: YES — P0 security fix.

---

## HIGH: Navbar Save Effect Missing Abort/Cancellation (src/components/layout/Navbar.tsx)

**Commit**: `850e91c` (delete share + reaction docks)
**File**: `src/components/layout/Navbar.tsx`, lines 197-208
**Risk**: Race condition — stale setState on unmount

The `useEffect` that fetches `/api/user/saved` on mount has no cancellation mechanism:

```ts
useEffect(() => {
  if (!canSave || !activeShareId) return;
  fetch("/api/user/saved")
    .then((r) => (r.ok ? r.json() : null))
    .then((data) => {
      if (data?.reports?.some(...)) { setSaved(true); }
      else { setSaved(false); }
    })
    .catch(() => {});
}, [canSave, activeShareId]);
```

If the user navigates away (changing `activeShareId`) before the fetch resolves, the `.then` will call `setSaved` with stale data for the previous share. In React 18+ strict mode this also fires twice in development.

**Fix**: Add an AbortController or a `cancelled` flag pattern (as used correctly in `DoubleTapLikeOverlay.tsx` line 141).

---

## HIGH: Manifest Screenshots Reference Non-Existent Files (public/manifest.json)

**Commit**: `09c073c` (PWA engagement-triggered install prompt)
**File**: `public/manifest.json`, lines 82-108
**Risk**: Broken PWA enhanced install dialog on Chrome

The manifest references 4 screenshot paths (`/screenshots/desktop-team-report.png`, etc.) but the `public/screenshots/` directory does not exist. Chrome's enhanced install dialog silently degrades, but Lighthouse PWA audits will flag the broken references.

The commit message acknowledged this ("actual PNGs to be captured and placed there"), but no follow-up ticket was created.

**Fix**: Either capture and add the screenshots, or revert the manifest entries to prevent broken references. File a ticket.

**Follow-up ticket**: YES — capture PWA screenshots.

---

## MEDIUM: Share INSERT Column Mismatch Shipped to Prod (src/app/api/share/route.ts)

**Commits**: `90c57c2` introduced the bug (swarm 17-05-26), `b1e95df` fixed it (swarm 18-05-26)
**File**: `src/app/api/share/route.ts`
**Risk**: Data corruption — ownership corruption on shares created between these commits

The VGC-190 unlisted tier commit added `is_unlisted` to the INSERT VALUES but not the column list, shifting `owner_id` to receive a boolean. This was live for approximately 24 hours. The commit message in `b1e95df` mentions a repair draft at `.swarm/drafts/vgc195-db-repair.sql`.

**Question**: Was the repair SQL actually run against production? If shares were created during that window, ownership is corrupted. This needs confirmation.

**Follow-up ticket**: YES — verify VGC-195 DB repair was executed.

---

## MEDIUM: Churned Components — 3 Build/Delete Cycles in One Day (multiple commits)

**Commits**: `b1af62f` (create), `3ace051` (rewrite), `850e91c` (delete)
**Files**: `ShareDock.tsx`, `FloatingReactionDock.tsx`, `useTouchIdleHide.ts`
**Risk**: Wasted build minutes and review effort

Three components were created, rewritten with new UX patterns, and then fully deleted — all within the same day (May 20). While the final state is clean, this represents 3 separate commits that each modified `page.tsx` and `Navbar.tsx`. If these had been pushed individually, that would have been 3 Vercel builds for features that ended up deleted.

**Lesson**: For experimental UI, prototype locally before committing. The current batching strategy (commit locally, push once) mitigated the build cost, but the commit history is noisy.

---

## MEDIUM: page.tsx is 1,881 Lines (src/app/page.tsx)

**Multiple commits**: Nearly every feature commit touches this file
**Risk**: Merge conflicts, readability, maintainability

`page.tsx` has grown to 1,881 lines as a single "use client" component (`HomeContent`). It contains presentation mode logic, share flow, CTA persistence, view tracking, fork flow, version comparison, tour system, and more. Every UI feature commit has to modify this file, creating a constant merge-conflict hotspot.

**Fix**: Extract logical sections into custom hooks or sub-components:
- Share/fork CTA logic -> `useShareCta.ts`
- View tracking -> `useViewTracking.ts`
- Presentation mode orchestration -> `usePresentationMode.ts`

**Follow-up ticket**: YES — refactor page.tsx into composable pieces.

---

## MEDIUM: i18n Stubs Are Empty Strings (6 language files)

**Commit**: `b1e95df` (VGC-121: ShareModal i18n)
**Files**: `src/lib/i18n/translations/{fr,es,it,ja,ko,zh}.ts`
**Risk**: Broken UI for non-English users

All 6 non-English translation files have empty-string stubs for the ~26 ShareModal keys added in VGC-121. The `ShareModal.tsx` uses a `Proxy` that falls back to English when the value is empty (`""`), which is clever but fragile — if the Proxy pattern is removed or if a key is missing entirely (not just empty), users will see blank buttons and labels.

Additionally, the ExploreFilters i18n keys added in `6f1e552` (VGC-199) also have empty stubs in non-English files.

**Fix**: At minimum, copy the English strings as placeholders into all translation files. Better: use a typed i18n system that enforces key completeness at build time.

**Follow-up ticket**: YES — translate or copy English fallbacks for ShareModal + ExploreFilters keys.

---

## LOW: DoubleTapLikeOverlay Inline `<style>` on Every Render (src/components/social/DoubleTapLikeOverlay.tsx)

**Commit**: `3ace051` (Instagram-style dock UX)
**File**: `src/components/social/DoubleTapLikeOverlay.tsx`, lines 291-300
**Risk**: Minor performance — repeated style injection

The component injects a `<style>` block with `@keyframes` on every render cycle. Since this is a fixed-position overlay that is always mounted on shared views, the styles are re-injected on every heart spawn/despawn state change.

**Fix**: Move the keyframe definitions to `globals.css` or use a `useEffect`-based style injection that runs once on mount.

---

## LOW: InstallPrompt localStorage Access Without Try/Catch (src/components/ui/InstallPrompt.tsx)

**Commit**: `09c073c` (PWA engagement prompt)
**File**: `src/components/ui/InstallPrompt.tsx`, lines 20-21
**Risk**: Crash in private browsing on older Safari

```ts
const dismissedAt = localStorage.getItem(DISMISS_KEY);
```

This is called at the top of a `useEffect` without a try/catch. In older Safari private browsing, `localStorage` throws on access. The CTA persistence code in `page.tsx` (line 637) correctly wraps localStorage in try/catch — this should too.

---

## LOW: Weekly Digest Send Errors Silently Swallowed (src/app/api/cron/weekly-digest/route.ts)

**Commit**: `767ef07` (VGC-201: batch Clerk getUserList)
**File**: `src/app/api/cron/weekly-digest/route.ts`, lines 352-357
**Risk**: Silent email delivery failures

The parallel batch sending catches failures via `.catch(() => null)` and increments the `errors` counter, but the actual error is swallowed. If Resend rate-limits the batch or rejects emails, there is no logged reason.

**Fix**: Log the error in the catch: `.catch((e) => { console.error('Email send failed:', e); return null; })`.

---

## INFORMATIONAL: Dead Code Already Cleaned Well

Across commits `761a10d`, `767ef07`, and `90c57c2`, approximately 17 dead exports and 3 unused imports were systematically removed. The codebase is notably clean of dead code as of HEAD. Good hygiene.

---

## Summary of Follow-Up Tickets Recommended

| Priority | Issue | File(s) |
|----------|-------|---------|
| P0 | XSS in comment notification email — add escapeHtml | `src/lib/email.ts` |
| P1 | Verify VGC-195 DB repair was executed | `src/app/api/share/route.ts` |
| P2 | Navbar save effect missing abort controller | `src/components/layout/Navbar.tsx` |
| P2 | Capture PWA screenshots or revert manifest | `public/manifest.json` |
| P2 | Translate or backfill i18n empty stubs | `src/lib/i18n/translations/*.ts` |
| P3 | Refactor page.tsx (1,881 lines) | `src/app/page.tsx` |
| P3 | InstallPrompt localStorage try/catch | `src/components/ui/InstallPrompt.tsx` |
| P3 | Weekly digest error logging | `src/app/api/cron/weekly-digest/route.ts` |
