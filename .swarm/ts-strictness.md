# TypeScript Strictness & Soundness Audit — VGC Team Report

**Date:** 2026-08-02 · **Scope:** `src/**` (310 `.ts`/`.tsx` files) · **Method:** static/grep analysis only (`node_modules` unavailable, `tsc` not run)

---

## 1. tsconfig.json strictness flags

`/home/user/VGC-Team-Report/tsconfig.json`

### On

| Flag | Value | Source |
|---|---|---|
| `strict` | `true` | explicit |
| `noImplicitAny` | on | via `strict` |
| `strictNullChecks` | on | via `strict` |
| `strictFunctionTypes` | on | via `strict` |
| `strictBindCallApply` | on | via `strict` |
| `strictPropertyInitialization` | on | via `strict` |
| `useUnknownInCatchVariables` | on | via `strict` |
| `alwaysStrict` | on | via `strict` |
| `noImplicitThis` | on | via `strict` |
| `isolatedModules` | `true` | explicit |
| `resolveJsonModule` | `true` | explicit |

### Off (not set — all default to `false`)

| Flag | Impact |
|---|---|
| **`noUncheckedIndexedAccess`** | **Highest-leverage gap.** `arr[0]`, `record[key]`, `match[1]` are all typed as `T`, never `T \| undefined`. Directly enables findings #1, #2 and #4 below. |
| **`exactOptionalPropertyTypes`** | `teamName?: string` accepts an explicit `undefined`; optional-vs-absent is indistinguishable in the share/serialization layer. |
| `noImplicitOverride` | Low impact (no class hierarchies in this codebase). |
| `noPropertyAccessFromIndexSignature` | `data.tournamentName` on a `Record<string, unknown>` is allowed without bracket syntax — used pervasively in `src/app/api/**`. |
| `noUnusedLocals` / `noUnusedParameters` | Delegated to ESLint. Acceptable. |
| `noFallthroughCasesInSwitch` | Low impact. |
| `noImplicitReturns` | Low impact. |
| `allowUnreachableCode` / `allowUnusedLabels` | Not set. |
| `verbatimModuleSyntax` | Not set; `isolatedModules` covers the main hazard. |

Also worth noting: `skipLibCheck: true` and `allowJs: true` are both on, and `exclude` drops `cypress/` from type-checking entirely.

### CI/lint posture

`eslint.config.mjs` is `eslint-config-next/core-web-vitals` + `eslint-config-next/typescript` with **no custom rules**. It therefore does **not** enable `@typescript-eslint/no-explicit-any` as an error, nor `no-unsafe-assignment` / `no-unsafe-member-access` (those require type-aware linting, which is not configured). `.github/workflows/ci.yml` runs `tsc --noEmit` + `eslint` + `vitest`.

---

## 2. `any`, suppressions, and non-null assertions

### Explicit `any` — clean

| Pattern | Count in `src/**` |
|---|---|
| `: any` type annotation | **0** |
| `as any` | **0** |
| `<any>` assertion | **0** |
| `any[]`, `Record<string, any>`, `Promise<any>` | **0** |
| `@ts-ignore` | **0** |
| `@ts-expect-error` | **0** |
| `@ts-nocheck` | **0** |

This is genuinely excellent and unusual. The only greps that hit `any`/`as any` were English prose in JSDoc comments (`DisplayTogglePill.tsx:19`, `:67`).

### Implicit `any` — the real exposure

`strict` does **not** stop `any` from entering via library typings. `Body.json()` in the DOM lib is declared `Promise<any>`, so every `await request.json()` yields an unchecked `any` that no grep for `: any` will find.

22 API routes read a request body. 19 immediately run a Zod `safeParse` (the correct pattern, e.g. `src/app/api/share/route.ts:88-96`). **3 do not:**

- `/home/user/VGC-Team-Report/src/app/api/discord/route.ts:95` — `JSON.parse(rawBody)` → `body.type`, `body.data?.name`, `body.data?.options` all `any`
- `/home/user/VGC-Team-Report/src/app/api/webhooks/linear/route.ts:61` — `JSON.parse(rawBody)`
- `/home/user/VGC-Team-Report/src/app/api/webhooks/posthog/route.ts:188` — `body.person?.properties?.email`, `body.data?.event_name`, etc.

All three verify a signature/secret first, which limits this to *trusted-but-malformed* payloads rather than attacker-controlled ones. `src/app/api/share/[id]/versions/route.ts:105` also reads `body` raw but guards with `Number.isInteger(targetVersion)`, so it is safe.

### Non-null assertions (`!`)

11 real sites (excluding `String!` inside GraphQL template literals):

| File:line | Assessment |
|---|---|
| `src/lib/db.ts:4` — `process.env.DATABASE_URL!` | Unguarded. See finding #8. |
| `src/lib/rate-limit.ts:24` — `redis: redis!` | Guarded by callers; acceptable. |
| `src/components/report/SpeedTierChart.tsx:21` — `.get(baseKey)!.push(...)` | Guarded by the `has()` on the previous line. Safe. |
| `src/components/report/SpeedTierChart.tsx:188` — `mon.itemBoost!.multiplier` | Guarded by `hasSpeedBoost` on line 187. Safe but fragile. |
| `src/components/report/MatchupPlanSlide.tsx:277` — `mon.calculatedStats![stat]` | Guarded by `mon.hasEvs && mon.calculatedStats` at line 268. Safe. |
| `src/components/report/TeamStats.tsx:32` — `p.data!.baseStats` | Guarded by `.filter((p) => p.data?.baseStats)` on line 31. Safe. |
| `src/components/ui/LanguageSelector.tsx:12` — `.find(...)!` | Safe by construction. |
| `src/app/feedback/FeedbackContent.tsx:111` — `.find(...)!` | Safe by construction. |
| `src/components/explore/ReportCard.tsx:226`, `:286` | Guarded by surrounding conditionals. |
| `src/app/api/sync/[id]/route.ts:26` — `presence.get(shareId)!` | Guarded by preceding `set`. |

**Zero non-null assertions exist in `src/lib/parser/`, `src/lib/analysis/`, or `src/lib/validation/`.** The core domain logic is clean on this axis.

### Type assertions (`as X`) by area

| Area | Count (excl. `as const`) |
|---|---|
| `src/lib/**` | 42 |
| `src/components/**` | 43 |
| `src/app/api/**` | **241** |
| `src/**` total | 420 |

The API layer holds 57% of all casts. Nearly all are `row.x as Date` / `row.data as Record<string, unknown>` shaping of untyped Neon `QueryResult` rows.

---

## 3. Exported functions in `src/lib/**` missing explicit return types

10 confirmed sites. **None are in the domain-critical modules** — `showdown-parser.ts`, `stat-calculator.ts`, `champions-legality.ts`, `item-boosts.ts`, `detect-regulation.ts`, `detect-archetype.ts`, `type-chart.ts`, `natures.ts`, `dex-subset.ts` and `pkmn-dex-fallback.ts` all annotate every export.

| File:line | Function |
|---|---|
| `src/lib/discord-bot.ts:60` | `postFeedbackEmbed` |
| `src/lib/email.ts:32` | `sendEmail` |
| `src/lib/email.ts:79` | `sendCommentNotificationEmail` |
| `src/lib/email.ts:181` | `sendWelcomeEmail` |
| `src/lib/email.ts:321` | `buildWeeklySummaryHtml` |
| `src/lib/notifications.ts:9` | `createNotification` |
| `src/lib/notifications.ts:30` | `notifyFollowers` |
| `src/lib/posthog-server.ts:31` | `captureServerEvent` |
| `src/lib/i18n/index.ts:47` | `I18nProvider` |
| `src/lib/i18n/index.ts:97` | `useTranslation` |

Low risk in isolation, but `buildWeeklySummaryHtml` (inferred `string`) and `useTranslation` (inferred from `useContext`) are the two whose inferred types could silently change under refactor.

---

## 4. Top 10 findings, ranked by runtime-bug risk

### #1 — `entry.types as PokemonType[]` launders a type the union does not contain → React render crash

**`/home/user/VGC-Team-Report/src/lib/data/pkmn-dex-fallback.ts:77`** (and identically **`:133`**), enabled by **`/home/user/VGC-Team-Report/src/lib/data/dex-subset.ts:124`** (`asPokemonTypes`).

```ts
const types = entry.types as PokemonType[];
```

`DexSubsetSpecies.types` is honestly declared `string[]`. The cast asserts membership in the 18-member `PokemonType` union with no check. **`dex-subset.json` violates that assertion today:**

```json
{"name":"MissingNo.","types":["Bird","Normal"],"baseStats":{"hp":33,"atk":136,"def":0,"spa":6,"spd":6,"spe":29},"abilities":[],"forme":null,"baseSpecies":"MissingNo.","isNonstandard":"Custom"}
```

`"Bird"` is not a `PokemonType`. The full crash chain:

1. User pastes `MissingNo.` (or `Missingno`, `missing no` — `toId` strips punctuation)
2. `showdown-parser.ts` accepts it (species is not `"Unknown"`)
3. `pokemon.ts:3380 lookupPokemon` misses the static map → falls through to `lookupPokemonFromDex`
4. The zero-stat guard at `pkmn-dex-fallback.ts:69` (`baseStats.hp === 0 && baseStats.atk === 0`) **does not fire** — MissingNo has hp 33, atk 136
5. `isNonstandard: "Custom"` is present on the type but **never read** — nothing filters it
6. `types` is cast to `["Bird", "Normal"]` and stored in `PokemonData.types`
7. `PokemonCard.tsx:337` renders `<TypeBadge type="Bird" />`
8. **`/home/user/VGC-Team-Report/src/components/report/TypeBadge.tsx:10`**: `const colors = TYPE_COLORS[type]` → `undefined` (TS believes it is always defined because `noUncheckedIndexedAccess` is off and `TYPE_COLORS` is `Record<PokemonType, …>`)
9. Line 16 `colors.bg` → **`TypeError: Cannot read properties of undefined`** → the whole report slide white-screens

Same landing zone via `MatchupPlanSlide.tsx:240`, `PokemonDetailSlide.tsx:616`, `TournamentMode.tsx:115`, `DefensiveCoverageChart.tsx:86/102/129`, `OffensiveCoverageChart.tsx:184/200/227`, `CompareContent.tsx:211` (which adds its own `t as PokemonType`).

Note that `src/lib/utils/move-type-style.ts:31-32` **does** guard this exact lookup (`if (!colors) return null`) — the risk is already known in one place and unhandled in nine others.

**Fix (three layers, all cheap):**

```ts
// src/lib/data/dex-subset.ts — replace the unchecked asPokemonTypes
const POKEMON_TYPE_SET: ReadonlySet<string> = new Set<PokemonType>([
  "Normal","Fire","Water","Electric","Grass","Ice","Fighting","Poison","Ground",
  "Flying","Psychic","Bug","Rock","Ghost","Dragon","Dark","Steel","Fairy",
]);
export function asPokemonTypes(types: string[]): PokemonType[] {
  return types.filter((t): t is PokemonType => POKEMON_TYPE_SET.has(t));
}
```

Then in `pkmn-dex-fallback.ts:77` and `:133` use `asPokemonTypes(entry.types)` instead of the cast, and bail when the result is empty. Also add an `isNonstandard` filter at line 63 so `"Custom"` / `"CAP"` entries never resolve:

```ts
if (!entry || entry.isNonstandard === "Custom" || entry.isNonstandard === "CAP") {
  pokemonCache.set(key, null);
  return null;
}
```

Finally, make `TypeBadge.tsx:10` defensive: `const colors = TYPE_COLORS[type] ?? TYPE_COLORS.Normal;`. Add a vitest naming the bug in `src/lib/data/__tests__/` that asserts every `types[]` entry in `dex-subset.json` is in the union — that turns a future regeneration regression into a red test instead of a prod white-screen.

---

### #2 — Unchecked element casts in the share-read path → 500 on `GET /api/share/[id]`

**`/home/user/VGC-Team-Report/src/lib/utils/normalize-report.ts:79`** and **`:34`**

```ts
// :79
const rawPlans = Array.isArray(data.matchupPlans) ? data.matchupPlans : [];
const matchupPlans = rawPlans.map((plan: AnyRecord) => migratePlan(plan));

// :34
gamePlans: plan.gamePlans.map((gp: AnyRecord) => ({ ... gp.bring ... gp.notes ... }))
```

`Array.isArray()` narrows the *container* but says nothing about *elements*. Annotating the callback parameter as `AnyRecord` is an assertion, not a check — TS accepts it silently. If a legacy row in the `shares` JSONB column contains `matchupPlans: [null]` or `gamePlans: ["legacy string"]`, `migratePlan(null)` reads `plan.gamePlans` on `null` and throws `TypeError`.

This function is the **primary read path**: `src/app/api/share/[id]/route.ts:163` and `:227`, plus the batch `src/app/api/migrate/route.ts:54`. A single malformed legacy row makes that share permanently un-loadable (500), and in the migrate route it aborts the batch.

The rest of the file is defensively written (`migrateCalcEntries` at `:11-24` correctly narrows each entry with `typeof` / `"text" in entry`), which makes these two sites look like oversights rather than intent.

**Fix:** reuse the `asRecord` guard that already exists in a sibling module (`src/lib/utils/diff-state.ts:94-100`):

```ts
const matchupPlans = rawPlans
  .filter((p): p is AnyRecord => p !== null && typeof p === "object" && !Array.isArray(p))
  .map(migratePlan);
```

and the same filter on `plan.gamePlans` before `.map` at `:34`. Add a vitest for `normalizeReportData({ matchupPlans: [null, "x", 5] })`.

---

### #3 — `noUncheckedIndexedAccess: false` produces a `[undefined]` tuple typed as `[PokemonType]`

**`/home/user/VGC-Team-Report/src/lib/data/pkmn-dex-fallback.ts:78-80`** and **`:134-136`**

```ts
const typesTuple: PokemonData["types"] = types.length >= 2
  ? [types[0], types[1]]
  : [types[0]];          // ← types.length === 0 gives [undefined]
```

`PokemonData["types"]` is `[PokemonType] | [PokemonType, PokemonType]`. With `noUncheckedIndexedAccess` off, `types[0]` on an empty array is typed `PokemonType` but is `undefined` at runtime, producing `{ types: [undefined] }` that satisfies the compiler. Downstream this reaches the same `TYPE_COLORS[undefined]` crash as #1.

No species in the current `dex-subset.json` has zero types, so this is latent rather than live — but the JSON is regenerated by `scripts/build-dex-subset.mjs` after every `@pkmn/dex` bump, and the type system provides no backstop.

**Fix:** enable `"noUncheckedIndexedAccess": true` in `tsconfig.json` (expect a meaningful but mostly mechanical fix-up pass — most sites in this codebase already use `?.` or `??`, e.g. `extract-species.ts:6`, `TeamStats.tsx:26-27`, `sprite-url.ts:47`). If a repo-wide flip is too large for one change, at minimum make the tuple construction explicit:

```ts
const narrowed = asPokemonTypes(entry.types);
if (narrowed.length === 0) { pokemonCache.set(key, null); return null; }
const typesTuple: PokemonData["types"] =
  narrowed.length >= 2 ? [narrowed[0]!, narrowed[1]!] : [narrowed[0]!];
```

---

### #4 — Untyped webhook payloads flow as `any` through three signature-verified routes

**`/home/user/VGC-Team-Report/src/app/api/webhooks/posthog/route.ts:188`**, **`/home/user/VGC-Team-Report/src/app/api/webhooks/linear/route.ts:61`**, **`/home/user/VGC-Team-Report/src/app/api/discord/route.ts:95`**

```ts
const body = JSON.parse(rawBody);           // any
const command = body.data?.name;             // any
const options = body.data?.options ?? [];    // any
const getOption = (name: string) =>
  options.find((o: { name: string }) => o.name === name)?.value as string | undefined;
```

`JSON.parse` and `Response.json()` both return `any`. Every downstream property read is unchecked, and `.value as string | undefined` at `discord/route.ts:108` asserts a type on a value that could be a number or object (Discord slash-command options are polymorphic). `posthog/route.ts:190-195` reads four levels deep (`body.person?.properties?.email`) — optional chaining saves the traversal but the resulting values are still `any` and are interpolated into Linear issue titles.

19 of 22 body-reading routes already do this correctly with Zod `safeParse` — `src/app/api/share/route.ts:88-96` is the reference pattern.

**Fix:** the project already depends on `zod@^4`. Define a narrow schema per webhook and `safeParse` immediately after signature verification, returning 400 on mismatch. Minimum viable version — type the parse result as `unknown` rather than letting it default to `any`:

```ts
const body: unknown = JSON.parse(rawBody);
const parsed = DiscordInteractionSchema.safeParse(body);
if (!parsed.success) return NextResponse.json({ error: "Bad payload" }, { status: 400 });
```

---

### #5 — `StatSpread` is used for both EVs and SP, so the two are structurally interchangeable

**`/home/user/VGC-Team-Report/src/lib/analysis/stat-calculator.ts:89`**

```ts
export function convertToChampionsSp(evs: StatSpread): StatSpread
```

Input and output are the same type. `convertToChampionsSp(convertToChampionsSp(evs))` compiles cleanly, as does passing an SP spread to `calculateAllStats` (which expects EVs) or an EV spread to `calculateAllChampionsStats`. Given CLAUDE.md flags this as the exact area where a mistake "produces wrong Pokémon stats for users," the type system currently provides zero protection.

The function partly compensates with a *runtime* heuristic (lines 99-103: total ≤ 66 and every stat ≤ 32 ⇒ already SP), which makes double-conversion idempotent today. But that heuristic is inherently ambiguous — a legitimate low-investment EV spread like `4 HP / 4 Def` (total 8) is indistinguishable from SP and will be passed through unconverted.

All 10 call sites (`PokemonCard.tsx:154/419`, `PokemonDetailSlide.tsx:423/441/678`, `SpeedTierChart.tsx:182/236`, `CompareContent.tsx:170`) currently pass `parsed.evs` correctly, so this is a latent hazard rather than a live bug.

**Fix:** brand the two spreads so they cannot be swapped, at zero runtime cost:

```ts
// src/lib/types/pokemon.ts
declare const evBrand: unique symbol;
declare const spBrand: unique symbol;
export type EvSpread = StatSpread & { readonly [evBrand]?: true };
export type SpSpread = StatSpread & { readonly [spBrand]?: true };
```

Then `convertToChampionsSp(evs: EvSpread): SpSpread`, `calculateAllChampionsStats(baseStats: StatSpread, sps: SpSpread, …)`. `ParsedPokemon.evs` stays `EvSpread`. The compiler then rejects double-conversion and cross-system misuse.

---

### #6 — The SP-detection heuristic is duplicated in two modules with no shared type or constant link

**`/home/user/VGC-Team-Report/src/lib/analysis/stat-calculator.ts:99-103`** vs **`/home/user/VGC-Team-Report/src/lib/validation/champions-legality.ts:266-268`**

```ts
// stat-calculator.ts — decides how to DISPLAY the spread
const totalInput = stats.reduce((sum, s) => sum + evs[s], 0);
const anyOverMax = stats.some((s) => evs[s] > CHAMPIONS_MAX_SP_PER_STAT);
if (totalInput > 0 && totalInput <= CHAMPIONS_TOTAL_SP && !anyOverMax) return { ...evs };

// champions-legality.ts — decides how to VALIDATE the same spread
const total = Object.values(p.evs).reduce((a, b) => a + b, 0);
const maxPerStat = Math.max(...Object.values(p.evs));
const looksLikeSp = total > 0 && total <= CHAMPIONS_TOTAL_SP && maxPerStat <= CHAMPIONS_MAX_SP_PER_STAT;
```

Logically equivalent today (the comment at `champions-legality.ts:258-259` explicitly acknowledges the duplication). They share the two constants but not the predicate. If either is tuned independently, the report will render a spread as SP while the validator scores it against the 512 EV budget — or vice versa — producing contradictory output on the same screen. This is precisely the "wrong stats for users" failure mode, and it is a code-organization gap the type system cannot catch.

**Fix:** extract the predicate into `stat-calculator.ts` and import it in the validator:

```ts
export function looksLikeChampionsSp(spread: StatSpread): boolean {
  const values = Object.values(spread);
  const total = values.reduce((a, b) => a + b, 0);
  return total > 0 && total <= CHAMPIONS_TOTAL_SP &&
         Math.max(...values) <= CHAMPIONS_MAX_SP_PER_STAT;
}
```

Use it at both sites, and add a vitest asserting the two modules agree across a table of representative spreads.

---

### #7 — `as unknown as DexSubset` double cast over an unvalidated 324KB JSON blob

**`/home/user/VGC-Team-Report/src/lib/data/dex-subset.ts:62`**

```ts
const subset = rawSubset as unknown as DexSubset;
```

This is the only `as unknown as` in `src/lib/**` that guards real data (the other four — `CommonModesSlide.tsx:108`, `useSlideSystem.ts:56`, `i18n/index.ts:84`, `webhooks/clerk/route.ts:46` — are narrow and low-consequence). The double cast disables *all* structural checking on a file regenerated by an external script after every `@pkmn/dex` bump. It is the root enabler of findings #1 and #3.

The `schemaVersion` field exists on the interface (`:54`) and is written by `scripts/build-dex-subset.mjs:75` — but **is never read anywhere in `src/`**. The versioning mechanism is entirely decorative.

**Fix:** assert the shape once at module load, cheaply, and actually check the version:

```ts
if (subset.schemaVersion !== 1) {
  throw new Error(`dex-subset.json schemaVersion ${subset.schemaVersion} — expected 1. Re-run scripts/build-dex-subset.mjs.`);
}
```

Better still, have `scripts/build-dex-subset.mjs` emit a `.d.ts`-adjacent validation test, or add a vitest in `src/lib/data/__tests__/` that validates the JSON against the interface (types in the union, non-empty `types`, non-zero `baseStats`, no `isNonstandard: "Custom"`). That single test kills #1, #3 and #7 together.

---

### #8 — `process.env.DATABASE_URL!` — the only unguarded env assertion

**`/home/user/VGC-Team-Report/src/lib/db.ts:4`**

```ts
export function getDb(): NeonQueryFunction<false, false> {
  const sql = neon(process.env.DATABASE_URL!);
  return sql;
}
```

If `DATABASE_URL` is unset, `neon(undefined)` throws deep inside the driver with a message that does not name the missing variable. Since `getDb()` is called from ~30 API routes, a misconfigured preview environment produces opaque 500s instead of one clear error. Compare `src/lib/rate-limit.ts:8-13`, which correctly checks its env vars and degrades to an in-memory limiter.

**Fix:**

```ts
export function getDb(): NeonQueryFunction<false, false> {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  return neon(url);
}
```

---

### #9 — `Partial<StatSpread>` widened to `StatSpread` by assertion

**`/home/user/VGC-Team-Report/src/lib/analysis/stat-calculator.ts:58`** and **`:74`**

```ts
const stats: StatName[] = ["hp", "atk", "def", "spa", "spd", "spe"];
const result: Partial<StatSpread> = {};
for (const stat of stats) { result[stat] = calculateStat(...); }
return result as StatSpread;
```

Correct today — the local `stats` array is exhaustive. But the assertion is the only thing making it type-check, so dropping a key from that literal (or an early `continue`/`break` added later) yields a `StatSpread` with `undefined` members. Those flow into `calculatedStats` and then into arithmetic (`SpeedTierChart.tsx:181`, `MatchupPlanSlide.tsx:277-280`) producing `NaN` in rendered stat bars — a silent wrong-number bug, not a crash. Exactly the failure class CLAUDE.md calls out.

Note the identical array literal is redeclared in four places (`stat-calculator.ts:51`, `:67`, `:90`, and `champions-legality.ts` implicitly via `Object.values`).

**Fix:** build the object literally so the compiler proves exhaustiveness, and hoist the tuple:

```ts
export const STAT_NAMES = ["hp","atk","def","spa","spd","spe"] as const;
// …
return {
  hp:  calculateStat("hp",  baseStats.hp,  ivs.hp,  evs.hp,  level, nature),
  atk: calculateStat("atk", baseStats.atk, ivs.atk, evs.atk, level, nature),
  // … all six
};
```

No assertion needed; a missing key becomes a compile error.

---

### #10 — 241 unchecked `as` casts over Neon query results in `src/app/api/**`

Representative: `src/app/api/oembed/route.ts:28`, `src/app/api/team-graphic/route.tsx:101`, `src/app/api/share/[id]/route.ts:86/163/227`, `src/app/api/user/reports/route.ts:43-53`, `src/app/api/spotlight/route.ts:42/68-69`, and ~30 more files.

```ts
const data = rows[0].data as Record<string, unknown>;
const tournamentName = (data.tournamentName as string) ?? "VGC Team Report";
createdAt: (row.created_at as Date).toISOString(),
```

Two distinct hazards:

- **`rows[0]` with `noUncheckedIndexedAccess` off.** Every site I sampled *does* guard with `if (rows.length === 0)` first (`oembed:24`, `team-graphic:97`, `share/[id]:83`) — the discipline is good and consistent. `src/app/api/share/[id]/collaborators/route.ts:134` even uses `rows[0]?.data`. But the compiler is enforcing none of it; the guards survive only by convention and code review.
- **`(x as string) ?? fallback` is a no-op fallback.** Once `data.tournamentName` is asserted to `string`, `??` can never fire from the compiler's view, and if the JSONB actually holds a number or object it is passed through unchanged into oEmbed responses and OG image generation. `src/app/api/share/[id]/collaborators/route.ts:134` compounds this: `(reportRows[0]?.data as Record<string, unknown>)?.tournamentName as string || "a team report"` — a double assertion where the `||` fallback is unreachable per the types.
- **`row.created_at as Date`** assumes the Neon driver returns a `Date` rather than an ISO string. If a driver upgrade changes that mapping, `.toISOString()` throws across ~15 routes simultaneously.

**Fix (incremental, highest value first):**

1. Add one typed row helper in `src/lib/db.ts` and route all `data` reads through it:
   ```ts
   export function firstRow<T>(rows: Record<string, unknown>[]): T | null {
     const r = rows[0];
     return r ? (r as T) : null;
   }
   export function asIso(v: unknown): string {
     return v instanceof Date ? v.toISOString() : String(v ?? "");
   }
   ```
2. Replace `(data.x as string) ?? ""` with a real coercion: `typeof data.x === "string" ? data.x : ""`.
3. Reuse the existing `ShareableStateSchema` (already defined in `src/lib/sharing/url-codec.ts` and used correctly at `:216-219`) to validate `shares.data` on read, not just on URL decode.

---

## 5. Honourable mentions (below the top 10)

- **`src/lib/i18n/index.ts:80-86`** — a `Proxy` cast `as TranslationKeys` with an English fallback. Any key missing from both the active locale and `en` returns `undefined` typed as `string`, rendering the literal string `"undefined"` in the UI. Bounded blast radius.
- **`src/lib/utils/diff-state.ts:102`** — `value as SerializedMatchupPlan[]` after `Array.isArray`, same element-level gap as #2, but only feeds a change-summary string, so a bad element degrades a label rather than crashing.
- **`src/lib/data/type-chart.ts:203`** — `{} as Record<PokemonType, number>` is sound as written (the loop fills all 18 keys from a local exhaustive literal).
- **`src/lib/data/natures.ts:49`** and **`src/lib/data/pokemon.ts:3385`** — `Record<string, T>` lookups typed non-`undefined` but correctly guarded (`if (!data) return 1`). Enabling `noUncheckedIndexedAccess` would make these guards compiler-verified.
- **`src/lib/parser/showdown-parser.ts:29-31, 72, 87, 177`** — regex-capture and split indexing typed non-`undefined`. All are provably safe given the preceding regex match or the `lines.length === 0` early return, but only by inspection. `showdown-parser.ts:81` passes `genderMatch.index` (`number | undefined`) to `slice`, which silently means "to end of string" if undefined — harmless here since a match guarantees an index.
- **`cypress/` is excluded from `tsconfig.json`**, so E2E specs are never type-checked by `tsc --noEmit` or CI.

---

## 6. Recommended order of work

| # | Action | Effort | Risk removed |
|---|---|---|---|
| 1 | Filter non-union types + `isNonstandard` in `pkmn-dex-fallback.ts`; guard `TypeBadge.tsx:10` | S | Findings #1, #3 |
| 2 | Add a vitest validating `dex-subset.json` against `DexSubsetSpecies` + check `schemaVersion` | S | Findings #1, #3, #7 (permanently) |
| 3 | Element-level guards in `normalize-report.ts:34,79` | S | Finding #2 |
| 4 | Zod-validate the 3 webhook bodies | M | Finding #4 |
| 5 | Extract `looksLikeChampionsSp` into one shared predicate | S | Finding #6 |
| 6 | Fix `getDb()` env guard | XS | Finding #8 |
| 7 | Brand `EvSpread` / `SpSpread` | M | Finding #5 |
| 8 | Enable `noUncheckedIndexedAccess` and work the fallout | L | Findings #3, #10 systemically |
| 9 | Build literal objects in `calculateAllStats` / `calculateAllChampionsStats` | S | Finding #9 |
| 10 | Typed row helpers in `src/lib/db.ts`; migrate API routes incrementally | L | Finding #10 |

Steps 1-3 and 6 are all small, independently shippable, and each removes a concrete path to a user-visible failure. Step 8 is the only one that warrants a feature branch under the CLAUDE.md policy.
