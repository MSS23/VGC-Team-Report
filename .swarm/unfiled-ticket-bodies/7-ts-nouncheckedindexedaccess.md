## Source
`.swarm/c2-typescript-26-10-26.md`, the report's single highest-value recommendation.

## Finding
The codebase is in better shape than expected: an AST scan found **zero** uses of `any` anywhere (src, tests, cypress), and all 30 non-null assertions are provable. The real exposure is **440 production `as` casts**, and the flag that would catch the dangerous ones is `noUncheckedIndexedAccess`.

Enabling it repo-wide produces **394 errors** (288 non-test). But only **33** are in `src/lib`, and C2 reports all 33 are conflict-free — no overlap with recently-churned files.

Of all the stricter flags C2 trialled (`strict`, `exactOptionalPropertyTypes`, `noImplicitOverride`, `noUnusedLocals/Parameters`, `noFallthroughCasesInSwitch`), `noUncheckedIndexedAccess` is **the only one that catches a real defect** — specifically `src/lib/data/pkmn-dex-fallback.ts:83,139`, where `[types[0]]` indexes a possibly-empty array while the declared type is the non-empty tuple `[PokemonType]`.

## Fix — staged
Stage 1: fix the 33 `src/lib` errors, then enable the flag for `src/lib` only (project references or a scoped tsconfig). Stage 2+: work outward.

## Root cause worth fixing separately
C2 traced the recurring validation drift to `PokemonType`'s 18 members being **hand-duplicated in 8 places**. That duplication is why a non-member type string (`Bird`, from MissingNo. in the generated dex) could reach a render and crash it. A single source of truth for the 18 types would prevent the whole class.

---
*Filed automatically by the overnight swarm, run 26-10-26.*
