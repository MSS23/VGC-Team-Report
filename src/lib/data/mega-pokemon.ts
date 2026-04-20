import type { PokemonType } from "@/lib/types/pokemon";

export interface MegaPokemonEntry {
  /** URL slug, e.g. "mega-kangaskhan" */
  slug: string;
  /** Key in POKEMON_DATA, e.g. "kangaskhan-mega" */
  dataKey: string;
  /** Display name, e.g. "Mega Kangaskhan" */
  displayName: string;
  /** Base form name for searching team pastes */
  baseName: string;
  /** Types after Mega Evolution */
  types: PokemonType[];
  /** Ability after Mega Evolution */
  ability: string;
  /** Mega Stone item name */
  megaStone: string;
  /** Short SEO description */
  description: string;
}

/**
 * All Mega Evolutions in the Champions format (Regulation M-A).
 * Ordered by competitive relevance.
 */
export const MEGA_POKEMON_LIST: MegaPokemonEntry[] = [
  {
    slug: "mega-kangaskhan",
    dataKey: "kangaskhan-mega",
    displayName: "Mega Kangaskhan",
    baseName: "Kangaskhan",
    types: ["Normal"],
    ability: "Parental Bond",
    megaStone: "Kangaskhanite",
    description: "Mega Kangaskhan dominates VGC with Parental Bond, hitting twice with every attack for devastating damage output.",
  },
  {
    slug: "mega-charizard-y",
    dataKey: "charizard-mega-y",
    displayName: "Mega Charizard Y",
    baseName: "Charizard",
    types: ["Fire", "Flying"],
    ability: "Drought",
    megaStone: "Charizardite Y",
    description: "Mega Charizard Y sets sun with Drought, powering up its Fire-type attacks to extreme levels in VGC.",
  },
  {
    slug: "mega-charizard-x",
    dataKey: "charizard-mega-x",
    displayName: "Mega Charizard X",
    baseName: "Charizard",
    types: ["Fire", "Dragon"],
    ability: "Tough Claws",
    megaStone: "Charizardite X",
    description: "Mega Charizard X gains Dragon typing and Tough Claws, becoming a fearsome physical attacker in Champions VGC.",
  },
  {
    slug: "mega-gengar",
    dataKey: "gengar-mega",
    displayName: "Mega Gengar",
    baseName: "Gengar",
    types: ["Ghost", "Poison"],
    ability: "Shadow Tag",
    megaStone: "Gengarite",
    description: "Mega Gengar traps opponents with Shadow Tag and threatens huge Special Attack damage in Champions format.",
  },
  {
    slug: "mega-gardevoir",
    dataKey: "gardevoir-mega",
    displayName: "Mega Gardevoir",
    baseName: "Gardevoir",
    types: ["Psychic", "Fairy"],
    ability: "Pixilate",
    megaStone: "Gardevoirite",
    description: "Mega Gardevoir converts Normal moves into Fairy-type with Pixilate and hits hard with 165 base Special Attack.",
  },
  {
    slug: "mega-lucario",
    dataKey: "lucario-mega",
    displayName: "Mega Lucario",
    baseName: "Lucario",
    types: ["Fighting", "Steel"],
    ability: "Adaptability",
    megaStone: "Lucarionite",
    description: "Mega Lucario gets STAB-boosted Adaptability, making its Fighting and Steel moves deal double STAB damage.",
  },
  {
    slug: "mega-venusaur",
    dataKey: "venusaur-mega",
    displayName: "Mega Venusaur",
    baseName: "Venusaur",
    types: ["Grass", "Poison"],
    ability: "Thick Fat",
    megaStone: "Venusaurite",
    description: "Mega Venusaur gains Thick Fat to neutralize Fire and Ice weaknesses, becoming a bulky Grass/Poison threat.",
  },
  {
    slug: "mega-blastoise",
    dataKey: "blastoise-mega",
    displayName: "Mega Blastoise",
    baseName: "Blastoise",
    types: ["Water"],
    ability: "Mega Launcher",
    megaStone: "Blastoisinite",
    description: "Mega Blastoise powers up pulse and aura moves with Mega Launcher for boosted Water Pulse and Dark Pulse.",
  },
  {
    slug: "mega-tyranitar",
    dataKey: "tyranitar-mega",
    displayName: "Mega Tyranitar",
    baseName: "Tyranitar",
    types: ["Rock", "Dark"],
    ability: "Sand Stream",
    megaStone: "Tyranitarite",
    description: "Mega Tyranitar sets sandstorm and gains massive bulk and Attack, dominating as a Rock/Dark powerhouse.",
  },
  {
    slug: "mega-garchomp",
    dataKey: "garchomp-mega",
    displayName: "Mega Garchomp",
    baseName: "Garchomp",
    types: ["Dragon", "Ground"],
    ability: "Sand Force",
    megaStone: "Garchompite",
    description: "Mega Garchomp trades speed for raw power with Sand Force, hitting even harder in sandstorm teams.",
  },
  {
    slug: "mega-scizor",
    dataKey: "scizor-mega",
    displayName: "Mega Scizor",
    baseName: "Scizor",
    types: ["Bug", "Steel"],
    ability: "Technician",
    megaStone: "Scizorite",
    description: "Mega Scizor enhances Technician-boosted Bullet Punch and Bug Bite with increased Attack and Defense.",
  },
  {
    slug: "mega-lopunny",
    dataKey: "lopunny-mega",
    displayName: "Mega Lopunny",
    baseName: "Lopunny",
    types: ["Normal", "Fighting"],
    ability: "Scrappy",
    megaStone: "Lopunnite",
    description: "Mega Lopunny hits Ghost types with Scrappy and outspeeds most of the metagame at 135 base Speed.",
  },
  {
    slug: "mega-gyarados",
    dataKey: "gyarados-mega",
    displayName: "Mega Gyarados",
    baseName: "Gyarados",
    types: ["Water", "Dark"],
    ability: "Mold Breaker",
    megaStone: "Gyaradosite",
    description: "Mega Gyarados gains Dark typing and Mold Breaker, ignoring abilities like Sturdy and Levitate.",
  },
  {
    slug: "mega-alakazam",
    dataKey: "alakazam-mega",
    displayName: "Mega Alakazam",
    baseName: "Alakazam",
    types: ["Psychic"],
    ability: "Trace",
    megaStone: "Alakazite",
    description: "Mega Alakazam reaches 175 base Special Attack and 150 Speed with Trace to copy opponent abilities.",
  },
  {
    slug: "mega-aerodactyl",
    dataKey: "aerodactyl-mega",
    displayName: "Mega Aerodactyl",
    baseName: "Aerodactyl",
    types: ["Rock", "Flying"],
    ability: "Tough Claws",
    megaStone: "Aerodactylite",
    description: "Mega Aerodactyl is one of the fastest Megas at 150 Speed with Tough Claws boosting contact moves.",
  },
  {
    slug: "mega-heracross",
    dataKey: "heracross-mega",
    displayName: "Mega Heracross",
    baseName: "Heracross",
    types: ["Bug", "Fighting"],
    ability: "Skill Link",
    megaStone: "Heracronite",
    description: "Mega Heracross hits 185 base Attack with Skill Link for guaranteed max-hit multi-strike moves.",
  },
  {
    slug: "mega-houndoom",
    dataKey: "houndoom-mega",
    displayName: "Mega Houndoom",
    baseName: "Houndoom",
    types: ["Dark", "Fire"],
    ability: "Solar Power",
    megaStone: "Houndoominite",
    description: "Mega Houndoom pairs Solar Power with sun teams for devastating special attacks at the cost of HP.",
  },
  {
    slug: "mega-aggron",
    dataKey: "aggron-mega",
    displayName: "Mega Aggron",
    baseName: "Aggron",
    types: ["Steel"],
    ability: "Filter",
    megaStone: "Aggronite",
    description: "Mega Aggron becomes pure Steel with Filter and 230 base Defense, one of the bulkiest Megas available.",
  },
  {
    slug: "mega-altaria",
    dataKey: "altaria-mega",
    displayName: "Mega Altaria",
    baseName: "Altaria",
    types: ["Dragon", "Fairy"],
    ability: "Pixilate",
    megaStone: "Altarianite",
    description: "Mega Altaria gains Fairy typing and Pixilate, converting Normal moves into powerful Fairy attacks.",
  },
  {
    slug: "mega-absol",
    dataKey: "absol-mega",
    displayName: "Mega Absol",
    baseName: "Absol",
    types: ["Dark"],
    ability: "Magic Bounce",
    megaStone: "Absolite",
    description: "Mega Absol bounces back status moves with Magic Bounce while hitting hard with 150 base Attack.",
  },
  {
    slug: "mega-sableye",
    dataKey: "sableye-mega",
    displayName: "Mega Sableye",
    baseName: "Sableye",
    types: ["Dark", "Ghost"],
    ability: "Magic Bounce",
    megaStone: "Sablenite",
    description: "Mega Sableye reflects status moves with Magic Bounce and gains massive defensive stats for team support.",
  },
  {
    slug: "mega-abomasnow",
    dataKey: "abomasnow-mega",
    displayName: "Mega Abomasnow",
    baseName: "Abomasnow",
    types: ["Grass", "Ice"],
    ability: "Snow Warning",
    megaStone: "Abomasite",
    description: "Mega Abomasnow sets hail automatically and hits hard from both sides with 132 Attack and Special Attack.",
  },
  {
    slug: "mega-gallade",
    dataKey: "gallade-mega",
    displayName: "Mega Gallade",
    baseName: "Gallade",
    types: ["Psychic", "Fighting"],
    ability: "Inner Focus",
    megaStone: "Galladite",
    description: "Mega Gallade reaches 165 Attack and 110 Speed with Inner Focus preventing Intimidate and flinching.",
  },
  {
    slug: "mega-audino",
    dataKey: "audino-mega",
    displayName: "Mega Audino",
    baseName: "Audino",
    types: ["Normal", "Fairy"],
    ability: "Healer",
    megaStone: "Audinite",
    description: "Mega Audino gains Fairy typing and excellent 126/126 defenses for a supportive doubles role.",
  },
  {
    slug: "mega-pinsir",
    dataKey: "pinsir-mega",
    displayName: "Mega Pinsir",
    baseName: "Pinsir",
    types: ["Bug", "Flying"],
    ability: "Aerilate",
    megaStone: "Pinsirite",
    description: "Mega Pinsir gains Flying typing and Aerilate, turning Return into a powerful Flying-type STAB move.",
  },
  {
    slug: "mega-slowbro",
    dataKey: "slowbro-mega",
    displayName: "Mega Slowbro",
    baseName: "Slowbro",
    types: ["Water", "Psychic"],
    ability: "Shell Armor",
    megaStone: "Slowbronite",
    description: "Mega Slowbro reaches 180 base Defense with Shell Armor preventing critical hits for extreme physical bulk.",
  },
  {
    slug: "mega-steelix",
    dataKey: "steelix-mega",
    displayName: "Mega Steelix",
    baseName: "Steelix",
    types: ["Steel", "Ground"],
    ability: "Sand Force",
    megaStone: "Steelixite",
    description: "Mega Steelix hits 230 base Defense and powers up Ground/Rock/Steel moves in sand with Sand Force.",
  },
  {
    slug: "mega-ampharos",
    dataKey: "ampharos-mega",
    displayName: "Mega Ampharos",
    baseName: "Ampharos",
    types: ["Electric", "Dragon"],
    ability: "Mold Breaker",
    megaStone: "Ampharosite",
    description: "Mega Ampharos gains Dragon typing and 165 Special Attack with Mold Breaker to ignore defensive abilities.",
  },
  {
    slug: "mega-beedrill",
    dataKey: "beedrill-mega",
    displayName: "Mega Beedrill",
    baseName: "Beedrill",
    types: ["Bug", "Poison"],
    ability: "Adaptability",
    megaStone: "Beedrillite",
    description: "Mega Beedrill becomes a glass cannon with 150 Attack, 145 Speed, and Adaptability doubling STAB damage.",
  },
  {
    slug: "mega-manectric",
    dataKey: "manectric-mega",
    displayName: "Mega Manectric",
    baseName: "Manectric",
    types: ["Electric"],
    ability: "Intimidate",
    megaStone: "Manectite",
    description: "Mega Manectric pairs blistering 135 Speed with Intimidate, making it the premier Electric-type pivot in Champions.",
  },
  // ── Reg M-A Megas added in bulk from @pkmn/dex (descriptions are SEO
  //    stubs to be expanded iteratively as competitive analysis emerges).
  {
    slug: "mega-pidgeot",
    dataKey: "pidgeot-mega",
    displayName: "Mega Pidgeot",
    baseName: "Pidgeot",
    types: ["Normal", "Flying"],
    ability: "No Guard",
    megaStone: "Pidgeotite",
    description: "Mega Pidgeot is a legal Mega Evolution in Pokemon Champions Regulation M-A.",
  },
  {
    slug: "mega-clefable",
    dataKey: "clefable-mega",
    displayName: "Mega Clefable",
    baseName: "Clefable",
    types: ["Fairy", "Flying"],
    ability: "Magic Bounce",
    megaStone: "Clefablite",
    description: "Mega Clefable is a legal Mega Evolution in Pokemon Champions Regulation M-A.",
  },
  {
    slug: "mega-victreebel",
    dataKey: "victreebel-mega",
    displayName: "Mega Victreebel",
    baseName: "Victreebel",
    types: ["Grass", "Poison"],
    ability: "Innards Out",
    megaStone: "Victreebelite",
    description: "Mega Victreebel is a legal Mega Evolution in Pokemon Champions Regulation M-A.",
  },
  {
    slug: "mega-starmie",
    dataKey: "starmie-mega",
    displayName: "Mega Starmie",
    baseName: "Starmie",
    types: ["Water", "Psychic"],
    ability: "Huge Power",
    megaStone: "Starminite",
    description: "Mega Starmie is a legal Mega Evolution in Pokemon Champions Regulation M-A.",
  },
  {
    slug: "mega-dragonite",
    dataKey: "dragonite-mega",
    displayName: "Mega Dragonite",
    baseName: "Dragonite",
    types: ["Dragon", "Flying"],
    ability: "Multiscale",
    megaStone: "Dragoninite",
    description: "Mega Dragonite is a legal Mega Evolution in Pokemon Champions Regulation M-A.",
  },
  {
    slug: "mega-meganium",
    dataKey: "meganium-mega",
    displayName: "Mega Meganium",
    baseName: "Meganium",
    types: ["Grass", "Fairy"],
    ability: "Mega Sol",
    megaStone: "Meganiumite",
    description: "Mega Meganium is a legal Mega Evolution in Pokemon Champions Regulation M-A.",
  },
  {
    slug: "mega-feraligatr",
    dataKey: "feraligatr-mega",
    displayName: "Mega Feraligatr",
    baseName: "Feraligatr",
    types: ["Water", "Dragon"],
    ability: "Dragonize",
    megaStone: "Feraligite",
    description: "Mega Feraligatr is a legal Mega Evolution in Pokemon Champions Regulation M-A.",
  },
  {
    slug: "mega-skarmory",
    dataKey: "skarmory-mega",
    displayName: "Mega Skarmory",
    baseName: "Skarmory",
    types: ["Steel", "Flying"],
    ability: "Stalwart",
    megaStone: "Skarmorite",
    description: "Mega Skarmory is a legal Mega Evolution in Pokemon Champions Regulation M-A.",
  },
  {
    slug: "mega-medicham",
    dataKey: "medicham-mega",
    displayName: "Mega Medicham",
    baseName: "Medicham",
    types: ["Fighting", "Psychic"],
    ability: "Pure Power",
    megaStone: "Medichamite",
    description: "Mega Medicham is a legal Mega Evolution in Pokemon Champions Regulation M-A.",
  },
  {
    slug: "mega-sharpedo",
    dataKey: "sharpedo-mega",
    displayName: "Mega Sharpedo",
    baseName: "Sharpedo",
    types: ["Water", "Dark"],
    ability: "Strong Jaw",
    megaStone: "Sharpedonite",
    description: "Mega Sharpedo is a legal Mega Evolution in Pokemon Champions Regulation M-A.",
  },
  {
    slug: "mega-camerupt",
    dataKey: "camerupt-mega",
    displayName: "Mega Camerupt",
    baseName: "Camerupt",
    types: ["Fire", "Ground"],
    ability: "Sheer Force",
    megaStone: "Cameruptite",
    description: "Mega Camerupt is a legal Mega Evolution in Pokemon Champions Regulation M-A.",
  },
  {
    slug: "mega-banette",
    dataKey: "banette-mega",
    displayName: "Mega Banette",
    baseName: "Banette",
    types: ["Ghost"],
    ability: "Prankster",
    megaStone: "Banettite",
    description: "Mega Banette is a legal Mega Evolution in Pokemon Champions Regulation M-A.",
  },
  {
    slug: "mega-chimecho",
    dataKey: "chimecho-mega",
    displayName: "Mega Chimecho",
    baseName: "Chimecho",
    types: ["Psychic", "Steel"],
    ability: "Levitate",
    megaStone: "Chimechite",
    description: "Mega Chimecho is a legal Mega Evolution in Pokemon Champions Regulation M-A.",
  },
  {
    slug: "mega-glalie",
    dataKey: "glalie-mega",
    displayName: "Mega Glalie",
    baseName: "Glalie",
    types: ["Ice"],
    ability: "Refrigerate",
    megaStone: "Glalitite",
    description: "Mega Glalie is a legal Mega Evolution in Pokemon Champions Regulation M-A.",
  },
  {
    slug: "mega-froslass",
    dataKey: "froslass-mega",
    displayName: "Mega Froslass",
    baseName: "Froslass",
    types: ["Ice", "Ghost"],
    ability: "Snow Warning",
    megaStone: "Froslassite",
    description: "Mega Froslass is a legal Mega Evolution in Pokemon Champions Regulation M-A.",
  },
  {
    slug: "mega-emboar",
    dataKey: "emboar-mega",
    displayName: "Mega Emboar",
    baseName: "Emboar",
    types: ["Fire", "Fighting"],
    ability: "Mold Breaker",
    megaStone: "Emboarite",
    description: "Mega Emboar is a legal Mega Evolution in Pokemon Champions Regulation M-A.",
  },
  {
    slug: "mega-excadrill",
    dataKey: "excadrill-mega",
    displayName: "Mega Excadrill",
    baseName: "Excadrill",
    types: ["Ground", "Steel"],
    ability: "Piercing Drill",
    megaStone: "Excadrite",
    description: "Mega Excadrill is a legal Mega Evolution in Pokemon Champions Regulation M-A.",
  },
  {
    slug: "mega-chandelure",
    dataKey: "chandelure-mega",
    displayName: "Mega Chandelure",
    baseName: "Chandelure",
    types: ["Ghost", "Fire"],
    ability: "Infiltrator",
    megaStone: "Chandelurite",
    description: "Mega Chandelure is a legal Mega Evolution in Pokemon Champions Regulation M-A.",
  },
  {
    slug: "mega-golurk",
    dataKey: "golurk-mega",
    displayName: "Mega Golurk",
    baseName: "Golurk",
    types: ["Ground", "Ghost"],
    ability: "Unseen Fist",
    megaStone: "Golurkite",
    description: "Mega Golurk is a legal Mega Evolution in Pokemon Champions Regulation M-A.",
  },
  {
    slug: "mega-chesnaught",
    dataKey: "chesnaught-mega",
    displayName: "Mega Chesnaught",
    baseName: "Chesnaught",
    types: ["Grass", "Fighting"],
    ability: "Bulletproof",
    megaStone: "Chesnaughtite",
    description: "Mega Chesnaught is a legal Mega Evolution in Pokemon Champions Regulation M-A.",
  },
  {
    slug: "mega-delphox",
    dataKey: "delphox-mega",
    displayName: "Mega Delphox",
    baseName: "Delphox",
    types: ["Fire", "Psychic"],
    ability: "Levitate",
    megaStone: "Delphoxite",
    description: "Mega Delphox is a legal Mega Evolution in Pokemon Champions Regulation M-A.",
  },
  {
    slug: "mega-greninja",
    dataKey: "greninja-mega",
    displayName: "Mega Greninja",
    baseName: "Greninja",
    types: ["Water", "Dark"],
    ability: "Protean",
    megaStone: "Greninjite",
    description: "Mega Greninja is a legal Mega Evolution in Pokemon Champions Regulation M-A.",
  },
  {
    slug: "mega-floette",
    dataKey: "floette-mega",
    displayName: "Mega Floette",
    baseName: "Floette",
    types: ["Fairy"],
    ability: "Fairy Aura",
    megaStone: "Floettite",
    description: "Mega Floette is a legal Mega Evolution in Pokemon Champions Regulation M-A.",
  },
  {
    slug: "mega-meowstic",
    dataKey: "meowstic-mega",
    displayName: "Mega Meowstic",
    baseName: "Meowstic",
    types: ["Psychic"],
    ability: "Trace",
    megaStone: "Meowsticite",
    description: "Mega Meowstic is a legal Mega Evolution in Pokemon Champions Regulation M-A.",
  },
  {
    slug: "mega-hawlucha",
    dataKey: "hawlucha-mega",
    displayName: "Mega Hawlucha",
    baseName: "Hawlucha",
    types: ["Fighting", "Flying"],
    ability: "No Guard",
    megaStone: "Hawluchanite",
    description: "Mega Hawlucha is a legal Mega Evolution in Pokemon Champions Regulation M-A.",
  },
  {
    slug: "mega-crabominable",
    dataKey: "crabominable-mega",
    displayName: "Mega Crabominable",
    baseName: "Crabominable",
    types: ["Fighting", "Ice"],
    ability: "Iron Fist",
    megaStone: "Crabominite",
    description: "Mega Crabominable is a legal Mega Evolution in Pokemon Champions Regulation M-A.",
  },
  {
    slug: "mega-drampa",
    dataKey: "drampa-mega",
    displayName: "Mega Drampa",
    baseName: "Drampa",
    types: ["Normal", "Dragon"],
    ability: "Berserk",
    megaStone: "Drampanite",
    description: "Mega Drampa is a legal Mega Evolution in Pokemon Champions Regulation M-A.",
  },
  {
    slug: "mega-scovillain",
    dataKey: "scovillain-mega",
    displayName: "Mega Scovillain",
    baseName: "Scovillain",
    types: ["Grass", "Fire"],
    ability: "Spicy Spray",
    megaStone: "Scovillainite",
    description: "Mega Scovillain is a legal Mega Evolution in Pokemon Champions Regulation M-A.",
  },
  {
    slug: "mega-glimmora",
    dataKey: "glimmora-mega",
    displayName: "Mega Glimmora",
    baseName: "Glimmora",
    types: ["Rock", "Poison"],
    ability: "Adaptability",
    megaStone: "Glimmoranite",
    description: "Mega Glimmora is a legal Mega Evolution in Pokemon Champions Regulation M-A.",
  },
];

/**
 * Canonical set of dataKeys legal in Pokemon Champions Regulation M-A
 * (the format used by Indianapolis Regionals, Worlds 2026, and the
 * Global Challenge from May 2026 onward). Cross-referenced against
 * Bulbapedia + Serebii + Victory Road on 2026-04-20.
 *
 * Defence-in-depth: even if MEGA_POKEMON_LIST drifts (someone adds an
 * entry that's not in M-A), the Champions index page filters through
 * this set so illegal Megas can never appear as featured content.
 *
 * Update this list when format rotations change (Reg M-B etc.).
 */
export const CHAMPIONS_REG_MA_MEGAS = new Set<string>([
  "venusaur-mega", "charizard-mega-x", "charizard-mega-y", "blastoise-mega",
  "beedrill-mega", "pidgeot-mega", "clefable-mega", "alakazam-mega",
  "victreebel-mega", "slowbro-mega", "gengar-mega", "kangaskhan-mega",
  "starmie-mega", "pinsir-mega", "gyarados-mega", "aerodactyl-mega",
  "dragonite-mega", "meganium-mega", "feraligatr-mega", "ampharos-mega",
  "steelix-mega", "scizor-mega", "heracross-mega", "skarmory-mega",
  "houndoom-mega", "tyranitar-mega", "gardevoir-mega", "sableye-mega",
  "aggron-mega", "medicham-mega", "manectric-mega", "sharpedo-mega",
  "camerupt-mega", "altaria-mega", "banette-mega", "chimecho-mega",
  "absol-mega", "glalie-mega", "lopunny-mega", "garchomp-mega",
  "lucario-mega", "abomasnow-mega", "gallade-mega", "froslass-mega",
  "emboar-mega", "excadrill-mega", "audino-mega", "chandelure-mega",
  "golurk-mega", "chesnaught-mega", "delphox-mega", "greninja-mega",
  "floette-mega", "meowstic-mega", "hawlucha-mega", "crabominable-mega",
  "drampa-mega", "scovillain-mega", "glimmora-mega",
]);

/** Filtered list of MEGA_POKEMON_LIST entries that are legal in Reg M-A. */
export function getRegMAMegas(): MegaPokemonEntry[] {
  return MEGA_POKEMON_LIST.filter((m) => CHAMPIONS_REG_MA_MEGAS.has(m.dataKey));
}

/**
 * Megas with confirmed sprites on Pokemon Showdown's CDN as of 2026-04-20
 * (probed by curl-ing both /sprites/home/{slug}.png and /sprites/ani/{slug}.gif —
 * "has sprite" = at least one returned 200). The 14 absentees are mostly
 * Pokemon Champions originals (Mega Excadrill, Mega Golurk, Mega Glimmora,
 * etc.) whose sprites Showdown hasn't rolled out yet.
 *
 * Used to gate which Megas get clickable detail pages on /champions —
 * sprite-less Megas render as "Coming Soon · Sprites Unavailable" cards
 * instead of leading users to a broken-image landing page.
 *
 * Re-probe periodically (every couple of weeks) and add new dataKeys as
 * Showdown ships sprites. Removing this gate is a one-line change once
 * coverage is complete.
 */
export const MEGAS_WITH_SPRITES = new Set<string>([
  // Canon Gen 6 Megas — full coverage
  "venusaur-mega", "charizard-mega-x", "charizard-mega-y", "blastoise-mega",
  "beedrill-mega", "pidgeot-mega", "alakazam-mega", "slowbro-mega",
  "gengar-mega", "kangaskhan-mega", "pinsir-mega", "gyarados-mega",
  "aerodactyl-mega", "ampharos-mega", "steelix-mega", "scizor-mega",
  "heracross-mega", "houndoom-mega", "tyranitar-mega", "gardevoir-mega",
  "sableye-mega", "aggron-mega", "medicham-mega", "manectric-mega",
  "sharpedo-mega", "camerupt-mega", "altaria-mega", "banette-mega",
  "absol-mega", "glalie-mega", "lopunny-mega", "garchomp-mega",
  "lucario-mega", "abomasnow-mega", "gallade-mega", "audino-mega",
  // Pokemon Champions originals that have shipped to Showdown so far
  "clefable-mega", "victreebel-mega", "starmie-mega", "dragonite-mega",
  "meganium-mega", "feraligatr-mega", "skarmory-mega", "froslass-mega",
  "emboar-mega",
]);

/** Reg M-A Megas that have sprites on Showdown — the only ones we link to. */
export function getRegMAMegasWithSprites(): MegaPokemonEntry[] {
  return getRegMAMegas().filter((m) => MEGAS_WITH_SPRITES.has(m.dataKey));
}

/** Whether a Mega entry currently has a usable sprite on Showdown. */
export function hasMegaSprite(dataKey: string): boolean {
  return MEGAS_WITH_SPRITES.has(dataKey);
}

/** Lookup by URL slug */
export const MEGA_BY_SLUG = new Map(
  MEGA_POKEMON_LIST.map((m) => [m.slug, m]),
);

/** Lookup by data key (e.g. "kangaskhan-mega") */
export const MEGA_BY_KEY = new Map(
  MEGA_POKEMON_LIST.map((m) => [m.dataKey, m]),
);
