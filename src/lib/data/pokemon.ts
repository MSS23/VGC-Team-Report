import type { PokemonData, PokemonType } from "@/lib/types/pokemon";

export const POKEMON_DATA: Record<string, PokemonData> = {
  // ── Restricted / Legendary ──────────────────────────────────────────────────

  "koraidon": {
    name: "Koraidon",
    types: ["Fighting", "Dragon"],
    baseStats: { hp: 100, atk: 135, def: 115, spa: 85, spd: 100, spe: 135 },
    abilities: ["Orichalcum Pulse"],
  },

  "miraidon": {
    name: "Miraidon",
    types: ["Electric", "Dragon"],
    baseStats: { hp: 100, atk: 85, def: 100, spa: 135, spd: 115, spe: 135 },
    abilities: ["Hadron Engine"],
  },

  "calyrex-ice": {
    name: "Calyrex-Ice",
    types: ["Psychic", "Ice"],
    baseStats: { hp: 100, atk: 165, def: 150, spa: 85, spd: 130, spe: 50 },
    abilities: ["As One (Glastrier)", "Unnerve"],
  },

  "calyrex-shadow": {
    name: "Calyrex-Shadow",
    types: ["Psychic", "Ghost"],
    baseStats: { hp: 100, atk: 85, def: 80, spa: 165, spd: 100, spe: 150 },
    abilities: ["As One (Spectrier)", "Unnerve"],
  },

  "kyogre": {
    name: "Kyogre",
    types: ["Water"],
    baseStats: { hp: 100, atk: 100, def: 90, spa: 150, spd: 140, spe: 90 },
    abilities: ["Drizzle"],
  },

  "groudon": {
    name: "Groudon",
    types: ["Ground"],
    baseStats: { hp: 100, atk: 150, def: 140, spa: 100, spd: 90, spe: 90 },
    abilities: ["Drought"],
  },

  "zacian": {
    name: "Zacian",
    types: ["Fairy"],
    baseStats: { hp: 92, atk: 120, def: 115, spa: 80, spd: 115, spe: 138 },
    abilities: ["Intrepid Sword"],
  },

  "zacian-crowned": {
    name: "Zacian-Crowned",
    types: ["Fairy", "Steel"],
    baseStats: { hp: 92, atk: 150, def: 115, spa: 80, spd: 115, spe: 148 },
    abilities: ["Intrepid Sword"],
  },

  "palkia": {
    name: "Palkia",
    types: ["Water", "Dragon"],
    baseStats: { hp: 90, atk: 120, def: 100, spa: 150, spd: 120, spe: 100 },
    abilities: ["Pressure"],
  },

  "palkia-origin": {
    name: "Palkia-Origin",
    types: ["Water", "Dragon"],
    baseStats: { hp: 90, atk: 120, def: 100, spa: 150, spd: 120, spe: 100 },
    abilities: ["Pressure"],
  },

  "dialga": {
    name: "Dialga",
    types: ["Steel", "Dragon"],
    baseStats: { hp: 100, atk: 120, def: 120, spa: 150, spd: 100, spe: 90 },
    abilities: ["Pressure"],
  },

  "dialga-origin": {
    name: "Dialga-Origin",
    types: ["Steel", "Dragon"],
    baseStats: { hp: 100, atk: 120, def: 120, spa: 150, spd: 100, spe: 90 },
    abilities: ["Pressure"],
  },

  "giratina": {
    name: "Giratina",
    types: ["Ghost", "Dragon"],
    baseStats: { hp: 150, atk: 100, def: 120, spa: 100, spd: 120, spe: 90 },
    abilities: ["Pressure", "Telepathy"],
  },

  "giratina-origin": {
    name: "Giratina-Origin",
    types: ["Ghost", "Dragon"],
    baseStats: { hp: 150, atk: 120, def: 100, spa: 120, spd: 100, spe: 90 },
    abilities: ["Levitate"],
  },

  "rayquaza": {
    name: "Rayquaza",
    types: ["Dragon", "Flying"],
    baseStats: { hp: 105, atk: 150, def: 90, spa: 150, spd: 90, spe: 95 },
    abilities: ["Air Lock"],
  },

  "lunala": {
    name: "Lunala",
    types: ["Psychic", "Ghost"],
    baseStats: { hp: 137, atk: 113, def: 89, spa: 137, spd: 107, spe: 97 },
    abilities: ["Shadow Shield"],
  },

  "solgaleo": {
    name: "Solgaleo",
    types: ["Psychic", "Steel"],
    baseStats: { hp: 137, atk: 137, def: 107, spa: 113, spd: 89, spe: 97 },
    abilities: ["Full Metal Body"],
  },

  "eternatus": {
    name: "Eternatus",
    types: ["Poison", "Dragon"],
    baseStats: { hp: 140, atk: 85, def: 95, spa: 145, spd: 95, spe: 130 },
    abilities: ["Pressure"],
  },

  "mewtwo": {
    name: "Mewtwo",
    types: ["Psychic"],
    baseStats: { hp: 106, atk: 110, def: 90, spa: 154, spd: 90, spe: 130 },
    abilities: ["Pressure", "Unnerve"],
  },

  "entei": {
    name: "Entei",
    types: ["Fire"],
    baseStats: { hp: 115, atk: 115, def: 85, spa: 90, spd: 75, spe: 100 },
    abilities: ["Pressure", "Inner Focus"],
  },

  "raikou": {
    name: "Raikou",
    types: ["Electric"],
    baseStats: { hp: 90, atk: 85, def: 75, spa: 115, spd: 100, spe: 115 },
    abilities: ["Pressure", "Inner Focus"],
  },

  "suicune": {
    name: "Suicune",
    types: ["Water"],
    baseStats: { hp: 100, atk: 75, def: 115, spa: 90, spd: 115, spe: 85 },
    abilities: ["Pressure", "Inner Focus"],
  },

  "ho-oh": {
    name: "Ho-Oh",
    types: ["Fire", "Flying"],
    baseStats: { hp: 106, atk: 130, def: 90, spa: 110, spd: 154, spe: 90 },
    abilities: ["Pressure", "Regenerator"],
  },

  "lugia": {
    name: "Lugia",
    types: ["Psychic", "Flying"],
    baseStats: { hp: 106, atk: 90, def: 130, spa: 90, spd: 154, spe: 110 },
    abilities: ["Pressure", "Multiscale"],
  },

  "reshiram": {
    name: "Reshiram",
    types: ["Dragon", "Fire"],
    baseStats: { hp: 100, atk: 120, def: 100, spa: 150, spd: 120, spe: 90 },
    abilities: ["Turboblaze"],
  },

  "zekrom": {
    name: "Zekrom",
    types: ["Dragon", "Electric"],
    baseStats: { hp: 100, atk: 150, def: 120, spa: 120, spd: 100, spe: 90 },
    abilities: ["Teravolt"],
  },

  "kyurem": {
    name: "Kyurem",
    types: ["Dragon", "Ice"],
    baseStats: { hp: 125, atk: 130, def: 90, spa: 130, spd: 90, spe: 95 },
    abilities: ["Pressure"],
  },

  "kyurem-white": {
    name: "Kyurem-White",
    types: ["Dragon", "Ice"],
    baseStats: { hp: 125, atk: 120, def: 90, spa: 170, spd: 100, spe: 95 },
    abilities: ["Turboblaze"],
  },

  "kyurem-black": {
    name: "Kyurem-Black",
    types: ["Dragon", "Ice"],
    baseStats: { hp: 125, atk: 170, def: 100, spa: 120, spd: 90, spe: 95 },
    abilities: ["Teravolt"],
  },

  // ── Paradox Pokemon ─────────────────────────────────────────────────────────

  "flutter-mane": {
    name: "Flutter Mane",
    types: ["Ghost", "Fairy"],
    baseStats: { hp: 55, atk: 55, def: 55, spa: 135, spd: 135, spe: 135 },
    abilities: ["Protosynthesis"],
  },

  "iron-hands": {
    name: "Iron Hands",
    types: ["Fighting", "Electric"],
    baseStats: { hp: 154, atk: 140, def: 108, spa: 50, spd: 68, spe: 50 },
    abilities: ["Quark Drive"],
  },

  "iron-bundle": {
    name: "Iron Bundle",
    types: ["Ice", "Water"],
    baseStats: { hp: 56, atk: 80, def: 114, spa: 124, spd: 60, spe: 136 },
    abilities: ["Quark Drive"],
  },

  "iron-valiant": {
    name: "Iron Valiant",
    types: ["Fairy", "Fighting"],
    baseStats: { hp: 74, atk: 130, def: 90, spa: 120, spd: 60, spe: 116 },
    abilities: ["Quark Drive"],
  },

  "iron-moth": {
    name: "Iron Moth",
    types: ["Fire", "Poison"],
    baseStats: { hp: 80, atk: 70, def: 60, spa: 140, spd: 110, spe: 110 },
    abilities: ["Quark Drive"],
  },

  "iron-thorns": {
    name: "Iron Thorns",
    types: ["Rock", "Electric"],
    baseStats: { hp: 100, atk: 134, def: 110, spa: 70, spd: 84, spe: 72 },
    abilities: ["Quark Drive"],
  },

  "iron-jugulis": {
    name: "Iron Jugulis",
    types: ["Dark", "Flying"],
    baseStats: { hp: 94, atk: 80, def: 86, spa: 122, spd: 80, spe: 108 },
    abilities: ["Quark Drive"],
  },

  "iron-leaves": {
    name: "Iron Leaves",
    types: ["Grass", "Psychic"],
    baseStats: { hp: 90, atk: 130, def: 88, spa: 70, spd: 108, spe: 104 },
    abilities: ["Quark Drive"],
  },

  "iron-boulder": {
    name: "Iron Boulder",
    types: ["Rock", "Psychic"],
    baseStats: { hp: 90, atk: 120, def: 80, spa: 68, spd: 108, spe: 124 },
    abilities: ["Quark Drive"],
  },

  "iron-crown": {
    name: "Iron Crown",
    types: ["Steel", "Psychic"],
    baseStats: { hp: 90, atk: 72, def: 100, spa: 122, spd: 108, spe: 98 },
    abilities: ["Quark Drive"],
  },

  "great-tusk": {
    name: "Great Tusk",
    types: ["Ground", "Fighting"],
    baseStats: { hp: 115, atk: 131, def: 131, spa: 53, spd: 53, spe: 87 },
    abilities: ["Protosynthesis"],
  },

  "brute-bonnet": {
    name: "Brute Bonnet",
    types: ["Grass", "Dark"],
    baseStats: { hp: 111, atk: 127, def: 99, spa: 79, spd: 99, spe: 55 },
    abilities: ["Protosynthesis"],
  },

  "scream-tail": {
    name: "Scream Tail",
    types: ["Fairy", "Psychic"],
    baseStats: { hp: 115, atk: 65, def: 99, spa: 65, spd: 115, spe: 111 },
    abilities: ["Protosynthesis"],
  },

  "sandy-shocks": {
    name: "Sandy Shocks",
    types: ["Electric", "Ground"],
    baseStats: { hp: 85, atk: 81, def: 97, spa: 121, spd: 85, spe: 101 },
    abilities: ["Protosynthesis"],
  },

  "slither-wing": {
    name: "Slither Wing",
    types: ["Bug", "Fighting"],
    baseStats: { hp: 85, atk: 135, def: 79, spa: 85, spd: 105, spe: 81 },
    abilities: ["Protosynthesis"],
  },

  "roaring-moon": {
    name: "Roaring Moon",
    types: ["Dragon", "Dark"],
    baseStats: { hp: 105, atk: 139, def: 71, spa: 55, spd: 101, spe: 119 },
    abilities: ["Protosynthesis"],
  },

  "walking-wake": {
    name: "Walking Wake",
    types: ["Water", "Dragon"],
    baseStats: { hp: 99, atk: 83, def: 91, spa: 125, spd: 83, spe: 109 },
    abilities: ["Protosynthesis"],
  },

  "gouging-fire": {
    name: "Gouging Fire",
    types: ["Fire", "Dragon"],
    baseStats: { hp: 105, atk: 115, def: 121, spa: 65, spd: 93, spe: 91 },
    abilities: ["Protosynthesis"],
  },

  "raging-bolt": {
    name: "Raging Bolt",
    types: ["Electric", "Dragon"],
    baseStats: { hp: 125, atk: 73, def: 91, spa: 137, spd: 89, spe: 75 },
    abilities: ["Protosynthesis"],
  },

  // ── Competitive Staples ──────────────────────────────────────────────────────

  "incineroar": {
    name: "Incineroar",
    types: ["Fire", "Dark"],
    baseStats: { hp: 95, atk: 115, def: 90, spa: 80, spd: 90, spe: 60 },
    abilities: ["Intimidate", "Blaze", "Unnerve"],
  },

  "rillaboom": {
    name: "Rillaboom",
    types: ["Grass"],
    baseStats: { hp: 100, atk: 125, def: 90, spa: 60, spd: 70, spe: 85 },
    abilities: ["Grassy Surge", "Overgrow"],
  },

  "amoonguss": {
    name: "Amoonguss",
    types: ["Grass", "Poison"],
    baseStats: { hp: 114, atk: 85, def: 70, spa: 85, spd: 80, spe: 30 },
    abilities: ["Regenerator", "Effect Spore"],
  },

  "urshifu": {
    name: "Urshifu",
    types: ["Fighting", "Dark"],
    baseStats: { hp: 100, atk: 130, def: 100, spa: 63, spd: 60, spe: 97 },
    abilities: ["Unseen Fist"],
  },

  "urshifu-rapid-strike": {
    name: "Urshifu-Rapid-Strike",
    types: ["Fighting", "Water"],
    baseStats: { hp: 100, atk: 130, def: 100, spa: 63, spd: 60, spe: 97 },
    abilities: ["Unseen Fist"],
  },

  "tornadus": {
    name: "Tornadus",
    types: ["Flying"],
    baseStats: { hp: 79, atk: 115, def: 70, spa: 125, spd: 80, spe: 111 },
    abilities: ["Prankster", "Defiant"],
  },

  "tornadus-therian": {
    name: "Tornadus-Therian",
    types: ["Flying"],
    baseStats: { hp: 79, atk: 100, def: 80, spa: 110, spd: 90, spe: 121 },
    abilities: ["Regenerator"],
  },

  "landorus": {
    name: "Landorus",
    types: ["Ground", "Flying"],
    baseStats: { hp: 89, atk: 125, def: 90, spa: 115, spd: 80, spe: 101 },
    abilities: ["Sand Force", "Sheer Force"],
  },

  "landorus-therian": {
    name: "Landorus-Therian",
    types: ["Ground", "Flying"],
    baseStats: { hp: 89, atk: 145, def: 90, spa: 105, spd: 80, spe: 91 },
    abilities: ["Intimidate"],
  },

  "thundurus": {
    name: "Thundurus",
    types: ["Electric", "Flying"],
    baseStats: { hp: 79, atk: 115, def: 70, spa: 125, spd: 80, spe: 111 },
    abilities: ["Prankster", "Defiant"],
  },

  "thundurus-therian": {
    name: "Thundurus-Therian",
    types: ["Electric", "Flying"],
    baseStats: { hp: 79, atk: 105, def: 70, spa: 145, spd: 80, spe: 101 },
    abilities: ["Volt Absorb"],
  },

  "heatran": {
    name: "Heatran",
    types: ["Fire", "Steel"],
    baseStats: { hp: 91, atk: 90, def: 106, spa: 130, spd: 106, spe: 77 },
    abilities: ["Flash Fire", "Flame Body"],
  },

  "cresselia": {
    name: "Cresselia",
    types: ["Psychic"],
    baseStats: { hp: 120, atk: 70, def: 120, spa: 75, spd: 130, spe: 85 },
    abilities: ["Levitate"],
  },

  "porygon2": {
    name: "Porygon2",
    types: ["Normal"],
    baseStats: { hp: 85, atk: 80, def: 90, spa: 105, spd: 95, spe: 60 },
    abilities: ["Trace", "Download", "Analytic"],
  },

  "dusclops": {
    name: "Dusclops",
    types: ["Ghost"],
    baseStats: { hp: 40, atk: 70, def: 130, spa: 60, spd: 130, spe: 25 },
    abilities: ["Frisk", "Pressure"],
  },

  "indeedee-f": {
    name: "Indeedee-F",
    types: ["Psychic", "Normal"],
    baseStats: { hp: 70, atk: 55, def: 65, spa: 95, spd: 115, spe: 85 },
    abilities: ["Psychic Surge", "Synchronize", "Own Tempo"],
  },

  "gothitelle": {
    name: "Gothitelle",
    types: ["Psychic"],
    baseStats: { hp: 70, atk: 55, def: 95, spa: 95, spd: 110, spe: 65 },
    abilities: ["Frisk", "Competitive", "Shadow Tag"],
  },

  "pelipper": {
    name: "Pelipper",
    types: ["Water", "Flying"],
    baseStats: { hp: 60, atk: 50, def: 100, spa: 95, spd: 70, spe: 65 },
    abilities: ["Drizzle", "Keen Eye"],
  },

  "torkoal": {
    name: "Torkoal",
    types: ["Fire"],
    baseStats: { hp: 70, atk: 85, def: 140, spa: 85, spd: 70, spe: 20 },
    abilities: ["Drought", "White Smoke", "Shell Armor"],
  },

  "ninetales-alola": {
    name: "Ninetales-Alola",
    types: ["Ice", "Fairy"],
    baseStats: { hp: 73, atk: 67, def: 75, spa: 81, spd: 100, spe: 109 },
    abilities: ["Snow Warning", "Snow Cloak"],
  },

  "tyranitar": {
    name: "Tyranitar",
    types: ["Rock", "Dark"],
    baseStats: { hp: 100, atk: 134, def: 110, spa: 95, spd: 100, spe: 61 },
    abilities: ["Sand Stream", "Unnerve"],
  },

  "politoed": {
    name: "Politoed",
    types: ["Water"],
    baseStats: { hp: 90, atk: 75, def: 75, spa: 90, spd: 100, spe: 70 },
    abilities: ["Drizzle", "Water Absorb", "Damp"],
  },

  "whimsicott": {
    name: "Whimsicott",
    types: ["Grass", "Fairy"],
    baseStats: { hp: 60, atk: 67, def: 85, spa: 77, spd: 75, spe: 116 },
    abilities: ["Prankster", "Infiltrator"],
  },

  "grimmsnarl": {
    name: "Grimmsnarl",
    types: ["Dark", "Fairy"],
    baseStats: { hp: 95, atk: 120, def: 65, spa: 95, spd: 75, spe: 60 },
    abilities: ["Prankster", "Frisk", "Pickpocket"],
  },

  "arcanine": {
    name: "Arcanine",
    types: ["Fire"],
    baseStats: { hp: 90, atk: 110, def: 80, spa: 100, spd: 80, spe: 95 },
    abilities: ["Intimidate", "Flash Fire", "Justified"],
  },

  "arcanine-hisui": {
    name: "Arcanine-Hisui",
    types: ["Fire", "Rock"],
    baseStats: { hp: 95, atk: 115, def: 80, spa: 95, spd: 80, spe: 90 },
    abilities: ["Intimidate", "Flash Fire", "Rock Head"],
  },

  "farigiraf": {
    name: "Farigiraf",
    types: ["Normal", "Psychic"],
    baseStats: { hp: 120, atk: 90, def: 70, spa: 110, spd: 70, spe: 60 },
    abilities: ["Cud Chew", "Armor Tail", "Sap Sipper"],
  },

  "dondozo": {
    name: "Dondozo",
    types: ["Water"],
    baseStats: { hp: 150, atk: 100, def: 115, spa: 65, spd: 65, spe: 35 },
    abilities: ["Unaware", "Oblivious", "Water Veil"],
  },

  "tatsugiri": {
    name: "Tatsugiri",
    types: ["Dragon", "Water"],
    baseStats: { hp: 68, atk: 50, def: 60, spa: 120, spd: 95, spe: 82 },
    abilities: ["Commander", "Storm Drain"],
  },

  "annihilape": {
    name: "Annihilape",
    types: ["Fighting", "Ghost"],
    baseStats: { hp: 110, atk: 115, def: 80, spa: 50, spd: 90, spe: 90 },
    abilities: ["Vital Spirit", "Inner Focus", "Defiant"],
  },

  "gholdengo": {
    name: "Gholdengo",
    types: ["Steel", "Ghost"],
    baseStats: { hp: 87, atk: 60, def: 95, spa: 133, spd: 91, spe: 84 },
    abilities: ["Good as Gold"],
  },

  "kingambit": {
    name: "Kingambit",
    types: ["Dark", "Steel"],
    baseStats: { hp: 100, atk: 135, def: 120, spa: 60, spd: 85, spe: 50 },
    abilities: ["Defiant", "Supreme Overlord", "Pressure"],
  },

  "palafin": {
    name: "Palafin",
    types: ["Water"],
    baseStats: { hp: 100, atk: 160, def: 97, spa: 106, spd: 87, spe: 100 },
    abilities: ["Zero to Hero"],
  },

  "chi-yu": {
    name: "Chi-Yu",
    types: ["Dark", "Fire"],
    baseStats: { hp: 55, atk: 80, def: 80, spa: 135, spd: 120, spe: 100 },
    abilities: ["Beads of Ruin"],
  },

  "chien-pao": {
    name: "Chien-Pao",
    types: ["Dark", "Ice"],
    baseStats: { hp: 80, atk: 120, def: 80, spa: 90, spd: 65, spe: 135 },
    abilities: ["Sword of Ruin"],
  },

  "ting-lu": {
    name: "Ting-Lu",
    types: ["Dark", "Ground"],
    baseStats: { hp: 155, atk: 110, def: 125, spa: 55, spd: 80, spe: 45 },
    abilities: ["Vessel of Ruin"],
  },

  "wo-chien": {
    name: "Wo-Chien",
    types: ["Dark", "Grass"],
    baseStats: { hp: 85, atk: 85, def: 100, spa: 95, spd: 135, spe: 70 },
    abilities: ["Tablets of Ruin"],
  },

  "ogerpon": {
    name: "Ogerpon",
    types: ["Grass"],
    baseStats: { hp: 80, atk: 120, def: 84, spa: 60, spd: 96, spe: 110 },
    abilities: ["Defiant"],
  },

  "ogerpon-wellspring": {
    name: "Ogerpon-Wellspring",
    types: ["Grass", "Water"],
    baseStats: { hp: 80, atk: 120, def: 84, spa: 60, spd: 96, spe: 110 },
    abilities: ["Water Absorb"],
  },

  "ogerpon-hearthflame": {
    name: "Ogerpon-Hearthflame",
    types: ["Grass", "Fire"],
    baseStats: { hp: 80, atk: 120, def: 84, spa: 60, spd: 96, spe: 110 },
    abilities: ["Mold Breaker"],
  },

  "ogerpon-cornerstone": {
    name: "Ogerpon-Cornerstone",
    types: ["Grass", "Rock"],
    baseStats: { hp: 80, atk: 120, def: 84, spa: 60, spd: 96, spe: 110 },
    abilities: ["Sturdy"],
  },

  "archaludon": {
    name: "Archaludon",
    types: ["Steel", "Dragon"],
    baseStats: { hp: 90, atk: 105, def: 130, spa: 125, spd: 65, spe: 85 },
    abilities: ["Stamina", "Sand Rush", "Sturdy"],
  },

  "bloodmoon-ursaluna": {
    name: "Bloodmoon Ursaluna",
    types: ["Ground", "Normal"],
    baseStats: { hp: 113, atk: 70, def: 120, spa: 135, spd: 65, spe: 52 },
    abilities: ["Mind's Eye"],
  },

  "ursaluna": {
    name: "Ursaluna",
    types: ["Ground", "Normal"],
    baseStats: { hp: 130, atk: 140, def: 105, spa: 45, spd: 80, spe: 50 },
    abilities: ["Guts", "Bulletproof", "Unnerve"],
  },

  // ── Other Common VGC Picks ───────────────────────────────────────────────────

  "garchomp": {
    name: "Garchomp",
    types: ["Dragon", "Ground"],
    baseStats: { hp: 108, atk: 130, def: 95, spa: 80, spd: 85, spe: 102 },
    abilities: ["Sand Veil", "Rough Skin"],
  },

  "dragapult": {
    name: "Dragapult",
    types: ["Dragon", "Ghost"],
    baseStats: { hp: 88, atk: 120, def: 75, spa: 100, spd: 75, spe: 142 },
    abilities: ["Clear Body", "Infiltrator", "Cursed Body"],
  },

  "dragonite": {
    name: "Dragonite",
    types: ["Dragon", "Flying"],
    baseStats: { hp: 91, atk: 134, def: 95, spa: 100, spd: 100, spe: 80 },
    abilities: ["Inner Focus", "Multiscale"],
  },

  "volcarona": {
    name: "Volcarona",
    types: ["Bug", "Fire"],
    baseStats: { hp: 85, atk: 60, def: 65, spa: 135, spd: 105, spe: 100 },
    abilities: ["Flame Body", "Swarm"],
  },

  "gyarados": {
    name: "Gyarados",
    types: ["Water", "Flying"],
    baseStats: { hp: 95, atk: 125, def: 79, spa: 60, spd: 100, spe: 81 },
    abilities: ["Intimidate", "Moxie"],
  },

  "scizor": {
    name: "Scizor",
    types: ["Bug", "Steel"],
    baseStats: { hp: 70, atk: 130, def: 100, spa: 55, spd: 80, spe: 65 },
    abilities: ["Technician", "Swarm", "Light Metal"],
  },

  "metagross": {
    name: "Metagross",
    types: ["Steel", "Psychic"],
    baseStats: { hp: 80, atk: 135, def: 130, spa: 95, spd: 90, spe: 70 },
    abilities: ["Clear Body", "Light Metal"],
  },

  "excadrill": {
    name: "Excadrill",
    types: ["Ground", "Steel"],
    baseStats: { hp: 110, atk: 135, def: 60, spa: 50, spd: 65, spe: 88 },
    abilities: ["Sand Rush", "Sand Force", "Mold Breaker"],
  },

  "clefairy": {
    name: "Clefairy",
    types: ["Fairy"],
    baseStats: { hp: 70, atk: 45, def: 48, spa: 60, spd: 65, spe: 35 },
    abilities: ["Cute Charm", "Magic Guard", "Friend Guard"],
  },

  "ditto": {
    name: "Ditto",
    types: ["Normal"],
    baseStats: { hp: 48, atk: 48, def: 48, spa: 48, spd: 48, spe: 48 },
    abilities: ["Limber", "Imposter"],
  },

  "murkrow": {
    name: "Murkrow",
    types: ["Dark", "Flying"],
    baseStats: { hp: 60, atk: 85, def: 42, spa: 85, spd: 42, spe: 91 },
    abilities: ["Insomnia", "Super Luck", "Prankster"],
  },

  "sylveon": {
    name: "Sylveon",
    types: ["Fairy"],
    baseStats: { hp: 95, atk: 65, def: 65, spa: 110, spd: 130, spe: 60 },
    abilities: ["Cute Charm", "Pixilate"],
  },

  "mimikyu": {
    name: "Mimikyu",
    types: ["Ghost", "Fairy"],
    baseStats: { hp: 55, atk: 90, def: 80, spa: 50, spd: 105, spe: 96 },
    abilities: ["Disguise"],
  },

  "chansey": {
    name: "Chansey",
    types: ["Normal"],
    baseStats: { hp: 250, atk: 5, def: 5, spa: 35, spd: 105, spe: 50 },
    abilities: ["Natural Cure", "Serene Grace", "Healer"],
  },

  "blissey": {
    name: "Blissey",
    types: ["Normal"],
    baseStats: { hp: 255, atk: 10, def: 10, spa: 75, spd: 135, spe: 55 },
    abilities: ["Natural Cure", "Serene Grace", "Healer"],
  },

  "toxapex": {
    name: "Toxapex",
    types: ["Poison", "Water"],
    baseStats: { hp: 50, atk: 63, def: 152, spa: 53, spd: 142, spe: 35 },
    abilities: ["Merciless", "Limber", "Regenerator"],
  },

  "ferrothorn": {
    name: "Ferrothorn",
    types: ["Grass", "Steel"],
    baseStats: { hp: 74, atk: 94, def: 131, spa: 54, spd: 116, spe: 20 },
    abilities: ["Iron Barbs", "Anticipation"],
  },

  "gastrodon": {
    name: "Gastrodon",
    types: ["Water", "Ground"],
    baseStats: { hp: 111, atk: 83, def: 68, spa: 92, spd: 82, spe: 39 },
    abilities: ["Sticky Hold", "Storm Drain", "Sand Force"],
  },

  "abomasnow": {
    name: "Abomasnow",
    types: ["Grass", "Ice"],
    baseStats: { hp: 90, atk: 92, def: 75, spa: 92, spd: 85, spe: 60 },
    abilities: ["Snow Warning", "Soundproof"],
  },

  "lilligant-hisui": {
    name: "Lilligant-Hisui",
    types: ["Grass", "Fighting"],
    baseStats: { hp: 70, atk: 105, def: 75, spa: 50, spd: 75, spe: 105 },
    abilities: ["Chlorophyll", "Hustle", "Leaf Guard"],
  },

  "basculegion": {
    name: "Basculegion",
    types: ["Water", "Ghost"],
    baseStats: { hp: 120, atk: 112, def: 65, spa: 80, spd: 75, spe: 78 },
    abilities: ["Swift Swim", "Adaptability"],
  },

  "sneasler": {
    name: "Sneasler",
    types: ["Fighting", "Poison"],
    baseStats: { hp: 80, atk: 130, def: 60, spa: 40, spd: 80, spe: 120 },
    abilities: ["Pressure", "Unburden"],
  },

  "overqwil": {
    name: "Overqwil",
    types: ["Dark", "Poison"],
    baseStats: { hp: 85, atk: 115, def: 95, spa: 65, spd: 65, spe: 85 },
    abilities: ["Poison Point", "Swift Swim"],
  },

  "tsareena": {
    name: "Tsareena",
    types: ["Grass"],
    baseStats: { hp: 72, atk: 120, def: 98, spa: 50, spd: 98, spe: 72 },
    abilities: ["Leaf Guard", "Queenly Majesty", "Sweet Veil"],
  },

  "armarouge": {
    name: "Armarouge",
    types: ["Fire", "Psychic"],
    baseStats: { hp: 85, atk: 60, def: 100, spa: 125, spd: 80, spe: 75 },
    abilities: ["Flash Fire", "Weak Armor"],
  },

  "ceruledge": {
    name: "Ceruledge",
    types: ["Fire", "Ghost"],
    baseStats: { hp: 75, atk: 125, def: 80, spa: 60, spd: 100, spe: 85 },
    abilities: ["Flash Fire", "Weak Armor"],
  },

  "talonflame": {
    name: "Talonflame",
    types: ["Fire", "Flying"],
    baseStats: { hp: 78, atk: 81, def: 71, spa: 74, spd: 69, spe: 126 },
    abilities: ["Flame Body", "Gale Wings"],
  },

  "hydreigon": {
    name: "Hydreigon",
    types: ["Dark", "Dragon"],
    baseStats: { hp: 92, atk: 105, def: 90, spa: 125, spd: 90, spe: 98 },
    abilities: ["Levitate"],
  },

  "salamence": {
    name: "Salamence",
    types: ["Dragon", "Flying"],
    baseStats: { hp: 95, atk: 135, def: 80, spa: 110, spd: 80, spe: 100 },
    abilities: ["Intimidate", "Moxie"],
  },

  "kommo-o": {
    name: "Kommo-o",
    types: ["Dragon", "Fighting"],
    baseStats: { hp: 75, atk: 110, def: 125, spa: 100, spd: 105, spe: 85 },
    abilities: ["Bulletproof", "Soundproof", "Overcoat"],
  },

  "goodra-hisui": {
    name: "Goodra-Hisui",
    types: ["Steel", "Dragon"],
    baseStats: { hp: 80, atk: 100, def: 100, spa: 110, spd: 150, spe: 60 },
    abilities: ["Sap Sipper", "Shell Armor", "Gooey"],
  },

  "enamorus": {
    name: "Enamorus",
    types: ["Fairy", "Flying"],
    baseStats: { hp: 74, atk: 115, def: 70, spa: 135, spd: 80, spe: 106 },
    abilities: ["Cute Charm", "Contrary"],
  },

  "enamorus-therian": {
    name: "Enamorus-Therian",
    types: ["Fairy", "Flying"],
    baseStats: { hp: 74, atk: 115, def: 110, spa: 135, spd: 100, spe: 46 },
    abilities: ["Overcoat"],
  },

  "regieleki": {
    name: "Regieleki",
    types: ["Electric"],
    baseStats: { hp: 80, atk: 100, def: 50, spa: 100, spd: 50, spe: 200 },
    abilities: ["Transistor"],
  },

  "registeel": {
    name: "Registeel",
    types: ["Steel"],
    baseStats: { hp: 80, atk: 75, def: 150, spa: 75, spd: 150, spe: 50 },
    abilities: ["Clear Body", "Light Metal"],
  },

  "regidrago": {
    name: "Regidrago",
    types: ["Dragon"],
    baseStats: { hp: 200, atk: 100, def: 50, spa: 100, spd: 50, spe: 80 },
    abilities: ["Dragon's Maw"],
  },
};

export function lookupPokemon(species: string): PokemonData | null {
  const key = species
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
  return POKEMON_DATA[key] ?? null;
}
