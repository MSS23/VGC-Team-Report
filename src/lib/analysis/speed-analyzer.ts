import type { ParsedPokemon, PokemonData } from "@/lib/types/pokemon";
import { SPEED_BENCHMARKS } from "@/lib/data/speed-tiers";
import { calculateStat } from "./stat-calculator";
import { getNatureModifier } from "@/lib/data/natures";

interface SpeedAnalysis {
  simpleText: string;
  advancedText: string;
}

function getSpeedStat(pokemon: ParsedPokemon, data: PokemonData | null): number | null {
  if (!data) return null;
  return calculateStat("spe", data.baseStats.spe, pokemon.ivs.spe, pokemon.evs.spe, pokemon.level, pokemon.nature);
}

function isSpeedBoosted(pokemon: ParsedPokemon): boolean {
  return getNatureModifier(pokemon.nature, "spe") > 1;
}

function isSpeedReduced(pokemon: ParsedPokemon): boolean {
  return getNatureModifier(pokemon.nature, "spe") < 1;
}

function isTrickRoomCandidate(pokemon: ParsedPokemon): boolean {
  const hasTR = pokemon.moves.some(m => m.toLowerCase().includes("trick room"));
  const slowMoves = pokemon.moves.some(m =>
    ["gyro ball", "trick room"].includes(m.toLowerCase())
  );
  return (isSpeedReduced(pokemon) && pokemon.evs.spe === 0 && pokemon.ivs.spe === 0) ||
         (hasTR || slowMoves) && pokemon.evs.spe === 0;
}

export function analyzeSpeed(pokemon: ParsedPokemon, data: PokemonData | null): SpeedAnalysis {
  if (!data) {
    return {
      simpleText: "Speed data unavailable (Pokemon not in database).",
      advancedText: "Speed data unavailable (Pokemon not in database).",
    };
  }

  const speedStat = getSpeedStat(pokemon, data);
  if (speedStat === null) {
    return { simpleText: "Could not calculate speed.", advancedText: "Could not calculate speed." };
  }

  const speedEvs = pokemon.evs.spe;
  const speedIvs = pokemon.ivs.spe;
  const baseSpe = data.baseStats.spe;
  const boosted = isSpeedBoosted(pokemon);
  const reduced = isSpeedReduced(pokemon);

  // Find benchmarks this Pokemon outspeeds / is outsped by
  const outspeeds = SPEED_BENCHMARKS.filter(b => speedStat > b.maxNeutral && b.pokemon !== pokemon.species);
  const outspeededBy = SPEED_BENCHMARKS.filter(b => b.maxPositive > speedStat && b.pokemon !== pokemon.species);
  const exactMatches = SPEED_BENCHMARKS.filter(b =>
    speedStat >= b.maxNeutral && speedStat <= b.maxPositive && b.pokemon !== pokemon.species
  );

  // Trick Room analysis
  if (isTrickRoomCandidate(pokemon)) {
    const underspeedBenchmarks = SPEED_BENCHMARKS
      .filter(b => b.minNegative > speedStat)
      .sort((a, b) => a.minNegative - b.minNegative);

    const underspeeds = SPEED_BENCHMARKS
      .filter(b => speedStat < b.minNegative && b.pokemon !== pokemon.species)
      .sort((a, b) => a.minNegative - b.minNegative);

    const simpleText = underspeeds.length > 0
      ? `Minimized for Trick Room — underspeeds ${underspeeds.slice(0, 3).map(b => b.pokemon).join(", ")} under TR.`
      : `Minimized for Trick Room (${speedStat} Speed).`;

    const advancedText = `${speedStat} Speed (${baseSpe} base, ${speedIvs} IV, ${speedEvs} EVs, ${reduced ? "-Spe" : "neutral"} nature). ` +
      (underspeeds.length > 0
        ? `Underspeeds min ${underspeeds[0].pokemon} (${underspeeds[0].minNegative}) under Trick Room.`
        : `Minimum possible speed for Trick Room.`) +
      (underspeedBenchmarks.length > 0
        ? ` Underspeeds: ${underspeedBenchmarks.slice(0, 5).map(b => `${b.pokemon} (${b.minNegative})`).join(", ")}.`
        : "");

    return { simpleText, advancedText };
  }

  // Max speed investment
  if (speedEvs >= 252) {
    const nearestOutsped = outspeeds.slice(0, 3);
    const tiesOrLoses = exactMatches.slice(0, 2);

    const simpleText = boosted
      ? `Max Speed with +Spe nature${nearestOutsped.length > 0 ? ` — outspeeds ${nearestOutsped[0].pokemon}` : ""}.`
      : `Max Speed (neutral)${nearestOutsped.length > 0 ? ` — outspeeds neutral ${nearestOutsped[0].pokemon}` : ""}.`;

    const advancedText = `${speedStat} Speed (${baseSpe} base, 252 EVs, ${boosted ? "+Spe" : "neutral"} nature). ` +
      (nearestOutsped.length > 0
        ? `Outspeeds: ${nearestOutsped.map(b => `${boosted ? "+" : ""}${b.pokemon} (${boosted ? b.maxPositive : b.maxNeutral})`).join(", ")}. `
        : "") +
      (tiesOrLoses.length > 0
        ? `Speed ties with: ${tiesOrLoses.map(b => `${b.pokemon}`).join(", ")}.`
        : "");

    return { simpleText, advancedText };
  }

  // Partial speed investment
  if (speedEvs > 0) {
    // Find what this specific speed stat is targeting
    const closestBenchmark = SPEED_BENCHMARKS
      .filter(b => b.pokemon !== pokemon.species)
      .reduce((closest, b) => {
        const targetStat = boosted ? b.maxPositive : b.maxNeutral;
        const diff = speedStat - targetStat;
        if (diff >= 0 && diff < (closest.diff ?? Infinity)) {
          return { benchmark: b, diff };
        }
        return closest;
      }, { benchmark: null as typeof SPEED_BENCHMARKS[0] | null, diff: Infinity });

    const target = closestBenchmark.benchmark;
    const simpleText = target
      ? `${speedEvs} Speed EVs — enough to outspeed ${target.pokemon}.`
      : `${speedEvs} Speed EVs (${speedStat} Speed stat).`;

    const advancedText = `${speedStat} Speed (${baseSpe} base, ${speedEvs} EVs, ${boosted ? "+Spe" : reduced ? "-Spe" : "neutral"} nature). ` +
      (target
        ? `Outspeeds ${target.pokemon} at ${boosted ? target.maxPositive : target.maxNeutral} Speed. `
        : "") +
      `${252 - speedEvs} EVs saved for bulk/offense.`;

    return { simpleText, advancedText };
  }

  // Zero speed, not TR
  const simpleText = `No Speed investment (${speedStat} Speed) — relies on other speed control or doesn't need to be fast.`;
  const advancedText = `${speedStat} Speed (${baseSpe} base, 0 EVs, ${reduced ? "-Spe" : "neutral"} nature). No speed investment — likely relies on Tailwind, team support, or doesn't contest speed.`;

  return { simpleText, advancedText };
}
