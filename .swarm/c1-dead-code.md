# Dead Code Audit -- 2026-05-27

## Unused Hook

- `src/hooks/useScrollHide.ts` -- not imported anywhere in the codebase

## Unused Dependency

- **axios** -- never imported in `src/`. Only present because `start-server-and-test` pulls `wait-on` which uses it. Safe to remove from top-level `dependencies`.

## Unused Exports (never imported outside defining file, excluding tests)

| Symbol | File | Notes |
|--------|------|-------|
| `pokemonToShowdown` | `src/lib/utils/export-paste.ts` | Only tested, never called from app |
| `pokemonToOpenSheet` | `src/lib/utils/export-paste.ts` | Only tested, never called from app |
| `migrateCalcEntries` | `src/lib/utils/normalize-report.ts` | Dead after calc migration completed |
| `replaceSpeciesInBlock` | `src/lib/utils/paste-edit.ts` | Unused utility |
| `MoveCategory` | `src/lib/data/moves.ts` | Type export, never imported |
| `MoveFlag` | `src/lib/data/moves.ts` | Type export, never imported |
| `MoveData` | `src/lib/data/moves.ts` | Type export, never imported |
| `NatureData` | `src/lib/data/natures.ts` | Type export, never imported |
| `RegulationDetection` | `src/lib/analysis/detect-regulation.ts` | Type, never imported |
| `detectRegulationWithSignals` | `src/lib/analysis/detect-regulation.ts` | Function never called |
| `isDynamicAllowedOrigin` | `src/lib/security/cors.ts` | Never called |
| `generateCsrfToken` | `src/lib/security/csrf.ts` | Never called |
| `PrivateField` | `src/lib/sharing/redact-paste.ts` | Type, never imported |
| `SerializedGamePlanSchema` | `src/lib/sharing/url-codec.ts` | Only in tests |
| `SerializedMatchupPlanSchema` | `src/lib/sharing/url-codec.ts` | Only in tests |
| `ShareableStateSchema` | `src/lib/sharing/url-codec.ts` | Only in tests |
| `encodeShareState` | `src/lib/sharing/url-codec.ts` | Only in tests |

## Previously Identified (still present)

- `PdfExportButton` in `src/components/ui/PdfExport.tsx` -- still unused
- `sanitizeInput` in `src/lib/security/input-validation.ts` -- still unused

## Duplicate Routes

- `/notifications` and `/dashboard/notifications` serve different notification pages. `NotificationBell` links to `/notifications`; dashboard links to `/dashboard/notifications`. Likely the standalone one is legacy.

## Admin-Only Routes (not dead, but never called from client)

- `src/app/api/migrate/route.ts` -- manual curl; Vercel cron does not call it
- `src/app/api/cleanup/route.ts` -- Vercel cron at 3am
- `src/app/api/setup/route.ts` -- one-time DB bootstrap

## Recently Changed Files (conflict risk)

`src/app/page.tsx`, `src/app/changelog/ChangelogContent.tsx`, `src/components/layout/Navbar.tsx`, `src/app/sitemap.ts` -- all actively used, none are dead code.
