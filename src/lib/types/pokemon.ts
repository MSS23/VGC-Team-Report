export type PokemonType =
  | "Normal" | "Fire" | "Water" | "Electric" | "Grass" | "Ice"
  | "Fighting" | "Poison" | "Ground" | "Flying" | "Psychic" | "Bug"
  | "Rock" | "Ghost" | "Dragon" | "Dark" | "Steel" | "Fairy";

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
  teraType: PokemonType | null;
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
