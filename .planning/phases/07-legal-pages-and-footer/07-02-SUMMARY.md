---
phase: 07-legal-pages-and-footer
plan: "02"
subsystem: ui
tags: [legal, terms-of-service, next.js, static-page]

# Dependency graph
requires:
  - phase: 07-legal-pages-and-footer
    provides: "PrivacyNavbar pattern and /privacy page structure to clone"
provides:
  - "/terms route with Terms of Service page"
  - "TermsNavbar component with activePage=terms"
affects: [07-legal-pages-and-footer]

# Tech tracking
tech-stack:
  added: []
  patterns: ["Legal page pattern reused for terms (server component + client navbar wrapper)"]

key-files:
  created:
    - src/app/terms/page.tsx
    - src/app/terms/TermsNavbar.tsx
  modified:
    - src/components/layout/PageNavbar.tsx

key-decisions:
  - "Added 'terms' to PageNavbar activePage union type to support new route"

patterns-established:
  - "Legal pages follow identical structure: Metadata export, client Navbar wrapper, max-w-5xl main, PageFooter hideFeedback"

requirements-completed: [LEGAL-02]

# Metrics
duration: 2min
completed: 2026-04-05
---

# Phase 7 Plan 02: Terms of Service Summary

**Terms of Service page at /terms with 9 sections covering acceptable use, Pokemon IP disclaimer, $0 liability cap, user content ownership, and governing law (England and Wales)**

## Performance

- **Duration:** 2 min
- **Started:** 2026-04-05T14:53:48Z
- **Completed:** 2026-04-05T14:56:06Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Created TermsNavbar component cloning PrivacyNavbar pattern with activePage="terms"
- Created full Terms of Service page with 9 sections in plain English question-style headers
- All required legal content: acceptable use, content ownership, Pokemon trademark, as-is liability ($0 cap), termination, governing law

## Task Commits

Each task was committed atomically:

1. **Task 1: Create TermsNavbar component** - `695e549` (feat)
2. **Task 2: Create /terms page with Terms of Service content** - `d75706f` (feat)

## Files Created/Modified
- `src/app/terms/TermsNavbar.tsx` - Client navbar wrapper for terms page (14 lines)
- `src/app/terms/page.tsx` - Terms of Service page with 9 content sections (150 lines)
- `src/components/layout/PageNavbar.tsx` - Added "terms" to activePage union type

## Decisions Made
- Added "terms" to the PageNavbar activePage prop union type (required for TypeScript to accept the new page)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added "terms" to PageNavbar activePage union type**
- **Found during:** Task 1 (TermsNavbar component)
- **Issue:** TypeScript rejected activePage="terms" because PageNavbar's prop type didn't include "terms" in its union
- **Fix:** Added "terms" to the activePage union type in PageNavbar.tsx
- **Files modified:** src/components/layout/PageNavbar.tsx
- **Verification:** npx tsc --noEmit passes clean
- **Committed in:** 695e549 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Necessary type extension for new route. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Known Stubs
None - all sections contain final content.

## Next Phase Readiness
- /terms route is live and static-rendered
- Ready for Plan 03 (footer link additions) to wire Terms link in PageFooter
- Privacy and Terms pages now share identical visual structure

---
*Phase: 07-legal-pages-and-footer*
*Completed: 2026-04-05*

## Self-Check: PASSED
