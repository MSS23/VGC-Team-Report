---
phase: 04-pokemon-exclude-filter
plan: 01
subsystem: ui, api
tags: [nextjs, react, typescript, postgres, sql, url-sync, explore-filters]

# Dependency graph
requires:
  - phase: 03-shareable-filter-urls
    provides: useExploreUrlSync hook with FilterState, parseFiltersFromUrl, buildUrlSearch, URL bidirectional sync
provides:
  - excludeSpecies filter end-to-end: SQL NOT ILIKE filtering in API, URL state management, primary bar input with red styling, advanced drawer input
  - setExcludeSpecies setter exported from useExploreUrlSync
  - Red/destructive visual distinction for exclude vs include filter inputs
affects:
  - phase 05 (any phase touching ExploreFilters, ExploreContent, or AdvancedFilterDrawer props interfaces)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "NOT ILIKE reduce pattern mirrors include ILIKE pattern for exclude SQL conditions"
    - "Red accent (red-400/red-500) as visual language for destructive/exclude filters"
    - "excludeSpecies counted in advancedFilterCount and tracked in hasActiveFilters"

key-files:
  created: []
  modified:
    - src/app/api/explore/route.ts
    - src/hooks/useExploreUrlSync.ts
    - src/components/explore/ExploreContent.tsx
    - src/components/explore/ExploreFilters.tsx
    - src/components/explore/AdvancedFilterDrawer.tsx
    - src/hooks/__tests__/useExploreUrlSync.test.ts

key-decisions:
  - "Exclude filter SQL uses NOT ILIKE per species, mirroring include pattern exactly"
  - "Red-400 color scheme for exclude inputs visually distinguishes them from include inputs without extra labels needed"
  - "excludeSpecies counted in advancedFilterCount (drawer badge) since it also lives in the drawer"
  - "Tests updated with excludeSpecies field to maintain type correctness and added dedicated round-trip test"

patterns-established:
  - "Include filter: accent color ring (ring-accent/40, border-accent)"
  - "Exclude filter: red color ring (ring-red-400/40, border-red-400) with X-circle icon prefix"

requirements-completed: [FILT-01, FILT-02, FILT-03, FILT-04]

# Metrics
duration: 15min
completed: 2026-04-03
---

# Phase 04 Plan 01: Pokemon Exclude Filter Summary

**Pokemon exclude filter end-to-end: NOT ILIKE SQL filtering in API, URL-synced state in hook, and red-accented inputs on both primary bar and advanced drawer**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-04-03T12:20:00Z
- **Completed:** 2026-04-03T12:35:00Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- API accepts `excludeSpecies` query param and filters out teams whose paste contains any excluded Pokemon using `NOT ILIKE` SQL conditions, included in cache key
- URL sync hook (`useExploreUrlSync`) manages `excludeSpecies` as first-class filter state: parsed from URL on load, serialized on change, `setExcludeSpecies` setter exported
- ExploreContent wires excludeSpecies to both the API fetch params and ExploreFilters component
- Primary filter bar shows a red-accented exclude input below the include input with X-circle icon prefix
- Advanced filter drawer shows a full-width exclude species input at the top of the grid with red label when active
- advancedFilterCount badge and hasActiveFilters both updated to track excludeSpecies
- Clear advanced filters button clears excludeSpecies along with other advanced filters
- Test suite updated: all buildUrlSearch call sites include excludeSpecies, new round-trip test added

## Task Commits

Each task was committed atomically:

1. **Task 1: Add excludeSpecies to API route + URL sync hook + ExploreContent wiring** - `fc8b08d` (feat)
2. **Task 2: Add exclude species UI to primary filter bar and advanced drawer with visual distinction** - `6cd5a7c` (feat)

## Files Created/Modified
- `src/app/api/explore/route.ts` - Added filterExcludeSpecies param parsing, NOT ILIKE SQL condition, cache key update
- `src/hooks/useExploreUrlSync.ts` - Added excludeSpecies to FilterState, DEFAULTS, parseFiltersFromUrl, buildUrlSearch, setExcludeSpecies setter
- `src/components/explore/ExploreContent.tsx` - Destructures excludeSpecies/setExcludeSpecies, passes to fetch and ExploreFilters
- `src/components/explore/ExploreFilters.tsx` - Props interface, hasActiveFilters, advancedFilterCount, exclude input UI with red styling, passes to AdvancedFilterDrawer
- `src/components/explore/AdvancedFilterDrawer.tsx` - Props interface, filterContent exclude input at top of grid, advancedFilterCount, clear handler
- `src/hooks/__tests__/useExploreUrlSync.test.ts` - Updated all FilterState objects with excludeSpecies field, added excludeSpecies-specific and round-trip tests

## Decisions Made
- NOT ILIKE reduce pattern mirrors include ILIKE pattern exactly — consistent and easy to maintain
- Red-400 color scheme chosen for exclude inputs to create clear visual language without needing extra "Exclude:" prefix labels
- excludeSpecies counted toward advancedFilterCount since the canonical location for it is also in the drawer

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Updated test file to include excludeSpecies in FilterState objects**
- **Found during:** Task 1 (TypeScript check after hook changes)
- **Issue:** `buildUrlSearch` call sites in test file passed FilterState objects missing the new required `excludeSpecies` field, causing type errors
- **Fix:** Added `excludeSpecies: ""` to all existing test FilterState objects; added new dedicated `excludeSpecies` URL encoding test; updated round-trip test to include excludeSpecies
- **Files modified:** src/hooks/__tests__/useExploreUrlSync.test.ts
- **Verification:** `npx tsc --noEmit` passes with zero errors
- **Committed in:** fc8b08d (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - type error in test file caused by FilterState interface change)
**Impact on plan:** Necessary to keep tests type-correct after expanding FilterState. No scope creep — tests now cover excludeSpecies behavior.

## Issues Encountered
- Pre-existing Turbopack build error in `src/app/global-error.tsx` (Sentry/opentelemetry module resolution) confirmed to be unrelated to this plan's changes by baseline check. TypeScript (`npx tsc --noEmit`) passes cleanly.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Exclude filter fully operational across all layers: API, state, URL sync, primary bar, drawer
- ExploreFilters and AdvancedFilterDrawer prop interfaces stable for Phase 05
- No blockers for next phase

---
*Phase: 04-pokemon-exclude-filter*
*Completed: 2026-04-03*
