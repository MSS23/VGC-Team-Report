# Wave 1 — C1 Dead Code Audit

**Date:** 2026-06-07
**Scope:** `src/components/**`, `src/hooks/**`, `src/lib/**`, `package.json`
**Method:** Per-symbol grep with self-file/test exclusion; cross-checked previous audits in `.swarm/c1-dead-code-23-05-26.md` and noted entries that have since been fixed (`Badge`, `useScrollHide`, `encodeShareState`, `detectRegulationWithSignals` no longer require action — they have already been removed or made private).

---

## CONFIRMED DEAD (safe to remove)

### 1. `src/components/display/DisplayTogglePill.tsx:48` — `DisplayTogglePill` — verified zero call sites via grep
- `grep -rn "DisplayTogglePill" src/` returns only the export declaration itself and an unrelated reference inside the orphaned `useGlobalDisplayPrefs.ts` doc comment. No JSX usage anywhere (`<DisplayTogglePill` returns 0 matches). No dynamic `import("…/DisplayTogglePill")`. The entire `src/components/display/` directory contains only this single orphaned file.
- Removal: delete the entire file `src/components/display/DisplayTogglePill.tsx` (267 lines). The directory becomes empty — remove `src/components/display/` too.
- Risk: low. This is a self-contained presentational component with no side-effects.

### 2. `src/lib/hooks/useGlobalDisplayPrefs.ts:36` — `useGlobalDisplayPrefs` — verified zero call sites via grep
- `grep -rn "useGlobalDisplayPrefs" src/` returns ONLY the export declaration. Zero importers, zero `from "@/lib/hooks/useGlobalDisplayPrefs"` matches. The only thing that ever consumed this hook was `DisplayTogglePill` (item 1), which is also dead.
- Removal: delete the entire file `src/lib/hooks/useGlobalDisplayPrefs.ts` (52 lines). The `src/lib/hooks/` directory becomes empty — remove it too.
- Risk: low. localStorage key `"vgc.display.pillSeen"` will be left orphaned in users' browsers but is never read again, so harmless.

### 3. `src/lib/utils/export-paste.ts:20` — `pokemonToShowdown` (export keyword only) — verified no production callers
- `grep -rn "pokemonToShowdown" src/` returns 2 production matches: (a) the definition, (b) `teamToShowdown` wrapper one file away. Plus 7 hits inside `src/lib/utils/__tests__/export-paste.test.ts` (test file only).
- Removal: drop the `export` keyword so it becomes a module-local helper of `teamToShowdown`. Either (a) delete the per-pokemon tests, or (b) update tests to call `teamToShowdown([mon])`.
- Risk: low. Same finding carried from the 2026-05-23 audit and still untouched. `pokemonToOpenSheet` (the sibling counterpart) has already been de-exported.

### 4. `src/lib/rate-limit.ts:84` — `isRateLimited` (sync wrapper) — verified test-only
- `grep -rn "isRateLimited[^A]" src/` (excludes `isRateLimitedAsync`): production code only references `isRateLimitedAsync`. The sync `isRateLimited` is referenced 9 times in `src/lib/__tests__/rate-limit.test.ts` and nowhere else. The function itself carries a `// Kept for backward compatibility — prefer isRateLimitedAsync` comment on line 82.
- Removal: drop the `export` keyword (and consider deleting the function entirely after migrating the tests to `isRateLimitedAsync`, which calls the same `isRateLimitedInMemory` helper). 6 lines of public API plus ~50 lines of test coverage to migrate.
- Risk: low. The async variant exercises the same in-memory backing path.

---

## SUSPECTED DEAD (verify before removing)

### 5. `src/lib/utils/paste-edit.ts:59` — `replaceSpeciesInBlock` — only one internal caller in the same file
- Used solely by `replacePokemonSpecies` (line 97 of the same file). No external imports. Same finding as prior audit, still valid.
- Action: drop `export`.

### 6. `src/lib/security/cors.ts:18` — `isDynamicAllowedOrigin` — only internal callers
- Two callers inside the same `cors.ts` (lines 27, 41) and zero external imports. Same finding as prior audit.
- Action: drop `export`.

### 7. `src/lib/security/csrf.ts:17` — `generateCsrfToken` — only internal caller
- Single caller inside the same `csrf.ts` (`setCsrfCookie`, line 49). Security-adjacent — keeping it exported costs nothing, but it does leak module surface.
- Action: drop `export` (low priority).

### 8. `src/lib/data/tags.ts:18,19` — `Archetype`, `Regulation` (type exports) — never imported as types
- `grep` for `import.*Archetype` and `import.*Regulation` from `@/lib/data/tags` returns 0 hits — only the value exports `ARCHETYPES`, `REGULATIONS`, `EVENT_TYPES` plus `ReportTags` are consumed. The companion type `EventType` is already non-exported (line 20).
- Action: drop `export` from the two type aliases. Keep `ReportTags` (it has 4 importers).

### 9. `src/lib/utils/normalize-report.ts:10` — `migrateCalcEntries` — only one internal caller
- Used only by `normalizeReportData` in the same file (line 102). Carried over from prior audit; that audit flagged this file as recently churned, so confirm with author. Still 0 external imports today.
- Action: drop `export` after a quick author sanity-check.

---

## DEPENDENCIES TO REMOVE

None at high confidence. All packages in `dependencies` were verified imported under `src/`:

| Package | Verified import location |
|---|---|
| `@microsoft/clarity` | `src/components/providers/ClarityProvider.tsx` |
| `qrcode` (+ `@types/qrcode`) | `src/components/ui/OTSSheetModal.tsx`, `src/components/report/TeamOverview.tsx` |
| `tweetnacl` | `src/app/api/discord/route.ts` |
| `@upstash/ratelimit`, `@upstash/redis` | `src/lib/rate-limit.ts`, `src/lib/cache.ts` |
| `vanilla-cookieconsent` | `src/components/providers/CookieBanner.tsx`, `src/lib/consent.ts` |
| `@opentelemetry/*` | `src/instrumentation.ts` |
| `jspdf` | `src/lib/utils/export-report.ts` |
| `html2canvas-pro` | `src/lib/dynamic-imports/html2canvas.ts` |
| `@pkmn/dex` | `src/lib/data/pkmn-dex-fallback.ts` (and friends) |

No dependency is safe to remove tonight.

---

## DO NOT REMOVE (false alarms — explain why used)

| Symbol | Why it's live |
|---|---|
| `Badge`, `useScrollHide`, `encodeShareState`, `detectRegulationWithSignals` | Already removed/de-exported per prior audit; files no longer exist or are already private. The 2026-05-23 audit report is stale on these. |
| `sendWeeklySummary` (`src/lib/email.ts:73`) | Aliased re-export of `sendEmail`, but `src/app/api/bot/route.ts` actively imports and calls it. The `@deprecated` JSDoc is misleading — there is still one live caller. |
| `buildWeeklySummaryHtml`, `sendWelcomeEmail` | Live callers in `src/app/api/bot/route.ts` and `src/app/api/webhooks/clerk/route.ts`. |
| `escapeHtml` re-export from `src/lib/email.ts:12` | `src/app/api/cron/weekly-digest/route.ts:3` imports it through `@/lib/email`. The comment on line 7-11 documents the intentional re-export. |
| `validateMegaCoverage` (`src/lib/data/__validate-mega-coverage.ts`) | Dynamically imported in `src/instrumentation.ts:14` and statically imported in the test. |
| `useGlobalDisplayPrefs` import-comment reference inside `src/lib/hooks/useGlobalDisplayPrefs.ts` doc-block | The string `DisplayTogglePill` appears once as text in the JSDoc — it is NOT a live reference. Both files are dead together (items 1 & 2). |
| `isRateLimited` test-only export | Tests still use it; flag for migration, but don't yank without porting the test file (item 4). |
| `PageNavbar`, `PageFooter`, `PersistentNavbar`, `TournamentMode`, `PrintableTournamentMode`, `MetaSnapshot`, `MatchTracker`, all `social/*` components | Each has at least one verified importer in `src/app/**` or another component. |

---

## Summary (top 15 most confident findings)

| # | Item | File | Lines | Confidence | Action |
|---|---|---|---|---|---|
| 1 | `DisplayTogglePill` (whole file) | `src/components/display/DisplayTogglePill.tsx` | 267 | HIGH | Delete file + empty dir |
| 2 | `useGlobalDisplayPrefs` (whole file) | `src/lib/hooks/useGlobalDisplayPrefs.ts` | 52 | HIGH | Delete file + empty dir |
| 3 | `pokemonToShowdown` export | `src/lib/utils/export-paste.ts:20` | 56 | HIGH | Drop `export` |
| 4 | `isRateLimited` sync export | `src/lib/rate-limit.ts:84` | 8 | HIGH | Drop `export` (test-only) |
| 5 | `replaceSpeciesInBlock` export | `src/lib/utils/paste-edit.ts:59` | 13 | MEDIUM-HIGH | Drop `export` |
| 6 | `isDynamicAllowedOrigin` export | `src/lib/security/cors.ts:18` | 5 | MEDIUM | Drop `export` |
| 7 | `Archetype` type export | `src/lib/data/tags.ts:18` | 1 | MEDIUM | Drop `export` |
| 8 | `Regulation` type export | `src/lib/data/tags.ts:19` | 1 | MEDIUM | Drop `export` |
| 9 | `generateCsrfToken` export | `src/lib/security/csrf.ts:17` | 6 | LOW | Drop `export` (security-adjacent) |
| 10 | `migrateCalcEntries` export | `src/lib/utils/normalize-report.ts:10` | ~25 | LOW (recently churned) | Confirm with author then drop `export` |

**Total deletable lines (items 1-2):** 319 lines, two files removed, two empty directories cleaned up.
**Total de-exportable lines (items 3-10):** ~115 lines of public-API surface reduced.
**Dependencies to remove:** 0.
**Large commented-out code blocks (>5 lines):** none found — every multi-line `//` block in `src/` is a doc/explanation comment, not commented code.

---

## Search commands used

```bash
# Per-symbol production usage (excludes self-file and tests)
grep -rn "\bSYMBOL\b" src/ --include='*.ts' --include='*.tsx'

# Component JSX usage
grep -rn "<SYMBOL" src/ --include='*.ts' --include='*.tsx'

# Dynamic import detection
grep -rn "import(.*SYMBOL" src/ --include='*.ts' --include='*.tsx'

# Dependency usage
grep -rn "from ['\"]PACKAGE['\"]" src/

# Large commented blocks
awk per-file scan for >=6 consecutive `^\s*//` lines (results manually inspected)
```
