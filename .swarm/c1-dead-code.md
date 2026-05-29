# C1 Dead-Code Scan - 2026-05-24

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
Tech: Next.js 16, React 19, TypeScript. Method: grep cross-references for every exported symbol across `src/`, ignoring tests; reconciled against the conflict-risk list in `.swarm/main-changed-files.md`.

---

## 1. Confirmed dead exports (zero call sites)

Ranked highest-confidence first. "Internal only" means exported but only the file's own siblings reference it - make it private rather than delete the logic.

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
| # | File | Symbol | Status | Notes |
|---|------|--------|--------|-------|
| 1 | `src/lib/utils/export-paste.ts` | `pokemonToOpenSheet` | DELETE | Zero production refs. Used only by `teamToOpenSheet` in same file. |
| 2 | `src/lib/utils/export-paste.ts` | `pokemonToShowdown` | UN-EXPORT | Used by sibling `teamToShowdown` and tests; no other module imports it. |
| 3 | `src/lib/utils/paste-edit.ts` | `replaceSpeciesInBlock` | UN-EXPORT | Only `replacePokemonSpecies` (same file) calls it. |
| 4 | `src/lib/analysis/detect-regulation.ts` | `detectRegulationWithSignals` | UN-EXPORT | Wrapped by `detectRegulation`. No external callers. |
| 5 | `src/lib/analysis/detect-regulation.ts` | `RegulationDetection` (interface) | UN-EXPORT | Only the return type of the (also internal) `detectRegulationWithSignals`. |
| 6 | `src/lib/security/cors.ts` | `isDynamicAllowedOrigin` | UN-EXPORT | Used twice in same file (`getCorsHeaders`, `isAllowedOrigin`); never imported elsewhere. |
| 7 | `src/lib/sharing/redact-paste.ts` | `PrivateField` (type) | UN-EXPORT | Only referenced inside `redact-paste.ts`. |
| 8 | `src/lib/sharing/url-codec.ts` | `SerializedGamePlanSchema` | UN-EXPORT | Composed into `ShareableStateSchema`; no other consumer. |
| 9 | `src/lib/sharing/url-codec.ts` | `SerializedMatchupPlanSchema` | UN-EXPORT | Same as above. |
| 10 | `src/lib/sharing/url-codec.ts` | `ShareableStateSchema` | UN-EXPORT | Internal validator inside `decodeShareState`. |
| 11 | `src/hooks/useScrollHide.ts` | `useScrollHide` | DELETE (whole file) | No imports anywhere in `src/` or `cypress/`. Entire hook orphaned. |
| 12 | `src/components/social/ReactionBar.tsx` | `ReactionBar` | DELETE (whole file) | Only mounting point was `FloatingReactionDock`, which Navbar comments confirm was deleted. |

(`migrateCalcEntries` in `normalize-report.ts` looks dead but is called by `normalizeReportData` in the same file - keep, simply un-export if desired. Excluded to stay under 15.)

---

## 2. Components / files safe to delete (whole-file removals)

Limit 5; only two qualify with high confidence:

1. `src/hooks/useScrollHide.ts` - entire file, zero importers.
2. `src/components/social/ReactionBar.tsx` - its only mounting point (`FloatingReactionDock`) was already deleted; remaining string matches are changelog/Navbar comments.

No other component in `src/components/` or file in `src/lib/` returned zero imports after manual verification - every other 1-count match resolved to a real consumer (e.g. `MatchTracker` <- `DashboardContent`, `DisplayTogglePill` <- `app/page.tsx`, all `PageFooter`/`PageNavbar`/`PersistentNavbar` paths active).

No orphaned `src/app/` routes detected. Routes not linked from `src/components/layout/Navbar.tsx` (`/champions`, `/explore`, `/compare`, `/changelog`, `/faq`, `/notifications`, `/tournaments`, `/privacy`, `/terms`, `/s/[id]`, `/embed/[id]`, `/creator/[name]`) are all reachable via SEO/sitemap/share flows - not dead.

---

## 3. Conflict-risk skips (recently touched on main)

Do NOT delete or refactor - main has live edits per `.swarm/main-changed-files.md`:

- `src/lib/analysis/stat-calculator.ts` (`evsToSp`/`spToEv` already removed in prior pass; leave the rest)
- `src/lib/utils/multi-import.ts` (`ImportSource`, `detectImportSource` are used by `TeamOverview` and `PasteInput`; file recently changed)
- `src/lib/utils/normalize-report.ts` (`migrateCalcEntries`)
- `src/components/match-tracker/MatchTracker.tsx`

For items #1-#10 above, none of the listed files appear in `main-changed-files.md`, so the un-export/delete operations are conflict-safe.

---

## 4. ESLint summary

`npx eslint . --quiet`: **54 errors, 0 warnings**.

Rule breakdown:
- 26 x `react-hooks/set-state-in-effect`
- 11 x `@next/next/no-html-link-for-pages`
- 7 x `react-hooks/refs`
- 6 x `prefer-const`
- 2 x `react-hooks/preserve-manual-memoization`
- 2 x misc

**`no-unused-vars` / `unused-imports`: 0** - the project's lint config does not surface those rules (suppressed or fixed). No corroborating signal from ESLint for this audit; relied entirely on grep cross-referencing.

---

## 5. False-positive risks

- **Zod schemas** (`SerializedGamePlanSchema`, `SerializedMatchupPlanSchema`, `ShareableStateSchema`) may need to remain exported if a future API route or share-decode test plans to validate input directly. Verify with the share/codec ticket owner before un-exporting.
- **`detectRegulationWithSignals`** returns richer data than `detectRegulation` (regulation + reasoning). Un-export is safe, but do not inline / delete the logic - it is a likely future UI hook.
- **`ReactionBar`** - although its only direct importer was deleted, double-check Storybook stories / Cypress fixtures (none found in this scan) before removing the file.
- **`useScrollHide`** - name is generic; possible future scroll-driven UX could re-use it. Single commit author history, never imported - safe to delete, but worth a final author-history glance.
- **All "un-export" items** - dropping `export` will fail TypeScript only if a deep dynamic-import path uses them; `tsc --noEmit` after the change is sufficient verification.
