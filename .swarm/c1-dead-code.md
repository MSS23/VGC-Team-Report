# C1 — Dead Code Scan

**Date:** 2026-05-10

## Summary

The codebase is well-pruned. No genuinely orphaned components, dead utility functions, or orphaned routes were found.

## Findings

### Components
All components in `src/components/` have at least one external import. Least-used but active:
- `SwipeHint`, `ShortcutHintOverlay`, `EditFab`, `ShareViewCTA`, `DisplayTogglePill` — all imported in layout.tsx, page.tsx, or Navbar.tsx.

### Utility Functions (`src/lib/utils/`)
Import counts:
- `extract-species`: 15 | `sprite-slug`: 11 | `random-accent`: 11
- `paste-edit`: 1 | `sprite-url`: 1 | `game-plan-helpers`: 1 | `diff-state`: 1

### Library Exports (`src/lib/sharing/`)
- `url-codec`: 7 imports | `redact-paste`: 3+ imports | `showdown-parser`: 7 imports

### Routes
All pages linked in navigation or serve as API/dynamic routes. No orphaned routes.

### Tech Debt Markers
Zero `TODO`, `FIXME`, `HACK`, or `XXX` comments in active code.

## Verdict
Nothing is safe to delete. Codebase is well-maintained (prior changelog notes 464+ lines deleted in previous cleanups). No cleanup ticket needed.
