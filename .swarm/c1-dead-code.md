# C1 Dead Code Scan

_Scanned: 2026-07-06 (nightly). 276 non-test TS/TSX files. Static grep across `src/**`. No modifications made._

Recent 20 commits reviewed for half-migrated code — nothing obviously abandoned. The `§5.6/§5.7 shared icon set` commit produced `src/components/ui/icons.tsx`; all 31 icon exports are consumed.

---

## High confidence (safe to delete)

### Orphan components / hooks (no importer anywhere)

- `src/components/display/DisplayTogglePill.tsx:48` — `DisplayTogglePill` — 267-line floating "Form (Base/Mega)" pill. Zero non-self references. `src/components/display/` contains ONLY this file, so the entire directory can be removed.
- `src/lib/hooks/useGlobalDisplayPrefs.ts:36` — `useGlobalDisplayPrefs` — 51-line localStorage hook (`vgc.display.pillSeen`). ONLY consumer would have been `DisplayTogglePill`, which is itself dead. Sole external mention is a doc-comment sentence pointing at the pill. Delete together.
- `src/components/providers/ConsentGate.tsx:19` — `ConsentGate` — 37-line render-gate for analytics consent. Zero importers. `PostHogProvider` already gates itself via `hasAnalyticsConsent()`/`onConsentChange()` directly — this wrapper was never wired into any layout. The imported utilities from `lib/consent.ts` remain live via `PostHogProvider`.

### Truly dead function

- `src/lib/rate-limit.ts:84` — `isRateLimited` (sync) — ~8 lines. Only its own `__tests__/rate-limit.test.ts` still imports it; JSDoc itself says "prefer `isRateLimitedAsync`." Flagged in every scan since May; no production caller has appeared. Delete function + delete the sync-only tests (keep the async coverage in the same file).

**Total high-confidence deletion: ~363 LOC + one empty directory.**

---

## Medium confidence (verify manually — remove `export`, keep code)

These identifiers are referenced only inside their defining file. Downgrade the `export` to make the module surface honest; the runtime code is fine.

- `src/lib/templates.ts:1,13` — `ReportTemplate` type, `REPORT_TEMPLATES` const
- `src/lib/notifications.ts:3` — `NotificationType`
- `src/lib/accent-themes.ts:3` — `AccentTheme` type
- `src/lib/validation/champions-legality.ts:29` — `LegalitySeverity`
- `src/lib/data/moves.ts:3,4,10` — `MoveCategory`, `MoveFlag`, `MoveData`
- `src/lib/data/natures.ts:3` — `NatureData`
- `src/lib/data/type-chart.ts` — `TYPE_CHART` (used only by same-file helper)
- `src/lib/data/mega-pokemon.ts` — `getRegMBMegas`
- `src/lib/data/dex-subset.ts` — `DexSubsetMegaStone`, `asPokemonTypes`
- `src/lib/posthog-server.ts` — `flushServerEvents` (called only by same-file `after()`)
- `src/lib/security/csrf.ts` — `generateCsrfToken` (called by same-file middleware)
- `src/lib/security/cors.ts` — `isDynamicAllowedOrigin` (called by same-file `getCorsHeaders`)
- `src/lib/utils/multi-import.ts:8` — `ImportSource`
- `src/lib/utils/normalize-report.ts:10` — `migrateCalcEntries`
- `src/lib/utils/paste-edit.ts:59` — `replaceSpeciesInBlock`
- `src/lib/sharing/url-codec.ts:11,18,39` — `SerializedGamePlanSchema`, `SerializedMatchupPlanSchema`, `ShareableStateSchema`
- `src/lib/sharing/redact-paste.ts:21` — `PrivateField`
- `src/lib/analysis/detect-regulation.ts:62,71` — `detectRegulationWithSignals`, `RegulationDetection`
- `src/lib/contexts/VersionDiffContext.tsx:6` — `VersionDiffState`
- `src/lib/utils/export-paste.ts:20,86` — `pokemonToShowdown`, `pokemonToOpenSheet` (per-pokemon helpers; only tests import them — leave export IF tests want direct access, otherwise drop)
- `src/hooks/useExploreUrlSync.ts` — `FilterState`
- `src/hooks/useMatchupPlans.ts` — `GamePlanSlots`
- `src/hooks/useWalkthrough.ts` — `WALKTHROUGH_STEPS`
- `src/hooks/useCollaborativeSync.ts` — `SyncStatus`
- `src/hooks/useDamageCalcs.ts` — `DamageCalcsMap`
- `src/hooks/useTeamReport.ts` — `ViewMode`
- `src/components/ui/PdfExport.tsx:25` — `PdfExportProps`
- `src/components/report/CommonModesSlide.tsx` — `TeamCombination`
- `src/components/seo/JsonLd.tsx` — `HowToStep`, `SportsEventData`, `BreadcrumbItem`, `FAQItem`

---

## npm deps with zero imports

None. All 20 runtime dependencies in `package.json` have at least one `from "<pkg>"` import in `src/**`. Prior `axios` removal is holding.

---

## Files to inspect for full removal

- `src/components/display/DisplayTogglePill.tsx` — orphan (see above). Removing it also removes the only file in `src/components/display/`, so delete the directory.
- `src/lib/hooks/useGlobalDisplayPrefs.ts` — orphan support-hook for the pill above; only file under `src/lib/hooks/`, so that directory also empties out.
- `src/components/providers/ConsentGate.tsx` — orphan wrapper (see above). `PostHogProvider` and `CookieBanner` remain.
- `src/app/api/migrate/route.ts` — one-shot admin migration route, still not in `vercel.json` crons. LOW confidence — idempotent, useful for future schema changes; keep unless the user has confirmed all data migrated. (~108 LOC recoverable.)

---

## Duplicate/Redundant (informational — not dead)

- `/notifications` (`NotificationsContent.tsx`, ~340 LOC) vs. `/dashboard/notifications` (`NotificationsContent.tsx`, ~213 LOC) — both actively linked (NotificationBell and DashboardContent respectively). Consolidation ticket, not a delete.

---

## Summary

| Category | Count | Lines |
|----------|-------|-------|
| High-confidence orphan files | 3 | ~355 |
| Dead sync function | 1 | ~8 |
| Unnecessary `export` keywords | ~35 | 0 (surface hygiene only) |
| Unused npm deps | 0 | — |
| **Total high-confidence recoverable** | | **~363 LOC + 2 empty dirs** |

Codebase remains in solid shape. The DisplayTogglePill+useGlobalDisplayPrefs pair is a new finding (last scan didn't flag them) — it's a 318-line dead feature. ConsentGate is a duplicate of gating logic already inlined in `PostHogProvider`. The `isRateLimited` sync function has been flagged for months and is still there.
