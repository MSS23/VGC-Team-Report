# C2 TypeScript Strictness Audit — 2026-06-12

## Headline

**Outstanding.** Zero explicit `: any`, zero `as any`, zero `<any>`, zero `Record<string, any>`, zero `@ts-ignore`/`@ts-expect-error`/`@ts-nocheck` anywhere in `src/`. The previous C2 (22-05-26) recommendations on `src/lib/db.ts`, `src/lib/discord-webhook.ts`, `src/lib/utils/haptics.ts`, `src/lib/contexts/VersionDiffContext.tsx`, `src/lib/hooks/useGlobalDisplayPrefs.ts`, `src/hooks/useAutoDraft.ts`, and `src/app/api/migrate/route.ts` have **all been applied**. `tsc --noEmit` produces only `node_modules`-missing errors (environmental); no real code errors.

The audit therefore widens scope to `src/app/api/**` casts and remaining untyped `await res.json()` boundaries.

## Top 10 Strictness Fixes (sorted by safety × value)

| # | File:line | Current | Proposed | Fixability |
|---|-----------|---------|----------|-----------|
| 1 | `src/lib/i18n/index.ts:96` | `export function useTranslation()` (no return type) | `: I18nContextValue` (interface already declared L35) | **TRIVIAL** |
| 2 | `src/lib/notifications.ts:9,30` | `createNotification(...)`, `notifyFollowers(...)` — no return type | `: Promise<void>` on both | **TRIVIAL** |
| 3 | `src/lib/email.ts:32` | `sendEmail(opts)` returns `Promise<any>` via `res.json()` | `Promise<{ id: string } | null>` (Resend returns `{id}`) | **TRIVIAL** |
| 4 | `src/lib/email.ts:79,181` | `sendCommentNotificationEmail`, `sendWelcomeEmail` — no return type | `: Promise<void>` (both are fire-and-forget) | **TRIVIAL** |
| 5 | `src/lib/linear.ts:14,32` | `linearQuery` returns implicit `any` (`return data.data`); local `data` is `any` | Either `Promise<unknown>` (callers narrow) or generic `<T>(query, vars) => Promise<T>` — pair with `{ data: T; errors?: {message:string}[] }` interface on L32 | **MODERATE** (call sites already cast inline at L135, L180, L183) |
| 6 | `src/lib/discord-bot.ts:15,60` | `discordFetch` returns implicit `any`; `postFeedbackEmbed` lacks return type; line 120 reads `message.id` blindly | Type `discordFetch` as `Promise<{ id: string }>` (or generic), add `: Promise<{id:string} | null>` to `postFeedbackEmbed` | **MODERATE** |
| 7 | `src/lib/utils/pokepaste.ts:19,22,44,47` | Four `await res.json()` reads with no schema; downstream reads `data.error`, `data.paste`, `data.title`, `data.url` | Add inline interfaces `PokePasteApiOk = {paste:string; title?:string}` / `PokePasteCreateOk = {url:string}` and `safeParseJson` helper, OR widen to `unknown` + narrow with `typeof` guards (already partially done L48) | **MODERATE** |
| 8 | `src/app/api/webhooks/clerk/route.ts:46` | `event.data as unknown as ClerkUserCreatedData` — double-cast escape hatch | Inside the `event.type === "user.created"` branch, Clerk's `verifyWebhook` discriminated union already narrows `event.data`. Replace with direct destructure, OR add a Zod `ClerkUserCreatedDataSchema.parse(event.data)` | **MODERATE** (touches auth-adjacent code — review carefully) |
| 9 | `src/lib/parser/showdown-parser.ts:114-115` | `tt as PokemonType` after `.includes()` (TS doesn't narrow `.includes()` on readonly tuple) | Add typed predicate `const isPokemonType = (t: string): t is PokemonType => (POKEMON_TYPES as readonly string[]).includes(t)` and replace cast | **TRIVIAL** |
| 10 | `src/lib/i18n/index.ts:83` | `(en as unknown as Record<string, string>)[prop]` in Proxy fallback | `TranslationKeys` is already `Record<string, string>` shape — the double cast is defensive but unnecessary. Replace with `(en as Record<string, string>)[prop]` (single cast, no `unknown` hop) | **TRIVIAL** |

## Deferred / Out of scope

- `src/lib/data/pkmn-dex-fallback.ts:68,77,133` — `entry.baseStats as StatSpread`, `entry.types as PokemonType[]`. `@pkmn/dex` subset returns its own loose shape; surrounding code defensively checks (L69: `baseStats.hp === 0`). These casts are sound and tightening them means co-locating shape validation with the subset generator — a separate ticket.
- `src/app/api/webhooks/posthog/route.ts:66,206,337,355,394,418,422` — many `properties.X as string` casts on PostHog event payloads. PostHog types are intentionally `Record<string, unknown>`. Would benefit from one Zod schema for the analytics event shape — non-trivial work; one whole ticket.
- `src/app/api/explore/route.ts:225-293` — many `r.id as string`, `r.share_id as string` casts on Neon SQL rows. Neon driver returns `Record<string, any>`-ish — fixing this means a `RowOf<T>` helper or per-route row schemas. Big-bang refactor, not tonight.
- `src/app/api/cron/posthog-errors/route.ts:88` — already uses a typed annotation (`const data: PostHogErrorResponse = await res.json()`). Good pattern, consider propagating.
- `src/lib/cache.ts:29` — `cacheGet<T>(key, schema?)` — documented escape-hatch when no schema is passed; intentional per VGC-146. OK.

## Patterns worth congratulating

- 100% of `src/lib/**` async helpers (db, discord-webhook, notifications, posthog-server, cache.*, sharing, security/*, validation/*) have explicit return types or trivially-inferrable ones.
- Zero `@ts-ignore` pragmas — discipline here is exceptional.
- Every `as unknown as X` site (3 total) is in a documented bridging spot, not a bug-hiding spot.
- ESLint disables are all `@next/next/no-img-element` or `react-hooks/exhaustive-deps`, not TypeScript disables.

## Conflict-risk check

Cross-referenced against `main-changed-files.md`. The recommended top-10 list **excludes** `src/lib/db.ts` (recently changed by main). All other proposed files are not on the changed-files list. Safe to pick from #1, #2, #9, #10 tonight without rebase pain.
