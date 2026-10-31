# C2 — TypeScript strictness audit

- **Branch:** `swarm-nightly-2026-10-26` (cut from `origin/main` @ 68796c5)
- **Date:** 2026-10-26
- **TypeScript:** 5.9.3 · **Program size:** 380 `.ts`/`.tsx` under `src/` (131 in `src/lib/`)
- **Mode:** read-only. No source edits, no commits. Only write is this file.
- **Baseline gate (cold):** `node node_modules/typescript/bin/tsc --noEmit --incremental false` → **exit 0, 0 errors**. Reproduced through the scratch config harness (also 0), so every flag count below is measured against a genuinely clean baseline.

Flag measurements were taken with throwaway configs that `extends` the repo `tsconfig.json`
from outside the repo (so `include`/`paths` still resolve against the repo root) with
`incremental: false` forced. The repo's `tsconfig.json` was never modified. The scratch
configs have been deleted.

---

## 0. Headline

The repo is in unusually good shape for this axis. **There is not one single `any` in the
entire program** — not `: any`, not `as any`, not `any[]`, not `Record<string, any>`, not a
generic defaulting to `any`, in `src/`, `cypress/`, tests or `.d.ts` files. `strict: true`
is on, and VGC-261 already pulled in five non-`strict` flags (`noImplicitOverride`,
`noFallthroughCasesInSwitch`, `noUncheckedSideEffectImports`, `allowUnreachableCode: false`,
`allowUnusedLabels: false`).

The domain-math core is the best part of the codebase:
`src/lib/validation/champions-legality.ts` and `src/lib/analysis/analyze-team.ts` contain
**zero** casts, zero non-null assertions, and explicit return types.
`src/lib/analysis/stat-calculator.ts` is almost as clean.

So the unsoundness that remains is not sloppiness — it is **three structural holes** where
untrusted or third-party data crosses into the typed domain and the type system is told to
stop asking:

1. `@pkmn/dex` species data → `PokemonType` (`as PokemonType[]`, no validation) — **this one
   is a reachable production crash today**, see DANGEROUS-1.
2. Postgres rows → domain field types (184 × `as string`, 38 × `as Date`, 44 ×
   `as Record<string, unknown>`), because the Neon tagged template is untyped.
3. Redis / share-API payloads → domain state (`cacheGet<T>`'s unchecked `raw as T`,
   `state as ShareableState`), i.e. the validation that VGC-146 added was never adopted on
   every path.

Plus one *latent* hole: `PokemonType` and its 18 members are **hand-duplicated in 8 places**
with nothing deriving from a single source, which is what makes hole (1) possible at all.

---

## 1. Counts by category

| Category | Count | Where |
|---|---|---|
| **`any` — explicit `: any`** | **0** | — |
| **`any` — `as any`** | **0** | — |
| **`any` — `any[]` / `Array<any>` / `Record<string, any>`** | **0** | — |
| **`any` — generic parameter defaulting to `any`** | **0** | no `<T = …>` anywhere |
| **`any` — total, whole repo incl. tests + cypress** | **0** | AST scan for `SyntaxKind.AnyKeyword` |
| Unconstrained exported generic (`<T>` with no bound) | 1 | `src/lib/cache.ts:29` `cacheGet<T>` |
| Type assertions (`as X`, excluding `as const`) — production | **440** | 90 more in tests |
| ↳ of which DB-row / third-party boundary (`as string`/`Date`/`number`/`Record<string, unknown>`/row types) | ~290 | almost all in `src/app/api/**` |
| ↳ of which **domain-type narrowing** (`as PokemonType`, `as StatSpread`, `as ShareableState`, …) | **34** | listed in §4 |
| ↳ of which double casts (`as unknown as T`) — production | **5** | §4.3 |
| Non-null assertions (`!`) — production | **30** | 31 more in tests |
| ↳ **DANGEROUS** (value can actually be null/undefined) | **0** | every one is provable; see §5 |
| Exported functions in `src/lib/` with **no explicit return type** | **23** | §3 |
| ↳ in the domain-math path (`analysis/`) | **7** | `damage-calculator`, `spread-builder` ×4, `threat-matrix` ×2 |
| Files never type-checked at all (outside `include`) | **13** | 9 `cypress/**/*.ts`, 4 `scripts/*.mjs` — §7 |

---

## 2. Ranked DANGEROUS list

### DANGEROUS-1 — `as PokemonType[]` lets a non-`PokemonType` through the dex fallback and crashes the report render
`conflict_risk: false` (cast site) / **`conflict_risk: true` (crash site `TypeBadge.tsx`)**

```
src/lib/data/pkmn-dex-fallback.ts:82    const types = entry.types as PokemonType[];
src/lib/data/pkmn-dex-fallback.ts:138   const megaTypes = entry.types as PokemonType[];
src/lib/data/dex-subset.ts:222          return types as PokemonType[];      // exported `asPokemonTypes`
src/components/compare/CompareContent.tsx:211   <TypeBadge type={t as PokemonType} />
```

`DexSubsetSpecies.types` is honestly declared `string[]` — the comment on
`dex-subset.ts:45` even says *"Types as strings — narrowed to PokemonType at the consumer
boundary."* But the "narrowing" is an unchecked assertion, not a check. This is **provably
violated by the data already committed to the repo**:

```
$ node -e '…dex-subset.json…'
TYPES: Bird,Bug,Dark,Dragon,…      ← "Bird" is not a member of PokemonType
row: ["MissingNo.","Bird|Normal",[33,136,0,6,6,29],"",0,0,4]
```

Full reachable path:

1. `"missingno"` is **not** in `POKEMON_DATA` (`grep -c missingno src/lib/data/pokemon.ts` → 0),
   so `lookupPokemon()` falls through to `lookupPokemonFromDex()` (`pokemon.ts:3437`).
2. `getSpecies("MissingNo.")` hits (`toId` → `missingno`).
3. The zero-stat guard at `pkmn-dex-fallback.ts:74` is `baseStats.hp === 0 && baseStats.atk === 0`
   — MissingNo. is hp 33 / atk 136, so **it passes**.
4. `entry.types as PokemonType[]` → `["Bird", "Normal"]`, now typed `PokemonType[]`, built
   into `PokemonData["types"]` and handed to the UI as `displayTypes`.
5. `PokemonCard.tsx:336` → `<TypeBadge type={type} />` → `TypeBadge.tsx:10-18`:
   ```ts
   const colors = TYPE_COLORS[type];   // TYPE_COLORS has no "Bird" key → undefined
   …style={{ backgroundColor: colors.bg, …}}   // TypeError: reading 'bg' of undefined
   ```
   `TYPE_COLORS` is a `Record<PokemonType, …>` with exactly 18 keys and **no `Bird`**
   (`grep -c '"*Bird"*:' src/lib/utils/type-colors.ts` → 0). There is no `??` fallback.

**Repro:** paste any team containing a line `MissingNo. @ Leftovers`. The report slide
throws during render and hits the error boundary.

`getDefensiveProfile` happens to survive it (`getEffectiveness` has `?? 1`, so "Bird" is
silently treated as neutral — wrong, but not fatal). `TypeBadge` does not.

**Fix (two parts, both needed):**
1. Make the narrow real. Replace the cast in `dex-subset.ts:222` with a filter against the
   canonical list and use it at both `pkmn-dex-fallback.ts` sites:
   ```ts
   export function asPokemonTypes(types: string[]): PokemonType[] {
     return types.filter((t): t is PokemonType => (POKEMON_TYPES as readonly string[]).includes(t));
   }
   ```
   (`asPokemonTypes` is currently exported and **called by nothing** — it was clearly meant
   to be this boundary. Wire it up.)
2. Make `TypeBadge` total, since it is the last line of defence:
   `const colors = TYPE_COLORS[type] ?? TYPE_COLORS.Normal;` — or return `null` for an
   unknown type.

Note that fix (1) alone makes `types.length` possibly 0, which is exactly what
`noUncheckedIndexedAccess` already flags on the next two lines (see DANGEROUS-2) — fix them
together.

---

### DANGEROUS-2 — `types[0]` on a possibly-empty array, typed as if it were always present
`conflict_risk: false`

```
src/lib/data/pkmn-dex-fallback.ts:83-85
  const typesTuple: PokemonData["types"] = types.length >= 2 ? [types[0], types[1]] : [types[0]];
src/lib/data/pkmn-dex-fallback.ts:139-141
  const megaTypesTuple: MegaPokemonEntry["types"] = megaTypes.length >= 2 ? [megaTypes[0], megaTypes[1]] : [megaTypes[0]];
```

`splitList()` in `dex-subset.ts:106` **deliberately** returns `[]` for an empty field — its
own comment says `""` must not produce "a phantom empty ability/type". So the zero-length
case is a modelled possibility, and `[types[0]]` then produces `[undefined]` typed as
`[PokemonType]`. That `undefined` flows into `getDefensiveProfile`, `TypeBadge`, STAB
calculation and the type-coverage charts. Only `types.length >= 2` and `=== 1` are handled;
`=== 0` falls into the `else`.

`noUncheckedIndexedAccess` reports exactly this, with no false positive:
```
src/lib/data/pkmn-dex-fallback.ts(83,9): TS2322: Type '[PokemonType | undefined, PokemonType | undefined] | [PokemonType | undefined]' is not assignable to type '[PokemonType] | [PokemonType, PokemonType]'.
src/lib/data/pkmn-dex-fallback.ts(139,9): TS2322: Type '(PokemonType | undefined)[]' is not assignable to type 'PokemonType[]'.
```

Today no shipped row has empty types (checked: 0/1515), so this is latent — but it becomes
live the moment fix (1) of DANGEROUS-1 lands, because filtering `["Bird"]`-only species
yields `[]`.

**Fix:** handle the empty case explicitly and bail, rather than fabricating a tuple:
```ts
const [t0, t1] = asPokemonTypes(entry.types);
if (!t0) { pokemonCache.set(key, null); return null; }   // no usable typing ⇒ treat as a miss
const typesTuple: PokemonData["types"] = t1 ? [t0, t1] : [t0];
```

---

### DANGEROUS-3 — `cacheGet<T>`'s `raw as T`: unvalidated Redis payload becomes a domain type
`conflict_risk: false`

```
src/lib/cache.ts:35          if (!schema) return raw as T;
src/app/api/champions/meta/route.ts:31   const cached = await cacheGet<ChampionsMetaResult>(CACHE_KEY);
src/app/api/user/export/route.ts:15      const lastExport = await cacheGet<string>(rateKey);
```

`cacheGet` is the repo's only unconstrained exported generic, and its no-schema branch is a
pure unchecked cast — the docstring is admirably honest about it ("the generic is just an
unchecked cast (VGC-146)"). The problem is that the schema parameter that VGC-146 added to
fix this was never adopted: **5 of 6 call sites pass no schema.** Two of them are harmless
(`<unknown>`, `<{spotlight: unknown}>`), but `cacheGet<ChampionsMetaResult>` hands a stale
Redis blob to the Champions meta API typed as a valid result. After any shape change to
`ChampionsMetaResult` the cache serves the old shape for a full TTL, with no error — the
endpoint returns structurally wrong meta data and TS is satisfied.

**Fix:** pass a schema at the typed call sites, i.e.
`cacheGet(CACHE_KEY, ChampionsMetaResultSchema)`. Longer-term, constrain the API so the
unchecked path cannot be reached by accident: make `schema` required for anything other
than `cacheGet<unknown>`, e.g. a separate `cacheGetUnchecked<T>()` that is grep-able.

---

### DANGEROUS-4 — share payload from the API is cast to `ShareableState` with zero validation, while the URL path validates
`conflict_risk: false`

```
src/hooks/useShareUrl.ts:224   versionRef.current = Number(_v) || 1; baselineRef.current = state as ShareableState;
src/hooks/useShareUrl.ts:232   settle(state as ShareableState, editable);
```
`state` is the rest-spread of an untyped `await r.json()`. Nothing checks it.

The asymmetry is the bug shape. The **URL** decode path was hardened in VGC-146 and does run
`ShareableStateSchema.safeParse` and fail closed (`url-codec.ts:135-140`). The **API** path
— which is how every `/s/{id}` view loads — does not. Both end up in the same report viewer
and the same editor state. So the mitigation exists, is already imported on the client, and
is simply not applied on the hotter of the two routes.

**Fix:** run the same `ShareableStateSchema.safeParse` on the API payload before `settle()`,
and `settle(null)` on mismatch — identical failure mode to a malformed share URL.

Related, same file, same pattern, lower blast radius:
`useShareUrl.ts:217` `data._forkedFrom as ForkedFromMeta | null`,
`:218` `data._redactedFields as string[]`, `:219` `data._editToken as string | undefined`,
`:225` `_c as string[]`.

---

### DANGEROUS-5 — the redundant cast after `safeParse` hides schema/type drift
`conflict_risk: false`

```
src/lib/sharing/url-codec.ts:140   return result2.data as ShareableState;
```

`result2.data` is already `z.infer<typeof ShareableStateSchema>`. The cast is therefore
either a no-op or a lie — and it is specifically the lie that matters: it is the only thing
standing between `ShareableStateSchema` and the `ShareableState` interface, and it silences
the error you *want* when the two drift apart. Given that `CalcEntrySchema` is
`z.unknown()` and the schema file explicitly says it keeps itself "decoupled from
rapidly-evolving damage-calc shapes", drift is the expected state of the world here, not a
hypothetical.

**Fix:** delete the cast and pin the schema to the type instead, so the compiler proves the
relationship once:
```ts
export const ShareableStateSchema: z.ZodType<ShareableState> = z.object({ … });
```
Then `return result2.data;` type-checks on its own, and any future schema loosening is a
compile error in one place rather than silent at every consumer.

---

### Honourable mentions (unsound, not currently exploitable)

| # | Site | Why unsound | Fix |
|---|---|---|---|
| 6 | `src/lib/utils/paste-edit.ts:107` `labels[stat as keyof typeof labels]` | `Object.entries(spread)` gives `[string, number][]`; the cast asserts an unenumerated runtime key is one of 6 known keys. An extra key on a deserialized `StatSpread` writes `EVs: 5 undefined` straight into the user's paste. | Iterate a `StatName[]` constant instead of `Object.entries`. |
| 7 | `src/lib/data/type-chart.ts:225` `{} as Record<PokemonType, number>`<br>`src/components/report/OffensiveCoverageChart.tsx:71` `{} as Record<PokemonType, MoveCoverageResult>` (`conflict_risk: true`) | The empty-object cast claims all 18 keys exist, then relies on a **hand-duplicated** `allTypes`/`ALL_TYPES` literal to fill them. Add a member to `PokemonType` without touching the literal and every read of the new key is `undefined` typed `number` → `NaN` multipliers. | Build from the canonical list: `Object.fromEntries(POKEMON_TYPES.map(t => [t, f(t)])) as Record<PokemonType, number>` — still a cast, but now provably total because the key source *is* the union source (see §6). |
| 8 | `src/lib/utils/diff-state.ts:102` `value as SerializedMatchupPlan[]` | Any array becomes `SerializedMatchupPlan[]`. This feeds version diffing, which decides whether to write a `share_versions` row — the exact table that consumed 447 MB of the 512 MB Neon tier in July 2026. A wrong diff is a storage incident, not just a wrong render. | Validate per element, or compare on `unknown` with explicit field reads. |
| 9 | `src/lib/data/dex-subset.ts:105` `rawSubset as unknown as PackedDexSubset` | Double cast over a 127 KB JSON artifact. Mitigated by the `schemaVersion` check in `ensureSchema()`, and the producer is pinned by a hash test — but the producer itself (`scripts/build-dex-subset.mjs`) is **never type-checked** (§7), so the only thing tying the two tuple layouts together is a hand-bumped integer. | Keep the cast (a per-row parse of 1515 species on the client is not worth it), but type-check `scripts/*.mjs` so the emitter and `PackedSpecies` are checked against each other. |
| 10 | `src/lib/parser/showdown-parser.ts:114` `POKEMON_TYPES.includes(tt as PokemonType)` | The cast exists only to satisfy `includes`, and it is on the *argument of the guard* — so the guard is written in terms of the assertion it is supposed to justify. Correct today, but the idiom is the one that produced DANGEROUS-1. | `(POKEMON_TYPES as readonly string[]).includes(tt)`, or a `isPokemonType(tt): tt is PokemonType` predicate reused everywhere. |

### Explicitly assessed and found SOUND

- `src/lib/analysis/stat-calculator.ts:58, 74` `result as StatSpread` — `Partial<StatSpread>`
  accumulator filled over all 6 `StatName`s in the line above. LAZY, not dangerous.
  (Cleanest fix: return the object literal directly rather than accumulating.)
- `src/lib/parser/showdown-parser.ts:80` `genderMatch[1] as "M" | "F"` — regex is
  `/\s+\(([MF])\)\s*$/`; group 1 cannot be anything else.
- `src/lib/sharing/redact-paste.ts:30` `f as PrivateField` — guarded by
  `VALID_FIELDS.has(f)`.
- `src/hooks/useTheme.ts:130` `stored as GenTheme` — guarded by `stored in GEN_PRESETS`.
  `conflict_risk: true`.
- `src/lib/analysis/threat-matrix.ts:38, 44` `Object.keys(TYPE_CHART) as PokemonType[]` —
  `TYPE_CHART` is `Record<PokemonType, …>`; keys are exactly the union.
- `src/lib/validation/champions-legality.ts`, `src/lib/analysis/analyze-team.ts` — no casts,
  no assertions, explicit return types. Nothing to report.

---

## 3. Missing explicit return types on exported functions in `src/lib/` (23)

None of these are errors today. They matter because the public shape of each is whatever
inference happens to produce, so a change *inside* the function silently changes the API —
which is the failure mode the task is about.

**Domain-math path — fix these (7):**

| Site | Inferred return | Why it leaks |
|---|---|---|
| `src/lib/analysis/damage-calculator.ts:34` `calculateReportDamage` | `{min: number; max: number; hp: number; minPercent: number; maxPercent: number; description: string; survival: string}` | `survival` widens from three literals to `string`, so no consumer can switch on it exhaustively. `description` likewise. Declare a `ReportDamage` interface with `survival: "Survives every damage roll from full HP" \| "Guaranteed KO from full HP" \| "A KO is possible from full HP"`. |
| `src/lib/analysis/spread-builder.ts:9` `spreadRules` | `{max: number; total: number; step: number; unit: string}` | `unit` widens to `string`; it is only ever `"SP"` or `"EVs"`. Declare `SpreadRules` with `unit: "SP" \| "EVs"`. |
| `src/lib/analysis/spread-builder.ts:15` `spreadStats` | `@smogon/calc`'s `StatsTable` (via `.rawStats`) | A **third-party type is the public return type of a `src/lib` function**. Any `@smogon/calc` bump silently reshapes it for `SpreadBuilder.tsx`. Annotate `: StatSpread`. |
| `src/lib/analysis/spread-builder.ts:44` `evaluateSpread` | anonymous object embedding `calculateReportDamage`'s inferred return | Two unannotated boundaries chained. Annotate both. |
| `src/lib/analysis/spread-builder.ts:8` `spreadTotal` | `number` | Trivial; annotate for consistency. |
| `src/lib/analysis/threat-matrix.ts:31` `findCoverageGaps` | `{species: string; types: PokemonType[]}[]` | Relies on TS 5.5 **inferred type predicates** to strip `null` from `.filter(gap => gap !== null)`. That is a compiler-version-dependent public signature. Annotate. |
| `src/lib/analysis/threat-matrix.ts:43` `defensiveWeaknesses` | `{type: PokemonType; members: string[]}[]` | Annotate. |

**Rest (16, lower priority — I/O and glue, not maths):**
`collaboration-access.ts:5`, `discord-bot.ts:60`, `email.ts:32/79/181/321`,
`i18n/index.ts:47 (I18nProvider)`, `i18n/index.ts:97 (useTranslation)`,
`notifications.ts:10/32`, `posthog-server.ts:31`,
`sharing/quick-share.ts:7/12/13`, `web-push.ts:5/13`.

Also worth noting: `src/lib/utils/normalize-report.ts:76`
`normalizeReportData(data: AnyRecord): AnyRecord` *is* annotated, but to
`Record<string, unknown>` — so the share payload has no typed shape anywhere in the
codebase and every consumer re-casts it. Type-honest (it is `unknown`, not `any`), but it
is the upstream reason §2's DANGEROUS-4 casts exist.

---

## 4. Unsafe casts — full domain inventory

### 4.1 `src/lib/` (14)
| Site | Cast | Verdict |
|---|---|---|
| `data/pkmn-dex-fallback.ts:82` | `entry.types as PokemonType[]` | **DANGEROUS-1** |
| `data/pkmn-dex-fallback.ts:138` | `entry.types as PokemonType[]` | **DANGEROUS-1** |
| `data/dex-subset.ts:222` | `types as PokemonType[]` | **DANGEROUS-1** (and dead export) |
| `data/pkmn-dex-fallback.ts:73` | `entry.baseStats as StatSpread` | LAZY — `DexSubsetSpecies.baseStats` is already structurally `StatSpread`; the cast is a no-op that also makes the `!baseStats` guard on the next line unreachable to the reader. Delete it. |
| `cache.ts:35` | `raw as T` | **DANGEROUS-3** |
| `sharing/url-codec.ts:140` | `result2.data as ShareableState` | **DANGEROUS-5** |
| `utils/paste-edit.ts:107` | `labels[stat as keyof typeof labels]` | #6 |
| `data/type-chart.ts:225` | `{} as Record<PokemonType, number>` | #7 |
| `data/dex-subset.ts:105` | `rawSubset as unknown as PackedDexSubset` | #9 |
| `utils/diff-state.ts:102` | `value as SerializedMatchupPlan[]` | #8 |
| `parser/showdown-parser.ts:114/115` | `tt as PokemonType` | #10 |
| `parser/showdown-parser.ts:80` | `genderMatch[1] as "M" | "F"` | SOUND |
| `sharing/redact-paste.ts:30` | `f as PrivateField` | SOUND |
| `analysis/stat-calculator.ts:58/74` | `result as StatSpread` | SOUND (LAZY) |
| `analysis/threat-matrix.ts:38/44` | `Object.keys(TYPE_CHART) as PokemonType[]` | SOUND |
| `utils/normalize-report.ts:13/18/49` | `as AnyRecord`, `as {text?, category?}`, `as {lead?, back?}` | LAZY — all three read through `??` defaults; tolerant by construction. |
| `i18n/index.ts:53/80/84/86` | `as LanguageCode \| null`, `as unknown as Record<string,string>`, `as TranslationKeys` | LAZY — the `Proxy` fallback makes a missing key return the English string, so a bad `LanguageCode` degrades rather than breaks. |
| `notification-preferences.ts:13/14` | `Object.keys(prefs) as (keyof NotificationPrefs)[]` | SOUND |
| `web-push.ts:22/25`, `notifications.ts:51`, `cache.ts:103` | `row.x as string`, `result[1] as string[]` | DB/Redis boundary — see §4.2 |

### 4.2 The DB-row boundary (~290 casts, systemic)
`getDb()` returns `NeonQueryFunction<false, false>`, whose rows are
`Record<string, unknown>`, so **every** field read is a hand-written assertion. Densest:

```
19 × src/app/api/explore/            18 × src/app/s/[id]/
18 × src/app/api/creator/[name]/      8 × src/app/champions/[pokemon]/
 7 × src/app/api/share/[id]/          7 × src/app/api/user/analytics/
```
plus 38 × `as Date` and 44 × `as Record<string, unknown>` in the same routes.

Not individually dangerous — each is a developer reading their own `SELECT` — but there are
~290 of them and a column rename or an `integer`→`bigint` migration (Postgres returns
`bigint` as a *string* over the wire) is caught nowhere. **Recommended fix:** a small
generic row reader per table, or one `rows<T>(sql, schema)` helper that zod-parses once at
the query site, so the assertion count drops from ~290 to ~40 (one per query). Out of scope
for a type-flag change; worth its own ticket.

### 4.3 Double casts `as unknown as T` (5 in production)
| Site | Verdict |
|---|---|
| `src/lib/data/dex-subset.ts:105` | #9 — mitigated by `schemaVersion`, unchecked producer |
| `src/lib/i18n/index.ts:84` | LAZY — `en` → `Record<string, string>` for the Proxy fallback; degrades safely |
| `src/components/report/CommonModesSlide.tsx:108` (`conflict_risk: true`) | LAZY — same i18n idiom |
| `src/hooks/useSlideSystem.ts:56` | LAZY — same i18n idiom |
| `src/app/api/webhooks/clerk/route.ts:46` | `event.data as unknown as ClerkUserCreatedData` — **GENUINELY_UNAVOIDABLE**-ish: Clerk's `WebhookEvent` union is wider than the handled case. Prefer narrowing on `event.type` first, then a single cast. |

The i18n triple (`CommonModesSlide`, `useSlideSystem`, `i18n/index.ts`) is the same
workaround written three times to read a key the `TranslationKeys` type does not declare.
Adding the key to `TranslationKeys` removes all three.

---

## 5. Non-null assertions (30 in production) — none DANGEROUS

Every one was traced to its guard. **All 30 are provable at runtime**; the compiler just
cannot see the proof. Reported for completeness and because several are worth rewriting into
a form the compiler *can* check.

| Site | Guard that makes it safe | conflict_risk |
|---|---|---|
| `src/components/report/SpreadBuilder.tsx:52` ×6, `:53` ×2 | `outcome` is a union of two object literals; `{outcome.stats && …}` narrows `stats` but not sibling `before`/`wasted`, which are set in the same return. **Worst-smelling of the set — 8 assertions on 2 lines.** Fix: add a discriminant (`ok: true`/`ok: false`) or branch on `outcome.error` first. | true |
| `src/components/report/PokemonDropdown.tsx:54/59/83/94` | all inside `selected ? … : …`, and `selected` is non-null only when `selectedIndex !== null`. Note `selected` is *typed* `AnalyzedPokemon \| null` but can be `undefined` at runtime (`yourPokemon[selectedIndex]` out of range) — the truthiness check covers it, the type does not. | true |
| `src/components/report/TeamStats.tsx:32` `p.data!` | `.filter(p => p.data?.baseStats)` — filter doesn't narrow. Fix: `flatMap(p => p.data ? [sum(p.data.baseStats)] : [])`. | true |
| `src/components/report/SpeedTierChart.tsx:21` | `if (!map.has(k)) map.set(k, [])` immediately above. Fix: `const list = map.get(k) ?? (…)`. | true |
| `src/components/report/SpeedTierChart.tsx:185` `mon.itemBoost!` | `hasSpeedBoost = mon.itemBoost?.stat === "spe"` — a boolean doesn't narrow. Fix: inline the optional chain: `mon.itemBoost?.stat === "spe" ? mon.itemBoost.multiplier : 1`. | true |
| `src/components/report/MatchupPlanSlide.tsx:277` | guarded by `mon.hasEvs && mon.calculatedStats` | true |
| `src/components/explore/ReportCard.tsx:297` `report.tags!` | guarded by `hasTagsSection = !!report.tags?.eventType`. Fix: just use `report.tags?.eventType`. | true |
| `src/components/home/HomePageClient.tsx:1158/1229` `analysis!` | true |
| `src/lib/analysis/stat-calculator.ts:201` `groups.get(key)!` | key came from `[...groups.keys()]` | false |
| `src/lib/rate-limit.ts:24` `redis!` | only called under `if (redis)` at `:72` | false |
| `src/lib/sharing/collaboration.ts:33` `char.codePointAt(0)!` | `for…of` over a string yields non-empty code points | false |
| `src/lib/db.ts:4` `process.env.DATABASE_URL!` | env contract; `neon()` throws anyway. Minor: an explicit throw gives a better message. | false |
| `src/app/api/cron/weekly-report/route.ts:22` `apiKey!` | `if (!apiKey \|\| !teamId) return` at `:13` | false |
| remainder (`dashboard/profile:283`, `FeedbackContent:111`, `Navbar:962`, `BrowserPushSettings:61`, `LanguageSelector:12`, `ReportCard:237`) | all guarded or `.find()` over a closed literal list | mixed |

---

## 6. The structural root cause: `PokemonType` is duplicated 8 times

`PokemonType` is a hand-written union of 18 string literals
(`src/lib/types/pokemon.ts:1-4`). Its 18 members are then **re-listed by hand** in:

| # | Location |
|---|---|
| 1 | `src/lib/types/pokemon.ts:1` — the union itself |
| 2 | `src/lib/data/type-chart.ts:6` — `TYPE_CHART` keys |
| 3 | `src/lib/data/type-chart.ts:220` — `allTypes` inside `getDefensiveProfile` |
| 4 | `src/lib/utils/type-colors.ts:3` — `TYPE_COLORS` keys · `conflict_risk: true` |
| 5 | `src/lib/parser/showdown-parser.ts:3` — `POKEMON_TYPES` (module-private) |
| 6 | `src/components/report/DefensiveCoverageChart.tsx:10` — `ALL_TYPES` · `conflict_risk: true` |
| 7 | `src/components/report/OffensiveCoverageChart.tsx:13` — `ALL_TYPES` · `conflict_risk: true` |
| 8 | `src/components/compare/CompareContent.tsx:104` — `ALL_TYPES` · `conflict_risk: true` |

Nothing derives from anything else, so the compiler cannot check any of them against the
union, and `{} as Record<PokemonType, …>` + a stale local list is a silent `undefined`.
Both the crash in DANGEROUS-1 and finding #7 are downstream of this.

**Fix (one small, high-leverage change):**
```ts
// src/lib/types/pokemon.ts
export const POKEMON_TYPES = [
  "Normal", "Fire", "Water", "Electric", "Grass", "Ice",
  "Fighting", "Poison", "Ground", "Flying", "Psychic", "Bug",
  "Rock", "Ghost", "Dragon", "Dark", "Steel", "Fairy",
] as const;
export type PokemonType = (typeof POKEMON_TYPES)[number];
export function isPokemonType(v: string): v is PokemonType {
  return (POKEMON_TYPES as readonly string[]).includes(v);
}
```
Then replace sites 3 and 5–8 with an import of `POKEMON_TYPES`, and keep 2 and 4 as
`Record<PokemonType, …>` literals (the compiler already checks those for exhaustiveness).
After that, adding a type (Stellar, or whatever Champions ships) is a compile error in the
two places that must change, instead of a silent `undefined` in six.

Worth noting the same single-source-of-truth discipline is *already applied* elsewhere in
this repo and documented as a past bug fix — `CHAMPIONS_DEX` derives its Mega entries from
`CHAMPIONS_REG_MA_MEGAS` "so divergence is impossible by construction" (changelog, May
2026). `PokemonType` is the one that never got the treatment.

---

## 7. Files the tsconfig never type-checks

`"exclude": ["node_modules", "cypress"]` plus an `include` that lists `**/*.ts`, `**/*.tsx`
and `**/*.mts` — but **not** `**/*.mjs` — means 13 files are outside the program entirely:

- **9 × `cypress/**/*.ts`** — the whole E2E suite. (It has 0 `any`, so nothing is being
  hidden *today*; but a Cypress spec can reference a renamed export and CI stays green,
  because `.github/workflows/ci.yml` runs `tsc`/`eslint`/`vitest` and Cypress is not in
  the gate.) Fix: a separate `cypress/tsconfig.json` with its own `tsc --noEmit` step.
- **4 × `scripts/*.mjs`** — including **`scripts/build-dex-subset.mjs`**, the emitter whose
  positional tuple layout `PackedSpecies`/`PackedDexSubset` must match exactly, and which
  finding #9's double cast trusts. `allowJs: true` is already set, so adding `**/*.mjs` to
  `include` would start checking them (expect some churn; measure first).

---

## 8. tsconfig flag table — measured error counts

Each row is a real cold run: scratch config extending the repo tsconfig, `incremental: false`,
one flag changed, full program. Baseline = 0 errors.

### Already ON

| Flag | State | Why it's on |
|---|---|---|
| `strict` | **ON** | Implies `strictNullChecks`, `noImplicitAny`, `strictFunctionTypes`, `strictBindCallApply`, `strictPropertyInitialization`, `useUnknownInCatchVariables`, `alwaysStrict`, `noImplicitThis`. This is why the `any` count is 0 and why `noImplicitAny` has nothing to find. |
| `noImplicitOverride` | **ON** | VGC-261 |
| `noFallthroughCasesInSwitch` | **ON** | VGC-261 |
| `noUncheckedSideEffectImports` | **ON** | VGC-261 |
| `allowUnreachableCode: false` | **ON** | VGC-261 |
| `allowUnusedLabels: false` | **ON** | VGC-261 |
| `useUnknownInCatchVariables` | ON (via `strict`) | confirmed: `catch (e: unknown)` idiom used in `db.ts:12` etc. |
| `strictFunctionTypes` | ON (via `strict`) | — |

### Currently OFF — measured

| Flag | Errors (total) | non-test | `src/lib` non-test | What it would actually catch here | Recommend |
|---|---:|---:|---:|---|---|
| **`noUncheckedIndexedAccess`** | **394** | **288** | **33** | **Both DANGEROUS-2 sites, exactly and with no false positive** (`pkmn-dex-fallback.ts:83, 139`). Plus `showdown-parser.ts:71` (`lines[0]`), `stat-calculator.ts:194-197`, `paste-edit.ts:64/97/107`, `extract-species.ts:10/13`, `diff-state.ts:117`, `url-codec.ts:80`. Codes: 176 × TS2532, 132 × TS18048, 56 × TS2345, 22 × TS2322, 6 × TS2538, 2 × TS2769. | **YES — highest value. Adopt in stages.** |
| `exactOptionalPropertyTypes` | 74 | 73 | 9 | Almost entirely the benign `teamName?: string` ← `string \| undefined` shape (37 × TS2375, 18 × TS2379, 13 × TS2769 from React prop spreads). Real bugs found: 0. Concentrated in `HomePageClient.tsx` (8), `PokemonDetailSlide.tsx` (5), `TeamOverview.tsx` (5), `TeamReport.tsx` (4) — all `conflict_risk: true`. | **No (low ROI).** Revisit after NUIA. |
| `noUnusedLocals` | 21 | 19 | 3 | Real dead code, including **`src/lib/sharing/url-codec.ts:77 toBase64Url` — the share-URL *encoder*, imported by nothing**, and `src/lib/data/tags.ts:33 EventType` (dead type), `src/lib/discord-bot.ts:50 PRIORITY_LABELS`, 3 dead `*_I18N` maps in `ExploreFilters.tsx`, 2 dead `UserButton` imports. | **YES — cheap (19 fixes), and it already found a dead half of the share codec.** |
| `noUnusedParameters` | 5 | 5 | 0 | 5 unused props/params (`PasteInput.tsx:120` ×2, `MatchupPlanSlide.tsx:447`, `SpeedTierChart.tsx:545`, `CalcEntryGroup.tsx:187`). Two are **declared component props nothing reads**, i.e. dead API surface. | **YES — trivial (5 fixes).** Pair with `noUnusedLocals`. |
| `noPropertyAccessFromIndexSignature` | 681 | 659 | 100 | Mostly forces `row.foo` → `row["foo"]` across the DB layer. Enormous churn, finds no bug, and makes §4.2 *worse* to read. | **No.** |
| `verbatimModuleSyntax` | **0** | 0 | 0 | Confirms the note in `tsconfig.json`: it measures clean. Still changes import-elision **emit**, not just diagnostics, so it needs its own commit behind a real `next build` — the existing comment is correct and I'd keep it. | Defer (as documented). |
| All four recommended together | **490** | **380** | **45** | — | — |

(`strict` and the five VGC-261 flags are already on, so "turning them on" is a no-op; they
are listed above for completeness as the task asked.)

### The single highest-value flag: `noUncheckedIndexedAccess`

288 non-test errors is a real cost, but it is the only flag in the table that catches an
actual production defect, and it catches the *worst* one in this report
(DANGEROUS-2) precisely, by file and line, with zero false positives at those two sites.

The cost is also far more concentrated than the headline suggests — **168 of the 288 (58%)
are in `src/app/api/**`**, and they are all the same DB-row-indexing pattern that §4.2
already wants refactored behind a typed row reader. Fix that, and most of the NUIA bill
disappears as a side effect.

**Suggested staged adoption:**

1. **Stage 1 — `src/lib/` only (33 errors, 0 in `conflict_risk` files).** The domain maths.
   Fixes DANGEROUS-2 for real. Most are 1-line `?? default` or destructure-with-guard.
   Hot files: `showdown-parser.ts` (8), `paste-edit.ts` (7), `random-accent.ts` (6, trivial),
   `stat-calculator.ts` (3), `pkmn-dex-fallback.ts` (2, the important ones),
   `extract-species.ts` (2), `linear.ts` (2), `pokemon.ts`/`diff-state.ts`/`url-codec.ts` (1 each).
   Enforce with an `src/lib/tsconfig.json` or a lint rule until the whole program is clean.
2. **Stage 2 — refactor the DB row boundary** (§4.2). Removes most of the 168 API errors.
3. **Stage 3 — components/hooks (~87)**, after the UI files leave the `conflict_risk` list.
4. **Stage 4 — tests (106)**, mostly `result.pokemon[0]!` in assertions; mechanical.
5. Then flip the flag on in `tsconfig.json` and fold `noUnusedLocals` +
   `noUnusedParameters` (24 fixes) into the same ticket.

---

## 9. Conflict-risk index

Files in this report that appear in `.swarm/main-changed-files.md` → `conflict_risk: true`:

```
src/components/compare/CompareContent.tsx          src/components/report/SpeedTierChart.tsx
src/components/explore/ReportCard.tsx              src/components/report/SpreadBuilder.tsx
src/components/home/HomePageClient.tsx             src/components/report/TeamReport.tsx
src/components/report/DefensiveCoverageChart.tsx   src/components/report/TeamStats.tsx
src/components/report/MatchupPlanSlide.tsx         src/components/report/TypeBadge.tsx
src/components/report/OffensiveCoverageChart.tsx   src/hooks/useTheme.ts
src/components/report/PokemonCard.tsx              src/lib/utils/random-accent.ts
src/components/report/PokemonDropdown.tsx          src/lib/utils/type-colors.ts
```

**Every `src/lib/` file carrying a DANGEROUS finding is conflict-free**
(`pkmn-dex-fallback.ts`, `dex-subset.ts`, `cache.ts`, `url-codec.ts`, `type-chart.ts`,
`paste-edit.ts`, `diff-state.ts`, `stat-calculator.ts`, `showdown-parser.ts`,
`champions-legality.ts`), as are `src/hooks/useShareUrl.ts` and
`src/app/api/champions/meta/route.ts`.

The one awkward case is **DANGEROUS-1**: the cast is in a conflict-free file
(`pkmn-dex-fallback.ts`) but the crash site and the `TYPE_COLORS` fallback are in
`TypeBadge.tsx` / `type-colors.ts`, both `conflict_risk: true`. Doing part (1) of the fix
alone (the real narrow in `dex-subset.ts` / `pkmn-dex-fallback.ts`, plus DANGEROUS-2's
empty-types guard) removes the crash without touching either conflicted file — so the
defence-in-depth `?? TYPE_COLORS.Normal` in `TypeBadge.tsx` can wait for a quieter moment.

---

## 10. Suggested ticket split

| Priority | Scope | Files | Conflict |
|---|---|---|---|
| **P0** | DANGEROUS-1 + DANGEROUS-2 — real narrow in `asPokemonTypes`, wire it into both `pkmn-dex-fallback` sites, guard the empty-types case. Regression test named for the bug: `lookupPokemon("MissingNo.")` must not yield a non-`PokemonType`. | `dex-subset.ts`, `pkmn-dex-fallback.ts` | none |
| **P1** | §6 — derive `PokemonType` from `POKEMON_TYPES as const`, add `isPokemonType`, collapse the 8 duplicate lists. | `types/pokemon.ts` + 6 call sites (4 conflicted) | partial |
| **P1** | DANGEROUS-3 + DANGEROUS-4 + DANGEROUS-5 — finish the VGC-146 validation rollout: schema on `cacheGet<ChampionsMetaResult>`, `safeParse` on the share-API path, pin `ShareableStateSchema: z.ZodType<ShareableState>` and drop the cast. | `cache.ts`, `champions/meta/route.ts`, `useShareUrl.ts`, `url-codec.ts`, `url-codec.schemas.ts` | none |
| **P2** | `noUnusedLocals` + `noUnusedParameters` on (24 fixes) — deletes dead `toBase64Url`, dead `EventType`, dead props. | 21 files | some |
| **P2** | `noUncheckedIndexedAccess` Stage 1: `src/lib/` only (33 errors). | 11 files | none |
| **P2** | Defence in depth: `TYPE_COLORS[type] ?? TYPE_COLORS.Normal` in `TypeBadge`. | `TypeBadge.tsx` | **true** |
| **P3** | Explicit return types on the 7 `src/lib/analysis/` exports. | 3 files | none |
| **P3** | Typed DB row reader to retire ~290 `as string`/`as Date` casts (and ~168 future NUIA errors). | `src/lib/db.ts` + API routes | some |
| **P3** | Type-check `cypress/**` and `scripts/*.mjs` (§7). | `tsconfig.json`, new `cypress/tsconfig.json` | **true** (`tsconfig.json` not in list, but shared) |
| **P4** | `SpreadBuilder.tsx` `outcome` discriminant — retires 8 non-null assertions. | `SpreadBuilder.tsx` | **true** |

---

*Audit was read-only: `git status` unchanged, repo `tsconfig.json` untouched, scratch flag
configs created outside the repo and deleted.*
