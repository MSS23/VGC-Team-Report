# [CI] Promote ESLint no-unused-vars to error so dead code cannot accumulate

- **Priority:** Medium
- **Labels:** auto-research, Infrastructure, Quick-Win
- **Target state:** Backlog
- **Status:** NOT FILED — Linear workspace is at its free-plan active-issue limit

## Source

`.swarm/c1-dead-code-02-11-26.md` — the explanation for *why* nothing got cleaned up between the 26-10-26 and 02-11-26 runs.

## Finding

Commit `d8aba62` made lint blocking in CI, which was the right move. But `no-unused-vars` is configured as a **warning**, so **ESLint exits 0 with all 24 findings intact**. The gate is blocking and simultaneously indifferent to unused code.

Consequence: successive nightly audits keep re-discovering the same dead exports, and each run spends budget re-proving they are dead.

## Fix

Promote `no-unused-vars` (and the TypeScript-aware `@typescript-eslint/no-unused-vars`) from `warn` to `error` in `eslint.config.mjs`. That would CI-enforce **14** of the currently-confirmed dead items, so dead code can only be added deliberately.

## Prerequisite

All 24 current findings must be cleared first, or CI goes red immediately. The 02-11-26 run deleted a subset; re-run the audit to get the current list before flipping the switch. Use the standard `_`-prefix convention for genuinely-intentional unused bindings (e.g. positional callback params) rather than disabling the rule inline.

Low risk, mechanical, and it ends a recurring waste of swarm budget — but it must be sequenced after the cleanup, not before.
