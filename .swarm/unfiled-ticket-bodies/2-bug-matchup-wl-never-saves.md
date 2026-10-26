## Source
`.swarm/c1-dead-code-26-10-26.md`. Surfaced by a dead-code scan, but this is a user-facing bug rather than dead code.

## Finding
`src/components/report/MatchupPlanSlide.tsx` (lines ~406, ~432, ~447) destructures an `onResultChange` prop and then never calls it. The parent passes a real handler.

**Symptom for a user: recording the result of a game in a match-up plan does nothing — the W/L is lost.**

C1 flagged this as needing human eyes rather than deletion, which is right: the prop is wired from the parent and the handler exists, so this is an unfinished feature, not leftovers. Deleting the prop would cement the bug.

## Fix
Determine the intended behaviour and call the handler, or — if the feature was abandoned — remove it deliberately from both sides and say so. Confirm which by checking the parent's handler and whether anything persists the result.

## Note
`MatchupPlanSlide.tsx` was edited on the 26-10-26 nightly branch for VGC-292 (Champions stat display), so rebase on that first.

---
*Filed automatically by the overnight swarm, run 26-10-26.*
