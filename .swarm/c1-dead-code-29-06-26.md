# Dead Code Audit — 2026-06-29

**Project:** VGC Team Report (Next.js 16 / React 19 / TypeScript)
**Scope:** `src/**` — components, hooks, lib utilities, API routes, sitemap, package deps.
**Method:** Ripgrep across `*.ts`/`*.tsx` for each export, excluding the defining file. Tests counted, but a symbol used only in its own test is treated as dead. Cross-checked against `.swarm/c1-dead-code-23-05-26.md` (prior latest) so I don't repeat findings, and `.swarm/main-changed-files.md` for conflict-risk overlap.

---

## Already implemented since 23-05-26 (do not re-flag)

Verified via filesystem & grep:
- `src/components/ui/Badge.tsx` — DELETED.
- `src/hooks/useScrollHide.ts` — DELETED.
- `src/components/social/ReactionBar.tsx` — DELETED.
- `src/components/ui/PdfExport.tsx` `PdfExportButton` — DELETED (only `PrintableReport` + types remain).
- `src/lib/sharing/url-codec.ts` `encodeShareState` — DELETED (only the test describe-block label remains).
- `src/lib/utils/export-paste.ts` `pokemonToShowdown` and `pokemonToOpenSheet` — `pokemonToOpenSheet` was made private (no `export`). `pokemonToShowdown` is **still exported but only used in tests** (see Medium below).
- `src/lib/analysis/detect-regulation.ts` `detectRegulationWithSignals` — made private. ✔

Still-open carryover items from 23-05-26 audit:
- `replaceSpeciesInBlock` (`src/lib/utils/paste-edit.ts`) — still exported, still only self-used.
- `isDynamicAllowedOrigin` (`src/lib/security/cors.ts`) — still exported, still only self-used.
- `generateCsrfToken` (`src/lib/security/csrf.ts`) — still exported, still only self-used.
- `migrateCalcEntries` (`src/lib/utils/normalize-report.ts`) — still exported, still only self-used. NOTE: `normalize-report.ts` is **no longer** on `main-changed-files.md`, so it's safe to downgrade now.

---

## Dead code findings — 29-06-26

### High confidence (zero external references)

#### 1. `src/components/display/DisplayTogglePill.tsx` — fully orphaned component
- **File:** `/home/user/VGC-Team-Report/src/components/display/DisplayTogglePill.tsx` (267 lines, whole file)
- **Symbol:** `export function DisplayTogglePill`
- **Evidence:**
  ```bash
  rg "DisplayTogglePill"
  src/lib/hooks/useGlobalDisplayPrefs.ts:9:    * Used by the DisplayTogglePill to track
  src/components/display/DisplayTogglePill.tsx:5:interface DisplayTogglePillProps {
  src/components/display/DisplayTogglePill.tsx:48:export function DisplayTogglePill(...) {
  ```
  Three matches — the export, the interface, and a doc-comment mention. **Zero `import { DisplayTogglePill }` / dynamic imports / JSX call sites anywhere.**
- **Bonus:** `src/components/display/` is a single-file directory — deleting `DisplayTogglePill.tsx` also empties the whole subdirectory.
- **Confidence:** HIGH — orphan component, dead since whenever the toggle was removed from the UI.
- **Recently changed?** No (`DisplayTogglePill.tsx` and `display/` not in `main-changed-files.md`).
- **Proposed action:** Delete the file. Also delete the empty `src/components/display/` directory.

#### 2. `src/lib/hooks/useGlobalDisplayPrefs.ts` — orphan hook (consumer of #1)
- **File:** `/home/user/VGC-Team-Report/src/lib/hooks/useGlobalDisplayPrefs.ts` (51 lines, whole file)
- **Symbol:** `export function useGlobalDisplayPrefs`
- **Evidence:**
  ```bash
  rg "useGlobalDisplayPrefs"
  src/lib/hooks/useGlobalDisplayPrefs.ts:36:export function useGlobalDisplayPrefs(): { hasSeenPill: boolean; markPillSeen: () => void } {
  ```
  **Only the export.** Zero importers. (This is the persistence hook for `DisplayTogglePill`'s "has the user seen this pill yet?" flag — it died with the pill.)
- **Bonus:** `src/lib/hooks/` is a single-file directory — deleting frees up the directory.
- **Confidence:** HIGH — fully orphaned, depends-on relationship with #1 makes this a coupled deletion.
- **Recently changed?** No.
- **Proposed action:** Delete the file. Also delete the empty `src/lib/hooks/` directory. (Combined with #1: ~318 lines and 2 whole subdirectories gone.)

#### 3. `src/lib/utils/export-report.ts` `exportAsPdf` — dead function
- **File:** `/home/user/VGC-Team-Report/src/lib/utils/export-report.ts`, lines 95–115 (21 lines)
- **Symbol:** `export async function exportAsPdf`
- **Evidence:**
  ```bash
  rg "exportAsPdf"
  src/lib/utils/export-report.ts:95:export async function exportAsPdf(...)
  # all other hits are i18n strings: exportAsPdf: "Export as PDF" (a coincidentally
  # named translation key, not an import). No call sites in any .ts/.tsx file.
  rg "exportAsPdf\\("    # only the definition. Zero callers.
  ```
- **Bundle impact:** Removing `exportAsPdf` orphans the lazy `jspdf` import at line 5 (`async function getJsPDF()`), which in turn means **`jspdf` (a ~300KB dep) can be removed from `package.json`**. Sibling `exportAsImage` (line 79) is alive — it uses html2canvas, not jsPDF.
- **Confidence:** HIGH — definition is the only ref in production code.
- **Recently changed?** No.
- **Proposed action:** Delete the function (lines 92–115) AND the inner `getJsPDF()` helper (lines 3–7). Then run `npm uninstall jspdf` to remove the dep.

### Medium confidence (only self / test references; recommend privatising not deleting)

#### 4. `pokemonToShowdown` — should be private
- **File:** `/home/user/VGC-Team-Report/src/lib/utils/export-paste.ts`, line 20 (`export function pokemonToShowdown`)
- **Evidence:** Only callers in production are line 78 of the same file (inside `teamToShowdown`). External hits are exclusively in `src/lib/utils/__tests__/export-paste.test.ts`. Sibling `pokemonToOpenSheet` was already privatised in the same module — this one was missed.
- **Confidence:** MEDIUM-HIGH — same pattern as `pokemonToOpenSheet` last round.
- **Recently changed?** No.
- **Proposed action:** Drop the `export` keyword. Either delete the per-pokemon tests or convert them to call `teamToShowdown([mon])`.

#### 5. `useTeamMeta.ts` `ReportTags` — duplicate exported interface
- **File:** `/home/user/VGC-Team-Report/src/hooks/useTeamMeta.ts`, lines 5–15 (11 lines)
- **Symbol:** `export interface ReportTags`
- **Evidence:**
  ```bash
  rg "import.*ReportTags.*from"
  src/components/report/TeamOverview.tsx:11:import type { ReportTags } from "@/lib/data/tags";
  src/components/report/TeamReport.tsx:8:import type { ReportTags } from "@/lib/data/tags";
  src/components/ui/PdfExport.tsx:7:import type { ReportTags } from "@/lib/data/tags";
  ```
  All three external consumers import the canonical `ReportTags` from `@/lib/data/tags`. The copy in `useTeamMeta.ts` is only used internally on lines 39 and 181 of the same file, but kept exported. (The interfaces differ slightly: the hook version adds `regulationAutoDetected?: boolean` — see comment on line 12.)
- **Confidence:** MEDIUM — the local interface IS used internally so don't delete the type, but the `export` is unnecessary. Better long-term: reconcile with the canonical type by adding `regulationAutoDetected?: boolean` to `src/lib/data/tags.ts:ReportTags` and dropping the local copy entirely. That's a refactor; for tonight, just drop the `export`.
- **Recently changed?** **NO**, `useTeamMeta.ts` is in `main-changed-files.md` — **conflict-risk overlap (see section at bottom)**.
- **Proposed action:** Drop the `export` keyword on line 5. Lower priority because of conflict risk.

#### 6. `src/hooks/useUndoRedo.ts` `UndoRedoSnapshot` — internal-only type
- **File:** `/home/user/VGC-Team-Report/src/hooks/useUndoRedo.ts`, line 7
- **Symbol:** `export interface UndoRedoSnapshot`
- **Evidence:** All references (lines 18, 23, 43, 50) are in the same file. Zero external importers.
- **Confidence:** HIGH — externally unused.
- **Recently changed?** No.
- **Proposed action:** Drop the `export` keyword.

#### 7. `src/hooks/useCollaborativeSync.ts` `SyncStatus` — internal-only type
- **File:** `/home/user/VGC-Team-Report/src/hooks/useCollaborativeSync.ts`, line 6
- **Symbol:** `export type SyncStatus`
- **Evidence:** All uses (lines 32, 58, 78, 90, 93, 95, 117, 125) are inside the same file. Zero external importers.
- **Confidence:** HIGH — externally unused.
- **Recently changed?** No.
- **Proposed action:** Drop the `export` keyword.

#### 8. `src/lib/data/tags.ts` `Archetype` / `Regulation` types — dead exports
- **File:** `/home/user/VGC-Team-Report/src/lib/data/tags.ts`, lines 31–32 (2 lines)
- **Symbols:** `export type Archetype = (typeof ARCHETYPES)[number]` and `export type Regulation = (typeof REGULATIONS)[number]`
- **Evidence:** Greppable: no `import { Archetype }` / `import { Regulation }` anywhere in `src/`. The runtime constants `ARCHETYPES` and `REGULATIONS` ARE used externally (in `ExploreFilters.tsx`, `TeamOverview.tsx`, `AddOpponentInput.tsx`), but the derived `(typeof X)[number]` type aliases are not. Note: `EventType` on line 33 is correctly non-exported — `Archetype`/`Regulation` are inconsistent with that pattern.
- **Confidence:** HIGH — derived utility types nobody imports.
- **Recently changed?** **YES** — `src/lib/data/tags.ts` IS in `main-changed-files.md`. **Conflict-risk.**
- **Proposed action:** Drop the `export` keyword on both (4 chars, but increases conflict-risk on a hot file). Could safely skip this round if main has pending diffs that add a consumer.

#### 9. `src/lib/cache.ts` `CacheKeys.spotlight` / `CacheKeys.topPokemon` and `CacheTTL.SPOTLIGHT` / `CacheTTL.TOP_POKEMON`
- **File:** `/home/user/VGC-Team-Report/src/lib/cache.ts`, lines 114–115 and 123–124
- **Symbols:** Four object properties on exported records.
- **Evidence:** Only refs are the definitions themselves. The spotlight route hard-codes `SPOTLIGHT_ID = "TRjVuD8B"` and **does not use the cache** (no `cacheGet`/`cacheSet` calls), so these helpers were added speculatively. No top-pokemon callers anywhere.
- **Confidence:** MEDIUM — could be intended for upcoming wiring, but currently dead. Tiny saving (4 object properties, ~6 lines total).
- **Recently changed?** No.
- **Proposed action:** Remove the four properties. Trivial.

---

## Conflict-risk overlap with `.swarm/main-changed-files.md`

Cross-checked every finding against the changed-on-main list:

| # | Finding | File | On main-changed? |
|---|---|---|---|
| 1 | DisplayTogglePill.tsx (entire file) | `src/components/display/DisplayTogglePill.tsx` | NO |
| 2 | useGlobalDisplayPrefs.ts (entire file) | `src/lib/hooks/useGlobalDisplayPrefs.ts` | NO |
| 3 | exportAsPdf | `src/lib/utils/export-report.ts` | NO |
| 4 | pokemonToShowdown export | `src/lib/utils/export-paste.ts` | NO |
| 5 | useTeamMeta ReportTags export | `src/hooks/useTeamMeta.ts` | **YES — verify before changing** |
| 6 | UndoRedoSnapshot export | `src/hooks/useUndoRedo.ts` | NO |
| 7 | SyncStatus export | `src/hooks/useCollaborativeSync.ts` | NO |
| 8 | Archetype/Regulation type exports | `src/lib/data/tags.ts` | **YES — verify before changing** |
| 9 | CacheKeys/CacheTTL unused props | `src/lib/cache.ts` | NO |

**Adjacent risk note:** `src/lib/utils/sprite-slug.ts`, `src/lib/utils/sprite-url.ts`, `src/lib/analysis/detect-regulation.ts`, `src/lib/data/champions-dex.ts`, `src/lib/data/mega-pokemon.ts`, `src/lib/data/pokemon.ts`, `src/lib/data/tags.ts`, and `src/lib/validation/champions-legality.ts` are all on the changed-files list. I re-verified all their exports — every one of them has callers and none should be flagged.

---

## Cross-checked, NOT recommending action

These had a low ref count in initial grep but on inspection turn out to be live or external:

| Symbol | File | Why it's live |
|---|---|---|
| `parseFiltersFromUrl` / `buildUrlSearch` | `src/hooks/useExploreUrlSync.ts` | Only external refs are the test file. **But** `useExploreUrlSync.ts` IS in main-changed-files; making them private now would conflict. Leave for next pass. |
| All `/api/*/route.ts` orphan-looking endpoints | various | Re-verified all 51 routes; the carryover list from 23-05-26 still holds (cron, webhooks, sprite proxy, oembed, etc.). One newer addition `/api/match-log` IS internally used by `MatchTracker.tsx`. |
| `sendWeeklySummary` (deprecated re-export) | `src/lib/email.ts:73` | Used by `src/app/api/bot/route.ts:3` via re-export. Keep. |
| Pokemon Champions data sets (`CHAMPIONS_DEX`, `MEGA_BY_KEY`, etc.) | `src/lib/data/*` | All used by champions pages, sitemap, detect-regulation, and integrity tests. |
| `WALKTHROUGH_STEPS`, `GEN_THEMES`, `ACCENT_THEMES`, `NATURES`, etc. | various | All have live consumers. |
| `validateMegaCoverage` | `src/lib/data/__validate-mega-coverage.ts` | Dynamically imported in `src/instrumentation.ts:14` (per prior audit), still true. |

---

## Summary table

| # | Item | Type | Lines | Confidence | Conflict-risk? | Recommended action |
|---|---|---|---|---|---|---|
| 1 | `DisplayTogglePill` (full file) | Component | 267 | HIGH | No | **Delete file + empty `src/components/display/` dir** |
| 2 | `useGlobalDisplayPrefs` (full file) | Hook | 51 | HIGH | No | **Delete file + empty `src/lib/hooks/` dir** |
| 3 | `exportAsPdf` + `getJsPDF` helper | Lib export | 24 | HIGH | No | **Delete; also `npm uninstall jspdf`** |
| 4 | `pokemonToShowdown` | Lib export | 1 line change | MEDIUM-HIGH | No | Drop `export` |
| 5 | `useTeamMeta` `ReportTags` | Hook export | 1 line change | MEDIUM | **YES** | Drop `export` (skip if main has conflicts) |
| 6 | `UndoRedoSnapshot` | Hook export | 1 line change | HIGH | No | Drop `export` |
| 7 | `SyncStatus` | Hook export | 1 line change | HIGH | No | Drop `export` |
| 8 | `Archetype` + `Regulation` types | Lib export | 2 line changes | HIGH | **YES** | Drop `export` (skip if main has conflicts) |
| 9 | Cache spotlight/topPokemon props + TTLs | Lib export | 4 properties | MEDIUM | No | Remove props |

**Total deletable lines (items 1–3):** ~342 lines, 2 whole files, 2 empty directories, 1 npm dep gone (`jspdf`).
**Total de-exportable surface (items 4–8):** 5 symbols of public-API noise reduced.

---

## Search commands used (for reproducibility)

```bash
# Whole-symbol search excluding tests/self file
rg "\b<SYMBOL>\b" src/ --type-add 'ts:*.{ts,tsx}' -tts

# Component JSX call-site search (catches dynamic imports too)
rg "<DisplayTogglePill|import.*DisplayTogglePill" src/

# Dependency import discovery
rg "from .['\"]<DEP>['\"]|import\(.['\"]<DEP>['\"]" src/

# Cross-reference with main-changed-files
cat .swarm/main-changed-files.md | xargs -I{} rg "{}" .swarm/c1-dead-code-29-06-26.md
```

All commands were executed from `/home/user/VGC-Team-Report/`.
