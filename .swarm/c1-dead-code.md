# Dead Code Scan — VGC Team Report

_Scanned: 2026-05-28. Static analysis (grep/find across 288 source files). No modifications made._

---

## Previously Flagged Items — Status

| Item | Status |
|------|--------|
| `useScrollHide` hook | **DELETED** (removed this run) |
| `ReactionBar` component | **DELETED** (removed this run) |
| `axios` dependency | **REMOVED** from package.json (removed this run) |
| `postBuildNotification` (discord-bot.ts) | **RESOLVED** — function removed since May 14 scan |
| `postToFeedbackChannel` (discord-webhook.ts) | **RESOLVED** — function removed since May 14 scan |
| `sanitizeInput` / `containsInjection` (input-validation.ts) | **RESOLVED** — functions removed since May 14 scan |
| `PdfExportButton` (PdfExport.tsx) | **VERIFY** — was flagged in May 13 scan (not re-checked this run) |

---

## New Findings

### 1. `ReportTemplate` type + `REPORT_TEMPLATES` constant — UNNECESSARY EXPORTS (HIGH)
- **File:** `src/lib/templates.ts` (lines 1, 13)
- **Issue:** Neither `ReportTemplate` nor `REPORT_TEMPLATES` is imported by any other file. Only `getTemplate` is imported externally (by `useHomePage.ts`). These are internal implementation details leaking into the public API.
- **Lines saved by making non-exported:** 0 (still needed internally). Remove `export` keyword only.
- **Confidence:** HIGH

### 2. `isRateLimited` (sync) — DEAD FUNCTION (HIGH)
- **File:** `src/lib/rate-limit.ts` (line 84)
- **Issue:** The synchronous `isRateLimited` function has zero external callers. All call sites use `isRateLimitedAsync` instead. The JSDoc itself says "legacy API -- prefer isRateLimitedAsync."
- **Lines saved:** ~8 (lines 80-90)
- **Confidence:** HIGH

### 3. `NotificationType` — UNNECESSARY EXPORT (HIGH)
- **File:** `src/lib/notifications.ts` (line 3)
- **Issue:** The type is used internally by `createNotification` (which IS used by 3 API routes) but is never imported externally.
- **Lines saved:** 0 (remove `export` keyword only)
- **Confidence:** HIGH

### 4. `AccentTheme` type — UNNECESSARY EXPORT (HIGH)
- **File:** `src/lib/accent-themes.ts` (line 3)
- **Issue:** Never imported externally. `ACCENT_THEMES`, `VIEW_TIERS`, `getUnlockedCount`, `getNextTier`, `applyAccentTheme` are all used -- but the `AccentTheme` type itself is not.
- **Lines saved:** 0 (remove `export` keyword only)
- **Confidence:** HIGH

### 5. `LegalitySeverity` type — UNNECESSARY EXPORT (MEDIUM)
- **File:** `src/lib/validation/champions-legality.ts` (line 29)
- **Issue:** Never imported externally. Used only as an internal type.
- **Confidence:** MEDIUM (could be imported by future champions validation UI)

### 6. `MoveCategory`, `MoveFlag`, `MoveData` types — UNNECESSARY EXPORTS (MEDIUM)
- **File:** `src/lib/data/moves.ts` (lines 3, 4, 10)
- **Issue:** None of these types are imported externally. Only `MOVES` and `lookupMove` are used by other files.
- **Confidence:** MEDIUM (types could be useful for future consumers)

### 7. `NatureData` type — UNNECESSARY EXPORT (MEDIUM)
- **File:** `src/lib/data/natures.ts` (line 3)
- **Issue:** Never imported externally. Only `NATURES` and `getNatureModifier` are imported.
- **Confidence:** MEDIUM

### 8. `pokemonToShowdown` + `pokemonToOpenSheet` — UNNECESSARY EXPORTS (MEDIUM)
- **File:** `src/lib/utils/export-paste.ts` (lines 20, 86)
- **Issue:** Both are internal helpers used only by `teamToShowdown` and `teamToOpenSheet` (which ARE imported). Only test files import the pokemon-level functions directly.
- **Lines saved:** 0 (remove `export` keyword only; keep for test access)
- **Confidence:** MEDIUM

### 9. `replaceSpeciesInBlock` — UNNECESSARY EXPORT (MEDIUM)
- **File:** `src/lib/utils/paste-edit.ts` (line 59)
- **Issue:** Used only internally by `replaceSpeciesInPaste` (line 97). Never imported externally.
- **Confidence:** MEDIUM

### 10. `migrateCalcEntries` — UNNECESSARY EXPORT (MEDIUM)
- **File:** `src/lib/utils/normalize-report.ts` (line 10)
- **Issue:** Used only internally by `normalizeReportData` (line 102). Never imported externally.
- **Confidence:** MEDIUM

### 11. `detectRegulationWithSignals` + `RegulationDetection` type — UNNECESSARY EXPORTS (MEDIUM)
- **File:** `src/lib/analysis/detect-regulation.ts` (lines 62, 71)
- **Issue:** Only `detectRegulation` is imported externally (by `useHomePage.ts`). The `WithSignals` variant and its return type are used internally but never imported.
- **Confidence:** MEDIUM (designed for diagnostic use -- may be needed in future UI)

### 12. `VersionDiffState` type — UNNECESSARY EXPORT (LOW)
- **File:** `src/lib/contexts/VersionDiffContext.tsx` (line 6)
- **Issue:** Never imported externally. Used internally as context state shape.
- **Confidence:** LOW (context types are commonly exported for consumers)

### 13. `ImportSource` type — UNNECESSARY EXPORT (LOW)
- **File:** `src/lib/utils/multi-import.ts` (line 8)
- **Issue:** Never imported externally. Used as return type of `detectImportSource`.
- **Confidence:** LOW (type narrowing for callers could be useful)

### 14. Zod schemas + `PrivateField` type — UNNECESSARY EXPORTS (LOW)
- **Files:** `src/lib/sharing/url-codec.ts` (lines 11, 18, 39); `src/lib/sharing/redact-paste.ts` (line 21)
- **Issue:** `SerializedGamePlanSchema`, `SerializedMatchupPlanSchema`, `ShareableStateSchema`, and `PrivateField` type are used internally but never imported externally.
- **Confidence:** LOW (Zod schemas could be useful for external validation)

### 15. `/api/migrate` route — STALE ADMIN ROUTE (LOW)
- **File:** `src/app/api/migrate/route.ts` (108 lines)
- **Issue:** One-time batch migration route. Not in `vercel.json` crons. Only callable via manual POST with `MIGRATE_SECRET`. If all data has been migrated, this is dead weight. However, it is idempotent and useful for future schema changes.
- **Lines saved:** ~108 if removed
- **Confidence:** LOW (useful to keep for future migrations)

---

## Duplicate/Redundant Pages (Informational)

Two separate notification pages exist:
- `/notifications` (340-line `NotificationsContent.tsx`) -- linked from `NotificationBell` component
- `/dashboard/notifications` (213-line `NotificationsContent.tsx`) -- linked from `DashboardContent`

Both are actively linked but serve the same purpose with different implementations. Consider consolidating into one route.

---

## What Is NOT Dead

Verified active despite appearing suspicious:
- **All 75+ components** in `src/components/` have at least one import (0 orphaned after ReactionBar deletion)
- **All hooks** are actively imported (after useScrollHide deletion)
- **All API routes** are either in `vercel.json` crons, called by external webhooks (Discord, Clerk, Linear, PostHog), fetched from frontend code, or pinged by health checks
- **All npm dependencies** are imported (after axios removal)
- **All lib files** at every nesting level are imported by at least one consumer
- `/api/keep-alive` -- actively pinged by `/api/cron/daily-ops` health check (stale doc comment says "every 5 min" but actual usage is daily)
- `/api/setup` -- admin endpoint referenced in middleware auth-bypass list, uses shared `ensureTable` utility
- `/api/bot` -- Discord bot interaction endpoint, called externally by Discord
- `/api/discord` -- Discord slash-command interaction endpoint (316 lines), externally triggered

---

## Summary Table

| Category | Count | Lines Recoverable |
|----------|-------|--------------------|
| Previously flagged (now resolved) | 6 | 0 (already cleaned) |
| Unnecessary `export` keywords | 15 | 0 (code stays, keyword goes) |
| Truly dead function (`isRateLimited` sync) | 1 | ~8 |
| Stale admin route (`/api/migrate`) | 1 | ~108 (if removed) |
| Duplicate page patterns | 1 | ~213 (if consolidated) |

**Total recoverable lines:** ~8 definite, ~321 if admin route removed + notifications consolidated.

The codebase is in good shape. The three highest-priority items from the prior scan (May 14) have all been cleaned up. The three items flagged by prior runs (`useScrollHide`, `ReactionBar`, `axios`) were removed in this run. The remaining findings are primarily unnecessary `export` keywords on internal helpers/types -- a minor hygiene issue, not a functional problem.
