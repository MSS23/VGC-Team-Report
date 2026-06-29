# W4 — Privatise Dead Exports — Skips

## Item #4: `pokemonToShowdown` in `src/lib/utils/export-paste.ts`

**Skipped.** External reference found in `src/lib/utils/__tests__/export-paste.test.ts`:

- Line 2: `import { pokemonToShowdown, teamToShowdown } from "@/lib/utils/export-paste";`
- Lines 20, 22, 33, 38, 43, 48, 53, 58, 63: 8 test cases call `pokemonToShowdown(...)` directly.

W4 rules state: "If you find ANY external reference, STOP and skip that item." The test file is outside the W4 scope (only the four named files may be edited).

**Resolution required by another worker:** Either:

1. Drop the `export` keyword AND update the test file to call `teamToShowdown([mon])` and slice off the trailing separator, OR
2. Delete the per-pokemon test cases (lines 20–69) entirely, keeping only the `teamToShowdown` describe block, OR
3. Leave the export as-is (lowest-impact option).

Source: `.swarm/c1-dead-code-29-06-26.md` item #4 — "Either delete the per-pokemon tests or convert them to call `teamToShowdown([mon])`."
