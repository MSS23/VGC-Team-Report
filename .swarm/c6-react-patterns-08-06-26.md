# C6 — React 19 / Next.js 16 Patterns Audit (2026-06-08)

Scope: Read-only audit of /home/user/VGC-Team-Report/src for React 19 / Next.js 16 anti-patterns.
Excluded from changes: public/sw.js, src/app/globals.css, src/app/page.tsx, src/components/report/SlideNavControls.tsx, src/components/ui/SwipeHint.tsx, src/hooks/useHomePage.ts.

---

## Critical fixes (bug risks)

### 1. `key={index}` in PokemonDropdown — real reorder bug surface
**File:** /home/user/VGC-Team-Report/src/components/report/PokemonDropdown.tsx:127-133

```tsx
{yourPokemon.map((mon, index) => {
  const isTaken = index !== selectedIndex && takenIndices.includes(index);
  ...
  return (
    <button key={index} ... >
```

`yourPokemon` is the team array — actively reorderable (drag-and-drop in MatchupSheet, swap in PokemonCard) and editable. Using `index` as a key when items can move means React reuses the wrong DOM nodes after a reorder, which can keep stale `disabled` / focus / selection state on the wrong row. Use a stable per-mon key: the species key (already computed in useHomePage as `speciesKeys[index]`) or `${mon.parsed.species}-${index}` would be safer than raw index.

### 2. `key={index}` in FAQ page — low impact (static list, OK in practice)
**File:** /home/user/VGC-Team-Report/src/app/faq/page.tsx:169-170

`FAQ_ITEMS` is a static `const` array that never reorders, so this is functionally safe. Still a soft win: switch to `key={item.question}` (questions are unique) so a future reordering doesn't introduce a subtle bug.

### 3. Missing-deps escape hatches (review each one)
Three `eslint-disable-next-line react-hooks/exhaustive-deps` outside the excluded files were *not* found — only the three known ones in `src/app/page.tsx:331`, `src/hooks/useHomePage.ts:88` and `:192`, all in excluded files. **No critical missing-deps issues outside the avoid list.**

### 4. State updates after unmount — `ReportCard` and `DashboardContent`
- /home/user/VGC-Team-Report/src/components/explore/ReportCard.tsx:85-110 — two `useEffect` blocks `fetch(...).then(setLikeCount/setLiked/setBookmarked)` with **no AbortController and no `cancelled` guard**. ReportCard is rendered N times in /explore and /dashboard list views; when the user paginates or switches tabs quickly, in-flight fetches will `setState` on unmounted components. React 19 swallows the warning, but it's still wasted work + a real bug pattern if any state is consumed by parents.
- /home/user/VGC-Team-Report/src/app/dashboard/DashboardContent.tsx:53-108 — 7 `fetch(...).then(setX)` chains keyed on `[user, tab]`. Rapidly toggling tabs causes the previous tab's late response to overwrite the new tab's data (genuine stale-data bug). `Navbar.tsx:208` already shows the correct AbortController pattern that should be copied here.

### 5. Stale closure in `useDarkMode.toggleDarkMode`
**File:** /home/user/VGC-Team-Report/src/hooks/useDarkMode.ts:60

```ts
const toggleDarkMode = useCallback(() => setDarkModeValue(!darkModeValue), []);
```

`darkModeValue` is a module-scope `let`, so the toggle reads the current value at call time and *does* work — but the empty deps array is misleading. If a future refactor moves `darkModeValue` into closure scope this becomes a stale-closure bug. Replace with `setDarkModeValue((v) => !v)` or remove the useCallback entirely.

---

## Cleanup opportunities

### `'use client'` markers on pure server-renderable files

- **/home/user/VGC-Team-Report/src/components/social/CreatorLink.tsx** — entire component is a static `<a>` with no state, no event handlers, no hooks, no browser API. The `"use client"` directive can be deleted, which removes it from the client bundle entirely (used in ReportCard / DashboardContent lists, so multiplies savings). Confirmed by reading lines 1-32.

(All other audited `"use client"` files genuinely need it — hooks, onClick, useAuth, useUser, refs, browser APIs, etc. PageFooter has `onClick`. PageNavbar uses `useAuth`. PokemonSprite uses useState/useEffect. ItemIcon uses useState/useRef. CreatorLink is the only false positive.)

### Oversized files (split candidates, >300 lines)

| File | Lines | Suggested split |
|------|-------|----------------|
| /home/user/VGC-Team-Report/src/app/page.tsx | 1868 | **excluded** |
| /home/user/VGC-Team-Report/src/app/dashboard/DashboardContent.tsx | 1219 | Extract per-tab panels: `DraftsTab`, `MyReportsTab`, `SavedTab`, `FeedTab`, `CollabTab`, `CollectionsTab`, `AnalyticsTab`, `TrashTab`. Each tab branch in `useEffect` is independent. |
| /home/user/VGC-Team-Report/src/components/report/PokemonDetailSlide.tsx | 963 | Extract `StatBarRow`, `EvSpreadEditor`, `MoveList`, `CalcCategorySection`. The CATEGORY_CONFIG-driven panels are a natural sub-component boundary. |
| /home/user/VGC-Team-Report/src/components/ui/ShareModal.tsx | 933 | Extract `EmbedSnippetPanel`, `OpenGraphPreview`, `VisibilitySection`. Focus trap useEffect is fine. |
| /home/user/VGC-Team-Report/src/components/layout/Navbar.tsx | 890 | The props interface alone is 100+ lines. Extract `NavbarShareSection`, `NavbarExportMenu`, `NavbarPresentationControls`. |
| /home/user/VGC-Team-Report/src/components/report/TeamOverview.tsx | 850 | Extract `TeamHeader`, `TeamTagsRow`, `TeamMetaEditor`. |
| /home/user/VGC-Team-Report/src/components/report/MatchupPlanSlide.tsx | 779 | `GamePlanSection` already inline; promote it to its own file. |
| /home/user/VGC-Team-Report/src/components/explore/ExploreFilters.tsx | 719 | Each filter dropdown (regulation, archetype, species, placement) is independent — split into individual filter components. |
| /home/user/VGC-Team-Report/src/components/report/SpeedTierChart.tsx | 675 | Extract meta-threat constants + bar rendering into helpers. |
| /home/user/VGC-Team-Report/src/components/input/PasteInput.tsx | 670 | Extract sample-team dropdown + multi-import detection panels. |

### Unnecessary `useCallback` wrappers

These wrap an already-stable setter and add no value:
- /home/user/VGC-Team-Report/src/hooks/useTheme.ts:196 — `useCallback((theme) => setTheme(theme), [])` → just pass `setTheme`.
- /home/user/VGC-Team-Report/src/hooks/useShareFlow.ts:125 — `useCallback(() => setPublishError(null), [])` → pass an arrow inline or a top-level stable fn.
- /home/user/VGC-Team-Report/src/hooks/useDarkMode.ts:59-60 — see Critical #5.
- /home/user/VGC-Team-Report/src/hooks/useHomePage.ts:223 — **excluded**.

These are micro-perf nothing-burgers but add cognitive load.

### Direct DOM queries (mostly justified)
- 16 hits for `querySelector` / `getElementById`. All audited cases are legitimate: focus traps in modals (ShareModal, OTSSheetModal, NotificationBell, WhatsNewModal), `data-walkthrough` / `data-diff-field` attribute targeting outside the component tree (DiffNavigator, WalkthroughOverlay, useWalkthrough), or tablist keyboard nav (ChangelogContent). useRef would not work for these — refs can't reach across component boundaries to elements added by other components.
- **One exception:** /home/user/VGC-Team-Report/src/app/page.tsx:412,492,514,517 — excluded.

### Server actions vs API routes
The app uses 62 API routes and **zero** server actions (`grep "use server"` returns nothing). The API-route pattern is correct here because most routes rely on `apiGuard()` for rate-limiting + CSRF + Clerk auth context. Migrating to server actions would lose that uniform guard layer. **Recommend keeping the current pattern** — not flagging this as a cleanup.

### `useState` that could be `useRef`
None found in the audited files — values that mutate without rendering (snapshot timers, AbortControllers, focus-tracking flags) already use `useRef` consistently (e.g. `wasOpenRef` in NotificationBell:77, `creatorModeBeforePresent` in useHomePage:78, `snapshotTimerRef` in useHomePage:180).

---

## Top 5 quick wins (each <50 LOC)

1. **Remove `"use client"` from CreatorLink.tsx** (1 LOC delete) — `src/components/social/CreatorLink.tsx:1`. Pure presentational, no hooks/events/browser APIs. Frees a leaf from the client bundle; impacts every report card render in /explore and /dashboard.

2. **Fix `key={index}` in PokemonDropdown** (~3 LOC) — `src/components/report/PokemonDropdown.tsx:133`. Switch to `key={\`${mon.parsed.species}-${index}\`}` (or pass speciesKey from parent). Eliminates stale-DOM bug on team reorder/swap.

3. **Add AbortController to DashboardContent fetches** (~15 LOC) — `src/app/dashboard/DashboardContent.tsx:61-108`. Same pattern as Navbar.tsx:208 — wrap each tab's fetch in an AbortController and call `ac.abort()` in the effect's cleanup. Prevents stale-tab data races (real bug when users tab-switch quickly).

4. **Add AbortController to ReportCard fetches** (~10 LOC) — `src/components/explore/ReportCard.tsx:85-110`. Two effects, both fetch + setState with no cleanup. ReportCard is rendered ~20-50 times per page; in-flight requests on unmount are wasted work + setState-after-unmount warnings.

5. **Drop pointless `useCallback` wrappers around stable setters** (~6 LOC across 3 files) — `src/hooks/useTheme.ts:196`, `src/hooks/useShareFlow.ts:125`, `src/hooks/useDarkMode.ts:59-60`. Replace with the bare setter (or `setX((v) => !v)` updater form for the toggle). Removes one stale-closure foot-gun.

---

## 200-word summary

The codebase is in solid shape for React 19 / Next 16. I scanned 109 client files and roughly 28K lines of TSX. Total findings: **one real bug-risk (`key={index}` on a reorderable list in PokemonDropdown)**, **two missing-cleanup patterns (DashboardContent + ReportCard fetches)**, **one mis-marked client component (CreatorLink)**, **a handful of pointless useCallback wrappers**, and **9 oversized components (>500 LOC) ripe for splitting**. The three `react-hooks/exhaustive-deps` disables are all inside the avoid-modify list. No useState-should-be-useRef cases found — `useRef` is used consistently for non-rendering values. All 16 `querySelector` / `getElementById` calls are legitimate (focus traps, cross-component data-attribute targeting, tablist nav). No server actions exist, but the API-route pattern is correct given the unified `apiGuard()` layer. **Top 3 to ship tonight:** (1) delete `"use client"` from CreatorLink, (2) fix the `key={index}` in PokemonDropdown to a species-key composite, (3) add AbortController cleanup to DashboardContent's per-tab fetches. All three are mechanical, low-risk, total <30 LOC changed, and each fixes a real (if minor) class of bug.
