---
phase: 02-advanced-filter-drawer
plan: 01
subsystem: ui
tags: [react, motion, framer-motion, tailwind, accessibility, filter, drawer, bottom-sheet]

# Dependency graph
requires: []
provides:
  - AdvancedFilterDrawer component (mobile bottom sheet + desktop dropdown)
  - Refactored ExploreFilters with decluttered primary bar
  - More filters button with animated count badge
  - Full keyboard/screen reader accessibility for filter drawer
affects:
  - 02-02 (shareable filter URLs — may need to include drawer filter state)
  - future phases that touch ExploreFilters or filter state

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Mobile bottom sheet pattern using motion/react AnimatePresence + useReducedMotion
    - Desktop dropdown panel anchored via relative/absolute positioning on sticky bar
    - useMediaQuery inline hook for responsive behavior in JS
    - Count badge animation with AnimatePresence for appear/disappear

key-files:
  created:
    - src/components/explore/AdvancedFilterDrawer.tsx
  modified:
    - src/components/explore/ExploreFilters.tsx

key-decisions:
  - "Drawer open/close is local state in ExploreFilters — not lifted to ExploreContent"
  - "Pre-existing global-error.tsx build failure noted as out-of-scope; tsc passes cleanly"
  - "useMediaQuery inline hook used rather than CSS-only approach to switch drawer variants"

patterns-established:
  - "Pattern 1: Bottom sheet pattern — fixed bottom-0 with motion.div y-axis animation, backdrop with blur, drag handle decorative pill"
  - "Pattern 2: Reduced motion — useReducedMotion() collapses all animations to 100ms opacity fade"
  - "Pattern 3: Click-outside for desktop dropdown via useEffect document mousedown listener with setTimeout(0) to skip the triggering click"

requirements-completed:
  - UX-01
  - UX-02
  - UX-03
  - UX-04
  - UX-05

# Metrics
duration: 4min
completed: 2026-04-03
---

# Phase 2 Plan 01: Advanced Filter Drawer Summary

**AdvancedFilterDrawer with mobile bottom sheet + desktop dropdown, decluttered ExploreFilters primary bar, and animated More filters badge**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-04-03T09:09:56Z
- **Completed:** 2026-04-03T09:13:31Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Created `AdvancedFilterDrawer.tsx` — dual-variant component (mobile full-width bottom sheet / desktop dropdown panel) with AnimatePresence animations, useReducedMotion support, focus trap, Escape key handler, click-outside handler, and all three advanced filter controls (placement, event type, following toggle)
- Refactored `ExploreFilters.tsx` — removed placement select, event type select, and following toggle from primary bar; added "More filters" button with animated count badge; integrated AdvancedFilterDrawer as child component; added `relative` to root div for desktop dropdown anchor
- Primary filter bar now contains exactly: search categories, search input, sort dropdown, species input, regulation dropdown, archetype chips, and "More filters" button

## Task Commits

Each task was committed atomically:

1. **Task 1: Create AdvancedFilterDrawer component** - `04a32e1` (feat)
2. **Task 2: Refactor ExploreFilters to integrate drawer** - `9a8d04b` (feat)

**Plan metadata:** (pending final commit)

## Files Created/Modified

- `src/components/explore/AdvancedFilterDrawer.tsx` — New drawer/sheet component with mobile bottom sheet and desktop dropdown variants, full a11y, animation, and filter controls
- `src/components/explore/ExploreFilters.tsx` — Refactored to declutter primary bar, add More filters button with badge, integrate AdvancedFilterDrawer

## Decisions Made

- Drawer open/close is local state inside `ExploreFilters` — not lifted to `ExploreContent` (filter values remain in ExploreContent as before)
- `useMediaQuery` inline hook used for JS-driven variant switching (not CSS-only) so the correct ARIA role (dialog vs region) and animation can be applied per breakpoint
- Pre-existing `global-error.tsx` build failure (Sentry/OpenTelemetry dependency issue) identified as out-of-scope; `tsc --noEmit` passes cleanly on all project files

## Deviations from Plan

None — plan executed exactly as written. The `global-error.tsx` build failure is a pre-existing issue not caused by or related to our changes (verified by stash + build test).

## Issues Encountered

- `npm run build` fails with Turbopack errors in `src/app/global-error.tsx` — pre-existing issue related to Sentry/OpenTelemetry module resolution, present before any changes in this plan. TypeScript type-check (`npx tsc --noEmit`) passes cleanly. Documented as out-of-scope.

## Known Stubs

None — all filter controls are fully wired to their callback props. The drawer correctly passes placement, eventType, and followingOnly state changes back to ExploreContent via the existing prop callbacks.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Advanced filter drawer ships placement, event type, and following filters with full mobile/desktop responsive behavior
- Phase 02-02 (shareable filter URLs) can now include drawer filter state (placement, eventType, followingOnly) in URL params since these values still live in ExploreContent state
- No blockers for next plan

---
*Phase: 02-advanced-filter-drawer*
*Completed: 2026-04-03*
