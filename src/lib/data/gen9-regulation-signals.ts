/**
 * Authoritative signal data for Gen 9 VGC regulation detection.
 *
 * Each set below is a normalized species-key list (lowercase, hyphenated,
 * no spaces — matching the keys used everywhere else in this codebase)
 * that uniquely identifies Pokémon belonging to a specific category.
 * These categories drive the auto-detection logic in
 * src/lib/analysis/detect-regulation.ts — we only tag a regulation when
 * the team carries a *positive* category signal that narrows the format
 * unambiguously. Absence of a signal is treated as ambiguous.
 *
 * Sources cross-referenced on 2026-04-19:
 *   • Pokémon Showdown format definitions
 *     https://github.com/smogon/pokemon-showdown/blob/master/config/formats.ts
 *     — authoritative ruleset for VGC 2024 Reg G, VGC 2026 Reg F/I.
 *   • Game8 Regulation H banlist
 *     https://game8.co/games/Pokemon-Scarlet-Violet/archives/463920
 *     — full named list of all Paradox, Legendary, Sub-Legendary, and
 *       Mythical Pokémon banned in Reg H (September 2024 ruleset).
 *   • VictoryRoad VGC rules summary
 *     https://victoryroad.pro/sv-rules-regulations/
 *     — per-regulation dex evolution and timeline (Reg A through Reg I).
 *   • Serebii.net Pokémon Champions format
 *     https://www.serebii.net/pokemonchampions/pokemon.shtml
 *     — species pool for Reg M-A (handled separately via
 *       CHAMPIONS_DEX and MEGA_POKEMON_LIST).
 */

/**
 * Restricted Legendaries — the "cover" legendaries that most competitive
 * formats ban outright or cap at 1–2 per team. Presence of any of these
 * on a team is a strong indicator of Reg G / Reg I (the only current
 * Gen 9 regulations that permit Restricted Pokémon at all).
 *
 * Base species only — form variants (e.g. Calyrex-Ice, Calyrex-Shadow,
 * Necrozma-Dusk-Mane) collapse to the base name via strip-form logic
 * in the detector.
 */
export const RESTRICTED_LEGENDARIES = new Set<string>([
  "mewtwo",
  "lugia",
  "ho-oh",
  "kyogre",
  "groudon",
  "rayquaza",
  "dialga",
  "palkia",
  "giratina",
  "reshiram",
  "zekrom",
  "kyurem",
  "cosmog",
  "cosmoem",
  "solgaleo",
  "lunala",
  "necrozma",
  "zacian",
  "zamazenta",
  "eternatus",
  "calyrex",
  "koraidon",
  "miraidon",
  "terapagos",
]);

/**
 * Gen 9 Paradox Pokémon (past + future). Banned in Reg H and Reg A,
 * allowed everywhere else. A Paradox on a team rules out both of those
 * regulations but doesn't uniquely identify any single remaining reg.
 */
export const PARADOX_POKEMON = new Set<string>([
  // Past Paradox (Scarlet)
  "great-tusk",
  "scream-tail",
  "brute-bonnet",
  "flutter-mane",
  "slither-wing",
  "sandy-shocks",
  "roaring-moon",
  "walking-wake",
  "raging-bolt",
  "gouging-fire",
  // Future Paradox (Violet)
  "iron-treads",
  "iron-bundle",
  "iron-hands",
  "iron-jugulis",
  "iron-moth",
  "iron-thorns",
  "iron-valiant",
  "iron-leaves",
  "iron-crown",
  "iron-boulder",
]);

/**
 * Sub-legendaries + Treasures of Ruin — legendary-tier Pokémon that are
 * not "restricted" but still banned in Reg H. Presence rules out Reg H
 * and Reg A but (like Paradox) doesn't uniquely identify a single reg.
 */
export const SUB_LEGENDARIES = new Set<string>([
  // Treasures of Ruin (added in Scarlet/Violet base)
  "wo-chien",
  "chien-pao",
  "ting-lu",
  "chi-yu",
  // Legendary birds (Kanto + Galarian)
  "articuno",
  "zapdos",
  "moltres",
  // Legendary beasts
  "entei",
  "suicune",
  "raikou",
  // Regis
  "regirock",
  "registeel",
  "regice",
  "regigigas",
  "regieleki",
  "regidrago",
  // Eon duo
  "latios",
  "latias",
  // Lake trio
  "uxie",
  "mesprit",
  "azelf",
  // Other Gen 4 sub-legendaries
  "heatran",
  "cresselia",
  // Swords of Justice
  "cobalion",
  "terrakion",
  "virizion",
  "keldeo",
  // Forces of Nature
  "tornadus",
  "thundurus",
  "landorus",
  "enamorus",
  // Gen 8 sub-legendaries
  "urshifu",
  "glastrier",
  "spectrier",
]);

/**
 * Mythical Pokémon — always banned in every VGC regulation. Presence is
 * effectively a bug in the paste (illegal team) rather than a regulation
 * signal. Kept here so the detector can flag them as non-indicators.
 */
export const MYTHICAL_POKEMON = new Set<string>([
  "mew",
  "celebi",
  "jirachi",
  "deoxys",
  "phione",
  "manaphy",
  "darkrai",
  "shaymin",
  "arceus",
  "victini",
  "meloetta",
  "genesect",
  "diancie",
  "hoopa",
  "volcanion",
  "magearna",
  "marshadow",
  "zeraora",
  "zarude",
  "pecharunt",
]);

/**
 * Normalize a raw species string to the lookup key used by the sets above.
 * Strips Mega / Primal / regional / form suffixes so form variants collapse
 * to their base (e.g. "Calyrex-Ice" → "calyrex", "Kyogre-Primal" → "kyogre",
 * "Urshifu-Rapid-Strike" → "urshifu").
 */
export function getRegulationLookupKey(species: string): string {
  const normalized = species.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  return normalized
    .replace(/-mega(-[xy])?$/, "")
    .replace(/-primal$/, "")
    .replace(/-origin$/, "")
    .replace(/-crowned$/, "")
    .replace(/-ice$/, "")
    .replace(/-shadow$/, "")
    .replace(/-white$/, "")
    .replace(/-black$/, "")
    .replace(/-dusk-mane$/, "")
    .replace(/-dawn-wings$/, "")
    .replace(/-ultra$/, "")
    .replace(/-rapid-strike$/, "")
    .replace(/-single-strike$/, "")
    .replace(/-hero$/, "")
    .replace(/-therian$/, "")
    .replace(/-incarnate$/, "")
    .replace(/-galar$/, "")
    .replace(/-galarian$/, "")
    .replace(/-hisui$/, "")
    .replace(/-hisuian$/, "")
    .replace(/-paldea$/, "")
    .replace(/-paldean$/, "")
    .replace(/-alola$/, "")
    .replace(/-alolan$/, "");
}
