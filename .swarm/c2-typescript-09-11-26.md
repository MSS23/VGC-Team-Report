# C2 — TypeScript strictness audit

- **Branch:** `swarm-nightly-2026-11-09` (cut from `origin/main` @ `10dfd74`)
- **Date:** 2026-11-09 · **TypeScript:** 5.9.3
- **Program size:** 407 `.ts`/`.tsx` under `src/` (145 in `src/lib/`) — up from 380/131 on 26-10
- **Mode:** read-only. No source file created, edited or deleted. Only write is this file.
- **Baseline gate (cold):** `node node_modules/typescript/bin/tsc --noEmit --incremental false` → **exit 0, 0 errors**. Reproduced through the scratch-config harness (also 0), so every flag count below is measured against a genuinely clean baseline.
- **Previous report read first:** `.swarm/c2-typescript-26-10-26.md`. Every finding below is tagged **ALREADY-REPORTED** (with still-present / fixed) or **NEW**.

Flag counts were measured with throwaway configs in my scratchpad that `extends` the repo
`tsconfig.json` (so `include`/`paths` still resolve against the repo root) with
`incremental: false` and one flag flipped. **I did not modify the repo's `tsconfig.json`** —
see the integrity note immediately below.

---

## ⚠️ Integrity note — `tsconfig.json` has an uncommitted edit that is not mine

`git status` shows `M tsconfig.json`. The diff is comment-only:

```diff
+    // Re-measured cold on 2026-11-09: still 0 errors each, so nothing here needs
+    // revisiting. `noImplicitReturns` was measured in the same pass and is still
+    // the only near-miss at 2 errors (NotificationBell.tsx, useShareUrl.ts) — it
+    // stays off until someone decides to make those two fixes.
```

- **I did not write this.** My brief forbids touching the repo `tsconfig.json`, and I used
  scratchpad configs that `extends` it instead.
- It appeared during tonight's run (it is dated today) and it restates, almost exactly, the
  `noImplicitReturns = 2` measurement in §6 below — which I derived independently.
- It changes no `compilerOptions`, and tsconfig comments are stripped before parsing, so
  **my measurements are unaffected**.
- Whoever owns this branch should decide whether to keep or revert it. I have left it alone.

---

## ⚠️ Addendum — another agent landed part of "Fixable tonight" while I was writing

Re-running `git status` after drafting showed 11 `src/` files modified by a concurrent agent
(the dead-code pass, by the look of it). The `tsconfig.json` comment edit noted above has
also been **reverted** — it no longer shows as modified. What landed, against my lists:

| Already done | Matches |
|---|---|
| `src/lib/data/dex-subset.ts` — `asPokemonTypes` deleted (+ its now-unused `PokemonType` import) | **Fixable-B** ✓ exactly as recommended |
| `src/lib/discord-bot.ts:50` `PRIORITY_LABELS`, `url-codec.test.ts:1` / `cron-auth.test.ts:1` `vi`, the 3 `ExploreFilters.tsx` `*_I18N` maps, `SpotlightCard.tsx:28 t`, `HomePageClient.tsx` `Link`/`summarizeChangedFields`, `Navbar.tsx` locals, `PokemonCard.tsx:180 displayData`, `ExploreContent.tsx:13 SearchCategory`, the 2 `UserButton` imports, `api/user/profile/route.ts:4 auth` | **Fixable-A** ✓ most of it |
| `src/lib/analysis/damage-calculator.ts` — `getCalcSpecies` deleted | a dead **export**, so outside `noUnusedLocals`' reach — good catch, not on my list |

**One edit works against R1 and should be reconsidered:**

```diff
- type EventType = (typeof EVENT_TYPES)[number];     // src/lib/data/tags.ts:33
```

`EventType` was dead, so deleting it is defensible on dead-code grounds — but R1's whole
point is that it was dead *because* `ReportTags.eventType` is typed `string` instead of
`EventType`. Deleting the union removes the evidence of the bug rather than the bug. Cheap to
undo: `EVENT_TYPES as const` is still there, so R1 can re-derive it in one line. Flagging so
the two passes don't fight each other — **`Archetype` and `Regulation` survived, and they are
dead for the same reason**, so a future dead-code pass will come for those too unless R1
lands first.

Since these are someone else's uncommitted edits, I have left all of them alone, and the
`Fixable tonight` section below is written against the tree as I measured it (commit
`10dfd74`), not against this working tree. Items already landed are simply done.

---

## 0. Headline

**Last night's P0 landed and it landed properly.** DANGEROUS-1 and DANGEROUS-2 (the
`MissingNo.` → `"Bird"` → `TypeBadge` crash) are genuinely fixed, not papered over:
`pkmn-dex-fallback.ts:49` now derives its valid-type set from `Object.keys(TYPE_CHART)`
instead of hand-listing it, `toPokemonTypes()` filters with a real type predicate, and both
call sites bail to `null` when nothing survives the filter. DANGEROUS-4 (the share-API
`as ShareableState`) is fixed too — `parseFetchedShareState` now `safeParse`s and fails
closed. `Stellar` was added as a Tera-only type (`TeraType`) with `TYPE_COLORS` widened to
`Record<TeraType, …>`, which is the right modelling.

**There is still not one `any` in the program** — AST scan for `SyntaxKind.AnyKeyword` over
all 407 files returns 0. No `@ts-ignore`, no `@ts-expect-error`, no `@ts-nocheck` anywhere.
`strict` plus the five VGC-261 flags remain on. `verbatimModuleSyntax` and
`strictBuiltinIteratorReturn` both still measure 0.

So, as last month, the risk is not sloppiness. It has moved: the three casts that mattered
most are gone, and what is left is **three places where a closed set is modelled as `string`
and the exhaustiveness check is thrown away**, which is category 4 of the brief. Two of them
are new, and the worst one sits in the Champions legality path — the headline feature.

The single structural root cause from last month (`PokemonType` hand-duplicated in 8 places)
is down to 7 and is still the reason finding R7/R10 exist.

---

## Fixable tonight, low risk

Mechanical, cannot change runtime behaviour, exact sites. None of these needs a judgement
call; all are `tsc`-verifiable.

### A. Delete dead code the compiler can already see (10 sites, `noUnusedLocals`/`noUnusedParameters`)

| File:line | What | Note |
|---|---|---|
| `src/lib/sharing/url-codec.ts:77` | `function toBase64Url` | The share-URL **encoder**, imported by nothing. Still dead a month later. Deleting it also removes the `url-codec.ts:80` NUIA hit. |
| `src/lib/data/tags.ts:33` | `type EventType` | Dead type. See R1 — it should be *used*, not deleted (`ReportTags.eventType?: EventType`). Either way it stops being dead. |
| `src/lib/discord-bot.ts:50` | `const PRIORITY_LABELS` | Dead map. |
| `src/app/api/user/profile/route.ts:4` | `auth` import | |
| `src/app/dashboard/DashboardContent.tsx:8`, `src/app/dashboard/profile/page.tsx:9` | `UserButton` imports | |
| `src/components/explore/ExploreContent.tsx:13` | `SearchCategory` | |
| `src/components/explore/ExploreFilters.tsx:57, 65, 73` | `CATEGORY_I18N`, `SORT_I18N`, `PLACEMENT_I18N` | 3 dead i18n maps. |
| `src/components/explore/SpotlightCard.tsx:28` | `t` | |
| `src/components/home/HomePageClient.tsx:8, 54, 158` | `Link`, `summarizeChangedFields`, `megaStates` | |
| `src/components/layout/Navbar.tsx:186, 202` | `syncStatus`, `exportMenuOpen`/`setExportMenuOpen` | |
| `src/components/report/PokemonCard.tsx:180` | `displayData` | |
| `src/hooks/useSlideSystem.ts:34` | `hiddenSlides` param | |
| `src/components/input/PasteInput.tsx:120` ×2 | `selectedTemplate`, `onTemplateSelect` | **Declared component props nothing reads** — dead API surface, not just a dead local. |
| `src/components/report/MatchupPlanSlide.tsx:456` | `onResultChange` prop | same |
| `src/components/report/pokemon-detail/CalcEntryGroup.tsx:187` | `category` prop | same |
| `src/components/report/SpeedTierChart.tsx:583` | `i` | |
| `src/lib/__tests__/cron-auth.test.ts:1`, `src/lib/sharing/__tests__/url-codec.test.ts:1` | `vi` imports | tests |

### B. Delete two no-op / dead-trap casts

- **`src/lib/data/dex-subset.ts:221-223`** — `export function asPokemonTypes(types: string[]) { return types as PokemonType[]; }`. Called by **nothing** (verified: the only grep hit is the declaration). Its body is the exact unchecked cast that produced last night's P0; `pkmn-dex-fallback.ts` wrote its own correct `toPokemonTypes` instead and left this one in the tree. Deleting it removes the trap; alternatively re-point it at the real predicate so the next caller gets the safe one.
- **`src/lib/data/pkmn-dex-fallback.ts:92`** — `entry.baseStats as StatSpread`. `DexSubsetSpecies.baseStats` (`dex-subset.ts:47`) is already structurally `StatSpread`, so the cast is a no-op — and it makes the `!baseStats` guard on line 93 read as if `baseStats` were nullable when the compiler knows it is not.

### C. Drop the redundant casts over already-zod-typed values in `POST /api/share`

`state` at `src/app/api/share/route.ts:124` is `ShareBodySchema`-parsed, so every field is
already correctly typed. These five casts assert something zod has proved, and two of them
assert something *stronger* than zod proved:

| Line | Cast | Why it should go |
|---|---|---|
| `src/app/api/share/route.ts:149` | `(state.creatorName as string)?.trim()` | zod says `string \| undefined`. The `as string` strips the `undefined`, then `?.` puts it back — so the cast is a lie that the optional chain happens to cover. A future refactor to `.trim()` crashes. |
| `:160` | `(state.creatorName as string) ?? ""` | same, `??` covers it |
| `:161` | `(state.tournamentName as string) ?? ""` | same |
| `:162` | `(state.paste as string) ?? ""` | zod says `string`, non-optional. Pure no-op. |
| `:163` | `(state.teamSummary as string) ?? ""` | same as :160 |
| `:564` | `notifyFollowers(state.creatorName as string, …)` | **the one with no `??`.** Safe only because of the 400 at :149-155. Replace with the local `creatorNameValue`, which is already narrowed. |

### D. Tighten one union that is pointlessly widened to `string`

- **`src/lib/analysis/stat-calculator.ts:205`** — `const remainder: Record<string, number> = {}` inside `trimSpToBudget`, keyed only ever by `StatName`. Change to `Record<StatName, number>` (initialise with the same 6-zero literal `trimmed` uses on line 204). Sound today; it removes 3 of the 3 NUIA hits in `stat-calculator.ts` and makes the key set checkable.

### E. Add the 7 missing return types in the domain-maths path

Unchanged from last month — none are errors, all leak inference as public API:

| Site | Annotate as |
|---|---|
| `src/lib/analysis/damage-calculator.ts:34` `calculateReportDamage` | a named `ReportDamage` interface whose `survival` is the 3-literal union, not `string` |
| `src/lib/analysis/spread-builder.ts:8` `spreadTotal` | `number` |
| `src/lib/analysis/spread-builder.ts:9` `spreadRules` | `SpreadRules` with `unit: "SP" \| "EVs"` (currently widens to `string`) |
| `src/lib/analysis/spread-builder.ts:40` `spreadStats` | `StatSpread` — today it returns **@smogon/calc's `StatsTable`**, i.e. a third-party type is the public return type of a `src/lib` function |
| `src/lib/analysis/spread-builder.ts:69` `evaluateSpread` | named interface |
| `src/lib/analysis/threat-matrix.ts:31` `findCoverageGaps` | `{ species: string; types: PokemonType[] }[]` — currently depends on TS 5.5 inferred type predicates to strip `null`, i.e. a compiler-version-dependent public signature |
| `src/lib/analysis/threat-matrix.ts:43` `defensiveWeaknesses` | `{ type: PokemonType; members: string[] }[]` |

### F. Two one-line returns (`noImplicitReturns`, 2 errors total)

- `src/components/ui/NotificationBell.tsx:78`
- `src/hooks/useShareUrl.ts:216`

Both are `useEffect` callbacks with a conditional cleanup. Adding the explicit `return;`
lets `noImplicitReturns` go on for 2 fixes — the cheapest flag in the table (§6).

---

## 1. Counts by category

| Category | 26-10 | **09-11** | Where |
|---|---:|---:|---|
| `any` — explicit `: any` / `as any` / `any[]` / `Record<string, any>` / defaulted generic | 0 | **0** | AST scan, `SyntaxKind.AnyKeyword`, all 407 files + cypress |
| `@ts-ignore` / `@ts-expect-error` / `@ts-nocheck` | 0 | **0** | — |
| `eslint-disable @typescript-eslint/*` | — | **2** | both `no-unused-vars` on deliberate rest-spread discards (`useShareUrl.ts:279`, `collaboration.ts:17`) — fine |
| Unconstrained **exported** generic | 1 | **1** | `src/lib/cache.ts:29` `cacheGet<T>` (3 more unconstrained but module-private: `share/[id]/route.ts:53`, `user/export/route.ts:97`, `useShareFlow.ts:86`) |
| Type assertions (`as X`, excl. `as const`) — production | 440 | **438** | |
| ↳ in `src/lib/` | 14* | **42** | *last month's figure under-counted; §3 has the full list. +11 genuinely new, all in `sharing/team-graphic-image.tsx` (new file) |
| ↳ double casts `as unknown as T` — production | 5 | **5** | unchanged |
| Non-null assertions (`!`) — production | 30 | **30** | §4 — **all 30 still provable; 0 DANGEROUS** |
| Exported fns in `src/lib/` with no explicit return type | 23 | **23** | identical list; §Fixable-E for the 7 that matter |
| Files never type-checked (outside `include`) | 13 | **13** | 9 × `cypress/**/*.ts`, 4 × `scripts/*.mjs` — unchanged |

---

## 2. Ranked findings — by actual risk of a user-visible bug

### R1 — `getChampionsDex` silently falls back to the **Reg M-A** dex, and the Champions reg list is hand-written in five places · **NEW** · `conflict_risk: false`

```ts
// src/lib/data/champions-dex.ts:325
export function getChampionsDex(regulation?: string | null): Set<string> {
  if (regulation === "Reg M-C") return CHAMPIONS_MC_DEX;
  if (regulation === "Reg M-B") return CHAMPIONS_MB_DEX;
  return CHAMPIONS_DEX;                    // ← M-A. Also: undefined, null, typos, Reg M-D…
}
```

`Regulation` **is** a proper exhaustive union — `src/lib/data/tags.ts:32`,
`(typeof REGULATIONS)[number]`, derived from an `as const` array that already lists
`"Reg M-A" | "Reg M-B" | "Reg M-C"`. It is then **thrown away** at the one boundary where it
crosses the whole application:

```ts
// src/lib/data/tags.ts:36-48
export interface ReportTags {
  regulation?: string;      // ← not Regulation
  eventType?: string;       // ← not EventType (which is declared at :33 and used by nothing)
  archetype?: string[];     // ← not Archetype[]
}
```

and `ShareableStateSchema` / `ShareBodySchema` both validate it as `z.string().optional()`,
not `z.enum(REGULATIONS)`. So any string at all reaches `getChampionsDex`.

**The reg membership test is now written out by hand in five independent places:**

1. `src/lib/data/tags.ts:22` — `isChampionsFormat()`, three `===` comparisons
2. `src/lib/data/champions-dex.ts:325` — `getChampionsDex()`, two `if`s + a silent default
3. `src/lib/analysis/detect-regulation.ts:59` — `CHAMPIONS_REGS` `as const`
4. `src/lib/validation/champions-legality.ts:140` — the parameter union `"Reg M-A" | "Reg M-B" | "Reg M-C" = "Reg M-A"`
5. `src/components/report/TeamOverview.tsx:389` — a **hand-written re-narrow** back down to that union:
   ```ts
   tags?.regulation === "Reg M-C" || tags?.regulation === "Reg M-B" ? tags.regulation : "Reg M-A"
   ```

Nothing in the type system connects any of the five, because (4) is the only one that names
the union and it is reached only through (5)'s manual ternary over a `string`.

**What goes wrong at runtime.** Two concrete paths, both user-visible:

- **False "illegal team" verdicts.** A team tagged Reg M-C whose regulation string differs
  by one character — `"Reg M-c"`, `"Reg MC"`, a non-ASCII hyphen pasted from a tournament
  page, or anything a hand-crafted share body sets, since zod allows any string — passes
  `isChampionsFormat`? No: it fails `isChampionsFormat` too, so the entire SP path is
  skipped and the report renders EV maths for an SP paste. That is **exactly VGC-292**
  ("a Timid Dragapult reads 182 Speed instead of 213"), which this codebase already shipped
  once.
- **Worse, the near-miss case.** When the string *is* one of the three but a new reg is
  added, (5) is the one that is easy to forget: miss it and a Reg M-D team is validated
  against the **Reg M-A** dex, so every M-B/M-C/M-D-only species is reported ILLEGAL on the
  legality sheet. Miss (2) instead and `SpeedTierChart.tsx:163`'s threat pool silently
  shrinks to M-A as well. Neither throws; both just show the user wrong answers on the
  flagship feature. `getChampionsDex`'s `return CHAMPIONS_DEX` is the unchecked default that
  makes that silent instead of a compile error.

**Fix.** Type the boundary and make the fallback explicit:

```ts
// tags.ts
export type ChampionsReg = Extract<Regulation, `Reg M-${string}`>;
export const CHAMPIONS_REGS = ["Reg M-A", "Reg M-B", "Reg M-C"] as const satisfies readonly ChampionsReg[];
export function isChampionsReg(r?: string | null): r is ChampionsReg {
  return (CHAMPIONS_REGS as readonly string[]).includes(r ?? "");
}
export interface ReportTags { regulation?: Regulation; eventType?: EventType; /* … */ }
```

then `getChampionsDex(reg: ChampionsReg)` becomes a `switch` with no `default`, so TS2366
fires the moment a fourth reg is added, and `TeamOverview.tsx:389` collapses to
`isChampionsReg(tags?.regulation) ? tags.regulation : "Reg M-A"`. `Archetype` and
`EventType` get the same treatment for free — `EventType` stops being dead code.

Worth noting the project already applies exactly this discipline one layer down and
documented it as a bug fix: `CHAMPIONS_DEX` derives its Mega entries from
`CHAMPIONS_REG_MA_MEGAS` "so divergence is impossible by construction". The *reg list*
never got the treatment.

---

### R2 — `POST /api/share` accepts five shapes that the read path then rejects, so the save succeeds and the report is permanently unopenable · **NEW** · `conflict_risk: false`

The write schema (`ShareBodySchema.state`, `src/app/api/share/route.ts:16-82`) and the read
schema (`ShareableStateSchema`, `src/lib/sharing/url-codec.schemas.ts:57`) describe the same
object and are **maintained by hand, separately**. The write side is strictly looser. The
read side fails **closed** — `parseFetchedShareState` returns `null`, `settle(null)` sets
`decodeFailed`, and the viewer gets the "corrupt link" screen.

I ran both schemas over crafted payloads (`zod` 4.6.6, the repo's own copy):

```
WRITE ok  | READ REJ | notes value not a string            →  notes: { pikachu: 7 }
WRITE ok  | READ REJ | roles value not a string            →  roles: { pikachu: 3 }
WRITE ok  | READ REJ | calcs value not an array            →  calcs: { pikachu: "oops" }
WRITE ok  | READ REJ | mvpIndex non-integer                →  mvpIndex: 1.5
WRITE ok  | READ REJ | matchupPlan missing opponentPaste   →  matchupPlans: [{ foo: 1 }]
```

The drift, field by field:

| Field | write accepts | read requires |
|---|---|---|
| `notes` | `z.record(z.string(), z.unknown())` | `z.record(z.string(), z.string())` |
| `roles` | `z.record(z.string(), z.unknown())` | `z.record(z.string(), z.string())` |
| `calcs` | `z.record(z.string(), z.unknown())` | `z.record(z.string(), z.array(…))` |
| `matchupPlans` | `z.array(z.unknown())` | `z.array(SerializedMatchupPlanSchema)` (required) |
| `mvpIndex` | `z.number().nullable()` | `z.number().int().nullable()` |
| `hiddenSlides` | `(number \| string)[]` | `string[]` | ← **tolerated** |
| `spriteSettings` | `z.unknown()` | typed record | ← **tolerated** |

The hook already knows about this class of bug and handles exactly two of the seven:
`LEGACY_TOLERANT_KEYS = ["hiddenSlides", "spriteSettings"]` (`useShareUrl.ts:70`), and the
docstring is explicit that **"Anything structural — paste, notes, matchupPlans, tags… —
still fails closed."** So the five rows above are, by design, unrecoverable: the server
stored them, and the client will never open them again. No error tells the creator why; the
report they just saved shows "corrupt link" on next load.

How reachable: the first-party client almost certainly sends strings and ints, so this is
not a today-bug for well-behaved sessions. It is reachable by (a) any direct API client,
(b) a future client change that puts a structured value in `notes`/`roles` — the write
schema will happily accept it and the read schema will brick it, and (c) rows written
before a schema tightening. The `drafts` route already takes the strict schema on the write
side (`src/app/api/user/drafts/route.ts:15` uses `ShareableStateSchema`), which shows the
right shape of the fix and makes the inconsistency hard to defend.

**Fix.** One schema, two uses. Have `ShareBodySchema` reference `ShareableStateSchema`
(the API route is server-side, so the zod bundle-size rule in `url-codec.schemas.ts` does
not apply to it) plus `.extend()` for the genuinely looser legacy keys, and keep
`LEGACY_TOLERANT_KEYS` as the *only* list of permitted divergence. Then a write the reader
cannot read becomes impossible rather than a 400-vs-brick coin flip.

---

### R3 — `renderTeamGraphic` runs on an unvalidated `Record<string, unknown>` straight from Postgres, with `as string ?? ""` doing nothing against a wrong type · **NEW** · `conflict_risk: false`

```ts
// src/lib/sharing/team-graphic-image.tsx:91-100
const privateFields = normalizePrivateFields(data.privateFields as string[] | undefined);
const rawPaste        = (data.paste as string) ?? "";
const tournamentName  = (data.tournamentName as string) ?? "";
const placement       = (data.placement as string) ?? "";
const creatorName     = (data.creatorName as string) ?? "";
const record          = (data.record as string) ?? "";
const tags            = (data.tags as { archetype?: string[]; regulation?: string; eventType?: string }) ?? {};
```

`data` is `rows[0].data as Record<string, unknown>` — the raw `shares.data` JSONB
(`src/app/api/team-graphic/route.tsx:95`). `?? ""` only catches `null`/`undefined`; it does
nothing about a value of the wrong **type**, which is precisely what a `Record<string,
unknown>` admits. Downstream, each is used as if it were definitely a string:

- `paste.trim().split(…)` → `parseTeamForGraphic` (`:15`)
- `placement.toLowerCase().trim()` → `getPlacementStyle` (`:63`)
- `tags.archetype.slice(0, 2).map(…)` (`:430`) — a string value here has `.slice` but **no `.map`**

**What goes wrong at runtime.** `GET /api/team-graphic` returns `renderTeamGraphic(...)`
directly, with **no try/catch**, from an `edge` runtime route. A single malformed value in
one share row ⇒ unhandled exception ⇒ 500 on the "Download card" button, and the same route
is what `/api/oembed` publishes as `thumbnail_url`, so the embed loses its image too. The
publish-time path (`og-image.ts:99`) *is* wrapped in try/catch, so the pre-rendered og:image
degrades to "no card" rather than erroring — which is the right behaviour and shows the
route is the odd one out.

Mitigation today: `ShareBodySchema` does validate `paste: z.string()` and `placement:
z.string().optional()`, so rows written by the current API are fine. The exposure is legacy
rows and any future write path that bypasses that schema. Severity is therefore "one bad
row breaks one share's card", not a mass outage — but it is an uncaught 500 on a public
endpoint and the fix is four lines.

**Fix.** Give `renderTeamGraphic` a typed input instead of `Record<string, unknown>` — a
small `z.object({ paste: z.string().catch(""), placement: z.string().catch(""), … })` with
`.catch()` per field so every field degrades to empty rather than throwing — and wrap the
route's return in try/catch returning a 1×1 or a 404, matching what `og-image.ts` already
does.

---

### R4 — `cacheGet<T>`'s `raw as T`: the VGC-146 schema parameter is still unadopted on the call site that matters · **ALREADY-REPORTED (DANGEROUS-3) — still present, one call site improved** · `conflict_risk: false`

```ts
// src/lib/cache.ts:35
if (!schema) return raw as T;
```

Still the repo's only unconstrained exported generic, still an unchecked cast on the
no-schema branch. Adoption since last month: **1 of 7** call sites now passes a schema —
`src/lib/sharing/og-image.ts:64` (`cacheGet(cardKey(shareId), ogCardSchema)`), new tonight.
The other six:

| Call site | Generic | Verdict |
|---|---|---|
| `src/app/api/champions/meta/route.ts:31` | `<ChampionsMetaResult>` | **the dangerous one, unchanged.** A stale Redis blob is handed to the Champions meta API typed as a valid result. After any shape change to `ChampionsMetaResult` the cache serves the old shape for a full TTL with no error. |
| `src/app/api/explore/route.ts:45` | `<{reports: unknown[]; nextCursor: string \| null}>` | partially typed; the `unknown[]` keeps it honest |
| `src/app/api/share/[id]/route.ts:216` | `<Record<string, unknown>>` | honest |
| `src/app/api/spotlight/route.ts:19` | `<{spotlight: unknown}>` | honest |
| `src/app/api/creator/[name]/route.ts:35` | `<unknown>` | honest |
| `src/app/api/user/export/route.ts:15` | `<string>` | a non-string in that rate-limit key would flow into a `Date` comparison |

**Fix** unchanged from last month: pass a schema at `champions/meta/route.ts:31`, and make
the unchecked path grep-able — `cacheGetUnchecked<T>()` as a separate export, with `schema`
required on `cacheGet`.

---

### R5 — the `ShareableState` ↔ `ShareableStateSchema` cast has spread from 1 site to 3 · **ALREADY-REPORTED (DANGEROUS-5) — worse** · `conflict_risk: false`

```
src/lib/sharing/url-codec.ts:140   return result2.data as ShareableState;
src/hooks/useShareUrl.ts:96        if (parsed.success) return parsed.data as ShareableState;      ← new
src/hooks/useShareUrl.ts:116       return retry.success ? (retry.data as ShareableState) : null;  ← new
```

Each `result.data` is already `z.infer<typeof ShareableStateSchema>`. The cast is therefore
either a no-op or a lie, and it is the lie that matters: it is the only thing standing
between the schema and the `ShareableState` interface, and it silences exactly the error you
want when the two drift apart. `CalcEntrySchema` is `z.unknown()` and the schema file says
it deliberately stays "decoupled from rapidly-evolving damage-calc shapes" — so drift is the
expected state of the world, not a hypothetical. The DANGEROUS-4 fix was correct and good,
but it propagated the drift-hiding cast to two more places while doing it.

**Fix** (one line, removes all three): pin the schema to the type once —
`export const ShareableStateSchema: z.ZodType<ShareableState> = z.object({ … })` — then all
three `return`s type-check bare, and any future schema loosening is a compile error in one
place rather than silent at every consumer. This is also the cheapest guard against R2:
with the schema pinned, the write/read pair can be generated from one source.

---

### R6 — `FieldDiffHighlight` takes `field: string`, discarding the `GlobalFieldKey` union that exists one file away · **NEW** · `conflict_risk: false`

```ts
// src/components/report/TeamReport.tsx:109
export function FieldDiffHighlight({ field, children, label }:
  { field: string | string[]; children: React.ReactNode; label?: string })
```

`src/lib/utils/version-diff.ts` is genuinely exemplary on this axis — `SectionKey` is a real
discriminated union, `GlobalFieldKey` is derived from `FIELD_LABELS` with
`as const satisfies Record<string, string>` so "a field can't be emitted without also having
a label", and `encodeSectionKey`/`parseSectionKey` make the wire format total (both switches
are exhaustive by TS2366, verified: no `default`, declared return excludes `undefined`).
All of that is then dropped at the consumer, because `changedFields` is `Set<string>` and the
component's prop is `string`.

The per-Pokemon keys do go through the encoder (`CalcsPanel.tsx:57`, `NotesPanel.tsx:9`,
`PokemonDetailLayout.tsx:48/81`, `TeamOverview.tsx:792-794`). The **global** keys do not —
they are bare literals in JSX:

```
src/components/report/MatchupSheet.tsx:64        field="matchupPlans"
src/components/report/MatchupPlanSlide.tsx:198   field="matchupPlans"
src/components/report/CommonModesSlide.tsx:173   field="commonModes"
src/components/report/TeamOverview.tsx:666       field="teamSummary"
src/components/report/TeamOverview.tsx:426, 529  field={["teamName","tournamentName","placement","record","rentalCode","creatorName","tags"]}
```

**What goes wrong at runtime.** A typo, or renaming a `FIELD_LABELS` key without grepping
the JSX, compiles cleanly and `changedFields.has(f)` just never matches. The user sees **no
blue highlight** on a field that did change — and because `DiffNavigator` navigates by
`document.querySelector('[data-diff-field="…"]')` (`DiffNavigator.tsx:33`), the Next/Prev
change buttons land on nothing and appear broken. Silent, and exactly the VGC-260 failure
mode the `SectionKey` union was introduced to end.

**Fix.** Make the prop the union. Template-literal types keep the per-Pokemon keys checkable
too, so `encodeSectionKey` can return it instead of `string`:

```ts
export type DiffFieldKey =
  | GlobalFieldKey
  | `pokemon:${number}` | `notes:${string}` | `calcs:${string}` | `roles:${string}`;
export function encodeSectionKey(key: SectionKey): DiffFieldKey { … }
// TeamReport.tsx
{ field: DiffFieldKey | DiffFieldKey[]; … }
```

Zero runtime change; the five sites above either already hold valid keys or become compile
errors.

---

### R7 — `PokemonType` is still hand-duplicated, now in 7 places · **ALREADY-REPORTED (§6) — improved 8→7, still present** · `conflict_risk: partial`

| # | Location | Status |
|---|---|---|
| 1 | `src/lib/types/pokemon.ts:1` — the union itself | still a hand-written 18-literal union, nothing derives from a `const` array |
| 2 | `src/lib/data/type-chart.ts:6` — `TYPE_CHART` keys | checked by `Record<PokemonType, …>` ✓ |
| 3 | `src/lib/data/type-chart.ts:219` — `allTypes` inside `getDefensiveProfile` | **hand-listed, unchecked** |
| 4 | `src/lib/utils/type-colors.ts:3` — `TYPE_COLORS` keys | checked by `Record<TeraType, …>` ✓ (Stellar added correctly) |
| 5 | `src/lib/parser/showdown-parser.ts:3` — `POKEMON_TYPES` | **hand-listed, module-private** |
| 6 | `src/components/report/DefensiveCoverageChart.tsx:11` — `ALL_TYPES` | **hand-listed** |
| 7 | `src/components/report/OffensiveCoverageChart.tsx:14` — `ALL_TYPES` | **hand-listed** |
| 8 | `src/components/compare/CompareContent.tsx:104` — `ALL_TYPES` | **hand-listed** |
| — | `src/lib/data/pkmn-dex-fallback.ts:49` | **now derives** from `Object.keys(TYPE_CHART)` ✓ — this is the one that got fixed |

`showdown-parser.ts:3`'s copy is the one with a user-visible consequence now that Stellar
exists: `TERA_TYPES = [...POKEMON_TYPES, "Stellar"]` (`:11`) gates which `Tera Type:` lines
the parser accepts, so adding a type to the `PokemonType` union without also editing this
private array makes the parser **silently drop** that Tera type — the badge just never
appears, no warning. (`TERA_TYPES.includes(tt as TeraType)` at `:118-119` is the
cast-on-the-guard's-own-argument idiom flagged as #10 last month; still present, still sound
today, still the idiom that produced DANGEROUS-1.)

**Fix** unchanged and still the single highest-leverage change in this report:

```ts
// src/lib/types/pokemon.ts
export const POKEMON_TYPES = ["Normal","Fire",…,"Fairy"] as const;
export type PokemonType = (typeof POKEMON_TYPES)[number];
export const TERA_TYPES = [...POKEMON_TYPES, "Stellar"] as const;
export type TeraType = (typeof TERA_TYPES)[number];
export function isPokemonType(v: string): v is PokemonType { … }
export function isTeraType(v: string): v is TeraType { … }
```

Then sites 3 and 5-8 become imports, `showdown-parser.ts:118-119` becomes
`if (isTeraType(tt)) teraType = tt;` with no cast at all, and adding a type is a compile
error in the two places that must change instead of a silent `undefined` in five.

---

### R8 — `{} as Record<PokemonType, number>` + a stale hand-listed key source · **ALREADY-REPORTED (#7) — still present** · `conflict_risk: true` (chart components)

```
src/lib/data/type-chart.ts:225                              const profile = {} as Record<PokemonType, number>;
src/components/report/OffensiveCoverageChart.tsx (ALL_TYPES-filled)  {} as Record<PokemonType, MoveCoverageResult>
```

The empty-object cast claims all 18 keys exist, then relies on `allTypes` (R7 site 3) /
`ALL_TYPES` (R7 sites 6-8) to fill them. Add a member to `PokemonType` without touching the
literal and every read of the new key is `undefined` typed `number` → `NaN` effectiveness
multipliers in the coverage charts. Downstream of R7; fix R7 first and this becomes
`Object.fromEntries(POKEMON_TYPES.map(…))` — still a cast, but provably total because the
key source *is* the union source.

---

### R9 — `diff-state.ts:102` `value as SerializedMatchupPlan[]` · **ALREADY-REPORTED (#8) — still present** · `conflict_risk: false`

```ts
// src/lib/utils/diff-state.ts:102
function asArray(value: unknown): SerializedMatchupPlan[] {
  return Array.isArray(value) ? (value as SerializedMatchupPlan[]) : [];
}
```

Any array becomes `SerializedMatchupPlan[]`. The consumer
(`matchupPlansChanged`, `:106-118`) is defensive — every field read is `?? ""` / `?? []` /
`?? null` and it `JSON.stringify`s the normalised form — so a wrong element shape produces a
wrong *comparison*, not a throw. That is the risk: this feeds `detectChangedSections`, which
decides whether to write a `share_versions` row — the table that consumed 447 MB of the
512 MB Neon free tier in July 2026. A wrong diff is a storage incident, not a wrong render.
Note R2 interacts: the write schema's `matchupPlans: z.array(z.unknown())` is what lets a
non-conforming element exist in the first place.

---

### R10 — `paste-edit.ts:106` `labels[stat as keyof typeof labels]` · **ALREADY-REPORTED (#6) — still present, downgraded** · `conflict_risk: false`

```ts
const line = Object.entries(spread).filter(([, v]) => v > 0)
  .map(([stat, value]) => `${value} ${labels[stat as keyof typeof labels]}`).join(" / ");
```

`Object.entries` gives `[string, number][]`; the cast asserts an unenumerated runtime key is
one of the 6 known ones. An extra key writes the literal string `"EVs: 5 undefined"` into
the user's paste, which Showdown then refuses to import.

**Downgraded from last month.** I traced the one path that could plausibly supply a 7-key
object — `spreadStats` (`spread-builder.ts:40`) returns `@smogon/calc`'s `rawStats`, and the
worry was `spc` leaking in from the gen-1 stat list. It does not:
`StatsTable<T> = { [stat in StatID]: T }` (`@smogon/calc/dist/data/interface.d.ts:11`) and
`'spc'` appears only in `STATS`/`displayStat` as a separate `StatID | 'spc'`. So the live
path supplies exactly 6 keys and this is latent, not live. Still worth the one-line fix
(iterate `SPREAD_STATS` instead of `Object.entries`), because `spreadStats`'s return type is
inferred from a third-party type (§Fixable-E) and a `@smogon/calc` bump could change that
without any local diff.

---

### R11 — `DiffNavigator.tsx:33` interpolates a user-derived species key into a CSS selector · **NEW** · `conflict_risk: false`

```ts
const el = document.querySelector(`[data-diff-field="${changes[next].field}"]`);
```

`field` can be `notes:<speciesKey>` / `roles:<speciesKey>` / `calcs:<speciesKey>`, and
`speciesKey` comes from the pasted team (`useHomePage.ts:95-103`, `mon.parsed.species` plus a
`-2` dedup suffix). A species or nickname containing a `"` — which the parser accepts, since
it only strips `(M)/(F)` and splits on `" @ "` — produces an invalid selector and
`querySelector` throws `SyntaxError`. It throws inside a `setTimeout`, so no `.catch()` and
no error boundary sees it: an unhandled rejection, and the Next/Prev change buttons stop
working for the rest of the session.

(`changes[next]` is also an unchecked index — `count === 0` is guarded by the early return at
`:61`, so that part is sound; `noUncheckedIndexedAccess` flags `:29` and `:33` as false
positives.)

**Fix.** `CSS.escape(changes[next].field)`, or carry the index and read
`changes[next]` from a ref'd `Map` instead of the DOM.

---

### R12 — `dex-subset.ts:105` double cast over a 127 KB JSON artifact whose producer is never type-checked · **ALREADY-REPORTED (#9) — still present** · `conflict_risk: false`

```ts
const subset = rawSubset as unknown as PackedDexSubset;
```

Mitigated by `ensureSchema()`'s `schemaVersion` check and a producer hash test, but
`scripts/build-dex-subset.mjs` — which must emit `PackedSpecies`'s positional tuple layout
exactly — is **outside the program** (§5), so the only thing tying emitter and type together
is a hand-bumped integer. `allowJs: true` is already set, so adding `**/*.mjs` to `include`
would start checking it.

---

### Explicitly assessed and found SOUND this pass

- `src/lib/validation/champions-legality.ts` — **zero casts, zero non-null assertions, explicit return types throughout.** 1 189 lines of the most safety-critical logic in the repo and it is the cleanest file in it. Its only exposure is R1, which is in its *callers*, not in it.
- `src/lib/analysis/analyze-team.ts`, `detect-archetype.ts`, `detect-regulation.ts` — same: no casts, no assertions.
- `src/lib/analysis/stat-calculator.ts:58, 74` `result as StatSpread` — `Partial<StatSpread>` accumulator filled over all 6 `StatName`s on the line above. LAZY, not dangerous.
- `src/lib/analysis/stat-calculator.ts:225` `groups.get(key)!` — key came from `[...groups.keys()]`.
- `src/lib/data/pkmn-dex-fallback.ts:116, 179` — the DANGEROUS-2 tuple sites. Now preceded by an explicit `if (types.length === 0) return null`, so `types[0]`/`types[1]` are provable. `noUncheckedIndexedAccess` still flags both; they are now **false positives** (see §6).
- `src/lib/utils/diff-state.ts:117` `normalize(newPlans[i])` — guarded by the length check on `:107`.
- `src/lib/utils/extract-species.ts:29` `firstLine.split(" @ ")[0]` — `String.split` always yields ≥1 element.
- `src/lib/data/pokemon.ts:3427` `parts[parts.length - 1]` — guarded by `parts.length >= 2`.
- `src/lib/linear.ts:139, 150` `mapping.label` — `FEEDBACK_TO_LINEAR[opts.type] ?? FEEDBACK_TO_LINEAR.other` and `other` is a literal key of the object. NUIA flags it only because the declared type is `Record<string, …>`; declaring the map `as const` removes both hits.
- `src/components/report/TeamOverview.tsx:739, 794, 801, 802` `speciesKeys[i]` — I chased a possible misalignment here (`extractSpecies` and `parseShowdownPaste` do *not* skip blocks identically) and it does not apply: `speciesKeys` is `analysis.pokemon.map(…)` (`useHomePage.ts:95-103`), so it is 1:1 with `pokemon` by construction. NUIA false positives.
- `src/lib/parser/showdown-parser.ts:84` `genderMatch[1] as "M" | "F"` — regex is `/\s+\(([MF])\)\s*$/`.
- `src/lib/sharing/redact-paste.ts:30` `f as PrivateField` — guarded by `VALID_FIELDS.has(f)`.
- `src/lib/analysis/threat-matrix.ts:38, 44` `Object.keys(TYPE_CHART) as PokemonType[]` — `TYPE_CHART` is `Record<PokemonType, …>`.
- `src/lib/notification-preferences.ts:13` `Object.keys(prefs) as (keyof NotificationPrefs)[]` — same reasoning.
- `src/lib/utils/version-diff.ts` — both `switch (key.kind)` blocks are exhaustive and *enforced* (no `default`, declared return type excludes `undefined`, so TS2366 fires on a new variant). The best-modelled file in `src/lib`.
- `src/lib/i18n/index.ts:53, 80, 84, 86` — the `Proxy` fallback makes a missing key return the English string, so a bad `LanguageCode` degrades rather than breaks. LAZY. The same `as unknown as` i18n idiom is still written three times (`i18n/index.ts:84`, `CommonModesSlide.tsx:108`, `useSlideSystem.ts:56`); adding the key to `TranslationKeys` removes all three.

---

## 3. `src/lib` type assertions — full inventory (42)

| Site | Cast | Verdict |
|---|---|---|
| `cache.ts:35` | `raw as T` | **R4** |
| `cache.ts:103` | `result[1] as string[]` | Redis boundary, LAZY |
| `sharing/url-codec.ts:140` | `result2.data as ShareableState` | **R5** |
| `sharing/url-codec.ts:108` | `bytes.buffer as ArrayBuffer` | SOUND (`SharedArrayBuffer` narrowing, TS lib artefact) |
| `sharing/team-graphic-image.tsx:91-100` (×7) | `data.paste as string` etc. | **R3** — all 7 new since 26-10 |
| `data/dex-subset.ts:222` | `types as PokemonType[]` | **Fixable-B** — dead export, unsound body |
| `data/dex-subset.ts:105` (×2) | `rawSubset as unknown as PackedDexSubset` | **R12** |
| `data/pkmn-dex-fallback.ts:92` | `entry.baseStats as StatSpread` | **Fixable-B** — no-op |
| `data/type-chart.ts:225` | `{} as Record<PokemonType, number>` | **R8** |
| `utils/diff-state.ts:102` | `value as SerializedMatchupPlan[]` | **R9** |
| `utils/diff-state.ts:95` | `value as Record<string, unknown>` | SOUND — guarded by `typeof === "object" && !Array.isArray` |
| `utils/paste-edit.ts:106` | `labels[stat as keyof typeof labels]` | **R10** |
| `parser/showdown-parser.ts:118, 119` | `tt as TeraType` | R7 — sound today, bad idiom |
| `parser/showdown-parser.ts:84` | `genderMatch[1] as "M" \| "F"` | SOUND |
| `analysis/stat-calculator.ts:58, 74` | `result as StatSpread` | SOUND (LAZY) |
| `analysis/threat-matrix.ts:38, 44` | `Object.keys(TYPE_CHART) as PokemonType[]` | SOUND |
| `sharing/redact-paste.ts:30` | `f as PrivateField` | SOUND |
| `notification-preferences.ts:13, 14` | `Object.keys(prefs) as …`, `value as Record<string, unknown>` | SOUND |
| `i18n/index.ts:53, 80, 84, 86` | 4 casts | LAZY, degrades safely |
| `utils/normalize-report.ts:13, 18, 49` | `as AnyRecord`, `as {text?, category?}`, `as {lead?, back?}` | LAZY — all read through `??` defaults |
| `web-push.ts:22, 25, 25, 29`, `notifications.ts:51` | `row.x as string` | DB-row boundary (§3.1) |

### 3.1 The DB-row boundary (~290 casts) — **ALREADY-REPORTED (§4.2), unchanged**

`getDb()` returns `NeonQueryFunction<false, false>`, rows are `Record<string, unknown>`, so
every field read is a hand-written assertion: ~184 × `as string`, ~38 × `as Date`,
~44 × `as Record<string, unknown>`, almost all in `src/app/api/**`. Not individually
dangerous — each is a developer reading their own `SELECT` — but a column rename, or an
`integer`→`bigint` migration (Postgres returns `bigint` as a *string* over the wire), is
caught nowhere. This is also **154 of the 308 non-test `noUncheckedIndexedAccess` errors**
(50%), so one `rows<T>(sql, schema)` helper that zod-parses at the query site would both
retire the casts and halve the NUIA bill. Still worth its own ticket.

---

## 4. Non-null assertions (30 in production) — **0 DANGEROUS**

Count and set are identical to 26-10 (line numbers shifted). Every one was re-traced to its
guard; all 30 are provable at runtime. The ones worth rewriting into a form the compiler can
check:

| Site | Guard | Suggested rewrite |
|---|---|---|
| `src/components/report/SpreadBuilder.tsx:52` ×6, `:53` ×2 | `outcome` is a union of two object literals; `{outcome.stats && …}` narrows `stats` but not sibling `before`/`wasted` | **Worst of the set — 8 assertions on 2 lines.** Add an `ok: true`/`ok: false` discriminant. `conflict_risk: true` |
| `src/components/report/TeamStats.tsx:34` `p.data!` | `.filter(p => p.data?.baseStats)` — filter doesn't narrow | `flatMap(p => p.data ? [sum(p.data.baseStats)] : [])` |
| `src/components/report/SpeedTierChart.tsx:21` | `if (!map.has(k)) map.set(k, [])` immediately above | `const list = map.get(k) ?? (…)` |
| `src/components/report/SpeedTierChart.tsx:203` `mon.itemBoost!` | `hasSpeedBoost = mon.itemBoost?.stat === "spe"` — a boolean doesn't narrow | inline the optional chain |
| `src/components/report/PokemonDropdown.tsx:54/59/83/94` | inside `selected ? … : …`; note `selected` is *typed* `AnalyzedPokemon \| null` but can be `undefined` at runtime (out-of-range index) — truthiness covers it, the type does not | |
| `src/components/explore/ReportCard.tsx:297` `report.tags!` | `hasTagsSection = !!report.tags?.eventType` | just use `report.tags?.eventType` |
| `src/lib/db.ts:4` `process.env.DATABASE_URL!` | env contract; `neon()` throws anyway | explicit `throw` gives a better message |
| `src/lib/rate-limit.ts:24` `redis!` · `src/lib/sharing/collaboration.ts:33` `char.codePointAt(0)!` · `src/lib/analysis/stat-calculator.ts:225` `groups.get(key)!` · `src/app/api/cron/weekly-report/route.ts:22` `apiKey!` | all provable | leave |
| remainder (`dashboard/profile:283`, `FeedbackContent:111`, `Navbar:966`, `BrowserPushSettings:61`, `LanguageSelector:12`, `ReportCard:237`, `MatchupPlanSlide:286`, `HomePageClient:1159/1230`) | guarded, or `.find()` over a closed literal list | leave |

---

## 5. Files the tsconfig never type-checks — **unchanged (13)**

`"exclude": ["node_modules", "cypress"]` plus an `include` listing `**/*.ts`, `**/*.tsx`,
`**/*.mts` — but **not** `**/*.mjs`:

- **9 × `cypress/**/*.ts`** — the whole E2E suite. 0 `any`, so nothing is hidden today, but a
  spec can reference a renamed export and CI stays green (`ci.yml` runs tsc/eslint/vitest;
  Cypress is not in the gate). Fix: `cypress/tsconfig.json` + its own `tsc --noEmit` step.
- **4 × `scripts/*.mjs`** — including `scripts/build-dex-subset.mjs`, the emitter R12's double
  cast trusts.

---

## 6. tsconfig flag table — measured cold, 2026-11-09

Each row is a real run: scratch config extending the repo tsconfig, `incremental: false`,
one flag flipped, full program. Baseline = **0 errors**.

### Already ON (confirmed, no change)

`strict` (⇒ `strictNullChecks`, `noImplicitAny`, `strictFunctionTypes`, `strictBindCallApply`,
`strictPropertyInitialization`, `useUnknownInCatchVariables`, `alwaysStrict`,
`noImplicitThis`) · `noImplicitOverride` · `noFallthroughCasesInSwitch` ·
`noUncheckedSideEffectImports` · `allowUnreachableCode: false` · `allowUnusedLabels: false`.

### Currently OFF — measured

| Flag | Total | non-test | `src/lib` non-test | Δ vs 26-10 | What it catches here | Recommend |
|---|---:|---:|---:|---|---|---|
| **`noImplicitReturns`** | **2** | **2** | **0** | *not measured before* | `NotificationBell.tsx:78`, `useShareUrl.ts:216` — both `useEffect` callbacks with a conditional cleanup, i.e. the return-undefined-sometimes shape React cares about. | **YES — cheapest flag in the table, 2 fixes.** |
| **`noUnusedParameters`** | **5** | **5** | **0** | = | 3 of the 5 are **declared component props nothing reads** — dead API surface. | **YES — trivial.** |
| **`noUnusedLocals`** | **21** | **19** | **3** | = | Real dead code, incl. `url-codec.ts:77 toBase64Url` (the share-URL *encoder*, imported by nothing), `tags.ts:33 EventType`, `discord-bot.ts:50 PRIORITY_LABELS`, 3 dead `*_I18N` maps. | **YES — cheap, and it still finds a dead half of the share codec.** |
| **`noUncheckedIndexedAccess`** | **495** | **308** | **39** | +101 / +20 / +6 | See the honest reassessment below. | **YES strategically, staged — but it no longer catches a live bug.** |
| `exactOptionalPropertyTypes` | 80 | 79 | 9 | +6 / +6 / = | Still almost entirely the benign `teamName?: string` ← `string \| undefined` shape (`showdown-parser.ts:233/252` are literally that), plus 5 `@smogon/calc`/PostHog third-party param objects. Real bugs found: **0**. Concentrated in `HomePageClient.tsx` (10), `useHomePage.ts` (7), `TeamReport.tsx` (7). | **No (low ROI).** |
| `noPropertyAccessFromIndexSignature` | 737 | 669 | 116 | +56 | Forces `row.foo` → `row["foo"]` across the DB layer. Enormous churn, finds no bug, makes §3.1 *worse* to read. | **No.** |
| `verbatimModuleSyntax` | **0** | 0 | 0 | = | Confirms the tsconfig note. Changes import-elision **emit**, not only diagnostics, so it still needs its own commit behind a real `next build`. The existing comment is correct. | Defer (as documented). |
| `strictBuiltinIteratorReturn` | **0** | 0 | 0 | *not measured before* | Clean. Narrows `IteratorResult` on built-in iterators; nothing in the repo relies on the loose form. | **YES — free, 0 errors.** Fold into the VGC-261 block. |
| A + B + C + F together (the four cheap ones) | **28** | **26** | **3** | — | — | **land tonight** |

### `noUncheckedIndexedAccess` — the honest reassessment

Last month I called this "the only flag in the table that catches an actual production
defect", and that was true: it pinpointed DANGEROUS-2 at `pkmn-dex-fallback.ts:83/139`.
**Those two sites are now fixed, and NUIA still flags them** (`:116`, `:179`) — the explicit
`types.length === 0` bail makes `types[0]` provable to a human but not to the compiler. So
as of tonight:

- **Live bugs NUIA would catch in `src/lib`: 0.** I traced all 39. Every one is sound at
  runtime (see §2 "found SOUND"); they are false positives on provable patterns.
- **What it is still worth:** it is the only mechanism that would have caught DANGEROUS-2
  *before* it shipped, and the only thing that stops it coming back the next time someone
  builds a `[T] | [T, T]` tuple from a filtered array. The 39 `src/lib` hits are the price
  of that guarantee, and ~30 of them are one-line destructures or `?? default`.
- **The cost is concentrated, not diffuse:** **154 of 308 non-test errors (50%) are in
  `src/app/api/**`**, and they are all the DB-row-indexing pattern §3.1 already wants
  refactored behind a typed row reader. Do that refactor and half the NUIA bill disappears as
  a side effect, which is a better argument for the flag than the flag itself.

**Suggested staged adoption** (unchanged in shape, updated counts):

1. **Stage 0 — tonight.** `noUnusedLocals` + `noUnusedParameters` + `noImplicitReturns` +
   `strictBuiltinIteratorReturn` = **28 fixes, 0 judgement calls.**
2. **Stage 1 — `src/lib` only (39 errors, all false positives, 0 in conflict-risk files).**
   Hot files: `showdown-parser.ts` (8), `random-accent.ts` (7, trivial),
   `paste-edit.ts` (7), `team-graphic-image.tsx` (4), `stat-calculator.ts` (3, removed
   outright by Fixable-D), `extract-species.ts` (2), `linear.ts` (2, removed by `as const`),
   `pkmn-dex-fallback.ts` (2), `og-image.ts`/`url-codec.ts`/`diff-state.ts`/`pokemon.ts` (1 each).
   Enforce with an `src/lib/tsconfig.json` until the whole program is clean.
3. **Stage 2 — the typed DB row reader** (§3.1). Removes ~154 of the API errors.
4. **Stage 3 — components/hooks (~115).** 5. **Stage 4 — tests (187).** 6. Flip the flag.

---

## 7. Status of every 26-10 finding

| 26-10 | Status tonight |
|---|---|
| DANGEROUS-1 `as PokemonType[]` → `TypeBadge` crash | **FIXED.** `toPokemonTypes` filters with a real predicate; `VALID_POKEMON_TYPES` derives from `Object.keys(TYPE_CHART)`. Commit `418be74`. |
| DANGEROUS-2 `types[0]` on a possibly-empty array | **FIXED.** Explicit `length === 0 → return null` at both sites, exactly as recommended. |
| DANGEROUS-3 `cacheGet<T>`'s `raw as T` | **STILL PRESENT** → R4. 1 of 7 call sites adopted a schema. |
| DANGEROUS-4 share payload `as ShareableState` | **FIXED.** `parseFetchedShareState` + `LEGACY_TOLERANT_KEYS`. Commit `282dbed`. |
| DANGEROUS-5 `result2.data as ShareableState` | **STILL PRESENT and spread 1→3 sites** → R5. |
| #6 `paste-edit.ts` `labels[stat as …]` | STILL PRESENT → R10, downgraded (live path proven 6-key). |
| #7 `{} as Record<PokemonType, …>` | STILL PRESENT → R8. |
| #8 `diff-state.ts:102` | STILL PRESENT → R9. |
| #9 `dex-subset.ts:105` double cast | STILL PRESENT → R12. |
| #10 `tt as PokemonType` guard idiom | STILL PRESENT as `tt as TeraType` → R7. |
| §6 `PokemonType` duplicated ×8 | STILL PRESENT, now ×7 → R7. One site fixed. |
| §7 13 unchecked files | STILL PRESENT, unchanged → §5. |
| §3 23 missing return types | STILL PRESENT, identical list → Fixable-E. |
| §5 30 non-null assertions, 0 dangerous | STILL PRESENT, identical set, re-verified → §4. |
| §4.2 ~290 DB-row casts | STILL PRESENT → §3.1. |

**New tonight:** R1 (Champions reg union discarded), R2 (write/read schema drift), R3
(`renderTeamGraphic` unvalidated input), R6 (`FieldDiffHighlight` prop widened to `string`),
R11 (`DiffNavigator` selector interpolation). R1, R2, R3 all arrived with the two new
features in this window (`e4d9354` og:image pre-render, `1fa2e4a` speed tiers / `b14c717`
SP maths).

---

## 8. Conflict-risk index

`.swarm/main-changed-files.md` is **empty** for this run ("Files changed on main in the last
7 days" has no entries), so there is no conflict-risk set to intersect against tonight.
Every finding above is marked `conflict_risk: false` on that basis, with the caveat that the
list was empty rather than checked. R6 and R8 touch shared report components
(`TeamReport.tsx`, the coverage charts) that other agents commonly edit, so coordinate those
two if another agent is in `src/components/report/`.

---

## 9. Suggested ticket split

| Priority | Scope | Files | Conflict |
|---|---|---|---|
| **P1** | **R1** — `ChampionsReg` type + `isChampionsReg` predicate, `ReportTags.regulation: Regulation`, `getChampionsDex` to an exhaustive `switch`, collapse the 5 hand-written reg lists. Regression test named for the bug: a reg string outside `REGULATIONS` must not silently validate against the M-A dex. | `tags.ts`, `champions-dex.ts`, `champions-legality.ts`, `detect-regulation.ts`, `TeamOverview.tsx` | none |
| **P1** | **R2** — one schema for the share shape; `ShareBodySchema` derives from `ShareableStateSchema`; `LEGACY_TOLERANT_KEYS` becomes the only sanctioned divergence. Pair with **R5** (pin `ShareableStateSchema: z.ZodType<ShareableState>`, drop all 3 casts). | `url-codec.schemas.ts`, `url-codec.ts`, `api/share/route.ts`, `useShareUrl.ts` | none |
| **P2** | **R3** — typed `.catch()`-per-field input for `renderTeamGraphic`; try/catch the edge route. | `team-graphic-image.tsx`, `api/team-graphic/route.tsx` | none |
| **P2** | **Fixable tonight** — A (dead code) + B (2 casts) + C (6 redundant casts) + D + F, then turn on `noUnusedLocals`, `noUnusedParameters`, `noImplicitReturns`, `strictBuiltinIteratorReturn`. 28 compiler-verified fixes. | ~21 files + `tsconfig.json` | `tsconfig.json` shared |
| **P2** | **R7** — derive `PokemonType`/`TeraType` from `as const` arrays, add `isPokemonType`/`isTeraType`, collapse the 5 remaining hand-listed copies. Removes R8 and the R7 Tera-drop risk. | `types/pokemon.ts` + 5 call sites | some |
| **P2** | **R4** — schema at `cacheGet<ChampionsMetaResult>`; split out `cacheGetUnchecked<T>`. | `cache.ts`, `champions/meta/route.ts` | none |
| **P3** | **R6** — `DiffFieldKey` template-literal union; `encodeSectionKey` returns it; `FieldDiffHighlight` prop typed. | `version-diff.ts`, `TeamReport.tsx` + 5 JSX sites | some |
| **P3** | **Fixable-E** — explicit return types on the 7 `src/lib/analysis` exports (incl. `survival` and `unit` as literal unions, and `spreadStats: StatSpread` to stop a third-party type being public API). | 3 files | none |
| **P3** | **R11** — `CSS.escape` in `DiffNavigator`. | `DiffNavigator.tsx` | none |
| **P3** | **R9** / **R10** — per-element validation in `asArray`; iterate `SPREAD_STATS` in `replacePokemonSpread`. | `diff-state.ts`, `paste-edit.ts` | none |
| **P3** | §3.1 — typed DB row reader; retires ~290 casts and ~154 future NUIA errors. | `db.ts` + API routes | some |
| **P3** | §5 — type-check `cypress/**` and `scripts/*.mjs`. | `tsconfig.json`, new `cypress/tsconfig.json` | shared |
| **P4** | NUIA Stage 1 (`src/lib`, 39 errors, all false positives). | 12 files | none |
| **P4** | `SpreadBuilder.tsx` `outcome` discriminant — retires 8 non-null assertions. | `SpreadBuilder.tsx` | some |

---

*Audit was read-only: no source file created, edited or deleted; the repo `tsconfig.json`
was not modified by me (see the integrity note at the top — it carries someone else's
uncommitted comment-only edit). Scratch flag configs were written to the session scratchpad
outside the repo.*
