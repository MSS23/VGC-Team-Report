# TypeScript Strictness Audit — VGC Team Report

**Date:** 2026-09-14 · **Scope:** `src/**`, prioritising `src/lib/**` · **Mode:** read-only
**Baseline:** `tsc --noEmit --incremental false` → **0 errors**. `strict: true` is on, plus `noImplicitOverride`, `noFallthroughCasesInSwitch`, `noUncheckedSideEffectImports`, `allowUnreachableCode: false`, `allowUnusedLabels: false`.

## Headline

This is a **well-typed codebase by the usual metrics** and a poorly-typed one by the metric that matters here.

- **Zero explicit `any` annotations in `src/`.** Not one `: any`, `as any`, `any[]`, or `Record<string, any>`. (Confirmed by regex sweep across all 324 `.ts`/`.tsx` files.)
- **Every exported function in the domain core** (`parser`, `analysis`, `validation`, `data`) has an explicit return type. Only 10 exported functions in all of `src/lib` lack one, all in infra modules.
- Only **4 suppression comments** that touch types (`as unknown as`), and **zero** `@ts-ignore` / `@ts-expect-error` / `@ts-nocheck` anywhere.

The risk is not in the annotations. It is in **three structural holes** where the type system has been told a lie and cannot help: the EV/SP conflation in the domain model, `request.json()`/Neon rows arriving as implicit `any`, and `noUncheckedIndexedAccess` being off in code that indexes regex captures and array positions constantly.

---

## HIGH — genuine runtime / correctness risk

### H1. `StatSpread` cannot distinguish EVs from SP — and there is a live display bug from it

**`src/lib/types/pokemon.ts:8`**, consumed everywhere.

`StatSpread` is one structural interface used for **four semantically different things**: EVs (0–252, budget 510), SP (0–32, budget 66), IVs (0–31), and computed stats (level-50 outputs). Passing an SP spread where EVs are expected is a silent no-op to the compiler. This is the "type hole = scoring bug" case the brief asked about, and it has already fired.

**Live instance — `src/components/report/PokemonCard.tsx:421–422`:**

```ts
const isValidChampionsEv = (ev: number) => ev === 0 || (ev >= 4 && (ev - 4) % 8 === 0);
const hasWastedEvs = isChampions && (["hp","atk",...] as const)
  .some((s) => !isValidChampionsEv(parsed.evs[s]) && parsed.evs[s] > 0);
```

`convertToChampionsSp` (stat-calculator.ts:213–217) has a documented **passthrough path**: a paste whose EV line is already SP (total ≤ 66, every stat ≤ 32) is returned unchanged, because those values *are* Stat Points. But `hasWastedEvs` re-reads the same raw `parsed.evs` and tests it against the **EV ladder** (4, 12, 20, …). For the exact example in `convertToChampionsSp`'s own comment — `EVs: 22 HP / 11 Def / 24 SpA / 4 SpD / 5 Spe` (sums to 66) — 22, 11 and 5 all fail the ladder, so the card renders a false amber **"Auto-converted from EVs"** badge on a spread that was never converted. Every native Champions paste with an off-ladder SP value gets this badge.

**Suggested fix (two parts, do both):**

1. *Immediate, self-contained.* Export the passthrough predicate from `stat-calculator.ts` so the single source of truth is shared:
   ```ts
   /** True when a spread read from an EV line is already in SP form. */
   export function isChampionsSpSpread(spread: StatSpread): boolean {
     const stats: StatName[] = ["hp","atk","def","spa","spd","spe"];
     const total = stats.reduce((sum, s) => sum + spread[s], 0);
     return total > 0 && total <= CHAMPIONS_TOTAL_SP
       && !stats.some((s) => spread[s] > CHAMPIONS_MAX_SP_PER_STAT);
   }
   ```
   Use it inside `convertToChampionsSp` (replacing lines 213–215) **and** gate `hasWastedEvs` on `!isChampionsSpSpread(parsed.evs)` in `PokemonCard.tsx:422`. Add a vitest case in `src/lib/analysis/__tests__/stat-calculator.test.ts` naming the bug ("native SP paste is not flagged as auto-converted"). This also closes a silent duplication: `champions-legality.ts:262` reimplements the same heuristic a third time (`looksLikeSp`) — point it at the shared predicate too.

2. *Structural.* Brand the spreads so the compiler enforces the distinction:
   ```ts
   declare const __brand: unique symbol;
   type Branded<T, B> = T & { readonly [__brand]: B };
   export type EvSpread  = Branded<StatSpread, "ev">;
   export type SpSpread  = Branded<StatSpread, "sp">;
   ```
   Then `convertToChampionsSp(evs: EvSpread): SpSpread`, `calculateAllChampionsStats(base: StatSpread, sps: SpSpread, …)`. The parser mints `EvSpread`; `convertToChampionsSp` is the only mint for `SpSpread`. Larger change (~15 files), best as its own ticket — but it makes the whole class of bug unrepresentable.

### H2. `await request.json()` is implicitly `any` in every API route — three routes deref it before validating

Next's `NextRequest.json()` returns `Promise<any>` (verified by probe). Most of the ~37 call sites immediately zod-`safeParse`, which is correct and safe. **Three do not**, and a body of literal JSON `null` (or an array, or a string) makes them throw a `TypeError` → **500 instead of 400**:

| File:line | Code | Failure |
|---|---|---|
| `src/app/api/user/collections/route.ts:86` | `const action = raw.action as string;` | body `null` → `Cannot read properties of null` |
| `src/app/api/share/[id]/versions/route.ts:105–106` | `const body = await request.json(); Number(body.version)` | same |
| `src/app/api/user/drafts/route.ts:163` | `const { draftId } = await request.json();` | same |

Note `collections/route.ts:86` compounds it: the `as string` is applied to an `any`, so it is a double lie — it neither checks nor narrows anything.

**Quick win.** Add one helper and use it at these three sites (the pattern already exists at `collaborators/route.ts:93` and `pokepaste/route.ts:119`):

```ts
// src/lib/security/input-validation.ts
export async function readJsonBody(request: Request): Promise<Record<string, unknown> | null> {
  const raw: unknown = await request.json().catch(() => null);
  return raw !== null && typeof raw === "object" && !Array.isArray(raw)
    ? (raw as Record<string, unknown>)
    : null;
}
```

Then `const raw = await readJsonBody(request); if (!raw) return NextResponse.json({ error: "Invalid body" }, { status: 400 });`. The downstream `safeParse` calls are unchanged. ~20 lines total.

### H3. Neon query results are `any[]` — the largest untyped surface in the app

`getDb()` returns `NeonQueryFunction<false, false>`, whose rows are `any`. Probe confirmed: `rows[0].anything_at_all` assigned to `number` type-checks clean. Every `share.data`, `row.owner_id`, `row.view_count` etc. across ~50 API routes is unchecked. A column rename or a `SELECT` typo is a runtime `undefined`, never a compile error — and `data JSONB` in particular carries arbitrary user report state straight into `normalizeReportData`.

This is also why `noPropertyAccessFromIndexSignature` measures 649 errors: those are mostly this `any`-ness plus `Record<string, unknown>` bags.

**Suggested fix (incremental, no big-bang).** Add row interfaces and a typed wrapper for the hot tables; do not attempt all 50 routes at once:

```ts
// src/lib/db/rows.ts
export interface ShareRow {
  id: string; owner_id: string | null; edit_token: string;
  data: unknown;           // deliberately unknown — goes through normalizeReportData
  version: number; is_public: boolean; is_unlisted: boolean;
  view_count: number; created_at: string; updated_at: string; deleted_at: string | null;
}
export async function queryRows<T>(q: Promise<Record<string, unknown>[]>): Promise<T[]> {
  return (await q) as T[];
}
```

Start with `shares` + `share_versions` (`api/share/**`), which is where the report payload lives. Leave `data` as `unknown`, since `normalizeReportData` is the runtime gate.

### H4. `normalizeReportData` trusts array elements it never checked

**`src/lib/utils/normalize-report.ts:79–80`**

```ts
const rawPlans = Array.isArray(data.matchupPlans) ? data.matchupPlans : [];
const matchupPlans = rawPlans.map((plan: AnyRecord) => migratePlan(plan));
```

`Array.isArray` on an `unknown` narrows to **`any[]`**, so the `(plan: AnyRecord)` annotation is accepted without any check. `migratePlan` then does `plan.gamePlans`, `plan.planA`, `plan.opponentPaste` — a stored `matchupPlans: [null]` (or `["x"]`) throws inside the **share GET route and the batch migration route**, i.e. a 500 serving somebody's saved report. Same shape at line 83 (`{ ...(data.notes ?? {}) }` is typed `Record<string,string>` but values are never checked, so `existing.includes(spreadNote)` at line 88 can throw on a non-string).

**Quick win.**

```ts
const rawPlans: unknown[] = Array.isArray(data.matchupPlans) ? data.matchupPlans : [];
const matchupPlans = rawPlans
  .filter((p): p is AnyRecord => p !== null && typeof p === "object" && !Array.isArray(p))
  .map(migratePlan);
```

and at line 85–87, guard the existing note: `const existing = typeof notes[species] === "string" ? notes[species] : "";`. Add a test in `src/lib/utils/__tests__/` that feeds `{ matchupPlans: [null, "x", 3] }` and asserts it returns `[]` rather than throwing.

---

## MEDIUM — real unsoundness, currently defended by convention

### M1. `decodeShareState` returns a type the schema does not prove

**`src/lib/sharing/url-codec.ts:140`** — `return result2.data as ShareableState;`

`ShareableState.calcs` is `Record<string, CalcEntry[]>`, but `CalcEntrySchema = z.unknown()` (url-codec.schemas.ts:21). Zod infers `Record<string, unknown[]>`; the `as` upgrades it to `CalcEntry[]`. Arbitrary JSON from a share URL therefore arrives typed as `{ text: string; category: CalcCategory }`. It does not currently crash **only because** the single consumer (`useHomePage` → `setCalcsFull`) runs `migrateCalcs`, which re-validates at runtime. That defence is a convention, not a type.

**Fix:** change the declared type to match the proof — `calcs?: Record<string, unknown[]>` on `ShareableState` — and let `migrateCalcs` be the documented narrowing point. Then delete the `as` and return `result2.data` directly. Alternatively tighten `CalcEntrySchema` to `z.object({ text: z.string(), category: z.string() })` and keep the type, but that would start rejecting legacy string-form entries the migrator handles today, so prefer the first option.

### M2. Three parallel copies of the "is this SP or EVs?" heuristic

`stat-calculator.ts:213–215`, `champions-legality.ts:262` (`looksLikeSp`), and `PokemonCard.tsx:421` (the inverted ladder check). They agree **today** — I checked the predicates are logically equivalent between the first two — but nothing type-enforces that, and H1 is what drift looks like. Folded into the H1 fix.

### M3. `entry.types as PokemonType[]` — unvalidated string → union narrowing

`src/lib/data/pkmn-dex-fallback.ts:82,138` and `dex-subset.ts:222` (`asPokemonTypes`). `DexSubsetSpecies.types` is `string[]`; the cast asserts membership in the 18-member union with no check. If a regenerated `dex-subset.json` ever contains a type outside the union (Stellar is the obvious candidate), it flows into `getEffectiveness` (`type-chart.ts:180`), where `TYPE_CHART[attackType]?.[defType] ?? 1` silently returns **neutral 1×** — a wrong defensive chart with no error anywhere.

**Fix (quick win):** make the narrowing a real guard.
```ts
const VALID_TYPES = new Set<string>(ALL_POKEMON_TYPES);
export function asPokemonTypes(types: string[]): PokemonType[] {
  return types.filter((t): t is PokemonType => VALID_TYPES.has(t));
}
```
and route `pkmn-dex-fallback.ts:82,138` through it. Pair with an assertion in `src/lib/data/__tests__/dex-subset.test.ts` that every species' types are in the union — that turns a future regen-introduced type into a red test instead of a silently-neutral matchup.

Related: **`pkmn-dex-fallback.ts:73`** `entry.baseStats as StatSpread` is a *redundant* cast (`DexSubsetSpecies.baseStats` is already structurally `StatSpread`), which makes the very next line's `if (!baseStats || …)` guard dead code the compiler can't warn about. Drop the cast; keep the zero-stat check.

Also `pkmn-dex-fallback.ts:83–85, 139–141`: `types.length >= 2 ? [types[0], types[1]] : [types[0]]` builds a `[PokemonType]` tuple from `types[0]`, which is `undefined` for a species with an empty type list. Under `noUncheckedIndexedAccess` these are 2 of the 32 `src/lib` errors. Data-driven, so low likelihood — but it is the same hole M3 describes.

### M4. The i18n Proxy is a triple assertion

**`src/lib/i18n/index.ts:80–86`** — `new Proxy(translations as Record<string, string>, {…}) as TranslationKeys`, with `(en as unknown as Record<string, string>)[prop]` inside. Any key missing from **both** the active language and `en` returns `undefined` typed as `string`, which React renders as blank rather than throwing. Two components already work around it with their own `t as unknown as Record<string, string | undefined>` (`CommonModesSlide.tsx:108`, `useSlideSystem.ts:56`) — which is the honest type, and evidence the declared one is wrong.

**Fix:** type the Proxy target as `Record<string, string | undefined>` and have the handler return `target[prop] ?? enDict[prop] ?? ""`, so a missing key degrades to empty string at a single known point. Then the two component-level `as unknown as` workarounds can be deleted.

### M5. Non-null assertions on environment / singleton state

- `src/lib/db.ts:4` — `neon(process.env.DATABASE_URL!)`. Missing env gives an opaque failure deep in the driver.
- `src/lib/rate-limit.ts:24` — `redis: redis!` inside `getUpstashLimiter`. The only call site *is* guarded (`if (redis)` at line 72), so it is safe today; the `!` is what would hide a second, unguarded call site added later.
- `src/app/api/cron/weekly-report/route.ts:22` — `Authorization: apiKey!`.
- `src/app/api/sync/[id]/route.ts:26` — `presence.get(shareId)!.set(...)`, guarded by a preceding `if (!presence.has(...))`.

**Quick win for `db.ts`:**
```ts
const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set");
return neon(url);
```

---

## LOW — style, hygiene, and narrowing artefacts

### L1. Non-null assertions that TypeScript simply can't follow (no runtime risk)

All verified guarded; listed so nobody "fixes" them by removing the guard:

- `src/lib/analysis/stat-calculator.ts:180` — `groups.get(key)!`, key came from `groups.keys()`.
- `src/components/report/TeamStats.tsx:32` — `p.data!.baseStats`, preceded by `.filter((p) => p.data?.baseStats)` (TS cannot narrow through `filter` without a predicate signature — a type guard `(p): p is … =>` would remove the `!`).
- `src/components/report/MatchupPlanSlide.tsx:277` — `mon.calculatedStats![stat]`, inside a `mon.calculatedStats ? …` ternary; narrowing is lost crossing the `.map` closure.
- `src/components/report/SpeedTierChart.tsx:192` — `mon.itemBoost!.multiplier`, guarded by `mon.itemBoost?.stat === "spe"` on the line above.
- `src/components/ui/LanguageSelector.tsx:12`, `src/app/feedback/FeedbackContent.tsx:111` — `.find(…)!` over a closed constant list.
- `src/components/report/SpeedTierChart.tsx:21` — `BASE_KEY_TO_MEGA_KEYS.get(baseKey)!.push(…)`.
- `src/components/explore/ReportCard.tsx:237,297` — `report.creatorName!`, `report.tags!` inside `&&` guards.

### L2. Exported functions missing explicit return types

**10 in `src/lib`, none in the domain core:**

`discord-bot.ts:60` `postFeedbackEmbed` · `email.ts:32` `sendEmail`, `:79` `sendCommentNotificationEmail`, `:181` `sendWelcomeEmail`, `:321` `buildWeeklySummaryHtml` · `i18n/index.ts:47` `I18nProvider`, `:97` `useTranslation` · `notifications.ts:9` `createNotification`, `:30` `notifyFollowers` · `posthog-server.ts:31` `captureServerEvent`.

270 across all of `src`, but ~200 of those are React components where the inferred `JSX.Element` is correct and annotating adds noise. The 4 in `email.ts` are worth doing (they return fetch-result shapes consumers destructure). **Quick win.**

### L3. Redundant `as` on already-validated data

`src/app/api/share/route.ts:135,146,532` — `(state.creatorName as string)`, where `state` is already `ShareBodySchema`-parsed and `creatorName` is `z.string().optional()`. The cast erases `undefined` from the type while the runtime code still `?.`-guards for it, so the annotation and the code disagree. Drop the casts; `state.creatorName?.trim()` and `state.creatorName ?? ""` are already correct.

### L4. Dead code the compiler is currently forbidden to report

`--noUnusedLocals --noUnusedParameters` = **27 errors** (22 + 5). Two are worth a look, the rest are stale imports:

- **`src/lib/sharing/url-codec.ts:77` `toBase64Url` is entirely unused** — the encode half of the codec. Either the encode path moved and this is dead, or a caller was lost. Worth 5 minutes to confirm which.
- `src/components/report/PokemonCard.tsx:180` `displayData` — computed and never read (types and ability are resolved separately at :162 and :173). Benign, but it sits in the middle of the Champions display-resolution block, so delete it rather than leave it looking load-bearing.
- Rest: unused imports in `app/page.tsx`, `Navbar.tsx`, `ExploreFilters.tsx`, `DashboardContent.tsx`, `dashboard/profile/page.tsx`, `api/user/profile/route.ts`, `discord-bot.ts:50`, `data/tags.ts:33`, plus `vi` in two test files.

### L5. `Record<string, number>` where `Record<StatName, number>` is meant

`src/lib/analysis/stat-calculator.ts:160` — `const remainder: Record<string, number> = {}` inside `trimSpToBudget`. Every read is keyed by a `StatName`, so a typo'd key would compile and yield `undefined` → `NaN` propagating into the SP trim. Narrowing the type costs one word and is where 3 of the file's `noUncheckedIndexedAccess` errors live. **Quick win.**

---

## tsconfig: strict-family flags currently OFF, measured

Each measured individually, cold, via CLI flag only (`tsconfig.json` untouched):

```
node node_modules/typescript/bin/tsc --noEmit --incremental false --<flag>
```

| Flag | Errors | `src/lib` (non-test) | Verdict |
|---|---:|---:|---|
| `verbatimModuleSyntax` | **0** | 0 | Already known-clean; deliberately deferred because it changes emit. Unchanged since the 2026-08-10 measurement. |
| `noImplicitReturns` | **2** | 0 | **Enable now.** `NotificationBell.tsx:78`, `useShareUrl.ts:137` — both `useEffect` callbacks with a conditional `return` cleanup. Add an explicit `return undefined;` or `return () => {};`. Quick win. |
| `noUnusedParameters` | **5** | 0 | **Enable now** (prefix intentionally-unused with `_`). |
| `noUnusedLocals` | **22** | 3 | **Enable after a cleanup pass** — see L4; all 22 are genuinely dead. |
| `exactOptionalPropertyTypes` | **57** | 3 | Worth doing, as its own ticket. Concentrated in `app/page.tsx` (9), `useHomePage.ts` (6), `TournamentMode.tsx` (6), `TeamOverview.tsx` (6). Only 3 in `src/lib` — `showdown-parser.ts` ×2 (the `teamName?: string` assignment) and `posthog-server.ts` ×1. Nearly all are `foo={maybeUndefined}` into `foo?: T` props, fixed by widening the prop to `T \| undefined` or spreading conditionally. |
| `noUncheckedIndexedAccess` | **323** | **32** | **Highest value, highest cost.** See below. |
| `noPropertyAccessFromIndexSignature` | **649** | ~75 | **Do not enable.** It is measuring H3/H4 (`any` rows, `Record<string, unknown>` bags), not a real defect class of its own — top files are `posthog/route.ts` (46), `normalize-report.ts` (42), `explore/route.ts` (32), `analytics/route.ts` (31), `diff-state.ts` (30). Revisit only after H3 lands. |

Already on and not listed: `noImplicitOverride`, `noFallthroughCasesInSwitch`, `noUncheckedSideEffectImports`, `allowUnreachableCode: false`, `allowUnusedLabels: false`. `useUnknownInCatchVariables` and `strictFunctionTypes` come free with `strict: true`.

### `noUncheckedIndexedAccess` — the 32 errors in `src/lib` are the ones worth reading

Full list (the other 291 are tests, components, and API routes):

```
analysis/stat-calculator.ts:173,174,176     remainder[stat]  → see L5, fix by typing Record<StatName, number>
parser/showdown-parser.ts:29,30             match[1], statMap[...]  → regex captures
parser/showdown-parser.ts:71,72,87,88,106,177   lines[0], atSplit[0], speciesMatch[1..2], headerMatch[1]
utils/paste-edit.ts:25,64,68,70,77,97       same regex/split pattern as the parser
utils/random-accent.ts:18–24 (6)            palette[...] over a constant table
utils/extract-species.ts:10,13              split()[0]
data/pkmn-dex-fallback.ts:83,139            types[0]/types[1] tuple build  → see M3
data/pokemon.ts:3393                        split()[0]
sharing/url-codec.ts:80                     bytes[i] in a bounded for-loop
utils/diff-state.ts:117                     newPlans[i] indexed by oldPlans' index
linear.ts:139,150                           mapping possibly undefined
```

Most are **provably safe** — a successful regex match guarantees its capture groups, and a bounded `for` loop guarantees its index. But two are not:

- **`utils/diff-state.ts:117`** — `oldPlans.some((p, i) => normalize(p) !== normalize(newPlans[i]))`. Guarded by an `oldPlans.length !== newPlans.length` early-return at line 106, so it holds today, but it is one refactor away from `normalize(undefined)` throwing inside version-diffing.
- **`parser/showdown-parser.ts:106`** — `lines[i]` inside `for (let i = 1; i < lines.length; i++)`, safe; but **line 71** `firstLine.split(" @ ")` reads `lines[0]` after an `if (lines.length === 0)` early-return, which is correct and which the flag would force you to re-state.

**Recommendation:** do **not** enable repo-wide in one commit. Instead, fix the ~8 genuinely-load-bearing sites first (`stat-calculator` L5, `pkmn-dex-fallback` M3, `diff-state:117`, `linear.ts:139,150`), then consider enabling. The remaining ~300 are noise-per-fix and would swamp the diff. If it is enabled eventually, prefer `arr.at(i)` / destructuring with defaults over scattering `!`, otherwise the flag just converts silent `undefined` into silent non-null assertions and buys nothing.

---

## Suggested order for tonight

1. **H1 part 1** — export `isChampionsSpSpread`, use it in `convertToChampionsSp`, `champions-legality.ts:262`, and `PokemonCard.tsx:422`. Add the regression test. *This is the one that is visibly wrong in production right now.* **Quick win.**
2. **H4** — the `filter` guard in `normalize-report.ts` + the string check on notes. **Quick win.**
3. **H2** — `readJsonBody` helper, applied to the three unguarded routes. **Quick win.**
4. **L5 + M3** — `Record<StatName, number>`, real `asPokemonTypes` guard, drop the redundant `baseStats` cast. **Quick win.**
5. **M5** — `db.ts` env check. **Quick win.**
6. **Enable `noImplicitReturns` + `noUnusedParameters`** (2 + 5 errors, both trivial), and `noUnusedLocals` after the L4 sweep.
7. Leave `exactOptionalPropertyTypes` (57), `H3` (Neon row types), and the `StatSpread` branding (H1 part 2) as their own tickets.

Items 1–5 are each self-contained, each under ~30 lines, and together close every finding above HIGH/MEDIUM except the two that need their own ticket.
