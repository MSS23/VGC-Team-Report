# C2 — TypeScript Strictness Findings (06-06-26)

## Summary
- Zero `: any`, `as any`, `<any>` annotations in src/lib/** or src/app/api/** — excellent.
- tsconfig has `strict: true`, `isolatedModules: true`. Could add `noImplicitReturns` and `exactOptionalPropertyTypes`.

## Cheap fixes Wave 2 should land

### 1. Missing explicit return types on async exports (5 files, ~10 lines total)
- `src/lib/notifications.ts:9` — `createNotification()` → add `Promise<void>`
- `src/lib/notifications.ts:30` — `notifyFollowers()` → add `Promise<void>`
- `src/lib/discord-bot.ts:60` — `postFeedbackEmbed()` → add `Promise<{ id: string; ... } | null>`
- `src/lib/email.ts:181` — `sendWelcomeEmail()` → add `Promise<void>`
- `src/lib/notifications.ts` and `discord-bot.ts` exported async functions need explicit annotations.

### 2. Document why `z.unknown()` is intentional in url-codec and share routes (TSDoc comment)
- `src/lib/sharing/url-codec.ts:7` — `CalcEntrySchema = z.unknown()` — add TSDoc explaining client-hook volatility
- `src/app/api/share/route.ts:16-28` — matchupPlans, notes, calcs, roles, spriteSettings `z.unknown()`
- `src/app/api/user/drafts/route.ts:11-25` — same fields

### 3. (NICE-TO-HAVE — defer) Database row type guards
- 15+ instances of `row.data as Record<string, unknown>` across `src/app/api/spotlight`, `share`, `user/feed`, etc.
- Bigger refactor — file as backlog ticket.

## eslint-disable inventory (all justified, no action)
- `src/hooks/useShareUrl.ts:192` — destructuring strip of internal fields
- `src/app/page.tsx:331` — React hook deps intentional
- `src/hooks/useHomePage.ts:88, 192` — intentional fire-and-forget

## Wave 2 candidate
- File: `c2-async-return-types` — add explicit return types to 5 async exports — ~5 min, no behaviour change, low conflict risk.
