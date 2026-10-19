export type PokemonType =
  | "Normal" | "Fire" | "Water" | "Electric" | "Grass" | "Ice"
  | "Fighting" | "Poison" | "Ground" | "Flying" | "Psychic" | "Bug"
  | "Rock" | "Ghost" | "Dragon" | "Dark" | "Steel" | "Fairy";

// A Tera type is one of the 18 battle types, or Stellar. Stellar is NOT a 19th
// elemental type: it has no type-chart row and Terastallizing into it leaves
// the Pokemon's defensive typing untouched (it only changes offence). So it
// lives here rather than in PokemonType, which keeps every defensive code path
// (type chart, weaknesses, coverage) limited to the 18 real types.
export type TeraType = PokemonType | "Stellar";

export type StatName = "hp" | "atk" | "def" | "spa" | "spd" | "spe";

export interface StatSpread {
  hp: number;
  atk: number;
  def: number;
  spa: number;
  spd: number;
  spe: number;
}

export interface ParsedPokemon {
  species: string;
  nickname: string | null;
  gender: "M" | "F" | null;
  item: string | null;
  ability: string | null;
  level: number;
  teraType: TeraType | null;
  shiny: boolean;
  evs: StatSpread;
  ivs: StatSpread;
  nature: string;
  moves: string[];
}

export interface ParsedTeam {
  pokemon: ParsedPokemon[];
  warnings: string[];
  teamName?: string;
}

export interface PokemonData {
  name: string;
  types: [PokemonType] | [PokemonType, PokemonType];
  baseStats: StatSpread;
  abilities: string[];
}
