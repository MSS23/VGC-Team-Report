# C1 Dead Code Audit — VGC Team Report

**Date:** 2026-06-05
**Scope:** `src/lib/**`, `src/components/**`, `src/hooks/**`, `src/app/api/**`, `src/app/**/page.tsx`
**Method:** symbol grep across `src/` excluding the defining file and `__tests__/`. Cross-checked against `.swarm/main-changed-files.md` and prior audits (most recent: `c1-dead-code-23-05-26.md`). Confirmed prior wins applied (Badge.tsx + useScrollHide.ts deleted; `pokemonToOpenSheet`/`detectRegulationWithSignals` de-exported).

## HIGH-confidence finds (safe to delete)

### 1. `SerializedGamePlanSchema` — drop `export`
- **File:** `/home/user/VGC-Team-Report/src/lib/sharing/url-codec.ts:11`
- 1 external grep hit — own file only (used by `ShareableStateSchema` on line 22). No importer. Internal Zod schema leaked as `export`.
- conflict-risk: false (`url-codec.ts` not in main-changed-files.md).

### 2. `SerializedMatchupPlanSchema` — drop `export`
- **File:** `/home/user/VGC-Team-Report/src/lib/sharing/url-codec.ts:18`
- Same pattern: only used internally on line 52. No external importer.
- conflict-risk: false.

### 3. `ShareableStateSchema` — drop `export`
- **File:** `/home/user/VGC-Team-Report/src/lib/sharing/url-codec.ts:39`
- Only used inside the same file by `decodeShareState` (line 185). Zero external importers.
- conflict-risk: false.

### 4. `PrivateField` type — drop `export`
- **File:** `/home/user/VGC-Team-Report/src/lib/sharing/redact-paste.ts:21`
- Only callers of `redact-paste.ts` import `normalizePrivateFields`/`redactPasteFields` — neither imports `PrivateField`. Used only as the param/return type inside the same file.
- conflict-risk: false.

### 5. `pokemonToShowdown` — drop `export` (carry-over, still valid)
- **File:** `/home/user/VGC-Team-Report/src/lib/utils/export-paste.ts:20`
- Production callers: 0. Only used by `teamToShowdown` (same file, line 78) and the test file `export-paste.test.ts`. Make private, update test to call `teamToShowdown([mon])`.
- conflict-risk: false.

## MEDIUM (de-export only, narrow risk)

### 6. `replaceSpeciesInBlock` — drop `export`
- **File:** `/home/user/VGC-Team-Report/src/lib/utils/paste-edit.ts:59` — only internal caller is `replacePokemonSpecies` (same file, line 97). conflict-risk: false.

### 7. `isDynamicAllowedOrigin` — drop `export`
- **File:** `/home/user/VGC-Team-Report/src/lib/security/cors.ts:18` — two internal callsites (lines 27, 41). conflict-risk: false.

### 8. `generateCsrfToken` — drop `export`
- **File:** `/home/user/VGC-Team-Report/src/lib/security/csrf.ts:17` — only used by `setCsrfCookie` (line 49). Low priority — security-adjacent. conflict-risk: false.

## Skipped this round
- `migrateCalcEntries` (`normalize-report.ts`) — recently churned (in main-changed-files.md). conflict-risk: true.

## Recommended deletion target
**Items 1-4 in a single commit on `src/lib/sharing/url-codec.ts` + `redact-paste.ts`** — four `export` keywords removed, ~0 behavior change, immediately tightens public API of the share-codec module. Bonus: item 5 (`pokemonToShowdown` de-export + test update) as a second small commit.

## Summary
| # | File:Line | Symbol | Confidence | Conflict-risk |
|---|---|---|---|---|
| 1 | url-codec.ts:11 | SerializedGamePlanSchema | HIGH | false |
| 2 | url-codec.ts:18 | SerializedMatchupPlanSchema | HIGH | false |
| 3 | url-codec.ts:39 | ShareableStateSchema | HIGH | false |
| 4 | redact-paste.ts:21 | PrivateField (type) | HIGH | false |
| 5 | export-paste.ts:20 | pokemonToShowdown | HIGH | false |
| 6 | paste-edit.ts:59 | replaceSpeciesInBlock | MED | false |
| 7 | cors.ts:18 | isDynamicAllowedOrigin | MED | false |
| 8 | csrf.ts:17 | generateCsrfToken | MED (security) | false |
