import type { StatSpread, StatName } from "@/lib/types/pokemon";

export interface StatBoost {
  stat: StatName;
  multiplier: number;
  boostedValue: number;
}

const BOOSTER_ABILITIES = ["Protosynthesis", "Quark Drive"];

/**
 * Returns the stat boost applied by the Pokémon's held item, if any.
 *
 * Handles:
 * - Choice Scarf (Spe ×1.5)
 * - Booster Energy with Protosynthesis/Quark Drive
 *   (highest non-HP stat: ×1.3, or ×1.5 if Speed)
 */
export function getItemStatBoost(
  item: string | null,
  ability: string | null,
  calculatedStats: StatSpread
): StatBoost | null {
  if (!item) return null;

  const normalized = item.toLowerCase().trim();

  if (normalized === "choice scarf") {
    return {
      stat: "spe",
      multiplier: 1.5,
      boostedValue: Math.floor(calculatedStats.spe * 1.5),
    };
  }

  if (normalized === "booster energy" && ability && BOOSTER_ABILITIES.includes(ability)) {
    // Find highest non-HP stat
    const battleStats: StatName[] = ["atk", "def", "spa", "spd", "spe"];
    let highestStat: StatName = "atk";
    let highestValue = 0;

    for (const stat of battleStats) {
      if (calculatedStats[stat] > highestValue) {
        highestValue = calculatedStats[stat];
        highestStat = stat;
      }
    }

    // Speed gets ×1.5, all other stats get ×1.3
    const multiplier = highestStat === "spe" ? 1.5 : 1.3;

    return {
      stat: highestStat,
      multiplier,
      boostedValue: Math.floor(highestValue * multiplier),
    };
  }

  return null;
}
