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
 * DLC-era / HOME-import species — Pokémon that are NOT in the original
 * Paldea native dex (Reg A, Pokédex #001-375 + #388-392) and therefore
 * could only appear on a team once DLC or HOME transfers opened up.
 *
 * Presence of any species here rules out Reg A. Combined with an absence
 * of Restricted / Paradox / Sub-Legendary / Mythical signals, it is a
 * strong positive signal for Reg H (the "no legendaries" reg, which
 * still permits the full SV + Kitakami + Indigo Disk + HOME dex).
 *
 * Not exhaustive — this list captures the commonly-seen DLC/HOME
 * additions in competitive VGC teams. Expand as new meta picks emerge.
 *
 * Categories:
 *   • Hisuian regional forms and evolutions (Legends: Arceus)
 *   • Indigo Disk exclusives (new species + new evolutions)
 *   • Kitakami exclusives (Teal Mask DLC)
 *   • Popular HOME imports from Alola / Galar (starters, Incineroar, etc.)
 */
export const DLC_ERA_SPECIES = new Set<string>([
  // Hisuian evolutions + regional forms
  "ursaluna",
  "ursaluna-bloodmoon",
  "sneasler",
  "basculegion",
  "basculegion-f",
  "overqwil",
  "wyrdeer",
  "kleavor",
  "enamorus",
  "samurott-hisui",
  "decidueye-hisui",
  "typhlosion-hisui",
  "zoroark-hisui",
  "zorua-hisui",
  "lilligant-hisui",
  "voltorb-hisui",
  "electrode-hisui",
  "growlithe-hisui",
  "arcanine-hisui",
  "sliggoo-hisui",
  "goodra-hisui",
  "avalugg-hisui",
  "braviary-hisui",
  "qwilfish-hisui",
  "sneasel-hisui",
  "basculin-white-striped",
  // Indigo Disk exclusives
  "archaludon",
  "duraludon",
  "hydrapple",
  "dipplin",
  "sinistcha",
  "sinistcha-masterpiece",
  "poltchageist",
  "poltchageist-artisan",
  // Popular HOME imports (Alola / Galar starters + staples)
  "incineroar",
  "rillaboom",
  "cinderace",
  "inteleon",
  "decidueye",
  "primarina",
  "dragapult",
  "grimmsnarl",
  "urshifu-rapid-strike",
  "urshifu-single-strike",
  "kommo-o",
  "indeedee",
  "indeedee-f",
  "whimsicott",
  "polteageist",
  "sinistea",
  "corviknight",
  "dragonite",
  "amoonguss",
  "porygon2",
  "porygon-z",
  // Galarian regional forms (non-legendary — legendaries go in SUB_LEGENDARIES)
  "weezing-galar",
  "corsola-galar",
  "cursola",
  "farfetchd-galar",
  "sirfetchd",
  "darmanitan-galar",
  "darmanitan-galar-zen",
  "slowking-galar",
  "slowbro-galar",
  "rapidash-galar",
  "ponyta-galar",
  "mr-mime-galar",
  "mr-rime",
  "obstagoon",
  "linoone-galar",
  "zigzagoon-galar",
  "perrserker",
  "meowth-galar",
  "runerigus",
  "yamask-galar",
  // Alolan regional forms
  "raichu-alola",
  "ninetales-alola",
  "vulpix-alola",
  "sandslash-alola",
  "sandshrew-alola",
  "persian-alola",
  "meowth-alola",
  "dugtrio-alola",
  "diglett-alola",
  "raticate-alola",
  "rattata-alola",
  "graveler-alola",
  "golem-alola",
  "geodude-alola",
  "muk-alola",
  "grimer-alola",
  "marowak-alola",
  "exeggutor-alola",
]);

/**
 * Species that are ONLY legal in Pokémon Champions (Reg M-A) and do not
 * appear in any Gen 9 SV VGC regulation. Presence is an unambiguous
 * Reg M-A signal even without a Mega Stone or Primal Orb on the team.
 *
 * - Floette-Eternal (AZ's Floette) is an event-only form that has never
 *   been distributed in Scarlet/Violet — it exists exclusively in the
 *   Pokémon Champions dex.
 *   Source: https://www.serebii.net/pokemonchampions/pokemon.shtml
 *
 * Keys use the full form suffix because these signals are form-specific
 * (the base Floette is legal in Reg H / F via HOME — only the Eternal
 * Flower form is Champions-exclusive). Lookup bypasses form stripping.
 */
export const CHAMPIONS_EXCLUSIVE_SPECIES = new Set<string>([
  "floette-eternal",
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
