import { Generations, toID } from "@smogon/calc";
import { calculateReportDamage } from "./damage-calculator";
import { isChampionsFormat } from "@/lib/data/tags";
import { getDefensiveProfile, TYPE_CHART } from "@/lib/data/type-chart";
import { lookupPokemon } from "@/lib/data/pokemon";
import type { ParsedPokemon, PokemonType } from "@/lib/types/pokemon";

export interface ThreatCell {
  move: string;
  damage: ReturnType<typeof calculateReportDamage> | null;
  errors: string[];
}

export function buildThreatMatrix(attackers: ParsedPokemon[], defenders: ParsedPokemon[], regulation?: string): ThreatCell[][] {
  const gen = Generations.get(isChampionsFormat(regulation) ? 0 : 9);
  return attackers.slice(0, 6).map((attacker) => defenders.slice(0, 6).map((defender) => {
    let best: ThreatCell = { move: "", damage: null, errors: [] };
    for (const move of attacker.moves) {
      if (gen.moves.get(toID(move))?.category === "Status") continue;
      try {
        const damage = calculateReportDamage(attacker, defender, move, { regulation });
        if (!best.damage || damage.maxPercent > best.damage.maxPercent) best = { ...best, move, damage };
      } catch (error) {
        best.errors.push(error instanceof Error ? error.message : `Cannot calculate ${move}`);
      }
    }
    return best;
  }));
}

export function findCoverageGaps(matrix: ThreatCell[][], defenders: ParsedPokemon[]) {
  return defenders.map((pokemon, index) => {
    const cells = matrix.map((row) => row[index]);
    // Unknown calculations must never be presented as confirmed coverage gaps.
    if (cells.some((cell) => !cell || cell.errors.length || (cell.damage?.maxPercent ?? 0) >= 50)) return null;
    const data = lookupPokemon(pokemon.species);
    const profile = data ? getDefensiveProfile([...data.types], pokemon.ability) : null;
    const types = profile ? (Object.keys(TYPE_CHART) as PokemonType[]).filter((type) => profile[type] > 1) : [];
    return { species: pokemon.species, types };
  }).filter((gap) => gap !== null);
}

export function defensiveWeaknesses(team: ParsedPokemon[]) {
  return (Object.keys(TYPE_CHART) as PokemonType[]).map((type) => ({
    type,
    members: team.filter((p) => {
      const data = lookupPokemon(p.species);
      return data && getDefensiveProfile([...data.types], p.ability)[type] > 1;
    }).map((p) => p.species),
  })).filter(({ members }) => members.length >= 2).sort((a, b) => b.members.length - a.members.length);
}
