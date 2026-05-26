# Dead Code Scan — 2026-05-26

Scanned `src/lib/`, `src/components/`, `src/hooks/`, `src/app/api/`, and `package.json` dependencies.
Conflict-risk files flagged with `[CONFLICT RISK]`.

---

## 1. Unused Exports

### HIGH — Definitely dead (zero import sites in production code)

| File | Export | Notes |
|------|--------|-------|
| `src/hooks/useScrollHide.ts` | `useScrollHide` (entire file) | Zero imports anywhere. Was likely replaced by a different scroll behavior. Safe to delete file. |
| `src/lib/utils/export-report.ts` | `exportAsPdf` | Zero callers in production code (only referenced in i18n translation strings as a UI label). `jspdf` dependency is only used by this function. |
| `src/lib/sharing/url-codec.ts` | `encodeShareState` | Zero production callers. Only used in `__tests__/url-codec.test.ts`. The counterpart `decodeShareState` IS used. |
| `src/lib/sharing/url-codec.ts` | `SerializedGamePlanSchema`, `SerializedMatchupPlanSchema`, `ShareableStateSchema` | Zod schemas not imported outside their own file + test file. The TypeScript interfaces (`SerializedGamePlan`, `SerializedMatchupPlan`, `ShareableState`) ARE widely used. |
| `src/lib/rate-limit.ts` | `isRateLimited` (sync version) | Only imported by test file. Production code uses `isRateLimitedAsync` exclusively. |
| `src/lib/analysis/detect-regulation.ts` | `detectRegulationWithSignals` (export) | The function IS used internally by `detectRegulation()` in the same file, but the `export` is dead — zero external callers. |
| `src/lib/analysis/detect-regulation.ts` | `RegulationDetection` (interface) | Zero external imports. Only used as the return type of `detectRegulationWithSignals`. |
| `src/lib/utils/export-paste.ts` | `pokemonToOpenSheet` | Zero imports. `teamToOpenSheet` is used (it may call `pokemonToOpenSheet` internally). |
| `src/lib/utils/paste-edit.ts` | `replaceSpeciesInBlock` | Zero external imports. Internal helper for `replacePokemonSpecies`. |
| `src/lib/utils/normalize-report.ts` | `migrateCalcEntries` | Zero external imports. Used only internally within `normalizeReportData`. |
| `src/lib/templates.ts` | `ReportTemplate` (interface) | Zero external imports. Only used to type `REPORT_TEMPLATES` and `getTemplate` within the same file. |
| `src/lib/data/moves.ts` | `MoveCategory`, `MoveFlag`, `MoveData` (types) | Zero external imports. Only used within the same file. |
| `src/lib/data/natures.ts` | `NatureData` (interface) | Zero external imports. Only used within the same file. |

### MEDIUM — Probably dead

| File | Export | Notes |
|------|--------|-------|
| `src/hooks/useExploreUrlSync.ts` | `FilterState` (interface) | Not imported externally. `ExploreUrlSyncResult extends FilterState` so removing requires refactoring the hook's return type. |
| `src/hooks/useCollaborativeSync.ts` | `SyncStatus` (type) | Not imported externally. Only used internally. |
| `src/hooks/useUndoRedo.ts` | `UndoRedoSnapshot` (interface) | Not imported externally. Only used internally. |
| `src/hooks/useTeamReport.ts` | `ViewMode` (type) | Not imported externally. Only used internally. |
| `src/lib/security/cors.ts` | `isDynamicAllowedOrigin` | Only used internally by `getCorsHeaders` and `isAllowedOrigin` in the same file. The export is unnecessary. |
| `src/lib/security/csrf.ts` | `generateCsrfToken` | Only used internally by `setCsrfCookie` in the same file. The export is unnecessary. |

### LOW — Uncertain / intentionally public API

| File | Export | Notes |
|------|--------|-------|
| `src/lib/sharing/redact-paste.ts` | `PrivateField` (type) | Not imported externally but serves as documentation for the valid field values. |
| `src/lib/accent-themes.ts` | `AccentTheme` (interface) | Not directly imported by name, but the interface shapes the `ACCENT_THEMES` array elements. |

---

## 2. Orphaned Components

**None found.** Every React component in `src/components/` is imported by at least one page or another component.

---

## 3. Dead API Routes

### HIGH — No client-side callers, no cron schedule

| Route | Risk | Notes |
|-------|------|-------|
| `/api/migrate` | HIGH | One-time migration utility. No cron in `vercel.json`, no client caller, no external trigger. Protected by `MIGRATE_SECRET`. Designed to be run once and discarded. Safe to remove. |

### LOW — Called externally (correctly no client-side callers)

| Route | Notes |
|-------|-------|
| `/api/bot` | Discord bot interactions endpoint. Called by Discord's webhook system. **Keep.** |
| `/api/discord` | Discord slash-command interactions endpoint. Called by Discord externally. **Keep.** |
| `/api/cleanup` | Daily Vercel cron job (`0 3 * * *` in `vercel.json`). **Keep.** |
| `/api/setup` | Database setup utility. Called manually. **Keep.** |
| `/api/webhooks/*` | Clerk, Linear, PostHog webhook endpoints. Called by their respective services. **Keep.** |

---

## 4. Unused Dependencies

### HIGH — Zero imports in `src/`

| Package | Evidence | Notes |
|---------|----------|-------|
| `axios` | Zero imports anywhere in `src/`. All HTTP calls use native `fetch`. | Safe to remove. `npm uninstall axios`. |

### MEDIUM — Used only by dead code

| Package | Evidence | Notes |
|---------|----------|-------|
| `jspdf` | Only imported by `exportAsPdf` in `src/lib/utils/export-report.ts`, which itself has zero callers. | If `exportAsPdf` is removed, `jspdf` can go too. Dynamic import so no bundle impact currently. |

### LOW — All other dependencies are actively used

All other `package.json` dependencies have verified active import sites in production code: `@clerk/nextjs` (53), `@pkmn/dex` (26), `zod` (23), `motion` (10+), `posthog-js` (5), `html2canvas-pro` (5), `vanilla-cookieconsent` (4), `@opentelemetry/*` (4), `@upstash/*` (3), `qrcode` (2), `@neondatabase/serverless`, `@sentry/nextjs`, `posthog-node`, `@microsoft/clarity`, `tweetnacl` (1 each).

---

## 5. Conflict-Risk Annotations

The following recently-changed files were checked for overlap with dead code findings:

| File | Status |
|------|--------|
| `src/app/page.tsx` | `[CONFLICT RISK]` — No dead code in this file. Imports `exportAsImage` (kept) not `exportAsPdf` (dead). Safe. |
| `src/app/sitemap.ts` | `[CONFLICT RISK]` — No dead code. |
| `src/components/explore/ExploreFilters.tsx` | `[CONFLICT RISK]` — No dead code. |
| `src/components/layout/Navbar.tsx` | `[CONFLICT RISK]` — No dead code. |
| `src/components/social/DoubleTapLikeOverlay.tsx` | `[CONFLICT RISK]` — No dead code. |
| `src/components/ui/ShareModal.tsx` | `[CONFLICT RISK]` — No dead code. |
| `src/components/ui/TeamCardExport.tsx` | `[CONFLICT RISK]` — No dead code. |
| `src/hooks/useHomePage.ts` | `[CONFLICT RISK]` — No dead code. |
| `src/lib/email.ts` | `[CONFLICT RISK]` — No dead code. All 5 exports actively used. |

**No dead code recommendations touch conflict-risk files.**

---

## 6. Recommended Actions (Prioritized)

### Immediate (safe, no risk)
1. **Delete** `src/hooks/useScrollHide.ts` — entire file is dead
2. **`npm uninstall axios`** — zero usage
3. **Delete** `src/app/api/migrate/route.ts` — one-time utility, already completed

### Low effort (remove `export` keyword or dead function)
4. Remove `export` from `detectRegulationWithSignals` and `RegulationDetection` in `detect-regulation.ts`
5. Remove `export` from `replaceSpeciesInBlock` in `paste-edit.ts`
6. Remove `export` from `migrateCalcEntries` in `normalize-report.ts`
7. Remove `export` from `isRateLimited` (sync) in `rate-limit.ts`
8. Remove `export` from `MoveCategory`, `MoveFlag`, `MoveData` in `moves.ts`
9. Remove `export` from `NatureData` in `natures.ts`
10. Remove `export` from `ReportTemplate` in `templates.ts`
11. Remove `export` from `pokemonToOpenSheet` in `export-paste.ts`

### Requires judgment
12. Remove `exportAsPdf` from `export-report.ts` + `npm uninstall jspdf` (was this feature intentionally shelved? The i18n strings still reference it)
13. Remove `encodeShareState` + Zod schemas from `url-codec.ts` (test file would need updating)

---

## Summary

| Category | Count | Estimated LOC |
|----------|-------|---------------|
| Entirely dead files | 2 (`useScrollHide.ts`, `/api/migrate/route.ts`) | ~230 lines |
| Dead exports (drop `export` keyword) | ~12 | ~0 (keyword only) |
| Dead functions (remove body) | 1 (`exportAsPdf`) | ~20 lines |
| Unused npm dependencies | 1-2 (`axios`, possibly `jspdf`) | — |
| Orphaned components | 0 | — |
| Dead pages/routes | 0 | — |
