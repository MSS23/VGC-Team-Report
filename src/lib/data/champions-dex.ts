import { CHAMPIONS_REG_MA_MEGAS } from "@/lib/data/mega-pokemon";

/**
 * Pokemon available in the Champions format (Regulation M-A).
 * Source: https://www.serebii.net/pokemonchampions/pokemon.shtml
 *
 * Keys are lowercase-hyphenated species names matching POKEMON_DATA keys.
 *
 * The Mega section is derived from CHAMPIONS_REG_MA_MEGAS (mega-pokemon.ts)
 * rather than maintained as a manual mirror — this ensures the two sources
 * can never drift out of sync.
 */
export const CHAMPIONS_DEX = new Set<string>([
  // Gen 1
  "venusaur",
  "charizard",
  "blastoise",
  "beedrill",
  "pikachu",
  "raichu",
  "raichu-alola",
  "clefable",
  "ninetales",
  "ninetales-alola",
  "arcanine",
  "arcanine-hisui",
  "alakazam",
  "victreebel",
  "slowbro",
  "slowbro-galar",
  "gengar",
  "kangaskhan",
  "starmie",
  "pinsir",
  "gyarados",
  "ditto",
  "vaporeon",
  "jolteon",
  "flareon",
  "aerodactyl",
  "snorlax",
  "dragonite",

  // Gen 2
  "meganium",
  "typhlosion",
  "typhlosion-hisui",
  "feraligatr",
  "ampharos",
  "azumarill",
  "politoed",
  "espeon",
  "umbreon",
  "slowking",
  "steelix",
  "scizor",
  "heracross",
  "skarmory",
  "houndoom",
  "tyranitar",

  // Gen 3
  "pelipper",
  "gardevoir",
  "sableye",
  "aggron",
  "torkoal",
  "altaria",
  "milotic",
  "absol",
  "metagross",

  // Gen 4
  "torterra",
  "infernape",
  "empoleon",
  "lopunny",
  "spiritomb",
  "garchomp",
  "lucario",
  "hippowdon",
  "abomasnow",
  "weavile",
  "rhyperior",
  "leafeon",
  "glaceon",
  "gliscor",
  "gallade",
  "froslass",
  "rotom",
  "rotom-heat",
  "rotom-wash",
  "rotom-frost",
  "rotom-fan",
  "rotom-mow",

  // Gen 5
  "serperior",
  "emboar",
  "samurott",
  "samurott-hisui",
  "excadrill",
  "audino",
  "conkeldurr",
  "whimsicott",
  "krookodile",
  "garbodor",
  "zoroark",
  "zoroark-hisui",
  "vanilluxe",
  "emolga",
  "stunfisk",
  "golurk",
  "hydreigon",
  "volcarona",

  // Gen 6
  "chesnaught",
  "delphox",
  "greninja",
  "diggersby",
  "talonflame",
  "vivillon",
  "furfrou",
  "meowstic",
  "aegislash",
  "clawitzer",
  "tyrantrum",
  "aurorus",
  "sylveon",
  "hawlucha",
  "klefki",
  "gourgeist",
  "noivern",

  // Gen 7
  "decidueye",
  "decidueye-hisui",
  "incineroar",
  "primarina",
  "toucannon",
  "crabominable",
  "lycanroc",
  "toxapex",
  "mudsdale",
  "araquanid",
  "tsareena",
  "oranguru",
  "mimikyu",
  "drampa",
  "kommo-o",

  // Gen 8
  "corviknight",
  "sandaconda",
  "polteageist",
  "hatterene",
  "mr-rime",
  "runerigus",
  "alcremie",
  "morpeko",
  "dragapult",

  // Gen 8 - Hisui
  "kleavor",
  "ursaluna",
  "basculegion",
  "sneasler",

  // Gen 9
  "meowscarada",
  "quaquaval",
  "pawmot",
  "maushold",
  "garganacl",
  "armarouge",
  "ceruledge",
  "scovillain",
  "tinkaton",
  "palafin",
  "orthworm",
  "glimmora",
  "dondozo",
  "tatsugiri",
  "farigiraf",
  "kingambit",
  "sinistcha",
  "archaludon",
  "hydrapple",

  // Mega Evolutions — derived from CHAMPIONS_REG_MA_MEGAS (mega-pokemon.ts)
  // so this set never drifts from the canonical legality source.
  // Notable absences: Salamence, Metagross, Mawile — all have Megas but
  // none are Reg M-A legal, and they are correctly absent from
  // CHAMPIONS_REG_MA_MEGAS.
  ...CHAMPIONS_REG_MA_MEGAS,
]);
