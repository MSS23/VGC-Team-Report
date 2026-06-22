import type { PokemonData } from "@/lib/types/pokemon";
import { lookupPokemonFromDex } from "./pkmn-dex-fallback";

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

  "zamazenta": {
    name: "Zamazenta",
    types: ["Fighting"],
    baseStats: { hp: 92, atk: 130, def: 115, spa: 80, spd: 115, spe: 138 },
    abilities: ["Dauntless Shield"],
  },

  "zamazenta-crowned": {
    name: "Zamazenta-Crowned",
    types: ["Fighting", "Steel"],
    baseStats: { hp: 92, atk: 130, def: 145, spa: 80, spd: 145, spe: 128 },
    abilities: ["Dauntless Shield"],
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

  "tinkaton": {
    name: "Tinkaton",
    types: ["Fairy", "Steel"],
    baseStats: { hp: 85, atk: 75, def: 77, spa: 70, spd: 105, spe: 94 },
    abilities: ["Mold Breaker", "Own Tempo", "Pickpocket"],
  },

  "oranguru": {
    name: "Oranguru",
    types: ["Normal", "Psychic"],
    baseStats: { hp: 90, atk: 60, def: 80, spa: 90, spd: 110, spe: 60 },
    abilities: ["Inner Focus", "Telepathy", "Symbiosis"],
  },

  // ── Additional Restricted / Legendary ──────────────────────────────────────

  "necrozma": {
    name: "Necrozma",
    types: ["Psychic"],
    baseStats: { hp: 97, atk: 107, def: 101, spa: 127, spd: 89, spe: 79 },
    abilities: ["Prism Armor"],
  },

  "necrozma-dusk-mane": {
    name: "Necrozma-Dusk-Mane",
    types: ["Psychic", "Steel"],
    baseStats: { hp: 97, atk: 157, def: 127, spa: 113, spd: 109, spe: 77 },
    abilities: ["Prism Armor"],
  },

  "necrozma-dawn-wings": {
    name: "Necrozma-Dawn-Wings",
    types: ["Psychic", "Ghost"],
    baseStats: { hp: 97, atk: 113, def: 109, spa: 157, spd: 127, spe: 77 },
    abilities: ["Prism Armor"],
  },

  "xerneas": {
    name: "Xerneas",
    types: ["Fairy"],
    baseStats: { hp: 126, atk: 131, def: 95, spa: 131, spd: 98, spe: 99 },
    abilities: ["Fairy Aura"],
  },

  "yveltal": {
    name: "Yveltal",
    types: ["Dark", "Flying"],
    baseStats: { hp: 126, atk: 131, def: 95, spa: 131, spd: 98, spe: 99 },
    abilities: ["Dark Aura"],
  },

  "zygarde": {
    name: "Zygarde",
    types: ["Dragon", "Ground"],
    baseStats: { hp: 108, atk: 100, def: 121, spa: 81, spd: 95, spe: 95 },
    abilities: ["Aura Break", "Power Construct"],
  },

  "calyrex": {
    name: "Calyrex",
    types: ["Psychic", "Grass"],
    baseStats: { hp: 100, atk: 80, def: 80, spa: 80, spd: 80, spe: 80 },
    abilities: ["Unnerve"],
  },

  "spectrier": {
    name: "Spectrier",
    types: ["Ghost"],
    baseStats: { hp: 100, atk: 65, def: 60, spa: 145, spd: 80, spe: 130 },
    abilities: ["Grim Neigh"],
  },

  "glastrier": {
    name: "Glastrier",
    types: ["Ice"],
    baseStats: { hp: 100, atk: 145, def: 130, spa: 65, spd: 110, spe: 30 },
    abilities: ["Chilling Neigh"],
  },

  "regigigas": {
    name: "Regigigas",
    types: ["Normal"],
    baseStats: { hp: 110, atk: 160, def: 110, spa: 80, spd: 110, spe: 100 },
    abilities: ["Slow Start"],
  },

  "regirock": {
    name: "Regirock",
    types: ["Rock"],
    baseStats: { hp: 80, atk: 100, def: 200, spa: 50, spd: 100, spe: 50 },
    abilities: ["Clear Body", "Sturdy"],
  },

  "regice": {
    name: "Regice",
    types: ["Ice"],
    baseStats: { hp: 80, atk: 50, def: 100, spa: 100, spd: 200, spe: 50 },
    abilities: ["Clear Body", "Ice Body"],
  },

  "terapagos": {
    name: "Terapagos",
    types: ["Normal"],
    baseStats: { hp: 90, atk: 65, def: 85, spa: 65, spd: 85, spe: 60 },
    abilities: ["Tera Shift"],
  },

  "pecharunt": {
    name: "Pecharunt",
    types: ["Poison", "Ghost"],
    baseStats: { hp: 88, atk: 88, def: 88, spa: 88, spd: 88, spe: 88 },
    abilities: ["Poison Puppeteer"],
  },

  "mew": {
    name: "Mew",
    types: ["Psychic"],
    baseStats: { hp: 100, atk: 100, def: 100, spa: 100, spd: 100, spe: 100 },
    abilities: ["Synchronize"],
  },

  "jirachi": {
    name: "Jirachi",
    types: ["Steel", "Psychic"],
    baseStats: { hp: 100, atk: 100, def: 100, spa: 100, spd: 100, spe: 100 },
    abilities: ["Serene Grace"],
  },

  "latios": {
    name: "Latios",
    types: ["Dragon", "Psychic"],
    baseStats: { hp: 80, atk: 90, def: 80, spa: 130, spd: 110, spe: 110 },
    abilities: ["Levitate"],
  },

  "latias": {
    name: "Latias",
    types: ["Dragon", "Psychic"],
    baseStats: { hp: 80, atk: 80, def: 90, spa: 110, spd: 130, spe: 110 },
    abilities: ["Levitate"],
  },

  "volcanion": {
    name: "Volcanion",
    types: ["Fire", "Water"],
    baseStats: { hp: 80, atk: 110, def: 120, spa: 130, spd: 90, spe: 70 },
    abilities: ["Water Absorb"],
  },

  "genesect": {
    name: "Genesect",
    types: ["Bug", "Steel"],
    baseStats: { hp: 71, atk: 120, def: 95, spa: 120, spd: 95, spe: 99 },
    abilities: ["Download"],
  },

  // ── Ultra Beasts ───────────────────────────────────────────────────────────

  "kartana": {
    name: "Kartana",
    types: ["Grass", "Steel"],
    baseStats: { hp: 59, atk: 181, def: 131, spa: 59, spd: 31, spe: 109 },
    abilities: ["Beast Boost"],
  },

  "celesteela": {
    name: "Celesteela",
    types: ["Steel", "Flying"],
    baseStats: { hp: 97, atk: 101, def: 103, spa: 107, spd: 101, spe: 61 },
    abilities: ["Beast Boost"],
  },

  "nihilego": {
    name: "Nihilego",
    types: ["Rock", "Poison"],
    baseStats: { hp: 109, atk: 53, def: 47, spa: 127, spd: 131, spe: 103 },
    abilities: ["Beast Boost"],
  },

  "pheromosa": {
    name: "Pheromosa",
    types: ["Bug", "Fighting"],
    baseStats: { hp: 71, atk: 137, def: 37, spa: 137, spd: 37, spe: 151 },
    abilities: ["Beast Boost"],
  },

  "buzzwole": {
    name: "Buzzwole",
    types: ["Bug", "Fighting"],
    baseStats: { hp: 107, atk: 139, def: 139, spa: 53, spd: 53, spe: 79 },
    abilities: ["Beast Boost"],
  },

  "stakataka": {
    name: "Stakataka",
    types: ["Rock", "Steel"],
    baseStats: { hp: 61, atk: 131, def: 211, spa: 53, spd: 101, spe: 13 },
    abilities: ["Beast Boost"],
  },

  "blacephalon": {
    name: "Blacephalon",
    types: ["Fire", "Ghost"],
    baseStats: { hp: 53, atk: 127, def: 53, spa: 151, spd: 79, spe: 107 },
    abilities: ["Beast Boost"],
  },

  "naganadel": {
    name: "Naganadel",
    types: ["Poison", "Dragon"],
    baseStats: { hp: 73, atk: 73, def: 73, spa: 127, spd: 73, spe: 121 },
    abilities: ["Beast Boost"],
  },

  "xurkitree": {
    name: "Xurkitree",
    types: ["Electric"],
    baseStats: { hp: 83, atk: 89, def: 71, spa: 173, spd: 71, spe: 83 },
    abilities: ["Beast Boost"],
  },

  "guzzlord": {
    name: "Guzzlord",
    types: ["Dark", "Dragon"],
    baseStats: { hp: 223, atk: 101, def: 53, spa: 97, spd: 53, spe: 43 },
    abilities: ["Beast Boost"],
  },

  // ── Tapu Guardians ─────────────────────────────────────────────────────────

  "tapu-koko": {
    name: "Tapu Koko",
    types: ["Electric", "Fairy"],
    baseStats: { hp: 70, atk: 115, def: 85, spa: 95, spd: 75, spe: 130 },
    abilities: ["Electric Surge", "Telepathy"],
  },

  "tapu-lele": {
    name: "Tapu Lele",
    types: ["Psychic", "Fairy"],
    baseStats: { hp: 70, atk: 85, def: 75, spa: 130, spd: 115, spe: 95 },
    abilities: ["Psychic Surge", "Telepathy"],
  },

  "tapu-bulu": {
    name: "Tapu Bulu",
    types: ["Grass", "Fairy"],
    baseStats: { hp: 70, atk: 130, def: 115, spa: 85, spd: 95, spe: 75 },
    abilities: ["Grassy Surge", "Telepathy"],
  },

  "tapu-fini": {
    name: "Tapu Fini",
    types: ["Water", "Fairy"],
    baseStats: { hp: 70, atk: 75, def: 115, spa: 95, spd: 130, spe: 85 },
    abilities: ["Misty Surge", "Telepathy"],
  },

  // ── Galarian Legendary Birds ───────────────────────────────────────────────

  "moltres-galar": {
    name: "Moltres-Galar",
    types: ["Dark", "Flying"],
    baseStats: { hp: 90, atk: 85, def: 90, spa: 100, spd: 125, spe: 90 },
    abilities: ["Berserk"],
  },

  "zapdos-galar": {
    name: "Zapdos-Galar",
    types: ["Fighting", "Flying"],
    baseStats: { hp: 90, atk: 125, def: 90, spa: 85, spd: 90, spe: 100 },
    abilities: ["Defiant"],
  },

  "articuno-galar": {
    name: "Articuno-Galar",
    types: ["Psychic", "Flying"],
    baseStats: { hp: 90, atk: 85, def: 85, spa: 125, spd: 100, spe: 95 },
    abilities: ["Competitive"],
  },

  // ── Rotom Forms ────────────────────────────────────────────────────────────

  "rotom-wash": {
    name: "Rotom-Wash",
    types: ["Electric", "Water"],
    baseStats: { hp: 50, atk: 65, def: 107, spa: 105, spd: 107, spe: 86 },
    abilities: ["Levitate"],
  },

  "rotom-heat": {
    name: "Rotom-Heat",
    types: ["Electric", "Fire"],
    baseStats: { hp: 50, atk: 65, def: 107, spa: 105, spd: 107, spe: 86 },
    abilities: ["Levitate"],
  },

  "rotom-mow": {
    name: "Rotom-Mow",
    types: ["Electric", "Grass"],
    baseStats: { hp: 50, atk: 65, def: 107, spa: 105, spd: 107, spe: 86 },
    abilities: ["Levitate"],
  },

  "rotom-fan": {
    name: "Rotom-Fan",
    types: ["Electric", "Flying"],
    baseStats: { hp: 50, atk: 65, def: 107, spa: 105, spd: 107, spe: 86 },
    abilities: ["Levitate"],
  },

  "rotom-frost": {
    name: "Rotom-Frost",
    types: ["Electric", "Ice"],
    baseStats: { hp: 50, atk: 65, def: 107, spa: 105, spd: 107, spe: 86 },
    abilities: ["Levitate"],
  },

  // ── Gen 9 Competitive Pokemon ──────────────────────────────────────────────

  "baxcalibur": {
    name: "Baxcalibur",
    types: ["Dragon", "Ice"],
    baseStats: { hp: 115, atk: 145, def: 92, spa: 75, spd: 86, spe: 87 },
    abilities: ["Thermal Exchange", "Ice Body"],
  },

  "garganacl": {
    name: "Garganacl",
    types: ["Rock"],
    baseStats: { hp: 100, atk: 100, def: 130, spa: 45, spd: 90, spe: 35 },
    abilities: ["Purifying Salt", "Sturdy", "Clear Body"],
  },

  "iron-treads": {
    name: "Iron Treads",
    types: ["Ground", "Steel"],
    baseStats: { hp: 90, atk: 112, def: 120, spa: 72, spd: 70, spe: 106 },
    abilities: ["Quark Drive"],
  },

  "flamigo": {
    name: "Flamigo",
    types: ["Flying", "Fighting"],
    baseStats: { hp: 82, atk: 115, def: 74, spa: 75, spd: 64, spe: 90 },
    abilities: ["Scrappy", "Tangled Feet", "Costar"],
  },

  "maushold": {
    name: "Maushold",
    types: ["Normal"],
    baseStats: { hp: 74, atk: 75, def: 70, spa: 65, spd: 75, spe: 111 },
    abilities: ["Friend Guard", "Cheek Pouch", "Technician"],
  },

  "espathra": {
    name: "Espathra",
    types: ["Psychic"],
    baseStats: { hp: 95, atk: 60, def: 60, spa: 101, spd: 60, spe: 105 },
    abilities: ["Opportunist", "Frisk", "Speed Boost"],
  },

  "cyclizar": {
    name: "Cyclizar",
    types: ["Dragon", "Normal"],
    baseStats: { hp: 70, atk: 95, def: 65, spa: 85, spd: 65, spe: 121 },
    abilities: ["Shed Skin", "Regenerator"],
  },

  "kilowattrel": {
    name: "Kilowattrel",
    types: ["Electric", "Flying"],
    baseStats: { hp: 70, atk: 70, def: 60, spa: 105, spd: 60, spe: 125 },
    abilities: ["Wind Power", "Volt Absorb", "Competitive"],
  },

  "arboliva": {
    name: "Arboliva",
    types: ["Grass", "Normal"],
    baseStats: { hp: 78, atk: 69, def: 90, spa: 125, spd: 109, spe: 39 },
    abilities: ["Seed Sower", "Harvest"],
  },

  "dachsbun": {
    name: "Dachsbun",
    types: ["Fairy"],
    baseStats: { hp: 57, atk: 80, def: 115, spa: 50, spd: 80, spe: 95 },
    abilities: ["Well-Baked Body", "Aroma Veil"],
  },

  "toedscruel": {
    name: "Toedscruel",
    types: ["Ground", "Grass"],
    baseStats: { hp: 80, atk: 70, def: 65, spa: 80, spd: 120, spe: 100 },
    abilities: ["Mycelium Might", "Oblivious"],
  },

  "pawmot": {
    name: "Pawmot",
    types: ["Electric", "Fighting"],
    baseStats: { hp: 70, atk: 115, def: 70, spa: 70, spd: 60, spe: 105 },
    abilities: ["Volt Absorb", "Natural Cure", "Iron Fist"],
  },

  "bellibolt": {
    name: "Bellibolt",
    types: ["Electric"],
    baseStats: { hp: 109, atk: 64, def: 91, spa: 103, spd: 83, spe: 45 },
    abilities: ["Electromorphosis", "Static", "Damp"],
  },

  "rabsca": {
    name: "Rabsca",
    types: ["Bug", "Psychic"],
    baseStats: { hp: 75, atk: 50, def: 85, spa: 115, spd: 100, spe: 45 },
    abilities: ["Synchronize", "Telepathy"],
  },

  "brambleghast": {
    name: "Brambleghast",
    types: ["Grass", "Ghost"],
    baseStats: { hp: 55, atk: 115, def: 70, spa: 80, spd: 70, spe: 90 },
    abilities: ["Wind Rider", "Infiltrator"],
  },

  "revavroom": {
    name: "Revavroom",
    types: ["Steel", "Poison"],
    baseStats: { hp: 80, atk: 119, def: 90, spa: 54, spd: 67, spe: 90 },
    abilities: ["Overcoat", "Filter"],
  },

  "fezandipiti": {
    name: "Fezandipiti",
    types: ["Poison", "Fairy"],
    baseStats: { hp: 88, atk: 91, def: 82, spa: 70, spd: 125, spe: 99 },
    abilities: ["Toxic Chain", "Technician"],
  },

  "munkidori": {
    name: "Munkidori",
    types: ["Poison", "Psychic"],
    baseStats: { hp: 88, atk: 75, def: 66, spa: 130, spd: 90, spe: 106 },
    abilities: ["Toxic Chain", "Frisk"],
  },

  "okidogi": {
    name: "Okidogi",
    types: ["Poison", "Fighting"],
    baseStats: { hp: 88, atk: 128, def: 115, spa: 58, spd: 86, spe: 80 },
    abilities: ["Toxic Chain", "Guard Dog"],
  },

  "sinistcha": {
    name: "Sinistcha",
    types: ["Grass", "Ghost"],
    baseStats: { hp: 71, atk: 60, def: 106, spa: 121, spd: 80, spe: 70 },
    abilities: ["Hospitality", "Heatproof"],
  },

  "hydrapple": {
    name: "Hydrapple",
    types: ["Grass", "Dragon"],
    baseStats: { hp: 106, atk: 80, def: 110, spa: 120, spd: 80, spe: 44 },
    abilities: ["Supersweet Syrup", "Regenerator", "Sticky Hold"],
  },

  "araquanid": {
    name: "Araquanid",
    types: ["Water", "Bug"],
    baseStats: { hp: 68, atk: 70, def: 92, spa: 50, spd: 132, spe: 42 },
    abilities: ["Water Bubble", "Water Absorb"],
  },

  "kleavor": {
    name: "Kleavor",
    types: ["Bug", "Rock"],
    baseStats: { hp: 70, atk: 135, def: 95, spa: 45, spd: 70, spe: 85 },
    abilities: ["Swarm", "Sheer Force", "Steadfast"],
  },

  // ── Gen 1-4 VGC Staples ────────────────────────────────────────────────────

  "togekiss": {
    name: "Togekiss",
    types: ["Fairy", "Flying"],
    baseStats: { hp: 85, atk: 50, def: 95, spa: 120, spd: 115, spe: 80 },
    abilities: ["Hustle", "Serene Grace", "Super Luck"],
  },

  "charizard": {
    name: "Charizard",
    types: ["Fire", "Flying"],
    baseStats: { hp: 78, atk: 84, def: 78, spa: 109, spd: 85, spe: 100 },
    abilities: ["Blaze", "Solar Power"],
  },

  "venusaur": {
    name: "Venusaur",
    types: ["Grass", "Poison"],
    baseStats: { hp: 80, atk: 82, def: 83, spa: 100, spd: 100, spe: 80 },
    abilities: ["Overgrow", "Chlorophyll"],
  },

  "blastoise": {
    name: "Blastoise",
    types: ["Water"],
    baseStats: { hp: 79, atk: 83, def: 100, spa: 85, spd: 105, spe: 78 },
    abilities: ["Torrent", "Rain Dish"],
  },

  "gengar": {
    name: "Gengar",
    types: ["Ghost", "Poison"],
    baseStats: { hp: 60, atk: 65, def: 60, spa: 130, spd: 75, spe: 110 },
    abilities: ["Cursed Body"],
  },

  "snorlax": {
    name: "Snorlax",
    types: ["Normal"],
    baseStats: { hp: 160, atk: 110, def: 65, spa: 65, spd: 110, spe: 30 },
    abilities: ["Immunity", "Thick Fat", "Gluttony"],
  },

  "lapras": {
    name: "Lapras",
    types: ["Water", "Ice"],
    baseStats: { hp: 130, atk: 85, def: 80, spa: 85, spd: 95, spe: 60 },
    abilities: ["Water Absorb", "Shell Armor", "Hydration"],
  },

  "milotic": {
    name: "Milotic",
    types: ["Water"],
    baseStats: { hp: 95, atk: 60, def: 79, spa: 100, spd: 125, spe: 81 },
    abilities: ["Marvel Scale", "Competitive", "Cute Charm"],
  },

  "clefable": {
    name: "Clefable",
    types: ["Fairy"],
    baseStats: { hp: 95, atk: 70, def: 73, spa: 95, spd: 90, spe: 60 },
    abilities: ["Cute Charm", "Magic Guard", "Unaware"],
  },

  "bronzong": {
    name: "Bronzong",
    types: ["Steel", "Psychic"],
    baseStats: { hp: 67, atk: 89, def: 116, spa: 79, spd: 116, spe: 33 },
    abilities: ["Levitate", "Heatproof", "Heavy Metal"],
  },

  "hitmontop": {
    name: "Hitmontop",
    types: ["Fighting"],
    baseStats: { hp: 50, atk: 95, def: 95, spa: 35, spd: 110, spe: 70 },
    abilities: ["Intimidate", "Technician", "Steadfast"],
  },

  "hariyama": {
    name: "Hariyama",
    types: ["Fighting"],
    baseStats: { hp: 144, atk: 120, def: 60, spa: 40, spd: 60, spe: 50 },
    abilities: ["Thick Fat", "Guts", "Sheer Force"],
  },

  "sableye": {
    name: "Sableye",
    types: ["Dark", "Ghost"],
    baseStats: { hp: 50, atk: 75, def: 75, spa: 65, spd: 65, spe: 50 },
    abilities: ["Keen Eye", "Stall", "Prankster"],
  },

  "ludicolo": {
    name: "Ludicolo",
    types: ["Water", "Grass"],
    baseStats: { hp: 80, atk: 70, def: 70, spa: 90, spd: 100, spe: 70 },
    abilities: ["Swift Swim", "Rain Dish", "Own Tempo"],
  },

  "mamoswine": {
    name: "Mamoswine",
    types: ["Ice", "Ground"],
    baseStats: { hp: 110, atk: 130, def: 80, spa: 70, spd: 60, spe: 80 },
    abilities: ["Oblivious", "Snow Cloak", "Thick Fat"],
  },

  "weavile": {
    name: "Weavile",
    types: ["Dark", "Ice"],
    baseStats: { hp: 70, atk: 120, def: 65, spa: 45, spd: 85, spe: 125 },
    abilities: ["Pressure", "Pickpocket"],
  },

  "azumarill": {
    name: "Azumarill",
    types: ["Water", "Fairy"],
    baseStats: { hp: 100, atk: 50, def: 80, spa: 60, spd: 80, spe: 50 },
    abilities: ["Thick Fat", "Huge Power", "Sap Sipper"],
  },

  "comfey": {
    name: "Comfey",
    types: ["Fairy"],
    baseStats: { hp: 51, atk: 52, def: 90, spa: 82, spd: 110, spe: 100 },
    abilities: ["Flower Veil", "Triage", "Natural Cure"],
  },

  // ── Gen 5 VGC Staples ──────────────────────────────────────────────────────

  "conkeldurr": {
    name: "Conkeldurr",
    types: ["Fighting"],
    baseStats: { hp: 105, atk: 140, def: 95, spa: 55, spd: 65, spe: 45 },
    abilities: ["Guts", "Sheer Force", "Iron Fist"],
  },

  "chandelure": {
    name: "Chandelure",
    types: ["Ghost", "Fire"],
    baseStats: { hp: 60, atk: 55, def: 90, spa: 145, spd: 90, spe: 80 },
    abilities: ["Flash Fire", "Flame Body", "Infiltrator"],
  },

  "jellicent": {
    name: "Jellicent",
    types: ["Water", "Ghost"],
    baseStats: { hp: 100, atk: 60, def: 70, spa: 85, spd: 105, spe: 60 },
    abilities: ["Water Absorb", "Cursed Body", "Damp"],
  },

  "terrakion": {
    name: "Terrakion",
    types: ["Rock", "Fighting"],
    baseStats: { hp: 91, atk: 129, def: 90, spa: 72, spd: 90, spe: 108 },
    abilities: ["Justified"],
  },

  "virizion": {
    name: "Virizion",
    types: ["Grass", "Fighting"],
    baseStats: { hp: 91, atk: 90, def: 72, spa: 90, spd: 129, spe: 108 },
    abilities: ["Justified"],
  },

  "cobalion": {
    name: "Cobalion",
    types: ["Steel", "Fighting"],
    baseStats: { hp: 91, atk: 90, def: 129, spa: 90, spd: 72, spe: 108 },
    abilities: ["Justified"],
  },

  "keldeo": {
    name: "Keldeo",
    types: ["Water", "Fighting"],
    baseStats: { hp: 91, atk: 72, def: 90, spa: 129, spd: 90, spe: 108 },
    abilities: ["Justified"],
  },

  // ── Gen 6 VGC Staples ──────────────────────────────────────────────────────

  "aegislash": {
    name: "Aegislash",
    types: ["Steel", "Ghost"],
    baseStats: { hp: 60, atk: 50, def: 140, spa: 50, spd: 140, spe: 60 },
    abilities: ["Stance Change"],
  },

  // ── Gen 7 VGC Staples ──────────────────────────────────────────────────────

  "primarina": {
    name: "Primarina",
    types: ["Water", "Fairy"],
    baseStats: { hp: 80, atk: 74, def: 74, spa: 126, spd: 116, spe: 60 },
    abilities: ["Torrent", "Liquid Voice"],
  },

  "decidueye": {
    name: "Decidueye",
    types: ["Grass", "Ghost"],
    baseStats: { hp: 78, atk: 107, def: 75, spa: 100, spd: 100, spe: 70 },
    abilities: ["Overgrow", "Long Reach"],
  },

  "ribombee": {
    name: "Ribombee",
    types: ["Bug", "Fairy"],
    baseStats: { hp: 60, atk: 55, def: 60, spa: 95, spd: 70, spe: 124 },
    abilities: ["Honey Gather", "Shield Dust", "Sweet Veil"],
  },

  "porygon-z": {
    name: "Porygon-Z",
    types: ["Normal"],
    baseStats: { hp: 85, atk: 80, def: 70, spa: 135, spd: 75, spe: 90 },
    abilities: ["Adaptability", "Download", "Analytic"],
  },

  "raichu-alola": {
    name: "Raichu-Alola",
    types: ["Electric", "Psychic"],
    baseStats: { hp: 60, atk: 85, def: 50, spa: 95, spd: 85, spe: 110 },
    abilities: ["Surge Surfer"],
  },

  "marowak-alola": {
    name: "Marowak-Alola",
    types: ["Fire", "Ghost"],
    baseStats: { hp: 60, atk: 80, def: 110, spa: 50, spd: 80, spe: 45 },
    abilities: ["Cursed Body", "Lightning Rod", "Rock Head"],
  },

  // ── Gen 8 VGC Staples ──────────────────────────────────────────────────────

  "cinderace": {
    name: "Cinderace",
    types: ["Fire"],
    baseStats: { hp: 80, atk: 116, def: 75, spa: 65, spd: 75, spe: 119 },
    abilities: ["Blaze", "Libero"],
  },

  "corviknight": {
    name: "Corviknight",
    types: ["Flying", "Steel"],
    baseStats: { hp: 98, atk: 87, def: 105, spa: 53, spd: 85, spe: 67 },
    abilities: ["Pressure", "Unnerve", "Mirror Armor"],
  },

  "coalossal": {
    name: "Coalossal",
    types: ["Rock", "Fire"],
    baseStats: { hp: 110, atk: 80, def: 120, spa: 80, spd: 90, spe: 30 },
    abilities: ["Steam Engine", "Flame Body", "Flash Fire"],
  },

  "duraludon": {
    name: "Duraludon",
    types: ["Steel", "Dragon"],
    baseStats: { hp: 70, atk: 95, def: 115, spa: 120, spd: 50, spe: 85 },
    abilities: ["Light Metal", "Heavy Metal", "Stalwart"],
  },

  "indeedee": {
    name: "Indeedee",
    types: ["Psychic", "Normal"],
    baseStats: { hp: 60, atk: 65, def: 55, spa: 105, spd: 95, spe: 95 },
    abilities: ["Inner Focus", "Synchronize", "Psychic Surge"],
  },

  "alcremie": {
    name: "Alcremie",
    types: ["Fairy"],
    baseStats: { hp: 65, atk: 60, def: 75, spa: 110, spd: 121, spe: 64 },
    abilities: ["Sweet Veil", "Aroma Veil"],
  },

  "butterfree": {
    name: "Butterfree",
    types: ["Bug", "Flying"],
    baseStats: { hp: 60, atk: 45, def: 50, spa: 90, spd: 80, spe: 70 },
    abilities: ["Compound Eyes", "Tinted Lens"],
  },

  "hatterene": {
    name: "Hatterene",
    types: ["Psychic", "Fairy"],
    baseStats: { hp: 57, atk: 90, def: 95, spa: 136, spd: 103, spe: 29 },
    abilities: ["Healer", "Anticipation", "Magic Bounce"],
  },

  "copperajah": {
    name: "Copperajah",
    types: ["Steel"],
    baseStats: { hp: 122, atk: 130, def: 69, spa: 80, spd: 69, spe: 30 },
    abilities: ["Sheer Force", "Heavy Metal"],
  },

  "toxtricity": {
    name: "Toxtricity",
    types: ["Electric", "Poison"],
    baseStats: { hp: 75, atk: 98, def: 70, spa: 114, spd: 70, spe: 75 },
    abilities: ["Punk Rock", "Plus", "Technician"],
  },

  "wyrdeer": {
    name: "Wyrdeer",
    types: ["Normal", "Psychic"],
    baseStats: { hp: 103, atk: 105, def: 72, spa: 105, spd: 75, spe: 65 },
    abilities: ["Intimidate", "Frisk", "Sap Sipper"],
  },

  // ── Pokemon Champions — Base Forms (missing) ─────────────────────────────

  "kangaskhan": {
    name: "Kangaskhan",
    types: ["Normal"],
    baseStats: { hp: 105, atk: 95, def: 80, spa: 40, spd: 80, spe: 90 },
    abilities: ["Early Bird", "Scrappy", "Inner Focus"],
  },

  "mawile": {
    name: "Mawile",
    types: ["Steel", "Fairy"],
    baseStats: { hp: 50, atk: 85, def: 85, spa: 55, spd: 55, spe: 50 },
    abilities: ["Hyper Cutter", "Intimidate", "Sheer Force"],
  },

  "gardevoir": {
    name: "Gardevoir",
    types: ["Psychic", "Fairy"],
    baseStats: { hp: 68, atk: 65, def: 65, spa: 125, spd: 115, spe: 80 },
    abilities: ["Synchronize", "Trace", "Telepathy"],
  },

  "lucario": {
    name: "Lucario",
    types: ["Fighting", "Steel"],
    baseStats: { hp: 70, atk: 110, def: 70, spa: 115, spd: 70, spe: 90 },
    abilities: ["Steadfast", "Inner Focus", "Justified"],
  },

  "blaziken": {
    name: "Blaziken",
    types: ["Fire", "Fighting"],
    baseStats: { hp: 80, atk: 120, def: 70, spa: 110, spd: 70, spe: 80 },
    abilities: ["Blaze", "Speed Boost"],
  },

  "lopunny": {
    name: "Lopunny",
    types: ["Normal"],
    baseStats: { hp: 65, atk: 76, def: 84, spa: 54, spd: 96, spe: 105 },
    abilities: ["Cute Charm", "Klutz", "Limber"],
  },

  "medicham": {
    name: "Medicham",
    types: ["Fighting", "Psychic"],
    baseStats: { hp: 60, atk: 60, def: 75, spa: 60, spd: 75, spe: 80 },
    abilities: ["Pure Power", "Telepathy"],
  },

  "manectric": {
    name: "Manectric",
    types: ["Electric"],
    baseStats: { hp: 70, atk: 75, def: 60, spa: 105, spd: 60, spe: 105 },
    abilities: ["Static", "Lightning Rod", "Minus"],
  },

  "gallade": {
    name: "Gallade",
    types: ["Psychic", "Fighting"],
    baseStats: { hp: 68, atk: 125, def: 65, spa: 65, spd: 115, spe: 80 },
    abilities: ["Steadfast", "Sharpness", "Justified"],
  },

  "audino": {
    name: "Audino",
    types: ["Normal"],
    baseStats: { hp: 103, atk: 60, def: 86, spa: 60, spd: 86, spe: 50 },
    abilities: ["Healer", "Regenerator", "Klutz"],
  },

  "diancie": {
    name: "Diancie",
    types: ["Rock", "Fairy"],
    baseStats: { hp: 50, atk: 100, def: 150, spa: 100, spd: 150, spe: 50 },
    abilities: ["Clear Body"],
  },

  // ── Pokemon Champions — Mega Evolutions ───────────────────────────────────

  "kangaskhan-mega": {
    name: "Kangaskhan-Mega",
    types: ["Normal"],
    baseStats: { hp: 105, atk: 125, def: 100, spa: 60, spd: 100, spe: 100 },
    abilities: ["Parental Bond"],
  },

  // ── Regulation M-B Megas (Pokémon Champions) ──────────────────────────
  // Champions-original Megas newly legal in Reg M-B. (The real Gen 6 Megas
  // also new to M-B — Sceptile, Blaziken, Swampert, Mawile, Metagross —
  // already live in POKEMON_DATA above with canonical stats.)
  // Types / abilities / stats verified against Serebii's Reg M-B page plus
  // Bulbapedia / PokemonDB / Game8 (cross-referenced June 2026).
  "raichu-mega-x": {
    name: "Raichu-Mega-X",
    types: ["Electric"],
    baseStats: { hp: 60, atk: 135, def: 95, spa: 90, spd: 95, spe: 110 },
    abilities: ["Electric Surge"],
  },
  "raichu-mega-y": {
    name: "Raichu-Mega-Y",
    types: ["Electric"],
    baseStats: { hp: 60, atk: 100, def: 55, spa: 160, spd: 80, spe: 130 },
    abilities: ["No Guard"],
  },
  "staraptor-mega": {
    name: "Staraptor-Mega",
    types: ["Fighting", "Flying"],
    baseStats: { hp: 85, atk: 140, def: 100, spa: 60, spd: 90, spe: 110 },
    abilities: ["Contrary"],
  },
  "scolipede-mega": {
    name: "Scolipede-Mega",
    types: ["Bug", "Poison"],
    baseStats: { hp: 60, atk: 140, def: 149, spa: 75, spd: 99, spe: 62 },
    abilities: ["Shell Armor"],
  },
  "scrafty-mega": {
    name: "Scrafty-Mega",
    types: ["Dark", "Fighting"],
    baseStats: { hp: 65, atk: 130, def: 135, spa: 55, spd: 135, spe: 68 },
    abilities: ["Intimidate"],
  },
  "eelektross-mega": {
    name: "Eelektross-Mega",
    types: ["Electric"],
    baseStats: { hp: 85, atk: 145, def: 80, spa: 135, spd: 90, spe: 80 },
    abilities: ["Eelevate"],
  },
  "pyroar-mega": {
    name: "Pyroar-Mega",
    types: ["Fire", "Normal"],
    baseStats: { hp: 86, atk: 88, def: 92, spa: 129, spd: 86, spe: 126 },
    abilities: ["Fire Mane"],
  },
  "malamar-mega": {
    name: "Malamar-Mega",
    types: ["Dark", "Psychic"],
    baseStats: { hp: 86, atk: 102, def: 88, spa: 98, spd: 120, spe: 88 },
    abilities: ["Contrary"],
  },
  "barbaracle-mega": {
    name: "Barbaracle-Mega",
    types: ["Rock", "Fighting"],
    baseStats: { hp: 72, atk: 140, def: 130, spa: 64, spd: 106, spe: 88 },
    abilities: ["Tough Claws"],
  },
  "dragalge-mega": {
    name: "Dragalge-Mega",
    types: ["Poison", "Dragon"],
    baseStats: { hp: 65, atk: 85, def: 105, spa: 132, spd: 163, spe: 44 },
    abilities: ["Regenerator"],
  },
  "falinks-mega": {
    name: "Falinks-Mega",
    types: ["Fighting"],
    baseStats: { hp: 65, atk: 135, def: 135, spa: 70, spd: 65, spe: 100 },
    abilities: ["Defiant"],
  },

  "charizard-mega-x": {
    name: "Charizard-Mega-X",
    types: ["Fire", "Dragon"],
    baseStats: { hp: 78, atk: 130, def: 111, spa: 130, spd: 85, spe: 100 },
    abilities: ["Tough Claws"],
  },

  "charizard-mega-y": {
    name: "Charizard-Mega-Y",
    types: ["Fire", "Flying"],
    baseStats: { hp: 78, atk: 104, def: 78, spa: 159, spd: 115, spe: 100 },
    abilities: ["Drought"],
  },

  "venusaur-mega": {
    name: "Venusaur-Mega",
    types: ["Grass", "Poison"],
    baseStats: { hp: 80, atk: 100, def: 123, spa: 122, spd: 120, spe: 80 },
    abilities: ["Thick Fat"],
  },

  "blastoise-mega": {
    name: "Blastoise-Mega",
    types: ["Water"],
    baseStats: { hp: 79, atk: 103, def: 120, spa: 135, spd: 115, spe: 78 },
    abilities: ["Mega Launcher"],
  },

  "salamence-mega": {
    name: "Salamence-Mega",
    types: ["Dragon", "Flying"],
    baseStats: { hp: 95, atk: 145, def: 130, spa: 120, spd: 90, spe: 120 },
    abilities: ["Aerilate"],
  },

  "metagross-mega": {
    name: "Metagross-Mega",
    types: ["Steel", "Psychic"],
    baseStats: { hp: 80, atk: 145, def: 150, spa: 105, spd: 110, spe: 110 },
    abilities: ["Tough Claws"],
  },

  "gengar-mega": {
    name: "Gengar-Mega",
    types: ["Ghost", "Poison"],
    baseStats: { hp: 60, atk: 65, def: 80, spa: 170, spd: 95, spe: 130 },
    abilities: ["Shadow Tag"],
  },

  "mawile-mega": {
    name: "Mawile-Mega",
    types: ["Steel", "Fairy"],
    baseStats: { hp: 50, atk: 105, def: 125, spa: 55, spd: 95, spe: 50 },
    abilities: ["Huge Power"],
  },

  "gardevoir-mega": {
    name: "Gardevoir-Mega",
    types: ["Psychic", "Fairy"],
    baseStats: { hp: 68, atk: 85, def: 65, spa: 165, spd: 135, spe: 100 },
    abilities: ["Pixilate"],
  },

  "lucario-mega": {
    name: "Lucario-Mega",
    types: ["Fighting", "Steel"],
    baseStats: { hp: 70, atk: 145, def: 88, spa: 140, spd: 70, spe: 112 },
    abilities: ["Adaptability"],
  },

  "blaziken-mega": {
    name: "Blaziken-Mega",
    types: ["Fire", "Fighting"],
    baseStats: { hp: 80, atk: 160, def: 80, spa: 130, spd: 80, spe: 100 },
    abilities: ["Speed Boost"],
  },

  "lopunny-mega": {
    name: "Lopunny-Mega",
    types: ["Normal", "Fighting"],
    baseStats: { hp: 65, atk: 136, def: 94, spa: 54, spd: 96, spe: 135 },
    abilities: ["Scrappy"],
  },

  "scizor-mega": {
    name: "Scizor-Mega",
    types: ["Bug", "Steel"],
    baseStats: { hp: 70, atk: 150, def: 140, spa: 65, spd: 100, spe: 75 },
    abilities: ["Technician"],
  },

  "tyranitar-mega": {
    name: "Tyranitar-Mega",
    types: ["Rock", "Dark"],
    baseStats: { hp: 100, atk: 164, def: 150, spa: 95, spd: 120, spe: 71 },
    abilities: ["Sand Stream"],
  },

  "garchomp-mega": {
    name: "Garchomp-Mega",
    types: ["Dragon", "Ground"],
    baseStats: { hp: 108, atk: 170, def: 115, spa: 120, spd: 95, spe: 92 },
    abilities: ["Sand Force"],
  },

  "medicham-mega": {
    name: "Medicham-Mega",
    types: ["Fighting", "Psychic"],
    baseStats: { hp: 60, atk: 100, def: 85, spa: 80, spd: 85, spe: 100 },
    abilities: ["Pure Power"],
  },

  "manectric-mega": {
    name: "Manectric-Mega",
    types: ["Electric"],
    baseStats: { hp: 70, atk: 75, def: 80, spa: 135, spd: 80, spe: 135 },
    abilities: ["Intimidate"],
  },

  "abomasnow-mega": {
    name: "Abomasnow-Mega",
    types: ["Grass", "Ice"],
    baseStats: { hp: 90, atk: 132, def: 105, spa: 132, spd: 105, spe: 30 },
    abilities: ["Snow Warning"],
  },

  "gallade-mega": {
    name: "Gallade-Mega",
    types: ["Psychic", "Fighting"],
    baseStats: { hp: 68, atk: 165, def: 95, spa: 65, spd: 115, spe: 110 },
    abilities: ["Inner Focus"],
  },

  "audino-mega": {
    name: "Audino-Mega",
    types: ["Normal", "Fairy"],
    baseStats: { hp: 103, atk: 60, def: 126, spa: 80, spd: 126, spe: 50 },
    abilities: ["Healer"],
  },

  "diancie-mega": {
    name: "Diancie-Mega",
    types: ["Rock", "Fairy"],
    baseStats: { hp: 50, atk: 160, def: 110, spa: 160, spd: 110, spe: 110 },
    abilities: ["Magic Bounce"],
  },

  "alakazam-mega": {
    name: "Alakazam-Mega",
    types: ["Psychic"],
    baseStats: { hp: 55, atk: 50, def: 65, spa: 175, spd: 105, spe: 150 },
    abilities: ["Trace"],
  },

  "gyarados-mega": {
    name: "Gyarados-Mega",
    types: ["Water", "Dark"],
    baseStats: { hp: 95, atk: 155, def: 109, spa: 70, spd: 130, spe: 81 },
    abilities: ["Mold Breaker"],
  },

  "aerodactyl-mega": {
    name: "Aerodactyl-Mega",
    types: ["Rock", "Flying"],
    baseStats: { hp: 80, atk: 135, def: 85, spa: 70, spd: 95, spe: 150 },
    abilities: ["Tough Claws"],
  },

  "mewtwo-mega-x": {
    name: "Mewtwo-Mega-X",
    types: ["Psychic", "Fighting"],
    baseStats: { hp: 106, atk: 190, def: 100, spa: 154, spd: 100, spe: 130 },
    abilities: ["Steadfast"],
  },

  "mewtwo-mega-y": {
    name: "Mewtwo-Mega-Y",
    types: ["Psychic"],
    baseStats: { hp: 106, atk: 150, def: 70, spa: 194, spd: 120, spe: 140 },
    abilities: ["Insomnia"],
  },

  "ampharos-mega": {
    name: "Ampharos-Mega",
    types: ["Electric", "Dragon"],
    baseStats: { hp: 90, atk: 95, def: 105, spa: 165, spd: 110, spe: 45 },
    abilities: ["Mold Breaker"],
  },

  "steelix-mega": {
    name: "Steelix-Mega",
    types: ["Steel", "Ground"],
    baseStats: { hp: 75, atk: 125, def: 230, spa: 55, spd: 95, spe: 30 },
    abilities: ["Sand Force"],
  },

  "heracross-mega": {
    name: "Heracross-Mega",
    types: ["Bug", "Fighting"],
    baseStats: { hp: 80, atk: 185, def: 115, spa: 40, spd: 105, spe: 75 },
    abilities: ["Skill Link"],
  },

  "houndoom-mega": {
    name: "Houndoom-Mega",
    types: ["Dark", "Fire"],
    baseStats: { hp: 75, atk: 90, def: 90, spa: 140, spd: 90, spe: 115 },
    abilities: ["Solar Power"],
  },

  "aggron-mega": {
    name: "Aggron-Mega",
    types: ["Steel"],
    baseStats: { hp: 70, atk: 140, def: 230, spa: 60, spd: 80, spe: 50 },
    abilities: ["Filter"],
  },

  "banette-mega": {
    name: "Banette-Mega",
    types: ["Ghost"],
    baseStats: { hp: 64, atk: 165, def: 75, spa: 93, spd: 83, spe: 75 },
    abilities: ["Prankster"],
  },

  "absol-mega": {
    name: "Absol-Mega",
    types: ["Dark"],
    baseStats: { hp: 65, atk: 150, def: 60, spa: 115, spd: 60, spe: 115 },
    abilities: ["Magic Bounce"],
  },

  "altaria-mega": {
    name: "Altaria-Mega",
    types: ["Dragon", "Fairy"],
    baseStats: { hp: 75, atk: 110, def: 110, spa: 110, spd: 105, spe: 80 },
    abilities: ["Pixilate"],
  },

  "glalie-mega": {
    name: "Glalie-Mega",
    types: ["Ice"],
    baseStats: { hp: 80, atk: 120, def: 80, spa: 120, spd: 80, spe: 100 },
    abilities: ["Refrigerate"],
  },

  "latias-mega": {
    name: "Latias-Mega",
    types: ["Dragon", "Psychic"],
    baseStats: { hp: 80, atk: 100, def: 120, spa: 140, spd: 150, spe: 110 },
    abilities: ["Levitate"],
  },

  "latios-mega": {
    name: "Latios-Mega",
    types: ["Dragon", "Psychic"],
    baseStats: { hp: 80, atk: 130, def: 100, spa: 160, spd: 120, spe: 110 },
    abilities: ["Levitate"],
  },

  "swampert-mega": {
    name: "Swampert-Mega",
    types: ["Water", "Ground"],
    baseStats: { hp: 100, atk: 150, def: 110, spa: 95, spd: 110, spe: 70 },
    abilities: ["Swift Swim"],
  },

  "sceptile-mega": {
    name: "Sceptile-Mega",
    types: ["Grass", "Dragon"],
    baseStats: { hp: 70, atk: 110, def: 75, spa: 145, spd: 85, spe: 145 },
    abilities: ["Lightning Rod"],
  },

  "sableye-mega": {
    name: "Sableye-Mega",
    types: ["Dark", "Ghost"],
    baseStats: { hp: 50, atk: 85, def: 125, spa: 85, spd: 115, spe: 20 },
    abilities: ["Magic Bounce"],
  },

  "sharpedo-mega": {
    name: "Sharpedo-Mega",
    types: ["Water", "Dark"],
    baseStats: { hp: 70, atk: 140, def: 70, spa: 110, spd: 65, spe: 105 },
    abilities: ["Strong Jaw"],
  },

  "camerupt-mega": {
    name: "Camerupt-Mega",
    types: ["Fire", "Ground"],
    baseStats: { hp: 70, atk: 120, def: 100, spa: 145, spd: 105, spe: 20 },
    abilities: ["Sheer Force"],
  },

  "slowbro-mega": {
    name: "Slowbro-Mega",
    types: ["Water", "Psychic"],
    baseStats: { hp: 95, atk: 75, def: 180, spa: 130, spd: 80, spe: 30 },
    abilities: ["Shell Armor"],
  },

  "pinsir-mega": {
    name: "Pinsir-Mega",
    types: ["Bug", "Flying"],
    baseStats: { hp: 65, atk: 155, def: 120, spa: 65, spd: 90, spe: 105 },
    abilities: ["Aerilate"],
  },

  "pidgeot-mega": {
    name: "Pidgeot-Mega",
    types: ["Normal", "Flying"],
    baseStats: { hp: 83, atk: 80, def: 80, spa: 135, spd: 80, spe: 121 },
    abilities: ["No Guard"],
  },

  "beedrill-mega": {
    name: "Beedrill-Mega",
    types: ["Bug", "Poison"],
    baseStats: { hp: 65, atk: 150, def: 40, spa: 15, spd: 80, spe: 145 },
    abilities: ["Adaptability"],
  },

  // ── Pokemon Champions — Primal Reversions ─────────────────────────────────

  "groudon-primal": {
    name: "Groudon-Primal",
    types: ["Ground", "Fire"],
    baseStats: { hp: 100, atk: 180, def: 160, spa: 150, spd: 90, spe: 90 },
    abilities: ["Desolate Land"],
  },

  "kyogre-primal": {
    name: "Kyogre-Primal",
    types: ["Water"],
    baseStats: { hp: 100, atk: 150, def: 90, spa: 180, spd: 160, spe: 90 },
    abilities: ["Primordial Sea"],
  },

  "rayquaza-mega": {
    name: "Rayquaza-Mega",
    types: ["Dragon", "Flying"],
    baseStats: { hp: 105, atk: 180, def: 100, spa: 180, spd: 100, spe: 115 },
    abilities: ["Delta Stream"],
  },

  // ── Missing Pokemon (VGC-52 bug fix) ──────────────────────────────────────

  "empoleon": {
    name: "Empoleon",
    types: ["Water", "Steel"],
    baseStats: { hp: 84, atk: 86, def: 88, spa: 111, spd: 101, spe: 60 },
    abilities: ["Torrent", "Defiant"],
  },

  "skeledirge": {
    name: "Skeledirge",
    types: ["Fire", "Ghost"],
    baseStats: { hp: 104, atk: 75, def: 100, spa: 110, spd: 75, spe: 66 },
    abilities: ["Blaze", "Unaware"],
  },

  "magnezone": {
    name: "Magnezone",
    types: ["Electric", "Steel"],
    baseStats: { hp: 70, atk: 70, def: 115, spa: 130, spd: 90, spe: 60 },
    abilities: ["Magnet Pull", "Sturdy", "Analytic"],
  },

  "klefki": {
    name: "Klefki",
    types: ["Steel", "Fairy"],
    baseStats: { hp: 57, atk: 80, def: 91, spa: 80, spd: 87, spe: 75 },
    abilities: ["Prankster", "Magician"],
  },

  "vanilluxe": {
    name: "Vanilluxe",
    types: ["Ice"],
    baseStats: { hp: 71, atk: 95, def: 85, spa: 110, spd: 95, spe: 79 },
    abilities: ["Ice Body", "Snow Warning", "Weak Armor"],
  },

  "galvantula": {
    name: "Galvantula",
    types: ["Bug", "Electric"],
    baseStats: { hp: 70, atk: 77, def: 60, spa: 97, spd: 60, spe: 108 },
    abilities: ["Compound Eyes", "Unnerve", "Swarm"],
  },

  "swampert": {
    name: "Swampert",
    types: ["Water", "Ground"],
    baseStats: { hp: 100, atk: 110, def: 90, spa: 85, spd: 90, spe: 60 },
    abilities: ["Torrent", "Damp"],
  },

  "sceptile": {
    name: "Sceptile",
    types: ["Grass"],
    baseStats: { hp: 70, atk: 85, def: 65, spa: 105, spd: 85, spe: 120 },
    abilities: ["Overgrow", "Unburden"],
  },

  "toxicroak": {
    name: "Toxicroak",
    types: ["Poison", "Fighting"],
    baseStats: { hp: 83, atk: 106, def: 65, spa: 86, spd: 65, spe: 85 },
    abilities: ["Anticipation", "Dry Skin", "Poison Touch"],
  },

  "kingdra": {
    name: "Kingdra",
    types: ["Water", "Dragon"],
    baseStats: { hp: 75, atk: 95, def: 95, spa: 95, spd: 95, spe: 85 },
    abilities: ["Swift Swim", "Sniper", "Damp"],
  },

  "breloom": {
    name: "Breloom",
    types: ["Grass", "Fighting"],
    baseStats: { hp: 60, atk: 130, def: 80, spa: 60, spd: 60, spe: 70 },
    abilities: ["Effect Spore", "Poison Heal", "Technician"],
  },

  "zapdos": {
    name: "Zapdos",
    types: ["Electric", "Flying"],
    baseStats: { hp: 90, atk: 90, def: 85, spa: 125, spd: 90, spe: 100 },
    abilities: ["Pressure", "Static"],
  },

  "moltres": {
    name: "Moltres",
    types: ["Fire", "Flying"],
    baseStats: { hp: 90, atk: 100, def: 90, spa: 125, spd: 85, spe: 90 },
    abilities: ["Pressure", "Flame Body"],
  },

  "mienshao": {
    name: "Mienshao",
    types: ["Fighting"],
    baseStats: { hp: 65, atk: 125, def: 60, spa: 95, spd: 60, spe: 105 },
    abilities: ["Inner Focus", "Regenerator", "Reckless"],
  },

  "zoroark-hisui": {
    name: "Zoroark-Hisui",
    types: ["Normal", "Ghost"],
    baseStats: { hp: 55, atk: 100, def: 60, spa: 125, spd: 60, spe: 110 },
    abilities: ["Illusion"],
  },

  "grafaiai": {
    name: "Grafaiai",
    types: ["Poison", "Normal"],
    baseStats: { hp: 63, atk: 95, def: 65, spa: 80, spd: 72, spe: 110 },
    abilities: ["Unburden", "Poison Touch", "Prankster"],
  },

  "orthworm": {
    name: "Orthworm",
    types: ["Steel"],
    baseStats: { hp: 70, atk: 85, def: 145, spa: 60, spd: 55, spe: 65 },
    abilities: ["Earth Eater", "Sand Veil"],
  },


  // ── Auto-generated from Showdown Pokedex (complete coverage) ────────────

  "bulbasaur": { name: "Bulbasaur", types: ["Grass","Poison"], baseStats: { hp: 45, atk: 49, def: 49, spa: 65, spd: 65, spe: 45 }, abilities: ["Overgrow","Chlorophyll"] },
  "ivysaur": { name: "Ivysaur", types: ["Grass","Poison"], baseStats: { hp: 60, atk: 62, def: 63, spa: 80, spd: 80, spe: 60 }, abilities: ["Overgrow","Chlorophyll"] },
  "venusaur-gmax": { name: "Venusaur-Gmax", types: ["Grass","Poison"], baseStats: { hp: 80, atk: 82, def: 83, spa: 100, spd: 100, spe: 80 }, abilities: ["Overgrow","Chlorophyll"] },
  "charmander": { name: "Charmander", types: ["Fire"], baseStats: { hp: 39, atk: 52, def: 43, spa: 60, spd: 50, spe: 65 }, abilities: ["Blaze","Solar Power"] },
  "charmeleon": { name: "Charmeleon", types: ["Fire"], baseStats: { hp: 58, atk: 64, def: 58, spa: 80, spd: 65, spe: 80 }, abilities: ["Blaze","Solar Power"] },
  "charizard-gmax": { name: "Charizard-Gmax", types: ["Fire","Flying"], baseStats: { hp: 78, atk: 84, def: 78, spa: 109, spd: 85, spe: 100 }, abilities: ["Blaze","Solar Power"] },
  "squirtle": { name: "Squirtle", types: ["Water"], baseStats: { hp: 44, atk: 48, def: 65, spa: 50, spd: 64, spe: 43 }, abilities: ["Torrent","Rain Dish"] },
  "wartortle": { name: "Wartortle", types: ["Water"], baseStats: { hp: 59, atk: 63, def: 80, spa: 65, spd: 80, spe: 58 }, abilities: ["Torrent","Rain Dish"] },
  "blastoise-gmax": { name: "Blastoise-Gmax", types: ["Water"], baseStats: { hp: 79, atk: 83, def: 100, spa: 85, spd: 105, spe: 78 }, abilities: ["Torrent","Rain Dish"] },
  "caterpie": { name: "Caterpie", types: ["Bug"], baseStats: { hp: 45, atk: 30, def: 35, spa: 20, spd: 20, spe: 45 }, abilities: ["Shield Dust","Run Away"] },
  "metapod": { name: "Metapod", types: ["Bug"], baseStats: { hp: 50, atk: 20, def: 55, spa: 25, spd: 25, spe: 30 }, abilities: ["Shed Skin"] },
  "butterfree-gmax": { name: "Butterfree-Gmax", types: ["Bug","Flying"], baseStats: { hp: 60, atk: 45, def: 50, spa: 90, spd: 80, spe: 70 }, abilities: ["Compound Eyes","Tinted Lens"] },
  "weedle": { name: "Weedle", types: ["Bug","Poison"], baseStats: { hp: 40, atk: 35, def: 30, spa: 20, spd: 20, spe: 50 }, abilities: ["Shield Dust","Run Away"] },
  "kakuna": { name: "Kakuna", types: ["Bug","Poison"], baseStats: { hp: 45, atk: 25, def: 50, spa: 25, spd: 25, spe: 35 }, abilities: ["Shed Skin"] },
  "beedrill": { name: "Beedrill", types: ["Bug","Poison"], baseStats: { hp: 65, atk: 90, def: 40, spa: 45, spd: 80, spe: 75 }, abilities: ["Swarm","Sniper"] },
  "pidgey": { name: "Pidgey", types: ["Normal","Flying"], baseStats: { hp: 40, atk: 45, def: 40, spa: 35, spd: 35, spe: 56 }, abilities: ["Keen Eye","Tangled Feet","Big Pecks"] },
  "pidgeotto": { name: "Pidgeotto", types: ["Normal","Flying"], baseStats: { hp: 63, atk: 60, def: 55, spa: 50, spd: 50, spe: 71 }, abilities: ["Keen Eye","Tangled Feet","Big Pecks"] },
  "pidgeot": { name: "Pidgeot", types: ["Normal","Flying"], baseStats: { hp: 83, atk: 80, def: 75, spa: 70, spd: 70, spe: 101 }, abilities: ["Keen Eye","Tangled Feet","Big Pecks"] },
  "rattata": { name: "Rattata", types: ["Normal"], baseStats: { hp: 30, atk: 56, def: 35, spa: 25, spd: 35, spe: 72 }, abilities: ["Run Away","Guts","Hustle"] },
  "rattata-alola": { name: "Rattata-Alola", types: ["Dark","Normal"], baseStats: { hp: 30, atk: 56, def: 35, spa: 25, spd: 35, spe: 72 }, abilities: ["Gluttony","Hustle","Thick Fat"] },
  "raticate": { name: "Raticate", types: ["Normal"], baseStats: { hp: 55, atk: 81, def: 60, spa: 50, spd: 70, spe: 97 }, abilities: ["Run Away","Guts","Hustle"] },
  "raticate-alola": { name: "Raticate-Alola", types: ["Dark","Normal"], baseStats: { hp: 75, atk: 71, def: 70, spa: 40, spd: 80, spe: 77 }, abilities: ["Gluttony","Hustle","Thick Fat"] },
  "raticate-alola-totem": { name: "Raticate-Alola-Totem", types: ["Dark","Normal"], baseStats: { hp: 75, atk: 71, def: 70, spa: 40, spd: 80, spe: 77 }, abilities: ["Thick Fat"] },
  "spearow": { name: "Spearow", types: ["Normal","Flying"], baseStats: { hp: 40, atk: 60, def: 30, spa: 31, spd: 31, spe: 70 }, abilities: ["Keen Eye","Sniper"] },
  "fearow": { name: "Fearow", types: ["Normal","Flying"], baseStats: { hp: 65, atk: 90, def: 65, spa: 61, spd: 61, spe: 100 }, abilities: ["Keen Eye","Sniper"] },
  "ekans": { name: "Ekans", types: ["Poison"], baseStats: { hp: 35, atk: 60, def: 44, spa: 40, spd: 54, spe: 55 }, abilities: ["Intimidate","Shed Skin","Unnerve"] },
  "arbok": { name: "Arbok", types: ["Poison"], baseStats: { hp: 60, atk: 95, def: 69, spa: 65, spd: 79, spe: 80 }, abilities: ["Intimidate","Shed Skin","Unnerve"] },
  "pikachu": { name: "Pikachu", types: ["Electric"], baseStats: { hp: 35, atk: 55, def: 40, spa: 50, spd: 50, spe: 90 }, abilities: ["Static","Lightning Rod"] },
  "pikachu-cosplay": { name: "Pikachu-Cosplay", types: ["Electric"], baseStats: { hp: 35, atk: 55, def: 40, spa: 50, spd: 50, spe: 90 }, abilities: ["Lightning Rod"] },
  "pikachu-rock-star": { name: "Pikachu-Rock-Star", types: ["Electric"], baseStats: { hp: 35, atk: 55, def: 40, spa: 50, spd: 50, spe: 90 }, abilities: ["Lightning Rod"] },
  "pikachu-belle": { name: "Pikachu-Belle", types: ["Electric"], baseStats: { hp: 35, atk: 55, def: 40, spa: 50, spd: 50, spe: 90 }, abilities: ["Lightning Rod"] },
  "pikachu-pop-star": { name: "Pikachu-Pop-Star", types: ["Electric"], baseStats: { hp: 35, atk: 55, def: 40, spa: 50, spd: 50, spe: 90 }, abilities: ["Lightning Rod"] },
  "pikachu-phd": { name: "Pikachu-PhD", types: ["Electric"], baseStats: { hp: 35, atk: 55, def: 40, spa: 50, spd: 50, spe: 90 }, abilities: ["Lightning Rod"] },
  "pikachu-libre": { name: "Pikachu-Libre", types: ["Electric"], baseStats: { hp: 35, atk: 55, def: 40, spa: 50, spd: 50, spe: 90 }, abilities: ["Lightning Rod"] },
  "pikachu-original": { name: "Pikachu-Original", types: ["Electric"], baseStats: { hp: 35, atk: 55, def: 40, spa: 50, spd: 50, spe: 90 }, abilities: ["Static","Lightning Rod"] },
  "pikachu-hoenn": { name: "Pikachu-Hoenn", types: ["Electric"], baseStats: { hp: 35, atk: 55, def: 40, spa: 50, spd: 50, spe: 90 }, abilities: ["Static","Lightning Rod"] },
  "pikachu-sinnoh": { name: "Pikachu-Sinnoh", types: ["Electric"], baseStats: { hp: 35, atk: 55, def: 40, spa: 50, spd: 50, spe: 90 }, abilities: ["Static","Lightning Rod"] },
  "pikachu-unova": { name: "Pikachu-Unova", types: ["Electric"], baseStats: { hp: 35, atk: 55, def: 40, spa: 50, spd: 50, spe: 90 }, abilities: ["Static","Lightning Rod"] },
  "pikachu-kalos": { name: "Pikachu-Kalos", types: ["Electric"], baseStats: { hp: 35, atk: 55, def: 40, spa: 50, spd: 50, spe: 90 }, abilities: ["Static","Lightning Rod"] },
  "pikachu-alola": { name: "Pikachu-Alola", types: ["Electric"], baseStats: { hp: 35, atk: 55, def: 40, spa: 50, spd: 50, spe: 90 }, abilities: ["Static","Lightning Rod"] },
  "pikachu-partner": { name: "Pikachu-Partner", types: ["Electric"], baseStats: { hp: 35, atk: 55, def: 40, spa: 50, spd: 50, spe: 90 }, abilities: ["Static","Lightning Rod"] },
  "pikachu-starter": { name: "Pikachu-Starter", types: ["Electric"], baseStats: { hp: 45, atk: 80, def: 50, spa: 75, spd: 60, spe: 120 }, abilities: ["Static","Lightning Rod"] },
  "pikachu-gmax": { name: "Pikachu-Gmax", types: ["Electric"], baseStats: { hp: 35, atk: 55, def: 40, spa: 50, spd: 50, spe: 90 }, abilities: ["Static","Lightning Rod"] },
  "pikachu-world": { name: "Pikachu-World", types: ["Electric"], baseStats: { hp: 35, atk: 55, def: 40, spa: 50, spd: 50, spe: 90 }, abilities: ["Static","Lightning Rod"] },
  "raichu": { name: "Raichu", types: ["Electric"], baseStats: { hp: 60, atk: 90, def: 55, spa: 90, spd: 80, spe: 110 }, abilities: ["Static","Lightning Rod"] },
  "sandshrew": { name: "Sandshrew", types: ["Ground"], baseStats: { hp: 50, atk: 75, def: 85, spa: 20, spd: 30, spe: 40 }, abilities: ["Sand Veil","Sand Rush"] },
  "sandshrew-alola": { name: "Sandshrew-Alola", types: ["Ice","Steel"], baseStats: { hp: 50, atk: 75, def: 90, spa: 10, spd: 35, spe: 40 }, abilities: ["Snow Cloak","Slush Rush"] },
  "sandslash": { name: "Sandslash", types: ["Ground"], baseStats: { hp: 75, atk: 100, def: 110, spa: 45, spd: 55, spe: 65 }, abilities: ["Sand Veil","Sand Rush"] },
  "sandslash-alola": { name: "Sandslash-Alola", types: ["Ice","Steel"], baseStats: { hp: 75, atk: 100, def: 120, spa: 25, spd: 65, spe: 65 }, abilities: ["Snow Cloak","Slush Rush"] },
  "nidoran-f": { name: "Nidoran-F", types: ["Poison"], baseStats: { hp: 55, atk: 47, def: 52, spa: 40, spd: 40, spe: 41 }, abilities: ["Poison Point","Rivalry","Hustle"] },
  "nidorina": { name: "Nidorina", types: ["Poison"], baseStats: { hp: 70, atk: 62, def: 67, spa: 55, spd: 55, spe: 56 }, abilities: ["Poison Point","Rivalry","Hustle"] },
  "nidoqueen": { name: "Nidoqueen", types: ["Poison","Ground"], baseStats: { hp: 90, atk: 92, def: 87, spa: 75, spd: 85, spe: 76 }, abilities: ["Poison Point","Rivalry","Sheer Force"] },
  "nidoran-m": { name: "Nidoran-M", types: ["Poison"], baseStats: { hp: 46, atk: 57, def: 40, spa: 40, spd: 40, spe: 50 }, abilities: ["Poison Point","Rivalry","Hustle"] },
  "nidorino": { name: "Nidorino", types: ["Poison"], baseStats: { hp: 61, atk: 72, def: 57, spa: 55, spd: 55, spe: 65 }, abilities: ["Poison Point","Rivalry","Hustle"] },
  "nidoking": { name: "Nidoking", types: ["Poison","Ground"], baseStats: { hp: 81, atk: 102, def: 77, spa: 85, spd: 75, spe: 85 }, abilities: ["Poison Point","Rivalry","Sheer Force"] },
  "vulpix": { name: "Vulpix", types: ["Fire"], baseStats: { hp: 38, atk: 41, def: 40, spa: 50, spd: 65, spe: 65 }, abilities: ["Flash Fire","Drought"] },
  "vulpix-alola": { name: "Vulpix-Alola", types: ["Ice"], baseStats: { hp: 38, atk: 41, def: 40, spa: 50, spd: 65, spe: 65 }, abilities: ["Snow Cloak","Snow Warning"] },
  "ninetales": { name: "Ninetales", types: ["Fire"], baseStats: { hp: 73, atk: 76, def: 75, spa: 81, spd: 100, spe: 100 }, abilities: ["Flash Fire","Drought"] },
  "jigglypuff": { name: "Jigglypuff", types: ["Normal","Fairy"], baseStats: { hp: 115, atk: 45, def: 20, spa: 45, spd: 25, spe: 20 }, abilities: ["Cute Charm","Competitive","Friend Guard"] },
  "wigglytuff": { name: "Wigglytuff", types: ["Normal","Fairy"], baseStats: { hp: 140, atk: 70, def: 45, spa: 85, spd: 50, spe: 45 }, abilities: ["Cute Charm","Competitive","Frisk"] },
  "zubat": { name: "Zubat", types: ["Poison","Flying"], baseStats: { hp: 40, atk: 45, def: 35, spa: 30, spd: 40, spe: 55 }, abilities: ["Inner Focus","Infiltrator"] },
  "golbat": { name: "Golbat", types: ["Poison","Flying"], baseStats: { hp: 75, atk: 80, def: 70, spa: 65, spd: 75, spe: 90 }, abilities: ["Inner Focus","Infiltrator"] },
  "oddish": { name: "Oddish", types: ["Grass","Poison"], baseStats: { hp: 45, atk: 50, def: 55, spa: 75, spd: 65, spe: 30 }, abilities: ["Chlorophyll","Run Away"] },
  "gloom": { name: "Gloom", types: ["Grass","Poison"], baseStats: { hp: 60, atk: 65, def: 70, spa: 85, spd: 75, spe: 40 }, abilities: ["Chlorophyll","Stench"] },
  "vileplume": { name: "Vileplume", types: ["Grass","Poison"], baseStats: { hp: 75, atk: 80, def: 85, spa: 110, spd: 90, spe: 50 }, abilities: ["Chlorophyll","Effect Spore"] },
  "paras": { name: "Paras", types: ["Bug","Grass"], baseStats: { hp: 35, atk: 70, def: 55, spa: 45, spd: 55, spe: 25 }, abilities: ["Effect Spore","Dry Skin","Damp"] },
  "parasect": { name: "Parasect", types: ["Bug","Grass"], baseStats: { hp: 60, atk: 95, def: 80, spa: 60, spd: 80, spe: 30 }, abilities: ["Effect Spore","Dry Skin","Damp"] },
  "venonat": { name: "Venonat", types: ["Bug","Poison"], baseStats: { hp: 60, atk: 55, def: 50, spa: 40, spd: 55, spe: 45 }, abilities: ["Compound Eyes","Tinted Lens","Run Away"] },
  "venomoth": { name: "Venomoth", types: ["Bug","Poison"], baseStats: { hp: 70, atk: 65, def: 60, spa: 90, spd: 75, spe: 90 }, abilities: ["Shield Dust","Tinted Lens","Wonder Skin"] },
  "diglett": { name: "Diglett", types: ["Ground"], baseStats: { hp: 10, atk: 55, def: 25, spa: 35, spd: 45, spe: 95 }, abilities: ["Sand Veil","Arena Trap","Sand Force"] },
  "diglett-alola": { name: "Diglett-Alola", types: ["Ground","Steel"], baseStats: { hp: 10, atk: 55, def: 30, spa: 35, spd: 45, spe: 90 }, abilities: ["Sand Veil","Tangling Hair","Sand Force"] },
  "dugtrio": { name: "Dugtrio", types: ["Ground"], baseStats: { hp: 35, atk: 100, def: 50, spa: 50, spd: 70, spe: 120 }, abilities: ["Sand Veil","Arena Trap","Sand Force"] },
  "dugtrio-alola": { name: "Dugtrio-Alola", types: ["Ground","Steel"], baseStats: { hp: 35, atk: 100, def: 60, spa: 50, spd: 70, spe: 110 }, abilities: ["Sand Veil","Tangling Hair","Sand Force"] },
  "meowth": { name: "Meowth", types: ["Normal"], baseStats: { hp: 40, atk: 45, def: 35, spa: 40, spd: 40, spe: 90 }, abilities: ["Pickup","Technician","Unnerve"] },
  "meowth-alola": { name: "Meowth-Alola", types: ["Dark"], baseStats: { hp: 40, atk: 35, def: 35, spa: 50, spd: 40, spe: 90 }, abilities: ["Pickup","Technician","Rattled"] },
  "meowth-galar": { name: "Meowth-Galar", types: ["Steel"], baseStats: { hp: 50, atk: 65, def: 55, spa: 40, spd: 40, spe: 40 }, abilities: ["Pickup","Tough Claws","Unnerve"] },
  "meowth-gmax": { name: "Meowth-Gmax", types: ["Normal"], baseStats: { hp: 40, atk: 45, def: 35, spa: 40, spd: 40, spe: 90 }, abilities: ["Pickup","Technician","Unnerve"] },
  "persian": { name: "Persian", types: ["Normal"], baseStats: { hp: 65, atk: 70, def: 60, spa: 65, spd: 65, spe: 115 }, abilities: ["Limber","Technician","Unnerve"] },
  "persian-alola": { name: "Persian-Alola", types: ["Dark"], baseStats: { hp: 65, atk: 60, def: 60, spa: 75, spd: 65, spe: 115 }, abilities: ["Fur Coat","Technician","Rattled"] },
  "psyduck": { name: "Psyduck", types: ["Water"], baseStats: { hp: 50, atk: 52, def: 48, spa: 65, spd: 50, spe: 55 }, abilities: ["Damp","Cloud Nine","Swift Swim"] },
  "golduck": { name: "Golduck", types: ["Water"], baseStats: { hp: 80, atk: 82, def: 78, spa: 95, spd: 80, spe: 85 }, abilities: ["Damp","Cloud Nine","Swift Swim"] },
  "mankey": { name: "Mankey", types: ["Fighting"], baseStats: { hp: 40, atk: 80, def: 35, spa: 35, spd: 45, spe: 70 }, abilities: ["Vital Spirit","Anger Point","Defiant"] },
  "primeape": { name: "Primeape", types: ["Fighting"], baseStats: { hp: 65, atk: 105, def: 60, spa: 60, spd: 70, spe: 95 }, abilities: ["Vital Spirit","Anger Point","Defiant"] },
  "growlithe": { name: "Growlithe", types: ["Fire"], baseStats: { hp: 55, atk: 70, def: 45, spa: 70, spd: 50, spe: 60 }, abilities: ["Intimidate","Flash Fire","Justified"] },
  "growlithe-hisui": { name: "Growlithe-Hisui", types: ["Fire","Rock"], baseStats: { hp: 60, atk: 75, def: 45, spa: 65, spd: 50, spe: 55 }, abilities: ["Intimidate","Flash Fire","Rock Head"] },
  "poliwag": { name: "Poliwag", types: ["Water"], baseStats: { hp: 40, atk: 50, def: 40, spa: 40, spd: 40, spe: 90 }, abilities: ["Water Absorb","Damp","Swift Swim"] },
  "poliwhirl": { name: "Poliwhirl", types: ["Water"], baseStats: { hp: 65, atk: 65, def: 65, spa: 50, spd: 50, spe: 90 }, abilities: ["Water Absorb","Damp","Swift Swim"] },
  "poliwrath": { name: "Poliwrath", types: ["Water","Fighting"], baseStats: { hp: 90, atk: 95, def: 95, spa: 70, spd: 90, spe: 70 }, abilities: ["Water Absorb","Damp","Swift Swim"] },
  "abra": { name: "Abra", types: ["Psychic"], baseStats: { hp: 25, atk: 20, def: 15, spa: 105, spd: 55, spe: 90 }, abilities: ["Synchronize","Inner Focus","Magic Guard"] },
  "kadabra": { name: "Kadabra", types: ["Psychic"], baseStats: { hp: 40, atk: 35, def: 30, spa: 120, spd: 70, spe: 105 }, abilities: ["Synchronize","Inner Focus","Magic Guard"] },
  "alakazam": { name: "Alakazam", types: ["Psychic"], baseStats: { hp: 55, atk: 50, def: 45, spa: 135, spd: 95, spe: 120 }, abilities: ["Synchronize","Inner Focus","Magic Guard"] },
  "machop": { name: "Machop", types: ["Fighting"], baseStats: { hp: 70, atk: 80, def: 50, spa: 35, spd: 35, spe: 35 }, abilities: ["Guts","No Guard","Steadfast"] },
  "machoke": { name: "Machoke", types: ["Fighting"], baseStats: { hp: 80, atk: 100, def: 70, spa: 50, spd: 60, spe: 45 }, abilities: ["Guts","No Guard","Steadfast"] },
  "machamp": { name: "Machamp", types: ["Fighting"], baseStats: { hp: 90, atk: 130, def: 80, spa: 65, spd: 85, spe: 55 }, abilities: ["Guts","No Guard","Steadfast"] },
  "machamp-gmax": { name: "Machamp-Gmax", types: ["Fighting"], baseStats: { hp: 90, atk: 130, def: 80, spa: 65, spd: 85, spe: 55 }, abilities: ["Guts","No Guard","Steadfast"] },
  "bellsprout": { name: "Bellsprout", types: ["Grass","Poison"], baseStats: { hp: 50, atk: 75, def: 35, spa: 70, spd: 30, spe: 40 }, abilities: ["Chlorophyll","Gluttony"] },
  "weepinbell": { name: "Weepinbell", types: ["Grass","Poison"], baseStats: { hp: 65, atk: 90, def: 50, spa: 85, spd: 45, spe: 55 }, abilities: ["Chlorophyll","Gluttony"] },
  "victreebel": { name: "Victreebel", types: ["Grass","Poison"], baseStats: { hp: 80, atk: 105, def: 65, spa: 100, spd: 70, spe: 70 }, abilities: ["Chlorophyll","Gluttony"] },
  "tentacool": { name: "Tentacool", types: ["Water","Poison"], baseStats: { hp: 40, atk: 40, def: 35, spa: 50, spd: 100, spe: 70 }, abilities: ["Clear Body","Liquid Ooze","Rain Dish"] },
  "tentacruel": { name: "Tentacruel", types: ["Water","Poison"], baseStats: { hp: 80, atk: 70, def: 65, spa: 80, spd: 120, spe: 100 }, abilities: ["Clear Body","Liquid Ooze","Rain Dish"] },
  "geodude": { name: "Geodude", types: ["Rock","Ground"], baseStats: { hp: 40, atk: 80, def: 100, spa: 30, spd: 30, spe: 20 }, abilities: ["Rock Head","Sturdy","Sand Veil"] },
  "geodude-alola": { name: "Geodude-Alola", types: ["Rock","Electric"], baseStats: { hp: 40, atk: 80, def: 100, spa: 30, spd: 30, spe: 20 }, abilities: ["Magnet Pull","Sturdy","Galvanize"] },
  "graveler": { name: "Graveler", types: ["Rock","Ground"], baseStats: { hp: 55, atk: 95, def: 115, spa: 45, spd: 45, spe: 35 }, abilities: ["Rock Head","Sturdy","Sand Veil"] },
  "graveler-alola": { name: "Graveler-Alola", types: ["Rock","Electric"], baseStats: { hp: 55, atk: 95, def: 115, spa: 45, spd: 45, spe: 35 }, abilities: ["Magnet Pull","Sturdy","Galvanize"] },
  "golem": { name: "Golem", types: ["Rock","Ground"], baseStats: { hp: 80, atk: 120, def: 130, spa: 55, spd: 65, spe: 45 }, abilities: ["Rock Head","Sturdy","Sand Veil"] },
  "golem-alola": { name: "Golem-Alola", types: ["Rock","Electric"], baseStats: { hp: 80, atk: 120, def: 130, spa: 55, spd: 65, spe: 45 }, abilities: ["Magnet Pull","Sturdy","Galvanize"] },
  "ponyta": { name: "Ponyta", types: ["Fire"], baseStats: { hp: 50, atk: 85, def: 55, spa: 65, spd: 65, spe: 90 }, abilities: ["Run Away","Flash Fire","Flame Body"] },
  "ponyta-galar": { name: "Ponyta-Galar", types: ["Psychic"], baseStats: { hp: 50, atk: 85, def: 55, spa: 65, spd: 65, spe: 90 }, abilities: ["Run Away","Pastel Veil","Anticipation"] },
  "rapidash": { name: "Rapidash", types: ["Fire"], baseStats: { hp: 65, atk: 100, def: 70, spa: 80, spd: 80, spe: 105 }, abilities: ["Run Away","Flash Fire","Flame Body"] },
  "rapidash-galar": { name: "Rapidash-Galar", types: ["Psychic","Fairy"], baseStats: { hp: 65, atk: 100, def: 70, spa: 80, spd: 80, spe: 105 }, abilities: ["Run Away","Pastel Veil","Anticipation"] },
  "slowpoke": { name: "Slowpoke", types: ["Water","Psychic"], baseStats: { hp: 90, atk: 65, def: 65, spa: 40, spd: 40, spe: 15 }, abilities: ["Oblivious","Own Tempo","Regenerator"] },
  "slowpoke-galar": { name: "Slowpoke-Galar", types: ["Psychic"], baseStats: { hp: 90, atk: 65, def: 65, spa: 40, spd: 40, spe: 15 }, abilities: ["Gluttony","Own Tempo","Regenerator"] },
  "slowbro": { name: "Slowbro", types: ["Water","Psychic"], baseStats: { hp: 95, atk: 75, def: 110, spa: 100, spd: 80, spe: 30 }, abilities: ["Oblivious","Own Tempo","Regenerator"] },
  "slowbro-galar": { name: "Slowbro-Galar", types: ["Poison","Psychic"], baseStats: { hp: 95, atk: 100, def: 95, spa: 100, spd: 70, spe: 30 }, abilities: ["Quick Draw","Own Tempo","Regenerator"] },
  "magnemite": { name: "Magnemite", types: ["Electric","Steel"], baseStats: { hp: 25, atk: 35, def: 70, spa: 95, spd: 55, spe: 45 }, abilities: ["Magnet Pull","Sturdy","Analytic"] },
  "magneton": { name: "Magneton", types: ["Electric","Steel"], baseStats: { hp: 50, atk: 60, def: 95, spa: 120, spd: 70, spe: 70 }, abilities: ["Magnet Pull","Sturdy","Analytic"] },
  "farfetchd": { name: "Farfetch’d", types: ["Normal","Flying"], baseStats: { hp: 52, atk: 90, def: 55, spa: 58, spd: 62, spe: 60 }, abilities: ["Keen Eye","Inner Focus","Defiant"] },
  "farfetchd-galar": { name: "Farfetch’d-Galar", types: ["Fighting"], baseStats: { hp: 52, atk: 95, def: 55, spa: 58, spd: 62, spe: 55 }, abilities: ["Steadfast","Scrappy"] },
  "doduo": { name: "Doduo", types: ["Normal","Flying"], baseStats: { hp: 35, atk: 85, def: 45, spa: 35, spd: 35, spe: 75 }, abilities: ["Run Away","Early Bird","Tangled Feet"] },
  "dodrio": { name: "Dodrio", types: ["Normal","Flying"], baseStats: { hp: 60, atk: 110, def: 70, spa: 60, spd: 60, spe: 110 }, abilities: ["Run Away","Early Bird","Tangled Feet"] },
  "seel": { name: "Seel", types: ["Water"], baseStats: { hp: 65, atk: 45, def: 55, spa: 45, spd: 70, spe: 45 }, abilities: ["Thick Fat","Hydration","Ice Body"] },
  "dewgong": { name: "Dewgong", types: ["Water","Ice"], baseStats: { hp: 90, atk: 70, def: 80, spa: 70, spd: 95, spe: 70 }, abilities: ["Thick Fat","Hydration","Ice Body"] },
  "grimer": { name: "Grimer", types: ["Poison"], baseStats: { hp: 80, atk: 80, def: 50, spa: 40, spd: 50, spe: 25 }, abilities: ["Stench","Sticky Hold","Poison Touch"] },
  "grimer-alola": { name: "Grimer-Alola", types: ["Poison","Dark"], baseStats: { hp: 80, atk: 80, def: 50, spa: 40, spd: 50, spe: 25 }, abilities: ["Poison Touch","Gluttony","Power of Alchemy"] },
  "muk": { name: "Muk", types: ["Poison"], baseStats: { hp: 105, atk: 105, def: 75, spa: 65, spd: 100, spe: 50 }, abilities: ["Stench","Sticky Hold","Poison Touch"] },
  "muk-alola": { name: "Muk-Alola", types: ["Poison","Dark"], baseStats: { hp: 105, atk: 105, def: 75, spa: 65, spd: 100, spe: 50 }, abilities: ["Poison Touch","Gluttony","Power of Alchemy"] },
  "shellder": { name: "Shellder", types: ["Water"], baseStats: { hp: 30, atk: 65, def: 100, spa: 45, spd: 25, spe: 40 }, abilities: ["Shell Armor","Skill Link","Overcoat"] },
  "cloyster": { name: "Cloyster", types: ["Water","Ice"], baseStats: { hp: 50, atk: 95, def: 180, spa: 85, spd: 45, spe: 70 }, abilities: ["Shell Armor","Skill Link","Overcoat"] },
  "gastly": { name: "Gastly", types: ["Ghost","Poison"], baseStats: { hp: 30, atk: 35, def: 30, spa: 100, spd: 35, spe: 80 }, abilities: ["Levitate"] },
  "haunter": { name: "Haunter", types: ["Ghost","Poison"], baseStats: { hp: 45, atk: 50, def: 45, spa: 115, spd: 55, spe: 95 }, abilities: ["Levitate"] },
  "gengar-gmax": { name: "Gengar-Gmax", types: ["Ghost","Poison"], baseStats: { hp: 60, atk: 65, def: 60, spa: 130, spd: 75, spe: 110 }, abilities: ["Cursed Body"] },
  "onix": { name: "Onix", types: ["Rock","Ground"], baseStats: { hp: 35, atk: 45, def: 160, spa: 30, spd: 45, spe: 70 }, abilities: ["Rock Head","Sturdy","Weak Armor"] },
  "drowzee": { name: "Drowzee", types: ["Psychic"], baseStats: { hp: 60, atk: 48, def: 45, spa: 43, spd: 90, spe: 42 }, abilities: ["Insomnia","Forewarn","Inner Focus"] },
  "hypno": { name: "Hypno", types: ["Psychic"], baseStats: { hp: 85, atk: 73, def: 70, spa: 73, spd: 115, spe: 67 }, abilities: ["Insomnia","Forewarn","Inner Focus"] },
  "krabby": { name: "Krabby", types: ["Water"], baseStats: { hp: 30, atk: 105, def: 90, spa: 25, spd: 25, spe: 50 }, abilities: ["Hyper Cutter","Shell Armor","Sheer Force"] },
  "kingler": { name: "Kingler", types: ["Water"], baseStats: { hp: 55, atk: 130, def: 115, spa: 50, spd: 50, spe: 75 }, abilities: ["Hyper Cutter","Shell Armor","Sheer Force"] },
  "kingler-gmax": { name: "Kingler-Gmax", types: ["Water"], baseStats: { hp: 55, atk: 130, def: 115, spa: 50, spd: 50, spe: 75 }, abilities: ["Hyper Cutter","Shell Armor","Sheer Force"] },
  "voltorb": { name: "Voltorb", types: ["Electric"], baseStats: { hp: 40, atk: 30, def: 50, spa: 55, spd: 55, spe: 100 }, abilities: ["Soundproof","Static","Aftermath"] },
  "voltorb-hisui": { name: "Voltorb-Hisui", types: ["Electric","Grass"], baseStats: { hp: 40, atk: 30, def: 50, spa: 55, spd: 55, spe: 100 }, abilities: ["Soundproof","Static","Aftermath"] },
  "electrode": { name: "Electrode", types: ["Electric"], baseStats: { hp: 60, atk: 50, def: 70, spa: 80, spd: 80, spe: 150 }, abilities: ["Soundproof","Static","Aftermath"] },
  "electrode-hisui": { name: "Electrode-Hisui", types: ["Electric","Grass"], baseStats: { hp: 60, atk: 50, def: 70, spa: 80, spd: 80, spe: 150 }, abilities: ["Soundproof","Static","Aftermath"] },
  "exeggcute": { name: "Exeggcute", types: ["Grass","Psychic"], baseStats: { hp: 60, atk: 40, def: 80, spa: 60, spd: 45, spe: 40 }, abilities: ["Chlorophyll","Harvest"] },
  "exeggutor": { name: "Exeggutor", types: ["Grass","Psychic"], baseStats: { hp: 95, atk: 95, def: 85, spa: 125, spd: 75, spe: 55 }, abilities: ["Chlorophyll","Harvest"] },
  "exeggutor-alola": { name: "Exeggutor-Alola", types: ["Grass","Dragon"], baseStats: { hp: 95, atk: 105, def: 85, spa: 125, spd: 75, spe: 45 }, abilities: ["Frisk","Harvest"] },
  "cubone": { name: "Cubone", types: ["Ground"], baseStats: { hp: 50, atk: 50, def: 95, spa: 40, spd: 50, spe: 35 }, abilities: ["Rock Head","Lightning Rod","Battle Armor"] },
  "marowak": { name: "Marowak", types: ["Ground"], baseStats: { hp: 60, atk: 80, def: 110, spa: 50, spd: 80, spe: 45 }, abilities: ["Rock Head","Lightning Rod","Battle Armor"] },
  "marowak-alola-totem": { name: "Marowak-Alola-Totem", types: ["Fire","Ghost"], baseStats: { hp: 60, atk: 80, def: 110, spa: 50, spd: 80, spe: 45 }, abilities: ["Rock Head"] },
  "hitmonlee": { name: "Hitmonlee", types: ["Fighting"], baseStats: { hp: 50, atk: 120, def: 53, spa: 35, spd: 110, spe: 87 }, abilities: ["Limber","Reckless","Unburden"] },
  "hitmonchan": { name: "Hitmonchan", types: ["Fighting"], baseStats: { hp: 50, atk: 105, def: 79, spa: 35, spd: 110, spe: 76 }, abilities: ["Keen Eye","Iron Fist","Inner Focus"] },
  "lickitung": { name: "Lickitung", types: ["Normal"], baseStats: { hp: 90, atk: 55, def: 75, spa: 60, spd: 75, spe: 30 }, abilities: ["Own Tempo","Oblivious","Cloud Nine"] },
  "koffing": { name: "Koffing", types: ["Poison"], baseStats: { hp: 40, atk: 65, def: 95, spa: 60, spd: 45, spe: 35 }, abilities: ["Levitate","Neutralizing Gas","Stench"] },
  "weezing": { name: "Weezing", types: ["Poison"], baseStats: { hp: 65, atk: 90, def: 120, spa: 85, spd: 70, spe: 60 }, abilities: ["Levitate","Neutralizing Gas","Stench"] },
  "weezing-galar": { name: "Weezing-Galar", types: ["Poison","Fairy"], baseStats: { hp: 65, atk: 90, def: 120, spa: 85, spd: 70, spe: 60 }, abilities: ["Levitate","Neutralizing Gas","Misty Surge"] },
  "rhyhorn": { name: "Rhyhorn", types: ["Ground","Rock"], baseStats: { hp: 80, atk: 85, def: 95, spa: 30, spd: 30, spe: 25 }, abilities: ["Lightning Rod","Rock Head","Reckless"] },
  "rhydon": { name: "Rhydon", types: ["Ground","Rock"], baseStats: { hp: 105, atk: 130, def: 120, spa: 45, spd: 45, spe: 40 }, abilities: ["Lightning Rod","Rock Head","Reckless"] },
  "tangela": { name: "Tangela", types: ["Grass"], baseStats: { hp: 65, atk: 55, def: 115, spa: 100, spd: 40, spe: 60 }, abilities: ["Chlorophyll","Leaf Guard","Regenerator"] },
  "horsea": { name: "Horsea", types: ["Water"], baseStats: { hp: 30, atk: 40, def: 70, spa: 70, spd: 25, spe: 60 }, abilities: ["Swift Swim","Sniper","Damp"] },
  "seadra": { name: "Seadra", types: ["Water"], baseStats: { hp: 55, atk: 65, def: 95, spa: 95, spd: 45, spe: 85 }, abilities: ["Poison Point","Sniper","Damp"] },
  "goldeen": { name: "Goldeen", types: ["Water"], baseStats: { hp: 45, atk: 67, def: 60, spa: 35, spd: 50, spe: 63 }, abilities: ["Swift Swim","Water Veil","Lightning Rod"] },
  "seaking": { name: "Seaking", types: ["Water"], baseStats: { hp: 80, atk: 92, def: 65, spa: 65, spd: 80, spe: 68 }, abilities: ["Swift Swim","Water Veil","Lightning Rod"] },
  "staryu": { name: "Staryu", types: ["Water"], baseStats: { hp: 30, atk: 45, def: 55, spa: 70, spd: 55, spe: 85 }, abilities: ["Illuminate","Natural Cure","Analytic"] },
  "starmie": { name: "Starmie", types: ["Water","Psychic"], baseStats: { hp: 60, atk: 75, def: 85, spa: 100, spd: 85, spe: 115 }, abilities: ["Illuminate","Natural Cure","Analytic"] },
  "mr-mime": { name: "Mr. Mime", types: ["Psychic","Fairy"], baseStats: { hp: 40, atk: 45, def: 65, spa: 100, spd: 120, spe: 90 }, abilities: ["Soundproof","Filter","Technician"] },
  "mr-mime-galar": { name: "Mr. Mime-Galar", types: ["Ice","Psychic"], baseStats: { hp: 50, atk: 65, def: 65, spa: 90, spd: 90, spe: 100 }, abilities: ["Vital Spirit","Screen Cleaner","Ice Body"] },
  "scyther": { name: "Scyther", types: ["Bug","Flying"], baseStats: { hp: 70, atk: 110, def: 80, spa: 55, spd: 80, spe: 105 }, abilities: ["Swarm","Technician","Steadfast"] },
  "jynx": { name: "Jynx", types: ["Ice","Psychic"], baseStats: { hp: 65, atk: 50, def: 35, spa: 115, spd: 95, spe: 95 }, abilities: ["Oblivious","Forewarn","Dry Skin"] },
  "electabuzz": { name: "Electabuzz", types: ["Electric"], baseStats: { hp: 65, atk: 83, def: 57, spa: 95, spd: 85, spe: 105 }, abilities: ["Static","Vital Spirit"] },
  "magmar": { name: "Magmar", types: ["Fire"], baseStats: { hp: 65, atk: 95, def: 57, spa: 100, spd: 85, spe: 93 }, abilities: ["Flame Body","Vital Spirit"] },
  "pinsir": { name: "Pinsir", types: ["Bug"], baseStats: { hp: 65, atk: 125, def: 100, spa: 55, spd: 70, spe: 85 }, abilities: ["Hyper Cutter","Mold Breaker","Moxie"] },
  "tauros": { name: "Tauros", types: ["Normal"], baseStats: { hp: 75, atk: 100, def: 95, spa: 40, spd: 70, spe: 110 }, abilities: ["Intimidate","Anger Point","Sheer Force"] },
  "tauros-paldea-combat": { name: "Tauros-Paldea-Combat", types: ["Fighting"], baseStats: { hp: 75, atk: 110, def: 105, spa: 30, spd: 70, spe: 100 }, abilities: ["Intimidate","Anger Point","Cud Chew"] },
  "tauros-paldea-blaze": { name: "Tauros-Paldea-Blaze", types: ["Fighting","Fire"], baseStats: { hp: 75, atk: 110, def: 105, spa: 30, spd: 70, spe: 100 }, abilities: ["Intimidate","Anger Point","Cud Chew"] },
  "tauros-paldea-aqua": { name: "Tauros-Paldea-Aqua", types: ["Fighting","Water"], baseStats: { hp: 75, atk: 110, def: 105, spa: 30, spd: 70, spe: 100 }, abilities: ["Intimidate","Anger Point","Cud Chew"] },
  "magikarp": { name: "Magikarp", types: ["Water"], baseStats: { hp: 20, atk: 10, def: 55, spa: 15, spd: 20, spe: 80 }, abilities: ["Swift Swim","Rattled"] },
  "lapras-gmax": { name: "Lapras-Gmax", types: ["Water","Ice"], baseStats: { hp: 130, atk: 85, def: 80, spa: 85, spd: 95, spe: 60 }, abilities: ["Water Absorb","Shell Armor","Hydration"] },
  "eevee": { name: "Eevee", types: ["Normal"], baseStats: { hp: 55, atk: 55, def: 50, spa: 45, spd: 65, spe: 55 }, abilities: ["Run Away","Adaptability","Anticipation"] },
  "eevee-starter": { name: "Eevee-Starter", types: ["Normal"], baseStats: { hp: 65, atk: 75, def: 70, spa: 65, spd: 85, spe: 75 }, abilities: ["Run Away","Adaptability","Anticipation"] },
  "eevee-gmax": { name: "Eevee-Gmax", types: ["Normal"], baseStats: { hp: 55, atk: 55, def: 50, spa: 45, spd: 65, spe: 55 }, abilities: ["Run Away","Adaptability","Anticipation"] },
  "vaporeon": { name: "Vaporeon", types: ["Water"], baseStats: { hp: 130, atk: 65, def: 60, spa: 110, spd: 95, spe: 65 }, abilities: ["Water Absorb","Hydration"] },
  "jolteon": { name: "Jolteon", types: ["Electric"], baseStats: { hp: 65, atk: 65, def: 60, spa: 110, spd: 95, spe: 130 }, abilities: ["Volt Absorb","Quick Feet"] },
  "flareon": { name: "Flareon", types: ["Fire"], baseStats: { hp: 65, atk: 130, def: 60, spa: 95, spd: 110, spe: 65 }, abilities: ["Flash Fire","Guts"] },
  "porygon": { name: "Porygon", types: ["Normal"], baseStats: { hp: 65, atk: 60, def: 70, spa: 85, spd: 75, spe: 40 }, abilities: ["Trace","Download","Analytic"] },
  "omanyte": { name: "Omanyte", types: ["Rock","Water"], baseStats: { hp: 35, atk: 40, def: 100, spa: 90, spd: 55, spe: 35 }, abilities: ["Swift Swim","Shell Armor","Weak Armor"] },
  "omastar": { name: "Omastar", types: ["Rock","Water"], baseStats: { hp: 70, atk: 60, def: 125, spa: 115, spd: 70, spe: 55 }, abilities: ["Swift Swim","Shell Armor","Weak Armor"] },
  "kabuto": { name: "Kabuto", types: ["Rock","Water"], baseStats: { hp: 30, atk: 80, def: 90, spa: 55, spd: 45, spe: 55 }, abilities: ["Swift Swim","Battle Armor","Weak Armor"] },
  "kabutops": { name: "Kabutops", types: ["Rock","Water"], baseStats: { hp: 60, atk: 115, def: 105, spa: 65, spd: 70, spe: 80 }, abilities: ["Swift Swim","Battle Armor","Weak Armor"] },
  "aerodactyl": { name: "Aerodactyl", types: ["Rock","Flying"], baseStats: { hp: 80, atk: 105, def: 65, spa: 60, spd: 75, spe: 130 }, abilities: ["Rock Head","Pressure","Unnerve"] },
  "snorlax-gmax": { name: "Snorlax-Gmax", types: ["Normal"], baseStats: { hp: 160, atk: 110, def: 65, spa: 65, spd: 110, spe: 30 }, abilities: ["Immunity","Thick Fat","Gluttony"] },
  "articuno": { name: "Articuno", types: ["Ice","Flying"], baseStats: { hp: 90, atk: 85, def: 100, spa: 95, spd: 125, spe: 85 }, abilities: ["Pressure","Snow Cloak"] },
  "dratini": { name: "Dratini", types: ["Dragon"], baseStats: { hp: 41, atk: 64, def: 45, spa: 50, spd: 50, spe: 50 }, abilities: ["Shed Skin","Marvel Scale"] },
  "dragonair": { name: "Dragonair", types: ["Dragon"], baseStats: { hp: 61, atk: 84, def: 65, spa: 70, spd: 70, spe: 70 }, abilities: ["Shed Skin","Marvel Scale"] },
  "chikorita": { name: "Chikorita", types: ["Grass"], baseStats: { hp: 45, atk: 49, def: 65, spa: 49, spd: 65, spe: 45 }, abilities: ["Overgrow","Leaf Guard"] },
  "bayleef": { name: "Bayleef", types: ["Grass"], baseStats: { hp: 60, atk: 62, def: 80, spa: 63, spd: 80, spe: 60 }, abilities: ["Overgrow","Leaf Guard"] },
  "meganium": { name: "Meganium", types: ["Grass"], baseStats: { hp: 80, atk: 82, def: 100, spa: 83, spd: 100, spe: 80 }, abilities: ["Overgrow","Leaf Guard"] },
  "cyndaquil": { name: "Cyndaquil", types: ["Fire"], baseStats: { hp: 39, atk: 52, def: 43, spa: 60, spd: 50, spe: 65 }, abilities: ["Blaze","Flash Fire"] },
  "quilava": { name: "Quilava", types: ["Fire"], baseStats: { hp: 58, atk: 64, def: 58, spa: 80, spd: 65, spe: 80 }, abilities: ["Blaze","Flash Fire"] },
  "typhlosion": { name: "Typhlosion", types: ["Fire"], baseStats: { hp: 78, atk: 84, def: 78, spa: 109, spd: 85, spe: 100 }, abilities: ["Blaze","Flash Fire"] },
  "typhlosion-hisui": { name: "Typhlosion-Hisui", types: ["Fire","Ghost"], baseStats: { hp: 73, atk: 84, def: 78, spa: 119, spd: 85, spe: 95 }, abilities: ["Blaze","Frisk"] },
  "totodile": { name: "Totodile", types: ["Water"], baseStats: { hp: 50, atk: 65, def: 64, spa: 44, spd: 48, spe: 43 }, abilities: ["Torrent","Sheer Force"] },
  "croconaw": { name: "Croconaw", types: ["Water"], baseStats: { hp: 65, atk: 80, def: 80, spa: 59, spd: 63, spe: 58 }, abilities: ["Torrent","Sheer Force"] },
  "feraligatr": { name: "Feraligatr", types: ["Water"], baseStats: { hp: 85, atk: 105, def: 100, spa: 79, spd: 83, spe: 78 }, abilities: ["Torrent","Sheer Force"] },
  "sentret": { name: "Sentret", types: ["Normal"], baseStats: { hp: 35, atk: 46, def: 34, spa: 35, spd: 45, spe: 20 }, abilities: ["Run Away","Keen Eye","Frisk"] },
  "furret": { name: "Furret", types: ["Normal"], baseStats: { hp: 85, atk: 76, def: 64, spa: 45, spd: 55, spe: 90 }, abilities: ["Run Away","Keen Eye","Frisk"] },
  "hoothoot": { name: "Hoothoot", types: ["Normal","Flying"], baseStats: { hp: 60, atk: 30, def: 30, spa: 36, spd: 56, spe: 50 }, abilities: ["Insomnia","Keen Eye","Tinted Lens"] },
  "noctowl": { name: "Noctowl", types: ["Normal","Flying"], baseStats: { hp: 100, atk: 50, def: 50, spa: 86, spd: 96, spe: 70 }, abilities: ["Insomnia","Keen Eye","Tinted Lens"] },
  "ledyba": { name: "Ledyba", types: ["Bug","Flying"], baseStats: { hp: 40, atk: 20, def: 30, spa: 40, spd: 80, spe: 55 }, abilities: ["Swarm","Early Bird","Rattled"] },
  "ledian": { name: "Ledian", types: ["Bug","Flying"], baseStats: { hp: 55, atk: 35, def: 50, spa: 55, spd: 110, spe: 85 }, abilities: ["Swarm","Early Bird","Iron Fist"] },
  "spinarak": { name: "Spinarak", types: ["Bug","Poison"], baseStats: { hp: 40, atk: 60, def: 40, spa: 40, spd: 40, spe: 30 }, abilities: ["Swarm","Insomnia","Sniper"] },
  "ariados": { name: "Ariados", types: ["Bug","Poison"], baseStats: { hp: 70, atk: 90, def: 70, spa: 60, spd: 70, spe: 40 }, abilities: ["Swarm","Insomnia","Sniper"] },
  "crobat": { name: "Crobat", types: ["Poison","Flying"], baseStats: { hp: 85, atk: 90, def: 80, spa: 70, spd: 80, spe: 130 }, abilities: ["Inner Focus","Infiltrator"] },
  "chinchou": { name: "Chinchou", types: ["Water","Electric"], baseStats: { hp: 75, atk: 38, def: 38, spa: 56, spd: 56, spe: 67 }, abilities: ["Volt Absorb","Illuminate","Water Absorb"] },
  "lanturn": { name: "Lanturn", types: ["Water","Electric"], baseStats: { hp: 125, atk: 58, def: 58, spa: 76, spd: 76, spe: 67 }, abilities: ["Volt Absorb","Illuminate","Water Absorb"] },
  "pichu": { name: "Pichu", types: ["Electric"], baseStats: { hp: 20, atk: 40, def: 15, spa: 35, spd: 35, spe: 60 }, abilities: ["Static","Lightning Rod"] },
  "pichu-spiky-eared": { name: "Pichu-Spiky-eared", types: ["Electric"], baseStats: { hp: 20, atk: 40, def: 15, spa: 35, spd: 35, spe: 60 }, abilities: ["Static"] },
  "cleffa": { name: "Cleffa", types: ["Fairy"], baseStats: { hp: 50, atk: 25, def: 28, spa: 45, spd: 55, spe: 15 }, abilities: ["Cute Charm","Magic Guard","Friend Guard"] },
  "igglybuff": { name: "Igglybuff", types: ["Normal","Fairy"], baseStats: { hp: 90, atk: 30, def: 15, spa: 40, spd: 20, spe: 15 }, abilities: ["Cute Charm","Competitive","Friend Guard"] },
  "togepi": { name: "Togepi", types: ["Fairy"], baseStats: { hp: 35, atk: 20, def: 65, spa: 40, spd: 65, spe: 20 }, abilities: ["Hustle","Serene Grace","Super Luck"] },
  "togetic": { name: "Togetic", types: ["Fairy","Flying"], baseStats: { hp: 55, atk: 40, def: 85, spa: 80, spd: 105, spe: 40 }, abilities: ["Hustle","Serene Grace","Super Luck"] },
  "natu": { name: "Natu", types: ["Psychic","Flying"], baseStats: { hp: 40, atk: 50, def: 45, spa: 70, spd: 45, spe: 70 }, abilities: ["Synchronize","Early Bird","Magic Bounce"] },
  "xatu": { name: "Xatu", types: ["Psychic","Flying"], baseStats: { hp: 65, atk: 75, def: 70, spa: 95, spd: 70, spe: 95 }, abilities: ["Synchronize","Early Bird","Magic Bounce"] },
  "mareep": { name: "Mareep", types: ["Electric"], baseStats: { hp: 55, atk: 40, def: 40, spa: 65, spd: 45, spe: 35 }, abilities: ["Static","Plus"] },
  "flaaffy": { name: "Flaaffy", types: ["Electric"], baseStats: { hp: 70, atk: 55, def: 55, spa: 80, spd: 60, spe: 45 }, abilities: ["Static","Plus"] },
  "ampharos": { name: "Ampharos", types: ["Electric"], baseStats: { hp: 90, atk: 75, def: 85, spa: 115, spd: 90, spe: 55 }, abilities: ["Static","Plus"] },
  "bellossom": { name: "Bellossom", types: ["Grass"], baseStats: { hp: 75, atk: 80, def: 95, spa: 90, spd: 100, spe: 50 }, abilities: ["Chlorophyll","Healer"] },
  "marill": { name: "Marill", types: ["Water","Fairy"], baseStats: { hp: 70, atk: 20, def: 50, spa: 20, spd: 50, spe: 40 }, abilities: ["Thick Fat","Huge Power","Sap Sipper"] },
  "sudowoodo": { name: "Sudowoodo", types: ["Rock"], baseStats: { hp: 70, atk: 100, def: 115, spa: 30, spd: 65, spe: 30 }, abilities: ["Sturdy","Rock Head","Rattled"] },
  "hoppip": { name: "Hoppip", types: ["Grass","Flying"], baseStats: { hp: 35, atk: 35, def: 40, spa: 35, spd: 55, spe: 50 }, abilities: ["Chlorophyll","Leaf Guard","Infiltrator"] },
  "skiploom": { name: "Skiploom", types: ["Grass","Flying"], baseStats: { hp: 55, atk: 45, def: 50, spa: 45, spd: 65, spe: 80 }, abilities: ["Chlorophyll","Leaf Guard","Infiltrator"] },
  "jumpluff": { name: "Jumpluff", types: ["Grass","Flying"], baseStats: { hp: 75, atk: 55, def: 70, spa: 55, spd: 95, spe: 110 }, abilities: ["Chlorophyll","Leaf Guard","Infiltrator"] },
  "aipom": { name: "Aipom", types: ["Normal"], baseStats: { hp: 55, atk: 70, def: 55, spa: 40, spd: 55, spe: 85 }, abilities: ["Run Away","Pickup","Skill Link"] },
  "sunkern": { name: "Sunkern", types: ["Grass"], baseStats: { hp: 30, atk: 30, def: 30, spa: 30, spd: 30, spe: 30 }, abilities: ["Chlorophyll","Solar Power","Early Bird"] },
  "sunflora": { name: "Sunflora", types: ["Grass"], baseStats: { hp: 75, atk: 75, def: 55, spa: 105, spd: 85, spe: 30 }, abilities: ["Chlorophyll","Solar Power","Early Bird"] },
  "yanma": { name: "Yanma", types: ["Bug","Flying"], baseStats: { hp: 65, atk: 65, def: 45, spa: 75, spd: 45, spe: 95 }, abilities: ["Speed Boost","Compound Eyes","Frisk"] },
  "wooper": { name: "Wooper", types: ["Water","Ground"], baseStats: { hp: 55, atk: 45, def: 45, spa: 25, spd: 25, spe: 15 }, abilities: ["Damp","Water Absorb","Unaware"] },
  "wooper-paldea": { name: "Wooper-Paldea", types: ["Poison","Ground"], baseStats: { hp: 55, atk: 45, def: 45, spa: 25, spd: 25, spe: 15 }, abilities: ["Poison Point","Water Absorb","Unaware"] },
  "quagsire": { name: "Quagsire", types: ["Water","Ground"], baseStats: { hp: 95, atk: 85, def: 85, spa: 65, spd: 65, spe: 35 }, abilities: ["Damp","Water Absorb","Unaware"] },
  "espeon": { name: "Espeon", types: ["Psychic"], baseStats: { hp: 65, atk: 65, def: 60, spa: 130, spd: 95, spe: 110 }, abilities: ["Synchronize","Magic Bounce"] },
  "umbreon": { name: "Umbreon", types: ["Dark"], baseStats: { hp: 95, atk: 65, def: 110, spa: 60, spd: 130, spe: 65 }, abilities: ["Synchronize","Inner Focus"] },
  "slowking": { name: "Slowking", types: ["Water","Psychic"], baseStats: { hp: 95, atk: 75, def: 80, spa: 100, spd: 110, spe: 30 }, abilities: ["Oblivious","Own Tempo","Regenerator"] },
  "slowking-galar": { name: "Slowking-Galar", types: ["Poison","Psychic"], baseStats: { hp: 95, atk: 65, def: 80, spa: 110, spd: 110, spe: 30 }, abilities: ["Curious Medicine","Own Tempo","Regenerator"] },
  "misdreavus": { name: "Misdreavus", types: ["Ghost"], baseStats: { hp: 60, atk: 60, def: 60, spa: 85, spd: 85, spe: 85 }, abilities: ["Levitate"] },
  "unown": { name: "Unown", types: ["Psychic"], baseStats: { hp: 48, atk: 72, def: 48, spa: 72, spd: 48, spe: 48 }, abilities: ["Levitate"] },
  "wobbuffet": { name: "Wobbuffet", types: ["Psychic"], baseStats: { hp: 190, atk: 33, def: 58, spa: 33, spd: 58, spe: 33 }, abilities: ["Shadow Tag","Telepathy"] },
  "girafarig": { name: "Girafarig", types: ["Normal","Psychic"], baseStats: { hp: 70, atk: 80, def: 65, spa: 90, spd: 65, spe: 85 }, abilities: ["Inner Focus","Early Bird","Sap Sipper"] },
  "pineco": { name: "Pineco", types: ["Bug"], baseStats: { hp: 50, atk: 65, def: 90, spa: 35, spd: 35, spe: 15 }, abilities: ["Sturdy","Overcoat"] },
  "forretress": { name: "Forretress", types: ["Bug","Steel"], baseStats: { hp: 75, atk: 90, def: 140, spa: 60, spd: 60, spe: 40 }, abilities: ["Sturdy","Overcoat"] },
  "dunsparce": { name: "Dunsparce", types: ["Normal"], baseStats: { hp: 100, atk: 70, def: 70, spa: 65, spd: 65, spe: 45 }, abilities: ["Serene Grace","Run Away","Rattled"] },
  "gligar": { name: "Gligar", types: ["Ground","Flying"], baseStats: { hp: 65, atk: 75, def: 105, spa: 35, spd: 65, spe: 85 }, abilities: ["Hyper Cutter","Sand Veil","Immunity"] },
  "steelix": { name: "Steelix", types: ["Steel","Ground"], baseStats: { hp: 75, atk: 85, def: 200, spa: 55, spd: 65, spe: 30 }, abilities: ["Rock Head","Sturdy","Sheer Force"] },
  "snubbull": { name: "Snubbull", types: ["Fairy"], baseStats: { hp: 60, atk: 80, def: 50, spa: 40, spd: 40, spe: 30 }, abilities: ["Intimidate","Run Away","Rattled"] },
  "granbull": { name: "Granbull", types: ["Fairy"], baseStats: { hp: 90, atk: 120, def: 75, spa: 60, spd: 60, spe: 45 }, abilities: ["Intimidate","Quick Feet","Rattled"] },
  "qwilfish": { name: "Qwilfish", types: ["Water","Poison"], baseStats: { hp: 65, atk: 95, def: 85, spa: 55, spd: 55, spe: 85 }, abilities: ["Poison Point","Swift Swim","Intimidate"] },
  "qwilfish-hisui": { name: "Qwilfish-Hisui", types: ["Dark","Poison"], baseStats: { hp: 65, atk: 95, def: 85, spa: 55, spd: 55, spe: 85 }, abilities: ["Poison Point","Swift Swim","Intimidate"] },
  "shuckle": { name: "Shuckle", types: ["Bug","Rock"], baseStats: { hp: 20, atk: 10, def: 230, spa: 10, spd: 230, spe: 5 }, abilities: ["Sturdy","Gluttony","Contrary"] },
  "heracross": { name: "Heracross", types: ["Bug","Fighting"], baseStats: { hp: 80, atk: 125, def: 75, spa: 40, spd: 95, spe: 85 }, abilities: ["Swarm","Guts","Moxie"] },
  "sneasel": { name: "Sneasel", types: ["Dark","Ice"], baseStats: { hp: 55, atk: 95, def: 55, spa: 35, spd: 75, spe: 115 }, abilities: ["Inner Focus","Keen Eye","Pickpocket"] },
  "sneasel-hisui": { name: "Sneasel-Hisui", types: ["Fighting","Poison"], baseStats: { hp: 55, atk: 95, def: 55, spa: 35, spd: 75, spe: 115 }, abilities: ["Inner Focus","Keen Eye","Pickpocket"] },
  "teddiursa": { name: "Teddiursa", types: ["Normal"], baseStats: { hp: 60, atk: 80, def: 50, spa: 50, spd: 50, spe: 40 }, abilities: ["Pickup","Quick Feet","Honey Gather"] },
  "ursaring": { name: "Ursaring", types: ["Normal"], baseStats: { hp: 90, atk: 130, def: 75, spa: 75, spd: 75, spe: 55 }, abilities: ["Guts","Quick Feet","Unnerve"] },
  "slugma": { name: "Slugma", types: ["Fire"], baseStats: { hp: 40, atk: 40, def: 40, spa: 70, spd: 40, spe: 20 }, abilities: ["Magma Armor","Flame Body","Weak Armor"] },
  "magcargo": { name: "Magcargo", types: ["Fire","Rock"], baseStats: { hp: 60, atk: 50, def: 120, spa: 90, spd: 80, spe: 30 }, abilities: ["Magma Armor","Flame Body","Weak Armor"] },
  "swinub": { name: "Swinub", types: ["Ice","Ground"], baseStats: { hp: 50, atk: 50, def: 40, spa: 30, spd: 30, spe: 50 }, abilities: ["Oblivious","Snow Cloak","Thick Fat"] },
  "piloswine": { name: "Piloswine", types: ["Ice","Ground"], baseStats: { hp: 100, atk: 100, def: 80, spa: 60, spd: 60, spe: 50 }, abilities: ["Oblivious","Snow Cloak","Thick Fat"] },
  "corsola": { name: "Corsola", types: ["Water","Rock"], baseStats: { hp: 65, atk: 55, def: 95, spa: 65, spd: 95, spe: 35 }, abilities: ["Hustle","Natural Cure","Regenerator"] },
  "corsola-galar": { name: "Corsola-Galar", types: ["Ghost"], baseStats: { hp: 60, atk: 55, def: 100, spa: 65, spd: 100, spe: 30 }, abilities: ["Weak Armor","Cursed Body"] },
  "remoraid": { name: "Remoraid", types: ["Water"], baseStats: { hp: 35, atk: 65, def: 35, spa: 65, spd: 35, spe: 65 }, abilities: ["Hustle","Sniper","Moody"] },
  "octillery": { name: "Octillery", types: ["Water"], baseStats: { hp: 75, atk: 105, def: 75, spa: 105, spd: 75, spe: 45 }, abilities: ["Suction Cups","Sniper","Moody"] },
  "delibird": { name: "Delibird", types: ["Ice","Flying"], baseStats: { hp: 45, atk: 55, def: 45, spa: 65, spd: 45, spe: 75 }, abilities: ["Vital Spirit","Hustle","Insomnia"] },
  "mantine": { name: "Mantine", types: ["Water","Flying"], baseStats: { hp: 85, atk: 40, def: 70, spa: 80, spd: 140, spe: 70 }, abilities: ["Swift Swim","Water Absorb","Water Veil"] },
  "skarmory": { name: "Skarmory", types: ["Steel","Flying"], baseStats: { hp: 65, atk: 80, def: 140, spa: 40, spd: 70, spe: 70 }, abilities: ["Keen Eye","Sturdy","Weak Armor"] },
  "houndour": { name: "Houndour", types: ["Dark","Fire"], baseStats: { hp: 45, atk: 60, def: 30, spa: 80, spd: 50, spe: 65 }, abilities: ["Early Bird","Flash Fire","Unnerve"] },
  "houndoom": { name: "Houndoom", types: ["Dark","Fire"], baseStats: { hp: 75, atk: 90, def: 50, spa: 110, spd: 80, spe: 95 }, abilities: ["Early Bird","Flash Fire","Unnerve"] },
  "phanpy": { name: "Phanpy", types: ["Ground"], baseStats: { hp: 90, atk: 60, def: 60, spa: 40, spd: 40, spe: 40 }, abilities: ["Pickup","Sand Veil"] },
  "donphan": { name: "Donphan", types: ["Ground"], baseStats: { hp: 90, atk: 120, def: 120, spa: 60, spd: 60, spe: 50 }, abilities: ["Sturdy","Sand Veil"] },
  "stantler": { name: "Stantler", types: ["Normal"], baseStats: { hp: 73, atk: 95, def: 62, spa: 85, spd: 65, spe: 85 }, abilities: ["Intimidate","Frisk","Sap Sipper"] },
  "smeargle": { name: "Smeargle", types: ["Normal"], baseStats: { hp: 55, atk: 20, def: 35, spa: 20, spd: 45, spe: 75 }, abilities: ["Own Tempo","Technician","Moody"] },
  "tyrogue": { name: "Tyrogue", types: ["Fighting"], baseStats: { hp: 35, atk: 35, def: 35, spa: 35, spd: 35, spe: 35 }, abilities: ["Guts","Steadfast","Vital Spirit"] },
  "smoochum": { name: "Smoochum", types: ["Ice","Psychic"], baseStats: { hp: 45, atk: 30, def: 15, spa: 85, spd: 65, spe: 65 }, abilities: ["Oblivious","Forewarn","Hydration"] },
  "elekid": { name: "Elekid", types: ["Electric"], baseStats: { hp: 45, atk: 63, def: 37, spa: 65, spd: 55, spe: 95 }, abilities: ["Static","Vital Spirit"] },
  "magby": { name: "Magby", types: ["Fire"], baseStats: { hp: 45, atk: 75, def: 37, spa: 70, spd: 55, spe: 83 }, abilities: ["Flame Body","Vital Spirit"] },
  "miltank": { name: "Miltank", types: ["Normal"], baseStats: { hp: 95, atk: 80, def: 105, spa: 40, spd: 70, spe: 100 }, abilities: ["Thick Fat","Scrappy","Sap Sipper"] },
  "larvitar": { name: "Larvitar", types: ["Rock","Ground"], baseStats: { hp: 50, atk: 64, def: 50, spa: 45, spd: 50, spe: 41 }, abilities: ["Guts","Sand Veil"] },
  "pupitar": { name: "Pupitar", types: ["Rock","Ground"], baseStats: { hp: 70, atk: 84, def: 70, spa: 65, spd: 70, spe: 51 }, abilities: ["Shed Skin"] },
  "celebi": { name: "Celebi", types: ["Psychic","Grass"], baseStats: { hp: 100, atk: 100, def: 100, spa: 100, spd: 100, spe: 100 }, abilities: ["Natural Cure"] },
  "treecko": { name: "Treecko", types: ["Grass"], baseStats: { hp: 40, atk: 45, def: 35, spa: 65, spd: 55, spe: 70 }, abilities: ["Overgrow","Unburden"] },
  "grovyle": { name: "Grovyle", types: ["Grass"], baseStats: { hp: 50, atk: 65, def: 45, spa: 85, spd: 65, spe: 95 }, abilities: ["Overgrow","Unburden"] },
  "torchic": { name: "Torchic", types: ["Fire"], baseStats: { hp: 45, atk: 60, def: 40, spa: 70, spd: 50, spe: 45 }, abilities: ["Blaze","Speed Boost"] },
  "combusken": { name: "Combusken", types: ["Fire","Fighting"], baseStats: { hp: 60, atk: 85, def: 60, spa: 85, spd: 60, spe: 55 }, abilities: ["Blaze","Speed Boost"] },
  "mudkip": { name: "Mudkip", types: ["Water"], baseStats: { hp: 50, atk: 70, def: 50, spa: 50, spd: 50, spe: 40 }, abilities: ["Torrent","Damp"] },
  "marshtomp": { name: "Marshtomp", types: ["Water","Ground"], baseStats: { hp: 70, atk: 85, def: 70, spa: 60, spd: 70, spe: 50 }, abilities: ["Torrent","Damp"] },
  "poochyena": { name: "Poochyena", types: ["Dark"], baseStats: { hp: 35, atk: 55, def: 35, spa: 30, spd: 30, spe: 35 }, abilities: ["Run Away","Quick Feet","Rattled"] },
  "mightyena": { name: "Mightyena", types: ["Dark"], baseStats: { hp: 70, atk: 90, def: 70, spa: 60, spd: 60, spe: 70 }, abilities: ["Intimidate","Quick Feet","Moxie"] },
  "zigzagoon": { name: "Zigzagoon", types: ["Normal"], baseStats: { hp: 38, atk: 30, def: 41, spa: 30, spd: 41, spe: 60 }, abilities: ["Pickup","Gluttony","Quick Feet"] },
  "zigzagoon-galar": { name: "Zigzagoon-Galar", types: ["Dark","Normal"], baseStats: { hp: 38, atk: 30, def: 41, spa: 30, spd: 41, spe: 60 }, abilities: ["Pickup","Gluttony","Quick Feet"] },
  "linoone": { name: "Linoone", types: ["Normal"], baseStats: { hp: 78, atk: 70, def: 61, spa: 50, spd: 61, spe: 100 }, abilities: ["Pickup","Gluttony","Quick Feet"] },
  "linoone-galar": { name: "Linoone-Galar", types: ["Dark","Normal"], baseStats: { hp: 78, atk: 70, def: 61, spa: 50, spd: 61, spe: 100 }, abilities: ["Pickup","Gluttony","Quick Feet"] },
  "wurmple": { name: "Wurmple", types: ["Bug"], baseStats: { hp: 45, atk: 45, def: 35, spa: 20, spd: 30, spe: 20 }, abilities: ["Shield Dust","Run Away"] },
  "silcoon": { name: "Silcoon", types: ["Bug"], baseStats: { hp: 50, atk: 35, def: 55, spa: 25, spd: 25, spe: 15 }, abilities: ["Shed Skin"] },
  "beautifly": { name: "Beautifly", types: ["Bug","Flying"], baseStats: { hp: 60, atk: 70, def: 50, spa: 100, spd: 50, spe: 65 }, abilities: ["Swarm","Rivalry"] },
  "cascoon": { name: "Cascoon", types: ["Bug"], baseStats: { hp: 50, atk: 35, def: 55, spa: 25, spd: 25, spe: 15 }, abilities: ["Shed Skin"] },
  "dustox": { name: "Dustox", types: ["Bug","Poison"], baseStats: { hp: 60, atk: 50, def: 70, spa: 50, spd: 90, spe: 65 }, abilities: ["Shield Dust","Compound Eyes"] },
  "lotad": { name: "Lotad", types: ["Water","Grass"], baseStats: { hp: 40, atk: 30, def: 30, spa: 40, spd: 50, spe: 30 }, abilities: ["Swift Swim","Rain Dish","Own Tempo"] },
  "lombre": { name: "Lombre", types: ["Water","Grass"], baseStats: { hp: 60, atk: 50, def: 50, spa: 60, spd: 70, spe: 50 }, abilities: ["Swift Swim","Rain Dish","Own Tempo"] },
  "seedot": { name: "Seedot", types: ["Grass"], baseStats: { hp: 40, atk: 40, def: 50, spa: 30, spd: 30, spe: 30 }, abilities: ["Chlorophyll","Early Bird","Pickpocket"] },
  "nuzleaf": { name: "Nuzleaf", types: ["Grass","Dark"], baseStats: { hp: 70, atk: 70, def: 40, spa: 60, spd: 40, spe: 60 }, abilities: ["Chlorophyll","Early Bird","Pickpocket"] },
  "shiftry": { name: "Shiftry", types: ["Grass","Dark"], baseStats: { hp: 90, atk: 100, def: 60, spa: 90, spd: 60, spe: 80 }, abilities: ["Chlorophyll","Wind Rider","Pickpocket"] },
  "taillow": { name: "Taillow", types: ["Normal","Flying"], baseStats: { hp: 40, atk: 55, def: 30, spa: 30, spd: 30, spe: 85 }, abilities: ["Guts","Scrappy"] },
  "swellow": { name: "Swellow", types: ["Normal","Flying"], baseStats: { hp: 60, atk: 85, def: 60, spa: 75, spd: 50, spe: 125 }, abilities: ["Guts","Scrappy"] },
  "wingull": { name: "Wingull", types: ["Water","Flying"], baseStats: { hp: 40, atk: 30, def: 30, spa: 55, spd: 30, spe: 85 }, abilities: ["Keen Eye","Hydration","Rain Dish"] },
  "ralts": { name: "Ralts", types: ["Psychic","Fairy"], baseStats: { hp: 28, atk: 25, def: 25, spa: 45, spd: 35, spe: 40 }, abilities: ["Synchronize","Trace","Telepathy"] },
  "kirlia": { name: "Kirlia", types: ["Psychic","Fairy"], baseStats: { hp: 38, atk: 35, def: 35, spa: 65, spd: 55, spe: 50 }, abilities: ["Synchronize","Trace","Telepathy"] },
  "surskit": { name: "Surskit", types: ["Bug","Water"], baseStats: { hp: 40, atk: 30, def: 32, spa: 50, spd: 52, spe: 65 }, abilities: ["Swift Swim","Rain Dish"] },
  "masquerain": { name: "Masquerain", types: ["Bug","Flying"], baseStats: { hp: 70, atk: 60, def: 62, spa: 100, spd: 82, spe: 80 }, abilities: ["Intimidate","Unnerve"] },
  "shroomish": { name: "Shroomish", types: ["Grass"], baseStats: { hp: 60, atk: 40, def: 60, spa: 40, spd: 60, spe: 35 }, abilities: ["Effect Spore","Poison Heal","Quick Feet"] },
  "slakoth": { name: "Slakoth", types: ["Normal"], baseStats: { hp: 60, atk: 60, def: 60, spa: 35, spd: 35, spe: 30 }, abilities: ["Truant"] },
  "vigoroth": { name: "Vigoroth", types: ["Normal"], baseStats: { hp: 80, atk: 80, def: 80, spa: 55, spd: 55, spe: 90 }, abilities: ["Vital Spirit"] },
  "slaking": { name: "Slaking", types: ["Normal"], baseStats: { hp: 150, atk: 160, def: 100, spa: 95, spd: 65, spe: 100 }, abilities: ["Truant"] },
  "nincada": { name: "Nincada", types: ["Bug","Ground"], baseStats: { hp: 31, atk: 45, def: 90, spa: 30, spd: 30, spe: 40 }, abilities: ["Compound Eyes","Run Away"] },
  "ninjask": { name: "Ninjask", types: ["Bug","Flying"], baseStats: { hp: 61, atk: 90, def: 45, spa: 50, spd: 50, spe: 160 }, abilities: ["Speed Boost","Infiltrator"] },
  "shedinja": { name: "Shedinja", types: ["Bug","Ghost"], baseStats: { hp: 1, atk: 90, def: 45, spa: 30, spd: 30, spe: 40 }, abilities: ["Wonder Guard"] },
  "whismur": { name: "Whismur", types: ["Normal"], baseStats: { hp: 64, atk: 51, def: 23, spa: 51, spd: 23, spe: 28 }, abilities: ["Soundproof","Rattled"] },
  "loudred": { name: "Loudred", types: ["Normal"], baseStats: { hp: 84, atk: 71, def: 43, spa: 71, spd: 43, spe: 48 }, abilities: ["Soundproof","Scrappy"] },
  "exploud": { name: "Exploud", types: ["Normal"], baseStats: { hp: 104, atk: 91, def: 63, spa: 91, spd: 73, spe: 68 }, abilities: ["Soundproof","Scrappy"] },
  "makuhita": { name: "Makuhita", types: ["Fighting"], baseStats: { hp: 72, atk: 60, def: 30, spa: 20, spd: 30, spe: 25 }, abilities: ["Thick Fat","Guts","Sheer Force"] },
  "azurill": { name: "Azurill", types: ["Normal","Fairy"], baseStats: { hp: 50, atk: 20, def: 40, spa: 20, spd: 40, spe: 20 }, abilities: ["Thick Fat","Huge Power","Sap Sipper"] },
  "nosepass": { name: "Nosepass", types: ["Rock"], baseStats: { hp: 30, atk: 45, def: 135, spa: 45, spd: 90, spe: 30 }, abilities: ["Sturdy","Magnet Pull","Sand Force"] },
  "skitty": { name: "Skitty", types: ["Normal"], baseStats: { hp: 50, atk: 45, def: 45, spa: 35, spd: 35, spe: 50 }, abilities: ["Cute Charm","Normalize","Wonder Skin"] },
  "delcatty": { name: "Delcatty", types: ["Normal"], baseStats: { hp: 70, atk: 65, def: 65, spa: 55, spd: 55, spe: 90 }, abilities: ["Cute Charm","Normalize","Wonder Skin"] },
  "aron": { name: "Aron", types: ["Steel","Rock"], baseStats: { hp: 50, atk: 70, def: 100, spa: 40, spd: 40, spe: 30 }, abilities: ["Sturdy","Rock Head","Heavy Metal"] },
  "lairon": { name: "Lairon", types: ["Steel","Rock"], baseStats: { hp: 60, atk: 90, def: 140, spa: 50, spd: 50, spe: 40 }, abilities: ["Sturdy","Rock Head","Heavy Metal"] },
  "aggron": { name: "Aggron", types: ["Steel","Rock"], baseStats: { hp: 70, atk: 110, def: 180, spa: 60, spd: 60, spe: 50 }, abilities: ["Sturdy","Rock Head","Heavy Metal"] },
  "meditite": { name: "Meditite", types: ["Fighting","Psychic"], baseStats: { hp: 30, atk: 40, def: 55, spa: 40, spd: 55, spe: 60 }, abilities: ["Pure Power","Telepathy"] },
  "electrike": { name: "Electrike", types: ["Electric"], baseStats: { hp: 40, atk: 45, def: 40, spa: 65, spd: 40, spe: 65 }, abilities: ["Static","Lightning Rod","Minus"] },
  "plusle": { name: "Plusle", types: ["Electric"], baseStats: { hp: 60, atk: 50, def: 40, spa: 85, spd: 75, spe: 95 }, abilities: ["Plus","Lightning Rod"] },
  "minun": { name: "Minun", types: ["Electric"], baseStats: { hp: 60, atk: 40, def: 50, spa: 75, spd: 85, spe: 95 }, abilities: ["Minus","Volt Absorb"] },
  "volbeat": { name: "Volbeat", types: ["Bug"], baseStats: { hp: 65, atk: 73, def: 75, spa: 47, spd: 85, spe: 85 }, abilities: ["Illuminate","Swarm","Prankster"] },
  "illumise": { name: "Illumise", types: ["Bug"], baseStats: { hp: 65, atk: 47, def: 75, spa: 73, spd: 85, spe: 85 }, abilities: ["Oblivious","Tinted Lens","Prankster"] },
  "roselia": { name: "Roselia", types: ["Grass","Poison"], baseStats: { hp: 50, atk: 60, def: 45, spa: 100, spd: 80, spe: 65 }, abilities: ["Natural Cure","Poison Point","Leaf Guard"] },
  "gulpin": { name: "Gulpin", types: ["Poison"], baseStats: { hp: 70, atk: 43, def: 53, spa: 43, spd: 53, spe: 40 }, abilities: ["Liquid Ooze","Sticky Hold","Gluttony"] },
  "swalot": { name: "Swalot", types: ["Poison"], baseStats: { hp: 100, atk: 73, def: 83, spa: 73, spd: 83, spe: 55 }, abilities: ["Liquid Ooze","Sticky Hold","Gluttony"] },
  "carvanha": { name: "Carvanha", types: ["Water","Dark"], baseStats: { hp: 45, atk: 90, def: 20, spa: 65, spd: 20, spe: 65 }, abilities: ["Rough Skin","Speed Boost"] },
  "sharpedo": { name: "Sharpedo", types: ["Water","Dark"], baseStats: { hp: 70, atk: 120, def: 40, spa: 95, spd: 40, spe: 95 }, abilities: ["Rough Skin","Speed Boost"] },
  "wailmer": { name: "Wailmer", types: ["Water"], baseStats: { hp: 130, atk: 70, def: 35, spa: 70, spd: 35, spe: 60 }, abilities: ["Water Veil","Oblivious","Pressure"] },
  "wailord": { name: "Wailord", types: ["Water"], baseStats: { hp: 170, atk: 90, def: 45, spa: 90, spd: 45, spe: 60 }, abilities: ["Water Veil","Oblivious","Pressure"] },
  "numel": { name: "Numel", types: ["Fire","Ground"], baseStats: { hp: 60, atk: 60, def: 40, spa: 65, spd: 45, spe: 35 }, abilities: ["Oblivious","Simple","Own Tempo"] },
  "camerupt": { name: "Camerupt", types: ["Fire","Ground"], baseStats: { hp: 70, atk: 100, def: 70, spa: 105, spd: 75, spe: 40 }, abilities: ["Magma Armor","Solid Rock","Anger Point"] },
  "spoink": { name: "Spoink", types: ["Psychic"], baseStats: { hp: 60, atk: 25, def: 35, spa: 70, spd: 80, spe: 60 }, abilities: ["Thick Fat","Own Tempo","Gluttony"] },
  "grumpig": { name: "Grumpig", types: ["Psychic"], baseStats: { hp: 80, atk: 45, def: 65, spa: 90, spd: 110, spe: 80 }, abilities: ["Thick Fat","Own Tempo","Gluttony"] },
  "spinda": { name: "Spinda", types: ["Normal"], baseStats: { hp: 60, atk: 60, def: 60, spa: 60, spd: 60, spe: 60 }, abilities: ["Own Tempo","Tangled Feet","Contrary"] },
  "trapinch": { name: "Trapinch", types: ["Ground"], baseStats: { hp: 45, atk: 100, def: 45, spa: 45, spd: 45, spe: 10 }, abilities: ["Hyper Cutter","Arena Trap","Sheer Force"] },
  "vibrava": { name: "Vibrava", types: ["Ground","Dragon"], baseStats: { hp: 50, atk: 70, def: 50, spa: 50, spd: 50, spe: 70 }, abilities: ["Levitate"] },
  "flygon": { name: "Flygon", types: ["Ground","Dragon"], baseStats: { hp: 80, atk: 100, def: 80, spa: 80, spd: 80, spe: 100 }, abilities: ["Levitate"] },
  "cacnea": { name: "Cacnea", types: ["Grass"], baseStats: { hp: 50, atk: 85, def: 40, spa: 85, spd: 40, spe: 35 }, abilities: ["Sand Veil","Water Absorb"] },
  "cacturne": { name: "Cacturne", types: ["Grass","Dark"], baseStats: { hp: 70, atk: 115, def: 60, spa: 115, spd: 60, spe: 55 }, abilities: ["Sand Veil","Water Absorb"] },
  "swablu": { name: "Swablu", types: ["Normal","Flying"], baseStats: { hp: 45, atk: 40, def: 60, spa: 40, spd: 75, spe: 50 }, abilities: ["Natural Cure","Cloud Nine"] },
  "altaria": { name: "Altaria", types: ["Dragon","Flying"], baseStats: { hp: 75, atk: 70, def: 90, spa: 70, spd: 105, spe: 80 }, abilities: ["Natural Cure","Cloud Nine"] },
  "zangoose": { name: "Zangoose", types: ["Normal"], baseStats: { hp: 73, atk: 115, def: 60, spa: 60, spd: 60, spe: 90 }, abilities: ["Immunity","Toxic Boost"] },
  "seviper": { name: "Seviper", types: ["Poison"], baseStats: { hp: 73, atk: 100, def: 60, spa: 100, spd: 60, spe: 65 }, abilities: ["Shed Skin","Infiltrator"] },
  "lunatone": { name: "Lunatone", types: ["Rock","Psychic"], baseStats: { hp: 90, atk: 55, def: 65, spa: 95, spd: 85, spe: 70 }, abilities: ["Levitate"] },
  "solrock": { name: "Solrock", types: ["Rock","Psychic"], baseStats: { hp: 90, atk: 95, def: 85, spa: 55, spd: 65, spe: 70 }, abilities: ["Levitate"] },
  "barboach": { name: "Barboach", types: ["Water","Ground"], baseStats: { hp: 50, atk: 48, def: 43, spa: 46, spd: 41, spe: 60 }, abilities: ["Oblivious","Anticipation","Hydration"] },
  "whiscash": { name: "Whiscash", types: ["Water","Ground"], baseStats: { hp: 110, atk: 78, def: 73, spa: 76, spd: 71, spe: 60 }, abilities: ["Oblivious","Anticipation","Hydration"] },
  "corphish": { name: "Corphish", types: ["Water"], baseStats: { hp: 43, atk: 80, def: 65, spa: 50, spd: 35, spe: 35 }, abilities: ["Hyper Cutter","Shell Armor","Adaptability"] },
  "crawdaunt": { name: "Crawdaunt", types: ["Water","Dark"], baseStats: { hp: 63, atk: 120, def: 85, spa: 90, spd: 55, spe: 55 }, abilities: ["Hyper Cutter","Shell Armor","Adaptability"] },
  "baltoy": { name: "Baltoy", types: ["Ground","Psychic"], baseStats: { hp: 40, atk: 40, def: 55, spa: 40, spd: 70, spe: 55 }, abilities: ["Levitate"] },
  "claydol": { name: "Claydol", types: ["Ground","Psychic"], baseStats: { hp: 60, atk: 70, def: 105, spa: 70, spd: 120, spe: 75 }, abilities: ["Levitate"] },
  "lileep": { name: "Lileep", types: ["Rock","Grass"], baseStats: { hp: 66, atk: 41, def: 77, spa: 61, spd: 87, spe: 23 }, abilities: ["Suction Cups","Storm Drain"] },
  "cradily": { name: "Cradily", types: ["Rock","Grass"], baseStats: { hp: 86, atk: 81, def: 97, spa: 81, spd: 107, spe: 43 }, abilities: ["Suction Cups","Storm Drain"] },
  "anorith": { name: "Anorith", types: ["Rock","Bug"], baseStats: { hp: 45, atk: 95, def: 50, spa: 40, spd: 50, spe: 75 }, abilities: ["Battle Armor","Swift Swim"] },
  "armaldo": { name: "Armaldo", types: ["Rock","Bug"], baseStats: { hp: 75, atk: 125, def: 100, spa: 70, spd: 80, spe: 45 }, abilities: ["Battle Armor","Swift Swim"] },
  "feebas": { name: "Feebas", types: ["Water"], baseStats: { hp: 20, atk: 15, def: 20, spa: 10, spd: 55, spe: 80 }, abilities: ["Swift Swim","Oblivious","Adaptability"] },
  "castform": { name: "Castform", types: ["Normal"], baseStats: { hp: 70, atk: 70, def: 70, spa: 70, spd: 70, spe: 70 }, abilities: ["Forecast"] },
  "castform-sunny": { name: "Castform-Sunny", types: ["Fire"], baseStats: { hp: 70, atk: 70, def: 70, spa: 70, spd: 70, spe: 70 }, abilities: ["Forecast"] },
  "castform-rainy": { name: "Castform-Rainy", types: ["Water"], baseStats: { hp: 70, atk: 70, def: 70, spa: 70, spd: 70, spe: 70 }, abilities: ["Forecast"] },
  "castform-snowy": { name: "Castform-Snowy", types: ["Ice"], baseStats: { hp: 70, atk: 70, def: 70, spa: 70, spd: 70, spe: 70 }, abilities: ["Forecast"] },
  "kecleon": { name: "Kecleon", types: ["Normal"], baseStats: { hp: 60, atk: 90, def: 70, spa: 60, spd: 120, spe: 40 }, abilities: ["Color Change","Protean"] },
  "shuppet": { name: "Shuppet", types: ["Ghost"], baseStats: { hp: 44, atk: 75, def: 35, spa: 63, spd: 33, spe: 45 }, abilities: ["Insomnia","Frisk","Cursed Body"] },
  "banette": { name: "Banette", types: ["Ghost"], baseStats: { hp: 64, atk: 115, def: 65, spa: 83, spd: 63, spe: 65 }, abilities: ["Insomnia","Frisk","Cursed Body"] },
  "duskull": { name: "Duskull", types: ["Ghost"], baseStats: { hp: 20, atk: 40, def: 90, spa: 30, spd: 90, spe: 25 }, abilities: ["Levitate","Frisk"] },
  "tropius": { name: "Tropius", types: ["Grass","Flying"], baseStats: { hp: 99, atk: 68, def: 83, spa: 72, spd: 87, spe: 51 }, abilities: ["Chlorophyll","Solar Power","Harvest"] },
  "chimecho": { name: "Chimecho", types: ["Psychic"], baseStats: { hp: 75, atk: 50, def: 80, spa: 95, spd: 90, spe: 65 }, abilities: ["Levitate"] },
  "absol": { name: "Absol", types: ["Dark"], baseStats: { hp: 65, atk: 130, def: 60, spa: 75, spd: 60, spe: 75 }, abilities: ["Pressure","Super Luck","Justified"] },
  "wynaut": { name: "Wynaut", types: ["Psychic"], baseStats: { hp: 95, atk: 23, def: 48, spa: 23, spd: 48, spe: 23 }, abilities: ["Shadow Tag","Telepathy"] },
  "snorunt": { name: "Snorunt", types: ["Ice"], baseStats: { hp: 50, atk: 50, def: 50, spa: 50, spd: 50, spe: 50 }, abilities: ["Inner Focus","Ice Body","Moody"] },
  "glalie": { name: "Glalie", types: ["Ice"], baseStats: { hp: 80, atk: 80, def: 80, spa: 80, spd: 80, spe: 80 }, abilities: ["Inner Focus","Ice Body","Moody"] },
  "spheal": { name: "Spheal", types: ["Ice","Water"], baseStats: { hp: 70, atk: 40, def: 50, spa: 55, spd: 50, spe: 25 }, abilities: ["Thick Fat","Ice Body","Oblivious"] },
  "sealeo": { name: "Sealeo", types: ["Ice","Water"], baseStats: { hp: 90, atk: 60, def: 70, spa: 75, spd: 70, spe: 45 }, abilities: ["Thick Fat","Ice Body","Oblivious"] },
  "walrein": { name: "Walrein", types: ["Ice","Water"], baseStats: { hp: 110, atk: 80, def: 90, spa: 95, spd: 90, spe: 65 }, abilities: ["Thick Fat","Ice Body","Oblivious"] },
  "clamperl": { name: "Clamperl", types: ["Water"], baseStats: { hp: 35, atk: 64, def: 85, spa: 74, spd: 55, spe: 32 }, abilities: ["Shell Armor","Rattled"] },
  "huntail": { name: "Huntail", types: ["Water"], baseStats: { hp: 55, atk: 104, def: 105, spa: 94, spd: 75, spe: 52 }, abilities: ["Swift Swim","Water Veil"] },
  "gorebyss": { name: "Gorebyss", types: ["Water"], baseStats: { hp: 55, atk: 84, def: 105, spa: 114, spd: 75, spe: 52 }, abilities: ["Swift Swim","Hydration"] },
  "relicanth": { name: "Relicanth", types: ["Water","Rock"], baseStats: { hp: 100, atk: 90, def: 130, spa: 45, spd: 65, spe: 55 }, abilities: ["Swift Swim","Rock Head","Sturdy"] },
  "luvdisc": { name: "Luvdisc", types: ["Water"], baseStats: { hp: 43, atk: 30, def: 55, spa: 40, spd: 65, spe: 97 }, abilities: ["Swift Swim","Hydration"] },
  "bagon": { name: "Bagon", types: ["Dragon"], baseStats: { hp: 45, atk: 75, def: 60, spa: 40, spd: 30, spe: 50 }, abilities: ["Rock Head","Sheer Force"] },
  "shelgon": { name: "Shelgon", types: ["Dragon"], baseStats: { hp: 65, atk: 95, def: 100, spa: 60, spd: 50, spe: 50 }, abilities: ["Rock Head","Overcoat"] },
  "beldum": { name: "Beldum", types: ["Steel","Psychic"], baseStats: { hp: 40, atk: 55, def: 80, spa: 35, spd: 60, spe: 30 }, abilities: ["Clear Body","Light Metal"] },
  "metang": { name: "Metang", types: ["Steel","Psychic"], baseStats: { hp: 60, atk: 75, def: 100, spa: 55, spd: 80, spe: 50 }, abilities: ["Clear Body","Light Metal"] },
  "deoxys": { name: "Deoxys", types: ["Psychic"], baseStats: { hp: 50, atk: 150, def: 50, spa: 150, spd: 50, spe: 150 }, abilities: ["Pressure"] },
  "deoxys-attack": { name: "Deoxys-Attack", types: ["Psychic"], baseStats: { hp: 50, atk: 180, def: 20, spa: 180, spd: 20, spe: 150 }, abilities: ["Pressure"] },
  "deoxys-defense": { name: "Deoxys-Defense", types: ["Psychic"], baseStats: { hp: 50, atk: 70, def: 160, spa: 70, spd: 160, spe: 90 }, abilities: ["Pressure"] },
  "deoxys-speed": { name: "Deoxys-Speed", types: ["Psychic"], baseStats: { hp: 50, atk: 95, def: 90, spa: 95, spd: 90, spe: 180 }, abilities: ["Pressure"] },
  "turtwig": { name: "Turtwig", types: ["Grass"], baseStats: { hp: 55, atk: 68, def: 64, spa: 45, spd: 55, spe: 31 }, abilities: ["Overgrow","Shell Armor"] },
  "grotle": { name: "Grotle", types: ["Grass"], baseStats: { hp: 75, atk: 89, def: 85, spa: 55, spd: 65, spe: 36 }, abilities: ["Overgrow","Shell Armor"] },
  "torterra": { name: "Torterra", types: ["Grass","Ground"], baseStats: { hp: 95, atk: 109, def: 105, spa: 75, spd: 85, spe: 56 }, abilities: ["Overgrow","Shell Armor"] },
  "chimchar": { name: "Chimchar", types: ["Fire"], baseStats: { hp: 44, atk: 58, def: 44, spa: 58, spd: 44, spe: 61 }, abilities: ["Blaze","Iron Fist"] },
  "monferno": { name: "Monferno", types: ["Fire","Fighting"], baseStats: { hp: 64, atk: 78, def: 52, spa: 78, spd: 52, spe: 81 }, abilities: ["Blaze","Iron Fist"] },
  "infernape": { name: "Infernape", types: ["Fire","Fighting"], baseStats: { hp: 76, atk: 104, def: 71, spa: 104, spd: 71, spe: 108 }, abilities: ["Blaze","Iron Fist"] },
  "piplup": { name: "Piplup", types: ["Water"], baseStats: { hp: 53, atk: 51, def: 53, spa: 61, spd: 56, spe: 40 }, abilities: ["Torrent","Competitive"] },
  "prinplup": { name: "Prinplup", types: ["Water"], baseStats: { hp: 64, atk: 66, def: 68, spa: 81, spd: 76, spe: 50 }, abilities: ["Torrent","Competitive"] },
  "starly": { name: "Starly", types: ["Normal","Flying"], baseStats: { hp: 40, atk: 55, def: 30, spa: 30, spd: 30, spe: 60 }, abilities: ["Keen Eye","Reckless"] },
  "staravia": { name: "Staravia", types: ["Normal","Flying"], baseStats: { hp: 55, atk: 75, def: 50, spa: 40, spd: 40, spe: 80 }, abilities: ["Intimidate","Reckless"] },
  "staraptor": { name: "Staraptor", types: ["Normal","Flying"], baseStats: { hp: 85, atk: 120, def: 70, spa: 50, spd: 60, spe: 100 }, abilities: ["Intimidate","Reckless"] },
  "bidoof": { name: "Bidoof", types: ["Normal"], baseStats: { hp: 59, atk: 45, def: 40, spa: 35, spd: 40, spe: 31 }, abilities: ["Simple","Unaware","Moody"] },
  "bibarel": { name: "Bibarel", types: ["Normal","Water"], baseStats: { hp: 79, atk: 85, def: 60, spa: 55, spd: 60, spe: 71 }, abilities: ["Simple","Unaware","Moody"] },
  "kricketot": { name: "Kricketot", types: ["Bug"], baseStats: { hp: 37, atk: 25, def: 41, spa: 25, spd: 41, spe: 25 }, abilities: ["Shed Skin","Run Away"] },
  "kricketune": { name: "Kricketune", types: ["Bug"], baseStats: { hp: 77, atk: 85, def: 51, spa: 55, spd: 51, spe: 65 }, abilities: ["Swarm","Technician"] },
  "shinx": { name: "Shinx", types: ["Electric"], baseStats: { hp: 45, atk: 65, def: 34, spa: 40, spd: 34, spe: 45 }, abilities: ["Rivalry","Intimidate","Guts"] },
  "luxio": { name: "Luxio", types: ["Electric"], baseStats: { hp: 60, atk: 85, def: 49, spa: 60, spd: 49, spe: 60 }, abilities: ["Rivalry","Intimidate","Guts"] },
  "luxray": { name: "Luxray", types: ["Electric"], baseStats: { hp: 80, atk: 120, def: 79, spa: 95, spd: 79, spe: 70 }, abilities: ["Rivalry","Intimidate","Guts"] },
  "budew": { name: "Budew", types: ["Grass","Poison"], baseStats: { hp: 40, atk: 30, def: 35, spa: 50, spd: 70, spe: 55 }, abilities: ["Natural Cure","Poison Point","Leaf Guard"] },
  "roserade": { name: "Roserade", types: ["Grass","Poison"], baseStats: { hp: 60, atk: 70, def: 65, spa: 125, spd: 105, spe: 90 }, abilities: ["Natural Cure","Poison Point","Technician"] },
  "cranidos": { name: "Cranidos", types: ["Rock"], baseStats: { hp: 67, atk: 125, def: 40, spa: 30, spd: 30, spe: 58 }, abilities: ["Mold Breaker","Sheer Force"] },
  "rampardos": { name: "Rampardos", types: ["Rock"], baseStats: { hp: 97, atk: 165, def: 60, spa: 65, spd: 50, spe: 58 }, abilities: ["Mold Breaker","Sheer Force"] },
  "shieldon": { name: "Shieldon", types: ["Rock","Steel"], baseStats: { hp: 30, atk: 42, def: 118, spa: 42, spd: 88, spe: 30 }, abilities: ["Sturdy","Soundproof"] },
  "bastiodon": { name: "Bastiodon", types: ["Rock","Steel"], baseStats: { hp: 60, atk: 52, def: 168, spa: 47, spd: 138, spe: 30 }, abilities: ["Sturdy","Soundproof"] },
  "burmy": { name: "Burmy", types: ["Bug"], baseStats: { hp: 40, atk: 29, def: 45, spa: 29, spd: 45, spe: 36 }, abilities: ["Shed Skin","Overcoat"] },
  "wormadam": { name: "Wormadam", types: ["Bug","Grass"], baseStats: { hp: 60, atk: 59, def: 85, spa: 79, spd: 105, spe: 36 }, abilities: ["Anticipation","Overcoat"] },
  "wormadam-sandy": { name: "Wormadam-Sandy", types: ["Bug","Ground"], baseStats: { hp: 60, atk: 79, def: 105, spa: 59, spd: 85, spe: 36 }, abilities: ["Anticipation","Overcoat"] },
  "wormadam-trash": { name: "Wormadam-Trash", types: ["Bug","Steel"], baseStats: { hp: 60, atk: 69, def: 95, spa: 69, spd: 95, spe: 36 }, abilities: ["Anticipation","Overcoat"] },
  "mothim": { name: "Mothim", types: ["Bug","Flying"], baseStats: { hp: 70, atk: 94, def: 50, spa: 94, spd: 50, spe: 66 }, abilities: ["Swarm","Tinted Lens"] },
  "combee": { name: "Combee", types: ["Bug","Flying"], baseStats: { hp: 30, atk: 30, def: 42, spa: 30, spd: 42, spe: 70 }, abilities: ["Honey Gather","Hustle"] },
  "vespiquen": { name: "Vespiquen", types: ["Bug","Flying"], baseStats: { hp: 70, atk: 80, def: 102, spa: 80, spd: 102, spe: 40 }, abilities: ["Pressure","Unnerve"] },
  "pachirisu": { name: "Pachirisu", types: ["Electric"], baseStats: { hp: 60, atk: 45, def: 70, spa: 45, spd: 90, spe: 95 }, abilities: ["Run Away","Pickup","Volt Absorb"] },
  "buizel": { name: "Buizel", types: ["Water"], baseStats: { hp: 55, atk: 65, def: 35, spa: 60, spd: 30, spe: 85 }, abilities: ["Swift Swim","Water Veil"] },
  "floatzel": { name: "Floatzel", types: ["Water"], baseStats: { hp: 85, atk: 105, def: 55, spa: 85, spd: 50, spe: 115 }, abilities: ["Swift Swim","Water Veil"] },
  "cherubi": { name: "Cherubi", types: ["Grass"], baseStats: { hp: 45, atk: 35, def: 45, spa: 62, spd: 53, spe: 35 }, abilities: ["Chlorophyll"] },
  "cherrim": { name: "Cherrim", types: ["Grass"], baseStats: { hp: 70, atk: 60, def: 70, spa: 87, spd: 78, spe: 85 }, abilities: ["Flower Gift"] },
  "cherrim-sunshine": { name: "Cherrim-Sunshine", types: ["Grass"], baseStats: { hp: 70, atk: 60, def: 70, spa: 87, spd: 78, spe: 85 }, abilities: ["Flower Gift"] },
  "shellos": { name: "Shellos", types: ["Water"], baseStats: { hp: 76, atk: 48, def: 48, spa: 57, spd: 62, spe: 34 }, abilities: ["Sticky Hold","Storm Drain","Sand Force"] },
  "ambipom": { name: "Ambipom", types: ["Normal"], baseStats: { hp: 75, atk: 100, def: 66, spa: 60, spd: 66, spe: 115 }, abilities: ["Technician","Pickup","Skill Link"] },
  "drifloon": { name: "Drifloon", types: ["Ghost","Flying"], baseStats: { hp: 90, atk: 50, def: 34, spa: 60, spd: 44, spe: 70 }, abilities: ["Aftermath","Unburden","Flare Boost"] },
  "drifblim": { name: "Drifblim", types: ["Ghost","Flying"], baseStats: { hp: 150, atk: 80, def: 44, spa: 90, spd: 54, spe: 80 }, abilities: ["Aftermath","Unburden","Flare Boost"] },
  "buneary": { name: "Buneary", types: ["Normal"], baseStats: { hp: 55, atk: 66, def: 44, spa: 44, spd: 56, spe: 85 }, abilities: ["Run Away","Klutz","Limber"] },
  "mismagius": { name: "Mismagius", types: ["Ghost"], baseStats: { hp: 60, atk: 60, def: 60, spa: 105, spd: 105, spe: 105 }, abilities: ["Levitate"] },
  "honchkrow": { name: "Honchkrow", types: ["Dark","Flying"], baseStats: { hp: 100, atk: 125, def: 52, spa: 105, spd: 52, spe: 71 }, abilities: ["Insomnia","Super Luck","Moxie"] },
  "glameow": { name: "Glameow", types: ["Normal"], baseStats: { hp: 49, atk: 55, def: 42, spa: 42, spd: 37, spe: 85 }, abilities: ["Limber","Own Tempo","Keen Eye"] },
  "purugly": { name: "Purugly", types: ["Normal"], baseStats: { hp: 71, atk: 82, def: 64, spa: 64, spd: 59, spe: 112 }, abilities: ["Thick Fat","Own Tempo","Defiant"] },
  "chingling": { name: "Chingling", types: ["Psychic"], baseStats: { hp: 45, atk: 30, def: 50, spa: 65, spd: 50, spe: 45 }, abilities: ["Levitate"] },
  "stunky": { name: "Stunky", types: ["Poison","Dark"], baseStats: { hp: 63, atk: 63, def: 47, spa: 41, spd: 41, spe: 74 }, abilities: ["Stench","Aftermath","Keen Eye"] },
  "skuntank": { name: "Skuntank", types: ["Poison","Dark"], baseStats: { hp: 103, atk: 93, def: 67, spa: 71, spd: 61, spe: 84 }, abilities: ["Stench","Aftermath","Keen Eye"] },
  "bronzor": { name: "Bronzor", types: ["Steel","Psychic"], baseStats: { hp: 57, atk: 24, def: 86, spa: 24, spd: 86, spe: 23 }, abilities: ["Levitate","Heatproof","Heavy Metal"] },
  "bonsly": { name: "Bonsly", types: ["Rock"], baseStats: { hp: 50, atk: 80, def: 95, spa: 10, spd: 45, spe: 10 }, abilities: ["Sturdy","Rock Head","Rattled"] },
  "mime-jr": { name: "Mime Jr.", types: ["Psychic","Fairy"], baseStats: { hp: 20, atk: 25, def: 45, spa: 70, spd: 90, spe: 60 }, abilities: ["Soundproof","Filter","Technician"] },
  "happiny": { name: "Happiny", types: ["Normal"], baseStats: { hp: 100, atk: 5, def: 5, spa: 15, spd: 65, spe: 30 }, abilities: ["Natural Cure","Serene Grace","Friend Guard"] },
  "chatot": { name: "Chatot", types: ["Normal","Flying"], baseStats: { hp: 76, atk: 65, def: 45, spa: 92, spd: 42, spe: 91 }, abilities: ["Keen Eye","Tangled Feet","Big Pecks"] },
  "spiritomb": { name: "Spiritomb", types: ["Ghost","Dark"], baseStats: { hp: 50, atk: 92, def: 108, spa: 92, spd: 108, spe: 35 }, abilities: ["Pressure","Infiltrator"] },
  "gible": { name: "Gible", types: ["Dragon","Ground"], baseStats: { hp: 58, atk: 70, def: 45, spa: 40, spd: 45, spe: 42 }, abilities: ["Sand Veil","Rough Skin"] },
  "gabite": { name: "Gabite", types: ["Dragon","Ground"], baseStats: { hp: 68, atk: 90, def: 65, spa: 50, spd: 55, spe: 82 }, abilities: ["Sand Veil","Rough Skin"] },
  "munchlax": { name: "Munchlax", types: ["Normal"], baseStats: { hp: 135, atk: 85, def: 40, spa: 40, spd: 85, spe: 5 }, abilities: ["Pickup","Thick Fat","Gluttony"] },
  "riolu": { name: "Riolu", types: ["Fighting"], baseStats: { hp: 40, atk: 70, def: 40, spa: 35, spd: 40, spe: 60 }, abilities: ["Steadfast","Inner Focus","Prankster"] },
  "hippopotas": { name: "Hippopotas", types: ["Ground"], baseStats: { hp: 68, atk: 72, def: 78, spa: 38, spd: 42, spe: 32 }, abilities: ["Sand Stream","Sand Force"] },
  "hippowdon": { name: "Hippowdon", types: ["Ground"], baseStats: { hp: 108, atk: 112, def: 118, spa: 68, spd: 72, spe: 47 }, abilities: ["Sand Stream","Sand Force"] },
  "skorupi": { name: "Skorupi", types: ["Poison","Bug"], baseStats: { hp: 40, atk: 50, def: 90, spa: 30, spd: 55, spe: 65 }, abilities: ["Battle Armor","Sniper","Keen Eye"] },
  "drapion": { name: "Drapion", types: ["Poison","Dark"], baseStats: { hp: 70, atk: 90, def: 110, spa: 60, spd: 75, spe: 95 }, abilities: ["Battle Armor","Sniper","Keen Eye"] },
  "croagunk": { name: "Croagunk", types: ["Poison","Fighting"], baseStats: { hp: 48, atk: 61, def: 40, spa: 61, spd: 40, spe: 50 }, abilities: ["Anticipation","Dry Skin","Poison Touch"] },
  "carnivine": { name: "Carnivine", types: ["Grass"], baseStats: { hp: 74, atk: 100, def: 72, spa: 90, spd: 72, spe: 46 }, abilities: ["Levitate"] },
  "finneon": { name: "Finneon", types: ["Water"], baseStats: { hp: 49, atk: 49, def: 56, spa: 49, spd: 61, spe: 66 }, abilities: ["Swift Swim","Storm Drain","Water Veil"] },
  "lumineon": { name: "Lumineon", types: ["Water"], baseStats: { hp: 69, atk: 69, def: 76, spa: 69, spd: 86, spe: 91 }, abilities: ["Swift Swim","Storm Drain","Water Veil"] },
  "mantyke": { name: "Mantyke", types: ["Water","Flying"], baseStats: { hp: 45, atk: 20, def: 50, spa: 60, spd: 120, spe: 50 }, abilities: ["Swift Swim","Water Absorb","Water Veil"] },
  "snover": { name: "Snover", types: ["Grass","Ice"], baseStats: { hp: 60, atk: 62, def: 50, spa: 62, spd: 60, spe: 40 }, abilities: ["Snow Warning","Soundproof"] },
  "lickilicky": { name: "Lickilicky", types: ["Normal"], baseStats: { hp: 110, atk: 85, def: 95, spa: 80, spd: 95, spe: 50 }, abilities: ["Own Tempo","Oblivious","Cloud Nine"] },
  "rhyperior": { name: "Rhyperior", types: ["Ground","Rock"], baseStats: { hp: 115, atk: 140, def: 130, spa: 55, spd: 55, spe: 40 }, abilities: ["Lightning Rod","Solid Rock","Reckless"] },
  "tangrowth": { name: "Tangrowth", types: ["Grass"], baseStats: { hp: 100, atk: 100, def: 125, spa: 110, spd: 50, spe: 50 }, abilities: ["Chlorophyll","Leaf Guard","Regenerator"] },
  "electivire": { name: "Electivire", types: ["Electric"], baseStats: { hp: 75, atk: 123, def: 67, spa: 95, spd: 85, spe: 95 }, abilities: ["Motor Drive","Vital Spirit"] },
  "magmortar": { name: "Magmortar", types: ["Fire"], baseStats: { hp: 75, atk: 95, def: 67, spa: 125, spd: 95, spe: 83 }, abilities: ["Flame Body","Vital Spirit"] },
  "yanmega": { name: "Yanmega", types: ["Bug","Flying"], baseStats: { hp: 86, atk: 76, def: 86, spa: 116, spd: 56, spe: 95 }, abilities: ["Speed Boost","Tinted Lens","Frisk"] },
  "leafeon": { name: "Leafeon", types: ["Grass"], baseStats: { hp: 65, atk: 110, def: 130, spa: 60, spd: 65, spe: 95 }, abilities: ["Leaf Guard","Chlorophyll"] },
  "glaceon": { name: "Glaceon", types: ["Ice"], baseStats: { hp: 65, atk: 60, def: 110, spa: 130, spd: 95, spe: 65 }, abilities: ["Snow Cloak","Ice Body"] },
  "gliscor": { name: "Gliscor", types: ["Ground","Flying"], baseStats: { hp: 75, atk: 95, def: 125, spa: 45, spd: 75, spe: 95 }, abilities: ["Hyper Cutter","Sand Veil","Poison Heal"] },
  "probopass": { name: "Probopass", types: ["Rock","Steel"], baseStats: { hp: 60, atk: 55, def: 145, spa: 75, spd: 150, spe: 40 }, abilities: ["Sturdy","Magnet Pull","Sand Force"] },
  "dusknoir": { name: "Dusknoir", types: ["Ghost"], baseStats: { hp: 45, atk: 100, def: 135, spa: 65, spd: 135, spe: 45 }, abilities: ["Pressure","Frisk"] },
  "froslass": { name: "Froslass", types: ["Ice","Ghost"], baseStats: { hp: 70, atk: 80, def: 70, spa: 80, spd: 70, spe: 110 }, abilities: ["Snow Cloak","Cursed Body"] },
  "rotom": { name: "Rotom", types: ["Electric","Ghost"], baseStats: { hp: 50, atk: 50, def: 77, spa: 95, spd: 77, spe: 91 }, abilities: ["Levitate"] },
  "uxie": { name: "Uxie", types: ["Psychic"], baseStats: { hp: 75, atk: 75, def: 130, spa: 75, spd: 130, spe: 95 }, abilities: ["Levitate"] },
  "mesprit": { name: "Mesprit", types: ["Psychic"], baseStats: { hp: 80, atk: 105, def: 105, spa: 105, spd: 105, spe: 80 }, abilities: ["Levitate"] },
  "azelf": { name: "Azelf", types: ["Psychic"], baseStats: { hp: 75, atk: 125, def: 70, spa: 125, spd: 70, spe: 115 }, abilities: ["Levitate"] },
  "phione": { name: "Phione", types: ["Water"], baseStats: { hp: 80, atk: 80, def: 80, spa: 80, spd: 80, spe: 80 }, abilities: ["Hydration"] },
  "manaphy": { name: "Manaphy", types: ["Water"], baseStats: { hp: 100, atk: 100, def: 100, spa: 100, spd: 100, spe: 100 }, abilities: ["Hydration"] },
  "darkrai": { name: "Darkrai", types: ["Dark"], baseStats: { hp: 70, atk: 90, def: 90, spa: 135, spd: 90, spe: 125 }, abilities: ["Bad Dreams"] },
  "shaymin": { name: "Shaymin", types: ["Grass"], baseStats: { hp: 100, atk: 100, def: 100, spa: 100, spd: 100, spe: 100 }, abilities: ["Natural Cure"] },
  "shaymin-sky": { name: "Shaymin-Sky", types: ["Grass","Flying"], baseStats: { hp: 100, atk: 103, def: 75, spa: 120, spd: 75, spe: 127 }, abilities: ["Serene Grace"] },
  "arceus": { name: "Arceus", types: ["Normal"], baseStats: { hp: 120, atk: 120, def: 120, spa: 120, spd: 120, spe: 120 }, abilities: ["Multitype"] },
  "arceus-bug": { name: "Arceus-Bug", types: ["Bug"], baseStats: { hp: 120, atk: 120, def: 120, spa: 120, spd: 120, spe: 120 }, abilities: ["Multitype"] },
  "arceus-dark": { name: "Arceus-Dark", types: ["Dark"], baseStats: { hp: 120, atk: 120, def: 120, spa: 120, spd: 120, spe: 120 }, abilities: ["Multitype"] },
  "arceus-dragon": { name: "Arceus-Dragon", types: ["Dragon"], baseStats: { hp: 120, atk: 120, def: 120, spa: 120, spd: 120, spe: 120 }, abilities: ["Multitype"] },
  "arceus-electric": { name: "Arceus-Electric", types: ["Electric"], baseStats: { hp: 120, atk: 120, def: 120, spa: 120, spd: 120, spe: 120 }, abilities: ["Multitype"] },
  "arceus-fairy": { name: "Arceus-Fairy", types: ["Fairy"], baseStats: { hp: 120, atk: 120, def: 120, spa: 120, spd: 120, spe: 120 }, abilities: ["Multitype"] },
  "arceus-fighting": { name: "Arceus-Fighting", types: ["Fighting"], baseStats: { hp: 120, atk: 120, def: 120, spa: 120, spd: 120, spe: 120 }, abilities: ["Multitype"] },
  "arceus-fire": { name: "Arceus-Fire", types: ["Fire"], baseStats: { hp: 120, atk: 120, def: 120, spa: 120, spd: 120, spe: 120 }, abilities: ["Multitype"] },
  "arceus-flying": { name: "Arceus-Flying", types: ["Flying"], baseStats: { hp: 120, atk: 120, def: 120, spa: 120, spd: 120, spe: 120 }, abilities: ["Multitype"] },
  "arceus-ghost": { name: "Arceus-Ghost", types: ["Ghost"], baseStats: { hp: 120, atk: 120, def: 120, spa: 120, spd: 120, spe: 120 }, abilities: ["Multitype"] },
  "arceus-grass": { name: "Arceus-Grass", types: ["Grass"], baseStats: { hp: 120, atk: 120, def: 120, spa: 120, spd: 120, spe: 120 }, abilities: ["Multitype"] },
  "arceus-ground": { name: "Arceus-Ground", types: ["Ground"], baseStats: { hp: 120, atk: 120, def: 120, spa: 120, spd: 120, spe: 120 }, abilities: ["Multitype"] },
  "arceus-ice": { name: "Arceus-Ice", types: ["Ice"], baseStats: { hp: 120, atk: 120, def: 120, spa: 120, spd: 120, spe: 120 }, abilities: ["Multitype"] },
  "arceus-poison": { name: "Arceus-Poison", types: ["Poison"], baseStats: { hp: 120, atk: 120, def: 120, spa: 120, spd: 120, spe: 120 }, abilities: ["Multitype"] },
  "arceus-psychic": { name: "Arceus-Psychic", types: ["Psychic"], baseStats: { hp: 120, atk: 120, def: 120, spa: 120, spd: 120, spe: 120 }, abilities: ["Multitype"] },
  "arceus-rock": { name: "Arceus-Rock", types: ["Rock"], baseStats: { hp: 120, atk: 120, def: 120, spa: 120, spd: 120, spe: 120 }, abilities: ["Multitype"] },
  "arceus-steel": { name: "Arceus-Steel", types: ["Steel"], baseStats: { hp: 120, atk: 120, def: 120, spa: 120, spd: 120, spe: 120 }, abilities: ["Multitype"] },
  "arceus-water": { name: "Arceus-Water", types: ["Water"], baseStats: { hp: 120, atk: 120, def: 120, spa: 120, spd: 120, spe: 120 }, abilities: ["Multitype"] },
  "victini": { name: "Victini", types: ["Psychic","Fire"], baseStats: { hp: 100, atk: 100, def: 100, spa: 100, spd: 100, spe: 100 }, abilities: ["Victory Star"] },
  "snivy": { name: "Snivy", types: ["Grass"], baseStats: { hp: 45, atk: 45, def: 55, spa: 45, spd: 55, spe: 63 }, abilities: ["Overgrow","Contrary"] },
  "servine": { name: "Servine", types: ["Grass"], baseStats: { hp: 60, atk: 60, def: 75, spa: 60, spd: 75, spe: 83 }, abilities: ["Overgrow","Contrary"] },
  "serperior": { name: "Serperior", types: ["Grass"], baseStats: { hp: 75, atk: 75, def: 95, spa: 75, spd: 95, spe: 113 }, abilities: ["Overgrow","Contrary"] },
  "tepig": { name: "Tepig", types: ["Fire"], baseStats: { hp: 65, atk: 63, def: 45, spa: 45, spd: 45, spe: 45 }, abilities: ["Blaze","Thick Fat"] },
  "pignite": { name: "Pignite", types: ["Fire","Fighting"], baseStats: { hp: 90, atk: 93, def: 55, spa: 70, spd: 55, spe: 55 }, abilities: ["Blaze","Thick Fat"] },
  "emboar": { name: "Emboar", types: ["Fire","Fighting"], baseStats: { hp: 110, atk: 123, def: 65, spa: 100, spd: 65, spe: 65 }, abilities: ["Blaze","Reckless"] },
  "oshawott": { name: "Oshawott", types: ["Water"], baseStats: { hp: 55, atk: 55, def: 45, spa: 63, spd: 45, spe: 45 }, abilities: ["Torrent","Shell Armor"] },
  "dewott": { name: "Dewott", types: ["Water"], baseStats: { hp: 75, atk: 75, def: 60, spa: 83, spd: 60, spe: 60 }, abilities: ["Torrent","Shell Armor"] },
  "samurott": { name: "Samurott", types: ["Water"], baseStats: { hp: 95, atk: 100, def: 85, spa: 108, spd: 70, spe: 70 }, abilities: ["Torrent","Shell Armor"] },
  "samurott-hisui": { name: "Samurott-Hisui", types: ["Water","Dark"], baseStats: { hp: 90, atk: 108, def: 80, spa: 100, spd: 65, spe: 85 }, abilities: ["Torrent","Sharpness"] },
  "patrat": { name: "Patrat", types: ["Normal"], baseStats: { hp: 45, atk: 55, def: 39, spa: 35, spd: 39, spe: 42 }, abilities: ["Run Away","Keen Eye","Analytic"] },
  "watchog": { name: "Watchog", types: ["Normal"], baseStats: { hp: 60, atk: 85, def: 69, spa: 60, spd: 69, spe: 77 }, abilities: ["Illuminate","Keen Eye","Analytic"] },
  "lillipup": { name: "Lillipup", types: ["Normal"], baseStats: { hp: 45, atk: 60, def: 45, spa: 25, spd: 45, spe: 55 }, abilities: ["Vital Spirit","Pickup","Run Away"] },
  "herdier": { name: "Herdier", types: ["Normal"], baseStats: { hp: 65, atk: 80, def: 65, spa: 35, spd: 65, spe: 60 }, abilities: ["Intimidate","Sand Rush","Scrappy"] },
  "stoutland": { name: "Stoutland", types: ["Normal"], baseStats: { hp: 85, atk: 110, def: 90, spa: 45, spd: 90, spe: 80 }, abilities: ["Intimidate","Sand Rush","Scrappy"] },
  "purrloin": { name: "Purrloin", types: ["Dark"], baseStats: { hp: 41, atk: 50, def: 37, spa: 50, spd: 37, spe: 66 }, abilities: ["Limber","Unburden","Prankster"] },
  "liepard": { name: "Liepard", types: ["Dark"], baseStats: { hp: 64, atk: 88, def: 50, spa: 88, spd: 50, spe: 106 }, abilities: ["Limber","Unburden","Prankster"] },
  "pansage": { name: "Pansage", types: ["Grass"], baseStats: { hp: 50, atk: 53, def: 48, spa: 53, spd: 48, spe: 64 }, abilities: ["Gluttony","Overgrow"] },
  "simisage": { name: "Simisage", types: ["Grass"], baseStats: { hp: 75, atk: 98, def: 63, spa: 98, spd: 63, spe: 101 }, abilities: ["Gluttony","Overgrow"] },
  "pansear": { name: "Pansear", types: ["Fire"], baseStats: { hp: 50, atk: 53, def: 48, spa: 53, spd: 48, spe: 64 }, abilities: ["Gluttony","Blaze"] },
  "simisear": { name: "Simisear", types: ["Fire"], baseStats: { hp: 75, atk: 98, def: 63, spa: 98, spd: 63, spe: 101 }, abilities: ["Gluttony","Blaze"] },
  "panpour": { name: "Panpour", types: ["Water"], baseStats: { hp: 50, atk: 53, def: 48, spa: 53, spd: 48, spe: 64 }, abilities: ["Gluttony","Torrent"] },
  "simipour": { name: "Simipour", types: ["Water"], baseStats: { hp: 75, atk: 98, def: 63, spa: 98, spd: 63, spe: 101 }, abilities: ["Gluttony","Torrent"] },
  "munna": { name: "Munna", types: ["Psychic"], baseStats: { hp: 76, atk: 25, def: 45, spa: 67, spd: 55, spe: 24 }, abilities: ["Forewarn","Synchronize","Telepathy"] },
  "musharna": { name: "Musharna", types: ["Psychic"], baseStats: { hp: 116, atk: 55, def: 85, spa: 107, spd: 95, spe: 29 }, abilities: ["Forewarn","Synchronize","Telepathy"] },
  "pidove": { name: "Pidove", types: ["Normal","Flying"], baseStats: { hp: 50, atk: 55, def: 50, spa: 36, spd: 30, spe: 43 }, abilities: ["Big Pecks","Super Luck","Rivalry"] },
  "tranquill": { name: "Tranquill", types: ["Normal","Flying"], baseStats: { hp: 62, atk: 77, def: 62, spa: 50, spd: 42, spe: 65 }, abilities: ["Big Pecks","Super Luck","Rivalry"] },
  "unfezant": { name: "Unfezant", types: ["Normal","Flying"], baseStats: { hp: 80, atk: 115, def: 80, spa: 65, spd: 55, spe: 93 }, abilities: ["Big Pecks","Super Luck","Rivalry"] },
  "blitzle": { name: "Blitzle", types: ["Electric"], baseStats: { hp: 45, atk: 60, def: 32, spa: 50, spd: 32, spe: 76 }, abilities: ["Lightning Rod","Motor Drive","Sap Sipper"] },
  "zebstrika": { name: "Zebstrika", types: ["Electric"], baseStats: { hp: 75, atk: 100, def: 63, spa: 80, spd: 63, spe: 116 }, abilities: ["Lightning Rod","Motor Drive","Sap Sipper"] },
  "roggenrola": { name: "Roggenrola", types: ["Rock"], baseStats: { hp: 55, atk: 75, def: 85, spa: 25, spd: 25, spe: 15 }, abilities: ["Sturdy","Weak Armor","Sand Force"] },
  "boldore": { name: "Boldore", types: ["Rock"], baseStats: { hp: 70, atk: 105, def: 105, spa: 50, spd: 40, spe: 20 }, abilities: ["Sturdy","Weak Armor","Sand Force"] },
  "gigalith": { name: "Gigalith", types: ["Rock"], baseStats: { hp: 85, atk: 135, def: 130, spa: 60, spd: 80, spe: 25 }, abilities: ["Sturdy","Sand Stream","Sand Force"] },
  "woobat": { name: "Woobat", types: ["Psychic","Flying"], baseStats: { hp: 65, atk: 45, def: 43, spa: 55, spd: 43, spe: 72 }, abilities: ["Unaware","Klutz","Simple"] },
  "swoobat": { name: "Swoobat", types: ["Psychic","Flying"], baseStats: { hp: 67, atk: 57, def: 55, spa: 77, spd: 55, spe: 114 }, abilities: ["Unaware","Klutz","Simple"] },
  "drilbur": { name: "Drilbur", types: ["Ground"], baseStats: { hp: 60, atk: 85, def: 40, spa: 30, spd: 45, spe: 68 }, abilities: ["Sand Rush","Sand Force","Mold Breaker"] },
  "timburr": { name: "Timburr", types: ["Fighting"], baseStats: { hp: 75, atk: 80, def: 55, spa: 25, spd: 35, spe: 35 }, abilities: ["Guts","Sheer Force","Iron Fist"] },
  "gurdurr": { name: "Gurdurr", types: ["Fighting"], baseStats: { hp: 85, atk: 105, def: 85, spa: 40, spd: 50, spe: 40 }, abilities: ["Guts","Sheer Force","Iron Fist"] },
  "tympole": { name: "Tympole", types: ["Water"], baseStats: { hp: 50, atk: 50, def: 40, spa: 50, spd: 40, spe: 64 }, abilities: ["Swift Swim","Hydration","Water Absorb"] },
  "palpitoad": { name: "Palpitoad", types: ["Water","Ground"], baseStats: { hp: 75, atk: 65, def: 55, spa: 65, spd: 55, spe: 69 }, abilities: ["Swift Swim","Hydration","Water Absorb"] },
  "seismitoad": { name: "Seismitoad", types: ["Water","Ground"], baseStats: { hp: 105, atk: 95, def: 75, spa: 85, spd: 75, spe: 74 }, abilities: ["Swift Swim","Poison Touch","Water Absorb"] },
  "throh": { name: "Throh", types: ["Fighting"], baseStats: { hp: 120, atk: 100, def: 85, spa: 30, spd: 85, spe: 45 }, abilities: ["Guts","Inner Focus","Mold Breaker"] },
  "sawk": { name: "Sawk", types: ["Fighting"], baseStats: { hp: 75, atk: 125, def: 75, spa: 30, spd: 75, spe: 85 }, abilities: ["Sturdy","Inner Focus","Mold Breaker"] },
  "sewaddle": { name: "Sewaddle", types: ["Bug","Grass"], baseStats: { hp: 45, atk: 53, def: 70, spa: 40, spd: 60, spe: 42 }, abilities: ["Swarm","Chlorophyll","Overcoat"] },
  "swadloon": { name: "Swadloon", types: ["Bug","Grass"], baseStats: { hp: 55, atk: 63, def: 90, spa: 50, spd: 80, spe: 42 }, abilities: ["Leaf Guard","Chlorophyll","Overcoat"] },
  "leavanny": { name: "Leavanny", types: ["Bug","Grass"], baseStats: { hp: 75, atk: 103, def: 80, spa: 70, spd: 80, spe: 92 }, abilities: ["Swarm","Chlorophyll","Overcoat"] },
  "venipede": { name: "Venipede", types: ["Bug","Poison"], baseStats: { hp: 30, atk: 45, def: 59, spa: 30, spd: 39, spe: 57 }, abilities: ["Poison Point","Swarm","Speed Boost"] },
  "whirlipede": { name: "Whirlipede", types: ["Bug","Poison"], baseStats: { hp: 40, atk: 55, def: 99, spa: 40, spd: 79, spe: 47 }, abilities: ["Poison Point","Swarm","Speed Boost"] },
  "scolipede": { name: "Scolipede", types: ["Bug","Poison"], baseStats: { hp: 60, atk: 100, def: 89, spa: 55, spd: 69, spe: 112 }, abilities: ["Poison Point","Swarm","Speed Boost"] },
  "cottonee": { name: "Cottonee", types: ["Grass","Fairy"], baseStats: { hp: 40, atk: 27, def: 60, spa: 37, spd: 50, spe: 66 }, abilities: ["Prankster","Infiltrator","Chlorophyll"] },
  "petilil": { name: "Petilil", types: ["Grass"], baseStats: { hp: 45, atk: 35, def: 50, spa: 70, spd: 50, spe: 30 }, abilities: ["Chlorophyll","Own Tempo","Leaf Guard"] },
  "lilligant": { name: "Lilligant", types: ["Grass"], baseStats: { hp: 70, atk: 60, def: 75, spa: 110, spd: 75, spe: 90 }, abilities: ["Chlorophyll","Own Tempo","Leaf Guard"] },
  "basculin": { name: "Basculin", types: ["Water"], baseStats: { hp: 70, atk: 92, def: 65, spa: 80, spd: 55, spe: 98 }, abilities: ["Reckless","Adaptability","Mold Breaker"] },
  "basculin-blue-striped": { name: "Basculin-Blue-Striped", types: ["Water"], baseStats: { hp: 70, atk: 92, def: 65, spa: 80, spd: 55, spe: 98 }, abilities: ["Rock Head","Adaptability","Mold Breaker"] },
  "basculin-white-striped": { name: "Basculin-White-Striped", types: ["Water"], baseStats: { hp: 70, atk: 92, def: 65, spa: 80, spd: 55, spe: 98 }, abilities: ["Rattled","Adaptability","Mold Breaker"] },
  "sandile": { name: "Sandile", types: ["Ground","Dark"], baseStats: { hp: 50, atk: 72, def: 35, spa: 35, spd: 35, spe: 65 }, abilities: ["Intimidate","Moxie","Anger Point"] },
  "krokorok": { name: "Krokorok", types: ["Ground","Dark"], baseStats: { hp: 60, atk: 82, def: 45, spa: 45, spd: 45, spe: 74 }, abilities: ["Intimidate","Moxie","Anger Point"] },
  "krookodile": { name: "Krookodile", types: ["Ground","Dark"], baseStats: { hp: 95, atk: 117, def: 80, spa: 65, spd: 70, spe: 92 }, abilities: ["Intimidate","Moxie","Anger Point"] },
  "darumaka": { name: "Darumaka", types: ["Fire"], baseStats: { hp: 70, atk: 90, def: 45, spa: 15, spd: 45, spe: 50 }, abilities: ["Hustle","Inner Focus"] },
  "darumaka-galar": { name: "Darumaka-Galar", types: ["Ice"], baseStats: { hp: 70, atk: 90, def: 45, spa: 15, spd: 45, spe: 50 }, abilities: ["Hustle","Inner Focus"] },
  "darmanitan": { name: "Darmanitan", types: ["Fire"], baseStats: { hp: 105, atk: 140, def: 55, spa: 30, spd: 55, spe: 95 }, abilities: ["Sheer Force","Zen Mode"] },
  "darmanitan-zen": { name: "Darmanitan-Zen", types: ["Fire","Psychic"], baseStats: { hp: 105, atk: 30, def: 105, spa: 140, spd: 105, spe: 55 }, abilities: ["Zen Mode"] },
  "darmanitan-galar": { name: "Darmanitan-Galar", types: ["Ice"], baseStats: { hp: 105, atk: 140, def: 55, spa: 30, spd: 55, spe: 95 }, abilities: ["Gorilla Tactics","Zen Mode"] },
  "darmanitan-galar-zen": { name: "Darmanitan-Galar-Zen", types: ["Ice","Fire"], baseStats: { hp: 105, atk: 160, def: 55, spa: 30, spd: 55, spe: 135 }, abilities: ["Zen Mode"] },
  "maractus": { name: "Maractus", types: ["Grass"], baseStats: { hp: 75, atk: 86, def: 67, spa: 106, spd: 67, spe: 60 }, abilities: ["Water Absorb","Chlorophyll","Storm Drain"] },
  "dwebble": { name: "Dwebble", types: ["Bug","Rock"], baseStats: { hp: 50, atk: 65, def: 85, spa: 35, spd: 35, spe: 55 }, abilities: ["Sturdy","Shell Armor","Weak Armor"] },
  "crustle": { name: "Crustle", types: ["Bug","Rock"], baseStats: { hp: 70, atk: 105, def: 125, spa: 65, spd: 75, spe: 45 }, abilities: ["Sturdy","Shell Armor","Weak Armor"] },
  "scraggy": { name: "Scraggy", types: ["Dark","Fighting"], baseStats: { hp: 50, atk: 75, def: 70, spa: 35, spd: 70, spe: 48 }, abilities: ["Shed Skin","Moxie","Intimidate"] },
  "scrafty": { name: "Scrafty", types: ["Dark","Fighting"], baseStats: { hp: 65, atk: 90, def: 115, spa: 45, spd: 115, spe: 58 }, abilities: ["Shed Skin","Moxie","Intimidate"] },
  "sigilyph": { name: "Sigilyph", types: ["Psychic","Flying"], baseStats: { hp: 72, atk: 58, def: 80, spa: 103, spd: 80, spe: 97 }, abilities: ["Wonder Skin","Magic Guard","Tinted Lens"] },
  "yamask": { name: "Yamask", types: ["Ghost"], baseStats: { hp: 38, atk: 30, def: 85, spa: 55, spd: 65, spe: 30 }, abilities: ["Mummy"] },
  "yamask-galar": { name: "Yamask-Galar", types: ["Ground","Ghost"], baseStats: { hp: 38, atk: 55, def: 85, spa: 30, spd: 65, spe: 30 }, abilities: ["Wandering Spirit"] },
  "cofagrigus": { name: "Cofagrigus", types: ["Ghost"], baseStats: { hp: 58, atk: 50, def: 145, spa: 95, spd: 105, spe: 30 }, abilities: ["Mummy"] },
  "tirtouga": { name: "Tirtouga", types: ["Water","Rock"], baseStats: { hp: 54, atk: 78, def: 103, spa: 53, spd: 45, spe: 22 }, abilities: ["Solid Rock","Sturdy","Swift Swim"] },
  "carracosta": { name: "Carracosta", types: ["Water","Rock"], baseStats: { hp: 74, atk: 108, def: 133, spa: 83, spd: 65, spe: 32 }, abilities: ["Solid Rock","Sturdy","Swift Swim"] },
  "archen": { name: "Archen", types: ["Rock","Flying"], baseStats: { hp: 55, atk: 112, def: 45, spa: 74, spd: 45, spe: 70 }, abilities: ["Defeatist"] },
  "archeops": { name: "Archeops", types: ["Rock","Flying"], baseStats: { hp: 75, atk: 140, def: 65, spa: 112, spd: 65, spe: 110 }, abilities: ["Defeatist"] },
  "trubbish": { name: "Trubbish", types: ["Poison"], baseStats: { hp: 50, atk: 50, def: 62, spa: 40, spd: 62, spe: 65 }, abilities: ["Stench","Sticky Hold","Aftermath"] },
  "garbodor": { name: "Garbodor", types: ["Poison"], baseStats: { hp: 80, atk: 95, def: 82, spa: 60, spd: 82, spe: 75 }, abilities: ["Stench","Weak Armor","Aftermath"] },
  "garbodor-gmax": { name: "Garbodor-Gmax", types: ["Poison"], baseStats: { hp: 80, atk: 95, def: 82, spa: 60, spd: 82, spe: 75 }, abilities: ["Stench","Weak Armor","Aftermath"] },
  "zorua": { name: "Zorua", types: ["Dark"], baseStats: { hp: 40, atk: 65, def: 40, spa: 80, spd: 40, spe: 65 }, abilities: ["Illusion"] },
  "zorua-hisui": { name: "Zorua-Hisui", types: ["Normal","Ghost"], baseStats: { hp: 35, atk: 60, def: 40, spa: 85, spd: 40, spe: 70 }, abilities: ["Illusion"] },
  "zoroark": { name: "Zoroark", types: ["Dark"], baseStats: { hp: 60, atk: 105, def: 60, spa: 120, spd: 60, spe: 105 }, abilities: ["Illusion"] },
  "minccino": { name: "Minccino", types: ["Normal"], baseStats: { hp: 55, atk: 50, def: 40, spa: 40, spd: 40, spe: 75 }, abilities: ["Cute Charm","Technician","Skill Link"] },
  "cinccino": { name: "Cinccino", types: ["Normal"], baseStats: { hp: 75, atk: 95, def: 60, spa: 65, spd: 60, spe: 115 }, abilities: ["Cute Charm","Technician","Skill Link"] },
  "gothita": { name: "Gothita", types: ["Psychic"], baseStats: { hp: 45, atk: 30, def: 50, spa: 55, spd: 65, spe: 45 }, abilities: ["Frisk","Competitive","Shadow Tag"] },
  "gothorita": { name: "Gothorita", types: ["Psychic"], baseStats: { hp: 60, atk: 45, def: 70, spa: 75, spd: 85, spe: 55 }, abilities: ["Frisk","Competitive","Shadow Tag"] },
  "solosis": { name: "Solosis", types: ["Psychic"], baseStats: { hp: 45, atk: 30, def: 40, spa: 105, spd: 50, spe: 20 }, abilities: ["Overcoat","Magic Guard","Regenerator"] },
  "duosion": { name: "Duosion", types: ["Psychic"], baseStats: { hp: 65, atk: 40, def: 50, spa: 125, spd: 60, spe: 30 }, abilities: ["Overcoat","Magic Guard","Regenerator"] },
  "reuniclus": { name: "Reuniclus", types: ["Psychic"], baseStats: { hp: 110, atk: 65, def: 75, spa: 125, spd: 85, spe: 30 }, abilities: ["Overcoat","Magic Guard","Regenerator"] },
  "ducklett": { name: "Ducklett", types: ["Water","Flying"], baseStats: { hp: 62, atk: 44, def: 50, spa: 44, spd: 50, spe: 55 }, abilities: ["Keen Eye","Big Pecks","Hydration"] },
  "swanna": { name: "Swanna", types: ["Water","Flying"], baseStats: { hp: 75, atk: 87, def: 63, spa: 87, spd: 63, spe: 98 }, abilities: ["Keen Eye","Big Pecks","Hydration"] },
  "vanillite": { name: "Vanillite", types: ["Ice"], baseStats: { hp: 36, atk: 50, def: 50, spa: 65, spd: 60, spe: 44 }, abilities: ["Ice Body","Snow Cloak","Weak Armor"] },
  "vanillish": { name: "Vanillish", types: ["Ice"], baseStats: { hp: 51, atk: 65, def: 65, spa: 80, spd: 75, spe: 59 }, abilities: ["Ice Body","Snow Cloak","Weak Armor"] },
  "deerling": { name: "Deerling", types: ["Normal","Grass"], baseStats: { hp: 60, atk: 60, def: 50, spa: 40, spd: 50, spe: 75 }, abilities: ["Chlorophyll","Sap Sipper","Serene Grace"] },
  "sawsbuck": { name: "Sawsbuck", types: ["Normal","Grass"], baseStats: { hp: 80, atk: 100, def: 70, spa: 60, spd: 70, spe: 95 }, abilities: ["Chlorophyll","Sap Sipper","Serene Grace"] },
  "emolga": { name: "Emolga", types: ["Electric","Flying"], baseStats: { hp: 55, atk: 75, def: 60, spa: 75, spd: 60, spe: 103 }, abilities: ["Static","Motor Drive"] },
  "karrablast": { name: "Karrablast", types: ["Bug"], baseStats: { hp: 50, atk: 75, def: 45, spa: 40, spd: 45, spe: 60 }, abilities: ["Swarm","Shed Skin","No Guard"] },
  "escavalier": { name: "Escavalier", types: ["Bug","Steel"], baseStats: { hp: 70, atk: 135, def: 105, spa: 60, spd: 105, spe: 20 }, abilities: ["Swarm","Shell Armor","Overcoat"] },
  "foongus": { name: "Foongus", types: ["Grass","Poison"], baseStats: { hp: 69, atk: 55, def: 45, spa: 55, spd: 55, spe: 15 }, abilities: ["Effect Spore","Regenerator"] },
  "frillish": { name: "Frillish", types: ["Water","Ghost"], baseStats: { hp: 55, atk: 40, def: 50, spa: 65, spd: 85, spe: 40 }, abilities: ["Water Absorb","Cursed Body","Damp"] },
  "alomomola": { name: "Alomomola", types: ["Water"], baseStats: { hp: 165, atk: 75, def: 80, spa: 40, spd: 45, spe: 65 }, abilities: ["Healer","Hydration","Regenerator"] },
  "joltik": { name: "Joltik", types: ["Bug","Electric"], baseStats: { hp: 50, atk: 47, def: 50, spa: 57, spd: 50, spe: 65 }, abilities: ["Compound Eyes","Unnerve","Swarm"] },
  "ferroseed": { name: "Ferroseed", types: ["Grass","Steel"], baseStats: { hp: 44, atk: 50, def: 91, spa: 24, spd: 86, spe: 10 }, abilities: ["Iron Barbs"] },
  "klink": { name: "Klink", types: ["Steel"], baseStats: { hp: 40, atk: 55, def: 70, spa: 45, spd: 60, spe: 30 }, abilities: ["Plus","Minus","Clear Body"] },
  "klang": { name: "Klang", types: ["Steel"], baseStats: { hp: 60, atk: 80, def: 95, spa: 70, spd: 85, spe: 50 }, abilities: ["Plus","Minus","Clear Body"] },
  "klinklang": { name: "Klinklang", types: ["Steel"], baseStats: { hp: 60, atk: 100, def: 115, spa: 70, spd: 85, spe: 90 }, abilities: ["Plus","Minus","Clear Body"] },
  "tynamo": { name: "Tynamo", types: ["Electric"], baseStats: { hp: 35, atk: 55, def: 40, spa: 45, spd: 40, spe: 60 }, abilities: ["Levitate"] },
  "eelektrik": { name: "Eelektrik", types: ["Electric"], baseStats: { hp: 65, atk: 85, def: 70, spa: 75, spd: 70, spe: 40 }, abilities: ["Levitate"] },
  "eelektross": { name: "Eelektross", types: ["Electric"], baseStats: { hp: 85, atk: 115, def: 80, spa: 105, spd: 80, spe: 50 }, abilities: ["Levitate"] },
  "elgyem": { name: "Elgyem", types: ["Psychic"], baseStats: { hp: 55, atk: 55, def: 55, spa: 85, spd: 55, spe: 30 }, abilities: ["Telepathy","Synchronize","Analytic"] },
  "beheeyem": { name: "Beheeyem", types: ["Psychic"], baseStats: { hp: 75, atk: 75, def: 75, spa: 125, spd: 95, spe: 40 }, abilities: ["Telepathy","Synchronize","Analytic"] },
  "litwick": { name: "Litwick", types: ["Ghost","Fire"], baseStats: { hp: 50, atk: 30, def: 55, spa: 65, spd: 55, spe: 20 }, abilities: ["Flash Fire","Flame Body","Infiltrator"] },
  "lampent": { name: "Lampent", types: ["Ghost","Fire"], baseStats: { hp: 60, atk: 40, def: 60, spa: 95, spd: 60, spe: 55 }, abilities: ["Flash Fire","Flame Body","Infiltrator"] },
  "axew": { name: "Axew", types: ["Dragon"], baseStats: { hp: 46, atk: 87, def: 60, spa: 30, spd: 40, spe: 57 }, abilities: ["Rivalry","Mold Breaker","Unnerve"] },
  "fraxure": { name: "Fraxure", types: ["Dragon"], baseStats: { hp: 66, atk: 117, def: 70, spa: 40, spd: 50, spe: 67 }, abilities: ["Rivalry","Mold Breaker","Unnerve"] },
  "haxorus": { name: "Haxorus", types: ["Dragon"], baseStats: { hp: 76, atk: 147, def: 90, spa: 60, spd: 70, spe: 97 }, abilities: ["Rivalry","Mold Breaker","Unnerve"] },
  "cubchoo": { name: "Cubchoo", types: ["Ice"], baseStats: { hp: 55, atk: 70, def: 40, spa: 60, spd: 40, spe: 40 }, abilities: ["Snow Cloak","Slush Rush","Rattled"] },
  "beartic": { name: "Beartic", types: ["Ice"], baseStats: { hp: 95, atk: 130, def: 80, spa: 70, spd: 80, spe: 50 }, abilities: ["Snow Cloak","Slush Rush","Swift Swim"] },
  "cryogonal": { name: "Cryogonal", types: ["Ice"], baseStats: { hp: 80, atk: 50, def: 50, spa: 95, spd: 135, spe: 105 }, abilities: ["Levitate"] },
  "shelmet": { name: "Shelmet", types: ["Bug"], baseStats: { hp: 50, atk: 40, def: 85, spa: 40, spd: 65, spe: 25 }, abilities: ["Hydration","Shell Armor","Overcoat"] },
  "accelgor": { name: "Accelgor", types: ["Bug"], baseStats: { hp: 80, atk: 70, def: 40, spa: 100, spd: 60, spe: 145 }, abilities: ["Hydration","Sticky Hold","Unburden"] },
  "stunfisk": { name: "Stunfisk", types: ["Ground","Electric"], baseStats: { hp: 109, atk: 66, def: 84, spa: 81, spd: 99, spe: 32 }, abilities: ["Static","Limber","Sand Veil"] },
  "stunfisk-galar": { name: "Stunfisk-Galar", types: ["Ground","Steel"], baseStats: { hp: 109, atk: 81, def: 99, spa: 66, spd: 84, spe: 32 }, abilities: ["Mimicry"] },
  "mienfoo": { name: "Mienfoo", types: ["Fighting"], baseStats: { hp: 45, atk: 85, def: 50, spa: 55, spd: 50, spe: 65 }, abilities: ["Inner Focus","Regenerator","Reckless"] },
  "druddigon": { name: "Druddigon", types: ["Dragon"], baseStats: { hp: 77, atk: 120, def: 90, spa: 60, spd: 90, spe: 48 }, abilities: ["Rough Skin","Sheer Force","Mold Breaker"] },
  "golett": { name: "Golett", types: ["Ground","Ghost"], baseStats: { hp: 59, atk: 74, def: 50, spa: 35, spd: 50, spe: 35 }, abilities: ["Iron Fist","Klutz","No Guard"] },
  "golurk": { name: "Golurk", types: ["Ground","Ghost"], baseStats: { hp: 89, atk: 124, def: 80, spa: 55, spd: 80, spe: 55 }, abilities: ["Iron Fist","Klutz","No Guard"] },
  "pawniard": { name: "Pawniard", types: ["Dark","Steel"], baseStats: { hp: 45, atk: 85, def: 70, spa: 40, spd: 40, spe: 60 }, abilities: ["Defiant","Inner Focus","Pressure"] },
  "bisharp": { name: "Bisharp", types: ["Dark","Steel"], baseStats: { hp: 65, atk: 125, def: 100, spa: 60, spd: 70, spe: 70 }, abilities: ["Defiant","Inner Focus","Pressure"] },
  "bouffalant": { name: "Bouffalant", types: ["Normal"], baseStats: { hp: 95, atk: 110, def: 95, spa: 40, spd: 95, spe: 55 }, abilities: ["Reckless","Sap Sipper","Soundproof"] },
  "rufflet": { name: "Rufflet", types: ["Normal","Flying"], baseStats: { hp: 70, atk: 83, def: 50, spa: 37, spd: 50, spe: 60 }, abilities: ["Keen Eye","Sheer Force","Hustle"] },
  "braviary": { name: "Braviary", types: ["Normal","Flying"], baseStats: { hp: 100, atk: 123, def: 75, spa: 57, spd: 75, spe: 80 }, abilities: ["Keen Eye","Sheer Force","Defiant"] },
  "braviary-hisui": { name: "Braviary-Hisui", types: ["Psychic","Flying"], baseStats: { hp: 110, atk: 83, def: 70, spa: 112, spd: 70, spe: 65 }, abilities: ["Keen Eye","Sheer Force","Tinted Lens"] },
  "vullaby": { name: "Vullaby", types: ["Dark","Flying"], baseStats: { hp: 70, atk: 55, def: 75, spa: 45, spd: 65, spe: 60 }, abilities: ["Big Pecks","Overcoat","Weak Armor"] },
  "mandibuzz": { name: "Mandibuzz", types: ["Dark","Flying"], baseStats: { hp: 110, atk: 65, def: 105, spa: 55, spd: 95, spe: 80 }, abilities: ["Big Pecks","Overcoat","Weak Armor"] },
  "heatmor": { name: "Heatmor", types: ["Fire"], baseStats: { hp: 85, atk: 97, def: 66, spa: 105, spd: 66, spe: 65 }, abilities: ["Gluttony","Flash Fire","White Smoke"] },
  "durant": { name: "Durant", types: ["Bug","Steel"], baseStats: { hp: 58, atk: 109, def: 112, spa: 48, spd: 48, spe: 109 }, abilities: ["Swarm","Hustle","Truant"] },
  "deino": { name: "Deino", types: ["Dark","Dragon"], baseStats: { hp: 52, atk: 65, def: 50, spa: 45, spd: 50, spe: 38 }, abilities: ["Hustle"] },
  "zweilous": { name: "Zweilous", types: ["Dark","Dragon"], baseStats: { hp: 72, atk: 85, def: 70, spa: 65, spd: 70, spe: 58 }, abilities: ["Hustle"] },
  "larvesta": { name: "Larvesta", types: ["Bug","Fire"], baseStats: { hp: 55, atk: 85, def: 55, spa: 50, spd: 55, spe: 60 }, abilities: ["Flame Body","Swarm"] },
  "keldeo-resolute": { name: "Keldeo-Resolute", types: ["Water","Fighting"], baseStats: { hp: 91, atk: 72, def: 90, spa: 129, spd: 90, spe: 108 }, abilities: ["Justified"] },
  "meloetta": { name: "Meloetta", types: ["Normal","Psychic"], baseStats: { hp: 100, atk: 77, def: 77, spa: 128, spd: 128, spe: 90 }, abilities: ["Serene Grace"] },
  "meloetta-pirouette": { name: "Meloetta-Pirouette", types: ["Normal","Fighting"], baseStats: { hp: 100, atk: 128, def: 90, spa: 77, spd: 77, spe: 128 }, abilities: ["Serene Grace"] },
  "genesect-douse": { name: "Genesect-Douse", types: ["Bug","Steel"], baseStats: { hp: 71, atk: 120, def: 95, spa: 120, spd: 95, spe: 99 }, abilities: ["Download"] },
  "genesect-shock": { name: "Genesect-Shock", types: ["Bug","Steel"], baseStats: { hp: 71, atk: 120, def: 95, spa: 120, spd: 95, spe: 99 }, abilities: ["Download"] },
  "genesect-burn": { name: "Genesect-Burn", types: ["Bug","Steel"], baseStats: { hp: 71, atk: 120, def: 95, spa: 120, spd: 95, spe: 99 }, abilities: ["Download"] },
  "genesect-chill": { name: "Genesect-Chill", types: ["Bug","Steel"], baseStats: { hp: 71, atk: 120, def: 95, spa: 120, spd: 95, spe: 99 }, abilities: ["Download"] },
  "chespin": { name: "Chespin", types: ["Grass"], baseStats: { hp: 56, atk: 61, def: 65, spa: 48, spd: 45, spe: 38 }, abilities: ["Overgrow","Bulletproof"] },
  "quilladin": { name: "Quilladin", types: ["Grass"], baseStats: { hp: 61, atk: 78, def: 95, spa: 56, spd: 58, spe: 57 }, abilities: ["Overgrow","Bulletproof"] },
  "chesnaught": { name: "Chesnaught", types: ["Grass","Fighting"], baseStats: { hp: 88, atk: 107, def: 122, spa: 74, spd: 75, spe: 64 }, abilities: ["Overgrow","Bulletproof"] },
  "fennekin": { name: "Fennekin", types: ["Fire"], baseStats: { hp: 40, atk: 45, def: 40, spa: 62, spd: 60, spe: 60 }, abilities: ["Blaze","Magician"] },
  "braixen": { name: "Braixen", types: ["Fire"], baseStats: { hp: 59, atk: 59, def: 58, spa: 90, spd: 70, spe: 73 }, abilities: ["Blaze","Magician"] },
  "delphox": { name: "Delphox", types: ["Fire","Psychic"], baseStats: { hp: 75, atk: 69, def: 72, spa: 114, spd: 100, spe: 104 }, abilities: ["Blaze","Magician"] },
  "froakie": { name: "Froakie", types: ["Water"], baseStats: { hp: 41, atk: 56, def: 40, spa: 62, spd: 44, spe: 71 }, abilities: ["Torrent","Protean"] },
  "frogadier": { name: "Frogadier", types: ["Water"], baseStats: { hp: 54, atk: 63, def: 52, spa: 83, spd: 56, spe: 97 }, abilities: ["Torrent","Protean"] },
  "greninja": { name: "Greninja", types: ["Water","Dark"], baseStats: { hp: 72, atk: 95, def: 67, spa: 103, spd: 71, spe: 122 }, abilities: ["Torrent","Protean","Battle Bond"] },
  "greninja-bond": { name: "Greninja-Bond", types: ["Water","Dark"], baseStats: { hp: 72, atk: 95, def: 67, spa: 103, spd: 71, spe: 122 }, abilities: ["Battle Bond"] },
  "greninja-ash": { name: "Greninja-Ash", types: ["Water","Dark"], baseStats: { hp: 72, atk: 145, def: 67, spa: 153, spd: 71, spe: 132 }, abilities: ["Battle Bond"] },
  "bunnelby": { name: "Bunnelby", types: ["Normal"], baseStats: { hp: 38, atk: 36, def: 38, spa: 32, spd: 36, spe: 57 }, abilities: ["Pickup","Cheek Pouch","Huge Power"] },
  "diggersby": { name: "Diggersby", types: ["Normal","Ground"], baseStats: { hp: 85, atk: 56, def: 77, spa: 50, spd: 77, spe: 78 }, abilities: ["Pickup","Cheek Pouch","Huge Power"] },
  "fletchling": { name: "Fletchling", types: ["Normal","Flying"], baseStats: { hp: 45, atk: 50, def: 43, spa: 40, spd: 38, spe: 62 }, abilities: ["Big Pecks","Gale Wings"] },
  "fletchinder": { name: "Fletchinder", types: ["Fire","Flying"], baseStats: { hp: 62, atk: 73, def: 55, spa: 56, spd: 52, spe: 84 }, abilities: ["Flame Body","Gale Wings"] },
  "scatterbug": { name: "Scatterbug", types: ["Bug"], baseStats: { hp: 38, atk: 35, def: 40, spa: 27, spd: 25, spe: 35 }, abilities: ["Shield Dust","Compound Eyes","Friend Guard"] },
  "spewpa": { name: "Spewpa", types: ["Bug"], baseStats: { hp: 45, atk: 22, def: 60, spa: 27, spd: 30, spe: 29 }, abilities: ["Shed Skin","Friend Guard"] },
  "vivillon": { name: "Vivillon", types: ["Bug","Flying"], baseStats: { hp: 80, atk: 52, def: 50, spa: 90, spd: 50, spe: 89 }, abilities: ["Shield Dust","Compound Eyes","Friend Guard"] },
  "vivillon-fancy": { name: "Vivillon-Fancy", types: ["Bug","Flying"], baseStats: { hp: 80, atk: 52, def: 50, spa: 90, spd: 50, spe: 89 }, abilities: ["Shield Dust","Compound Eyes","Friend Guard"] },
  "vivillon-pokeball": { name: "Vivillon-Pokeball", types: ["Bug","Flying"], baseStats: { hp: 80, atk: 52, def: 50, spa: 90, spd: 50, spe: 89 }, abilities: ["Shield Dust","Compound Eyes","Friend Guard"] },
  "litleo": { name: "Litleo", types: ["Fire","Normal"], baseStats: { hp: 62, atk: 50, def: 58, spa: 73, spd: 54, spe: 72 }, abilities: ["Rivalry","Unnerve","Moxie"] },
  "pyroar": { name: "Pyroar", types: ["Fire","Normal"], baseStats: { hp: 86, atk: 68, def: 72, spa: 109, spd: 66, spe: 106 }, abilities: ["Rivalry","Unnerve","Moxie"] },
  "flabebe": { name: "Flabébé", types: ["Fairy"], baseStats: { hp: 44, atk: 38, def: 39, spa: 61, spd: 79, spe: 42 }, abilities: ["Flower Veil","Symbiosis"] },
  "floette": { name: "Floette", types: ["Fairy"], baseStats: { hp: 54, atk: 45, def: 47, spa: 75, spd: 98, spe: 52 }, abilities: ["Flower Veil","Symbiosis"] },
  "floette-eternal": { name: "Floette-Eternal", types: ["Fairy"], baseStats: { hp: 74, atk: 65, def: 67, spa: 125, spd: 128, spe: 92 }, abilities: ["Flower Veil","Symbiosis"] },
  "florges": { name: "Florges", types: ["Fairy"], baseStats: { hp: 78, atk: 65, def: 68, spa: 112, spd: 154, spe: 75 }, abilities: ["Flower Veil","Symbiosis"] },
  "skiddo": { name: "Skiddo", types: ["Grass"], baseStats: { hp: 66, atk: 65, def: 48, spa: 62, spd: 57, spe: 52 }, abilities: ["Sap Sipper","Grass Pelt"] },
  "gogoat": { name: "Gogoat", types: ["Grass"], baseStats: { hp: 123, atk: 100, def: 62, spa: 97, spd: 81, spe: 68 }, abilities: ["Sap Sipper","Grass Pelt"] },
  "pancham": { name: "Pancham", types: ["Fighting"], baseStats: { hp: 67, atk: 82, def: 62, spa: 46, spd: 48, spe: 43 }, abilities: ["Iron Fist","Mold Breaker","Scrappy"] },
  "pangoro": { name: "Pangoro", types: ["Fighting","Dark"], baseStats: { hp: 95, atk: 124, def: 78, spa: 69, spd: 71, spe: 58 }, abilities: ["Iron Fist","Mold Breaker","Scrappy"] },
  "furfrou": { name: "Furfrou", types: ["Normal"], baseStats: { hp: 75, atk: 80, def: 60, spa: 65, spd: 90, spe: 102 }, abilities: ["Fur Coat"] },
  "espurr": { name: "Espurr", types: ["Psychic"], baseStats: { hp: 62, atk: 48, def: 54, spa: 63, spd: 60, spe: 68 }, abilities: ["Keen Eye","Infiltrator","Own Tempo"] },
  "meowstic": { name: "Meowstic", types: ["Psychic"], baseStats: { hp: 74, atk: 48, def: 76, spa: 83, spd: 81, spe: 104 }, abilities: ["Keen Eye","Infiltrator","Prankster"] },
  "meowstic-f": { name: "Meowstic-F", types: ["Psychic"], baseStats: { hp: 74, atk: 48, def: 76, spa: 83, spd: 81, spe: 104 }, abilities: ["Keen Eye","Infiltrator","Competitive"] },
  "honedge": { name: "Honedge", types: ["Steel","Ghost"], baseStats: { hp: 45, atk: 80, def: 100, spa: 35, spd: 37, spe: 28 }, abilities: ["No Guard"] },
  "doublade": { name: "Doublade", types: ["Steel","Ghost"], baseStats: { hp: 59, atk: 110, def: 150, spa: 45, spd: 49, spe: 35 }, abilities: ["No Guard"] },
  "aegislash-blade": { name: "Aegislash-Blade", types: ["Steel","Ghost"], baseStats: { hp: 60, atk: 140, def: 50, spa: 140, spd: 50, spe: 60 }, abilities: ["Stance Change"] },
  "spritzee": { name: "Spritzee", types: ["Fairy"], baseStats: { hp: 78, atk: 52, def: 60, spa: 63, spd: 65, spe: 23 }, abilities: ["Healer","Aroma Veil"] },
  "aromatisse": { name: "Aromatisse", types: ["Fairy"], baseStats: { hp: 101, atk: 72, def: 72, spa: 99, spd: 89, spe: 29 }, abilities: ["Healer","Aroma Veil"] },
  "swirlix": { name: "Swirlix", types: ["Fairy"], baseStats: { hp: 62, atk: 48, def: 66, spa: 59, spd: 57, spe: 49 }, abilities: ["Sweet Veil","Unburden"] },
  "slurpuff": { name: "Slurpuff", types: ["Fairy"], baseStats: { hp: 82, atk: 80, def: 86, spa: 85, spd: 75, spe: 72 }, abilities: ["Sweet Veil","Unburden"] },
  "inkay": { name: "Inkay", types: ["Dark","Psychic"], baseStats: { hp: 53, atk: 54, def: 53, spa: 37, spd: 46, spe: 45 }, abilities: ["Contrary","Suction Cups","Infiltrator"] },
  "malamar": { name: "Malamar", types: ["Dark","Psychic"], baseStats: { hp: 86, atk: 92, def: 88, spa: 68, spd: 75, spe: 73 }, abilities: ["Contrary","Suction Cups","Infiltrator"] },
  "binacle": { name: "Binacle", types: ["Rock","Water"], baseStats: { hp: 42, atk: 52, def: 67, spa: 39, spd: 56, spe: 50 }, abilities: ["Tough Claws","Sniper","Pickpocket"] },
  "barbaracle": { name: "Barbaracle", types: ["Rock","Water"], baseStats: { hp: 72, atk: 105, def: 115, spa: 54, spd: 86, spe: 68 }, abilities: ["Tough Claws","Sniper","Pickpocket"] },
  "skrelp": { name: "Skrelp", types: ["Poison","Water"], baseStats: { hp: 50, atk: 60, def: 60, spa: 60, spd: 60, spe: 30 }, abilities: ["Poison Point","Poison Touch","Adaptability"] },
  "dragalge": { name: "Dragalge", types: ["Poison","Dragon"], baseStats: { hp: 65, atk: 75, def: 90, spa: 97, spd: 123, spe: 44 }, abilities: ["Poison Point","Poison Touch","Adaptability"] },
  "clauncher": { name: "Clauncher", types: ["Water"], baseStats: { hp: 50, atk: 53, def: 62, spa: 58, spd: 63, spe: 44 }, abilities: ["Mega Launcher"] },
  "clawitzer": { name: "Clawitzer", types: ["Water"], baseStats: { hp: 71, atk: 73, def: 88, spa: 120, spd: 89, spe: 59 }, abilities: ["Mega Launcher"] },
  "helioptile": { name: "Helioptile", types: ["Electric","Normal"], baseStats: { hp: 44, atk: 38, def: 33, spa: 61, spd: 43, spe: 70 }, abilities: ["Dry Skin","Sand Veil","Solar Power"] },
  "heliolisk": { name: "Heliolisk", types: ["Electric","Normal"], baseStats: { hp: 62, atk: 55, def: 52, spa: 109, spd: 94, spe: 109 }, abilities: ["Dry Skin","Sand Veil","Solar Power"] },
  "tyrunt": { name: "Tyrunt", types: ["Rock","Dragon"], baseStats: { hp: 58, atk: 89, def: 77, spa: 45, spd: 45, spe: 48 }, abilities: ["Strong Jaw","Sturdy"] },
  "tyrantrum": { name: "Tyrantrum", types: ["Rock","Dragon"], baseStats: { hp: 82, atk: 121, def: 119, spa: 69, spd: 59, spe: 71 }, abilities: ["Strong Jaw","Rock Head"] },
  "amaura": { name: "Amaura", types: ["Rock","Ice"], baseStats: { hp: 77, atk: 59, def: 50, spa: 67, spd: 63, spe: 46 }, abilities: ["Refrigerate","Snow Warning"] },
  "aurorus": { name: "Aurorus", types: ["Rock","Ice"], baseStats: { hp: 123, atk: 77, def: 72, spa: 99, spd: 92, spe: 58 }, abilities: ["Refrigerate","Snow Warning"] },
  "hawlucha": { name: "Hawlucha", types: ["Fighting","Flying"], baseStats: { hp: 78, atk: 92, def: 75, spa: 74, spd: 63, spe: 118 }, abilities: ["Limber","Unburden","Mold Breaker"] },
  "dedenne": { name: "Dedenne", types: ["Electric","Fairy"], baseStats: { hp: 67, atk: 58, def: 57, spa: 81, spd: 67, spe: 101 }, abilities: ["Cheek Pouch","Pickup","Plus"] },
  "carbink": { name: "Carbink", types: ["Rock","Fairy"], baseStats: { hp: 50, atk: 50, def: 150, spa: 50, spd: 150, spe: 50 }, abilities: ["Clear Body","Sturdy"] },
  "goomy": { name: "Goomy", types: ["Dragon"], baseStats: { hp: 45, atk: 50, def: 35, spa: 55, spd: 75, spe: 40 }, abilities: ["Sap Sipper","Hydration","Gooey"] },
  "sliggoo": { name: "Sliggoo", types: ["Dragon"], baseStats: { hp: 68, atk: 75, def: 53, spa: 83, spd: 113, spe: 60 }, abilities: ["Sap Sipper","Hydration","Gooey"] },
  "sliggoo-hisui": { name: "Sliggoo-Hisui", types: ["Steel","Dragon"], baseStats: { hp: 58, atk: 75, def: 83, spa: 83, spd: 113, spe: 40 }, abilities: ["Sap Sipper","Shell Armor","Gooey"] },
  "goodra": { name: "Goodra", types: ["Dragon"], baseStats: { hp: 90, atk: 100, def: 70, spa: 110, spd: 150, spe: 80 }, abilities: ["Sap Sipper","Hydration","Gooey"] },
  "phantump": { name: "Phantump", types: ["Ghost","Grass"], baseStats: { hp: 43, atk: 70, def: 48, spa: 50, spd: 60, spe: 38 }, abilities: ["Natural Cure","Frisk","Harvest"] },
  "trevenant": { name: "Trevenant", types: ["Ghost","Grass"], baseStats: { hp: 85, atk: 110, def: 76, spa: 65, spd: 82, spe: 56 }, abilities: ["Natural Cure","Frisk","Harvest"] },
  "pumpkaboo": { name: "Pumpkaboo", types: ["Ghost","Grass"], baseStats: { hp: 49, atk: 66, def: 70, spa: 44, spd: 55, spe: 51 }, abilities: ["Pickup","Frisk","Insomnia"] },
  "pumpkaboo-small": { name: "Pumpkaboo-Small", types: ["Ghost","Grass"], baseStats: { hp: 44, atk: 66, def: 70, spa: 44, spd: 55, spe: 56 }, abilities: ["Pickup","Frisk","Insomnia"] },
  "pumpkaboo-large": { name: "Pumpkaboo-Large", types: ["Ghost","Grass"], baseStats: { hp: 54, atk: 66, def: 70, spa: 44, spd: 55, spe: 46 }, abilities: ["Pickup","Frisk","Insomnia"] },
  "pumpkaboo-super": { name: "Pumpkaboo-Super", types: ["Ghost","Grass"], baseStats: { hp: 59, atk: 66, def: 70, spa: 44, spd: 55, spe: 41 }, abilities: ["Pickup","Frisk","Insomnia"] },
  "gourgeist": { name: "Gourgeist", types: ["Ghost","Grass"], baseStats: { hp: 65, atk: 90, def: 122, spa: 58, spd: 75, spe: 84 }, abilities: ["Pickup","Frisk","Insomnia"] },
  "gourgeist-small": { name: "Gourgeist-Small", types: ["Ghost","Grass"], baseStats: { hp: 55, atk: 85, def: 122, spa: 58, spd: 75, spe: 99 }, abilities: ["Pickup","Frisk","Insomnia"] },
  "gourgeist-large": { name: "Gourgeist-Large", types: ["Ghost","Grass"], baseStats: { hp: 75, atk: 95, def: 122, spa: 58, spd: 75, spe: 69 }, abilities: ["Pickup","Frisk","Insomnia"] },
  "gourgeist-super": { name: "Gourgeist-Super", types: ["Ghost","Grass"], baseStats: { hp: 85, atk: 100, def: 122, spa: 58, spd: 75, spe: 54 }, abilities: ["Pickup","Frisk","Insomnia"] },
  "bergmite": { name: "Bergmite", types: ["Ice"], baseStats: { hp: 55, atk: 69, def: 85, spa: 32, spd: 35, spe: 28 }, abilities: ["Own Tempo","Ice Body","Sturdy"] },
  "avalugg": { name: "Avalugg", types: ["Ice"], baseStats: { hp: 95, atk: 117, def: 184, spa: 44, spd: 46, spe: 28 }, abilities: ["Own Tempo","Ice Body","Sturdy"] },
  "avalugg-hisui": { name: "Avalugg-Hisui", types: ["Ice","Rock"], baseStats: { hp: 95, atk: 127, def: 184, spa: 34, spd: 36, spe: 38 }, abilities: ["Strong Jaw","Ice Body","Sturdy"] },
  "noibat": { name: "Noibat", types: ["Flying","Dragon"], baseStats: { hp: 40, atk: 30, def: 35, spa: 45, spd: 40, spe: 55 }, abilities: ["Frisk","Infiltrator","Telepathy"] },
  "noivern": { name: "Noivern", types: ["Flying","Dragon"], baseStats: { hp: 85, atk: 70, def: 80, spa: 97, spd: 80, spe: 123 }, abilities: ["Frisk","Infiltrator","Telepathy"] },
  "zygarde-10": { name: "Zygarde-10%", types: ["Dragon","Ground"], baseStats: { hp: 54, atk: 100, def: 71, spa: 61, spd: 85, spe: 115 }, abilities: ["Aura Break","Power Construct"] },
  "zygarde-complete": { name: "Zygarde-Complete", types: ["Dragon","Ground"], baseStats: { hp: 216, atk: 100, def: 121, spa: 91, spd: 95, spe: 85 }, abilities: ["Power Construct"] },
  "hoopa": { name: "Hoopa", types: ["Psychic","Ghost"], baseStats: { hp: 80, atk: 110, def: 60, spa: 150, spd: 130, spe: 70 }, abilities: ["Magician"] },
  "hoopa-unbound": { name: "Hoopa-Unbound", types: ["Psychic","Dark"], baseStats: { hp: 80, atk: 160, def: 60, spa: 170, spd: 130, spe: 80 }, abilities: ["Magician"] },
  "rowlet": { name: "Rowlet", types: ["Grass","Flying"], baseStats: { hp: 68, atk: 55, def: 55, spa: 50, spd: 50, spe: 42 }, abilities: ["Overgrow","Long Reach"] },
  "dartrix": { name: "Dartrix", types: ["Grass","Flying"], baseStats: { hp: 78, atk: 75, def: 75, spa: 70, spd: 70, spe: 52 }, abilities: ["Overgrow","Long Reach"] },
  "decidueye-hisui": { name: "Decidueye-Hisui", types: ["Grass","Fighting"], baseStats: { hp: 88, atk: 112, def: 80, spa: 95, spd: 95, spe: 60 }, abilities: ["Overgrow","Scrappy"] },
  "litten": { name: "Litten", types: ["Fire"], baseStats: { hp: 45, atk: 65, def: 40, spa: 60, spd: 40, spe: 70 }, abilities: ["Blaze","Intimidate"] },
  "torracat": { name: "Torracat", types: ["Fire"], baseStats: { hp: 65, atk: 85, def: 50, spa: 80, spd: 50, spe: 90 }, abilities: ["Blaze","Intimidate"] },
  "popplio": { name: "Popplio", types: ["Water"], baseStats: { hp: 50, atk: 54, def: 54, spa: 66, spd: 56, spe: 40 }, abilities: ["Torrent","Liquid Voice"] },
  "brionne": { name: "Brionne", types: ["Water"], baseStats: { hp: 60, atk: 69, def: 69, spa: 91, spd: 81, spe: 50 }, abilities: ["Torrent","Liquid Voice"] },
  "pikipek": { name: "Pikipek", types: ["Normal","Flying"], baseStats: { hp: 35, atk: 75, def: 30, spa: 30, spd: 30, spe: 65 }, abilities: ["Keen Eye","Skill Link","Pickup"] },
  "trumbeak": { name: "Trumbeak", types: ["Normal","Flying"], baseStats: { hp: 55, atk: 85, def: 50, spa: 40, spd: 50, spe: 75 }, abilities: ["Keen Eye","Skill Link","Pickup"] },
  "toucannon": { name: "Toucannon", types: ["Normal","Flying"], baseStats: { hp: 80, atk: 120, def: 75, spa: 75, spd: 75, spe: 60 }, abilities: ["Keen Eye","Skill Link","Sheer Force"] },
  "yungoos": { name: "Yungoos", types: ["Normal"], baseStats: { hp: 48, atk: 70, def: 30, spa: 30, spd: 30, spe: 45 }, abilities: ["Stakeout","Strong Jaw","Adaptability"] },
  "gumshoos": { name: "Gumshoos", types: ["Normal"], baseStats: { hp: 88, atk: 110, def: 60, spa: 55, spd: 60, spe: 45 }, abilities: ["Stakeout","Strong Jaw","Adaptability"] },
  "gumshoos-totem": { name: "Gumshoos-Totem", types: ["Normal"], baseStats: { hp: 88, atk: 110, def: 60, spa: 55, spd: 60, spe: 45 }, abilities: ["Adaptability"] },
  "grubbin": { name: "Grubbin", types: ["Bug"], baseStats: { hp: 47, atk: 62, def: 45, spa: 55, spd: 45, spe: 46 }, abilities: ["Swarm"] },
  "charjabug": { name: "Charjabug", types: ["Bug","Electric"], baseStats: { hp: 57, atk: 82, def: 95, spa: 55, spd: 75, spe: 36 }, abilities: ["Battery"] },
  "vikavolt": { name: "Vikavolt", types: ["Bug","Electric"], baseStats: { hp: 77, atk: 70, def: 90, spa: 145, spd: 75, spe: 43 }, abilities: ["Levitate"] },
  "vikavolt-totem": { name: "Vikavolt-Totem", types: ["Bug","Electric"], baseStats: { hp: 77, atk: 70, def: 90, spa: 145, spd: 75, spe: 43 }, abilities: ["Levitate"] },
  "crabrawler": { name: "Crabrawler", types: ["Fighting"], baseStats: { hp: 47, atk: 82, def: 57, spa: 42, spd: 47, spe: 63 }, abilities: ["Hyper Cutter","Iron Fist","Anger Point"] },
  "crabominable": { name: "Crabominable", types: ["Fighting","Ice"], baseStats: { hp: 97, atk: 132, def: 77, spa: 62, spd: 67, spe: 43 }, abilities: ["Hyper Cutter","Iron Fist","Anger Point"] },
  "oricorio": { name: "Oricorio", types: ["Fire","Flying"], baseStats: { hp: 75, atk: 70, def: 70, spa: 98, spd: 70, spe: 93 }, abilities: ["Dancer"] },
  "oricorio-pom-pom": { name: "Oricorio-Pom-Pom", types: ["Electric","Flying"], baseStats: { hp: 75, atk: 70, def: 70, spa: 98, spd: 70, spe: 93 }, abilities: ["Dancer"] },
  "oricorio-pau": { name: "Oricorio-Pa'u", types: ["Psychic","Flying"], baseStats: { hp: 75, atk: 70, def: 70, spa: 98, spd: 70, spe: 93 }, abilities: ["Dancer"] },
  "oricorio-sensu": { name: "Oricorio-Sensu", types: ["Ghost","Flying"], baseStats: { hp: 75, atk: 70, def: 70, spa: 98, spd: 70, spe: 93 }, abilities: ["Dancer"] },
  "cutiefly": { name: "Cutiefly", types: ["Bug","Fairy"], baseStats: { hp: 40, atk: 45, def: 40, spa: 55, spd: 40, spe: 84 }, abilities: ["Honey Gather","Shield Dust","Sweet Veil"] },
  "ribombee-totem": { name: "Ribombee-Totem", types: ["Bug","Fairy"], baseStats: { hp: 60, atk: 55, def: 60, spa: 95, spd: 70, spe: 124 }, abilities: ["Sweet Veil"] },
  "rockruff": { name: "Rockruff", types: ["Rock"], baseStats: { hp: 45, atk: 65, def: 40, spa: 30, spd: 40, spe: 60 }, abilities: ["Keen Eye","Vital Spirit","Steadfast","Own Tempo"] },
  "rockruff-dusk": { name: "Rockruff-Dusk", types: ["Rock"], baseStats: { hp: 45, atk: 65, def: 40, spa: 30, spd: 40, spe: 60 }, abilities: ["Own Tempo"] },
  "lycanroc": { name: "Lycanroc", types: ["Rock"], baseStats: { hp: 75, atk: 115, def: 65, spa: 55, spd: 65, spe: 112 }, abilities: ["Keen Eye","Sand Rush","Steadfast"] },
  "lycanroc-midnight": { name: "Lycanroc-Midnight", types: ["Rock"], baseStats: { hp: 85, atk: 115, def: 75, spa: 55, spd: 75, spe: 82 }, abilities: ["Keen Eye","Vital Spirit","No Guard"] },
  "lycanroc-dusk": { name: "Lycanroc-Dusk", types: ["Rock"], baseStats: { hp: 75, atk: 117, def: 65, spa: 55, spd: 65, spe: 110 }, abilities: ["Tough Claws"] },
  "wishiwashi": { name: "Wishiwashi", types: ["Water"], baseStats: { hp: 45, atk: 20, def: 20, spa: 25, spd: 25, spe: 40 }, abilities: ["Schooling"] },
  "wishiwashi-school": { name: "Wishiwashi-School", types: ["Water"], baseStats: { hp: 45, atk: 140, def: 130, spa: 140, spd: 135, spe: 30 }, abilities: ["Schooling"] },
  "mareanie": { name: "Mareanie", types: ["Poison","Water"], baseStats: { hp: 50, atk: 53, def: 62, spa: 43, spd: 52, spe: 45 }, abilities: ["Merciless","Limber","Regenerator"] },
  "mudbray": { name: "Mudbray", types: ["Ground"], baseStats: { hp: 70, atk: 100, def: 70, spa: 45, spd: 55, spe: 45 }, abilities: ["Own Tempo","Stamina","Inner Focus"] },
  "mudsdale": { name: "Mudsdale", types: ["Ground"], baseStats: { hp: 100, atk: 125, def: 100, spa: 55, spd: 85, spe: 35 }, abilities: ["Own Tempo","Stamina","Inner Focus"] },
  "dewpider": { name: "Dewpider", types: ["Water","Bug"], baseStats: { hp: 38, atk: 40, def: 52, spa: 40, spd: 72, spe: 27 }, abilities: ["Water Bubble","Water Absorb"] },
  "araquanid-totem": { name: "Araquanid-Totem", types: ["Water","Bug"], baseStats: { hp: 68, atk: 70, def: 92, spa: 50, spd: 132, spe: 42 }, abilities: ["Water Bubble"] },
  "fomantis": { name: "Fomantis", types: ["Grass"], baseStats: { hp: 40, atk: 55, def: 35, spa: 50, spd: 35, spe: 35 }, abilities: ["Leaf Guard","Contrary"] },
  "lurantis": { name: "Lurantis", types: ["Grass"], baseStats: { hp: 70, atk: 105, def: 90, spa: 80, spd: 90, spe: 45 }, abilities: ["Leaf Guard","Contrary"] },
  "lurantis-totem": { name: "Lurantis-Totem", types: ["Grass"], baseStats: { hp: 70, atk: 105, def: 90, spa: 80, spd: 90, spe: 45 }, abilities: ["Leaf Guard"] },
  "morelull": { name: "Morelull", types: ["Grass","Fairy"], baseStats: { hp: 40, atk: 35, def: 55, spa: 65, spd: 75, spe: 15 }, abilities: ["Illuminate","Effect Spore","Rain Dish"] },
  "shiinotic": { name: "Shiinotic", types: ["Grass","Fairy"], baseStats: { hp: 60, atk: 45, def: 80, spa: 90, spd: 100, spe: 30 }, abilities: ["Illuminate","Effect Spore","Rain Dish"] },
  "salandit": { name: "Salandit", types: ["Poison","Fire"], baseStats: { hp: 48, atk: 44, def: 40, spa: 71, spd: 40, spe: 77 }, abilities: ["Corrosion","Oblivious"] },
  "salazzle": { name: "Salazzle", types: ["Poison","Fire"], baseStats: { hp: 68, atk: 64, def: 60, spa: 111, spd: 60, spe: 117 }, abilities: ["Corrosion","Oblivious"] },
  "salazzle-totem": { name: "Salazzle-Totem", types: ["Poison","Fire"], baseStats: { hp: 68, atk: 64, def: 60, spa: 111, spd: 60, spe: 117 }, abilities: ["Corrosion"] },
  "stufful": { name: "Stufful", types: ["Normal","Fighting"], baseStats: { hp: 70, atk: 75, def: 50, spa: 45, spd: 50, spe: 50 }, abilities: ["Fluffy","Klutz","Cute Charm"] },
  "bewear": { name: "Bewear", types: ["Normal","Fighting"], baseStats: { hp: 120, atk: 125, def: 80, spa: 55, spd: 60, spe: 60 }, abilities: ["Fluffy","Klutz","Unnerve"] },
  "bounsweet": { name: "Bounsweet", types: ["Grass"], baseStats: { hp: 42, atk: 30, def: 38, spa: 30, spd: 38, spe: 32 }, abilities: ["Leaf Guard","Oblivious","Sweet Veil"] },
  "steenee": { name: "Steenee", types: ["Grass"], baseStats: { hp: 52, atk: 40, def: 48, spa: 40, spd: 48, spe: 62 }, abilities: ["Leaf Guard","Oblivious","Sweet Veil"] },
  "passimian": { name: "Passimian", types: ["Fighting"], baseStats: { hp: 100, atk: 120, def: 90, spa: 40, spd: 60, spe: 80 }, abilities: ["Receiver","Defiant"] },
  "wimpod": { name: "Wimpod", types: ["Bug","Water"], baseStats: { hp: 25, atk: 35, def: 40, spa: 20, spd: 30, spe: 80 }, abilities: ["Wimp Out"] },
  "golisopod": { name: "Golisopod", types: ["Bug","Water"], baseStats: { hp: 75, atk: 125, def: 140, spa: 60, spd: 90, spe: 40 }, abilities: ["Emergency Exit"] },
  "sandygast": { name: "Sandygast", types: ["Ghost","Ground"], baseStats: { hp: 55, atk: 55, def: 80, spa: 70, spd: 45, spe: 15 }, abilities: ["Water Compaction","Sand Veil"] },
  "palossand": { name: "Palossand", types: ["Ghost","Ground"], baseStats: { hp: 85, atk: 75, def: 110, spa: 100, spd: 75, spe: 35 }, abilities: ["Water Compaction","Sand Veil"] },
  "pyukumuku": { name: "Pyukumuku", types: ["Water"], baseStats: { hp: 55, atk: 60, def: 130, spa: 30, spd: 130, spe: 5 }, abilities: ["Innards Out","Unaware"] },
  "type-null": { name: "Type: Null", types: ["Normal"], baseStats: { hp: 95, atk: 95, def: 95, spa: 95, spd: 95, spe: 59 }, abilities: ["Battle Armor"] },
  "silvally": { name: "Silvally", types: ["Normal"], baseStats: { hp: 95, atk: 95, def: 95, spa: 95, spd: 95, spe: 95 }, abilities: ["RKS System"] },
  "silvally-bug": { name: "Silvally-Bug", types: ["Bug"], baseStats: { hp: 95, atk: 95, def: 95, spa: 95, spd: 95, spe: 95 }, abilities: ["RKS System"] },
  "silvally-dark": { name: "Silvally-Dark", types: ["Dark"], baseStats: { hp: 95, atk: 95, def: 95, spa: 95, spd: 95, spe: 95 }, abilities: ["RKS System"] },
  "silvally-dragon": { name: "Silvally-Dragon", types: ["Dragon"], baseStats: { hp: 95, atk: 95, def: 95, spa: 95, spd: 95, spe: 95 }, abilities: ["RKS System"] },
  "silvally-electric": { name: "Silvally-Electric", types: ["Electric"], baseStats: { hp: 95, atk: 95, def: 95, spa: 95, spd: 95, spe: 95 }, abilities: ["RKS System"] },
  "silvally-fairy": { name: "Silvally-Fairy", types: ["Fairy"], baseStats: { hp: 95, atk: 95, def: 95, spa: 95, spd: 95, spe: 95 }, abilities: ["RKS System"] },
  "silvally-fighting": { name: "Silvally-Fighting", types: ["Fighting"], baseStats: { hp: 95, atk: 95, def: 95, spa: 95, spd: 95, spe: 95 }, abilities: ["RKS System"] },
  "silvally-fire": { name: "Silvally-Fire", types: ["Fire"], baseStats: { hp: 95, atk: 95, def: 95, spa: 95, spd: 95, spe: 95 }, abilities: ["RKS System"] },
  "silvally-flying": { name: "Silvally-Flying", types: ["Flying"], baseStats: { hp: 95, atk: 95, def: 95, spa: 95, spd: 95, spe: 95 }, abilities: ["RKS System"] },
  "silvally-ghost": { name: "Silvally-Ghost", types: ["Ghost"], baseStats: { hp: 95, atk: 95, def: 95, spa: 95, spd: 95, spe: 95 }, abilities: ["RKS System"] },
  "silvally-grass": { name: "Silvally-Grass", types: ["Grass"], baseStats: { hp: 95, atk: 95, def: 95, spa: 95, spd: 95, spe: 95 }, abilities: ["RKS System"] },
  "silvally-ground": { name: "Silvally-Ground", types: ["Ground"], baseStats: { hp: 95, atk: 95, def: 95, spa: 95, spd: 95, spe: 95 }, abilities: ["RKS System"] },
  "silvally-ice": { name: "Silvally-Ice", types: ["Ice"], baseStats: { hp: 95, atk: 95, def: 95, spa: 95, spd: 95, spe: 95 }, abilities: ["RKS System"] },
  "silvally-poison": { name: "Silvally-Poison", types: ["Poison"], baseStats: { hp: 95, atk: 95, def: 95, spa: 95, spd: 95, spe: 95 }, abilities: ["RKS System"] },
  "silvally-psychic": { name: "Silvally-Psychic", types: ["Psychic"], baseStats: { hp: 95, atk: 95, def: 95, spa: 95, spd: 95, spe: 95 }, abilities: ["RKS System"] },
  "silvally-rock": { name: "Silvally-Rock", types: ["Rock"], baseStats: { hp: 95, atk: 95, def: 95, spa: 95, spd: 95, spe: 95 }, abilities: ["RKS System"] },
  "silvally-steel": { name: "Silvally-Steel", types: ["Steel"], baseStats: { hp: 95, atk: 95, def: 95, spa: 95, spd: 95, spe: 95 }, abilities: ["RKS System"] },
  "silvally-water": { name: "Silvally-Water", types: ["Water"], baseStats: { hp: 95, atk: 95, def: 95, spa: 95, spd: 95, spe: 95 }, abilities: ["RKS System"] },
  "minior": { name: "Minior", types: ["Rock","Flying"], baseStats: { hp: 60, atk: 100, def: 60, spa: 100, spd: 60, spe: 120 }, abilities: ["Shields Down"] },
  "minior-meteor": { name: "Minior-Meteor", types: ["Rock","Flying"], baseStats: { hp: 60, atk: 60, def: 100, spa: 60, spd: 100, spe: 60 }, abilities: ["Shields Down"] },
  "komala": { name: "Komala", types: ["Normal"], baseStats: { hp: 65, atk: 115, def: 65, spa: 75, spd: 95, spe: 65 }, abilities: ["Comatose"] },
  "turtonator": { name: "Turtonator", types: ["Fire","Dragon"], baseStats: { hp: 60, atk: 78, def: 135, spa: 91, spd: 85, spe: 36 }, abilities: ["Shell Armor"] },
  "togedemaru": { name: "Togedemaru", types: ["Electric","Steel"], baseStats: { hp: 65, atk: 98, def: 63, spa: 40, spd: 73, spe: 96 }, abilities: ["Iron Barbs","Lightning Rod","Sturdy"] },
  "togedemaru-totem": { name: "Togedemaru-Totem", types: ["Electric","Steel"], baseStats: { hp: 65, atk: 98, def: 63, spa: 40, spd: 73, spe: 96 }, abilities: ["Sturdy"] },
  "mimikyu-busted": { name: "Mimikyu-Busted", types: ["Ghost","Fairy"], baseStats: { hp: 55, atk: 90, def: 80, spa: 50, spd: 105, spe: 96 }, abilities: ["Disguise"] },
  "mimikyu-totem": { name: "Mimikyu-Totem", types: ["Ghost","Fairy"], baseStats: { hp: 55, atk: 90, def: 80, spa: 50, spd: 105, spe: 96 }, abilities: ["Disguise"] },
  "mimikyu-busted-totem": { name: "Mimikyu-Busted-Totem", types: ["Ghost","Fairy"], baseStats: { hp: 55, atk: 90, def: 80, spa: 50, spd: 105, spe: 96 }, abilities: ["Disguise"] },
  "bruxish": { name: "Bruxish", types: ["Water","Psychic"], baseStats: { hp: 68, atk: 105, def: 70, spa: 70, spd: 70, spe: 92 }, abilities: ["Dazzling","Strong Jaw","Wonder Skin"] },
  "drampa": { name: "Drampa", types: ["Normal","Dragon"], baseStats: { hp: 78, atk: 60, def: 85, spa: 135, spd: 91, spe: 36 }, abilities: ["Berserk","Sap Sipper","Cloud Nine"] },
  "dhelmise": { name: "Dhelmise", types: ["Ghost","Grass"], baseStats: { hp: 70, atk: 131, def: 100, spa: 86, spd: 90, spe: 40 }, abilities: ["Steelworker"] },
  "jangmo-o": { name: "Jangmo-o", types: ["Dragon"], baseStats: { hp: 45, atk: 55, def: 65, spa: 45, spd: 45, spe: 45 }, abilities: ["Bulletproof","Soundproof","Overcoat"] },
  "hakamo-o": { name: "Hakamo-o", types: ["Dragon","Fighting"], baseStats: { hp: 55, atk: 75, def: 90, spa: 65, spd: 70, spe: 65 }, abilities: ["Bulletproof","Soundproof","Overcoat"] },
  "kommo-o-totem": { name: "Kommo-o-Totem", types: ["Dragon","Fighting"], baseStats: { hp: 75, atk: 110, def: 125, spa: 100, spd: 105, spe: 85 }, abilities: ["Overcoat"] },
  "cosmog": { name: "Cosmog", types: ["Psychic"], baseStats: { hp: 43, atk: 29, def: 31, spa: 29, spd: 31, spe: 37 }, abilities: ["Unaware"] },
  "cosmoem": { name: "Cosmoem", types: ["Psychic"], baseStats: { hp: 43, atk: 29, def: 131, spa: 29, spd: 131, spe: 37 }, abilities: ["Sturdy"] },
  "necrozma-ultra": { name: "Necrozma-Ultra", types: ["Psychic","Dragon"], baseStats: { hp: 97, atk: 167, def: 97, spa: 167, spd: 97, spe: 129 }, abilities: ["Neuroforce"] },
  "magearna": { name: "Magearna", types: ["Steel","Fairy"], baseStats: { hp: 80, atk: 95, def: 115, spa: 130, spd: 115, spe: 65 }, abilities: ["Soul-Heart"] },
  "magearna-original": { name: "Magearna-Original", types: ["Steel","Fairy"], baseStats: { hp: 80, atk: 95, def: 115, spa: 130, spd: 115, spe: 65 }, abilities: ["Soul-Heart"] },
  "marshadow": { name: "Marshadow", types: ["Fighting","Ghost"], baseStats: { hp: 90, atk: 125, def: 80, spa: 90, spd: 90, spe: 125 }, abilities: ["Technician"] },
  "poipole": { name: "Poipole", types: ["Poison"], baseStats: { hp: 67, atk: 73, def: 67, spa: 73, spd: 67, spe: 73 }, abilities: ["Beast Boost"] },
  "zeraora": { name: "Zeraora", types: ["Electric"], baseStats: { hp: 88, atk: 112, def: 75, spa: 102, spd: 80, spe: 143 }, abilities: ["Volt Absorb"] },
  "meltan": { name: "Meltan", types: ["Steel"], baseStats: { hp: 46, atk: 65, def: 65, spa: 55, spd: 35, spe: 34 }, abilities: ["Magnet Pull"] },
  "melmetal": { name: "Melmetal", types: ["Steel"], baseStats: { hp: 135, atk: 143, def: 143, spa: 80, spd: 65, spe: 34 }, abilities: ["Iron Fist"] },
  "melmetal-gmax": { name: "Melmetal-Gmax", types: ["Steel"], baseStats: { hp: 135, atk: 143, def: 143, spa: 80, spd: 65, spe: 34 }, abilities: ["Iron Fist"] },
  "grookey": { name: "Grookey", types: ["Grass"], baseStats: { hp: 50, atk: 65, def: 50, spa: 40, spd: 40, spe: 65 }, abilities: ["Overgrow","Grassy Surge"] },
  "thwackey": { name: "Thwackey", types: ["Grass"], baseStats: { hp: 70, atk: 85, def: 70, spa: 55, spd: 60, spe: 80 }, abilities: ["Overgrow","Grassy Surge"] },
  "rillaboom-gmax": { name: "Rillaboom-Gmax", types: ["Grass"], baseStats: { hp: 100, atk: 125, def: 90, spa: 60, spd: 70, spe: 85 }, abilities: ["Overgrow","Grassy Surge"] },
  "scorbunny": { name: "Scorbunny", types: ["Fire"], baseStats: { hp: 50, atk: 71, def: 40, spa: 40, spd: 40, spe: 69 }, abilities: ["Blaze","Libero"] },
  "raboot": { name: "Raboot", types: ["Fire"], baseStats: { hp: 65, atk: 86, def: 60, spa: 55, spd: 60, spe: 94 }, abilities: ["Blaze","Libero"] },
  "cinderace-gmax": { name: "Cinderace-Gmax", types: ["Fire"], baseStats: { hp: 80, atk: 116, def: 75, spa: 65, spd: 75, spe: 119 }, abilities: ["Blaze","Libero"] },
  "sobble": { name: "Sobble", types: ["Water"], baseStats: { hp: 50, atk: 40, def: 40, spa: 70, spd: 40, spe: 70 }, abilities: ["Torrent","Sniper"] },
  "drizzile": { name: "Drizzile", types: ["Water"], baseStats: { hp: 65, atk: 60, def: 55, spa: 95, spd: 55, spe: 90 }, abilities: ["Torrent","Sniper"] },
  "inteleon": { name: "Inteleon", types: ["Water"], baseStats: { hp: 70, atk: 85, def: 65, spa: 125, spd: 65, spe: 120 }, abilities: ["Torrent","Sniper"] },
  "inteleon-gmax": { name: "Inteleon-Gmax", types: ["Water"], baseStats: { hp: 70, atk: 85, def: 65, spa: 125, spd: 65, spe: 120 }, abilities: ["Torrent","Sniper"] },
  "skwovet": { name: "Skwovet", types: ["Normal"], baseStats: { hp: 70, atk: 55, def: 55, spa: 35, spd: 35, spe: 25 }, abilities: ["Cheek Pouch","Gluttony"] },
  "greedent": { name: "Greedent", types: ["Normal"], baseStats: { hp: 120, atk: 95, def: 95, spa: 55, spd: 75, spe: 20 }, abilities: ["Cheek Pouch","Gluttony"] },
  "rookidee": { name: "Rookidee", types: ["Flying"], baseStats: { hp: 38, atk: 47, def: 35, spa: 33, spd: 35, spe: 57 }, abilities: ["Keen Eye","Unnerve","Big Pecks"] },
  "corvisquire": { name: "Corvisquire", types: ["Flying"], baseStats: { hp: 68, atk: 67, def: 55, spa: 43, spd: 55, spe: 77 }, abilities: ["Keen Eye","Unnerve","Big Pecks"] },
  "corviknight-gmax": { name: "Corviknight-Gmax", types: ["Flying","Steel"], baseStats: { hp: 98, atk: 87, def: 105, spa: 53, spd: 85, spe: 67 }, abilities: ["Pressure","Unnerve","Mirror Armor"] },
  "blipbug": { name: "Blipbug", types: ["Bug"], baseStats: { hp: 25, atk: 20, def: 20, spa: 25, spd: 45, spe: 45 }, abilities: ["Swarm","Compound Eyes","Telepathy"] },
  "dottler": { name: "Dottler", types: ["Bug","Psychic"], baseStats: { hp: 50, atk: 35, def: 80, spa: 50, spd: 90, spe: 30 }, abilities: ["Swarm","Compound Eyes","Telepathy"] },
  "orbeetle": { name: "Orbeetle", types: ["Bug","Psychic"], baseStats: { hp: 60, atk: 45, def: 110, spa: 80, spd: 120, spe: 90 }, abilities: ["Swarm","Frisk","Telepathy"] },
  "orbeetle-gmax": { name: "Orbeetle-Gmax", types: ["Bug","Psychic"], baseStats: { hp: 60, atk: 45, def: 110, spa: 80, spd: 120, spe: 90 }, abilities: ["Swarm","Frisk","Telepathy"] },
  "nickit": { name: "Nickit", types: ["Dark"], baseStats: { hp: 40, atk: 28, def: 28, spa: 47, spd: 52, spe: 50 }, abilities: ["Run Away","Unburden","Stakeout"] },
  "thievul": { name: "Thievul", types: ["Dark"], baseStats: { hp: 70, atk: 58, def: 58, spa: 87, spd: 92, spe: 90 }, abilities: ["Run Away","Unburden","Stakeout"] },
  "gossifleur": { name: "Gossifleur", types: ["Grass"], baseStats: { hp: 40, atk: 40, def: 60, spa: 40, spd: 60, spe: 10 }, abilities: ["Cotton Down","Regenerator","Effect Spore"] },
  "eldegoss": { name: "Eldegoss", types: ["Grass"], baseStats: { hp: 60, atk: 50, def: 90, spa: 80, spd: 120, spe: 60 }, abilities: ["Cotton Down","Regenerator","Effect Spore"] },
  "wooloo": { name: "Wooloo", types: ["Normal"], baseStats: { hp: 42, atk: 40, def: 55, spa: 40, spd: 45, spe: 48 }, abilities: ["Fluffy","Run Away","Bulletproof"] },
  "dubwool": { name: "Dubwool", types: ["Normal"], baseStats: { hp: 72, atk: 80, def: 100, spa: 60, spd: 90, spe: 88 }, abilities: ["Fluffy","Steadfast","Bulletproof"] },
  "chewtle": { name: "Chewtle", types: ["Water"], baseStats: { hp: 50, atk: 64, def: 50, spa: 38, spd: 38, spe: 44 }, abilities: ["Strong Jaw","Shell Armor","Swift Swim"] },
  "drednaw": { name: "Drednaw", types: ["Water","Rock"], baseStats: { hp: 90, atk: 115, def: 90, spa: 48, spd: 68, spe: 74 }, abilities: ["Strong Jaw","Shell Armor","Swift Swim"] },
  "drednaw-gmax": { name: "Drednaw-Gmax", types: ["Water","Rock"], baseStats: { hp: 90, atk: 115, def: 90, spa: 48, spd: 68, spe: 74 }, abilities: ["Strong Jaw","Shell Armor","Swift Swim"] },
  "yamper": { name: "Yamper", types: ["Electric"], baseStats: { hp: 59, atk: 45, def: 50, spa: 40, spd: 50, spe: 26 }, abilities: ["Ball Fetch","Rattled"] },
  "boltund": { name: "Boltund", types: ["Electric"], baseStats: { hp: 69, atk: 90, def: 60, spa: 90, spd: 60, spe: 121 }, abilities: ["Strong Jaw","Competitive"] },
  "rolycoly": { name: "Rolycoly", types: ["Rock"], baseStats: { hp: 30, atk: 40, def: 50, spa: 40, spd: 50, spe: 30 }, abilities: ["Steam Engine","Heatproof","Flash Fire"] },
  "carkol": { name: "Carkol", types: ["Rock","Fire"], baseStats: { hp: 80, atk: 60, def: 90, spa: 60, spd: 70, spe: 50 }, abilities: ["Steam Engine","Flame Body","Flash Fire"] },
  "coalossal-gmax": { name: "Coalossal-Gmax", types: ["Rock","Fire"], baseStats: { hp: 110, atk: 80, def: 120, spa: 80, spd: 90, spe: 30 }, abilities: ["Steam Engine","Flame Body","Flash Fire"] },
  "applin": { name: "Applin", types: ["Grass","Dragon"], baseStats: { hp: 40, atk: 40, def: 80, spa: 40, spd: 40, spe: 20 }, abilities: ["Ripen","Gluttony","Bulletproof"] },
  "flapple": { name: "Flapple", types: ["Grass","Dragon"], baseStats: { hp: 70, atk: 110, def: 80, spa: 95, spd: 60, spe: 70 }, abilities: ["Ripen","Gluttony","Hustle"] },
  "flapple-gmax": { name: "Flapple-Gmax", types: ["Grass","Dragon"], baseStats: { hp: 70, atk: 110, def: 80, spa: 95, spd: 60, spe: 70 }, abilities: ["Ripen","Gluttony","Hustle"] },
  "appletun": { name: "Appletun", types: ["Grass","Dragon"], baseStats: { hp: 110, atk: 85, def: 80, spa: 100, spd: 80, spe: 30 }, abilities: ["Ripen","Gluttony","Thick Fat"] },
  "appletun-gmax": { name: "Appletun-Gmax", types: ["Grass","Dragon"], baseStats: { hp: 110, atk: 85, def: 80, spa: 100, spd: 80, spe: 30 }, abilities: ["Ripen","Gluttony","Thick Fat"] },
  "silicobra": { name: "Silicobra", types: ["Ground"], baseStats: { hp: 52, atk: 57, def: 75, spa: 35, spd: 50, spe: 46 }, abilities: ["Sand Spit","Shed Skin","Sand Veil"] },
  "sandaconda": { name: "Sandaconda", types: ["Ground"], baseStats: { hp: 72, atk: 107, def: 125, spa: 65, spd: 70, spe: 71 }, abilities: ["Sand Spit","Shed Skin","Sand Veil"] },
  "sandaconda-gmax": { name: "Sandaconda-Gmax", types: ["Ground"], baseStats: { hp: 72, atk: 107, def: 125, spa: 65, spd: 70, spe: 71 }, abilities: ["Sand Spit","Shed Skin","Sand Veil"] },
  "cramorant": { name: "Cramorant", types: ["Flying","Water"], baseStats: { hp: 70, atk: 85, def: 55, spa: 85, spd: 95, spe: 85 }, abilities: ["Gulp Missile"] },
  "cramorant-gulping": { name: "Cramorant-Gulping", types: ["Flying","Water"], baseStats: { hp: 70, atk: 85, def: 55, spa: 85, spd: 95, spe: 85 }, abilities: ["Gulp Missile"] },
  "cramorant-gorging": { name: "Cramorant-Gorging", types: ["Flying","Water"], baseStats: { hp: 70, atk: 85, def: 55, spa: 85, spd: 95, spe: 85 }, abilities: ["Gulp Missile"] },
  "arrokuda": { name: "Arrokuda", types: ["Water"], baseStats: { hp: 41, atk: 63, def: 40, spa: 40, spd: 30, spe: 66 }, abilities: ["Swift Swim","Propeller Tail"] },
  "barraskewda": { name: "Barraskewda", types: ["Water"], baseStats: { hp: 61, atk: 123, def: 60, spa: 60, spd: 50, spe: 136 }, abilities: ["Swift Swim","Propeller Tail"] },
  "toxel": { name: "Toxel", types: ["Electric","Poison"], baseStats: { hp: 40, atk: 38, def: 35, spa: 54, spd: 35, spe: 40 }, abilities: ["Rattled","Static","Klutz"] },
  "toxtricity-low-key": { name: "Toxtricity-Low-Key", types: ["Electric","Poison"], baseStats: { hp: 75, atk: 98, def: 70, spa: 114, spd: 70, spe: 75 }, abilities: ["Punk Rock","Minus","Technician"] },
  "toxtricity-gmax": { name: "Toxtricity-Gmax", types: ["Electric","Poison"], baseStats: { hp: 75, atk: 98, def: 70, spa: 114, spd: 70, spe: 75 }, abilities: ["Punk Rock","Plus","Technician"] },
  "toxtricity-low-key-gmax": { name: "Toxtricity-Low-Key-Gmax", types: ["Electric","Poison"], baseStats: { hp: 75, atk: 98, def: 70, spa: 114, spd: 70, spe: 75 }, abilities: ["Punk Rock","Minus","Technician"] },
  "sizzlipede": { name: "Sizzlipede", types: ["Fire","Bug"], baseStats: { hp: 50, atk: 65, def: 45, spa: 50, spd: 50, spe: 45 }, abilities: ["Flash Fire","White Smoke","Flame Body"] },
  "centiskorch": { name: "Centiskorch", types: ["Fire","Bug"], baseStats: { hp: 100, atk: 115, def: 65, spa: 90, spd: 90, spe: 65 }, abilities: ["Flash Fire","White Smoke","Flame Body"] },
  "centiskorch-gmax": { name: "Centiskorch-Gmax", types: ["Fire","Bug"], baseStats: { hp: 100, atk: 115, def: 65, spa: 90, spd: 90, spe: 65 }, abilities: ["Flash Fire","White Smoke","Flame Body"] },
  "clobbopus": { name: "Clobbopus", types: ["Fighting"], baseStats: { hp: 50, atk: 68, def: 60, spa: 50, spd: 50, spe: 32 }, abilities: ["Limber","Technician"] },
  "grapploct": { name: "Grapploct", types: ["Fighting"], baseStats: { hp: 80, atk: 118, def: 90, spa: 70, spd: 80, spe: 42 }, abilities: ["Limber","Technician"] },
  "sinistea": { name: "Sinistea", types: ["Ghost"], baseStats: { hp: 40, atk: 45, def: 45, spa: 74, spd: 54, spe: 50 }, abilities: ["Weak Armor","Cursed Body"] },
  "sinistea-antique": { name: "Sinistea-Antique", types: ["Ghost"], baseStats: { hp: 40, atk: 45, def: 45, spa: 74, spd: 54, spe: 50 }, abilities: ["Weak Armor","Cursed Body"] },
  "polteageist": { name: "Polteageist", types: ["Ghost"], baseStats: { hp: 60, atk: 65, def: 65, spa: 134, spd: 114, spe: 70 }, abilities: ["Weak Armor","Cursed Body"] },
  "polteageist-antique": { name: "Polteageist-Antique", types: ["Ghost"], baseStats: { hp: 60, atk: 65, def: 65, spa: 134, spd: 114, spe: 70 }, abilities: ["Weak Armor","Cursed Body"] },
  "hatenna": { name: "Hatenna", types: ["Psychic"], baseStats: { hp: 42, atk: 30, def: 45, spa: 56, spd: 53, spe: 39 }, abilities: ["Healer","Anticipation","Magic Bounce"] },
  "hattrem": { name: "Hattrem", types: ["Psychic"], baseStats: { hp: 57, atk: 40, def: 65, spa: 86, spd: 73, spe: 49 }, abilities: ["Healer","Anticipation","Magic Bounce"] },
  "hatterene-gmax": { name: "Hatterene-Gmax", types: ["Psychic","Fairy"], baseStats: { hp: 57, atk: 90, def: 95, spa: 136, spd: 103, spe: 29 }, abilities: ["Healer","Anticipation","Magic Bounce"] },
  "impidimp": { name: "Impidimp", types: ["Dark","Fairy"], baseStats: { hp: 45, atk: 45, def: 30, spa: 55, spd: 40, spe: 50 }, abilities: ["Prankster","Frisk","Pickpocket"] },
  "morgrem": { name: "Morgrem", types: ["Dark","Fairy"], baseStats: { hp: 65, atk: 60, def: 45, spa: 75, spd: 55, spe: 70 }, abilities: ["Prankster","Frisk","Pickpocket"] },
  "grimmsnarl-gmax": { name: "Grimmsnarl-Gmax", types: ["Dark","Fairy"], baseStats: { hp: 95, atk: 120, def: 65, spa: 95, spd: 75, spe: 60 }, abilities: ["Prankster","Frisk","Pickpocket"] },
  "obstagoon": { name: "Obstagoon", types: ["Dark","Normal"], baseStats: { hp: 93, atk: 90, def: 101, spa: 60, spd: 81, spe: 95 }, abilities: ["Reckless","Guts","Defiant"] },
  "perrserker": { name: "Perrserker", types: ["Steel"], baseStats: { hp: 70, atk: 110, def: 100, spa: 50, spd: 60, spe: 50 }, abilities: ["Battle Armor","Tough Claws","Steely Spirit"] },
  "cursola": { name: "Cursola", types: ["Ghost"], baseStats: { hp: 60, atk: 95, def: 50, spa: 145, spd: 130, spe: 30 }, abilities: ["Weak Armor","Perish Body"] },
  "sirfetchd": { name: "Sirfetch’d", types: ["Fighting"], baseStats: { hp: 62, atk: 135, def: 95, spa: 68, spd: 82, spe: 65 }, abilities: ["Steadfast","Scrappy"] },
  "mr-rime": { name: "Mr. Rime", types: ["Ice","Psychic"], baseStats: { hp: 80, atk: 85, def: 75, spa: 110, spd: 100, spe: 70 }, abilities: ["Tangled Feet","Screen Cleaner","Ice Body"] },
  "runerigus": { name: "Runerigus", types: ["Ground","Ghost"], baseStats: { hp: 58, atk: 95, def: 145, spa: 50, spd: 105, spe: 30 }, abilities: ["Wandering Spirit"] },
  "milcery": { name: "Milcery", types: ["Fairy"], baseStats: { hp: 45, atk: 40, def: 40, spa: 50, spd: 61, spe: 34 }, abilities: ["Sweet Veil","Aroma Veil"] },
  "alcremie-gmax": { name: "Alcremie-Gmax", types: ["Fairy"], baseStats: { hp: 65, atk: 60, def: 75, spa: 110, spd: 121, spe: 64 }, abilities: ["Sweet Veil","Aroma Veil"] },
  "falinks": { name: "Falinks", types: ["Fighting"], baseStats: { hp: 65, atk: 100, def: 100, spa: 70, spd: 60, spe: 75 }, abilities: ["Battle Armor","Defiant"] },
  "pincurchin": { name: "Pincurchin", types: ["Electric"], baseStats: { hp: 48, atk: 101, def: 95, spa: 91, spd: 85, spe: 15 }, abilities: ["Lightning Rod","Electric Surge"] },
  "snom": { name: "Snom", types: ["Ice","Bug"], baseStats: { hp: 30, atk: 25, def: 35, spa: 45, spd: 30, spe: 20 }, abilities: ["Shield Dust","Ice Scales"] },
  "frosmoth": { name: "Frosmoth", types: ["Ice","Bug"], baseStats: { hp: 70, atk: 65, def: 60, spa: 125, spd: 90, spe: 65 }, abilities: ["Shield Dust","Ice Scales"] },
  "stonjourner": { name: "Stonjourner", types: ["Rock"], baseStats: { hp: 100, atk: 125, def: 135, spa: 20, spd: 20, spe: 70 }, abilities: ["Power Spot"] },
  "eiscue": { name: "Eiscue", types: ["Ice"], baseStats: { hp: 75, atk: 80, def: 110, spa: 65, spd: 90, spe: 50 }, abilities: ["Ice Face"] },
  "eiscue-noice": { name: "Eiscue-Noice", types: ["Ice"], baseStats: { hp: 75, atk: 80, def: 70, spa: 65, spd: 50, spe: 130 }, abilities: ["Ice Face"] },
  "morpeko": { name: "Morpeko", types: ["Electric","Dark"], baseStats: { hp: 58, atk: 95, def: 58, spa: 70, spd: 58, spe: 97 }, abilities: ["Hunger Switch"] },
  "morpeko-hangry": { name: "Morpeko-Hangry", types: ["Electric","Dark"], baseStats: { hp: 58, atk: 95, def: 58, spa: 70, spd: 58, spe: 97 }, abilities: ["Hunger Switch"] },
  "cufant": { name: "Cufant", types: ["Steel"], baseStats: { hp: 72, atk: 80, def: 49, spa: 40, spd: 49, spe: 40 }, abilities: ["Sheer Force","Heavy Metal"] },
  "copperajah-gmax": { name: "Copperajah-Gmax", types: ["Steel"], baseStats: { hp: 122, atk: 130, def: 69, spa: 80, spd: 69, spe: 30 }, abilities: ["Sheer Force","Heavy Metal"] },
  "dracozolt": { name: "Dracozolt", types: ["Electric","Dragon"], baseStats: { hp: 90, atk: 100, def: 90, spa: 80, spd: 70, spe: 75 }, abilities: ["Volt Absorb","Hustle","Sand Rush"] },
  "arctozolt": { name: "Arctozolt", types: ["Electric","Ice"], baseStats: { hp: 90, atk: 100, def: 90, spa: 90, spd: 80, spe: 55 }, abilities: ["Volt Absorb","Static","Slush Rush"] },
  "dracovish": { name: "Dracovish", types: ["Water","Dragon"], baseStats: { hp: 90, atk: 90, def: 100, spa: 70, spd: 80, spe: 75 }, abilities: ["Water Absorb","Strong Jaw","Sand Rush"] },
  "arctovish": { name: "Arctovish", types: ["Water","Ice"], baseStats: { hp: 90, atk: 90, def: 100, spa: 80, spd: 90, spe: 55 }, abilities: ["Water Absorb","Ice Body","Slush Rush"] },
  "duraludon-gmax": { name: "Duraludon-Gmax", types: ["Steel","Dragon"], baseStats: { hp: 70, atk: 95, def: 115, spa: 120, spd: 50, spe: 85 }, abilities: ["Light Metal","Heavy Metal","Stalwart"] },
  "dreepy": { name: "Dreepy", types: ["Dragon","Ghost"], baseStats: { hp: 28, atk: 60, def: 30, spa: 40, spd: 30, spe: 82 }, abilities: ["Clear Body","Infiltrator","Cursed Body"] },
  "drakloak": { name: "Drakloak", types: ["Dragon","Ghost"], baseStats: { hp: 68, atk: 80, def: 50, spa: 60, spd: 50, spe: 102 }, abilities: ["Clear Body","Infiltrator","Cursed Body"] },
  "eternatus-eternamax": { name: "Eternatus-Eternamax", types: ["Poison","Dragon"], baseStats: { hp: 255, atk: 115, def: 250, spa: 125, spd: 250, spe: 130 }, abilities: ["Pressure"] },
  "kubfu": { name: "Kubfu", types: ["Fighting"], baseStats: { hp: 60, atk: 90, def: 60, spa: 53, spd: 50, spe: 72 }, abilities: ["Inner Focus"] },
  "urshifu-gmax": { name: "Urshifu-Gmax", types: ["Fighting","Dark"], baseStats: { hp: 100, atk: 130, def: 100, spa: 63, spd: 60, spe: 97 }, abilities: ["Unseen Fist"] },
  "urshifu-rapid-strike-gmax": { name: "Urshifu-Rapid-Strike-Gmax", types: ["Fighting","Water"], baseStats: { hp: 100, atk: 130, def: 100, spa: 63, spd: 60, spe: 97 }, abilities: ["Unseen Fist"] },
  "zarude": { name: "Zarude", types: ["Dark","Grass"], baseStats: { hp: 105, atk: 120, def: 105, spa: 70, spd: 95, spe: 105 }, abilities: ["Leaf Guard"] },
  "zarude-dada": { name: "Zarude-Dada", types: ["Dark","Grass"], baseStats: { hp: 105, atk: 120, def: 105, spa: 70, spd: 95, spe: 105 }, abilities: ["Leaf Guard"] },
  "ursaluna-bloodmoon": { name: "Ursaluna-Bloodmoon", types: ["Ground","Normal"], baseStats: { hp: 113, atk: 70, def: 120, spa: 135, spd: 65, spe: 52 }, abilities: ["Mind's Eye"] },
  "basculegion-f": { name: "Basculegion-F", types: ["Water","Ghost"], baseStats: { hp: 120, atk: 92, def: 65, spa: 100, spd: 75, spe: 78 }, abilities: ["Swift Swim","Adaptability","Mold Breaker"] },
  "sprigatito": { name: "Sprigatito", types: ["Grass"], baseStats: { hp: 40, atk: 61, def: 54, spa: 45, spd: 45, spe: 65 }, abilities: ["Overgrow","Protean"] },
  "floragato": { name: "Floragato", types: ["Grass"], baseStats: { hp: 61, atk: 80, def: 63, spa: 60, spd: 63, spe: 83 }, abilities: ["Overgrow","Protean"] },
  "meowscarada": { name: "Meowscarada", types: ["Grass","Dark"], baseStats: { hp: 76, atk: 110, def: 70, spa: 81, spd: 70, spe: 123 }, abilities: ["Overgrow","Protean"] },
  "fuecoco": { name: "Fuecoco", types: ["Fire"], baseStats: { hp: 67, atk: 45, def: 59, spa: 63, spd: 40, spe: 36 }, abilities: ["Blaze","Unaware"] },
  "crocalor": { name: "Crocalor", types: ["Fire"], baseStats: { hp: 81, atk: 55, def: 78, spa: 90, spd: 58, spe: 49 }, abilities: ["Blaze","Unaware"] },
  "quaxly": { name: "Quaxly", types: ["Water"], baseStats: { hp: 55, atk: 65, def: 45, spa: 50, spd: 45, spe: 50 }, abilities: ["Torrent","Moxie"] },
  "quaxwell": { name: "Quaxwell", types: ["Water"], baseStats: { hp: 70, atk: 85, def: 65, spa: 65, spd: 60, spe: 65 }, abilities: ["Torrent","Moxie"] },
  "quaquaval": { name: "Quaquaval", types: ["Water","Fighting"], baseStats: { hp: 85, atk: 120, def: 80, spa: 85, spd: 75, spe: 85 }, abilities: ["Torrent","Moxie"] },
  "lechonk": { name: "Lechonk", types: ["Normal"], baseStats: { hp: 54, atk: 45, def: 40, spa: 35, spd: 45, spe: 35 }, abilities: ["Aroma Veil","Gluttony","Thick Fat"] },
  "oinkologne": { name: "Oinkologne", types: ["Normal"], baseStats: { hp: 110, atk: 100, def: 75, spa: 59, spd: 80, spe: 65 }, abilities: ["Lingering Aroma","Gluttony","Thick Fat"] },
  "oinkologne-f": { name: "Oinkologne-F", types: ["Normal"], baseStats: { hp: 115, atk: 90, def: 70, spa: 59, spd: 90, spe: 65 }, abilities: ["Aroma Veil","Gluttony","Thick Fat"] },
  "tarountula": { name: "Tarountula", types: ["Bug"], baseStats: { hp: 35, atk: 41, def: 45, spa: 29, spd: 40, spe: 20 }, abilities: ["Insomnia","Stakeout"] },
  "spidops": { name: "Spidops", types: ["Bug"], baseStats: { hp: 60, atk: 79, def: 92, spa: 52, spd: 86, spe: 35 }, abilities: ["Insomnia","Stakeout"] },
  "nymble": { name: "Nymble", types: ["Bug"], baseStats: { hp: 33, atk: 46, def: 40, spa: 21, spd: 25, spe: 45 }, abilities: ["Swarm","Tinted Lens"] },
  "lokix": { name: "Lokix", types: ["Bug","Dark"], baseStats: { hp: 71, atk: 102, def: 78, spa: 52, spd: 55, spe: 92 }, abilities: ["Swarm","Tinted Lens"] },
  "pawmi": { name: "Pawmi", types: ["Electric"], baseStats: { hp: 45, atk: 50, def: 20, spa: 40, spd: 25, spe: 60 }, abilities: ["Static","Natural Cure","Iron Fist"] },
  "pawmo": { name: "Pawmo", types: ["Electric","Fighting"], baseStats: { hp: 60, atk: 75, def: 40, spa: 50, spd: 40, spe: 85 }, abilities: ["Volt Absorb","Natural Cure","Iron Fist"] },
  "tandemaus": { name: "Tandemaus", types: ["Normal"], baseStats: { hp: 50, atk: 50, def: 45, spa: 40, spd: 45, spe: 75 }, abilities: ["Run Away","Pickup","Own Tempo"] },
  "maushold-four": { name: "Maushold-Four", types: ["Normal"], baseStats: { hp: 74, atk: 75, def: 70, spa: 65, spd: 75, spe: 111 }, abilities: ["Friend Guard","Cheek Pouch","Technician"] },
  "fidough": { name: "Fidough", types: ["Fairy"], baseStats: { hp: 37, atk: 55, def: 70, spa: 30, spd: 55, spe: 65 }, abilities: ["Own Tempo","Klutz"] },
  "smoliv": { name: "Smoliv", types: ["Grass","Normal"], baseStats: { hp: 41, atk: 35, def: 45, spa: 58, spd: 51, spe: 30 }, abilities: ["Early Bird","Harvest"] },
  "dolliv": { name: "Dolliv", types: ["Grass","Normal"], baseStats: { hp: 52, atk: 53, def: 60, spa: 78, spd: 78, spe: 33 }, abilities: ["Early Bird","Harvest"] },
  "squawkabilly": { name: "Squawkabilly", types: ["Normal","Flying"], baseStats: { hp: 82, atk: 96, def: 51, spa: 45, spd: 51, spe: 92 }, abilities: ["Intimidate","Hustle","Guts"] },
  "squawkabilly-blue": { name: "Squawkabilly-Blue", types: ["Normal","Flying"], baseStats: { hp: 82, atk: 96, def: 51, spa: 45, spd: 51, spe: 92 }, abilities: ["Intimidate","Hustle","Guts"] },
  "squawkabilly-yellow": { name: "Squawkabilly-Yellow", types: ["Normal","Flying"], baseStats: { hp: 82, atk: 96, def: 51, spa: 45, spd: 51, spe: 92 }, abilities: ["Intimidate","Hustle","Sheer Force"] },
  "squawkabilly-white": { name: "Squawkabilly-White", types: ["Normal","Flying"], baseStats: { hp: 82, atk: 96, def: 51, spa: 45, spd: 51, spe: 92 }, abilities: ["Intimidate","Hustle","Sheer Force"] },
  "nacli": { name: "Nacli", types: ["Rock"], baseStats: { hp: 55, atk: 55, def: 75, spa: 35, spd: 35, spe: 25 }, abilities: ["Purifying Salt","Sturdy","Clear Body"] },
  "naclstack": { name: "Naclstack", types: ["Rock"], baseStats: { hp: 60, atk: 60, def: 100, spa: 35, spd: 65, spe: 35 }, abilities: ["Purifying Salt","Sturdy","Clear Body"] },
  "charcadet": { name: "Charcadet", types: ["Fire"], baseStats: { hp: 40, atk: 50, def: 40, spa: 50, spd: 40, spe: 35 }, abilities: ["Flash Fire","Flame Body"] },
  "tadbulb": { name: "Tadbulb", types: ["Electric"], baseStats: { hp: 61, atk: 31, def: 41, spa: 59, spd: 35, spe: 45 }, abilities: ["Own Tempo","Static","Damp"] },
  "wattrel": { name: "Wattrel", types: ["Electric","Flying"], baseStats: { hp: 40, atk: 40, def: 35, spa: 55, spd: 40, spe: 70 }, abilities: ["Wind Power","Volt Absorb","Competitive"] },
  "maschiff": { name: "Maschiff", types: ["Dark"], baseStats: { hp: 60, atk: 78, def: 60, spa: 40, spd: 51, spe: 51 }, abilities: ["Intimidate","Run Away","Stakeout"] },
  "mabosstiff": { name: "Mabosstiff", types: ["Dark"], baseStats: { hp: 80, atk: 120, def: 90, spa: 60, spd: 70, spe: 85 }, abilities: ["Intimidate","Guard Dog","Stakeout"] },
  "shroodle": { name: "Shroodle", types: ["Poison","Normal"], baseStats: { hp: 40, atk: 65, def: 35, spa: 40, spd: 35, spe: 75 }, abilities: ["Unburden","Pickpocket","Prankster"] },
  "bramblin": { name: "Bramblin", types: ["Grass","Ghost"], baseStats: { hp: 40, atk: 65, def: 30, spa: 45, spd: 35, spe: 60 }, abilities: ["Wind Rider","Infiltrator"] },
  "toedscool": { name: "Toedscool", types: ["Ground","Grass"], baseStats: { hp: 40, atk: 40, def: 35, spa: 50, spd: 100, spe: 70 }, abilities: ["Mycelium Might"] },
  "klawf": { name: "Klawf", types: ["Rock"], baseStats: { hp: 70, atk: 100, def: 115, spa: 35, spd: 55, spe: 75 }, abilities: ["Anger Shell","Shell Armor","Regenerator"] },
  "capsakid": { name: "Capsakid", types: ["Grass"], baseStats: { hp: 50, atk: 62, def: 40, spa: 62, spd: 40, spe: 50 }, abilities: ["Chlorophyll","Insomnia","Klutz"] },
  "scovillain": { name: "Scovillain", types: ["Grass","Fire"], baseStats: { hp: 65, atk: 108, def: 65, spa: 108, spd: 65, spe: 75 }, abilities: ["Chlorophyll","Insomnia","Moody"] },
  "rellor": { name: "Rellor", types: ["Bug"], baseStats: { hp: 41, atk: 50, def: 60, spa: 31, spd: 58, spe: 30 }, abilities: ["Compound Eyes","Shed Skin"] },
  "flittle": { name: "Flittle", types: ["Psychic"], baseStats: { hp: 30, atk: 35, def: 30, spa: 55, spd: 30, spe: 75 }, abilities: ["Anticipation","Frisk","Speed Boost"] },
  "tinkatink": { name: "Tinkatink", types: ["Fairy","Steel"], baseStats: { hp: 50, atk: 45, def: 45, spa: 35, spd: 64, spe: 58 }, abilities: ["Mold Breaker","Own Tempo","Pickpocket"] },
  "tinkatuff": { name: "Tinkatuff", types: ["Fairy","Steel"], baseStats: { hp: 65, atk: 55, def: 55, spa: 45, spd: 82, spe: 78 }, abilities: ["Mold Breaker","Own Tempo","Pickpocket"] },
  "wiglett": { name: "Wiglett", types: ["Water"], baseStats: { hp: 10, atk: 55, def: 25, spa: 35, spd: 25, spe: 95 }, abilities: ["Gooey","Rattled","Sand Veil"] },
  "wugtrio": { name: "Wugtrio", types: ["Water"], baseStats: { hp: 35, atk: 100, def: 50, spa: 50, spd: 70, spe: 120 }, abilities: ["Gooey","Rattled","Sand Veil"] },
  "bombirdier": { name: "Bombirdier", types: ["Flying","Dark"], baseStats: { hp: 70, atk: 103, def: 85, spa: 60, spd: 85, spe: 82 }, abilities: ["Big Pecks","Keen Eye","Rocky Payload"] },
  "finizen": { name: "Finizen", types: ["Water"], baseStats: { hp: 70, atk: 45, def: 40, spa: 45, spd: 40, spe: 75 }, abilities: ["Water Veil"] },
  "palafin-hero": { name: "Palafin-Hero", types: ["Water"], baseStats: { hp: 100, atk: 160, def: 97, spa: 106, spd: 87, spe: 100 }, abilities: ["Zero to Hero"] },
  "varoom": { name: "Varoom", types: ["Steel","Poison"], baseStats: { hp: 45, atk: 70, def: 63, spa: 30, spd: 45, spe: 47 }, abilities: ["Overcoat","Slow Start"] },
  "glimmet": { name: "Glimmet", types: ["Rock","Poison"], baseStats: { hp: 48, atk: 35, def: 42, spa: 105, spd: 60, spe: 60 }, abilities: ["Toxic Debris","Corrosion"] },
  "glimmora": { name: "Glimmora", types: ["Rock","Poison"], baseStats: { hp: 83, atk: 55, def: 90, spa: 130, spd: 81, spe: 86 }, abilities: ["Toxic Debris","Corrosion"] },
  "greavard": { name: "Greavard", types: ["Ghost"], baseStats: { hp: 50, atk: 61, def: 60, spa: 30, spd: 55, spe: 34 }, abilities: ["Pickup","Fluffy"] },
  "houndstone": { name: "Houndstone", types: ["Ghost"], baseStats: { hp: 72, atk: 101, def: 100, spa: 50, spd: 97, spe: 68 }, abilities: ["Sand Rush","Fluffy"] },
  "cetoddle": { name: "Cetoddle", types: ["Ice"], baseStats: { hp: 108, atk: 68, def: 45, spa: 30, spd: 40, spe: 43 }, abilities: ["Thick Fat","Snow Cloak","Sheer Force"] },
  "cetitan": { name: "Cetitan", types: ["Ice"], baseStats: { hp: 170, atk: 113, def: 65, spa: 45, spd: 55, spe: 73 }, abilities: ["Thick Fat","Slush Rush","Sheer Force"] },
  "veluza": { name: "Veluza", types: ["Water","Psychic"], baseStats: { hp: 90, atk: 102, def: 73, spa: 78, spd: 65, spe: 70 }, abilities: ["Mold Breaker","Sharpness"] },
  "tatsugiri-droopy": { name: "Tatsugiri-Droopy", types: ["Dragon","Water"], baseStats: { hp: 68, atk: 50, def: 60, spa: 120, spd: 95, spe: 82 }, abilities: ["Commander","Storm Drain"] },
  "tatsugiri-stretchy": { name: "Tatsugiri-Stretchy", types: ["Dragon","Water"], baseStats: { hp: 68, atk: 50, def: 60, spa: 120, spd: 95, spe: 82 }, abilities: ["Commander","Storm Drain"] },
  "clodsire": { name: "Clodsire", types: ["Poison","Ground"], baseStats: { hp: 130, atk: 75, def: 60, spa: 45, spd: 100, spe: 20 }, abilities: ["Poison Point","Water Absorb","Unaware"] },
  "dudunsparce": { name: "Dudunsparce", types: ["Normal"], baseStats: { hp: 125, atk: 100, def: 80, spa: 85, spd: 75, spe: 55 }, abilities: ["Serene Grace","Run Away","Rattled"] },
  "dudunsparce-three-segment": { name: "Dudunsparce-Three-Segment", types: ["Normal"], baseStats: { hp: 125, atk: 100, def: 80, spa: 85, spd: 75, spe: 55 }, abilities: ["Serene Grace","Run Away","Rattled"] },
  "frigibax": { name: "Frigibax", types: ["Dragon","Ice"], baseStats: { hp: 65, atk: 75, def: 45, spa: 35, spd: 45, spe: 55 }, abilities: ["Thermal Exchange","Ice Body"] },
  "arctibax": { name: "Arctibax", types: ["Dragon","Ice"], baseStats: { hp: 90, atk: 95, def: 66, spa: 45, spd: 65, spe: 62 }, abilities: ["Thermal Exchange","Ice Body"] },
  "gimmighoul": { name: "Gimmighoul", types: ["Ghost"], baseStats: { hp: 45, atk: 30, def: 70, spa: 75, spd: 70, spe: 10 }, abilities: ["Rattled"] },
  "gimmighoul-roaming": { name: "Gimmighoul-Roaming", types: ["Ghost"], baseStats: { hp: 45, atk: 30, def: 25, spa: 75, spd: 45, spe: 80 }, abilities: ["Run Away"] },
  "dipplin": { name: "Dipplin", types: ["Grass","Dragon"], baseStats: { hp: 80, atk: 80, def: 110, spa: 95, spd: 80, spe: 40 }, abilities: ["Supersweet Syrup","Gluttony","Sticky Hold"] },
  "poltchageist": { name: "Poltchageist", types: ["Grass","Ghost"], baseStats: { hp: 40, atk: 45, def: 45, spa: 74, spd: 54, spe: 50 }, abilities: ["Hospitality","Heatproof"] },
  "poltchageist-artisan": { name: "Poltchageist-Artisan", types: ["Grass","Ghost"], baseStats: { hp: 40, atk: 45, def: 45, spa: 74, spd: 54, spe: 50 }, abilities: ["Hospitality","Heatproof"] },
  "sinistcha-masterpiece": { name: "Sinistcha-Masterpiece", types: ["Grass","Ghost"], baseStats: { hp: 71, atk: 60, def: 106, spa: 121, spd: 80, spe: 70 }, abilities: ["Hospitality","Heatproof"] },
  "ogerpon-teal-tera": { name: "Ogerpon-Teal-Tera", types: ["Grass"], baseStats: { hp: 80, atk: 120, def: 84, spa: 60, spd: 96, spe: 110 }, abilities: ["Embody Aspect (Teal)"] },
  "ogerpon-wellspring-tera": { name: "Ogerpon-Wellspring-Tera", types: ["Grass","Water"], baseStats: { hp: 80, atk: 120, def: 84, spa: 60, spd: 96, spe: 110 }, abilities: ["Embody Aspect (Wellspring)"] },
  "ogerpon-hearthflame-tera": { name: "Ogerpon-Hearthflame-Tera", types: ["Grass","Fire"], baseStats: { hp: 80, atk: 120, def: 84, spa: 60, spd: 96, spe: 110 }, abilities: ["Embody Aspect (Hearthflame)"] },
  "ogerpon-cornerstone-tera": { name: "Ogerpon-Cornerstone-Tera", types: ["Grass","Rock"], baseStats: { hp: 80, atk: 120, def: 84, spa: 60, spd: 96, spe: 110 }, abilities: ["Embody Aspect (Cornerstone)"] },
  "terapagos-terastal": { name: "Terapagos-Terastal", types: ["Normal"], baseStats: { hp: 95, atk: 95, def: 110, spa: 105, spd: 110, spe: 85 }, abilities: ["Tera Shell"] },
  "terapagos-stellar": { name: "Terapagos-Stellar", types: ["Normal"], baseStats: { hp: 160, atk: 105, def: 110, spa: 130, spd: 110, spe: 85 }, abilities: ["Teraform Zero"] },
};

/**
 * Cosmetic-only form suffixes — these Pokemon have identical stats, types,
 * and abilities across every variant, so Showdown names like `Gastrodon-East`
 * or `Deerling-Winter` should resolve to the base entry.
 *
 * ONLY high-confidence suffixes live here. Generic color words (red, blue,
 * yellow, etc.) are deliberately excluded because they collide with real
 * species keys (`squawkabilly-blue`, `basculin-blue-striped`, etc.). Anything
 * that changes stats or typing — Mega, Alola, Galar, Hisui, Paldea, Origin,
 * Therian, Single-Strike, Crowned, Wormadam forms — MUST NOT be in this set;
 * those need their own POKEMON_DATA entries.
 */
const COSMETIC_FORM_SUFFIXES = new Set<string>([
  // Shellos, Gastrodon — classic cosmetic split
  "east", "west",
  // Deerling, Sawsbuck — seasonal forms are purely visual
  "spring", "summer", "autumn", "winter",
]);

export function lookupPokemon(species: string): PokemonData | null {
  const key = species
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
  const direct = POKEMON_DATA[key];
  if (direct) return direct;

  // Cosmetic-form fallback: strip a trailing cosmetic suffix and retry.
  // e.g. `gastrodon-east` → `gastrodon`, `deerling-winter` → `deerling`.
  const parts = key.split("-");
  if (parts.length >= 2) {
    const tail = parts[parts.length - 1];
    if (COSMETIC_FORM_SUFFIXES.has(tail)) {
      const base = parts.slice(0, -1).join("-");
      const collapsed = POKEMON_DATA[base];
      if (collapsed) return collapsed;
    }
  }

  // Dynamic fallback — anything not in our hand-maintained map (new Champions
  // forms, obscure regional variants, future patches) resolves against the
  // canonical @pkmn/dex dataset so the UI never silently loses a spread.
  return lookupPokemonFromDex(species);
}
