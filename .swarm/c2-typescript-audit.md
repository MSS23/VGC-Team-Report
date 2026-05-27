# TypeScript Strictness Audit — 2026-05-27

**tsconfig.json**: `"strict": true` enabled. No `@ts-ignore` or `@ts-expect-error` found anywhere.

## HIGH

1. **`as unknown as ClerkUserCreatedData`** — `src/app/api/webhooks/clerk/route.ts:46`
   Double assertion bypasses all type checking on Clerk webhook data. Should use Clerk SDK types directly or Zod validation.

2. **`Record<string, any>` in migrate route** — `src/app/api/migrate/route.ts:50`
   Only remaining `any` type in the codebase (with eslint-disable). DB row cast to `Record<string, any>` feeds into `normalizeReportData`.

3. **`cacheGet<T>` without schema at 3 call sites** — The generic now accepts optional Zod schema (good), but no callers pass one:
   - `src/app/api/share/[id]/route.ts:227` — `cacheGet<Record<string, unknown>>`
   - `src/app/api/champions/meta/route.ts:31` — `cacheGet<ChampionsMetaResult>`
   - `src/app/api/explore/route.ts:39` — `cacheGet<{ reports: unknown[]; ... }>`
   Stale Redis data silently becomes the wrong type.

## MEDIUM

4. **Missing return types on exported `src/lib/` functions** (9 functions):
   - `src/lib/db.ts:3` — `getDb()` (complex inferred Neon type + `process.env.DATABASE_URL!` non-null)
   - `src/lib/db.ts:9` — `ensureTable()`
   - `src/lib/discord-webhook.ts:15` — `postToBuildsChannel()`
   - `src/lib/hooks/useGlobalDisplayPrefs.ts:36` — `useGlobalDisplayPrefs()`
   - `src/lib/utils/haptics.ts:2,9,16` — `hapticLight/Medium/Success()`
   - `src/lib/i18n/index.ts:47,82` — `I18nProvider()`, `useTranslation()`

5. **`redis!` non-null assertion** — `src/lib/rate-limit.ts:24`
   `getUpstashLimiter` uses `redis!` but is not itself guarded; only its caller checks `if (redis)`. Unsafe if called directly.

6. **`{} as Record<PokemonType, MoveCoverageResult>`** — `src/components/report/OffensiveCoverageChart.tsx:69`
   Empty object asserted as fully-populated Record. All keys missing at creation.

7. **eslint-disable suppressions** (2 total):
   - `src/app/api/migrate/route.ts:49` — `@typescript-eslint/no-explicit-any`
   - `src/hooks/useShareUrl.ts:192` — `@typescript-eslint/no-unused-vars`

## LOW

8. **`localStorage.getItem() as LanguageCode`** — `src/lib/i18n/index.ts:53`
   Arbitrary string from storage cast to union type. Downstream `find()` handles the mismatch gracefully, but the cast is unsound.

9. **`(e as CustomEvent).detail as MobileTab`** — `src/components/report/PokemonDetailSlide.tsx:537`
   Double assertion on custom event with no runtime guard.

10. **Non-null assertions in tests** — `src/lib/analysis/__tests__/item-boosts.test.ts` (8 instances, lines 20-45). Acceptable for tests.

11. **Missing tsconfig flags**: `noUncheckedIndexedAccess`, `noImplicitReturns`, `exactOptionalPropertyTypes` would catch additional bugs.

## Resolved Since Last Audit

- `normalizeReportData` return type changed from `Record<string, any>` to `Record<string, unknown>`
- `diff-state.ts` and `version-diff.ts` no longer use `any`
- `useHomePage.ts` double casts (`as unknown as Record<string, string>`) removed
- `url-codec.ts` now uses Zod `safeParse` before casting
- `cacheGet` signature updated to accept optional Zod schema (callers not yet migrated)
