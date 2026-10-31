import { calculate, Field, Generations, Move, Pokemon, toID } from "@smogon/calc";
import type { State } from "@smogon/calc";
import type { ParsedPokemon } from "@/lib/types/pokemon";
import { isChampionsFormat } from "@/lib/data/tags";
import { convertToChampionsSp } from "./stat-calculator";

export interface DamageOptions {
  regulation?: string;
  attackerTera?: boolean;
  defenderTera?: boolean;
  field?: Partial<State.Field>;
}

export function createCalcPokemon(parsed: ParsedPokemon, regulation?: string, tera = false): Pokemon {
  const champions = isChampionsFormat(regulation);
  const gen = Generations.get(champions ? 0 : 9);
  const species = gen.species.get(toID(parsed.species));
  if (!species) throw new Error(`${parsed.species} is not supported in this format.`);
  if (!gen.natures.get(toID(parsed.nature))) throw new Error(`Unknown nature: ${parsed.nature}`);
  if (parsed.ability && !gen.abilities.get(toID(parsed.ability))) throw new Error(`Unknown ability: ${parsed.ability}`);
  if (parsed.item && !gen.items.get(toID(parsed.item))) throw new Error(`Unknown item: ${parsed.item}`);
  return new Pokemon(gen, species.name, {
    level: 50,
    nature: parsed.nature,
    ability: parsed.ability ?? undefined,
    item: parsed.item ?? undefined,
    ivs: { ...parsed.ivs },
    // The calculator's Champions generation takes SP in its evs field.
    evs: champions ? convertToChampionsSp(parsed.evs) : { ...parsed.evs },
    teraType: !champions && tera ? parsed.teraType ?? undefined : undefined,
  });
}

export function calculateReportDamage(attacker: ParsedPokemon, defender: ParsedPokemon, moveName: string, options: DamageOptions = {}) {
  const gen = Generations.get(isChampionsFormat(options.regulation) ? 0 : 9);
  const moveData = gen.moves.get(toID(moveName));
  if (!moveData) throw new Error(`Unknown move: ${moveName}`);
  if (moveData.category === "Status") throw new Error(`${moveName} does not deal direct damage.`);
  const attack = createCalcPokemon(attacker, options.regulation, options.attackerTera);
  const defend = createCalcPokemon(defender, options.regulation, options.defenderTera);
  const move = new Move(gen, moveData.name, { ability: attack.ability, item: attack.item, species: attack.name });
  const result = calculate(gen, attack, defend, move, new Field({ gameType: "Doubles", ...options.field }));
  const [min, max] = result.range();
  const hp = result.defender.maxHP();
  return {
    min, max, hp,
    minPercent: Math.floor(min / hp * 1000) / 10,
    maxPercent: Math.floor(max / hp * 1000) / 10,
    description: max === 0
      ? `${attacker.species} ${moveName} vs. ${defender.species}: 0 (0%) — immune`
      : result.desc(),
    survival: max < hp ? "Survives every damage roll from full HP" : min >= hp ? "Guaranteed KO from full HP" : "A KO is possible from full HP",
  };
}

export function getCalcSpecies(regulation?: string): string[] {
  return Array.from(Generations.get(isChampionsFormat(regulation) ? 0 : 9).species, (s) => s.name).sort();
}
