import type { ParsedPokemon, PokemonData } from "@/lib/types/pokemon";
import { calculateStat } from "./stat-calculator";
import { getNatureModifier } from "@/lib/data/natures";

interface OffenseAnalysis {
  simpleText: string;
  advancedText: string;
}

export function analyzeOffense(pokemon: ParsedPokemon, data: PokemonData | null): OffenseAnalysis {
  if (!data) {
    return {
      simpleText: "Offense data unavailable.",
      advancedText: "Offense data unavailable.",
    };
  }

  const atkStat = calculateStat("atk", data.baseStats.atk, pokemon.ivs.atk, pokemon.evs.atk, pokemon.level, pokemon.nature);
  const spaStat = calculateStat("spa", data.baseStats.spa, pokemon.ivs.spa, pokemon.evs.spa, pokemon.level, pokemon.nature);

  const atkEvs = pokemon.evs.atk;
  const spaEvs = pokemon.evs.spa;
  const atkBoosted = getNatureModifier(pokemon.nature, "atk") > 1;
  const spaBoosted = getNatureModifier(pokemon.nature, "spa") > 1;

  const item = pokemon.item?.toLowerCase() ?? "";
  const hasChoiceBand = item === "choice band";
  const hasChoiceSpecs = item === "choice specs";
  const hasLifeOrb = item === "life orb";
  const hasBoosterEnergy = item === "booster energy";

  let itemContext = "";
  if (hasChoiceBand) itemContext = " Choice Band boosts Attack by 50% but locks into one move.";
  if (hasChoiceSpecs) itemContext = " Choice Specs boosts Sp. Attack by 50% but locks into one move.";
  if (hasLifeOrb) itemContext = " Life Orb boosts damage by 30% at the cost of 10% HP per attack.";
  if (hasBoosterEnergy) itemContext = " Booster Energy activates Protosynthesis/Quark Drive for the highest stat.";

  // Determine primary attacking side
  const isPhysical = atkEvs > spaEvs || (atkEvs === spaEvs && data.baseStats.atk >= data.baseStats.spa);
  const isMixed = atkEvs >= 100 && spaEvs >= 100;
  const maxedPhysical = atkEvs >= 252;
  const maxedSpecial = spaEvs >= 252;
  const noOffense = atkEvs === 0 && spaEvs === 0;

  if (noOffense) {
    const simpleText = `No offensive investment — pure support or utility set.`;
    const advancedText = `${atkStat} Atk / ${spaStat} SpA (0/0 offensive EVs). Not designed to deal significant damage.`;
    return { simpleText, advancedText };
  }

  if (isMixed) {
    const simpleText = `Mixed attacker — investing in both physical and special offense.${itemContext}`;
    const advancedText = `${atkStat} Atk (${atkEvs} EVs${atkBoosted ? ", +Atk" : ""}) / ${spaStat} SpA (${spaEvs} EVs${spaBoosted ? ", +SpA" : ""}).${itemContext} Mixed set for coverage flexibility.`;
    return { simpleText, advancedText };
  }

  if (isPhysical) {
    const powerDesc = maxedPhysical && atkBoosted
      ? "Maximum physical attack power"
      : maxedPhysical
      ? "Fully invested physical attacker"
      : `${atkEvs} EVs in Attack`;

    const simpleText = `${powerDesc}.${itemContext}`;
    const advancedText = `${atkStat} Atk (${data.baseStats.atk} base, ${atkEvs} EVs${atkBoosted ? ", +Atk nature" : ""}).${itemContext}${spaEvs > 0 ? ` Also has ${spaEvs} SpA EVs for mixed coverage.` : ""}`;
    return { simpleText, advancedText };
  }

  // Special
  const powerDesc = maxedSpecial && spaBoosted
    ? "Maximum special attack power"
    : maxedSpecial
    ? "Fully invested special attacker"
    : `${spaEvs} EVs in Sp. Attack`;

  const simpleText = `${powerDesc}.${itemContext}`;
  const advancedText = `${spaStat} SpA (${data.baseStats.spa} base, ${spaEvs} EVs${spaBoosted ? ", +SpA nature" : ""}).${itemContext}${atkEvs > 0 ? ` Also has ${atkEvs} Atk EVs for mixed coverage.` : ""}`;
  return { simpleText, advancedText };
}
