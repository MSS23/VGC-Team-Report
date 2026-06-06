# C1 — Dead Code Findings (06-06-26)

## HIGH CONFIDENCE — zero references anywhere

### 1. `asPokemonTypes` in `src/lib/data/dex-subset.ts:123`
- Function "Narrow a string[] of types to the typed PokemonType union"
- Zero references in src/
- Safe to delete (~3 lines, ~60 bytes)

## MEDIUM — exported but only used internally (could narrow visibility)

### 2. `replaceSpeciesInBlock` in `src/lib/utils/paste-edit.ts:59`
- Used only once internally on line 97 of the same file (by `replacePokemonSpecies` — public)
- Drop the `export` keyword. ~25 lines stay, just narrow visibility.

### 3. `migratePlan` re-export at `src/hooks/useMatchupPlans.ts:93`
- Definition at lines 51-91 is used internally; the re-export statement at line 93 has zero external consumers.
- Drop `export { migratePlan };` line.

### 4. `summarizeChangedFields` import in `src/app/page.tsx:36`
- Imported but never called in page.tsx.
- ⚠️ page.tsx is in `.swarm/main-changed-files.md` (recently changed by 8eb39cc redesign) — SKIP to avoid conflict risk.

## Action plan
- Act on item 1 (`asPokemonTypes`) immediately — zero conflict surface.
- Items 2 and 3 — apply (narrow exports / drop re-export).
- Item 4 — defer, leave for human.

## Total bytes removable
~675 bytes after acting on 1-3.
