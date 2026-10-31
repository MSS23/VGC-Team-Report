import { Generations, toID } from "@smogon/calc";
import type { ParsedPokemon, StatName, StatSpread } from "@/lib/types/pokemon";
import { isChampionsFormat } from "@/lib/data/tags";
import { calculateReportDamage, createCalcPokemon } from "./damage-calculator";
import { calculateAllChampionsStats, calculateAllStats, convertToChampionsSp } from "./stat-calculator";

export const SPREAD_STATS: StatName[] = ["hp", "atk", "def", "spa", "spd", "spe"];
export const spreadTotal = (spread: StatSpread) => SPREAD_STATS.reduce((sum, stat) => sum + spread[stat], 0);
export function spreadRules(regulation?: string) {
  return isChampionsFormat(regulation) ? { max: 32, total: 66, step: 1, unit: "SP" } : { max: 252, total: 510, step: 4, unit: "EVs" };
}
export function initialSpread(pokemon: ParsedPokemon, regulation?: string): StatSpread {
  return isChampionsFormat(regulation) ? convertToChampionsSp(pokemon.evs) : { ...pokemon.evs };
}
/**
 * Regulation-aware stats for display. The single helper every report surface
 * should use when it needs the numbers a player sees on the card.
 *
 * Champions (Reg M-A/M-B/M-C) spends **SP**, not EVs, so running the EV
 * formula over a Champions paste misreads the SP values in the `EVs:` line as
 * EVs and lands badly low — a Timid Dragapult (base 142 Spe) reads 182 Speed
 * instead of 213 (VGC-292). Mirrors the SP path `PokemonCard` and
 * `SpeedTierChart` already take: `convertToChampionsSp` + the SP formula,
 * which fixes IVs at 31 and level at 50.
 *
 * Deliberately NOT routed through `spreadStats`/`createCalcPokemon`: those go
 * through @smogon/calc at gen 0, which can disagree with the local dex.
 */
export function displayStats(
  pokemon: Pick<ParsedPokemon, "evs" | "ivs" | "level" | "nature">,
  baseStats: StatSpread,
  regulation?: string,
): StatSpread {
  if (isChampionsFormat(regulation)) {
    return calculateAllChampionsStats(baseStats, convertToChampionsSp(pokemon.evs), pokemon.nature);
  }
  return calculateAllStats(baseStats, pokemon.ivs, pokemon.evs, pokemon.level, pokemon.nature);
}

export function spreadStats(pokemon: ParsedPokemon, spread: StatSpread, regulation?: string) {
  return createCalcPokemon({ ...pokemon, evs: spread }, regulation).rawStats;
}
export function wastedInvestment(pokemon: ParsedPokemon, spread: StatSpread, regulation?: string): StatSpread {
  const target = spreadStats(pokemon, spread, regulation);
  const wasted = { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };
  for (const stat of SPREAD_STATS) {
    for (let value = 0; value < spread[stat]; value++) {
      if (spreadStats(pokemon, { ...spread, [stat]: value }, regulation)[stat] === target[stat]) {
        wasted[stat] = spread[stat] - value;
        break;
      }
    }
  }
  return wasted;
}
function benchmarkSpeed(pokemon: ParsedPokemon, spread: StatSpread, boost: number, regulation?: string) {
  const stage = Math.max(-6, Math.min(6, boost));
  const multiplier = stage >= 0 ? (2 + stage) / 2 : 2 / (2 - stage);
  const staged = Math.floor(spreadStats(pokemon, spread, regulation).spe * multiplier);
  return Math.floor(staged * (pokemon.item === "Choice Scarf" ? 1.5 : 1));
}
export interface SpreadBenchmark {
  opponent: ParsedPokemon;
  move: string;
  survive: boolean;
  outspeed: boolean;
  speedBoost: number;
}
export function evaluateSpread(pokemon: ParsedPokemon, spread: StatSpread, benchmark: SpreadBenchmark, regulation?: string) {
  const damage = benchmark.survive ? calculateReportDamage(benchmark.opponent, { ...pokemon, evs: spread }, benchmark.move, { regulation }) : null;
  const speed = benchmarkSpeed(pokemon, spread, benchmark.speedBoost, regulation);
  const opponentSpeed = benchmarkSpeed(benchmark.opponent, initialSpread(benchmark.opponent, regulation), 0, regulation);
  return { damage, speed, opponentSpeed, survives: !damage || damage.max < damage.hp, outspeeds: speed > opponentSpeed };
}

/** Minimum HP + relevant defense + speed cost, holding nature and other investments fixed. */
export function suggestSpread(pokemon: ParsedPokemon, current: StatSpread, benchmark: SpreadBenchmark, regulation?: string): StatSpread | null {
  if (!benchmark.survive && !benchmark.outspeed) throw new Error("Choose at least one benchmark.");
  const rules = spreadRules(regulation);
  const gen = Generations.get(isChampionsFormat(regulation) ? 0 : 9);
  const move = gen.moves.get(toID(benchmark.move));
  if (benchmark.survive && (!move || move.category === "Status")) throw new Error("Choose a supported damaging move.");
  const defense = move?.overrideDefensiveStat ?? (move?.category === "Physical" ? "def" : "spd");
  if (benchmark.survive && defense !== "def" && defense !== "spd") throw new Error("Automatic allocation does not support this move's defensive stat.");
  const seed = { ...current };
  if (benchmark.survive) { seed.hp = 0; seed[defense] = 0; }
  if (benchmark.outspeed) {
    const target = benchmarkSpeed(benchmark.opponent, initialSpread(benchmark.opponent, regulation), 0, regulation);
    let found = false;
    for (let spe = 0; spe <= rules.max; spe += rules.step) {
      seed.spe = spe;
      if (benchmarkSpeed(pokemon, seed, benchmark.speedBoost, regulation) > target) { found = true; break; }
    }
    if (!found) return null;
  }
  if (!benchmark.survive) return spreadTotal(seed) <= rules.total ? seed : null;
  const remaining = rules.total - spreadTotal(seed);
  for (let cost = 0; cost <= Math.min(remaining, rules.max * 2); cost += rules.step) {
    for (let hp = Math.max(0, cost - rules.max); hp <= Math.min(cost, rules.max); hp += rules.step) {
      const candidate = { ...seed, hp, [defense]: cost - hp };
      const damage = calculateReportDamage(benchmark.opponent, { ...pokemon, evs: candidate }, benchmark.move, { regulation });
      if (damage.max < damage.hp) return candidate;
    }
  }
  return null;
}
