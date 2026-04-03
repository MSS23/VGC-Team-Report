---
phase: 06-enhanced-report-cards
plan: 01
subsystem: ui
tags: [react, tailwind, next.js, report-card, explore]

# Dependency graph
requires:
  - phase: 05-tournament-results-mode
    provides: getPlacementStyle with gold/silver/bronze tiered badge styling
provides:
  - Enhanced ReportCard with larger sprites, archetype badges below title, always-visible regulation corner pill, creator link underline
affects: [explore, report-cards]

# Tech tracking
tech-stack:
  added: []
  patterns: [absolute-positioned corner pill for always-visible metadata, archetype badges moved above creator row for visual hierarchy]

key-files:
  created: []
  modified:
    - src/components/explore/ReportCard.tsx

key-decisions:
  - "Regulation moved to absolute top-right corner pill — always visible without hover, z-10 to avoid card overlap"
  - "Archetype badges repositioned below title row (before creator) for scannability — font bumped to text-[10px]"
  - "Creator name baseline color is text-accent/80 (not text-text-secondary) to visually signal it is a link"
  - "Tags section now shows only eventType — regulation has its own corner position, archetypes have their own row"

patterns-established:
  - "Absolute-positioned corner pill: absolute top-2 right-2 z-10 pattern for always-visible card metadata"
  - "Creator link pattern: text-accent/80 hover:text-accent hover:underline for clickable creator names"

requirements-completed: [CARD-01, CARD-02, CARD-03, CARD-04, CARD-05]

# Metrics
duration: 8min
completed: 2026-04-03
---

# Phase 6 Plan 1: Enhanced Report Cards Summary

**ReportCard restructured with larger sprites (w-10/w-12), archetype badges below title, always-visible regulation corner pill (absolute top-right), and creator name styled as a link**

## Performance

- **Duration:** 8 min
- **Started:** 2026-04-03T12:46:36Z
- **Completed:** 2026-04-03T12:50:09Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments

- Pokemon sprite images increased from w-8/w-10 to w-10/w-12 with a subtle bg-surface-alt/30 container for visual prominence
- Archetype badges repositioned to appear directly below tournament name (before creator row), show up to 3 (was 2), font bumped to text-[10px]
- Regulation tag moved to always-visible absolute position in top-right corner of card (absolute top-2 right-2 z-10) — no hover required
- Creator name now styled as text-accent/80 with hover:text-accent hover:underline to clearly signal it is a clickable link
- Phase 05 gold/silver/bronze placement badge styling preserved exactly (getPlacementStyle unchanged)

## Task Commits

Each task was committed atomically:

1. **Task 1: Enhance ReportCard visual hierarchy** - `0709355` (feat)
2. **Task 2: Build verification** - no separate commit (verification-only, no code changes)

**Plan metadata:** (docs commit — see final commit below)

## Files Created/Modified

- `src/components/explore/ReportCard.tsx` — Restructured card layout: larger sprites, archetype row, regulation corner pill, creator link styling

## Decisions Made

- Regulation moved to absolute top-right corner pill so it is always visible on every card without hover or expansion (CARD-05 requirement)
- Tags section simplified to eventType only after extracting archetype and regulation to dedicated positions — prevents duplication and clutter
- Creator link uses text-accent/80 as base color (not text-text-secondary) to make the link affordance visible even before hover
- outer motion.a wrapper received `relative` class to anchor the absolute-positioned regulation pill

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

Pre-existing build failure in `src/app/global-error.tsx` (Turbopack/Sentry/OpenTelemetry module resolution). Confirmed pre-existing by testing with stashed changes — identical failure exists on HEAD without our changes. Logged as out-of-scope. TypeScript (`npx tsc --noEmit`) passes clean with zero errors.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- ReportCard enhancements complete — ready for Phase 06 Plan 02 (any remaining enhanced card work)
- All visual requirements CARD-01 through CARD-05 met
- ExploreReport interface unchanged — no API or data changes needed

---
*Phase: 06-enhanced-report-cards*
*Completed: 2026-04-03*
