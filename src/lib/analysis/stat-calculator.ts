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

/**
 * True when a spread is already expressed in Champions SP form.
 *
 * Showdown has no "SPs:" line yet, so Champions teams carry SP values inside
 * the EV line (e.g. "EVs: 22 HP / 11 Def / 24 SpA / 4 SpD / 5 Spe" sums to
 * 66). If every value fits inside [0, 32] and the total fits inside 66, the
 * only consistent reading is "these are SP" — treating them as EVs and
 * running ceil(ev/8) would collapse "5 Spe" to 1 SP and break downstream stat
 * math (e.g. Choice Scarf on Primarina).
 *
 * An all-zero spread counts as SP form too: Champions is SP-native, so an
 * uninvested paste is 0/66 SP. Both readings produce all-zero SP anyway.
 */
export function looksLikeChampionsSp(spread: StatSpread): boolean {
  const stats: StatName[] = ["hp", "atk", "def", "spa", "spd", "spe"];
  const total = stats.reduce((sum, s) => sum + spread[s], 0);
  return (
    total <= CHAMPIONS_TOTAL_SP &&
    stats.every((s) => spread[s] <= CHAMPIONS_MAX_SP_PER_STAT)
  );
}

/**
 * Convert a traditional EV spread to a Champions SP spread.
 *
 * The mapping is proportional to what the user actually invested:
 *  - 252 EVs → 32 SP (full investment)
 *  - 4 EVs → 1 SP (minimum investment)
 *  - 0 EVs → 0 SP
 *
 * Leftover budget is deliberately left unspent. Topping invested stats up to
 * 66 fabricated investment nobody made: "252 HP / 4 Def" came out as
 * "32 HP / 32 Def", turning a 4-EV filler into a maxed stat, and how much the
 * filler absorbed depended on what else happened to be in the spread. The
 * under-budget state belongs to the SP badge and the legality validator, not
 * to the conversion.
 */
export function convertToChampionsSp(evs: StatSpread): StatSpread {
  const stats: StatName[] = ["hp", "atk", "def", "spa", "spd", "spe"];

  // Fast path — pastes that are already in SP form.
  if (looksLikeChampionsSp(evs)) return { ...evs };

  // Step 1: Direct conversion — ceil for non-zero to preserve intent
  const sp: StatSpread = { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };
  for (const stat of stats) {
    if (evs[stat] === 0) sp[stat] = 0;
    else if (evs[stat] >= 248) sp[stat] = CHAMPIONS_MAX_SP_PER_STAT; // 248+ → max
    else sp[stat] = Math.max(1, Math.ceil(evs[stat] / 8)); // At least 1 SP for any investment
  }

  // Step 2: Cap each stat at 32
  for (const stat of stats) {
    sp[stat] = Math.min(sp[stat], CHAMPIONS_MAX_SP_PER_STAT);
  }

  // Step 3: If over budget, trim from lowest-invested stats
  const totalSp = stats.reduce((sum, s) => sum + sp[s], 0);
  if (totalSp > CHAMPIONS_TOTAL_SP) {
    const sortedAsc = stats.filter((s) => sp[s] > 0).sort((a, b) => sp[a] - sp[b]);
    let excess = totalSp - CHAMPIONS_TOTAL_SP;
    for (const stat of sortedAsc) {
      if (excess <= 0) break;
      const remove = Math.min(sp[stat], excess);
      sp[stat] -= remove;
      excess -= remove;
    }
  }

  return sp;
}


