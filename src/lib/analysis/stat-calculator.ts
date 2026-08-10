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
 * Over-budget spreads are trimmed proportionally; see `trimSpToBudget`.
 */
export function convertToChampionsSp(evs: StatSpread): StatSpread {
  const stats: StatName[] = ["hp", "atk", "def", "spa", "spd", "spe"];

  // Fast path — pastes that are already in SP form. Showdown has no "SP:"
  // prefix yet, so Champions teams carry SP values inside the EV line
  // (e.g. "EVs: 22 HP / 11 Def / 24 SpA / 4 SpD / 5 Spe" sums to 66).
  // If every value fits inside [0, 32] and the total fits inside 66,
  // the only consistent reading is "these are SP" — treating them as
  // EVs and running ceil(ev/8) would collapse "5 Spe" to 1 SP and
  // break downstream stat math (e.g. Choice Scarf on Primarina).
  const totalInput = stats.reduce((sum, s) => sum + evs[s], 0);
  const anyOverMax = stats.some((s) => evs[s] > CHAMPIONS_MAX_SP_PER_STAT);
  if (totalInput > 0 && totalInput <= CHAMPIONS_TOTAL_SP && !anyOverMax) {
    return { ...evs };
  }

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


