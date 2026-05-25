# Dead Code Scan Report - VGC Team Report

**Date:** 2026-05-25
**Codebase:** `/home/user/VGC-Team-Report/src/`
**Scope:** All TypeScript/React files (288 files scanned)

---

## Findings Summary

**Total confirmed dead items:** 5
**Estimated removable LOC:** ~130 lines
**Unused dependencies:** 1

---

## 1. Confirmed Dead Code

### 1.1 PdfExportButton Component (STILL DEAD)
- **File:** `src/components/ui/PdfExport.tsx`
- **Export:** `export function PdfExportButton`
- **Lines:** ~46
- **Confidence:** HIGH
- **Note:** Sibling `PrintableReport` is actively used. Only this button component is dead.

### 1.2 useScrollHide Hook (DEAD FILE)
- **File:** `src/hooks/useScrollHide.ts`
- **Export:** `export function useScrollHide`
- **Lines:** ~60
- **Confidence:** HIGH
- **Evidence:** Zero imports across entire codebase. Not referenced by any component.
- **Note:** Scroll-direction-based show/hide hook. Was likely written for a floating nav feature that was never integrated.

### 1.3 detectRegulationWithSignals (UNNECESSARILY EXPORTED)
- **File:** `src/lib/analysis/detect-regulation.ts`
- **Export:** `export function detectRegulationWithSignals`
- **Lines:** ~77
- **Confidence:** HIGH
- **Evidence:** Only called by `detectRegulation()` in the same file. No external imports.
- **Action:** Remove `export` keyword (make private). The code itself is alive.

### 1.4 encodeShareState (TEST-ONLY EXPORT)
- **File:** `src/lib/sharing/url-codec.ts`
- **Export:** `export async function encodeShareState`
- **Lines:** ~20
- **Confidence:** MEDIUM
- **Evidence:** Zero production imports. Only used in `__tests__/url-codec.test.ts` for round-trip testing of `decodeShareState`.
- **Note:** Paired with `decodeShareState` which IS used in production (`useShareUrl.ts`). The encode path is dead in production but may be needed if share-via-URL is ever re-enabled. Flag as tech-debt rather than immediate deletion.

### 1.5 replaceSpeciesInBlock (UNNECESSARILY EXPORTED)
- **File:** `src/lib/utils/paste-edit.ts`
- **Export:** `export function replaceSpeciesInBlock`
- **Lines:** ~13
- **Confidence:** HIGH
- **Evidence:** Called only by `replacePokemonSpecies()` in the same file. No external imports.
- **Action:** Remove `export` keyword.

---

## 2. Unused Dependencies

### 2.1 `axios` (package.json dependency)
- **Confidence:** HIGH
- **Evidence:** Zero imports of `axios` in any `.ts` or `.tsx` file in the project (including config files, scripts, etc.)
- **Note:** The project uses native `fetch` everywhere. `axios` is vestigial.
- **Action:** `npm uninstall axios` — saves ~400KB from node_modules and removes a supply-chain surface.

---

## 3. Unnecessary Type Exports (Low Priority)

These types are exported but never imported by external consumers. They are used internally within their files. Not dead code, but needlessly public API surface:

| Export | File | Internal Use |
|--------|------|--------------|
| `MoveCategory`, `MoveFlag`, `MoveData` | `src/lib/data/moves.ts` | Types the `MOVES` const and `lookupMove` |
| `NatureData` | `src/lib/data/natures.ts` | Types the `NATURES` const |
| `TYPE_CHART` | `src/lib/data/type-chart.ts` | Used by `getEffectiveness`/`getDefensiveProfile` internally |
| `AccentTheme` | `src/lib/accent-themes.ts` | Element type of `ACCENT_THEMES` array |
| `NotificationType` | `src/lib/notifications.ts` | Parameter type for `createNotification` |
| `PrivateField` | `src/lib/sharing/redact-paste.ts` | Used internally by normalizePrivateFields |
| `ImportSource` | `src/lib/utils/multi-import.ts` | Return type of `detectImportSource` |
| `ReportTemplate`, `REPORT_TEMPLATES` | `src/lib/templates.ts` | Used by `getTemplate()` internally |
| `isDynamicAllowedOrigin` | `src/lib/security/cors.ts` | Called internally in same file |
| `generateCsrfToken` | `src/lib/security/csrf.ts` | Called internally in same file |
| `SerializedGamePlanSchema`, `SerializedMatchupPlanSchema`, `ShareableStateSchema` | `src/lib/sharing/url-codec.ts` | Compose into main schema internally |

**Action:** These are safe to un-export (remove `export` keyword) for a cleaner public API, but not urgent.

---

## 4. Orphaned Components

**None found.** All 73 component files in `src/components/` are imported by at least one other file.

---

## 5. Dead Routes

**None confirmed.** All 50 API routes are either:
- Called from frontend code
- Registered in `vercel.json` crons (`/api/cleanup`, `/api/cron/*`)
- Used as webhook endpoints (`/api/webhooks/*`)
- Admin endpoints called via curl (`/api/migrate`, `/api/setup`)

---

## 6. Dead Pages

**None found.** All 19 page routes are linked from navigation, sitemap, or internal redirects.

---

## 7. Previously Removed Dead Code (for reference)

Items from prior audits that have since been cleaned up:
- `sanitizeInput` in `src/lib/security/input-validation.ts` — removed
- `parsePikalyticsUrl` in `src/lib/utils/multi-import.ts` — removed
- `evsToSp` / `spToEv` — removed
- `postBuildNotification` / `postToFeedbackChannel` — removed
- `containsInjection` — removed

---

## Recommended Actions (Priority Order)

1. **Delete `src/hooks/useScrollHide.ts`** — entire file is dead (~60 lines)
2. **Remove `PdfExportButton` from `src/components/ui/PdfExport.tsx`** (~46 lines)
3. **Run `npm uninstall axios`** — unused dependency
4. **Un-export internal helpers** (`detectRegulationWithSignals`, `replaceSpeciesInBlock`) — remove `export` keyword only
5. **Low priority:** Un-export the type-only exports in Section 3 for cleaner API surface

**Total safe deletions:** ~106 lines of code + 1 npm dependency
**Risk level:** VERY LOW (all confirmed with zero external references)
