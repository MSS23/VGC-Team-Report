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
  /**
   * Which unit the `evs` spread is written in: traditional EVs or Champions
   * Stat Points (SP). A Showdown paste writes both on the same `EVs:` line,
   * so the unit cannot be recovered from the numbers alone — `EVs: 33 HP`
   * is a legal EV spread and an illegal SP spread that look identical to a
   * shape check. The parser sets this authoritatively when it is told the
   * regulation; otherwise it falls back to shape inference
   * (`isSpFormSpread`). Optional so existing construction sites still
   * compile (VGC-291).
   */
  statForm?: "ev" | "sp";
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
