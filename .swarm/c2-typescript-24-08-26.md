# C2 — TypeScript Strictness Audit (24-08-26)

Repo: `/home/user/VGC-Team-Report` · TypeScript 5.9.3 · read-only audit, no files outside `.swarm/` touched.

Baseline: `node node_modules/typescript/bin/tsc --noEmit --incremental false` → **0 errors**, ~13s cold. Green.

---

## 1. VGC-261 verification — ACTUAL per-flag error counts

Method: for each flag currently OFF, a full cold program check
`node node_modules/typescript/bin/tsc --noEmit --incremental false --<flag>`.
Flag plumbing was sanity-checked by running `--strictNullChecks false`, which produced 34 errors — so the CLI overrides really do reach the program and a `0` is a real `0`, not a silently-ignored flag.

| Flag (currently OFF) | Actual errors | Safe to enable now? |
|---|---:|---|
| `verbatimModuleSyntax` | **0** | Yes (diagnostics-clean; see caveat) |
| `useDefineForClassFields` | **0** | Yes — and it is a no-op here (no classes in `src/`) |
| `noImplicitReturns` | **2** | Near-clean — 2 one-line fixes |
| `noUnusedParameters` | **5** | Near-clean |
| `noUnusedLocals` | **22** | Small cleanup |
| `exactOptionalPropertyTypes` | **57** | No — real work |
| `noUncheckedIndexedAccess` | **323** | No — large |
| `noPropertyAccessFromIndexSignature` | **649** | No — largest |
| `isolatedDeclarations` | **N/A** | Cannot be enabled: TS5069 (needs `declaration`/`composite`) + TS5053 (conflicts with `allowJs`) |

### Verdict on the ticket's claim

> VGC-261: "4 strict flags are already clean (0 errors each)"

**The claim is not reproducible as stated for the flags that are still off.** Only **two** currently-off flags measure 0 errors: `verbatimModuleSyntax` and `useDefineForClassFields`. A third candidate, `isolatedDeclarations`, reports 2 errors but they are *configuration* conflicts, not code errors — it is structurally unavailable, not clean.

The likely source of the "4 clean" figure is the tsconfig comment block, which records five flags measured at 0 on 2026-08-10 — but **those five are already enabled** (`noImplicitOverride`, `noFallthroughCasesInSwitch`, `noUncheckedSideEffectImports`, `allowUnreachableCode: false`, `allowUnusedLabels: false`). They are clean by construction, since the baseline is 0 with them on. They are not remaining work. If VGC-261 is read as "there are 4 more flags waiting, all at zero", that is wrong — there are **2**.

Combined check: `--verbatimModuleSyntax --useDefineForClassFields` together → **exit 0**, still zero errors. They compose.

**Caveat on `verbatimModuleSyntax` (the tsconfig comment is correct here):** it changes import-elision *emit*, not just diagnostics. `tsc` runs with `noEmit`, and Next transpiles via SWC, so risk is low, but it still deserves its own commit with a real `next build` behind it. Do not batch it with the cheap diagnostics flags.

### Recommended enable order

1. **Now, zero-risk, one commit:** `useDefineForClassFields: true` (0 errors, no classes exist — arguably not worth the line).
2. **Next, 2-line fix then enable:** `noImplicitReturns` (both sites below).
3. **Then, 5-line fix then enable:** `noUnusedParameters` (prefix with `_`).
4. **Then, 22-line cleanup:** `noUnusedLocals` — this one has genuine dead-code value; three of its hits are real dead exports.
5. **Own commit + `next build`:** `verbatimModuleSyntax`.
6. **Defer / separate epic:** `exactOptionalPropertyTypes` (57), `noUncheckedIndexedAccess` (323), `noPropertyAccessFromIndexSignature` (649).
7. **Close as won't-do:** `isolatedDeclarations`.

---

## 2. `any`, assertions, non-null — `src/lib/` is genuinely clean

This is the headline good news and it should be recorded so future audits don't re-litigate it.

- **Explicit `any` in `src/lib/` (non-test): 0.** Every grep hit is the English word "any" inside a comment (e.g. `src/lib/utils/paste-edit.ts:50` "nickname (if any)").
- **`as any` anywhere in `src/`: 0.**
- **`@typescript-eslint/no-explicit-any` disables: 0.** No suppressions hiding anything.
- **Implicit `any`: 0** — `strict: true` implies `noImplicitAny` and the baseline is green.
- **Non-null assertions in `src/lib/` (non-test): 3 real ones** (the other grep hits are `!` inside GraphQL type strings in `linear.ts` and a regex negative-lookahead in `bot-detection.ts`).

The domain core (`parser/`, `analysis/`, `validation/`, `data/`) has **no `any` at all**. The remaining type-safety debt there is unchecked *index* access and a handful of narrowing casts, not untyped code.

---

## 3. Findings — `src/lib/` domain logic (priority order)

### F1 — `src/lib/data/pkmn-dex-fallback.ts:82-85` and `:138-141` — unsound tuple construction (highest real risk)

```ts
const types = entry.types as PokemonType[];
const typesTuple: PokemonData["types"] = types.length >= 2
  ? [types[0], types[1]]
  : [types[0]];
```

Two unsound steps stacked. `entry.types` is `string[]` decoded by `splitList()` in `dex-subset.ts:106-110`, which **returns `[]` for an empty joined string**. So if any subset row ever has an empty types field, `types[0]` is `undefined` and this produces `[undefined]` while the declared type says `[PokemonType]`. `PokemonData.types` is consumed by the type chart and coverage charts, which will read `undefined` as a type key. This is a latent runtime bug, not just a lint nit. Identical pattern at `:138-141` for megas.

Fix — validate instead of assert, and fail closed:

```ts
function toTypesTuple(raw: string[]): PokemonData["types"] | null {
  const types = raw.filter((t): t is PokemonType => POKEMON_TYPES.includes(t as PokemonType));
  const [first, second] = types;
  if (!first) return null;
  return second ? [first, second] : [first];
}
// caller:
const typesTuple = toTypesTuple(entry.types);
if (!typesTuple) { pokemonCache.set(key, null); return null; }
```

### F2 — `src/lib/data/pkmn-dex-fallback.ts:73-79` — assertion makes the guard below dead

```ts
const baseStats = entry.baseStats as StatSpread;
if (!baseStats || (baseStats.hp === 0 && baseStats.atk === 0)) { ... }
```

After the assertion TS believes `baseStats` is always present, so `!baseStats` is statically dead — the compiler can no longer tell you if the underlying data goes missing. Type the decoder's return instead: give `DexSubsetSpecies.baseStats` the `StatSpread` type at the `decodeSpecies` boundary (`dex-subset.ts:113-131` already builds it field-by-field from a typed tuple, so this costs nothing) and drop the cast. Keep the `hp === 0 && atk === 0` sentinel check, which is a real data check.

### F3 — `src/lib/data/dex-subset.ts:105` — double cast at the JSON boundary

```ts
const subset = rawSubset as unknown as PackedDexSubset;
```

`as unknown as X` is the strongest possible assertion — it defeats even structural checking, so a `schemaVersion` bump in `scripts/build-dex-subset.mjs` that changes tuple arity compiles silently. The file already declares `SCHEMA_VERSION = 2`; the cast should be paired with a runtime assertion at module load:

```ts
const subset = rawSubset as unknown as PackedDexSubset;
if (subset.schemaVersion !== SCHEMA_VERSION) {
  throw new Error(`dex-subset schema ${subset.schemaVersion} != expected ${SCHEMA_VERSION}`);
}
```

(If that check already exists downstream, this finding drops to informational — but the cast itself should carry the comment pointing at it.)

### F4 — `src/lib/data/dex-subset.ts:220-222` — `asPokemonTypes` is an exported lie

```ts
/** Narrow a string[] of types to the typed PokemonType union. */
export function asPokemonTypes(types: string[]): PokemonType[] {
  return types as PokemonType[];
}
```

The doc comment says "narrow", the body asserts. It is a named, exported, reusable unsoundness — the worst kind, because callers read the name and assume validation happened. Either make it real or delete it:

```ts
export function asPokemonTypes(types: string[]): PokemonType[] {
  return types.filter((t): t is PokemonType => (POKEMON_TYPES as readonly string[]).includes(t));
}
```

### F5 — `src/lib/analysis/stat-calculator.ts:180` — non-null assertion on a `Map.get`

```ts
const group = groups.get(key)!;
```

`key` comes from `[...groups.keys()]` so the assertion is *correct today*, but it is unnecessary — the same loop can iterate entries and never need the assertion:

```ts
for (const [, group] of [...groups.entries()].sort((a, b) => b[0] - a[0])) {
  if (group.length > leftover) break;
  ...
}
```

This removes the only `!` in the domain layer and is behaviour-identical.

### F6 — `src/lib/analysis/stat-calculator.ts:160,164,173-176` — `Record<string, number>` where `Record<StatName, number>` is meant

```ts
const remainder: Record<string, number> = {};
```

Keyed only by `StatName`, but typed `string`, so a typo'd key would compile. Change to `Record<StatName, number>` initialised with all six stats (matching the `trimmed` literal on line 159), which also removes 3 of the file's `noUncheckedIndexedAccess` errors for free.

### F7 — `src/lib/analysis/stat-calculator.ts:58,74` — `Partial<StatSpread>` → `result as StatSpread`

```ts
const result: Partial<StatSpread> = {};
for (const stat of stats) { result[stat] = calculateStat(...); }
return result as StatSpread;
```

Correct because the loop covers all six, but the compiler is not checking that. Build the object literally so exhaustiveness is enforced:

```ts
return {
  hp:  calculateStat("hp",  baseStats.hp,  ivs.hp,  evs.hp,  level, nature),
  atk: calculateStat("atk", baseStats.atk, ivs.atk, evs.atk, level, nature),
  // … def, spa, spd, spe
};
```

Adding a 7th stat then becomes a compile error rather than a silent `undefined`. Same fix applies to both `calculateAllStats` and `calculateAllChampionsStats`, and to `src/lib/data/type-chart.ts:225` (`const profile = {} as Record<PokemonType, number>`) and `src/components/report/OffensiveCoverageChart.tsx:71`.

### F8 — `src/lib/parser/showdown-parser.ts` — unchecked regex-group and index access

Eight `noUncheckedIndexedAccess` errors, all the same shape: `match[1]`, `speciesMatch[2]`, `headerMatch[1]`, `atSplit[0]`, `lines[0]`, `lines[i]`.

- `:29-30` — `parseInt(match[1], 10)` / `statMap[match[2].toLowerCase()]`
- `:64,71-72` — `const firstLine = lines[0]; firstLine.split(" @ ")`
- `:80,87-88` — `genderMatch[1] as "M" | "F"`, `speciesMatch[1]`, `speciesMatch[2]`
- `:104` — `const line = lines[i]`
- `:177` — `headerMatch[1].trim()`

All are safe **today** — `blocks` is filtered by `.filter(Boolean)` at `:191` so `lines[0]` always exists, and every regex group is non-optional. They are false positives for correctness but real gaps in compiler coverage. The clean idiomatic fix is destructuring, which narrows for free:

```ts
const [, rawValue, rawStat] = match;          // instead of match[1] / match[2]
if (!rawValue || !rawStat) continue;
const [firstLine, ...restLines] = lines;      // instead of lines[0] / lines[i]
if (!firstLine) return { pokemon: emptyPokemon(), warnings: ["Empty block"] };
for (const line of restLines) { ... }         // instead of the index loop at :103
```

`gender = genderMatch[1] as "M" | "F"` at `:80` is one of only two assertions in the parser; the regex is `/\s+\(([MF])\)\s*$/` so it is sound, but destructuring plus a `=== "M" ? "M" : "F"` removes it. `:114-115` (`tt as PokemonType`) is the safe idiomatic guard pattern (`includes(x as T)` then assign) and can stay, though a type predicate helper would be tidier.

### F9 — `src/lib/parser/showdown-parser.ts:19` — weak `statMap` key type

```ts
const statMap: Record<string, keyof StatSpread> = { hp: "hp", ... };
```

Hoist it to module scope (it is rebuilt on every call) and type it `Record<string, StatName>` — or better, drop the map entirely and use a `StatName[]` `includes` guard on the lowercased match.

### F10 — `src/lib/cache.ts:29-42` — the generic is unsound in the no-schema branch

```ts
export async function cacheGet<T>(key: string, schema?: ZodType<T>): Promise<T | null> {
  ...
  if (!schema) return raw as T;
```

The existing comment (VGC-146) is honest about this, which is good. But the signature promises `T` and delivers whatever Redis had. Make the unsafety visible at the call site with an overload, so schema-less callers must handle `unknown`:

```ts
export async function cacheGet(key: string): Promise<unknown>;
export async function cacheGet<T>(key: string, schema: ZodType<T>): Promise<T | null>;
```

Callers that genuinely want the unchecked path then write an explicit local cast, which greps.

### F11 — `src/lib/i18n/index.ts:80-86` — Proxy triple-cast

```ts
return new Proxy(translations as Record<string, string>, {
  get(target, prop: string) {
    return (en as unknown as Record<string, string>)[prop];
  },
}) as TranslationKeys;
```

Three assertions to fake a total `TranslationKeys`. Structurally hard to type well; acceptable if isolated, but it is the reason `CommonModesSlide.tsx:108` and `useSlideSystem.ts:56` each re-cast `t as unknown as Record<string, string | undefined>` downstream — the unsoundness has leaked into two consumers. Consider generating a `Record<TranslationKey, string>` fallback object at build time (`scripts/`) instead of a Proxy, which would delete all four casts.

### F12 — `src/lib/i18n/index.ts:47,97` — the only exported functions in `src/lib/` missing return types

```ts
export function I18nProvider({ children }: { children: ReactNode })  // → JSX.Element
export function useTranslation()                                     // → I18nContextValue
```

Every other exported function in `src/lib/` (non-test) has an explicit return type. Two annotations closes this category completely.

### F13 — `src/lib/db.ts:4` and `src/lib/rate-limit.ts:24` — env non-null assertions

```ts
const sql = neon(process.env.DATABASE_URL!);   // db.ts:4
redis: redis!,                                  // rate-limit.ts:24
```

`DATABASE_URL!` crashes with a confusing `neon()` internal error at first query if unset. Fail fast with a named error at module load:

```ts
const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set");
const sql = neon(url);
```

`rate-limit.ts:24` — `redis!` should be a guarded early return; whatever check precedes it, TS is not seeing it.

### F14 — dead code surfaced by `noUnusedLocals` in `src/lib/`

- `src/lib/sharing/url-codec.ts:77` — `toBase64Url` is defined and never used (its counterpart `fromBase64Url` at `:85` is). Delete. Note `:80` also does unchecked `bytes[i]` access.
- `src/lib/data/tags.ts:33` — `type EventType` declared, never used (`ARCHETYPES`/`REGULATIONS` siblings are exported; this one is not). Either export it or delete it — `ReportTags.eventType` at `:38` is typed `string` and should probably be `EventType`, which is the better fix.
- `src/lib/discord-bot.ts:50` — `PRIORITY_LABELS` unused.
- `src/lib/__tests__/cron-auth.test.ts:1`, `src/lib/sharing/__tests__/url-codec.test.ts:1` — unused `vi` import.

---

## 4. Findings outside `src/lib/` (lower priority, for completeness)

### `noImplicitReturns` — the 2 blockers, both trivial

- `src/components/ui/NotificationBell.tsx:78` — `useEffect` returns a cleanup on the `if (open)` branch (`:90`) but falls through with no return on the close path. Add an explicit `return undefined;` at the end (or `return;`).
- `src/hooks/useShareUrl.ts:137` — same shape: an effect with an early `return` at `:138` and a cleanup on some paths.

Both are correct React; TS just wants the intent stated. **Fixing these two lines makes `noImplicitReturns` enableable.**

### `noUnusedParameters` — the 5 blockers

`PasteInput.tsx:121` (`selectedTemplate`, `onTemplateSelect`), `MatchupPlanSlide.tsx:447` (`onResultChange`), `PokemonDetailSlide.tsx:244` (`category`), `SpeedTierChart.tsx:548` (`i`). All fix by `_`-prefixing — but note the first three are *props being destructured and ignored*, which usually means either dead props to remove from the interface or a wired-up feature that got dropped. Worth a look before blindly renaming.

### Assertion hotspots in hooks / components

- `src/hooks/useDamageCalcs.ts:32-35` — `entry as Record<string, unknown>` then `e.category as string` inside an `includes()` then a further `as CalcCategory`. Three chained assertions on untrusted stored data. This is the single least-safe block in the repo. Replace with a zod schema (zod 4 is already a dependency) — `src/lib/utils/normalize-report.ts:10-25` does the same migration with proper `unknown` narrowing and is the pattern to copy.
- `src/hooks/useShareUrl.ts:195-201` — `data._redactedFields as string[]`, `data._editToken as string | undefined`, `_c as string[]` on API-response data. Should be zod-parsed at the fetch boundary.
- `src/hooks/useExploreUrlSync.ts:55-56` — `params.get("sort") as FilterState["sort"]` asserts a user-controlled URL param into a union with no validation. A bad `?sort=` value flows in as a valid-typed lie. Guard with an `includes` check against the existing `SORT_KEYS` const (`ExploreFilters.tsx:64`).
- `src/hooks/useShareFlow.ts:116` — `(state.tags as Record<string, unknown>)?.regulation as string ?? "unknown"` — double assertion; the `?? "unknown"` never fires because `as string` already claims non-null.
- `src/components/seo/JsonLd.tsx:139` — `schemaData as Record<string, unknown>` on SEO-critical output.

### Env-var access (`noPropertyAccessFromIndexSignature`, 76 of 649)

76 of the 649 errors are `process.env.FOO` dot-access. If that flag is ever pursued, the cheap global fix is a typed env module (`src/lib/env.ts` exporting validated, non-optional values via zod) which would also delete F13's assertions. That single change addresses ~12% of the flag's errors and improves runtime behaviour independently — worth doing on its own merits even if the flag is never enabled.

### The two `noPropertyAccessFromIndexSignature` hotspots

`src/lib/utils/normalize-report.ts` (42) and `src/lib/utils/diff-state.ts` (30) account for 72 of the 111 `src/lib` errors, because both deliberately walk `Record<string, unknown>` shapes from stored JSON. These are *correctly* written for what they do; the flag simply disagrees with the idiom. Any push toward this flag should convert these two files to zod schemas first, not add bracket syntax.

---

## 5. Bottom line

- The codebase is in unusually good type shape: **zero `any`, zero `as any`, zero suppressions, one non-null assertion in the entire domain layer**, and every exported `src/lib` function but two has a return type.
- **VGC-261's "4 clean flags" is off by two.** The real count of currently-off, zero-error flags is **2** (`verbatimModuleSyntax`, `useDefineForClassFields`), and one of those two is a no-op. The five flags the tsconfig comment measured are already enabled.
- **Cheapest real win: fix 2 lines → enable `noImplicitReturns`; fix 5 → enable `noUnusedParameters`.** That is 7 lines for two genuine flags, versus the 0 lines for the two already-zero flags that buy almost nothing.
- **Highest-value fix regardless of flags: F1** (`pkmn-dex-fallback.ts:82-85`), a real latent `undefined`-in-a-tuple bug that no currently-enabled flag can catch — and **`useDamageCalcs.ts:32-35`**, the chained-assertion block on stored data.
- The three big flags (323 / 57 / 649) are not "turn on and fix" work; they are refactors toward zod-at-the-boundary. Scope them as such or close them.
