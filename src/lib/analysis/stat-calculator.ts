import type { StatSpread, StatName } from "@/lib/types/pokemon";
import { getNatureModifier } from "@/lib/data/natures";

export function calculateStat(
  stat: StatName,
  base: number,
  iv: number,
  ev: number,
  level: number,
  nature: string
): number {
  if (stat === "hp") {
    if (base === 1) return 1; // Shedinja
    return Math.floor(((2 * base + iv + Math.floor(ev / 4)) * level) / 100) + level + 10;
  }

  const natureMod = getNatureModifier(nature, stat);
  return Math.floor(
    (Math.floor(((2 * base + iv + Math.floor(ev / 4)) * level) / 100) + 5) * natureMod
  );
}

/**
 * Pokemon Champions stat calculation using Stat Points (SP).
 * IVs are always 31, level is always 50.
 * HP:    floor((2 * Base + 31) * 50 / 100) + 60 + SP
 * Other: floor((floor((2 * Base + 31) * 50 / 100) + 5 + SP) * Nature)
 */
export function calculateChampionsStat(
  stat: StatName,
  base: number,
  sp: number,
  nature: string,
): number {
  const basePart = Math.floor((2 * base + 31) * 50 / 100);
  if (stat === "hp") {
    if (base === 1) return 1; // Shedinja
    return basePart + 60 + sp;
  }
  const natureMod = getNatureModifier(nature, stat);
  return Math.floor((basePart + 5 + sp) * natureMod);
}

export function calculateAllStats(
  baseStats: StatSpread,
  ivs: StatSpread,
  evs: StatSpread,
  level: number,
  nature: string
): StatSpread {
  const stats: StatName[] = ["hp", "atk", "def", "spa", "spd", "spe"];
  const result: Partial<StatSpread> = {};

  for (const stat of stats) {
    result[stat] = calculateStat(stat, baseStats[stat], ivs[stat], evs[stat], level, nature);
  }

  return result as StatSpread;
}

/** Calculate all stats using Champions SP system. */
export function calculateAllChampionsStats(
  baseStats: StatSpread,
  sps: StatSpread,
  nature: string,
): StatSpread {
  const stats: StatName[] = ["hp", "atk", "def", "spa", "spd", "spe"];
  const result: Partial<StatSpread> = {};

  for (const stat of stats) {
    result[stat] = calculateChampionsStat(stat, baseStats[stat], sps[stat], nature);
  }

  return result as StatSpread;
}

/**
 * Abilities that double Speed while their condition holds (Showdown
 * `onModifySpe` -> `chainModify(2)`): Swift Swim in rain, Chlorophyll in sun,
 * Sand Rush in sand, Slush Rush in snow, Unburden once the held item is gone.
 */
const SPEED_DOUBLING_ABILITIES = new Set(["swift swim", "chlorophyll", "sand rush", "slush rush", "unburden"]);

export function hasSpeedDoublingAbility(ability: string | null | undefined): boolean {
  return !!ability && SPEED_DOUBLING_ABILITIES.has(ability.trim().toLowerCase());
}

/**
 * In-battle Speed, following the game engine (Showdown `getActionSpeed`):
 *  1. stat stage, clamped to -6..+6 (Icy Wind is -1 -> floor(stat x 2/3);
 *     +1 -> floor(stat x 3/2); +2 -> stat x 2)
 *  2. every Speed modifier chained into ONE multiply — item boost
 *     (Choice Scarf, Booster Energy x1.5), a doubling ability (Swift Swim,
 *     Chlorophyll, Sand Rush, Slush Rush, Unburden x2) and Tailwind x2 —
 *     rounded half-down
 *  3. paralysis x0.5 floored last (Gen 7+ applies it after all other modifiers)
 * Applying Tailwind/paralysis as separate floored steps is off by one for odd
 * speeds: 101 Spe Scarf + Tailwind is 303, not 302.
 */
export function calcBattleSpeed(
  speed: number,
  boostMultiplier: number,
  mods: { stage?: number; icyWind?: boolean; tailwind?: boolean; paralysis?: boolean; abilityDouble?: boolean },
): number {
  const stage = Math.max(-6, Math.min(6, (mods.stage ?? 0) - (mods.icyWind ? 1 : 0)));
  // Showdown boostTable [1, 1.5, 2, 2.5, 3, 3.5, 4]: multiply when positive, divide when negative.
  let s = stage >= 0 ? Math.floor((speed * (2 + stage)) / 2) : Math.floor((speed * 2) / (2 - stage));
  const chained = boostMultiplier * (mods.abilityDouble ? 2 : 1) * (mods.tailwind ? 2 : 1);
  if (chained !== 1) s = Math.ceil(s * chained - 0.5); // pokeRound: .5 rounds down
  if (mods.paralysis) s = Math.floor(s / 2);
  return s;
}

/**
 * Turn-order comparator: fastest first, or slowest first under Trick Room
 * (Showdown orders by 10000 - speed, which is the same ordering).
 */
export function compareTurnOrder(a: number, b: number, trickRoom: boolean): number {
  return trickRoom ? a - b : b - a;
}

/** Champions SP budget constants. */
export const CHAMPIONS_MAX_SP_PER_STAT = 32;
export const CHAMPIONS_TOTAL_SP = 66;

/** Highest EV value that can be placed in a single stat. */
export const MAX_EV_PER_STAT = 252;

/**
 * Per-stat EV → SP cost. The single source of truth for the conversion curve;
 * `convertToChampionsSp` and `championsSpToEv` are both built on it so the two
 * directions can never disagree.
 *
 *  - 0 EVs            → 0 SP
 *  - any investment   → at least 1 SP (so the usual 4-EV chip costs 1 SP)
 *  - otherwise        → ceil(EV / 8), i.e. every further 8 EVs buys 1 more SP
 *  - 248+ EVs         → the 32 SP per-stat cap
 */
export function evToChampionsSp(ev: number): number {
  if (ev <= 0) return 0;
  if (ev >= 248) return CHAMPIONS_MAX_SP_PER_STAT;
  return Math.min(CHAMPIONS_MAX_SP_PER_STAT, Math.max(1, Math.ceil(ev / 8)));
}

/**
 * Reverse direction: the smallest EV investment (in the 4-EV steps the games
 * actually use) that converts to exactly `sp` Stat Points.
 *
 * Derived by searching `evToChampionsSp` rather than re-deriving the algebra,
 * so the two functions cannot drift apart. Yields the familiar ladder
 * 1 SP = 4 EVs, 2 SP = 12 EVs, 3 SP = 20 EVs … 32 SP = 248 EVs — the first SP
 * costs 4 EVs and each one after it costs 8.
 */
export function championsSpToEv(sp: number): number {
  if (sp <= 0) return 0;
  const target = Math.min(Math.ceil(sp), CHAMPIONS_MAX_SP_PER_STAT);
  for (let ev = 0; ev <= MAX_EV_PER_STAT; ev += 4) {
    if (evToChampionsSp(ev) === target) return ev;
  }
  return MAX_EV_PER_STAT;
}

/**
 * Trim an over-budget SP spread back to `CHAMPIONS_TOTAL_SP`.
 *
 * Policy: **proportional (largest-remainder) trim, with atomic tie groups.**
 * Every stat keeps the same share of the budget it had of the original total,
 * so the *shape* of the spread survives. Concretely, for each stat:
 *
 *     exact_i = sp_i * 66 / total      (kept in integer arithmetic)
 *     base_i  = floor(exact_i)
 *
 * `66 - Σ base_i` whole points are then handed out one each to the stats with
 * the largest fractional remainders (the Hamilton / largest-remainder method).
 *
 * The one deliberate refinement: a remainder tie is handled **as a group or
 * not at all**. If the stats tied at the top remainder outnumber the points
 * left to hand out, those points stay unspent rather than being awarded to
 * whichever stat happens to sort first. That is the whole point of this
 * function — the previous implementation removed the excess from the
 * lowest-SP stats using a stable sort over the hardcoded
 * ["hp","atk","def","spa","spd","spe"] array, so with several stats tied at
 * 32 SP the array index alone decided the loser and HP was zeroed every time
 * (252/252/252 HP/Atk/Def rendered as 2 HP / 32 Atk / 32 Def).
 *
 * The result therefore depends only on the SP values themselves, never on
 * which index a stat occupies. Relabelling the stats permutes the output the
 * same way it permutes the input, and reordering the iteration array changes
 * nothing at all.
 *
 * Two invariants this must never violate:
 *  - it only ever *reduces* a stat (`base_i + 1 <= sp_i` always holds when the
 *    spread is over budget), so trimming can never fabricate investment; and
 *  - a stat sitting at 0 SP stays at 0 SP, because its remainder is 0 and only
 *    strictly positive remainders receive a point.
 */
function trimSpToBudget(sp: StatSpread, stats: StatName[]): StatSpread {
  const total = stats.reduce((sum, s) => sum + sp[s], 0);
  if (total <= CHAMPIONS_TOTAL_SP) return sp;

  // Integer arithmetic throughout: `remainder` is an exact numerator, so two
  // stats with genuinely equal shares always compare equal (floating-point
  // remainders would not, and near-ties would silently break the tie rule).
  const trimmed: StatSpread = { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };
  const remainder: Record<string, number> = {};
  for (const stat of stats) {
    const numerator = sp[stat] * CHAMPIONS_TOTAL_SP;
    trimmed[stat] = Math.floor(numerator / total);
    remainder[stat] = numerator % total;
  }

  let leftover = CHAMPIONS_TOTAL_SP - stats.reduce((sum, s) => sum + trimmed[s], 0);

  // Group stats by their exact remainder, then walk the groups from the
  // largest remainder down. A group is served in full or skipped entirely.
  const groups = new Map<number, StatName[]>();
  for (const stat of stats) {
    if (remainder[stat] <= 0) continue;
    const group = groups.get(remainder[stat]);
    if (group) group.push(stat);
    else groups.set(remainder[stat], [stat]);
  }

  for (const key of [...groups.keys()].sort((a, b) => b - a)) {
    const group = groups.get(key)!;
    if (group.length > leftover) break;
    for (const stat of group) trimmed[stat] += 1;
    leftover -= group.length;
  }

  return trimmed;
}

/**
 * Does this stat line hold **Stat Points** or **EVs**?
 *
 * Showdown has no "SPs:" line yet, so a Champions paste carries its SP values
 * inside the `EVs:` line (e.g. "EVs: 22 HP / 11 Def / 24 SpA / 4 SpD / 5 Spe",
 * 66 SP). Everything that calls this is already behind
 * `isChampionsFormat(regulation)`, so the question is never "is this a
 * Champions team" — it is only "which unit are these six numbers in".
 *
 * Three rules, in order:
 *
 *  1. **A value above `CHAMPIONS_MAX_SP_PER_STAT` proves EV units.** 32 is the
 *     hard per-stat cap, so no Stat Point value can exceed it.
 *  2. **Inside the 32-per-stat cap *and* the 66-point budget, the SP reading
 *     wins.** This is a spread that is valid as written in SP, and reading it
 *     as EVs would collapse "5 Spe" to 1 SP and wreck the speed tiers.
 *  3. **Over budget, the line is read as EVs unless it is visibly SP-shaped.**
 *     A total above 66 cannot be a *valid* SP spread, so one of the two
 *     readings is a mistake — see the trade-off below.
 *
 * ### Why rule 3 is not simply "over budget ⇒ EVs"
 *
 * The predicate here used to be exactly that (`total <= 66 && every value
 * <= 32`), and it had a bad failure of its own: a genuine but **over-budget**
 * SP spread failed the test, was pushed through the EV→SP conversion a second
 * time, and came back as a legal-looking spread. `EVs: 32 HP / 32 Atk / 3 Spe`
 * (67 SP) became 4/4/1 — an Incineroar rendered at 174 HP where its author
 * built 202 — and because the output always landed back inside budget, every
 * "Over budget by N SP" warning in the report UI and the 66-total check in
 * `validateChampionsTeam` were unreachable code.
 *
 * Dropping the total clause outright fixed that but opened the mirror-image
 * hole: a genuine **EV** line whose every value happens to be ≤ 32 and whose
 * total exceeds 66 — `EVs: 28 HP / 28 Def / 20 SpD`, 76 — was read verbatim as
 * 76 SP. HP was computed from 28 SP instead of the 4 SP that 28 EVs actually
 * buy, every stat and speed tier on the report was wrong, and the legality
 * sheet additionally accused the author of being "over budget by 10 SP" for a
 * spread that is perfectly legal as EVs.
 *
 * Both readings of an over-budget, all-≤-32 line therefore produce silently
 * wrong stats; from the six numbers alone the case is genuinely undecidable.
 * So rule 3 asks for positive evidence of SP units before keeping the SP
 * reading, and there are two tells:
 *
 *  - **A stat sitting exactly on the 32 SP cap.** Maxing a stat is the single
 *    most common thing an SP author does, and 32 is where that lands. As an EV
 *    figure, 32 is an unremarkable mid-size chip with nothing special about it.
 *  - **A value that is not a multiple of 4.** EVs only pay out in fours — the
 *    stat formula floors `ev / 4`, so Showdown writes EV lines in 4-EV steps
 *    and anything else is wasted. SP adds to the stat 1:1, so 11 Def and 5 Spe
 *    are ordinary SP values and impossible-to-justify EV ones.
 *
 * An over-budget line with neither tell (every value a multiple of 4, none at
 * the cap) is read as EVs, which is what makes `28 / 28 / 20` convert again.
 *
 * ### Boundaries
 *
 *  - Total exactly 66 ⇒ SP (rule 2; the budget is inclusive).
 *  - A single value exactly 32 ⇒ within the cap, so still eligible for SP.
 *  - An all-zero spread ⇒ `false`. A paste with no `EVs:` line parses to all
 *    zeros, and there is no investment to pick a unit for; the conversion maps
 *    zeros to zeros either way, so this only keeps the legality sheet from
 *    announcing "0/66 SP" at a team that never mentioned stats.
 *  - A spread valid under **both** readings (in cap, in budget — e.g.
 *    `22 / 11 / 24 / 4 / 5`, legal as 66 SP and as 66 EVs) resolves to **SP**,
 *    per rule 2: inside a Champions report the author wrote SP, and the EV
 *    reading would silently discard most of their investment.
 *  - A spread over budget but carrying a tell (e.g. `32 HP / 28 Def / 20 SpD`,
 *    80) resolves to **SP** and shows as over budget, which is the honest
 *    answer: an SP author is told their spread is illegal rather than being
 *    shown numbers nobody built.
 *
 * `validateChampionsTeam` shares this one function so the display and the
 * legality sheet can never disagree about which unit they are reading.
 *
 * Known residual: a spread with a *single* value just over the cap and a small
 * total (`EVs: 33 HP / 10 Atk`) is read as EVs by rule 1, so the 32 SP
 * per-stat cap cannot be enforced from the numbers alone. Any rule that caught
 * it would also have to re-read ordinary partial EV lines such as `EVs: 60 HP`
 * as a 60 SP investment, which is worse. The real fix for the whole guess is
 * to carry the unit explicitly (a `statForm: "ev" | "sp"` on `ParsedPokemon`,
 * set by the parser), which removes it entirely.
 */
export function isSpFormSpread(evs: StatSpread): boolean {
  const stats: StatName[] = ["hp", "atk", "def", "spa", "spd", "spe"];
  if (stats.every((s) => evs[s] <= 0)) return false;

  // Rule 1 — a value above the per-stat cap cannot be a Stat Point value.
  if (stats.some((s) => evs[s] > CHAMPIONS_MAX_SP_PER_STAT)) return false;

  // Rule 2 — in cap and in budget: a spread that is valid as written in SP.
  const total = stats.reduce((sum, s) => sum + evs[s], 0);
  if (total <= CHAMPIONS_TOTAL_SP) return true;

  // Rule 3 — over budget, so one reading is a mistake. Keep SP only on
  // positive evidence of SP units: a stat pinned to the 32 SP cap, or a value
  // that is not a multiple of 4 and so cannot be a sensible EV figure.
  return stats.some(
    (s) => evs[s] === CHAMPIONS_MAX_SP_PER_STAT || (evs[s] > 0 && evs[s] % 4 !== 0),
  );
}

/**
 * Convert a traditional EV spread to a Champions SP spread.
 *
 * Preserves the intent of the original spread and nothing more:
 *  - 252 EVs → 32 SP (full investment)
 *  - 4 EVs   → 1 SP (minimum investment)
 *  - 0 EVs   → 0 SP
 *
 * A spread is **never inflated**. Unused budget stays unused — a 252 HP / 4 Def
 * paste converts to 32 HP / 1 Def and leaves 33 of the 66 SP unspent, because
 * the player did not pay for more than that. (The report UI shows the
 * `n/66` counter and the legality validator surfaces the shortfall.)
 * Over-budget spreads are trimmed proportionally; see `trimSpToBudget`. That
 * applies only to spreads being *converted* from EVs — a spread that is
 * already in SP form (see `isSpFormSpread`) is returned exactly as written,
 * so an over-budget SP spread stays visibly over budget.
 */
export function convertToChampionsSp(evs: StatSpread): StatSpread {
  const stats: StatName[] = ["hp", "atk", "def", "spa", "spd", "spe"];

  // Fast path — pastes that are already in SP form are returned verbatim,
  // over budget or not, so an over-budget SP spread is no longer silently
  // re-scaled into a legal-looking one. `isSpFormSpread` owns the whole
  // units question, including which way an over-budget line resolves.
  if (isSpFormSpread(evs)) return { ...evs };

  // Step 1: Direct per-stat conversion (already capped at 32 by evToChampionsSp).
  const sp: StatSpread = { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };
  for (const stat of stats) {
    sp[stat] = evToChampionsSp(evs[stat]);
  }

  // Step 2: If the conversion lands over budget, trim it back proportionally.
  //
  // There is deliberately NO padding step. Topping invested stats up to the
  // 66 SP budget is what produced 32 HP / 32 Def from a 252 HP / 4 Def paste:
  // a 4-EV filler chip was inflated into a fully-maxed defensive investment
  // the player never bought. Under-budget spreads are returned as converted.
  return trimSpToBudget(sp, stats);
}


