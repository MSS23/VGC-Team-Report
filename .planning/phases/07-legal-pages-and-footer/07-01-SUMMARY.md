---
phase: 07-legal-pages-and-footer
plan: "01"
subsystem: legal
tags: [gdpr, ccpa, privacy-policy, footer, compliance]

# Dependency graph
requires: []
provides:
  - "GDPR Art. 13-compliant privacy policy at /privacy"
  - "Footer with Terms link and Cookie Settings button on every page"
affects: [08-cookie-consent, 09-data-rights, 07-02-terms]

# Tech tracking
tech-stack:
  added: []
  patterns: [question-style-h2-headers, dpa-link-pattern, legal-base-per-category]

key-files:
  created: []
  modified:
    - src/app/privacy/page.tsx
    - src/components/layout/PageFooter.tsx

key-decisions:
  - "Used question-style h2 headers for approachable plain-English tone"
  - "Named all 4 processors with DPA links inline rather than separate table"
  - "Cookie Settings button dispatches CustomEvent for Phase 8 banner to listen"

patterns-established:
  - "Legal page structure: Metadata export, Navbar wrapper, max-w-5xl main, PageFooter hideFeedback"
  - "DPA link pattern: processor name + View [Name] DPA link"

requirements-completed: [LEGAL-01, LEGAL-03, SITE-01, SITE-02]

# Metrics
duration: 2min
completed: 2026-04-05
---

# Phase 7 Plan 01: Privacy Policy and Footer Links Summary

**GDPR Art. 13-compliant privacy policy with 4 named processors, Art 6 legal bases, explicit retention periods, CCPA disclosure, and footer Terms + Cookie Settings links**

## Performance

- **Duration:** 2 min
- **Started:** 2026-04-05T14:53:44Z
- **Completed:** 2026-04-05T14:56:07Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Rewrote /privacy with full GDPR Article 13 compliance: 10 sections, 288 lines
- Named all 4 third-party processors (Clerk, Vercel, Neon, Upstash) with DPA links
- Stated Article 6 legal bases per data category (Art 6(1)(a), (b), (f))
- Added explicit retention periods (not "per vendor policy")
- Added CCPA Do Not Sell disclosure and GDPR rights with ICO complaint path
- Extended PageFooter with Terms nav link and Cookie Settings button

## Task Commits

Each task was committed atomically:

1. **Task 1: Rewrite /privacy with full GDPR Art. 13 compliance** - `f76e483` (feat)
2. **Task 2: Add Terms and Cookie Settings links to PageFooter** - `536f7d6` (feat)

## Files Created/Modified
- `src/app/privacy/page.tsx` - Full GDPR-compliant privacy policy (288 lines)
- `src/components/layout/PageFooter.tsx` - Added Terms link to NAV_LINKS and Cookie Settings button

## Decisions Made
- Used question-style h2 headers ("What data do we collect?") for approachable tone per CONTEXT.md D-02
- Listed processors inline with DPA links rather than a separate comparison table
- Cookie Settings button dispatches `open-cookie-settings` CustomEvent (Phase 8 will add the listener)
- Kept existing Pokemon trademark disclaimer wording essentially unchanged

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Known Stubs
None - all content is real, no placeholders.

## Next Phase Readiness
- /privacy URL is live for Phase 8 cookie consent banner to reference
- Cookie Settings button is wired to dispatch event; Phase 8 banner will add the listener
- /terms page does not exist yet (Plan 07-02 will create it)
- Footer Terms link will 404 until Plan 07-02 completes

---
*Phase: 07-legal-pages-and-footer*
*Completed: 2026-04-05*
