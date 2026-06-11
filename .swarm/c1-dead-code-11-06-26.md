# C1 Dead Code Audit — 11-06-26

## High-confidence kills (safe to delete this run)

### Orphaned component files (zero external imports)

- `src/components/providers/ConsentGate.tsx` — exports `ConsentGate`, zero importers.
  - Verified: `Grep -n "ConsentGate" src/` → only the file itself (`interface ConsentGateProps`, `export function ConsentGate`).
  - Lines saved: ~37
- `src/components/display/DisplayTogglePill.tsx` — exports `DisplayTogglePill`, zero importers.
  - Verified: `Grep -n "DisplayTogglePill" src/` → only self + a stale doc reference in `src/lib/hooks/useGlobalDisplayPrefs.ts:9` (also orphaned, see below).
  - Lines saved: ~267
- `src/lib/hooks/useGlobalDisplayPrefs.ts` — exports `useGlobalDisplayPrefs`, zero importers.
  - Verified: `Grep -n "\buseGlobalDisplayPrefs\b" src/` → only the file itself.
  - Lines saved: ~51

### Dead exports in still-used files (drop the `export` keyword; symbols are referenced only internally)

- `src/lib/templates.ts` → `REPORT_TEMPLATES`, `ReportTemplate` interface — neither imported anywhere.
  - Verified: `Grep -n "\bREPORT_TEMPLATES\b" src/` → only `templates.ts`. Same for `\bReportTemplate\b`.
  - Only `getTemplate` is consumed (by `src/hooks/useHomePage.ts:25`). Drop `export` from the const and the interface; keep them declared.
- `src/lib/utils/normalize-report.ts` → `migrateCalcEntries` — used only by `normalizeReportData` within the same file.
  - Verified: `Grep -n "\bmigrateCalcEntries\b" src/` → only `normalize-report.ts` lines 10 and 102.
  - Drop the `export`.
- `src/lib/security/cors.ts` → `isDynamicAllowedOrigin` — referenced only by `getCorsHeaders` and `isAllowedOrigin` in the same file.
  - Verified: `Grep -n "\bisDynamicAllowedOrigin\b" src/` → only `cors.ts` lines 18, 27, 41.
  - Drop the `export`.
- `src/hooks/useMatchupPlans.ts` → `migratePlan` (re-exported at line 93 as `export { migratePlan }`) — zero external consumers.
  - Verified: `Grep -n "\bmigratePlan\b" src/` → all hits are local to `useMatchupPlans.ts` plus a *different* `migratePlan` inside `src/lib/utils/normalize-report.ts:28` (separate scope, not imported from the hook).
  - Delete the `export { migratePlan };` line (line 93).
- `src/hooks/useWalkthrough.ts` → `WALKTHROUGH_STEPS` — only consumed internally at line 189.
  - Verified: `Grep -n "\bWALKTHROUGH_STEPS\b" src/` → only `useWalkthrough.ts`.
  - Drop the `export`.
- `src/hooks/useUndoRedo.ts` → `UndoRedoSnapshot` interface — only used internally for typing.
  - Verified: `Grep -n "\bUndoRedoSnapshot\b" src/` → only `useUndoRedo.ts`.
  - Drop the `export`.
- `src/hooks/useShareUrl.ts` → `ForkedFromMeta` interface — only used internally; an unrelated local `type ForkedFromMeta` exists in `src/app/api/share/[id]/route.ts:35` but is not imported from the hook.
  - Verified: `Grep -n "\bForkedFromMeta\b" src/` → matches are confined to the two declaration files.
  - Drop the `export`.
- `src/hooks/useDamageCalcs.ts` → `DamageCalcsMap` type — only used internally.
  - Verified: `Grep -n "\bDamageCalcsMap\b" src/` → only `useDamageCalcs.ts`.
  - Drop the `export`.

## Medium-confidence (worth a closer look)

None this run. The previous candidates (`Card`, `Button`, `Toggle`, `JsonLd`, `setCsrfCookie`, `notifyFollowers`, `validateMegaCoverage`, etc. — all flagged by a first-pass subagent) were re-verified and found to be imported.

In particular:
- `validateMegaCoverage` is dynamically imported in `src/instrumentation.ts:14` and also used by `src/lib/data/__tests__/champions-dex.test.ts` — KEEP.
- `sendWelcomeEmail`, `sendCommentNotificationEmail`, `buildWeeklySummaryHtml`, `sendWeeklySummary` are all imported by API routes (`webhooks/clerk`, `comments/[shareId]`, `bot`) — KEEP.
- `setCsrfCookie`, `isSuspiciousRequest` are used in `src/middleware.ts` — KEEP.

## Unused npm dependencies

None. All 17 runtime dependencies were verified:

- `@clerk/nextjs`, `@neondatabase/serverless`, `@pkmn/dex`, `@sentry/nextjs`, `@upstash/ratelimit`, `@upstash/redis`, `html2canvas-pro`, `jspdf`, `motion`, `next`, `posthog-js`, `posthog-node`, `react`, `react-dom`, `tweetnacl`, `vanilla-cookieconsent`, `zod` — all imported by `src/`.
- `@microsoft/clarity` — used by `src/components/providers/ClarityProvider.tsx`.
- `@opentelemetry/*` (4 packages) — used by `src/instrumentation.ts` and `src/app/api/views/[shareId]/route.ts`.
- `qrcode` — dynamically imported in `src/components/report/TeamOverview.tsx:376` and `src/components/ui/OTSSheetModal.tsx:91`.

## Commented-out blocks > 10 lines

None found. A scan for runs of `^\s*//` lines longer than 10 turned up only JSDoc/section-header comments (e.g., `middleware.ts:10-15`, `middleware.ts:45-58`) — all are explanatory documentation, not deleted code. No `/* ... */` blocks over 10 lines contain commented-out code either.

## Dead routes

None. All `page.tsx` and `route.ts` files were checked:

- `/notifications` is linked from `src/components/ui/NotificationBell.tsx:183`.
- `/dashboard/notifications` is linked from `src/app/dashboard/DashboardContent.tsx:147`.
- `/api/keep-alive` is pinged by `src/app/api/cron/daily-ops/route.ts:17`.
- `/api/setup` and `/api/migrate` are admin-only one-shot endpoints behind `MIGRATE_SECRET` — not "dead" in the linkable sense; left alone.
- All cron routes are wired in `vercel.json`.

## Skipped (conflict-risk overlap)

Per orchestrator instructions, the following files were NOT analyzed for deletion or modification:
- `public/sw.js`
- `src/app/globals.css`
- `src/app/page.tsx`
- `src/components/report/SlideNavControls.tsx`
- `src/components/ui/SwipeHint.tsx`
- `src/hooks/useHomePage.ts`

## Total impact estimate

If all high-confidence items are applied:
- ~355 lines from three orphaned files deleted outright.
- 9 stale `export` keywords removed from otherwise-live files (no behavior change, tightens public surface).
