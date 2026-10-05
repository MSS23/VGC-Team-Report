# C6 — Domain-logic audit (VGC maths)

Read-only audit of the stat/SP/legality/parser core. Baseline: `vitest run` = **45 files / 477 tests, all passing** before and after this audit (no repo files changed).

All behaviour below was executed against the real modules (loaded through a Vite SSR harness in the scratchpad, repo untouched), not read off the source.

**Headline: the level-50 stat formulas, the proportional SP trim, the type chart and the parser are all correct. The SP *budget* layer is not — the 66 SP cap and the 32 SP per-stat cap are unenforceable by construction, and the top of the EV→SP ladder is off by one point.**

---

## CONFIRMED BUGS

### B1 — `evToChampionsSp` gives 32 SP for 248 EVs; the correct answer is 31

`src/lib/analysis/stat-calculator.ts:94-98`

```ts
export function evToChampionsSp(ev: number): number {
  if (ev <= 0) return 0;
  if (ev >= 248) return CHAMPIONS_MAX_SP_PER_STAT;          // ← line 96
  return Math.min(CHAMPIONS_MAX_SP_PER_STAT, Math.max(1, Math.ceil(ev / 8)));
}
```

**The authoritative curve** (CLAUDE.md, and the docstring on line 106-107): the first SP costs 4 EVs, every SP after costs 8. So the EV cost of `n` SP is

```
cost(n) = 4 + 8(n-1) = 8n - 4
cost(31) = 8*31 - 4 = 244
cost(32) = 8*32 - 4 = 252
```

248 EVs therefore buys **31** SP (244 spent, 4 EVs short of the 252 needed for the 32nd point). The guard on line 96 hands out the 32nd point for free from 248 EVs upward. Measured:

| EVs | code | correct |
|-----|------|---------|
| 244 | 31 | 31 ✓ |
| **248** | **32** | **31** ✗ |
| 249–251 | 32 | 31 ✗ |
| 252 | 32 | 32 ✓ |

Note that without the line-96 guard the general expression already produces the right answer: `ceil(248/8) = 31`. The guard is the entire bug.

**Trigger input** — `248 HP` is one of the most common values in real VGC pastes:

```
Incineroar @ Safety Goggles
Ability: Intimidate
EVs: 248 HP / 8 Atk / 252 SpD
Careful Nature
```

- wrong: `convertToChampionsSp` → `{hp: 32, atk: 1, spd: 32}` = 65/66 SP; HP = `floor((2*95+31)*50/100) + 60 + 32` = `110 + 60 + 32` = **202**
- correct: `{hp: 31, atk: 1, spd: 32}` = 64/66 SP; HP = `110 + 60 + 31` = **201**

A 4-stat spread makes the budget error visible too: `248 HP / 248 Atk / 4 Def / 8 Spe` (508 EVs) reports **66/66 "fully allocated"** when the true cost is 31+31+1+1 = **64/66**, i.e. the card tells the user they have nothing left to spend when they have 2 SP free.

**Reverse direction is wrong in the same place**: `championsSpToEv(32)` → **248**, correct **252** (`src/lib/analysis/stat-calculator.ts:109-116` searches `evToChampionsSp`, so it inherits the off-by-one). Exercised by the public converter page.

**Internal corroboration** — the app already disagrees with itself here. `src/components/report/PokemonCard.tsx:421`:

```ts
const isValidChampionsEv = (ev: number) => ev === 0 || (ev >= 4 && (ev - 4) % 8 === 0);
```

That is exactly the `8n - 4` ladder, and it classifies 248 as *not* a clean SP value (`244 % 8 = 4`), so the card simultaneously stamps the mon "Auto-converted from EVs" and charges it the full 32 SP.

**Minimal fix** — delete line 96:

```ts
export function evToChampionsSp(ev: number): number {
  if (ev <= 0) return 0;
  return Math.min(CHAMPIONS_MAX_SP_PER_STAT, Math.max(1, Math.ceil(ev / 8)));
}
```

`ceil(252/8) = 32` and `ceil(508/8) = 64 → min → 32`, so the cap still holds; monotonicity and the "never more than 32" property both survive.

**Test coverage: the wrong value is currently asserted.** `src/lib/analysis/__tests__/stat-calculator.test.ts:319-323` ("caps at 32 SP from 248 EVs upward") asserts `evToChampionsSp(248) === 32`, and `:354` asserts `championsSpToEv(32) === 248`. Note that the ladder test immediately above it (`:310-316`) deliberately stops at `sp <= 31`, which is why the contradiction never fired. The fix must flip those three assertions and add a regression test naming the bug. Four lines of marketing copy on the converter page also state the wrong figure and must move with it: `src/app/tools/ev-to-sp/page.tsx:77, 92, 191, 201, 269` ("Anything from 248 EVs upward hits the cap", "248 EVs and 252 EVs cost the same").

---

### B2 — The SP-vs-EV detection cannot see an over-budget SP spread, so it silently rewrites one into a legal-looking spread

`src/lib/analysis/stat-calculator.ts:213-217`

```ts
const totalInput = stats.reduce((sum, s) => sum + evs[s], 0);
const anyOverMax = stats.some((s) => evs[s] > CHAMPIONS_MAX_SP_PER_STAT);
if (totalInput > 0 && totalInput <= CHAMPIONS_TOTAL_SP && !anyOverMax) {
  return { ...evs };            // passthrough: "these are SP"
}
```

The predicate is *"is this spread already legal as SP?"*, not *"is this spread expressed in SP?"*. Every **illegal** SP spread therefore fails the test and is run through the EV→SP conversion a second time — a double conversion in the direction the docstring says it is guarding against.

**Trigger input** (a hand-edited or mis-remembered Champions paste, 67 SP — exactly the 66-vs-67 edge in the brief):

```
Incineroar @ Safety Goggles
Ability: Intimidate
EVs: 32 HP / 32 Atk / 3 Spe
Careful Nature
```

- wrong: total 67 > 66 → EV branch → `ceil(32/8)=4`, `ceil(32/8)=4`, `ceil(3/8)→max(1,1)=1` → `{hp: 4, atk: 4, spe: 1}`, the card shows **9/66 SP**, HP = `110 + 60 + 4` = **174**
- correct: flagged as over budget by 1 SP, stats shown at the author's 32/32/3 → HP = `110 + 60 + 32` = **202**

So a mon the user built as a maximum-bulk Incineroar renders as an almost completely uninvested one, 28 HP light, with no warning anywhere. The same happens for any per-stat overflow: `EVs: 33 HP / 10 Atk` → `{hp: 5, atk: 2}` (measured) instead of "33 SP exceeds the 32 SP per-stat cap".

**Consequence: every over-budget warning in the UI is dead code.** Because `convertToChampionsSp` now returns either a passthrough (≤66, each ≤32) or a `trimSpToBudget` result (≤66, each ≤32 via `evToChampionsSp`), `totalSp > CHAMPIONS_TOTAL_SP` and `sp > CHAMPIONS_MAX_SP_PER_STAT` are both unreachable:

- `src/components/report/PokemonCard.tsx:423` (`overSp`), `:437`, `:474` ("Over budget by N SP" — can never render), `:499` (`isOverMax`)
- `src/components/report/PokemonDetailSlide.tsx:694` (`spOver`), `:748` (`isOverMax`)

**Minimal fix** (two steps, and step 1 alone is safe):

1. Make the over-budget case detectable instead of silently re-scaled. Extract the predicate into one exported helper (`isSpFormSpread(evs)`) and widen the SP reading to *shape*, not *legality* — e.g. treat a spread as SP when `anyOverMax` is false and `total <= 192` (6 × 32, the largest arithmetically-possible SP spread) while `total > 66` additionally returns an `overBudget` flag the caller can surface. Then the existing `overSp` UI starts working.
2. Properly, carry the unit explicitly: the paste's regulation is already known at every call site (`isChampionsFormat(regulation)` gates all of them), so a `statForm: "ev" | "sp"` on `ParsedPokemon` removes the guesswork entirely. That is a type + parser change, not a tonight change.

**Test coverage: none.** `src/lib/analysis/__tests__/stat-calculator.test.ts:143-146` only covers the *legal* SP passthrough; there is no test for a 67-SP or 33-SP input.

---

### B3 — `validateChampionsTeam` can never report an SP budget violation, so 67 SP and 33 SP validate as legal

`src/lib/validation/champions-legality.ts:259-299`

```ts
const total = Object.values(p.evs).reduce((a, b) => a + b, 0);
const maxPerStat = Math.max(...Object.values(p.evs));
const looksLikeSp = total > 0 && total <= CHAMPIONS_TOTAL_SP && maxPerStat <= CHAMPIONS_MAX_SP_PER_STAT;

if (looksLikeSp) {
  // looksLikeSp guarantees every stat ≤ 32, so per-stat cap is already
  // satisfied — only the total-budget hint is worth surfacing.
  if (total < CHAMPIONS_TOTAL_SP) { /* info: n/66 SP allocated */ }
} else {
  /* …validated against the 510 / 252 EV budget… */
}
```

The SP branch is entered only when the spread is *already within budget*, and the comment is explicit that it therefore skips the cap checks. The `else` branch validates in EV units. Result: **the two caps CLAUDE.md names as Champions legality rules — 66 total, 32 per stat — have no code path that can emit an error.** Measured, `regulation = "Reg M-A"`:

| input `evs` | reported | correct |
|---|---|---|
| `32 HP / 32 Atk / 2 Spe` (66 SP) | `legal: true`, no issue | legal ✓ |
| `32 HP / 32 Atk / 3 Spe` (**67 SP**) | `legal: true` + info *"67 EVs allocated — 443 more available (Reg M-A allows 510 total)"* | **error**: over budget by 1 SP |
| `33 HP / 10 Atk` (**33 in one stat**) | `legal: true` + info *"43 EVs allocated — 467 more available"* | **error**: HP 33 SP exceeds the 32 SP cap |
| `32 HP / 32 Atk / 32 Spe` (**96 SP**) | `legal: true` + info *"96 EVs allocated — 414 more available"* | **error**: over budget by 30 SP |

The "443 more available" text is the visible tell: a Champions sheet is advising the user to spend 443 more EVs on a mon that is already 1 SP over its 66-point budget.

**Minimal fix**: once B2 exports a single `isSpFormSpread` helper, replace lines 260-262 with it and add the two missing errors inside the SP branch:

```ts
if (total > CHAMPIONS_TOTAL_SP) issues.push({ severity: "error", message: `${p.species}: ${total}/${CHAMPIONS_TOTAL_SP} SP — over budget by ${total - CHAMPIONS_TOTAL_SP}`, pokemon: p.species });
for (const [stat, v] of Object.entries(p.evs)) if (v > CHAMPIONS_MAX_SP_PER_STAT) issues.push({ severity: "error", message: `${p.species}: ${stat.toUpperCase()} ${v} SP exceeds the ${CHAMPIONS_MAX_SP_PER_STAT} SP per-stat cap`, pokemon: p.species });
```

The duplicated predicate on line 262 is itself a drift hazard — CLAUDE.md asks for one source of truth and there are currently **five** independent copies of this heuristic (stat-calculator.ts:213, champions-legality.ts:262, CompareContent.tsx:133-136, detect-archetype.ts:88-90, plus the test's own copy at stat-calculator.test.ts:284-285).

**Test coverage: none.** `src/lib/validation/__tests__/champions-legality.test.ts` covers the SP *under*-allocation info (`:148`) and the EV-path disambiguation (`:162`), but has no over-budget or over-cap case.

---

### B4 — A non-canonical nature string silently drops the ±10% modifier

`src/lib/data/natures.ts:48-53` (lookup) + `src/lib/parser/showdown-parser.ts:125-126` (capture)

```ts
nature = cleanLine.replace(/\s*Nature\s*$/i, "").trim();   // parser: verbatim, case preserved
...
const data = NATURES[nature];
if (!data) return 1;                                        // natures.ts:50 — silent 1.0x
```

The parser matches the nature line case-insensitively but stores the raw text, while `NATURES` is keyed `"Careful"`. A lowercase paste therefore parses "successfully" and loses the modifier.

**Trigger input** (measured — `nature: 'careful'`):

```
Incineroar @ Safety Goggles
Ability: Intimidate
evs: 248 hp / 8 atk / 252 spd
careful nature
- Fake Out
```

Classic-format SpD, base 90 / 31 IV / 252 EV:
`floor((2*90 + 31 + 63) * 50/100) = floor(137) = 137`; `(137 + 5) = 142`; `× 1.1 = 156.2 → 156`.

- wrong: **142** SpD (and no ▲ marker, and `NATURES[parsed.nature]` is `undefined` so `natureData` is null in both cards)
- correct: **156** SpD

**Minimal fix** — make the lookup case-insensitive, which fixes every consumer at once (`natures.ts`):

```ts
const NATURE_BY_KEY = new Map(Object.entries(NATURES).map(([k, v]) => [k.toLowerCase(), v]));
export function getNatureModifier(nature: string, stat: StatName): number {
  const data = NATURE_BY_KEY.get(nature?.trim().toLowerCase() ?? "");
  ...
}
```

Normalising in the parser instead would leave `NATURES[parsed.nature]` lookups in `PokemonCard`/`PokemonDetailSlide`/`TournamentMode` intact, so it is the better single-point fix; doing it in `natures.ts` additionally covers the inline editor and any pasted-report path.

**Test coverage: none** for a non-canonical nature in either `natures` or the parser tests.

---

### B5 — `Tera Type: Stellar` is silently discarded

`src/lib/parser/showdown-parser.ts:112-116` whitelists against `POKEMON_TYPES`, which mirrors the `PokemonType` union in `src/lib/types/pokemon.ts:2-5` — 18 types, no `Stellar`.

```
Terapagos @ Leftovers
Ability: Tera Shift
Tera Type: Stellar
EVs: 252 HP / 252 SpA / 4 Spe
Modest Nature
```

- wrong (measured): `teraType: null` — the card renders no Tera badge, `TeamStats`' Tera count under-reports, and the export round-trip loses the line
- correct: Stellar recorded and displayed

Stellar is a legal Tera type in every Gen 9 regulation the app supports (Reg F/G/H/I), so this is a live data loss, not a Champions-only concern. `grep -rn "Stellar" src/` finds it only as part of the species key `terapagos-stellar` — there is no Stellar support anywhere.

**Fix is not purely local**, which is why I am not calling it tonight-safe: `Stellar` has no row or column in `src/lib/data/type-chart.ts`, so adding it to `PokemonType` would make it a neutral 1× everywhere and would widen a union consumed by the type chart, `TypeBadge`, `type-colors`, the coverage charts and the share schemas. The contained version is a separate `teraType: PokemonType | "Stellar" | null` (or a `teraStellar: boolean`) carried through display only.

**Test coverage: none** — `showdown-parser.test.ts` covers Tera Type but not Stellar.

---

### B6 — `extractSpecies` drops the first Pokémon when a `=== … ===` header is attached to it

`src/lib/utils/extract-species.ts:9`

```ts
if (firstLine.startsWith("===")) continue;   // skips the WHOLE block
```

This is the same defect the parser already fixed (`showdown-parser.ts:181-185` strips header *lines* before splitting precisely because "a header directly followed by a Pokemon … became that block's first line and was parsed as the species, silently eating the real first Pokemon"). `extractSpecies` still skips the entire block, so it eats the first Pokémon instead.

Measured, on a header immediately followed by Incineroar with no blank line:

- `extractSpecies(paste)` → `['Rillaboom']`
- `parseShowdownPaste(paste).pokemon` → `['Incineroar', 'Rillaboom']`

Consumer: `isDifferentTeam` (same file, line 24) feeds the auto-draft "is this a different team?" decision, so a paste can be judged a different team on the strength of a species list that is missing its first entry — the exact silent-draft-loss case the function exists to prevent.

**Minimal fix** — mirror the parser:

```ts
const blocks = paste.replace(/^===.*===[ \t]*$/gm, "").trim().split(/\n\s*\n/);
```

and drop the `continue`.

**Test coverage: none** — `src/lib/utils/__tests__/extract-species.test.ts` has no attached-header case.

---

### B7 — Champions stats disagree between the cards and the tournament/overview surfaces

The three derivations named in the brief are **consistent** (see CORRECT-AS-IS below). The inconsistency is one layer out: `analyze-team.ts:21-22` computes `calculatedStats` with the *classic EV* formula for every team, Champions included, and three surfaces render that number without the SP correction even though they receive `regulation` and already branch on `isChampionsFormat` for Tera:

- `src/components/report/TeamStats.tsx:22-27` — the team Speed range (`p.calculatedStats.spe`)
- `src/components/report/TournamentMode.tsx:86` — the OTS stat grid, plus the speed orders at `:222` and `:332`
- `src/components/report/MatchupPlanSlide.tsx:67, 71, 169-173, 277` — your team's speed line and the opponent stat grid

**Trigger input** — a Champions Dragapult (base Spe 142) with `EVs: 32 Spe`, Jolly:

- `PokemonCard` / `PokemonDetailSlide` / `SpeedTierChart` (SP formula): `floor((2*142+31)*50/100) = 157`; `(157 + 5 + 32) × 1.1 = 213.4` → **213**
- `TeamStats` / `TournamentMode` / `MatchupPlanSlide` (EV formula on the SP number): `floor((284 + 31 + floor(32/4)) * 50/100) = floor(161.5) = 161`; `(161 + 5) × 1.1 = 182.6` → **182**

The same report shows the same Pokémon at 213 Spe on its card and 182 Spe in the team summary and the tournament sheet. `TournamentMode`'s `statView === "evs"` column additionally labels raw SP numbers "EVs".

Related, same root: `getItemStatBoost` (`src/lib/analysis/item-boosts.ts:43-44`, called from `analyze-team.ts:25`) picks the Booster Energy stat by scanning the EV-formula stats, so on a Champions mon it can select a different stat than the SP-correct ranking would. `PokemonCard:425-427` and `PokemonDetailSlide:735-740` re-apply `itemBoost.multiplier` to the corrected value but keep `itemBoost.stat` as chosen.

**Minimal fix**: have `analyze-team` take the regulation and produce SP-correct `calculatedStats` once, so every consumer inherits it and the per-component overrides in the three card components become redundant. That is the real fix and it is a wide diff. The contained version is to pass `regulation` into the three surfaces above and reuse `convertToChampionsSp` + `calculateChampionsStat` exactly as `SpeedTierChart:184-190` does.

**Test coverage: none** — there is no cross-surface consistency test.

---

## SUSPECTED

### S1 — Restricted Pokémon bypass the Champions dex check entirely

`src/lib/validation/champions-legality.ts:192-208`: `if (!inDex && !isRestricted && !megaInDex)`. None of the 25 names in `RESTRICTED_BASE_NAMES` (`:49-75`) is present in `CHAMPIONS_DEX` or `CHAMPIONS_MB_DEX` (checked all 25 — zero hits). So the dex check is skipped for exactly the set of species the dex never lists, and measured, a lone `Mewtwo` returns `legal: true` with only the "need 6" warning. Whether that is right depends on whether Champions Reg M-A actually offers restricted legendaries, which I cannot settle from the repo — the dex comment cites serebii for the base list and the restricted set is hand-maintained with no cross-reference. Flagging for a human: if restricted legends are *not* in Champions, this whitelists 25 species (and all their form variants, via the suffix-stripping in `getRegulationLookupKey`) into a format that bans them.

### S2 — `evToChampionsSp` over-charges EV values that are not multiples of 4

`ceil(ev/8)` vs the true `floor((ev+4)/8)` agree on every multiple of 4 (I checked the identity: for `ev = 4k`, `ceil(k/2) = floor((k+1)/2)`), which is why B1 is the only ladder defect that matters in practice. They diverge for `ev ≡ 1,2,3 (mod 8)`, none of which is a multiple of 4: measured `ev = 9, 10, 11 → 2 SP` where the ladder gives 1, and `ev = 1, 2, 3 → 1 SP` where the ladder gives 0 (fewer than the 4 EVs the first point costs). Showdown accepts such spreads but nobody writes them, so this is cosmetic; the B1 fix does not change it, and `Math.max(1, …)` is a deliberate documented choice (`:90`).

### S3 — `detect-archetype`'s SP heuristic omits the per-stat test

`src/lib/analysis/detect-archetype.ts:88-90` reads a team as SP-scaled on `total <= CHAMPIONS_TOTAL_SP` alone, with no `≤ 32` per-stat check, so it disagrees with the other four copies of the predicate. `EVs: 36 Atk / 30 Spe` (66 total, max 36) is "SP scale" here but goes down the EV path in `convertToChampionsSp`. Effect is limited to which archetype label is printed.

### S4 — The 508-vs-510 message conflicts with the cards

`src/lib/validation/champions-legality.ts:283-288` emits, for a textbook 252/252/4 spread, *"508 EVs allocated — 2 more available (Reg M-A allows 510 total)"*, while `PokemonCard.tsx:460-466` and `PokemonDetailSlide.tsx:712-718` treat 508 as the completed target (CLAUDE.md: "508 total"). One of the two should move; the comment at `:275-277` explains why the error threshold is 510, which is fine — it is the *info* nag at 508 that is wrong.

---

## CORRECT-AS-IS (with the check that convinced me)

**The level-50 stat formulas** — `stat-calculator.ts:12-21` matches the specification exactly, floor-for-floor, including that the base stat is floored *before* `+5` and the nature multiplier is applied *after*, with a final floor:

- HP, Garchomp base 108 / 31 IV / 0 EV: `floor((216+31+0) * 50/100) + 50 + 10 = floor(123.5) + 60 = 123 + 60 = 183` ✓
- HP, 252 EV: `floor((216+31+63) * 50/100) + 60 = 155 + 60 = 215` ✓
- Atk, base 130 / 31 / 252, Adamant: `floor((floor(354*50/100) + 5) * 1.1) = floor((177+5)*1.1) = floor(200.2) = 200` ✓ (Showdown agrees)
- Spe, base 102 / 31 / 252, Jolly: `floor((149+5)*1.1) = floor(169.4) = 169` ✓
- SpA, base 80 / 31 / 0, Adamant (−): `floor((95+5)*0.9) = floor(90) = 90` ✓
- Neutral natures return exactly 1 (`natures.ts:48-53`, `Serious`/`Hardy`/… have `plus: null`), so no spurious `× 1.0` floor loss.

Shedinja's `base === 1 → 1` special case is correct and applied only to HP.

**`calculateChampionsStat`** (`:29-42`) is internally consistent with the classic formula: 32 SP adds exactly 32 to HP, where 252 EVs adds 31–32 depending on parity, and adds 32 pre-nature to a non-HP stat where 252 EVs adds 31–32. Documented at `:23-28`. Note it hardcodes IV 31 by design, so an `IVs: 0 Atk` line is ignored in Champions format — intended per the docstring, worth knowing.

**The proportional SP trim — the HP-gutting bug is genuinely fixed.** `trimSpToBudget` (`:152-187`) uses integer largest-remainder with atomic tie groups. Measured: `252 HP / 252 Atk / 252 Def` → `{hp: 22, atk: 22, def: 22}` (total 66), **not** the old `2 / 32 / 32`. Permutation-independence holds (`spa/spd/spe` variants give the mirrored result), the "never inflate" invariant holds (`floor(sp_i * 66 / total) + 1 <= sp_i` whenever over budget), and 0 SP stays 0 because only strictly-positive remainders are served. The `break` on a too-large tie group can leave the budget under-spent (four stats at 32 SP → 16/16/16/16 = 64, not 66) — deliberate, documented at `:131-137`, and covered by the test at `:200-210`.

**EV→SP on the cases requested** (measured, all correct apart from B1's 248):
`0 → 0`; `4 → 1`; `8 → 1`; `12 → 2`; `252 → 32`; `252 HP / 4 Def → {hp: 32, def: 1}` (33/66, correctly *not* padded up); full 508 as `84 × 6 → 11 × 6` = 66; `252/252/4 → 32/32/1` = 65.

**The three independent SP derivations agree.** All three call the single `convertToChampionsSp` and nothing else: `PokemonCard.tsx:154` (+ `:419` for the badge), `PokemonDetailSlide.tsx:424`, `:442` (+ `:679`), `SpeedTierChart.tsx:186` (+ `:240` for Mega tiers). Same input → same spread → same stat, so they cannot disagree. `CompareContent.tsx:170` is a fourth consumer and also routes through it. The requested check passes; the divergence is B7, one layer out.

**Level handling is genuinely level-50 everywhere.** `showdown-parser.ts:95` hardcodes `const level = 50` and `:110-111` matches the `Level:` line only to discard it. Measured: `Level: 100` and `Level: 1` both yield `level: 50`. No other code path writes a level — the share payload (`url-codec.schemas.ts`) carries pastes, not levels, so a rehydrated report re-parses to 50, and `export-paste.ts:44, 107` (`if (mon.level !== 50)`) is unreachable in practice. So the `parsed.level` arguments at `PokemonCard:138/146`, `PokemonDetailSlide:400/412`, `SpeedTierChart:189`, `MatchupPlanSlide:171`, `CompareContent:167` and `analyze-team:22` are all 50, and the legality checker never reads level at all.

**Legality edges that work** (all measured):
- exactly 2 restricted → info `Restricted Pokemon (2/2)`; 3 → `error: Too many restricted Pokemon (3/2 max)` ✓
- species clause: `Incineroar` + `Incineroar` → error; `Urshifu` + `Urshifu-Rapid-Strike` → error via `baseSpecies` (`getSpeciesClauseKey:127-132`) ✓
- item clause: duplicate items error, and it is case-insensitive (`Sitrus Berry` vs `sitrus berry` both caught) ✓
- Mega legal in M-B but not M-A: `Blaziken-Mega` → error under `Reg M-A`, legal under `Reg M-B`; `CHAMPIONS_DEX.has('blaziken-mega') === false`, `CHAMPIONS_MB_DEX.has(...) === true`; the M-B-only base `Metagross` likewise errors under M-A ✓
- absent from the dex: `Bulbasaur` → error ✓
- EV budget: 512 → error, 300 in one stat → error, >510 warned in the parser too (`showdown-parser.ts:137-140`) ✓
- Z-Crystal suffix test (`"ium z"`) matches every real Z-Crystal name and nothing else ✓

**The type chart is fully correct.** I verified all 18 attacking rows of `TYPE_CHART` (`type-chart.ts:6-161`) entry by entry against the Gen 6+ chart: every immunity (Normal/Fighting→Ghost 0, Ghost→Normal 0, Electric→Ground 0, Ground→Flying 0, Psychic→Dark 0, Poison→Steel 0, Dragon→Fairy 0), every Fairy and Steel interaction, and the omit-neutral convention with `?? 1` in `getEffectiveness:174-182`. No errors. `ABILITY_IMMUNITIES:187-199` correctly includes absorb abilities (Dry Skin → Water) and correctly excludes non-type-immunity abilities, and its key normalisation handles `Lightning Rod`/`Lightningrod`.

**Parser edges all behave** (measured): `Nickname (Species) (M) @ Item` → nickname + species + gender split correctly; `Species (M) @ Item`; genderless; `Mr. Mime-Galar (M)` (a dotted name with a gender tag) ✓; hyphenated/regional `Urshifu-Rapid-Strike`, `Ogerpon-Wellspring`, `Indeedee-F`, `Zacian-Crowned` all preserved verbatim; missing nature line → `Serious` (neutral, modifier 1.0) ✓; missing IVs line → all 31 ✓; `IVs: 0 Atk` → `{atk: 0, rest: 31}` ✓; no EVs line → all-zero spread ✓; EV ordering variants (`252 HP / 252 Spe / 4 Atk`) are keyed by label not position ✓; lowercase `evs:` / `hp` keys parse ✓ (the nature *value* is the exception — B4); non-breaking-space normalisation present (`:23`, `:106`); `=== [format] Name ===` headers stripped before block splitting, including when attached to the first mon ✓; `\r\n` normalised ✓; >6 mons warned and truncated ✓.

---

## Test-coverage gaps (CLAUDE.md requires a regression test naming the bug)

| Finding | Existing coverage |
|---|---|
| B1 248 EV → 31 SP | **asserts the wrong value** — `stat-calculator.test.ts:321` and `:354` must flip |
| B2 over-budget SP passthrough / double conversion | none |
| B3 legality: 67 SP, 33-in-a-stat | none |
| B4 lowercase nature | none |
| B5 Stellar Tera | none |
| B6 extract-species attached header | none |
| B7 card-vs-TeamStats/TournamentMode Champions stats | none (no cross-surface test exists) |

## Fix-tonight assessment

- **Safe tonight, contained:** B1 (delete one line; flip 3 assertions; update 5 lines of copy on the converter page), B4 (case-insensitive nature lookup), B6 (one-line header strip).
- **Safe tonight but touches two files together:** B3's two new errors, provided B2 step 1 lands with it — they share the `isSpFormSpread` helper, and fixing B3 alone would still never fire.
- **Not tonight:** B2 step 2 (`statForm` on `ParsedPokemon` — parser + types + share schema), B5 (widens the `PokemonType` union into the type chart and every badge), B7 (the right fix moves `calculatedStats` into `analyze-team` and touches the whole report pipeline).
