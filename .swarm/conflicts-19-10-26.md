# Merge-conflict log — run 19-10-26

## Conflicts encountered during this run

**None.** The branch was cut from `origin/main` at exact parity (0 ahead / 0
behind), no rebase or merge was needed at any point, and the post-commit
`git merge origin/main` was a no-op because `main` did not move during the run.
No `.swarm` file was stashed; no unclaimed working-tree change appeared.

Every file committed was claimed by exactly one agent. Two agents reported
seeing each other's in-flight edits in `git status` and correctly left them
alone; one (the reconciliation agent) re-ran its whole audit against a clean
`git archive HEAD` snapshot after noticing the dirty tree, which caught a false
`RESOLVED` verdict it would otherwise have reported for half of VGC-268.

## Conflict exposure this branch creates for the 10 open PRs

Honest accounting, since this branch will eventually have to merge alongside them:

| File | Open PRs touching it | This branch's change | Expected resolution |
|---|---|---|---|
| `src/app/changelog/data.ts` | **10 / 10** | new `5.30` entry prepended | **Certain conflict.** Mechanical: keep all entries, order by version. PR #82 already claims `5.29`, so `5.30` was chosen to sit above it rather than collide. |
| `src/app/api/team-graphic/route.tsx` | 5 | PR #81's fix, **ported verbatim** | Should be a no-op against #81. #72/#76/#79 carry weaker independent fixes of the same hole — take #81's/this version. |
| `package.json` / `package-lock.json` | 4 | `next` → `16.3.8` | Pinned to the **same** version PR #82 chose, so that pair agrees. Resolve any lockfile conflict by re-running `npm install`, never by hand. |
| `src/components/report/PokemonCard.tsx` | 4 | +2 lines (`useMoveNames(language)`) | Trivial. |
| `public/llms-full.txt` | 5 | SP section rewritten | Prefer this version — it is the only one pinned by a test. Verify `sp-docs-drift` passes after resolving. |
| `src/lib/db.ts`, `src/lib/types/pokemon.ts`, `src/lib/parser/showdown-parser.ts`, `src/lib/utils/translate-move.ts`, `type-colors.ts`, `type-chart.ts`, `TypeBadge.tsx`, `MovesPanel.tsx`, `OffensiveCoverageChart.tsx`, `TournamentMode.tsx`, `OTSSheetModal.tsx` | 0–1 | this run's ticket work | Low risk; chosen deliberately to avoid the hot list. |

## The structural point

`src/app/changelog/data.ts` is touched by **every one** of the ten open PRs,
each prepending an entry at the same position. The mandated Updates-page append
is therefore the single largest conflict generator in this repository, and it
is self-inflicted by the nightly process rather than by any feature.

Worse, per `pr-merge-order-19-10-26.md`, four of those PRs (#72/#74/#75/#76)
**auto-merge that file without conflicting** and produce a silently corrupt
public Updates page — duplicate `5.27`/`5.26` entries out of order, and a second
`5.28`. A clean auto-merge is not safety here; that file needs eyes on every
merge regardless of what git reports.

A durable fix would be one file per release (`changelog/entries/5.30.ts`)
collected by an index, so two runs can never touch the same lines. Filed.
