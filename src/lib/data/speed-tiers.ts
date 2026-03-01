export interface SpeedBenchmark {
  pokemon: string;
  baseSpe: number;
  /** Speed stat at level 50 with max EVs and positive nature */
  maxPositive: number;
  /** Speed stat at level 50 with max EVs and neutral nature */
  maxNeutral: number;
  /** Speed stat at level 50 with 0 EVs, 0 IVs, negative nature (for Trick Room) */
  minNegative: number;
}

// Formula (level 50, non-HP stat):
//   floor(floor((2 * base + IV + floor(EV / 4)) * 50 / 100 + 5) * nature_modifier)
//
// maxPositive  : IV=31, EV=252, nature=1.1
// maxNeutral   : IV=31, EV=252, nature=1.0
// minNegative  : IV=0,  EV=0,   nature=0.9

export const SPEED_BENCHMARKS: SpeedBenchmark[] = [
  // Sorted by baseSpe descending
  { pokemon: "Regieleki",          baseSpe: 200, maxPositive: 277, maxNeutral: 252, minNegative: 184 },
  { pokemon: "Electrode",          baseSpe: 150, maxPositive: 222, maxNeutral: 202, minNegative: 139 },
  { pokemon: "Calyrex-Shadow",     baseSpe: 150, maxPositive: 222, maxNeutral: 202, minNegative: 139 },
  { pokemon: "Dragapult",          baseSpe: 142, maxPositive: 213, maxNeutral: 194, minNegative: 132 },
  { pokemon: "Iron Bundle",        baseSpe: 136, maxPositive: 206, maxNeutral: 188, minNegative: 126 },
  { pokemon: "Flutter Mane",       baseSpe: 135, maxPositive: 205, maxNeutral: 187, minNegative: 126 },
  { pokemon: "Koraidon",           baseSpe: 135, maxPositive: 205, maxNeutral: 187, minNegative: 126 },
  { pokemon: "Miraidon",           baseSpe: 135, maxPositive: 205, maxNeutral: 187, minNegative: 126 },
  { pokemon: "Chien-Pao",          baseSpe: 135, maxPositive: 205, maxNeutral: 187, minNegative: 126 },
  { pokemon: "Mewtwo",             baseSpe: 130, maxPositive: 200, maxNeutral: 182, minNegative: 121 },
  { pokemon: "Talonflame",         baseSpe: 126, maxPositive: 195, maxNeutral: 178, minNegative: 117 },
  { pokemon: "Weavile",            baseSpe: 125, maxPositive: 194, maxNeutral: 177, minNegative: 117 },
  { pokemon: "Roaring Moon",       baseSpe: 119, maxPositive: 188, maxNeutral: 171, minNegative: 111 },
  { pokemon: "Iron Valiant",       baseSpe: 116, maxPositive: 184, maxNeutral: 168, minNegative: 108 },
  { pokemon: "Whimsicott",         baseSpe: 116, maxPositive: 184, maxNeutral: 168, minNegative: 108 },
  { pokemon: "Thundurus",          baseSpe: 111, maxPositive: 179, maxNeutral: 163, minNegative: 104 },
  { pokemon: "Tornadus",           baseSpe: 111, maxPositive: 179, maxNeutral: 163, minNegative: 104 },
  { pokemon: "Ogerpon",            baseSpe: 110, maxPositive: 178, maxNeutral: 162, minNegative: 103 },
  { pokemon: "Iron Moth",          baseSpe: 110, maxPositive: 178, maxNeutral: 162, minNegative: 103 },
  { pokemon: "Ninetales-Alola",    baseSpe: 109, maxPositive: 177, maxNeutral: 161, minNegative: 102 },
  { pokemon: "Walking Wake",       baseSpe: 109, maxPositive: 177, maxNeutral: 161, minNegative: 102 },
  { pokemon: "Garchomp",           baseSpe: 102, maxPositive: 169, maxNeutral: 154, minNegative:  96 },
  { pokemon: "Palafin",            baseSpe: 100, maxPositive: 167, maxNeutral: 152, minNegative:  94 },
  { pokemon: "Chi-Yu",             baseSpe: 100, maxPositive: 167, maxNeutral: 152, minNegative:  94 },
  { pokemon: "Volcarona",          baseSpe: 100, maxPositive: 167, maxNeutral: 152, minNegative:  94 },
  { pokemon: "Hydreigon",          baseSpe:  98, maxPositive: 165, maxNeutral: 150, minNegative:  92 },
  { pokemon: "Urshifu",            baseSpe:  97, maxPositive: 163, maxNeutral: 149, minNegative:  91 },
  { pokemon: "Indeedee-F",         baseSpe:  95, maxPositive: 161, maxNeutral: 147, minNegative:  90 },
  { pokemon: "Arcanine",           baseSpe:  95, maxPositive: 161, maxNeutral: 147, minNegative:  90 },
  { pokemon: "Raging Bolt",        baseSpe:  91, maxPositive: 157, maxNeutral: 143, minNegative:  86 },
  { pokemon: "Landorus-Therian",   baseSpe:  91, maxPositive: 157, maxNeutral: 143, minNegative:  86 },
  { pokemon: "Gouging Fire",       baseSpe:  91, maxPositive: 157, maxNeutral: 143, minNegative:  86 },
  { pokemon: "Annihilape",         baseSpe:  90, maxPositive: 156, maxNeutral: 142, minNegative:  85 },
  { pokemon: "Excadrill",          baseSpe:  88, maxPositive: 154, maxNeutral: 140, minNegative:  83 },
  { pokemon: "Great Tusk",         baseSpe:  87, maxPositive: 152, maxNeutral: 139, minNegative:  82 },
  { pokemon: "Archaludon",         baseSpe:  85, maxPositive: 150, maxNeutral: 137, minNegative:  81 },
  { pokemon: "Rillaboom",          baseSpe:  85, maxPositive: 150, maxNeutral: 137, minNegative:  81 },
  { pokemon: "Cresselia",          baseSpe:  85, maxPositive: 150, maxNeutral: 137, minNegative:  81 },
  { pokemon: "Gholdengo",          baseSpe:  84, maxPositive: 149, maxNeutral: 136, minNegative:  80 },
  { pokemon: "Gyarados",           baseSpe:  81, maxPositive: 146, maxNeutral: 133, minNegative:  77 },
  { pokemon: "Dragonite",          baseSpe:  80, maxPositive: 145, maxNeutral: 132, minNegative:  76 },
  { pokemon: "Heatran",            baseSpe:  77, maxPositive: 141, maxNeutral: 129, minNegative:  73 },
  { pokemon: "Pelipper",           baseSpe:  65, maxPositive: 128, maxNeutral: 117, minNegative:  63 },
  { pokemon: "Tyranitar",          baseSpe:  61, maxPositive: 124, maxNeutral: 113, minNegative:  59 },
  { pokemon: "Incineroar",         baseSpe:  60, maxPositive: 123, maxNeutral: 112, minNegative:  58 },
  { pokemon: "Porygon2",           baseSpe:  60, maxPositive: 123, maxNeutral: 112, minNegative:  58 },
  { pokemon: "Grimmsnarl",         baseSpe:  60, maxPositive: 123, maxNeutral: 112, minNegative:  58 },
  { pokemon: "Farigiraf",          baseSpe:  60, maxPositive: 123, maxNeutral: 112, minNegative:  58 },
  { pokemon: "Bloodmoon Ursaluna", baseSpe:  52, maxPositive: 114, maxNeutral: 104, minNegative:  51 },
  { pokemon: "Kingambit",          baseSpe:  50, maxPositive: 112, maxNeutral: 102, minNegative:  49 },
  { pokemon: "Iron Hands",         baseSpe:  50, maxPositive: 112, maxNeutral: 102, minNegative:  49 },
  { pokemon: "Amoonguss",          baseSpe:  30, maxPositive:  90, maxNeutral:  82, minNegative:  31 },
  { pokemon: "Dusclops",           baseSpe:  25, maxPositive:  84, maxNeutral:  77, minNegative:  27 },
  { pokemon: "Torkoal",            baseSpe:  20, maxPositive:  79, maxNeutral:  72, minNegative:  22 },
];
