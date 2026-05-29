# C5 Code Review — Last 20 Commits (26-05-26)

**Date:** 2026-05-25  
**Range:** `03c1547..850e91c` (20 commits)  
**Reviewer:** Claude (automated audit)

---

## Commit Overview

| SHA | Summary | Risk |
|-----|---------|------|
| 850e91c | Delete ShareDock + FloatingReactionDock; persist CTA dismissal | Low |
| 3ace051 | Instagram-style dock + double-tap-to-like + owner pencil | Medium |
| b1af62f | Streamline mobile shared-view UX (auto-present, swipe fix) | Medium |
| 767ef07 | Swarm nightly 20-05-26 (10 sub-commits) | Medium |
| 52437b8 | Remove newsletter signup | Low |
| 6f1e552 | Swarm nightly 19-05-26 (9 sub-commits) | Medium |
| b1e95df–90c57c2 | Swarm nightlies 16-18 May | Low–Medium |
| 83295c1 | posthog?.capture optional chain fix | Low |
| 09c073c | PWA engagement-triggered install prompt | Medium |
| 282aef1 | VGC-182: Champions meta aggregation into SQL | High |
| 03c1547 | VGC-137: Speed tier Yours/Meta badges + Mega matching | Low |
| 761a10d | Fix dead exports + implicit-any TypeScript | Low |
| de7466b | Onboarding UX — ExploreEmpty + PasteInput hint | Low |

**Commit**: `b1e95df` (swarm 18-05-26, VGC-125 welcome email + comment notifications)
**File**: `src/lib/email.ts`, lines 89-136
**Risk**: HIGH — stored XSS via email injection

The `buildCommentNotificationHtml()` function interpolates `commenterName`, `commentBody`, and `reportTitle` directly into HTML template literals with **zero escaping**:

```ts
<strong>${commenterName}</strong> commented on <strong>${reportTitle}</strong>
...
<p ...>${commentBody}</p>
```

## Critical Findings

### 1. WASTED CHURN — ShareDock/FloatingReactionDock/useTouchIdleHide (b1af62f → 3ace051 → 850e91c)

**Severity:** Tech-debt / process issue  
**Files:** `src/components/ui/ShareDock.tsx`, `src/components/social/FloatingReactionDock.tsx`, `src/hooks/useTouchIdleHide.ts`

Three consecutive commits over a single day:
- b1af62f: **Adds** useTouchIdleHide (92 lines), modifies ShareDock (+56), FloatingReactionDock (+80)
- 3ace051: **Rewrites** useTouchIdleHide (169 lines), modifies ShareDock (+26), FloatingReactionDock (+22), adds DoubleTapLikeOverlay (345 lines)
- 850e91c: **Deletes** all three of useTouchIdleHide, ShareDock, and FloatingReactionDock entirely

This is 543 lines added in 3ace051 where ~450 were dead within hours. The churn indicates lack of design consensus before implementation. Not a code bug, but a costly pattern if it repeats.

**Follow-up ticket:** Establish lightweight UX sign-off process before implementing disposable UI components.

---

### 2. MISSING PWA SCREENSHOTS — manifest.json references non-existent files (09c073c)

**Severity:** Bug (functionality gap)  
**File:** `public/manifest.json`

The manifest references four screenshot paths:
- `/screenshots/desktop-team-report.png`
- `/screenshots/desktop-explore.png`
- `/screenshots/mobile-team-report.png`
- `/screenshots/mobile-explore.png`

The directory `public/screenshots/` does not exist. Chrome's enhanced install dialog requires these assets to show the "richer install UI" — without them, the enhanced dialog silently falls back to the basic prompt. This is noted in the commit message ("actual PNGs to be captured") but has sat unresolved for 10 days.

**Follow-up ticket:** Capture and commit the 4 PWA screenshots to `public/screenshots/`.

---

### 3. SQL AGGREGATION — Regex divergence risk between Postgres and JS (282aef1)

**Severity:** Medium (potential data correctness)  
**File:** `src/app/api/champions/meta/route.ts`

The SQL CTEs replicate `extractSpecies()` logic (gender strip, nickname detection, item suffix). But this is a re-implementation in Postgres regex rather than calling the canonical JS function. Divergence risks:

1. **Gender regex:** SQL uses `E'\\s+\\([MF]\\)\\s*$'` — only matches uppercase M/F. If pastes ever contain lowercase `(m)` or `(f)`, SQL won't strip them but the JS would.
2. **Item split:** `split_part(first_line, ' @ ', 1)` splits on first occurrence. If a nickname contains " @ " (unlikely but legal in Showdown exports), it truncates.
3. **No test parity:** There's no integration test verifying the SQL output matches the JS `extractSpecies()` for the same input set. A regression here silently corrupts the meta page.

**Follow-up ticket:** Add integration test comparing SQL CTE output vs JS `extractSpecies()` on a corpus of 50+ real pastes.

---

### 4. NAVBAR SAVE TOGGLE — Fetch fires without abort on unmount (850e91c)

**Severity:** Low–Medium (race condition)  
**File:** `src/components/layout/Navbar.tsx` (lines 197–208)

```typescript
useEffect(() => {
  if (!canSave || !activeShareId) return;
  fetch("/api/user/saved")
    .then((r) => (r.ok ? r.json() : null))
    .then((data) => {
      if (data?.reports?.some((r: { id: string }) => r.id === activeShareId)) {
        setSaved(true);
      } else {
        setSaved(false);
      }
    })
    .catch(() => {});
}, [canSave, activeShareId]);
```

Issues:
- No `AbortController` — if `activeShareId` changes rapidly (user clicking through reports), stale responses can set the wrong `saved` state for the current report.
- `canSave` depends on `isSignedIn` which flickers during Clerk hydration. The effect may fire with `canSave = false` initially, then `true` after auth loads, creating a visible flash from "Save" button being hidden to shown.
- No cleanup return. The component can unmount while the fetch is inflight, calling `setSaved` on an unmounted component (React 19 suppresses the warning but it's still wasted work).

**Follow-up ticket:** Add `AbortController` to Navbar saved-state effect, gate on `isLoaded` to avoid hydration flicker.

---

### 5. iOS INSTALL PROMPT — Scroll gate can deadlock on short pages (09c073c)

**Severity:** Low–Medium (functionality gap)  
**File:** `src/components/ui/InstallPrompt.tsx` (lines 60–78)

The iOS path requires `scrollFired` to be true before showing the prompt. On pages where the viewport is taller than the content (e.g., an iPad in landscape showing only a single team card), `window.scrollY` can never reach 200px because there's nothing to scroll. The current deployed code (line 67-68) does include a `pageIsShort` fallback check, but this was added after the commit shown in the diff — need to verify it's in HEAD.

Confirmed at HEAD (lines 67-68): there is a `pageIsShort` check. This is resolved. However, the `promptReady` flag in the Android path is never set for iOS Safari (no `beforeinstallprompt` event fires on iOS), meaning `maybeReveal()` can never succeed on that path — the iOS logic correctly bypasses `maybeReveal()` and uses its own timer. This is fine.

**Status:** Resolved in HEAD. No follow-up needed.

---

### 6. DoubleTapLikeOverlay — Inline `<style>` tag renders on every mount (3ace051)

**Severity:** Low (performance)  
**File:** `src/components/social/DoubleTapLikeOverlay.tsx`

The component injects a `<style>` block with keyframe definitions into the DOM every time it mounts. On React re-renders that unmount/remount this dynamic import, duplicate `<style>` tags accumulate (though the browser deduplicates identical keyframe names). This is a minor perf concern but not standard practice.

**Follow-up ticket:** Move keyframes to a global CSS file or use Tailwind's `@keyframes` extension in the CSS layer.

---

### 7. Weekly Digest Batch — No error isolation per email (767ef07)

**Severity:** Low–Medium (reliability)  
**File:** `src/app/api/cron/weekly-digest/route.ts`

The parallel batch email sending:
```typescript
const results = await Promise.all(chunk.map((job) => sendEmail(job).catch(() => null)));
```

The `.catch(() => null)` swallows all error details — you can't tell which emails failed or why from the logs. Only the count (`errors++`) is tracked. If Resend returns a rate-limit (429) on one email, the code doesn't back off for subsequent emails in the same chunk. A burst of 15 parallel sends hitting a rate limit would fail all 15.

**Follow-up ticket:** Add exponential backoff on 429 responses in email batch sender; log failed recipient addresses (not content) for debugging.

---

### 8. AUTO-PRESENT for shared views — No escape hatch for direct-link viewers (b1af62f)

**Severity:** Low (UX concern, not a bug)  
**File:** `src/hooks/useHomePage.ts` (lines 558–574)

When a viewer opens a shared report link, they're immediately put into presentation mode. The only way to exit is finding and clicking the "Exit" button in the Navbar. On mobile, this may confuse users who expect a normal scrollable page — especially if they arrive from a search engine result or a shared link on Discord where the expectation is "I want to read the team details."

The `editKeyFromUrl` check helps owners, but regular viewers have no URL parameter to opt out. This is a deliberate UX decision, but worth monitoring in analytics for bounce-rate impact.

**Follow-up ticket:** Track exit-presentation-mode events in PostHog; if >30% of shared-view users exit within 5s, add a "View as page" link.

---

## Conflict-Risk Files Assessment

| File | Commits touching it (last 20) | Risk |
|------|-------------------------------|------|
| `src/app/page.tsx` | 4 (850e91c, 3ace051, b1af62f, 52437b8) | **HIGH** — 1881 lines, god-component |
| `src/components/layout/Navbar.tsx` | 2 (850e91c, 3ace051) | Medium — 872 lines, growing |
| `src/app/changelog/ChangelogContent.tsx` | 3 (767ef07, 6f1e552, 52437b8) | Low — append-only |
| `src/components/ui/ShareModal.tsx` | 1 (767ef07) | Low — stable |

**Key concern:** `page.tsx` at 1881 lines is the single biggest merge-conflict risk. It contains routing logic, state management, all conditional rendering, and keeps growing. Any two developers touching this file simultaneously will conflict.

**Follow-up ticket:** Extract shared-view logic (CTA, reactions, save) from `page.tsx` into a `SharedViewProvider` or dedicated sub-component.

---

## Summary of Recommended Follow-Up Tickets

| # | Title | Priority |
|---|-------|----------|
| 1 | Capture PWA screenshots for enhanced Chrome install dialog | P2 |
| 2 | Integration test: SQL meta CTE vs JS extractSpecies() parity | P2 |
| 3 | AbortController + auth-gate on Navbar saved-reports effect | P3 |
| 4 | Extract shared-view concerns from page.tsx (1881 lines) | P2 |
| 5 | Email batch sender: log failures, add rate-limit backoff | P3 |
| 6 | Move DoubleTapLikeOverlay keyframes to global CSS | P4 |
| 7 | Track auto-present bounce rate for shared views | P3 |
