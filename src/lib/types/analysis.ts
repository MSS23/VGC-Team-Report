export interface AnalyzedPokemon {
  parsed: import("./pokemon").ParsedPokemon;
  data: import("./pokemon").PokemonData | null;
  calculatedStats: import("./pokemon").StatSpread;
  itemBoost: import("../analysis/item-boosts").StatBoost | null;
}

export interface TeamAnalysis {
  pokemon: AnalyzedPokemon[];
}
