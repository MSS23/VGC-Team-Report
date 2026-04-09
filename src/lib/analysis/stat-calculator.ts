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

/** Convert EVs to Stat Points (1 SP = 8 EVs). */
export function evsToSp(ev: number): number {
  return Math.floor(ev / 8);
}

/** Convert a full EV spread to SP spread. */
export function evSpreadToSp(evs: StatSpread): StatSpread {
  return {
    hp: evsToSp(evs.hp),
    atk: evsToSp(evs.atk),
    def: evsToSp(evs.def),
    spa: evsToSp(evs.spa),
    spd: evsToSp(evs.spd),
    spe: evsToSp(evs.spe),
  };
}

/** Champions SP budget constants. */
export const CHAMPIONS_MAX_SP_PER_STAT = 32;
export const CHAMPIONS_TOTAL_SP = 66;
