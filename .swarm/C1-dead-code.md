# Dead Code Scan — VGC Team Report

_Scanned: 2026-05-14. Static analysis only (grep/find). No modifications made._

---

## Top Findings

### 1. `postBuildNotification` — UNUSED EXPORT (Delete)
- **File:** `src/lib/discord-bot.ts` (line 151)
- **Issue:** Zero call sites anywhere in the codebase. The exported async function is never invoked — Discord build notifications flow through `postToBuildsChannel` in `discord-webhook.ts` instead.
- **Action:** **Delete** the exported function.

### 2. `postToFeedbackChannel` — UNUSED EXPORT (Delete)
- **File:** `src/lib/discord-webhook.ts` (line 31)
- **Issue:** Zero call sites. Feedback notifications go through `discord-bot.ts::postFeedbackEmbed` instead. This is an unreachable parallel implementation.
- **Action:** **Delete** the exported function.

### 3. `sanitizeInput` and `containsInjection` — UNUSED EXPORTS (Delete or keep for policy)
- **File:** `src/lib/security/input-validation.ts` (lines 6, 12)
- **Issue:** Zero call sites. The only importer of `input-validation.ts` is `api-guard.ts`, which uses only `getClientIp` and `hasValidContentType`.
- **Action:** **Delete** both functions unless a security policy mandates keeping them available.

### 4. `/api/bot` — POSSIBLY DEPRECATED ROUTE (Needs more context)
- **File:** `src/app/api/bot/route.ts`
- **Issue:** Not registered in `vercel.json` crons. Referenced only in `middleware.ts` auth-bypass list. Provides `?action=summary|popular|bugs|weekly-email` but these capabilities overlap with `/api/cron/weekly-report` and `/api/cron/daily-ops`. No code in the project calls this route.
- **Action:** **Needs more context** — confirm if triggered by an external scheduler or manually. If not actively used, candidate for deletion.

### 5. `/api/keep-alive` — STALE DOC COMMENT (Low severity)
- **File:** `src/app/api/keep-alive/route.ts`
- **Issue:** JSDoc says _"Called by Vercel cron every 5 minutes"_ but route is absent from `vercel.json` crons. It is pinged indirectly by `/api/cron/daily-ops` health check, not by its own cron schedule.
- **Action:** **Update doc comment** to reflect actual usage. Route itself is not dead.

---

## Specifically-Flagged Files — All Active

All four recently-added UI files are properly imported in `src/app/page.tsx`:

| File | How Imported |
|------|-------------|
| `src/components/ui/DiffNavigator.tsx` | Dynamic `import()` at line 38 |
| `src/components/ui/EditFab.tsx` | Static import, rendered at line 1475 |
| `src/components/ui/SwipeHint.tsx` | Static import, rendered at line 1491 |
| `src/components/ui/ShortcutHintOverlay.tsx` | Static import, rendered at line 1515 |

---

## API Routes — Active Assessment

All routes checked. Key routes confirmed active:
- `/api/setup` — one-time DB migration, protected by `MIGRATE_SECRET`, referenced in middleware
- `/api/migrate` — batch data migration, protected by `MIGRATE_SECRET`
- `/api/cleanup` — registered in `vercel.json` cron at 3am daily
- `/api/keep-alive` — pinged via `daily-ops` health check (stale doc comment only)

---

## No Issues Found (Components)

All 75+ components in `src/components/` have at least one import. All `src/lib/utils/`, `src/lib/analysis/`, `src/lib/data/`, and `src/lib/security/` exports are used — except the three noted above (`postBuildNotification`, `postToFeedbackChannel`, `sanitizeInput`, `containsInjection`).

---

## Previous Scan Notes (2026-05-07)

Items from the prior scan that have since been resolved or are still valid:
- `src/components/social/VersionHistory.tsx` — verify if file still exists (not found in current scan; may have been deleted)
- `src/lib/security/csrf-client.ts` — verify if file still exists (not found in current scan)
- `src/app/api/cron/posthog-errors/route.ts` — still runs on `0 8 * * 1` (Monday 8am weekly per vercel.json, not 6x/day as previously noted; prior scan may have misread the schedule)
