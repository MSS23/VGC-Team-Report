# C2 — TypeScript strictness audit

- **Date:** 2026-11-16 · **HEAD:** `10dfd74` (main) · **TypeScript:** 5.9.3
- **Program:** 409 `.ts`/`.tsx` under `src/` (94 non-test files in `src/lib/`); 416 files scanned incl. `cypress/` + `scripts/`
- **Mode:** READ-ONLY. No source file edited/created/deleted, no git state change. The only write is this file.
- **Method:** full-program AST scan via the TypeScript compiler API (`SyntaxKind.AnyKeyword`, `AsExpression`, `NonNullExpression`, declared return types, type parameters) + ripgrep + manual data-flow tracing of each candidate. tsc was **not** re-run and no flag was flipped — flag costs below are reasoned/scaled estimates, basis stated per row.
- **Prior report:** `.swarm/c2-typescript-26-10-26.md` (2026-10-26). Every item in it was re-verified against the current tree; deltas in §0.1.

---

## 0. Headline

`any` is still **completely absent** from the program: 0 explicit `: any`, 0 `as any`, 0 `any[]`,
0 `Record<string, any>`, 0 generic defaulting to `any`, and — because `strict: true` implies
`noImplicitAny` — 0 implicit `any` from untyped params. There are also **0**
`@ts-expect-error` / `@ts-ignore` / `@ts-nocheck` directives anywhere in the repo, including tests.

`src/lib/validation/champions-legality.ts` (357 lines) contains **zero** type assertions and
**zero** non-null assertions. `src/lib/analysis/stat-calculator.ts` has 2 assertions, both sound.
`src/lib/parser/showdown-parser.ts`'s `parseStatLine` is regex-anchored to the six stat names
with a `statMap` lookup guard, so **the parser cannot inject an extra key into a `StatSpread`** —
which is what makes the whole SP/EV budget path (`isSpFormSpread` → `convertToChampionsSp` →
`validateChampionsTeam`) type-sound. The core VGC maths is not where the risk is.

The risk has moved to **one place: the `ShareableState` boundary**, where a Zod schema and a
TypeScript interface are held together by three `as` casts — and they **do not actually match
today** (§2, RISK-1). That is a live, verified divergence, not a hypothetical.

### 0.1 Delta since 2026-10-26

| Prior finding | Status now |
|---|---|
| DANGEROUS-1 `entry.types as PokemonType[]` → `TypeBadge` crash on `MissingNo.` | **FIXED.** `pkmn-dex-fallback.ts:52` now has a real `toPokemonTypes()` filter against `VALID_POKEMON_TYPES`, used at `:103` and `:171`. `TypeBadge.tsx:17-20` also gained `?? NEUTRAL_TYPE_COLORS`. Both halves of the recommended fix landed. |
| DANGEROUS-2 `[types[0]]` fabricating a `[undefined]` tuple | **FIXED.** `pkmn-dex-fallback.ts:104` and `:172` now return `null` when the filter leaves 0 types. |
| DANGEROUS-3 `cacheGet<T>`'s unchecked `raw as T` | **STILL LIVE**, unchanged. `cacheGet<ChampionsMetaResult>` still passes no schema. |
| DANGEROUS-4 `state as ShareableState` on the API fetch path | **MOSTLY FIXED.** `useShareUrl.ts:89-118` now has `parseFetchedShareState()` running `ShareableStateSchema.safeParse` with a documented legacy-tolerant retry. The residual `state as ShareableState` at `:281` is downstream of it. |
| DANGEROUS-5 redundant `result2.data as ShareableState` | **STILL LIVE, and worse** — the same cast now exists in 3 places, and I verified the drift it hides is real (RISK-1). |
| #6 `paste-edit.ts` `labels[stat as keyof typeof labels]` | Still live (`:106`). Downgraded: all callers pass a literal `StatSpread`. |
| #7 `{} as Record<PokemonType, number>` | Still live (`type-chart.ts:225`). |
| #8 `value as SerializedMatchupPlan[]` | Still live (`diff-state.ts:102`). |
| #9 `rawSubset as unknown as PackedDexSubset` | Still live (`dex-subset.ts:105`), still mitigated by `ensureSchema()`'s `schemaVersion` check, producer still unchecked. |
| #10 `tt as TeraType` in the `includes()` guard | Still live (`showdown-parser.ts:118-119`). |
| `asPokemonTypes` dead unchecked "narrow" | **STILL LIVE AND STILL DEAD** (`dex-subset.ts:221`, 0 callers). See RISK-4 — the fix went in next door and this trap was left loaded. |
| 30 production non-null assertions, none dangerous | Re-verified: 30, still none dangerous. |
| 23 `src/lib` exports missing return types | Still 23, same set (line numbers shifted in `email.ts`). |

---

## 1. Counts

| Category | Total | Non-test | `src/lib` non-test |
|---|---:|---:|---:|
| **`any` — explicit (`: any`, `as any`, `any[]`, `Record<string, any>`, `<T = any>`)** | **0** | **0** | **0** |
| **`any` — implicit (untyped param) inside the program** | **0** | **0** | **0** |
| **`any` — implicit in files the compiler never sees** | **33** | 33 | 0 |
| ↳ 17 untyped params in 4 × `scripts/*.mjs` (`**/*.mjs` absent from `include`) | | | |
| ↳ 16 untyped params in 9 × `cypress/**/*.ts` (`"exclude": ["node_modules", "cypress"]`) | | | |
| `@ts-expect-error` / `@ts-ignore` / `@ts-nocheck` | **0** | 0 | 0 |
| Type assertions (`as X`, excluding `as const`) | 637 | 438 | 42 |
| ↳ double casts `as unknown as X` | 19 | **5** | 2 |
| Non-null assertions `!` | 78 | 30 | 4 |
| ↳ where the value can actually be null/undefined | — | **0** | **0** |
| Exported functions with no explicit return type | 312 | 312 | **23** |
| Unconstrained exported generic | 2 | **1** | 1 |
| Files outside the type-check program | **13** | — | — |

**On the 312 missing return types:** 289 of them are React components and route handlers in
`src/app/**` / `src/components/**`, where an inferred `JSX.Element` / `Promise<Response>` is the
project's (and the ecosystem's) convention. Treating those as findings would be noise. The
**23 in `src/lib/`** are the real surface, and 7 of those are in the domain-math path (§3).

**On avoidable vs genuinely unavoidable `any`:** there is nothing to split — the count is 0.
This repo does **not** reach for `any` at its external JSON boundaries; it uses `unknown` and
then narrows (`normalizeReportData(data: Record<string, unknown>)`, `cacheGet`'s
`r.get<unknown>`, `const parsed: unknown = JSON.parse(json)`, `migrateCalcEntries(raw: unknown)`).
That is the correct pattern and it is applied consistently. The 33 implicit `any`s are all
**avoidable** — they exist only because 13 files sit outside `tsconfig.json`'s program
(`allowJs: true` is already set, so adding `**/*.mjs` to `include` is a one-line change).

---

## 2. Ranked findings

| # | file:line | Issue | Risk (what bug it allows) | Suggested fix | Effort |
|---|---|---|---|---|---|
| **RISK-1** | `src/lib/sharing/url-codec.ts:140`<br>`src/hooks/useShareUrl.ts:97`<br>`src/hooks/useShareUrl.ts:115` | `result2.data as ShareableState` / `parsed.data as ShareableState` / `retry.data as ShareableState` — three casts are the **only** thing tying `ShareableStateSchema` to the `ShareableState` interface, and **the two genuinely diverge today**: `CalcEntrySchema = z.unknown()` (`url-codec.schemas.ts:22`) so the schema infers `calcs?: Record<string, unknown[]>`, while the interface declares `calcs?: Record<string, CalcEntry[]>` with `CalcEntry = {text: string; category: CalcCategory}` (`useDamageCalcs.ts:7-10`). `unknown[]` is not assignable to `CalcEntry[]` — the cast is a **lie, not a no-op**. | The URL-decode path (`#data=` links) has **no** `normalizeReportData` in front of it — only the DB fetch path does (`api/share/[id]/route.ts:172,236`). So a crafted or legacy share URL carrying `calcs: {"Pikachu": [null]}` survives `safeParse`, is typed `CalcEntry[]`, and reaches `CalcsPanel.tsx:20` → `calcs.filter(c => c.category === "offensive")` → **TypeError reading 'category' of null, thrown inside React's render pass** — precisely the white-screen failure mode `useShareUrl.ts:81-84` documents as fixed on the *other* path. An object-valued `text` instead gives "Objects are not valid as a React child" at `CalcEntryGroup.tsx:116`. | Delete all three casts and pin the schema to the type so the compiler proves the relationship once: `export const ShareableStateSchema: z.ZodType<ShareableState> = z.object({…})`. That immediately fails to compile until `CalcEntrySchema` is tightened to `z.object({text: z.string(), category: z.enum(["offensive","defensive","speed"])})` — which is the actual fix. | **M** |
| **RISK-2** | `src/lib/utils/normalize-report.ts:19` | `migrateCalcEntries` only defaults a **missing** `category` (`e.category ?? "offensive"`); any non-empty garbage string passes straight through, and its declared return type is `category: string`, which RISK-1's cast then launders into `CalcCategory`. Its twin `useDamageCalcs.ts:35` **does** validate (`["offensive","defensive","speed"].includes(...)`). Two copies of one migration, only one of them correct. | A stored calc with `category: "Offensive"` (capitalised) or any typo is typed as a valid `CalcCategory`, then missed by all three filters at `CalcsPanel.tsx:20-22` — **the calc silently disappears from the report**. Silent data loss on the user's own saved damage calcs, with no error anywhere. | Make `normalize-report.ts` reuse the same validated list as `useDamageCalcs.ts:35` (ideally extract one `toCalcCategory(raw: unknown): CalcCategory` and call it from both), and type the return as `Record<string, CalcEntry[]>`. | **XS** |
| **RISK-3** | `src/app/api/share/[id]/route.ts:22`<br>`src/lib/sharing/team-graphic-image.tsx:91` | `normalizePrivateFields(data.privateFields as string[] \| undefined)` — cast over a raw Postgres JSON column. `normalizePrivateFields` (`redact-paste.ts:26-33`) does `!input \|\| input.length === 0` then `for (const f of input)`, with **no `Array.isArray`**. | A legacy/collab-written row holding a **string** (`"item"`) passes the guard (`.length === 4`), iterates as characters, matches no `VALID_FIELDS`, and returns `[]` → **`redactPasteFields` is skipped entirely and the creator's hidden spreads/IVs/nature/item are served to public viewers** in both the report body and the downloadable PNG. A non-array **object** throws (not iterable) → 500 on the og:image route. Tiered publishing (VGC-142) is a privacy promise, and this is a silent bypass of it. Mitigated — not eliminated — by `ShareBodySchema`'s `privateFields: z.array(z.string()).optional()` on the main write path (`api/share/route.ts:81`); the existing test only covers junk *names inside* a valid array. | Change the parameter to `unknown` and make the guard real: `if (!Array.isArray(input)) return [];`. One line, covers both call sites, and the cast can then be deleted. | **XS** |
| **RISK-4** | `src/lib/data/dex-subset.ts:221-223` | `export function asPokemonTypes(types: string[]): PokemonType[] { return types as PokemonType[]; }` — JSDoc says *"Narrow a string[] of types to the typed PokemonType union"*; the body does no narrowing. **Zero callers** (verified repo-wide). The real validator that fixed DANGEROUS-1 is `toPokemonTypes` at `pkmn-dex-fallback.ts:52`, which is module-**private**. | A loaded gun aimed at the bug that was just fixed. `dex-subset.json` still ships `MissingNo.` with type `"Bird"` (the data was never cleaned — only the consumer was). The next person needing to narrow dex types will find the exported, correctly-named, correctly-documented function and use it, reintroducing an unknown key into `Record<PokemonType, …>` lookups: wrong defensive profile (`getEffectiveness`'s `?? 1` silently scores "Bird" as neutral), wrong type-coverage charts. | Either delete it (it is dead) or make it the single real boundary: move `toPokemonTypes`' filter body into it and have `pkmn-dex-fallback.ts` import it. Prefer the latter — one exported, tested narrow instead of one private correct copy plus one public broken copy. | **XS** |
| **RISK-5** | `src/lib/utils/diff-state.ts:102` | `asArray` returns `Array.isArray(value) ? (value as SerializedMatchupPlan[]) : []` — the array-ness is checked, the **element shape is not**. | Feeds `matchupPlansChanged` → `normalize(p)` reads `p.opponentLabel` / `p.gamePlans`. A `null` or primitive element throws inside the version-diff, which gates whether a `share_versions` snapshot row is written — the table that consumed 447 MB of the 512 MB Neon free tier in July 2026. A wrong or thrown diff is a save failure or a storage incident, not just a bad render. | Validate per element (reuse `SerializedMatchupPlanSchema`, already exported from `url-codec.schemas.ts`), or compare on `unknown` with explicit guarded field reads. | **S** |
| **RISK-6** | `src/lib/cache.ts:35`<br>`src/app/api/champions/meta/route.ts:31` | `if (!schema) return raw as T;` — the repo's only unconstrained exported generic, with a pure unchecked cast on the no-schema branch. The `schema` parameter VGC-146 added to fix this is used by **1 of 6** call sites (`og-image.ts:64`). | `cacheGet<ChampionsMetaResult>(CACHE_KEY)` hands a stale Redis blob to the Champions meta endpoint typed as a valid result. After any shape change to `ChampionsMetaResult` the cache serves the old shape for a full TTL with no error — structurally wrong Champions meta data, compiler satisfied. (`cacheGet<unknown>`, `<{spotlight: unknown}>`, `<string>` are harmless.) | Pass a schema at the typed call sites. Then make the unchecked path grep-able rather than the default: rename it `cacheGetUnchecked<T>()` and require `schema` on `cacheGet`. | **S** |
| 7 | `src/lib/data/type-chart.ts:225` | `const profile = {} as Record<PokemonType, number>` — claims all 18 keys exist, then relies on a **hand-duplicated** `allTypes` literal to fill them. `PokemonType`'s 18 members are re-listed by hand in 8 places (see §5); nothing derives from anything. | Add a member to `PokemonType` without touching the literal and every read of the new key is `undefined` typed `number` → `NaN` effectiveness multipliers in the defensive profile, i.e. a wrong type-matchup chart with no error. | `Object.fromEntries(POKEMON_TYPES.map(t => [t, f(t)])) as Record<PokemonType, number>` — still a cast, but provably total because the key source *is* the union source. Plus §5. | **S** |
| 8 | `src/lib/data/dex-subset.ts:105` | `rawSubset as unknown as PackedDexSubset` — double cast over a 127 KB positional-tuple JSON artifact. | The only thing tying the emitter's tuple layout to `PackedSpecies` is a hand-bumped `SCHEMA_VERSION` integer checked in `ensureSchema()` — and the emitter (`scripts/build-dex-subset.mjs`) is **never type-checked** (§4). Reorder two tuple slots without bumping the integer and every base stat in the fallback dex is silently wrong. | Keep the cast (per-row parsing 1515 species on the client isn't worth it), but add `**/*.mjs` to `include` so the emitter and `PackedSpecies` are checked against each other. | **S** |
| 9 | `src/lib/sharing/team-graphic-image.tsx:92,96-100` | `(data.paste as string) ?? ""`, `as { archetype?: string[]; … }` etc. over a raw DB JSON column. The `??` only catches null/undefined, not a wrong type. | A non-string `paste` reaches `parseTeamForGraphic(paste)` → `.split` on a non-string → 500 on `/api/team-graphic` and on the publish-time og:image pre-render. Degraded unfurl card, not a wrong stat. | `typeof data.paste === "string" ? data.paste : ""`, or parse the row once with a Zod schema at the query site. | **S** |
| 10 | `src/lib/parser/showdown-parser.ts:118-119` | `TERA_TYPES.includes(tt as TeraType)` — the cast exists only to satisfy `includes`, and it sits on the **argument of the guard that is supposed to justify it**. | Correct today, but this is the exact idiom that produced the (now fixed) `MissingNo.` crash. It teaches the pattern. | `(TERA_TYPES as readonly string[]).includes(tt)`, or one shared `isTeraType(x): x is TeraType` predicate. | **XS** |
| 11 | `src/lib/utils/paste-edit.ts:106` | `labels[stat as keyof typeof labels]` over `Object.entries(spread)` — asserts an unenumerated runtime key is one of 6 known keys. | An extra key on a `StatSpread` writes `EVs: 5 undefined` into the user's paste; on re-parse the regex drops that stat entirely → silent spread corruption. **Downgraded from the prior audit**: every caller passes a literal `StatSpread` built in-process, and `parseStatLine` provably cannot produce an extra key, so this is unreachable today. | Iterate a `const stats: StatName[]` instead of `Object.entries`. | **XS** |
| 12 | `src/app/api/webhooks/clerk/route.ts:61` | `event.data as unknown as ClerkUserCreatedData` | **Closest thing in the repo to a genuinely unavoidable boundary cast** — Clerk's `WebhookEvent` union is wider than the handled case. | Narrow on `event.type` first, then a single `as`, so the double cast goes away. | **XS** |
| 13 | `src/lib/i18n/index.ts:84`<br>`src/components/report/CommonModesSlide.tsx:108`<br>`src/hooks/useSlideSystem.ts:56` | `t as unknown as Record<string, string \| undefined>` — the same workaround written three times to read a key `TranslationKeys` does not declare. | None at runtime (the `Proxy` fallback at `i18n/index.ts:84` returns the English string for a missing key, so it degrades). Pure maintenance debt. | Add the key (`commonModesTitle`) to `TranslationKeys`; all three double casts disappear. | **XS** |
| 14 | ~290 sites in `src/app/api/**`, `src/app/s/[id]/`, `src/app/creator/[name]/` | **The DB-row boundary.** `getDb()` returns `NeonQueryFunction<false,false>`, whose rows are `Record<string, unknown>`, so **every single field read is a hand-written `as`** (≈184 × `as string`, 38 × `as Date`, 44 × `as Record<string, unknown>`). | No individual one is dangerous — each is a developer reading their own `SELECT`. In aggregate it is the reason the assertion count is 438: a column rename, or an `integer`→`bigint` migration (Postgres returns `bigint` as a **string** over the wire), is caught nowhere. It is also what makes `noUncheckedIndexedAccess` and `noPropertyAccessFromIndexSignature` expensive (§6). | One `rows<T>(sql, schema)` helper that Zod-parses once per query site: ~290 assertions → ~40. Own ticket; prerequisite for the NUIA rollout. | **L** |

### 2.1 Non-null assertions — 30 in production, **0 dangerous**

Every one was traced to its guard and is provable at runtime; the compiler just can't see the
proof. Spot-verified this run:

- `stat-calculator.ts:225` `groups.get(key)!` — `key` came from `[...groups.keys()]`. Sound.
- `MatchupPlanSlide.tsx:286` `mon.calculatedStats![stat]` — inside `mon.hasEvs && mon.calculatedStats ?` at `:277`. Sound.
- `SpeedTierChart.tsx:203` `mon.itemBoost!.multiplier` — guarded by `hasSpeedBoost = mon.itemBoost?.stat === "spe"`; a boolean doesn't narrow, but it is correct. Fix by inlining: `mon.itemBoost?.stat === "spe" ? mon.itemBoost.multiplier : 1`.
- `TeamStats.tsx:34` `p.data!.baseStats` — after `.filter(p => p.data?.baseStats)`; `filter` doesn't narrow. Fix with `flatMap`.
- `SpreadBuilder.tsx:52-53` — **8 assertions on 2 lines**, the worst-smelling of the set: `{outcome.stats && …}` narrows `stats` but not its siblings `before`/`wasted`. Fix with a discriminant (`ok: true`/`ok: false`).
- `db.ts:4` `process.env.DATABASE_URL!` — env contract; `neon()` throws anyway. An explicit throw would give a better message.
- `rate-limit.ts:24` `redis!`, `collaboration.ts:33` `char.codePointAt(0)!` — both provable.

None of these can produce a wrong VGC stat or legality verdict; the worst case is a render-time
TypeError, and none is reachable.

### 2.2 Explicitly assessed and found SOUND

- `stat-calculator.ts:58,74` `result as StatSpread` — `Partial<StatSpread>` accumulator filled over all 6 `StatName`s on the line above. **Lazy, not dangerous.** (Cleanest fix: return the object literal directly.)
- `showdown-parser.ts:84` `genderMatch[1] as "M" | "F"` — regex is `/\s+\(([MF])\)\s*$/`; group 1 cannot be anything else.
- `redact-paste.ts:30` `f as PrivateField` — guarded by `VALID_FIELDS.has(f)`.
- `threat-matrix.ts:38,44` `Object.keys(TYPE_CHART) as PokemonType[]` — `TYPE_CHART` is `Record<PokemonType, …>`.
- `notification-preferences.ts:13` `Object.keys(prefs) as (keyof NotificationPrefs)[]`.
- `normalize-report.ts:13,18,49` — all three read through `??` defaults; tolerant by construction.
- **`src/lib/validation/champions-legality.ts` — 0 casts, 0 non-null assertions, explicit return types throughout. Nothing to report.** Same for `src/lib/analysis/analyze-team.ts`.
- **The SP/EV budget path is type-sound end to end.** `validateChampionsTeam` does `Object.values(p.evs).reduce(...)` and `Object.entries(p.evs)` — an extra key on `p.evs` would inflate the SP total and could flip a legal team to illegal. It cannot happen: `ParsedPokemon.evs` is always produced by `defaultEvs()` + `Object.assign(evs, parseStatLine(...))`, and `parseStatLine` (`showdown-parser.ts:21-38`) matches `/^(\d+)\s+(HP|Atk|Def|SpA|SpD|Spe)$/i` and writes only through `statMap` behind an `if (key)`. Share JSON carries `paste` as a *string* that is re-parsed, so deserialized data never becomes a `StatSpread` directly. **Verified, not assumed.**

---

## 3. Exported functions in `src/lib/` with no explicit return type (23)

None is an error today. They matter because each function's public shape is whatever inference
happens to produce, so a change *inside* the body silently changes the API.

**Domain-math path — fix these 7:**

| Site | Why it leaks |
|---|---|
| `analysis/damage-calculator.ts:34` `calculateReportDamage` | `survival` and `description` widen from string literals to `string`, so no consumer can switch on them exhaustively. Declare a `ReportDamage` interface. |
| `analysis/spread-builder.ts:40` `spreadStats` | Returns `@smogon/calc`'s `StatsTable` via `.rawStats` — **a third-party type is the public return type of a `src/lib` function.** Any `@smogon/calc` bump reshapes `SpreadBuilder.tsx` silently. Annotate `: StatSpread`. |
| `analysis/spread-builder.ts:9` `spreadRules` | `unit` widens to `string`; it is only ever `"SP"` or `"EVs"`. |
| `analysis/spread-builder.ts:69` `evaluateSpread` | Anonymous object embedding `calculateReportDamage`'s inferred return — two unannotated boundaries chained. |
| `analysis/spread-builder.ts:8` `spreadTotal` | Trivially `number`; annotate for consistency. |
| `analysis/threat-matrix.ts:31` `findCoverageGaps` | Relies on TS 5.5 **inferred type predicates** to strip `null` in `.filter(gap => gap !== null)` — a compiler-version-dependent public signature. |
| `analysis/threat-matrix.ts:43` `defensiveWeaknesses` | Annotate `{type: PokemonType; members: string[]}[]`. |

**Remaining 16 (I/O and glue, lower priority):** `collaboration-access.ts:5`,
`discord-bot.ts:60`, `email.ts:32/81/183/324`, `i18n/index.ts:47/97`,
`notifications.ts:10/32`, `posthog-server.ts:31`, `sharing/quick-share.ts:7/12/13`,
`web-push.ts:5/13`.

Related: `normalize-report.ts:78` `normalizeReportData(data: AnyRecord): AnyRecord` *is*
annotated — but to `Record<string, unknown>`. Type-honest, and the upstream reason RISK-1/RISK-3
exist: the share payload has no typed shape anywhere, so every consumer re-casts it.

---

## 4. Files the compiler never sees (13)

`"exclude": ["node_modules", "cypress"]` plus an `include` that lists `**/*.ts`, `**/*.tsx`,
`**/*.mts` — but **not** `**/*.mjs`:

- **9 × `cypress/**/*.ts`** (16 untyped params). A spec can reference a renamed export and CI stays green — `ci.yml` runs `typecheck`/`eslint`/`vitest`, and Cypress is not in the gate. Fix: `cypress/tsconfig.json` + its own `tsc --noEmit` step. **Effort S.**
- **4 × `scripts/*.mjs`** (17 untyped params), including **`scripts/build-dex-subset.mjs`** — the emitter whose positional tuple layout finding #8's double cast trusts. `allowJs: true` is already set, so adding `**/*.mjs` to `include` starts checking them. **Effort S** (expect some churn; it also pulls in `eslint.config.mjs` and `postcss.config.mjs`).

This is the single largest *coverage* gap in the audit and the only place implicit `any` exists.

---

## 5. Structural root cause: `PokemonType` is hand-duplicated 8 times

`PokemonType` is a hand-written union of 18 string literals (`src/lib/types/pokemon.ts`). Its
members are re-listed by hand in: the union itself; `data/type-chart.ts` (`TYPE_CHART` keys);
`data/type-chart.ts:220` (`allTypes`); `utils/type-colors.ts` (`TYPE_COLORS` keys);
`parser/showdown-parser.ts:3` (`POKEMON_TYPES`); and `ALL_TYPES` in
`DefensiveCoverageChart.tsx`, `OffensiveCoverageChart.tsx`, `CompareContent.tsx`.

Nothing derives from anything, so the compiler cannot check any of them against the others. This
is what made the (now fixed) `MissingNo.` crash possible, what keeps finding #7 alive, and what
RISK-4 would re-expose. **Fix:** `export const POKEMON_TYPES = [...] as const;` in
`types/pokemon.ts` and `export type PokemonType = typeof POKEMON_TYPES[number];`, then derive all
seven other lists from it. **Effort M**, and it retires findings #7, #10 and RISK-4 together.

---

## 6. tsconfig — strict-family flags

### Already ON

`strict: true` (⇒ `strictNullChecks`, `noImplicitAny`, `strictFunctionTypes`,
`strictBindCallApply`, `strictPropertyInitialization`, `useUnknownInCatchVariables`,
`alwaysStrict`, `noImplicitThis`), plus VGC-261's five: `noImplicitOverride`,
`noFallthroughCasesInSwitch`, `noUncheckedSideEffectImports`, `allowUnreachableCode: false`,
`allowUnusedLabels: false`. `noImplicitAny` being on is why the `any` count is 0.

### Currently OFF — estimated cost

Estimates are the 2026-10-26 **measured** counts (scratch config extending the repo tsconfig,
`incremental: false`, full program, baseline 0) scaled for program growth (src `.ts`/`.tsx`
380 → 409, +7.6%; `src/lib` non-test 131 → 94 files after the `__tests__` split), then
cross-checked against pattern counts in the current tree. Flagged where the *value* changed.

| Flag | Est. errors (total / non-test / `src/lib`) | Basis & cross-check | Real bugs it catches **today** | Recommend |
|---|---:|---|---|---|
| `noUncheckedIndexedAccess` | **~420 / ~310 / ~36** | Measured 394/288/33; scaled. Corroborated by pattern count: 268 numeric-literal + 489 variable index accesses in non-test `src`. Note most `src/lib` index reads are `sp[stat]` / `trimmed[stat]` on `Record<StatName, number>` with a key from the `StatName` union — **NUIA does not flag declared keys**, only index signatures and array/tuple access — so the `src/lib` figure stays ~35 even though `stat-calculator.ts` has 14 bracket reads. The `src/app` bill is dominated by the ~100 `rows[0]` DB reads of finding #14. | **~0.** Its headline catch last month was DANGEROUS-2 (`[types[0]]` fabricating a `[undefined]` tuple) — **fixed by hand since**. The two `pkmn-dex-fallback.ts` sites still error under the flag, but now as false positives needing a destructure-with-guard rewrite. Every other `src/lib` site I spot-checked (`showdown-parser.ts:71` `lines[0]`, `extract-species.ts:25`, `url-codec.ts:80` `bytes[i]`, `paste-edit.ts:64/97`, `diff-state.ts:117`) is already guarded or already uses `?.`/`??`. | **Yes, but as a staged project — not a flip.** Best long-term value, zero immediate payoff. |
| `exactOptionalPropertyTypes` | **~78 / ~77 / ~10** | Measured 74/73/9. 107 `?:` optional props in `src/lib` non-test; error shape is the benign `teamName?: string` ← `string \| undefined` (37 × TS2375, 18 × TS2379, 13 × TS2769 from React prop spreads). | **0** (measured: 0 real bugs). Concentrated in `conflict_risk: true` UI files. | **No.** Low ROI. Revisit after NUIA. |
| `noUnusedLocals` | **~21 / ~19 / ~3** | Measured 21/19/3; nothing in the diff since would move it much. | **Yes — real dead code.** Re-verified this run: **`url-codec.ts:77 toBase64Url`, the share-URL *encoder*, is unexported and has zero callers in `src/`** (the test file defines its own copy). Half the share codec is dead and nothing says so. Plus `data/tags.ts:33 EventType` (dead type), `discord-bot.ts:50 PRIORITY_LABELS`, 3 dead `*_I18N` maps in `ExploreFilters.tsx`, 2 dead `UserButton` imports. | **YES.** |
| `noUnusedParameters` | **~5 / ~5 / 0** | Measured 5/5/0. | 5 unused props/params; two are **declared component props nothing reads** (dead API surface). | **YES** — pair with the above. |
| `noPropertyAccessFromIndexSignature` | **~700 / ~680 / ~100** | Measured 681/659/100. | 0. Forces `row.foo` → `row["foo"]` across the DB layer; makes finding #14 *harder* to read. | **No.** |
| `verbatimModuleSyntax` | **0 / 0 / 0** | Measured 0, and `isolatedModules` is already on. | 0. | **Defer** — the `tsconfig.json` comment is right: it changes import-elision *emit*, not just diagnostics, so it needs its own commit behind a real `next build`. |

### Recommendation: `noUnusedLocals` (+ `noUnusedParameters` in the same commit)

**Cost: ~19 non-test / ~21 total fixes, almost all one-line deletions. Effort S for the pair (~24 fixes).**

This is the only flag that can actually be *flipped in `tsconfig.json` next*. It pays for itself
immediately: it is what surfaced that the share-URL encoder is dead code, and it is the kind of
finding that compounds with C1's dead-code pass.

`noUncheckedIndexedAccess` remains the highest-value flag in the long run — it is the only one
that catches nullish bugs at all — but it **cannot be enabled next.** At ~310 non-test errors it
is a multi-week refactor, and its single proven catch was already fixed by hand, so flipping it
today buys defence-in-depth rather than a bug. Stage it instead:

1. **`src/lib/` only (~36 errors)** — the domain maths, behind a `src/lib/tsconfig.json` or a lint rule. Hot files: `showdown-parser.ts` (~8), `paste-edit.ts` (~7), `random-accent.ts` (~6, trivial), `stat-calculator.ts` (~3), `pkmn-dex-fallback.ts` (2), `extract-species.ts` (2).
2. **Refactor the DB row boundary** (finding #14) — removes most of the ~170 `src/app/api/**` errors as a side effect.
3. **Components/hooks (~90)**, once those files leave the conflict-risk list.
4. **Tests (~110)**, mostly `result.pokemon[0]!` in assertions; mechanical.
5. Then flip it in `tsconfig.json`.

Independently of any flag: **add `**/*.mjs` to `include` and give `cypress/` its own tsconfig**
(§4). That is 13 files and all 33 implicit `any`s in the repo, and it is the only change that
makes finding #8's double cast actually checked.

---

## 7. Suggested ticket split

| Priority | Scope | Files | Effort |
|---|---|---|---|
| **P1 (bug)** | RISK-1 + RISK-2: pin `ShareableStateSchema` to `ShareableState`, tighten `CalcEntrySchema`, unify the two `migrateCalcEntries` copies. Add a regression test naming the `calcs: [null]` share-URL crash. | `url-codec.ts`, `url-codec.schemas.ts`, `useShareUrl.ts`, `normalize-report.ts`, `useDamageCalcs.ts` | M |
| **P1 (privacy)** | RISK-3: `Array.isArray` guard in `normalizePrivateFields`; drop both casts. Test a non-array `privateFields`. | `redact-paste.ts`, `api/share/[id]/route.ts`, `team-graphic-image.tsx` | XS |
| **P2** | RISK-4: make `asPokemonTypes` the one real narrow (or delete it) and have `pkmn-dex-fallback.ts` import it. | `dex-subset.ts`, `pkmn-dex-fallback.ts` | XS |
| **P2** | Flip `noUnusedLocals` + `noUnusedParameters`; delete the dead share-URL encoder and the other ~23 finds. | `tsconfig.json` + ~20 files | S |
| **P2** | Add `**/*.mjs` to `include`; add `cypress/tsconfig.json` and a CI step. | `tsconfig.json`, `ci.yml`, 13 files | S |
| **P3** | RISK-5 (`diff-state.ts` element validation), RISK-6 (`cacheGet` schemas at typed call sites). | `diff-state.ts`, `cache.ts`, `api/champions/meta/route.ts` | S |
| **P3** | §5: derive `PokemonType` from one `as const` array; retires #7, #10 and RISK-4 structurally. | `types/pokemon.ts` + 7 call sites | M |
| **P3** | §3: explicit return types on the 7 domain-math exports. | `analysis/` | S |
| **P4** | Finding #14: typed row reader for the Neon boundary (~290 casts → ~40). Prerequisite for the NUIA rollout. | `src/app/api/**` | L |

### Conflict-risk note

Every `src/lib` file carrying a RISK finding is **conflict-free** against
`.swarm/main-changed-files.md`: `url-codec.ts`, `url-codec.schemas.ts`, `normalize-report.ts`,
`redact-paste.ts`, `dex-subset.ts`, `pkmn-dex-fallback.ts`, `cache.ts`, `diff-state.ts`,
`type-chart.ts`, `paste-edit.ts`, `stat-calculator.ts`, `showdown-parser.ts`,
`champions-legality.ts`, plus `hooks/useShareUrl.ts` and `api/champions/meta/route.ts`.
The `conflict_risk: true` files appear only in §2.1 (non-null assertion cleanups —
`SpreadBuilder.tsx`, `SpeedTierChart.tsx`, `TeamStats.tsx`, `MatchupPlanSlide.tsx`,
`PokemonDropdown.tsx`, `ReportCard.tsx`, `HomePageClient.tsx`) and in finding #13
(`CommonModesSlide.tsx`), none of which is urgent. **All P1/P2 work can proceed without
touching a conflicted file.**
