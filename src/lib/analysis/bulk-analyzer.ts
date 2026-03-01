import type { ParsedPokemon, PokemonData } from "@/lib/types/pokemon";
import { calculateStat } from "./stat-calculator";

interface BulkAnalysis {
  simpleText: string;
  advancedText: string;
}

export function analyzeBulk(pokemon: ParsedPokemon, data: PokemonData | null): BulkAnalysis {
  if (!data) {
    return {
      simpleText: "Bulk data unavailable.",
      advancedText: "Bulk data unavailable.",
    };
  }

  const hpStat = calculateStat("hp", data.baseStats.hp, pokemon.ivs.hp, pokemon.evs.hp, pokemon.level, pokemon.nature);
  const defStat = calculateStat("def", data.baseStats.def, pokemon.ivs.def, pokemon.evs.def, pokemon.level, pokemon.nature);
  const spdStat = calculateStat("spd", data.baseStats.spd, pokemon.ivs.spd, pokemon.evs.spd, pokemon.level, pokemon.nature);

  const hpEvs = pokemon.evs.hp;
  const defEvs = pokemon.evs.def;
  const spdEvs = pokemon.evs.spd;
  const totalDefEvs = hpEvs + defEvs + spdEvs;

  const item = pokemon.item?.toLowerCase() ?? "";
  const hasAV = item === "assault vest";
  const hasEviolite = item === "eviolite";
  const hasSash = item === "focus sash";
  const hasSitrus = item.includes("sitrus");

  // Physical bulk product (HP * Def)
  const physBulk = hpStat * defStat;
  // Special bulk product (HP * SpD), with item modifiers
  let specBulk = hpStat * spdStat;
  if (hasAV) specBulk = Math.floor(specBulk * 1.5);
  if (hasEviolite) {
    specBulk = Math.floor(specBulk * 1.5);
  }
  const physBulkWithItem = hasEviolite ? Math.floor(physBulk * 1.5) : physBulk;

  // Categorize investment level
  let bulkLevel: "none" | "light" | "moderate" | "heavy";
  if (totalDefEvs === 0) {
    bulkLevel = "none";
  } else if (totalDefEvs <= 100) {
    bulkLevel = "light";
  } else if (totalDefEvs <= 300) {
    bulkLevel = "moderate";
  } else {
    bulkLevel = "heavy";
  }

  // Item context
  let itemContext = "";
  if (hasAV) itemContext = " Assault Vest boosts Special Defense by 50%.";
  if (hasEviolite) itemContext = " Eviolite boosts both defenses by 50%.";
  if (hasSash) itemContext = " Focus Sash guarantees surviving one hit from full HP.";
  if (hasSitrus) itemContext = " Sitrus Berry recovers 25% HP when below half.";

  // Build explanations
  if (bulkLevel === "none") {
    const simpleText = `No defensive investment — glass cannon build.${itemContext}`;
    const advancedText = `${hpStat} HP / ${defStat} Def / ${spdStat} SpD (0 defensive EVs).${itemContext} Physical bulk: ${physBulkWithItem.toLocaleString()}, Special bulk: ${specBulk.toLocaleString()}.`;
    return { simpleText, advancedText };
  }

  if (bulkLevel === "light") {
    const simpleText = `Light bulk investment (${totalDefEvs} EVs in HP/Def/SpD) — enough to take a hit or two.${itemContext}`;
    const advancedText = `${hpStat} HP / ${defStat} Def / ${spdStat} SpD (${hpEvs}/${defEvs}/${spdEvs} EVs).${itemContext} Physical bulk: ${physBulkWithItem.toLocaleString()}, Special bulk: ${specBulk.toLocaleString()}.`;
    return { simpleText, advancedText };
  }

  // Check for balanced vs skewed investment
  const physicallySkewed = defEvs > spdEvs * 2;
  const speciallySkewed = spdEvs > defEvs * 2;

  let skewNote = "";
  if (physicallySkewed) skewNote = " Skewed toward physical defense.";
  else if (speciallySkewed) skewNote = " Skewed toward special defense.";
  else if (defEvs > 0 && spdEvs > 0) skewNote = " Balanced defensive investment.";

  if (bulkLevel === "moderate") {
    const simpleText = `Moderate bulk investment — built to take hits.${skewNote}${itemContext}`;
    const advancedText = `${hpStat} HP / ${defStat} Def / ${spdStat} SpD (${hpEvs}/${defEvs}/${spdEvs} EVs).${skewNote}${itemContext} Physical bulk: ${physBulkWithItem.toLocaleString()}, Special bulk: ${specBulk.toLocaleString()}.`;
    return { simpleText, advancedText };
  }

  // Heavy
  const simpleText = `Heavily invested in bulk — designed to tank hits and stay on the field.${skewNote}${itemContext}`;
  const advancedText = `${hpStat} HP / ${defStat} Def / ${spdStat} SpD (${hpEvs}/${defEvs}/${spdEvs} EVs).${skewNote}${itemContext} Physical bulk: ${physBulkWithItem.toLocaleString()}, Special bulk: ${specBulk.toLocaleString()}.`;
  return { simpleText, advancedText };
}
