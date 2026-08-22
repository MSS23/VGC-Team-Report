import { parseShowdownPaste } from "@/lib/parser/showdown-parser";
import { lookupPokemon } from "@/lib/data/pokemon";
import { calculateAllStats } from "@/lib/analysis/stat-calculator";
import { getItemStatBoost } from "@/lib/analysis/item-boosts";
import type { ParsedTeam } from "@/lib/types/pokemon";
import type { AnalyzedPokemon, TeamAnalysis } from "@/lib/types/analysis";

/**
 * Parse + analyze entry point, kept in one module so the parser and the big
 * Pokémon data tables (pokemon.ts + dex-subset.json, ~330KB raw) load as ONE
 * lazy chunk the first time a team is actually analyzed. Nothing on the
 * homepage's initial render path may import this module statically — that
 * would put the data back into every visitor's first paint. Import it with
 * `await import("@/lib/analysis/analyze-team")` from event handlers/effects.
 */
export { parseShowdownPaste };

export function analyzeTeam(parsedTeam: ParsedTeam): TeamAnalysis {
  const analyzedPokemon: AnalyzedPokemon[] = parsedTeam.pokemon.map((parsed) => {
    const data = lookupPokemon(parsed.species);
    const calculatedStats = data
      ? calculateAllStats(data.baseStats, parsed.ivs, parsed.evs, parsed.level, parsed.nature)
      : { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };

    const itemBoost = getItemStatBoost(parsed.item, parsed.ability, calculatedStats);

    return { parsed, data, calculatedStats, itemBoost };
  });

  return { pokemon: analyzedPokemon };
}
