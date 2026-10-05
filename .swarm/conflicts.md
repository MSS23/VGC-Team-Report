# Conflict log — run of 05 Oct 2026

## Merge conflicts: none

The branch was cut from `origin/main` at run start (0 ahead / 0 behind) and
`origin/main` has not moved since — its last commit is `70c4633`, dated
**24 Aug 2026**, six weeks before this run. No rebase and no merge was needed,
and no conflict was resolved.

`REMOTE_EXISTS` for `claude/loving-sagan-fxmby5` was **0** at run start: the
`origin/claude/loving-sagan-fxmby5` remote-tracking ref existed locally but was
stale (`git ls-remote --heads` returned nothing), so the branch history was
unpublished until this run's push. No force-push was used at any point.

## Unclaimed working-tree changes stashed: none

Every modified path matched an entry in `.swarm/claimed-files.md`. One transient
scratch file (`src/lib/analysis/__tests__/zz-probe.test.ts`) appeared and was
removed by the agent that created it before integration, so nothing needed
stashing. The pre-run stash check found a clean tree.

## Intra-run file overlap, handled by serialising rather than stashing

Two files were wanted by more than one agent. Both were resolved by ordering the
agents, never by running them in parallel on the same file:

| File | Agents | Resolution |
|---|---|---|
| `DefensiveCoverageChart.tsx`, `OffensiveCoverageChart.tsx` | Mega typing, then accessibility | Accessibility dispatched only after the typing agent returned. It verified the Mega-aware `resolveEffectiveTyping` call sites were still intact and untouched. Committed together. |
| `src/app/tools/ev-to-sp/page.tsx` | SEO, then domain-logic | SEO's copy edit landed first; the domain-logic agent was told to preserve it. Committed with the domain-logic group, which the SEO commit message notes. |

The accessibility agent also reported `SpeedTierChart.tsx` and `TeamReport.tsx`
as modified in the tree and correctly identified them as other agents' work
rather than claiming them.

## Conflict risk carried forward to the eventual merge into main

`origin/main` is six weeks stale and **eight draft swarm PRs (#72, #74–#80) are
open and unmerged**. Whichever merges first will very likely conflict with the
rest. The highest-risk files, cross-referencing `.swarm/main-changed-files.md`
against what this branch touched:

- `src/app/page.tsx` — 4 touches in the last 30 commits on main; changed here (JSON-LD)
- `src/hooks/useHomePage.ts` — 4 touches; changed here (draft-clearing guard)
- `src/components/report/PokemonDetailSlide.tsx` — 3 touches; changed here (a11y)
- `src/app/changelog/data.ts` — 3 touches; changed here (this run's entry) — **near-certain conflict**, as every nightly run appends to the top of the same array
- `src/components/report/SpeedTierChart.tsx`, `DefensiveCoverageChart.tsx`,
  `src/app/api/share/route.ts`, `src/app/api/explore/route.ts` — 2 touches each; all changed here

Recommendation for the human: merge these PRs oldest-first, or close the stale
ones. `changelog/data.ts` will conflict on every pair — the resolution is always
to keep both month sections, never to take one side.
