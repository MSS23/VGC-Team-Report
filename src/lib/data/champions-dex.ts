import { CHAMPIONS_REG_MA_MEGAS, CHAMPIONS_REG_MB_MEGAS } from "./mega-pokemon";

/**
 * Base-form Pokemon available in the Champions format (Regulation M-A).
 * Source: https://www.serebii.net/pokemonchampions/rankedbattle/regulationm-a.shtml
 * (Cross-referenced 2026-05-07.)
 *
 * Keys are lowercase-hyphenated species names matching POKEMON_DATA keys.
 *
 * NOTE: This list intentionally excludes Mega forms — they are merged in
 * below from CHAMPIONS_REG_MA_MEGAS so we have one source of truth for
 * Mega legality (see VGC-144). Edit Mega entries in mega-pokemon.ts only.
 *
 * Notable absences (have Megas but their base form is NOT Reg M-A legal,
 * and therefore neither is the Mega): Salamence, Metagross, Mawile.
 */
const CHAMPIONS_BASE_DEX = new Set<string>([
  // Gen 1
  "venusaur",
  "charizard",
  "blastoise",
  "beedrill",
  "pidgeot",
  "arbok",
  "pikachu",
  "raichu",
  "raichu-alola",
  "clefable",
  "ninetales",
  "ninetales-alola",
  "arcanine",
  "arcanine-hisui",
  "alakazam",
  "machamp",
  "victreebel",
  "slowbro",
  "slowbro-galar",
  "gengar",
  "kangaskhan",
  "tauros",
  "tauros-paldea-combat",
  "tauros-paldea-blaze",
  "tauros-paldea-aqua",
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
  "ariados",
  "ampharos",
  "azumarill",
  "politoed",
  "espeon",
  "umbreon",
  "slowking",
  "slowking-galar",
  "forretress",
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
  "medicham",
  "manectric",
  "sharpedo",
  "camerupt",
  "torkoal",
  "altaria",
  "milotic",
  "castform",
  "banette",
  "chimecho",
  "absol",
  "glalie",

  // Gen 4
  "torterra",
  "infernape",
  "empoleon",
  "luxray",
  "roserade",
  "rampardos",
  "bastiodon",
  "lopunny",
  "spiritomb",
  "garchomp",
  "lucario",
  "hippowdon",
  "toxicroak",
  "abomasnow",
  "weavile",
  "rhyperior",
  "leafeon",
  "glaceon",
  "mamoswine",
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
  "patrat",
  "liepard",
  "simisage",
  "simisear",
  "simipour",
  "excadrill",
  "audino",
  "conkeldurr",
  "whimsicott",
  "krookodile",
  "cofagrigus",
  "garbodor",
  "zoroark",
  "zoroark-hisui",
  "reuniclus",
  "vanilluxe",
  "emolga",
  "chandelure",
  "beartic",
  "stunfisk",
  "stunfisk-galar",
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
  "floette",
  "floette-eternal",
  "florges",
  "pangoro",
  "furfrou",
  "meowstic",
  "aegislash",
  "aromatisse",
  "slurpuff",
  "clawitzer",
  "heliolisk",
  "tyrantrum",
  "aurorus",
  "sylveon",
  "hawlucha",
  "dedenne",
  "goodra",
  "goodra-hisui",
  "klefki",
  "trevenant",
  "gourgeist",
  "avalugg",
  "avalugg-hisui",
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
  "salazzle",
  "tsareena",
  "oranguru",
  "passimian",
  "mimikyu",
  "drampa",
  "kommo-o",

  // Gen 8
  "corviknight",
  "flapple",
  "appletun",
  "sandaconda",
  "polteageist",
  "hatterene",
  "mr-rime",
  "runerigus",
  "alcremie",
  "morpeko",
  "dragapult",

  // Gen 8 - Hisui
  "wyrdeer",
  "kleavor",
  "basculegion",
  "sneasler",

  // Gen 9
  "meowscarada",
  "skeledirge",
  "quaquaval",
  "maushold",
  "garganacl",
  "armarouge",
  "ceruledge",
  "bellibolt",
  "scovillain",
  "espathra",
  "tinkaton",
  "palafin",
  "orthworm",
  "glimmora",
  "farigiraf",
  "kingambit",
  "sinistcha",
  "archaludon",
  "hydrapple",
]);

/**
 * Full Champions Regulation M-A dex: base forms + all Reg M-A legal Megas.
 *
 * Megas are merged in from CHAMPIONS_REG_MA_MEGAS (mega-pokemon.ts) so the
 * Mega list lives in exactly one place. Add new base forms above; add new
 * Mega entries to MEGA_POKEMON_LIST + CHAMPIONS_REG_MA_MEGAS in
 * mega-pokemon.ts.
 */
export const CHAMPIONS_DEX = new Set<string>([
  ...CHAMPIONS_BASE_DEX,
  ...CHAMPIONS_REG_MA_MEGAS,
]);

/**
 * Base-form Pokemon NEWLY added in Regulation M-B (not legal in Reg M-A).
 * Source: https://www.serebii.net/pokemonchampions/rankedbattle/regulationm-b.shtml
 * (cross-referenced June 2026.) All already exist in POKEMON_DATA. The Megas
 * for these (where they exist) live in CHAMPIONS_REG_MB_MEGAS (mega-pokemon.ts).
 */
const CHAMPIONS_MB_BASE_ADDITIONS = new Set<string>([
  "vileplume",
  "qwilfish",
  "sceptile",
  "blaziken",
  "swampert",
  "mawile",
  "metagross",
  "staraptor",
  "musharna",
  "scolipede",
  "scrafty",
  "eelektross",
  "pyroar",
  "malamar",
  "barbaracle",
  "dragalge",
  "grimmsnarl",
  "falinks",
  "overqwil",
  "houndstone",
  "annihilape",
  "gholdengo",
]);

/**
 * Full Champions Regulation M-B dex. Reg M-B is a SUPERSET of Reg M-A: every
 * M-A species is M-B legal, plus the base additions above and the 16 new M-B
 * Megas (CHAMPIONS_REG_MB_MEGAS already folds in the M-A Megas). M-A teams are
 * legal in M-B; M-B-only picks are NOT legal in M-A.
 */
export const CHAMPIONS_MB_DEX = new Set<string>([
  ...CHAMPIONS_DEX,
  ...CHAMPIONS_MB_BASE_ADDITIONS,
  ...CHAMPIONS_REG_MB_MEGAS,
]);
