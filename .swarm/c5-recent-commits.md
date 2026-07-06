# C5 — Recent Commits & Codebase Smell Audit

## Zero smells found (clean codebase)
- Zero `TODO:` / `FIXME:` / `HACK:` / `XXX:` in `src/`.
- Zero stray `console.log` in production code (only one legitimate cron completion log at `src/app/api/cron/weekly-digest/route.ts:373`).
- Zero `@ts-ignore` / `as any`.
- Recent tests have real assertions.

## Real code smells found (silent-catch epidemic)

### DashboardContent.tsx — 8× `catch { /* silent */ }` on user mutations
- `src/app/dashboard/DashboardContent.tsx:457` — draft delete
- `src/app/dashboard/DashboardContent.tsx:555` — add to collection
- `src/app/dashboard/DashboardContent.tsx:587` — visibility toggle
- `src/app/dashboard/DashboardContent.tsx:597` — report delete
- `src/app/dashboard/DashboardContent.tsx:767` — report restore
- `src/app/dashboard/DashboardContent.tsx:827` — collab accept/decline
- `src/app/dashboard/DashboardContent.tsx:1048` — collection create
- `src/app/dashboard/DashboardContent.tsx:1072` — collection expand fetch
- **Impact:** on transient Neon failure UI stays in "acting" state with no toast — user sees delete/toggle appear to not happen.
- **Fix idea:** a `withToast(async () => ...)` helper. Larger refactor — defer to Wave 2 unless quick.

### NotificationsContent.tsx — 3× silent catches
- `src/app/dashboard/notifications/NotificationsContent.tsx:51, 61, 75` — fetch, mark-read, prefs.

### src/app/page.tsx:378 — version-diff compare `catch { // ignore }` (compareLoading cleared, no error surfaced).

### src/lib/db.ts:12 — migration runner catches every statement's error and only warns. A broken migration silently "succeeds" leaving schema drift.

### Legit silent catches (do not touch)
- localStorage guards in `useTheme.ts`, `useDarkMode.ts`, `useDamageCalcs.ts`, `useTeamReport.ts`, `useHiddenSlides.ts`, `PostHogProvider.tsx`.
- Clipboard write in `src/app/page.tsx:439`.
- `URL()` parsing guards in `src/app/api/pokepaste/route.ts:17`, sitemap.

## Follow-up commits worth revisiting
1. `83d195a` — sitemap `lastModified` was CI workaround for Vercel Ignored Build Step. Fix the config, not code.
2. Sentry cleanup left OpenTelemetry stack orphaned (`src/instrumentation.ts`, `src/app/api/views/[shareId]/route.ts`). No verification OTel logs land anywhere — risk of another dead telemetry pipeline.
3. `i18n/index.ts:83` — `(en as unknown as Record<string, string>)[prop]` cast can return `undefined` rendered as literal "undefined". Quick fix: fallback to key.
4. `src/lib/sharing/__tests__/redact-integration.test.ts:23` duplicates route code as inline function. Should export the function.
5. Account-deletion `0635b74` — deletes Clerk user before DB txn commits (may orphan auth on rollback).

## Quick wins for Wave 2 (single-line-ish fixes)
- i18n fallback (`src/lib/i18n/index.ts:83`) — return the key string if lookup returns undefined so UI never shows literal "undefined".
- Wire minimal toast on the 3 NotificationsContent catches OR the version-compare catch on home page.
- Migration runner strict mode: throw on syntax errors (SQL parse errors), still warn on "already exists" (idempotency).
