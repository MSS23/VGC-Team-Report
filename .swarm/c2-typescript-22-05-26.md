# C2 TypeScript Audit — 2026-05-22

`npx tsc --noEmit` → clean. Strict mode is on. Codebase is in very good shape — almost no `any`, no `@ts-ignore`, no `@ts-expect-error`, generic functions are constrained. The remaining type-soundness risks are concentrated in a handful of fixable spots, mostly missing-return-types on widely-shared lib helpers and one `Record<string, any>` cast in the migration route.

## Findings

### A. Explicit `any` (highest leverage)
- `src/app/api/migrate/route.ts:50` — `row.data as Record<string, any>` with `eslint-disable-next-line` opt-out. The downstream `normalizeReportData()` is already typed as `(data: Record<string, unknown>) => Record<string, unknown>`. Fix: drop the `any` cast and the eslint suppression — `Record<string, unknown>` already works and is used everywhere else (`spotlight/route.ts:26`, `share/route.ts:128`, `share/[id]/route.ts:76`, etc.).

### B. `as unknown as X` escape hatch
- `src/app/api/webhooks/clerk/route.ts:46` — `event.data as unknown as ClerkUserCreatedData`. Clerk's typed event has discriminated unions; once `event.type === "user.created"` is checked, the SDK narrows `event.data` itself. Fix: replace with a Zod `safeParse` on a `ClerkUserCreatedDataSchema`, or import the proper Clerk type (`UserJSON`) — either way removes the double cast.

### C. Missing return types on exported lib/hook helpers (in `src/lib/**` only — App-Router route handlers excluded by convention)
- `src/lib/db.ts:3` — `getDb()` returns the unexported `neon` type. Inference works but downstream callers can't reference it. Fix: `export function getDb(): NeonQueryFunction<false, false> { … }` (or simpler: `export type Sql = ReturnType<typeof neon>`).
- `src/lib/db.ts:9` — `ensureTable()` missing `: Promise<void>`.
- `src/lib/discord-webhook.ts:15` — `postToBuildsChannel()` missing `: Promise<void>`.
- `src/lib/i18n/index.ts:47` — `I18nProvider` (JSX-returning, ok to leave) — skip.
- `src/lib/i18n/index.ts:82` — `useTranslation()` missing `: I18nContextValue` (the interface is already declared in the file).
- `src/lib/utils/haptics.ts:2,9,16` — three exported `haptic*()` helpers missing `: void`.
- `src/lib/contexts/VersionDiffContext.tsx:23` — `useVersionDiff()` missing `: VersionDiffState`.
- `src/lib/hooks/useGlobalDisplayPrefs.ts:36` — missing `: { hasSeenPill: boolean; markPillSeen: () => void }`.
- `src/lib/linear.ts:14` — `linearQuery()` returns `data.data` (`any`). Plus line 32 `const data = await res.json()` is implicitly `any`. Fix: type as `Promise<unknown>` and have call sites narrow, or add a `<T>` generic with a Zod schema.
- `src/lib/email.ts:23,56` — `sendEmail()` returns `Promise<any>` via `res.json()`. Fix: declare `Promise<{ id: string } | null>` and parse the response.
- `src/lib/discord-bot.ts:15,33` — `discordFetch()` returns `Promise<any>` via `res.json()`; propagates to `postFeedbackEmbed()`. Same fix as above.

### D. Risky implicit-any boundaries (not strict violations, but easy wins)
- `src/hooks/useAutoDraft.ts:11` — `analysis: unknown | null`. Every other hook in the repo uses `TeamAnalysis | null` from `@/lib/types/analysis`. Fix: replace `unknown` with `TeamAnalysis`.
- `src/lib/utils/pokepaste.ts:19,22,44,47` — `await res.json()` returns `any`, fields read as `data.error`, `data.paste`, `data.title`, `data.url`. Fix: parse against a Zod schema or annotate as `unknown` and narrow.
- `src/lib/cache.ts:35` — `return raw as T` when no schema is passed. This is the documented escape hatch (per VGC-146 comment) — acceptable, but worth a follow-up to make `schema` non-optional for new callers.
- `src/lib/parser/showdown-parser.ts:114-115` — `tt as PokemonType` after an `.includes()` check. TS doesn't narrow `.includes()` on a readonly array; pattern is sound. Could be replaced with a typed predicate `(t): t is PokemonType => POKEMON_TYPES.includes(t)`.
- `src/lib/data/pkmn-dex-fallback.ts:57,66,111,119,157,158` — multiple `entry.baseStats as StatSpread`, `entry.types as PokemonType[]`, `item.megaStone as Record<string, string>`. These come from third-party `@pkmn/dex` whose types are looser than ours. The defensive checks around them are good. No change recommended tonight — touching this needs a careful pass.
- `src/lib/analysis/stat-calculator.ts:58,74` — `result as StatSpread` after building a `Partial<StatSpread>` via a known-complete loop. Could be tightened with an `as const` stats array + `Required<...>` derive, but the casts are sound.

### E. Generic functions
- `src/lib/cache.ts:29` — `cacheGet<T>(key, schema?: ZodType<T>)` — `T` is constrained via the optional schema; intentional pattern (see VGC-146 comment). OK.
- `src/app/api/user/export/route.ts:97` — `paginate<T>(rows: T[])` — `T` is constrained by usage. OK.

### F. Comments / pragmas
- No `@ts-ignore` / `@ts-expect-error` / `@ts-nocheck` anywhere in `src/`. Clean.

## Recommended tonight (safe, ≤30 lines each, all OUTSIDE the conflict-risk list)

| # | File | Change | LOC | Conflict risk |
|---|------|--------|-----|---------------|
| 1 | `src/app/api/migrate/route.ts:49-50` | Replace `Record<string, any>` + eslint-disable with `Record<string, unknown>` | 2 | Not on changed-files list |
| 2 | `src/lib/db.ts:3,9` | Add return types `: ReturnType<typeof neon>` and `: Promise<void>` | 2 | Not on changed-files list |
| 3 | `src/lib/discord-webhook.ts:15` | Add `: Promise<void>` return type | 1 | Not on changed-files list |
| 4 | `src/lib/utils/haptics.ts:2,9,16` | Add `: void` to three haptic helpers | 3 | Not on changed-files list |
| 5 | `src/lib/contexts/VersionDiffContext.tsx:23` + `src/lib/hooks/useGlobalDisplayPrefs.ts:36` | Add explicit return types using already-declared local interfaces | 2 | Not on changed-files list |
| 6 | `src/hooks/useAutoDraft.ts:11` | `analysis: unknown \| null` → `analysis: TeamAnalysis \| null` (+ add import) | 2 | Not on changed-files list |

## Deferred (good ideas but touch conflict-risk files or need broader thinking)
- Tighten `src/lib/linear.ts`, `src/lib/email.ts`, `src/lib/discord-bot.ts` `res.json()` return types — these three files are ALL on the main conflict-risk list. Skip tonight.
- `src/app/api/webhooks/clerk/route.ts:46` Zod-schema validation — webhook code, deserves its own ticket.
- `src/lib/parser/showdown-parser.ts` typed predicate refactor — cosmetic.
