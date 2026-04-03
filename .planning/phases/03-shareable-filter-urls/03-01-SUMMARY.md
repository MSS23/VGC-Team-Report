---
phase: 03-shareable-filter-urls
plan: 01
subsystem: ui
tags: [react, hooks, url-params, URLSearchParams, replaceState, explore, filters, vitest]

# Dependency graph
requires:
  - phase: 02-advanced-filter-drawer
    provides: ExploreFilters component with SearchCategory type and full filter props interface
provides:
  - useExploreUrlSync hook: bidirectional URL <-> filter state sync for all 9 explore filters
  - parseFiltersFromUrl pure function: URL search string -> FilterState
  - buildUrlSearch pure function: FilterState -> URL search string (omitting defaults)
  - ExploreContent refactored to use URL-synced filter state
affects: [03-02, explore-page, shareable-urls]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "URL-as-state: filter state sourced from URLSearchParams, replaceState used to keep URL current without history pollution"
    - "Pure function extraction for testability: parseFiltersFromUrl/buildUrlSearch exported separately from hook for unit testing without mocking window/React"
    - "Default-omission pattern: only non-default filter values written to URL for clean shareable links"

key-files:
  created:
    - src/hooks/useExploreUrlSync.ts
    - src/hooks/__tests__/useExploreUrlSync.test.ts
  modified:
    - src/components/explore/ExploreContent.tsx

key-decisions:
  - "Use replaceState not pushState for filter changes — prevents history pollution on every keystroke"
  - "Export parseFiltersFromUrl and buildUrlSearch as pure functions — enables unit tests without window/React mocks"
  - "Only non-default values written to URL — query='', sort='newest', searchCategory='all', booleans=false all omitted"
  - "URL param keys match existing API param keys (q, sort, searchType, regulation, eventType, archetype, species, placement, following)"

patterns-established:
  - "URL sync hook pattern: useState initialized from window.location.search, useEffect syncs state -> URL"
  - "FilterState interface + ExploreUrlSyncResult: typed contracts for downstream consumers"

requirements-completed: [URL-01, URL-02, URL-03, UX-06]

# Metrics
duration: 15min
completed: 2026-04-03
---

# Phase 03 Plan 01: Shareable Filter URLs — URL Sync Engine Summary

**useExploreUrlSync hook with bidirectional URL-filter sync via URLSearchParams/replaceState, replacing 9 individual useState calls in ExploreContent**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-04-03T13:02:33Z
- **Completed:** 2026-04-03T13:17:00Z
- **Tasks:** 2 (Task 1: TDD hook creation, Task 2: ExploreContent integration)
- **Files modified:** 3

## Accomplishments
- Created `useExploreUrlSync` hook that initializes filter state from URL on mount and syncs all changes back via `window.history.replaceState`
- Extracted `parseFiltersFromUrl` and `buildUrlSearch` as pure functions — 7 unit tests all pass (vitest)
- Refactored ExploreContent to use the hook, replacing 9 individual `useState` filter declarations with a single destructured hook call
- URL remains clean: default values (query="", sort="newest", searchCategory="all", etc.) are never written to the URL

## Task Commits

Each task was committed atomically:

1. **Task 1: Create useExploreUrlSync hook** - `176a192` (feat)
2. **Task 2: Integrate useExploreUrlSync into ExploreContent** - `b713ea6` (feat)

**Plan metadata:** _(docs commit follows)_

_Note: Task 1 was TDD — tests written first (RED), then hook implemented (GREEN)_

## Files Created/Modified
- `src/hooks/useExploreUrlSync.ts` - Hook + pure parse/build functions; exports `useExploreUrlSync`, `parseFiltersFromUrl`, `buildUrlSearch`, `FilterState`, `ExploreUrlSyncResult`
- `src/hooks/__tests__/useExploreUrlSync.test.ts` - 7 unit tests covering defaults, full parse, boolean following param, defaults-omission, round-trip
- `src/components/explore/ExploreContent.tsx` - Filter state now sourced from `useExploreUrlSync` instead of 9 individual useState calls

## Decisions Made
- `replaceState` over `pushState`: prevents browser history stack pollution on each filter keystroke
- Pure function extraction (`parseFiltersFromUrl`, `buildUrlSearch`): makes hook logic testable without mocking `window` or React hooks
- Default-omission strategy: only non-default values appear in URL, keeping shared links clean
- URL param keys preserved to match existing API route params (`q`, `sort`, `searchType`, etc.)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Pre-existing build failure in `npm run build` unrelated to this plan (Sentry/OpenTelemetry module-not-found errors in `global-error.tsx`). Confirmed pre-existing by stashing changes and reproducing the same failure. TypeScript (`npx tsc --noEmit`) passes cleanly.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- URL sync engine is complete and tested — Phase 03 Plan 02 can implement the share/copy URL button UI
- The hook is the single source of truth for all explore filter state; Plan 02 only needs to read `window.location.href` to provide a shareable URL
- No blockers

---
*Phase: 03-shareable-filter-urls*
*Completed: 2026-04-03*
