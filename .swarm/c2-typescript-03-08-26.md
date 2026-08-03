# C2 — TypeScript Strictness Audit — 2026-08-03

**Scope:** `src/lib/**` first (parser, stat-calculator, Champions SP, legality), then the rest of `src/`.
**Mode:** READ-ONLY. Nothing edited, nothing committed.
**Baseline compared against:** `.swarm/c2-typescript-22-05-26.md` (most recent prior C2 run). Each finding marked **NEW** or **ALREADY-KNOWN**.

---

## 0. Method + two environment caveats (read these first)

### 0.1 The working tree is being mutated by other swarm agents right now
At audit time `git status` showed 30 modified + 4 untracked files, including **`tsconfig.json` itself** (another agent removed `"cypress"` from `exclude` and added `cypress/cypress-env.d.ts`). Files under audit (`stat-calculator.ts`, `champions-legality.ts`, `posthog-server.ts`, `rate-limit.ts`, `dex-subset.ts`, `type-chart.ts`) are mid-edit.

**All compiler numbers in this report were therefore produced against a clean snapshot of `HEAD` (`a70d924`)**, extracted with `git archive HEAD` into the scratchpad with `node_modules` symlinked. Numbers taken from the live tree are unstable and were discarded (they produced phantom errors like `Cannot find name 'getRegMAMegasWithSprites'` from half-written files).

### 0.2 `tsc --noEmit` in the live tree is currently RED — and `incremental: true` hides it
- `tsconfig.json` sets `"incremental": true`. A stale `tsconfig.tsbuildinfo` (untracked, gitignored) made a plain `tsc --noEmit` exit **0** while a cold compile of the same tree reported **3 errors**.
- The 3 errors come from **`src/lib/analysis/__tests__/__scratch-probe.test.ts`** — an untracked debug file written by a concurrent agent at 00:19 today. It writes to `/tmp` at module scope and shadows `console`.
- **Action for whoever commits tonight:** delete `src/lib/analysis/__tests__/__scratch-probe.test.ts` before committing. It is inside `src/**` so it is compiled by `tsc --noEmit`, executed by `vitest run`, and would turn CI red. **NEW**.
- Secondary: consider `rm tsconfig.tsbuildinfo` before any local verification gate, or drop `incremental` (CI checkouts are cold anyway, so CI never benefits from it).

**Clean `HEAD` baseline: `tsc --noEmit` → 0 errors.** The committed codebase is genuinely clean under `strict: true`.

---

## 1. tsconfig.json — actual current settings

Verbatim from `HEAD:tsconfig.json` (the live tree differs only in `exclude`, see §0.1):

```jsonc
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts", ".next/dev/types/**/*.ts", "**/*.mts"],
  "exclude": ["node_modules", "cypress"]
}
```

This is the stock `create-next-app` template plus `paths`. **No strictness flag beyond the `strict` family has ever been added.** `strict: true` gives you: `noImplicitAny`, `strictNullChecks`, `strictFunctionTypes`, `strictBindCallApply`, `strictPropertyInitialization`, `noImplicitThis`, `useUnknownInCatchVariables`, `alwaysStrict`, `strictBuiltinIteratorReturn`.

Not set, and not implied by `strict`: everything in the matrix below.

### 1.1 Flag matrix — measured, not assumed

Each row = clean `HEAD` snapshot, `incremental: false`, one flag flipped, full compile. **NEW** — no prior C2 report examined tsconfig flags at all.

| Flag | Value tested | Total errors | of which `src/lib` | Verdict |
|---|---|---|---|---|
| `noImplicitOverride` | `true` | **0** | 0 | **Turn on now — free** |
| `noFallthroughCasesInSwitch` | `true` | **0** | 0 | **Turn on now — free** |
| `allowUnreachableCode` | `false` | **0** | 0 | **Turn on now — free** |
| `allowUnusedLabels` | `false` | **0** | 0 | **Turn on now — free** |
| `useDefineForClassFields` | `true` | **0** | 0 | Free, but no classes in `src/` — cosmetic |
| `forceConsistentCasingInFileNames` | `true` | **0** | 0 | Already TS ≥5 default; make it explicit (Linux CI vs Windows dev — this repo is developed on Windows and built on Linux, so pinning it is cheap insurance) |
| `verbatimModuleSyntax` | `true` | **0** | 0 | **Turn on — free, and the codebase already earned it** (every type-only import is already `import type`). Verify with one `next build` before shipping: it changes SWC's emit contract, not just tsc's. |
| `noImplicitReturns` | `true` | **2** | 0 | **Turn on after 2 one-line fixes** (below) |
| `noUnusedParameters` | `true` | **5** | 0 | Cheap (5 fixes, all `_`-prefix or delete). Note ESLint already flags some of these — CI lint is `continue-on-error: true` |
| `noUnusedLocals` | `true` | **23** | 6 | Worth doing; overlaps heavily with C1's dead-code sweep — coordinate, don't duplicate |
| `exactOptionalPropertyTypes` | `true` | **57** | 3 | Medium. 22 of 57 are in `src/components/report` (conflict-risk area). Defer to a dedicated ticket |
| `noUncheckedIndexedAccess` | `true` | **327** | 84 | High value, high effort. **Do not flip repo-wide.** See §5 for the staged plan |
| `noPropertyAccessFromIndexSignature` | `true` | **644** | 112 | **Do not turn on.** 42 errors in `normalize-report.ts` + 30 in `diff-state.ts` alone; these files deliberately walk `Record<string, unknown>` legacy payloads. Cost >> benefit |

**Full error lists** for each flag are in the scratchpad at
`/tmp/claude-0/-home-user-VGC-Team-Report/4ac07288-3f7c-5c21-9125-e568b1765335/scratchpad/head/err-<flag>.txt`.

### 1.2 `noImplicitReturns` — the entire cost of turning it on

| file:line | Severity | Fix |
|---|---|---|
| `src/components/ui/NotificationBell.tsx:78` | Low | `useEffect` callback returns a cleanup on one path only. Add explicit `return undefined;` (or better: `return () => {};`) on the early-exit path. |
| `src/hooks/useShareUrl.ts:137` | Low | Same shape — `useEffect` early-returns without a value. Add `return undefined;`. |

Both are genuine React footguns (a conditional cleanup is a real class of subscription leak), so this flag pays for itself.

### 1.3 Non-strictness tsconfig observations

- **`"target": "ES2017"`** — **NEW**. Next 16 / React 19 target evergreen browsers. ES2017 forces TypeScript/SWC to downlevel optional chaining (`?.`), nullish coalescing (`??`), `Object.fromEntries`, async generators and class fields into helper-laden output. Raising to `ES2022` shrinks the client bundle and is otherwise a no-op for type checking. *(Bundle impact is C3's territory — flagging the type-config side only.)*
- **`"allowJs": true`** — **NEW**. There are **zero** `.js`/`.jsx` files under `src/`. This is dead template config; it only widens the compile graph. Safe to remove (keep it if `scripts/*.mjs` should ever be checked — they currently are not, since `include` lists `**/*.mts` but not `**/*.mjs`).
- **`"exclude": ["node_modules", "cypress"]`** — Cypress specs are unchecked at HEAD. A concurrent agent is removing `"cypress"` tonight; if that lands, expect a new tranche of errors from `cypress/e2e/*.cy.ts`. Not my change to make — flagging the collision.
- **`skipLibCheck: true`** — standard for Next; keep.

---

## 2. Every use of `any`, ranked by blast radius

**Headline: explicit `any` has been eliminated from `src/`.** A type-position scan (`: any`, `as any`, `<any>`, `any[]`, `Record<_, any>`, `Promise<any>`) over all 310 `.ts`/`.tsx` files returns **zero** hits outside prose comments. There are **no** `@ts-ignore`, `@ts-expect-error`, `@ts-nocheck`, or `eslint-disable @typescript-eslint/no-explicit-any` anywhere.

- **ALREADY-KNOWN → FIXED:** `src/app/api/migrate/route.ts:50` `Record<string, any>` + eslint suppression (22-05 finding A) is **gone**. Confirmed resolved.

What remains is **implicit `any` manufactured by `Response.json()`**, which `lib.dom` types as `Promise<any>`. Every one of these is a silent hole in an otherwise strict codebase: the `any` escapes the function and infects every downstream property access with zero compiler complaint. Ranked by how far the `any` travels:

### A1 — `src/lib/linear.ts:32` → `linearQuery()` returns `any` — **HIGH**  · ALREADY-KNOWN (22-05 §C), still unfixed
```ts
const data = await res.json();           // any
if (data.errors?.length) { … data.errors[0].message }   // any.any.any
return data.data;                        // any escapes the module
```
Blast radius: 4 call sites inside `linear.ts` (127, 144, 170, 191), and the untyped result is then dotted 3 levels deep — `labelsData.team.labels.nodes` (:135), `createLabel.issueLabelCreate.issueLabel.id` (:150), `teamData.team.states.nodes` (:180). A Linear API shape change, a GraphQL error envelope, or a null `team` produces a `TypeError` at runtime with **no** compile-time signal. The `try/catch` at :161 swallows it silently, so issue creation degrades to "no labels" without a log.

**Fix:** make the boundary explicit and narrow once.
```ts
async function linearQuery<T>(query: string, schema: ZodType<T>, variables?: Record<string, unknown>): Promise<T>
```
…or, minimum viable: annotate `const data: unknown = await res.json();` and add a `LinearEnvelope` type guard. `src/lib/cache.ts` already establishes the optional-Zod-schema pattern (`cacheGet<T>(key, schema?)`) — reuse it for consistency.

**Not on the conflict-risk list** — safe to touch.

### A2 — `src/app/api/discord/route.ts:23` → a *second*, duplicated `linearQuery()` returning `any` — **HIGH** · **NEW**
`src/app/api/discord/route.ts:23-34` defines its own `linearQuery` (`return res.json()` → `Promise<any>`), used at lines **214, 224, 271, 293, 317, 336, 340**. This is the largest single `any` surface in the repo *and* it is a copy of `src/lib/linear.ts`'s helper with a different auth/timeout policy. The prior audit missed it because it only scanned `src/lib`.

**Fix:** hoist one typed `linearQuery` into `src/lib/linear.ts` (exported, generic + schema as in A1), take the `fetchWithTimeout` behaviour as an option, and delete the route-local copy. Two wins for one change: kills 7 `any` call sites and removes the duplication. **Not on the conflict-risk list.**

### A3 — `src/lib/discord-bot.ts:33` → `discordFetch()` returns `any` — **MEDIUM** · ALREADY-KNOWN, still unfixed
Propagates into `postFeedbackEmbed()` (:60), which is itself missing a return type (§3), so the `any` leaks all the way out to `src/app/api/feedback/route.ts`. **Fix:** `Promise<unknown>` + narrow at the two places the response is actually read, or a small `DiscordMessage` interface.

### A4 — `src/lib/email.ts:69` → `sendEmail()` returns `any` — **MEDIUM** · ALREADY-KNOWN, still unfixed
Re-exported as `sendWeeklySummary` (`:83`) and consumed by 4 routes. In practice no caller reads the body (`weekly-digest/route.ts:366` does `.catch(() => null)`), so **the cheapest correct fix is `Promise<{ id: string } | null>`** — the two `return null` paths already match, and only `return res.json()` at :69 needs `as { id: string }` replaced with a real parse.

### A5 — `src/lib/utils/pokepaste.ts:19,22,44,47` → 4× untyped `res.json()` — **MEDIUM** · ALREADY-KNOWN, still unfixed
This one is **user-input-facing**: it fetches a third-party PokéPaste URL and reads `data.error`, `data.paste`, `data.title`, `data.url` off an `any`. A hostile or merely-changed upstream response yields `undefined` flowing into the parser. Highest *security-adjacent* of the `any` set. **Fix:** a 6-line Zod schema + `safeParse`, returning a discriminated `{ ok: true; paste: string } | { ok: false; error: string }`.

### A6 — `src/lib/cache.ts:35` `return raw as T` — **LOW, accepted** · ALREADY-KNOWN
Documented escape hatch for the schema-less `cacheGet` path (VGC-146). Leave it; optionally make `schema` required for new callers via an overload.

---

## 3. Exported functions missing explicit return types

Measured with a TypeScript AST pass over all non-test files (exported `FunctionDeclaration` with no `type`, plus exported `const` arrow/function expressions).

**`src/lib/**` — 10 remaining** (down from ~14 in the 22-05 report; `db.ts`, `discord-webhook.ts`, `haptics.ts`, `VersionDiffContext.tsx`, `useGlobalDisplayPrefs.ts` were all fixed — **confirmed resolved**):

| file:line | Function | Severity | Concrete fix |
|---|---|---|---|
| `src/lib/linear.ts:14` | `linearQuery` | **High** | See A1 — the missing return type *is* the `any` leak |
| `src/lib/discord-bot.ts:60` | `postFeedbackEmbed` | **High** | `: Promise<void>` (it is fire-and-forget; nothing reads the result) |
| `src/lib/email.ts:32` | `sendEmail` | **High** | `: Promise<{ id: string } \| null>` (see A4) |
| `src/lib/email.ts:79` | `sendCommentNotificationEmail` | Medium | `: Promise<void>` |
| `src/lib/email.ts:181` | `sendWelcomeEmail` | Medium | `: Promise<void>` |
| `src/lib/email.ts:321` | `buildWeeklySummaryHtml` | Medium | `: string` |
| `src/lib/notifications.ts:9` | `createNotification` | Medium | `: Promise<void>` (JSDoc already says "silently fails") |
| `src/lib/notifications.ts:30` | `notifyFollowers` | Medium | `: Promise<void>` |
| `src/lib/posthog-server.ts:31` | `captureServerEvent` | Low | `: void` |
| `src/lib/i18n/index.ts:97` | `useTranslation` | Low | `: I18nContextValue` — the interface is declared in the same file. Currently the hook's public type is inferred through a `Proxy` cast, which is exactly where you want an annotation |
| `src/lib/i18n/index.ts:47` | `I18nProvider` | — | JSX-returning provider; skip (repo convention) |

**Outside `src/lib`: 258 more** (components, hooks, App-Router handlers). App-Router `route.ts` handlers are excluded by convention. The `src/components/**` count is mostly React components where inference is idiomatic — **not recommending a blanket `explicit-module-boundary-types` rule**; it would be 250+ mechanical edits for near-zero soundness gain.

`src/lib/notifications.ts` and `src/lib/email.ts` are **not** on the conflict-risk list. Safe to touch.

---

## 4. Unsound casts, non-null assertions, unchecked index access

### 4.1 `as unknown as` — 5 in `src/`, all reviewed

| file:line | Severity | Assessment / fix |
|---|---|---|
| `src/app/api/webhooks/clerk/route.ts:46` `event.data as unknown as ClerkUserCreatedData` | **Medium** | ALREADY-KNOWN, unfixed. This is an **unauthenticated-ish external boundary** (Svix-verified, but the *payload shape* is unverified). Fix: Zod `safeParse` against a `ClerkUserCreatedDataSchema`, or import Clerk's own `UserJSON`. Deserves its own ticket. |
| `src/lib/data/dex-subset.ts:62` `rawSubset as unknown as DexSubset` | **Low, accepted** | **NEW**. One cast at the JSON-import boundary, deliberately centralised, with a `schemaVersion` field in the shape. Correct pattern. Improvement: assert `subset.schemaVersion === EXPECTED` at module load so a regenerated-but-incompatible JSON fails loudly instead of producing `undefined` deep in the dex. |
| `src/lib/i18n/index.ts:84` `en as unknown as Record<string, string>` | **Low** | **NEW**. The `TranslationKeys` object is all-string already; the double cast exists only because the interface isn't index-signature-compatible. Fix: `Object.fromEntries(Object.entries(en))` or declare `TranslationKeys extends Record<string, string>`. |
| `src/components/report/CommonModesSlide.tsx:108`, `src/hooks/useSlideSystem.ts:56` | **Low** | **NEW**. Both do `t as unknown as Record<string, string \| undefined>` to read a key (`commonModesTitle`) that isn't on `TranslationKeys`. **The right fix is to add the key to the interface**, not to cast around it. Two casts disappear. Note `CommonModesSlide.tsx` is adjacent to conflict-risk files. |

### 4.2 Non-null assertions (`!`) — 20 in `src/`, 2 in `src/lib`

| file:line | Severity | Assessment / fix |
|---|---|---|
| `src/lib/db.ts:4` `process.env.DATABASE_URL!` | **Medium** | ALREADY-KNOWN. Fails at `neon()` with an opaque error if unset. Fix: `const url = process.env.DATABASE_URL; if (!url) throw new Error("DATABASE_URL is not set"); ` — 2 lines, dramatically better ops signal. |
| `src/lib/rate-limit.ts:24` `redis!` | **Medium** | **NEW**. Same shape. *(File is being edited concurrently tonight — coordinate.)* |
| `src/app/page.tsx:1144,1213` `analysis!` | **Medium** | **NEW**. Two assertions on the central `TeamAnalysis` object in the biggest file in the repo. Guarded by a render-time truthiness check ~100 lines earlier; a refactor that moves that guard silently reintroduces a null deref. Fix: hoist an early `if (!analysis) return null;` before the JSX so the narrowing is local. |
| `src/components/report/SpeedTierChart.tsx:21` `BASE_KEY_TO_MEGA_KEYS.get(baseKey)!`, `:188 mon.itemBoost!` | **Medium** | **NEW**. `Map.get()!` is the classic unsound `!`. Fix: `?? []` for the map, and a truthiness guard for `itemBoost` (which is `StatBoost \| null` in `AnalyzedPokemon`). |
| `src/components/report/MatchupPlanSlide.tsx:277` `mon.calculatedStats!` | Low | **NEW**. `calculatedStats` is non-optional on `AnalyzedPokemon` — this `!` is a no-op and signals the local `mon` is a looser type. Investigate and delete. |
| `src/components/report/TeamStats.tsx:32` `p.data!` | **Medium** | **NEW**. `data: PokemonData \| null` — this asserts away the exact null the type exists to model. Any species missing from the dex subset crashes `TeamStats`. Fix: `.filter((p) => p.data !== null)` upstream. |
| `src/components/report/PokemonDropdown.tsx:54,59,83,94` `selectedIndex!` | Low | **NEW**. 4× on the same value; hoist one narrowing local. |
| Others (`weekly-report/route.ts:22`, `sync/[id]/route.ts:26`, `ReportCard.tsx:226,286`, `Navbar.tsx:962`, `LanguageSelector.tsx:12`, `FeedbackContent.tsx:111`, `dashboard/profile/page.tsx:283`) | Low | Mostly `Array.find(...)!` over a static constant list — sound in practice. Lower priority. |

### 4.3 Unchecked index access — `src/lib` breakdown (84 errors, 47 outside tests)

By file (non-test), from the measured `noUncheckedIndexedAccess` run:

| File | Count | Real risk? |
|---|---|---|
| `src/lib/utils/sprite-url.ts` | **12** | **YES — see 4.3a** |
| `src/lib/parser/showdown-parser.ts` | 8 | No — all regex capture groups / guaranteed `split()[0]`. Sound. |
| `src/lib/utils/random-accent.ts` | 6 | No — `PALETTES[Math.floor(Math.random()*len)]` is always in range. |
| `src/lib/utils/paste-edit.ts` | 6 | No — `lines[0]` after a `split("\n")` (never empty) and regex groups. |
| `src/lib/utils/version-diff.ts` | 3 | No (index-wise) — but see **§5, a real bug lives here**. |
| `src/lib/utils/extract-species.ts` | 2 | No. |
| `src/lib/linear.ts` | 2 | **Borderline — see 4.3b** |
| `src/lib/data/pkmn-dex-fallback.ts` | 2 | **YES — see 4.3c** |
| `src/lib/utils/diff-state.ts`, `src/lib/sharing/url-codec.ts`, `src/lib/data/pokemon.ts` | 1 each | No. |

**4.3a — `src/lib/utils/sprite-url.ts:47` — HIGH, genuinely unsound.** **NEW.**
```ts
const GEN_SPRITE_STYLES: Record<string, GenSpriteStyle> = { gen1: …, … gen9: … };
const style = GEN_SPRITE_STYLES[genTheme] ?? GEN_SPRITE_STYLES.gen9;   // :47
```
Because the map is typed `Record<string, GenSpriteStyle>`, **the `?? GEN_SPRITE_STYLES.gen9` fallback is itself an index access** — TypeScript cannot prove the fallback exists, and 12 subsequent `style.folder` / `style.animatedShiny` reads (lines 57–81) are unprotected. Today it happens to work; rename or typo `gen9` and every sprite on the site 500s with `Cannot read properties of undefined`. This is the single highest-value index fix in `src/lib`.
**Fix (3 lines, no behaviour change):**
```ts
const GEN_SPRITE_STYLES = { gen1: {…}, … gen9: {…} } as const satisfies Record<string, GenSpriteStyle>;
type GenTheme = keyof typeof GEN_SPRITE_STYLES;
const style: GenSpriteStyle = (GEN_SPRITE_STYLES as Record<string, GenSpriteStyle | undefined>)[genTheme] ?? GEN_SPRITE_STYLES.gen9;
```
`GEN_SPRITE_STYLES.gen9` is now a *property* access on a literal type and provably defined. Better still, change the `genTheme: string` parameter to `genTheme: GenTheme | (string & {})` so callers get autocomplete.

**4.3b — `src/lib/linear.ts:139,150` `mapping` possibly undefined.** **NEW.**
`FEEDBACK_TO_LINEAR: Record<string, { label: string; priority: number }>` is indexed by `opts.type: string`. The caller (`src/app/api/feedback/route.ts:27`) validates `type` with `z.enum(["feature","bug","improvement","other"])` — so it is safe today — but the `createLinearIssue` signature (`src/lib/linear.ts:85 type: string`) **throws that guarantee away at the module boundary**.
**Fix:** `export type FeedbackType = "feature" | "bug" | "improvement" | "other";` derived from the Zod enum; type the map as `Record<FeedbackType, …>` and the param as `FeedbackType`. Also fixes the identical pattern in `src/lib/discord-bot.ts:36,43` (`TYPE_COLORS`/`TYPE_EMOJI` as `Record<string, …>`) and `src/app/api/feedback/route.ts:68,69`.

**4.3c — `src/lib/data/pkmn-dex-fallback.ts:76-78 and 132-134` — MEDIUM, data-driven crash.** ALREADY-KNOWN in general terms (22-05 §D flagged the casts) but **the specific tuple hole is NEW**.
```ts
const types = entry.types as PokemonType[];
const typesTuple: PokemonData["types"] = types.length >= 2 ? [types[0], types[1]] : [types[0]];
```
If the generated dex subset ever contains a species with `types: []`, this produces `[undefined]` typed as `[PokemonType]` — an `undefined` type silently entering the type-effectiveness chart. The `as` cast plus the absent length-0 branch means the compiler cannot help.
**Fix (2 lines):** `if (types.length === 0) { pokemonCache.set(key, null); return null; }` before the tuple build, in both `getPokemonData` and `getMegaEntryFromDex`. Cheap, and matches the existing `baseStats` defensive guard 8 lines above.

### 4.4 Unchecked index access — outside `src/lib` (243 errors)

Dominated by **Neon SQL result indexing**: `src/app/api/share/route.ts` (20), `user/analytics/route.ts` (16), `share/[id]/route.ts` (14), `explore/route.ts` (9), `user/profile/route.ts` (7), `share/[id]/versions/route.ts` (7), `cron/weekly-report/route.ts` (7), `comments/[shareId]/route.ts` (7), `bot/route.ts` (7). Almost all are `rows[0].something` after a query that *usually* returns a row.
**Fix pattern (one helper, ~10 lines, kills most of the 243):**
```ts
// src/lib/db.ts
export function firstRow<T>(rows: T[]): T | undefined { return rows[0]; }
export function requireRow<T>(rows: T[], what: string): T {
  const r = rows[0];
  if (!r) throw new Error(`Expected a row for ${what}`);
  return r;
}
```
Then `noUncheckedIndexedAccess` becomes affordable. Do **not** flip the flag before this helper lands.

---

## 5. Missing discriminated unions — and one real bug they would have prevented

### 5.1 🐛 `src/lib/utils/version-diff.ts` — stringly-typed change keys produce a wrong label and wrong navigation — **HIGH, NEW**

`computeVersionDiff` encodes changes as `Set<string>` with an ad-hoc `"<type>:<key>"` scheme:

- `src/lib/utils/version-diff.ts:112` → `` changedFields.add(`pokemon:${i}`) `` — **`i` is a numeric index**
- `:121`, `:128`, `:135` → `` `notes:${key}` ``, `` `calcs:${key}` ``, `` `roles:${key}` `` — **`key` is a species name** (`speciesKeys[i]`)
- `:142` → `` `slide:${slideIndex}` `` — a third, unrelated encoding

Both consumers re-parse with the same regex and assume **every** variant carries a species name:

`src/lib/utils/version-diff.ts:232-248` (`getNavigableChanges`):
```ts
const match = field.match(/^(pokemon|notes|calcs|roles):(.+)$/);
const [, type, key] = match;
const name = key.replace(/^./, (c) => c.toUpperCase());   // "0" -> "0"
…
const pokemonIndex = speciesKeys.indexOf(key);            // indexOf("0") === -1
slide = pokemonIndex >= 0 ? pokemonIndex + 2 : 0;         // -> 0
```
`src/lib/utils/version-diff.ts:295-305` (`summarizeChangedFields`) — identical duplicated regex, same defect.

**Observable impact:** when a user edits a Pokémon's *set* (EVs/SP, item, ability, moves — the single most common edit in this app), the version-diff navigator labels it **"Set (0)"** instead of **"Set (Incineroar)"**, and clicking it navigates to the **overview slide (0)** instead of that Pokémon's detail slide. Notes/calcs/roles changes on the same Pokémon behave correctly, which makes it look like a flaky UI rather than a data-model bug. Consumed by `src/app/page.tsx:576` and `:48`.

**There are no tests for `version-diff.ts` or `diff-state.ts`** — `src/lib/utils/__tests__/` has no `version-diff.test.ts`. Per CLAUDE.md ("regressions get a test that names the bug"), this needs one.

**Concrete fix — replace the stringly-typed set with a discriminated union:**
```ts
export type ChangedField =
  | { kind: "team";     field: TeamLevelField }              // teamSummary | teamName | tags | …
  | { kind: "pokemon";  aspect: "set" | "notes" | "calcs" | "roles"; index: number; species: string }
  | { kind: "slide";    slide: number };
```
Carrying **both** `index` and `species` removes the `speciesKeys.indexOf()` round-trip entirely and makes the compiler reject the current mismatch. The two duplicated regexes collapse into one `switch (f.kind)` and both `key.replace(/^./, …)` unchecked-index sites disappear. The `Set<string>` is persisted into share payloads, so keep a `serializeChangedField`/`parseChangedField` pair at the storage boundary for back-compat.

*Not on the conflict-risk list.* Recommend filing as a Linear bug rather than a drive-by fix — it's a ~60-line change plus tests.

### 5.2 `LegalityIssue.severity` — **LOW, do not change**
`src/lib/validation/champions-legality.ts:29-36`. Code branches on `i.severity === "error"` (`:327`, plus 10 assertions in the test file). But all three variants carry identical payloads (`message`, optional `pokemon`), so a DU would add ceremony without removing a single unsound access. **Correctly modelled as-is.** *(File is on the conflict-risk list and is being edited tonight — another reason to leave it.)*

### 5.3 `NotificationType` — **LOW-MEDIUM, NEW**
`src/lib/notifications.ts:3` declares `"comment" | "reaction" | "new_report" | "collab_invite"`, but `createNotification` takes `sourceShareId: string | null` and `sourceUserName: string | null` positionally for **all** variants. `collab_invite` has no source report; `comment`/`reaction`/`new_report` always do. A DU on the payload would make the required fields required per variant and eliminate the four-positional-nullable-args signature (which is itself an argument-order footgun — two adjacent `string | null` params). Worth a ticket, not urgent.

### 5.4 `src/lib/utils/normalize-report.ts` `migratePlan` — **LOW, NEW**
Branches on *shape* (`Array.isArray(plan.gamePlans)`) rather than a tag, over `Record<string, unknown>` legacy payloads. This is the correct approach for un-versioned historical data; the improvement would be adding a `schemaVersion` to newly-written share payloads so future migrations can switch on a tag. Note this file alone accounts for 42 of the 644 `noPropertyAccessFromIndexSignature` errors — it is *supposed* to be loose.

---

## 6. Domain-logic files — targeted notes

### `src/lib/analysis/stat-calculator.ts` ⚠️ **CONFLICT-RISK — modified on main in last 14 days AND being edited right now by another agent. I would not touch this file tonight.**
- `:58`, `:74` `return result as StatSpread` — ALREADY-KNOWN (22-05 §D). Sound (the loop provably covers all 6 keys) but the cast is what makes it sound, not the type system. Tightening would be `Object.fromEntries(STATS.map(...)) as StatSpread` — no net gain. **Leave.**
- **`const stats: StatName[] = ["hp","atk","def","spa","spd","spe"]` is duplicated 5 times** (`:51`, `:67`, `:95`, `:119`, and again in `champions-legality.ts` implicitly via `Object.values`). **NEW.** Extract `export const STAT_NAMES = ["hp","atk","def","spa","spd","spe"] as const satisfies readonly StatName[]` into `src/lib/types/pokemon.ts`. Low risk, but **defer — conflict-risk file.**
- `looksLikeChampionsSp(spread)` (`:94`) accepts any `StatSpread`; nothing in the type prevents negative or non-integer values reaching it, and `total <= 66 && every <= 32` would return `true` for a spread of `{hp: -100, …}`. Type-level fix isn't practical; a runtime `Number.isInteger(v) && v >= 0` guard belongs in the parser (`parseStatLine`, which is `\d+`-bounded and therefore already safe) — **no action needed, documenting the boundary.**

### `src/lib/parser/showdown-parser.ts`
- `:114-115` `POKEMON_TYPES.includes(tt as PokemonType)` then `tt as PokemonType` — ALREADY-KNOWN. Sound but the cast defeats the check it's guarding. **Fix (NEW, concrete):**
  ```ts
  const POKEMON_TYPES = [...] as const;
  type PokemonTypeLiteral = typeof POKEMON_TYPES[number];
  const isPokemonType = (t: string): t is PokemonTypeLiteral => (POKEMON_TYPES as readonly string[]).includes(t);
  …
  if (isPokemonType(tt)) teraType = tt;   // no cast, narrowed
  ```
  Removes 2 casts; `POKEMON_TYPES` also stops being a mutable array that any importer could `push()` into. Not conflict-risk, ~6 lines, has test coverage (`src/lib/parser/__tests__/showdown-parser.test.ts`).
- `:80` `genderMatch[1] as "M" | "F"` — sound (regex group is `[MF]`). Would also be removed by the predicate pattern. Low priority.
- `:190`, `:209` — the 2 `exactOptionalPropertyTypes` errors in `src/lib`. `teamName?: string` on `ParsedTeam` is assigned `string | undefined`. Fix: `teamName?: string | undefined` on the interface, or `...(teamName ? { teamName } : {})` at both return sites. Prerequisite if that flag is ever enabled.

### `src/lib/validation/champions-legality.ts` ⚠️ **CONFLICT-RISK — modified on main and being edited right now.**
- `:294` `for (const [stat, value] of Object.entries(p.evs))` — `Object.entries` widens `StatSpread` to `[string, number][]`, losing `StatName`, hence `stat.toUpperCase()` produces `"HP"`/`"SPA"` rather than a proper display label. Minor, and a `STAT_NAMES.map` loop would fix both the typing and the label. **Defer — conflict-risk file.**
- No other type-soundness issues. `LegalitySeverity`/`LegalityIssue`/`LegalityResult` are cleanly modelled.

---

## 7. Conflict-risk files — explicit flags

| Conflict-risk file | Would I touch it? | Why |
|---|---|---|
| `src/lib/analysis/stat-calculator.ts` | **NO** | On the list *and* actively modified in the working tree right now (§6). All findings here are cosmetic. |
| `src/lib/analysis/__tests__/stat-calculator.test.ts` | **NO** | Modified in the working tree right now. |
| `src/lib/validation/champions-legality.ts` | **NO** | On the list *and* modified in the working tree right now. Only finding is a cosmetic `Object.entries` widening. |
| `src/components/report/PokemonCard.tsx` | **NO** | One `noUnusedLocals` hit (`displayData`, `:180`) — leave it to whoever owns the file. |
| `src/components/report/PokemonDetailSlide.tsx` | **NO** | One `noUnusedParameters` hit (`category`, `:243`). |
| `src/components/report/StatColorNote.tsx` | **NO** | No findings. |
| `src/app/changelog/data.ts` | **NO** | No findings (all `any` hits were prose). |

**Also currently dirty in the working tree (avoid tonight even though not on the 14-day list):** `src/lib/posthog-server.ts`, `src/lib/rate-limit.ts`, `src/lib/data/dex-subset.ts`, `src/lib/data/type-chart.ts`, `src/lib/consent.ts`, `src/lib/templates.ts`, `src/lib/security/cors.ts`, `src/hooks/useHomePage.ts`, `src/app/api/share/route.ts`, `src/app/api/creator/[name]/route.ts`, `src/app/champions/**`, `src/app/layout.tsx`, `src/proxy.ts`, **`tsconfig.json`**.

> ⚠️ **The tsconfig recommendations in §1 collide directly with an in-flight edit to `tsconfig.json` by another agent.** Whoever applies them must rebase onto that agent's `exclude` change (and re-measure, because un-excluding `cypress/` adds files to every flag count in the matrix).

---

## 8. Prioritised recommendations (risk reduced ÷ effort)

| # | Change | Files | LOC | Severity | Conflict risk |
|---|---|---|---|---|---|
| 1 | **Delete `src/lib/analysis/__tests__/__scratch-probe.test.ts`** — untracked debug file, breaks cold `tsc` (3 errors) and `vitest` | 1 (delete) | 0 | **Blocker** | None (untracked) |
| 2 | **Add 4 free strict flags** — `noImplicitOverride`, `noFallthroughCasesInSwitch`, `allowUnreachableCode:false`, `allowUnusedLabels:false`. Measured **0 errors** each | `tsconfig.json` | 4 | High value | ⚠️ tsconfig being edited concurrently |
| 3 | **Fix `sprite-url.ts:47`** — `as const satisfies` + typed fallback; removes a real `undefined`-deref path behind 12 unchecked reads | `src/lib/utils/sprite-url.ts` | ~4 | **High** | None |
| 4 | **Type the two `linearQuery` boundaries + delete the duplicate** — hoist one generic/schema'd helper, kills 11 `any` call sites | `src/lib/linear.ts`, `src/app/api/discord/route.ts` | ~40 | **High** | None |
| 5 | **Add `noImplicitReturns` + its 2 one-line fixes** — both are conditional-`useEffect`-cleanup bugs | `tsconfig.json`, `NotificationBell.tsx:78`, `useShareUrl.ts:137` | 3 | High | ⚠️ tsconfig |
| 6 | **File a Linear bug for `version-diff.ts` "Set (0)"** (§5.1) + the `ChangedField` discriminated union + first tests for `version-diff.ts` | `src/lib/utils/version-diff.ts` (+ new test) | ~60 | **High** | None |
| 7 | **`verbatimModuleSyntax: true`** — 0 errors; validate with one `next build` | `tsconfig.json` | 1 | Medium | ⚠️ tsconfig |
| 8 | **`FeedbackType` union** — replaces 3 `Record<string, …>` index lookups across linear/discord-bot/feedback route | `src/lib/linear.ts`, `src/lib/discord-bot.ts`, `src/app/api/feedback/route.ts` | ~12 | Medium | None |
| 9 | **`pkmn-dex-fallback.ts` length-0 type guard** (2 sites) | `src/lib/data/pkmn-dex-fallback.ts` | 4 | Medium | None |
| 10 | **Return types on the 10 `src/lib` exports** (§3) | 6 files | 10 | Medium | None |
| 11 | **`firstRow`/`requireRow` DB helpers**, then stage `noUncheckedIndexedAccess` per-directory | `src/lib/db.ts` + API routes | ~10 + rollout | Medium | ⚠️ `share/route.ts` dirty |
| 12 | **Zod-parse `pokepaste.ts`** (external, user-triggered fetch) | `src/lib/utils/pokepaste.ts` | ~20 | Medium | None |
| 13 | `DATABASE_URL!` / `redis!` → explicit throws | `src/lib/db.ts`, `src/lib/rate-limit.ts` | 6 | Medium | ⚠️ `rate-limit.ts` dirty |
| 14 | Showdown-parser `isPokemonType` type predicate | `src/lib/parser/showdown-parser.ts` | ~6 | Low | None |
| 15 | Raise `target` ES2017 → ES2022; drop dead `allowJs` | `tsconfig.json` | 2 | Low (bundle win) | ⚠️ tsconfig |
| — | `noPropertyAccessFromIndexSignature` | — | — | **Rejected** — 644 errors, `normalize-report.ts`/`diff-state.ts` are intentionally loose | — |
| — | `exactOptionalPropertyTypes` | — | — | **Deferred** — 57 errors, 22 in conflict-risk `src/components/report` | — |

---

## 9. Delta vs. the 2026-05-22 audit

**Fixed since then (verified):** the `Record<string, any>` in `migrate/route.ts`; return types on `db.ts` (`getDb`, `ensureTable`), `discord-webhook.ts`, `haptics.ts` (×3), `VersionDiffContext.tsx`, `useGlobalDisplayPrefs.ts`; `useAutoDraft.ts` `unknown | null`. Explicit `any` is now **zero** repo-wide.

**Still open from that report:** `linear.ts` / `discord-bot.ts` / `email.ts` / `pokepaste.ts` untyped `res.json()`; the Clerk webhook double cast; `pkmn-dex-fallback.ts` casts; `showdown-parser.ts` type-predicate refactor. Note the 22-05 report deferred linear/email/discord-bot as "on the conflict-risk list" — **they are not on tonight's list**, so they are now actionable.

**New this run:** the entire tsconfig flag matrix (§1); the `incremental`/stale-tsbuildinfo masking (§0.2); the duplicate `linearQuery` in `discord/route.ts` (§A2); `sprite-url.ts` unsound fallback (§4.3a); the `version-diff.ts` "Set (0)" bug and its missing discriminated union (§5.1); 18 of the 20 non-null assertions; `target: ES2017` and dead `allowJs`.
