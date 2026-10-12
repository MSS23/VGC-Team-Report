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

/**
 * Which unit a spread stored in `ParsedPokemon.evs` is expressed in.
 *
 *  - `"ev"` — classic EVs: 0–252 per stat, 510 usable total.
 *  - `"sp"` — Pokemon Champions Stat Points: 0–32 per stat, 66 total.
 *
 * Showdown has no `SPs:` line, so Champions pastes carry SP values inside the
 * `EVs:` line and the two units are indistinguishable by shape alone once
 * every value happens to be ≤ 32 (`EVs: 33 HP / 10 Atk` reads as EVs only
 * because of the 33). Carrying the unit explicitly removes that guess.
 */
export type StatForm = "ev" | "sp";

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
  /**
   * The unit `evs` is expressed in (VGC-291). Set explicitly by
   * `parseShowdownPaste` from the regulation plus the paste's shape, so no
   * consumer has to re-infer it from per-stat magnitude.
   *
   * **Optional on purpose.** Reports shared before VGC-291 were persisted
   * without it, and reading one back must neither throw nor change its
   * rendered numbers. Always read it through `resolveStatForm` /
   * `resolveTeamStatForm` (`@/lib/analysis/stat-calculator`), which treat the
   * explicit value as authoritative when present and fall back to the legacy
   * magnitude heuristic when it is absent.
   */
  statForm?: StatForm;
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
