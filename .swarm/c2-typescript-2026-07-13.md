# C2 TypeScript Strictness Audit — 2026-07-13

## Baseline

Strict mode is on (`"strict": true`) and the codebase is **remarkably clean**:

- **Zero `any` type annotations** anywhere in `src/**` (verified with `(:|<|=)\s*any(\s|,|;|\)|>|\||\[|$)` regex — only comment-word "any" hits).
- **Zero `as any` casts** in `src/app/api/**` or anywhere else.
- **Zero `@ts-ignore` / `@ts-expect-error` / `@ts-nocheck`** across the whole tree.
- `Record<string, unknown>` is used consistently for JSONB row payloads and generic props — the correct pattern.
- Every previous audit's recommendations (2026-05-22) have been applied — `db.ts` return types, migrate route unknown-cast, haptics return types, `useGlobalDisplayPrefs` return type, `VersionDiffContext` return type, `useAutoDraft` `TeamAnalysis` type all in place.

Remaining wins are concentrated in **three residual `res.json()` implicit-`any` boundaries** (linear, pokepaste, discord-bot, email), **a handful of missing `Promise<void>` annotations** on new lib helpers added since the last audit, and **two double casts** that are now redundant because the underlying types have caught up.

`npx tsc --noEmit` fails locally with `TS2307: Cannot find module 'next'` — this is a broken `node_modules` install, not application code. All application-code error counts below are unchanged.

## Top 15 fixable issues (each <10 minutes)

### 1. `src/hooks/useShareFlow.ts:96` — redundant double cast
- **Current:** `regulation: (state.tags as Record<string, unknown>)?.regulation as string ?? "unknown"`
- **Recommended:** `regulation: state.tags?.regulation ?? "unknown"`
- **Rationale:** `state: ShareableState` from `url-codec.ts:150` already types `tags` as `{ archetype?: string[]; regulation?: string; eventType?: string; regulationAutoDetected?: boolean }`. Both casts throw away that type info.
- **Risk:** None. Zero runtime change. Type is provably identical.

### 2. `src/hooks/useSlideSystem.ts:56` — redundant `as unknown as Record` cast
- **Current:** `(t as unknown as Record<string, string | undefined>).commonModesTitle ?? "Common Modes"`
- **Recommended:** `t.commonModesTitle`
- **Rationale:** `t: TranslationKeys` (line 29) is `{ [K in keyof typeof en]: string }` and `en.ts:196` defines `commonModesTitle: "Common Modes"`. Every locale (fr/it/es/ja/ko/zh) also defines it, so no fallback is needed. Confirmed via grep.
- **Risk:** None — always defined.

### 3. `src/lib/email.ts:32` — `sendEmail()` return type is implicit `Promise<any>`
- **Current:** `export async function sendEmail(opts: {...}) { ... return res.json(); }` — return is `Promise<any>` because `res.json()` is `Promise<any>`.
- **Recommended:** `Promise<{ id: string } | null>` and parse `await res.json()` into a `{ id: string }` result.
- **Risk:** Low. Only used fire-and-forget in this file and the weekly-digest cron; no callers destructure the result.

### 4. `src/lib/email.ts:79` — `sendCommentNotificationEmail()` missing `: Promise<void>`
- **Current:** `export async function sendCommentNotificationEmail(opts: {...}) {`
- **Recommended:** add `: Promise<void>` — function has no meaningful return value (fire-and-forget).
- **Risk:** None.

### 5. `src/lib/email.ts:181` — `sendWelcomeEmail()` missing `: Promise<void>`
- **Current:** `export async function sendWelcomeEmail(opts: {...}) {`
- **Recommended:** add `: Promise<void>`.
- **Risk:** None. Same fire-and-forget pattern.

### 6. `src/lib/email.ts:321` — `buildWeeklySummaryHtml()` missing `: string`
- **Current:** `export function buildWeeklySummaryHtml(data: {...}) {`
- **Recommended:** add `: string` — function returns a template literal.
- **Risk:** None.

### 7. `src/lib/notifications.ts:9` — `createNotification()` missing `: Promise<void>`
- **Current:** `export async function createNotification(userId, type, sourceShareId, sourceUserName, message,) {`
- **Recommended:** add `: Promise<void>` — try/catch wraps everything and there's no return.
- **Risk:** None.

### 8. `src/lib/notifications.ts:30` — `notifyFollowers()` missing `: Promise<void>`
- **Current:** `export async function notifyFollowers(creatorName, shareId, excludeUserId?,) {`
- **Recommended:** add `: Promise<void>`.
- **Risk:** None.

### 9. `src/lib/discord-bot.ts:60` — `postFeedbackEmbed()` missing return type
- **Current:** `export async function postFeedbackEmbed(opts: {...}) {` — returns either `null` or the raw `res.json()` message (implicit `Promise<any | null>`).
- **Recommended:** `: Promise<{ id: string } | null>` and narrow the `discordFetch` result.
- **Risk:** Low. Called from feedback route; callers don't currently use fields off the returned message.

### 10. `src/lib/discord-bot.ts:15` — `discordFetch()` returns `Promise<any>`
- **Current:** `async function discordFetch(path, options = {}) { ... return res.json(); }` — untyped.
- **Recommended:** `<T = unknown>(path: string, options?: RequestInit): Promise<T>` — call sites can pass the expected shape.
- **Risk:** Low. Only two call sites, both in this file.

### 11. `src/lib/linear.ts:14,32,37` — `linearQuery()` returns `any`
- **Current:** `async function linearQuery(query, variables?)` returns `data.data` (`any`); `const data = await res.json();` is implicit `any`.
- **Recommended:** Type as `<T = unknown>(query: string, variables?: Record<string, unknown>): Promise<T>`. Two call sites (`allLabels`, `teamData`) already annotate the shape; a third (`createLabel`) accesses `.issueLabelCreate.issueLabel.id` without typing.
- **Risk:** Low. Server-only. Only called from this file.

### 12. `src/lib/utils/pokepaste.ts:19,22,44,47` — `res.json()` returns implicit `any`
- **Current:** `const data = await res.json();` then `data.paste`, `data.title`, `data.url` read untyped.
- **Recommended:** annotate as `unknown` and narrow, or Zod-parse a `{ paste: string; title?: string; url?: string; error?: string }` schema. `createPokePaste` already does a runtime `typeof data.url !== "string"` check on line 48 — Zod would consolidate that.
- **Risk:** Low. Client-only, defensive checks already exist.

### 13. `src/lib/i18n/index.ts:96` — `useTranslation()` missing return type
- **Current:** `export function useTranslation() { return useContext(I18nContext); }`
- **Recommended:** `: I18nContextValue` — the interface is declared locally at line 35.
- **Risk:** None. Improves auto-import stability and hover documentation.

### 14. `src/hooks/useDamageCalcs.ts:116` — `setCalcsFull` param is `DamageCalcsMap | Record<string, unknown>`
- **Current:** `useCallback((newCalcs: DamageCalcsMap | Record<string, unknown>) => setCalcs(migrateCalcs(newCalcs)), [])`
- **Recommended:** `useCallback((newCalcs: unknown) => setCalcs(migrateCalcs(newCalcs)), [])` — `migrateCalcs()` on line 22 already accepts `unknown`, and the union with `DamageCalcsMap` doesn't buy any narrowing.
- **Risk:** Low — trivially assignable-to relationship. Callers already pass loose JSONB payloads.

### 15. `src/lib/parser/showdown-parser.ts:114-115` — `.includes()` narrowing cast
- **Current:** `if (POKEMON_TYPES.includes(tt as PokemonType)) { teraType = tt as PokemonType; }`
- **Recommended:** extract a typed predicate `const isPokemonType = (t: string): t is PokemonType => (POKEMON_TYPES as readonly string[]).includes(t);` — then `if (isPokemonType(tt)) { teraType = tt; }`
- **Risk:** None. Semantically identical; removes the two `as PokemonType` casts.

## Also noted (not in top 15 — needs broader thinking)

- `src/lib/db.ts:4` — `process.env.DATABASE_URL!` non-null assertion. Every getDb() call would crash at fetch-time anyway if unset; a Zod-parsed env module would be nicer but is a project-wide refactor.
- `src/app/api/webhooks/clerk/route.ts:46` — `event.data as unknown as ClerkUserCreatedData`. Deferred in the previous audit; still deserves its own ticket (Zod schema or use `UserJSON` from `@clerk/backend`).
- `src/lib/i18n/index.ts:83` — `(en as unknown as Record<string, string>)[prop]` inside the Proxy fallback. Could be typed via `en[prop as keyof TranslationKeys]` but the Proxy signature already erases the type, so the win is small.
- `src/lib/data/pkmn-dex-fallback.ts` — six `as StatSpread` / `as PokemonType[]` / `as Record<string, string>` casts on `@pkmn/dex` output. Third-party types are looser than ours; defensive checks exist. Same recommendation as May 2026: skip tonight.
- `src/components/report/CommonModesSlide.tsx:107-110` — the `tr(key, fallback)` indirection is deliberate per the code comment (staged Integrate phase). Do not "fix".

## Bottom line

The strictness bar is high enough that the meaningful residual noise is the untyped-`res.json()` boundary. Most of the top 15 are one-line annotations that only need to compile-and-commit. Items 1, 2, 13, 14 are pure type hygiene — literally cannot regress runtime behavior.
