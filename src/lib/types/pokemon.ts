export type PokemonType =
  | "Normal" | "Fire" | "Water" | "Electric" | "Grass" | "Ice"
  | "Fighting" | "Poison" | "Ground" | "Flying" | "Psychic" | "Bug"
  | "Rock" | "Ghost" | "Dragon" | "Dark" | "Steel" | "Fairy";

/**
 * Tera types are the 18 standard types plus Stellar. Stellar is Tera-only: it
 * is not a defensive typing and has no row/column in the 18x18 effectiveness
 * chart, so it deliberately lives outside `PokemonType` — widening that union
 * would force a meaningless Stellar entry into every type-chart `Record` and
 * risk wrong effectiveness maths. Keep Stellar out of defensive/effectiveness
 * calculations; it only ever affects display and offensive Tera behaviour.
 */
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
