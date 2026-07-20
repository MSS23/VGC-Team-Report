# C2 TypeScript Strictness Audit — 20-07-26

Codebase is exceptionally clean: zero `any` in `src/lib/**` or `src/app/api/**`, zero `@ts-ignore`, only 3 `as unknown as`. Audit focuses on missing return types and untyped `res.json()` boundaries.

## QUICK WINS — types-only, safe to apply (single commit each)

1. **`src/lib/posthog-server.ts:31`** — `captureServerEvent()` → `: void`. Hot: most API routes.
2. **`src/lib/notifications.ts:9`** — `createNotification()` → `: Promise<void>`. Hot: share write path.
3. **`src/lib/notifications.ts:30`** — `notifyFollowers()` → `: Promise<void>`. Same hot path.
4. **`src/lib/email.ts:32`** — `sendEmail()` → `Promise<{ id?: string } | null>`.
5. **`src/lib/email.ts:79`** — `sendCommentNotificationEmail()` → `: Promise<void>`.
6. **`src/lib/email.ts:181`** — `sendWelcomeEmail()` → `: Promise<void>`. Clerk webhook.
7. **`src/lib/email.ts:321`** — `buildWeeklySummaryHtml()` → `: string`. Cron path.
8. **`src/lib/discord-bot.ts:60`** — `postFeedbackEmbed()` → `: Promise<{ id: string } | null>`.
9. **`src/lib/i18n/index.ts:97`** — `useTranslation()` → `: I18nContextValue` (CONFLICT-RISK; i18n file on main-changed-files).
10. **`src/lib/i18n/index.ts:47`** — `I18nProvider({ children })` → `: React.ReactElement` (CONFLICT-RISK).

## MEDIUM — requires small behavioral tweak

- **`src/lib/linear.ts:14`** — `linearQuery()` returns implicit `any`. Convert to `<T = unknown>` generic.
- **`src/lib/discord-bot.ts:15`** — same for `discordFetch()`.
- **`src/app/api/discord/route.ts:23,95`** — untyped JSON.parse used in auth decisions; add Zod.
- **`src/app/api/cron/daily-ops/route.ts:153`** and **`.../cron/posthog-errors/route.ts:94`** — `linearGql()` returns-any.
- **`src/lib/rate-limit.ts:24`** — `redis!` non-null assertion; pass explicitly.
- **`src/app/api/webhooks/clerk/route.ts:46`** — `event.data as unknown as ClerkUserCreatedData` double-cast; use Zod.

## OUT OF SCOPE

- `Record<string, unknown>` on persisted `data` column across API routes — coordinated PR only.
- `ShareableState` interface parallel to `ShareableStateSchema` — dozens of consumers.
- `cache.ts` `T` cast documented as VGC-146.
- `normalize-report.ts` — legacy shapes need dedicated split.

## Conflict-risk overlaps

- `src/lib/i18n/index.ts` (Quick Wins #9, #10) — defer.
- `src/app/api/discord/route.ts`, `share/[id]/**`, `sync/[id]/route.ts`, `user/drafts/route.ts`, `explore/route.ts`, `changelog/[shareId]/route.ts`, `team-graphic/route.tsx`, `user/reports/route.ts` — Medium items on these are CONFLICT-RISK.

## Actionable this run

Quick Wins #1–#8 (skip #9, #10). All hot server paths, all in files NOT on main-changed-files.md. One combined "swarm: type hot server helpers" commit would be safe.
