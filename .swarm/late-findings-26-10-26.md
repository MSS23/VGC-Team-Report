# Findings surfaced BY Wave 2 agents (not in any Wave 1 report)

Implementation agents found these while fixing something else. All correctly left
out of scope by the agent that found them. Recorded here so they are not lost.

## 1. Wrong-stone Mega match: Kangaskhan @ Gengarite resolves to Mega Gengar

Found by the VGC-293 agent. `detectMegaFromItemDex` in
`src/lib/data/pkmn-dex-fallback.ts:217` falls back to
`Object.values(itemEntry.megaStone)[0]` — it takes the *first* Mega associated with
the stone without checking the stone actually belongs to the pasted species. So a
Kangaskhan holding Gengarite is resolved as **Mega Gengar**: wrong types, wrong
ability, wrong base stats, and a wrong legality verdict.

Pre-existing, unrelated to VGC-293. Worth a Bug ticket. Note the file was modified
this run by the MissingNo. fix, so rebase on that.

## 2. `PokemonType`'s 18 members are hand-duplicated across 8 sites

C2 identified this as the root cause of recurring validation drift; the MissingNo.
agent then enumerated the actual sites:

- `src/lib/parser/showdown-parser.ts`
- `src/lib/data/type-chart.ts`
- `src/app/api/team-graphic/route.tsx`
- `src/app/champions/ChampionsContent.tsx`
- `src/app/champions/[pokemon]/MegaLandingContent.tsx`
- `src/components/compare/CompareContent.tsx`
- `src/components/report/DefensiveCoverageChart.tsx`
- `src/components/report/OffensiveCoverageChart.tsx`
- (plus `InlinePokemonEditor.tsx`)

This duplication is why `"Bird"` from MissingNo. could reach a render and crash it.
The MissingNo. fix avoided adding a 9th copy by deriving its valid set from
`Object.keys(TYPE_CHART)` (typed `Record<PokemonType, …>`, so the compiler keeps it
in lockstep with the union) — that is the pattern a unification should follow.
Covered by the `noUncheckedIndexedAccess` ticket filed this run.

## 3. Should the Compare page have a Mega toggle at all?

Raised in VGC-293's own description and confirmed by the implementing agent: the
compare page resolves Megas **unconditionally**, with no user control. A player
comparing a Gengar @ Gengarite team cannot see the base-form numbers. That is a
product decision, not a bug, so no code was written for it. Worth a ticket so the
question gets answered rather than rediscovered a third time.

## 4. Container note for future runs: PGlite tests time out under agent load

Two agents independently reported `src/app/api/quick-share` and
`src/app/api/collaboration` `postgres.test.ts` failing with 30-second `beforeAll`
hook timeouts while ~9 agents ran concurrently. These are **not** real failures:
the same suites passed in this run's clean baseline (504/504 before any edit).
It is resource contention spinning up PGlite instances in parallel.

Consequence for the orchestrator: the sequential commit gate must run on a quiet
tree, and a PGlite timeout seen during a parallel wave should be re-checked rather
than treated as a regression. Worth remembering — a future run that gated inside a
wave would reject good work over this.
