# [A11y] SpeedTierChart uses unconditional text-purple-400 at 2.65:1 - regression from 1fa2e4a

- **Priority:** High
- **Labels:** auto-research, Accessibility
- **Target state:** Backlog
- **Status:** NOT FILED — Linear workspace is at its free-plan active-issue limit

## Source

`.swarm/r8-accessibility-02-11-26.md`. Flagged as a **regression**, not a legacy issue.

## Finding

`src/components/report/SpeedTierChart.tsx` applies **`text-purple-400` unconditionally** — no light/dark qualifier — measuring **2.65:1**. AA requires 4.5:1 for normal text.

Introduced by commit `1fa2e4a` (*"speed tiers model +1/+2 stages, doubling abilities and Trick Room order"*). Because the class carries no variant, it is wrong in **both** themes rather than desyncing like the `dark:` utilities in VGC-316.

## Why it was not fixed tonight

`SpeedTierChart.tsx` was being edited concurrently by another agent this run (fixing Mega-form ability resolution in the speed tiers), and parallel edits to one file are forbidden by the swarm's conflict protocol. Deliberately deferred rather than missed.

## Fix

Replace with a semantic token that clears 4.5:1 in both themes, consistent with however the other tier labels in that component are coloured. Small, self-contained diff.
