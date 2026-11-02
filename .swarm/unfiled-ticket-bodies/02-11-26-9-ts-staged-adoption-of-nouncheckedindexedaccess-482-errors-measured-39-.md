# [TS] Staged adoption of noUncheckedIndexedAccess (482 errors measured, 39 in src/lib)

- **Priority:** Medium
- **Labels:** auto-research, Infrastructure
- **Target state:** Backlog
- **Status:** NOT FILED — Linear workspace is at its free-plan active-issue limit

## Source

`.swarm/c2-typescript-02-11-26.md`. Error counts are **measured by running tsc with each flag**, not estimated.

## Measured cost of each compiler flag

| Flag | Errors |
| -- | -- |
| `noUncheckedIndexedAccess` | **482** (308 non-test, **39 in `src/lib`**) |
| `exactOptionalPropertyTypes` | 80 (auditor judged **0 real bugs** among them) |
| `noUnusedLocals` | 21 |
| `noUnusedParameters` | 5 |
| `noImplicitReturns` | 2 |
| `verbatimModuleSyntax` | 0 — **free to enable today** |

## Recommendation

Do **not** attempt 482 errors in one change.

1. Enable `verbatimModuleSyntax` now — zero errors, no work.
2. Then `noImplicitReturns` (2) and `noUnusedParameters` (5) — trivial.
3. Then `noUncheckedIndexedAccess` scoped to **`src/lib` only** (39 errors) via a second tsconfig or a per-directory override. `src/lib` is where unchecked index access turns into a **silently wrong stat or legality ruling**, so those 39 are worth far more than the other 443 combined.
4. Leave the remaining 443 (mostly UI and tests) for later, or permanently — the audit found no real bugs among the `exactOptionalPropertyTypes` set, so flag-chasing there is low value.

## Context

The codebase is already in good shape on the headline metrics: **0 `any` keywords** and **0 `ts-ignore`/`ts-expect-error`** across 416 files (AST scan). The residual risk is concentrated in the **281 DB-boundary casts**, where `JSON.parse` returning `any` means unsound data flows in with no compiler diagnostic at all — two live bugs from exactly that pattern were found and fixed this run. A staged `noUncheckedIndexedAccess` in `src/lib` is the highest-value next step; broad flag adoption is not.
