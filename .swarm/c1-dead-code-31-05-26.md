# Dead Code Audit — VGC Team Report (2026-05-31)

**Date:** 2026-05-31  
**Scope:** `src/lib/**/*.ts`, `src/components/**`, `src/hooks/**`, `src/app/api/**`  
**Method:** Symbol-by-symbol grep across `src/` excluding test files and the defining file.

---

## Summary of Changes Since 2026-05-23

### Resolved (Deleted)
- ✅ **Badge.tsx** — file deleted (was flagged for full-file deletion)
- ✅ **useScrollHide.ts** — file deleted (was flagged for full-file deletion)
- ✅ **encodeShareState** — removed from url-codec.ts (was flagged for deletion)
- ✅ **pokemonToOpenSheet** — made private (was flagged to drop export)
- ✅ **detectRegulationWithSignals** & **RegulationDetection** — made private (was flagged to drop export)

### Still Pending (Carried Over from Prior Audit)

| # | Symbol | File | Lines | Status | Confidence | Action |
|---|--------|------|-------|--------|-----------|--------|
| 1 | `pokemonToShowdown` | export-paste.ts | 20 | Internal only | HIGH | Drop `export` |
| 2 | `replaceSpeciesInBlock` | paste-edit.ts | 59 | Internal only | MEDIUM | Drop `export` |
| 3 | `isDynamicAllowedOrigin` | cors.ts | 18 | Internal only | MEDIUM | Drop `export` |
| 4 | `generateCsrfToken` | csrf.ts | 17 | Internal only | LOW | Drop `export` (optional) |
| 5 | `migrateCalcEntries` | normalize-report.ts | 10 | Recently changed | LOW | Skip this round |

---

## Top 5 HIGH-Confidence Findings for Immediate Action

### 1. `pokemonToShowdown` — should be private

**File:** `/home/user/VGC-Team-Report/src/lib/utils/export-paste.ts`  
**Lines:** 20–75 (56 lines)  
**Symbol:** `export function pokemonToShowdown(mon: ParsedPokemon): string`

**Evidence:**
```bash
grep -rn "pokemonToShowdown" src/ --include="*.ts" --include="*.tsx" | grep -v "export function"
```
Returns 1 match: line 78 (internal call within `teamToShowdown` wrapper).

**Analysis:** Like its sibling `pokemonToOpenSheet` (which was correctly made private), this function is only used internally as a helper. Public API is `teamToShowdown`, not the per-pokemon function.

**Confidence:** HIGH  
**Recently changed?** Yes (export-paste.ts in changed-files list)  
**Bundle impact:** Nil if just dropping export (already tree-shaken)  
**Action:** Drop `export` keyword on line 20.

---

### 2. `replaceSpeciesInBlock` — should be private

**File:** `/home/user/VGC-Team-Report/src/lib/utils/paste-edit.ts`  
**Lines:** 59–83 (25 lines)  
**Symbol:** `export function replaceSpeciesInBlock(block: string, newSpecies: string): string`

**Evidence:**
```bash
grep -rn "replaceSpeciesInBlock" src/ --include="*.ts" --include="*.tsx" | grep -v "export function"
```
Returns 1 match: line 97 (internal call within `replacePokemonSpecies` wrapper).

**Analysis:** Helper function used only by the public `replacePokemonSpecies` wrapper. Exporting it leaks an implementation detail and creates unnecessary public API surface.

**Confidence:** HIGH  
**Recently changed?** No  
**Bundle impact:** Nil  
**Action:** Drop `export` keyword on line 59.

---

### 3. `isDynamicAllowedOrigin` — should be private

**File:** `/home/user/VGC-Team-Report/src/lib/security/cors.ts`  
**Lines:** 18–22 (5 lines)  
**Symbol:** `export function isDynamicAllowedOrigin(origin: string): boolean`

**Evidence:**
```bash
grep -rn "isDynamicAllowedOrigin" src/ --include="*.ts" --include="*.tsx" | grep -v "export function"
```
Returns 2 matches: lines 27 and 41 (both internal calls within same file).

**Analysis:** Security helper used only by `getCorsHeaders` and `isAllowedOrigin`. No external callers. Reduces public security API surface.

**Confidence:** HIGH  
**Recently changed?** No  
**Bundle impact:** Nil  
**Action:** Drop `export` keyword on line 18.

---

### 4. `generateCsrfToken` — should be private (optional)

**File:** `/home/user/VGC-Team-Report/src/lib/security/csrf.ts`  
**Lines:** 17–22 (6 lines)  
**Symbol:** `export function generateCsrfToken(): string`

**Evidence:**
```bash
grep -rn "generateCsrfToken" src/ --include="*.ts" --include="*.tsx" | grep -v "export function"
```
Returns 1 match: line 49 (internal call within `setCsrfCookie`).

**Analysis:** Only used by `setCsrfCookie`. Public API is the setter, not the token generator. However, CSRF helpers are security-adjacent; keeping exported costs minimal and may support future debugging or test utilities.

**Confidence:** LOW (security code, low priority)  
**Recently changed?** No  
**Bundle impact:** Nil  
**Action:** Drop `export` (optional—skip if it complicates testing).

---

### 5. `migrateCalcEntries` — carry over, skip this round

**File:** `/home/user/VGC-Team-Report/src/lib/utils/normalize-report.ts`  
**Lines:** 10–25 (16 lines)  
**Symbol:** `export function migrateCalcEntries(rawCalcs: unknown): Record<string, Array<...>>`

**Evidence:**
```bash
grep -rn "migrateCalcEntries" src/ --include="*.ts" --include="*.tsx" | grep -v "export function"
```
Returns 1 match: line 102 (internal call within `normalizeReportData`).

**Analysis:** File is in `main-changed-files.md`, suggesting recent work. The export may be intentional for an upcoming migration script or API route not yet merged. Verify with author before downgrading.

**Confidence:** LOW (recently churned)  
**Recently changed?** **YES** (in main-changed-files.md)  
**Bundle impact:** Nil  
**Action:** **SKIP THIS ROUND.** Verify with author before marking private.

---

## Cross-Referenced Against Prior Audit

### Items Previously Flagged — Status Update

| Item | 2026-05-23 Status | 2026-05-31 Status | Resolution |
|------|------------------|-------------------|-----------|
| Badge.tsx | "delete file" | ✅ DELETED | Complete |
| useScrollHide.ts | "delete file" | ✅ DELETED | Complete |
| encodeShareState | "delete function" | ✅ DELETED | Complete |
| pokemonToShowdown | "drop `export`" | ⏳ PENDING | Still exported; internal-only use confirmed |
| pokemonToOpenSheet | "drop `export`" | ✅ MADE PRIVATE | Complete |
| detectRegulationWithSignals | "drop `export`" | ✅ MADE PRIVATE | Complete |
| RegulationDetection (interface) | "drop `export`" | ✅ MADE PRIVATE | Complete |
| replaceSpeciesInBlock | "drop `export`" | ⏳ PENDING | Still exported; internal-only use confirmed |
| migrateCalcEntries | "LOW priority, skip" | ⏳ PENDING | File recently changed; skip for now |
| isDynamicAllowedOrigin | "drop `export`" | ⏳ PENDING | Still exported; internal-only use confirmed |
| generateCsrfToken | "optional" | ⏳ PENDING | Still exported; internal-only use confirmed |

---

## Search Commands Used (Reproducibility)

For each symbol, the verification command was:

```bash
grep -rn "SYMBOL" src/ --include="*.ts" --include="*.tsx" \
  | grep -v "export function\|export const\|export interface\|export type\|__tests__\|\.test\.ts"
```

All commands executed from `/home/user/VGC-Team-Report/`.

---

## Recommendations for Next Steps

### Immediate (This Session)
1. Drop `export` from `pokemonToShowdown` (line 20 of export-paste.ts)
2. Drop `export` from `replaceSpeciesInBlock` (line 59 of paste-edit.ts)
3. Drop `export` from `isDynamicAllowedOrigin` (line 18 of cors.ts)

### Deferred
- **generateCsrfToken:** Optional; consider keeping for testability.
- **migrateCalcEntries:** Verify with the author who touched normalize-report.ts before downgrading.

---

## Notes

- **API routes** under `src/app/api/**/route.ts` are valid external entry points (webhooks, crons, oembed, sprite proxy, admin endpoints). None flagged.
- **No new dead code discovered** beyond the items carried over from the prior audit.
- **Bundle impact:** All recommended changes are export-only (drop visibility, no file deletion). Zero bundle impact; tree-shaking already handles them. Benefit is reduced public API surface and improved maintainability.
