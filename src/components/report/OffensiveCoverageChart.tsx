"use client";

import type { AnalyzedPokemon } from "@/lib/types/analysis";
import type { PokemonType } from "@/lib/types/pokemon";
import { getEffectiveness } from "@/lib/data/type-chart";
import { lookupMove } from "@/lib/data/moves";
import { TYPE_COLORS } from "@/lib/utils/type-colors";

const ALL_TYPES: PokemonType[] = [
  "Normal", "Fire", "Water", "Electric", "Grass", "Ice",
  "Fighting", "Poison", "Ground", "Flying", "Psychic", "Bug",
  "Rock", "Ghost", "Dragon", "Dark", "Steel", "Fairy",
];

interface OffensiveCoverageChartProps {
  pokemon: AnalyzedPokemon[];
}

/** For a single Pokemon, get its best offensive multiplier against each defender type */
function getOffensiveProfile(mon: AnalyzedPokemon): Record<PokemonType, { mult: number; move: string | null }> {
  const profile = {} as Record<PokemonType, { mult: number; move: string | null }>;

  // Get the Pokemon's move types (only damaging moves)
  const moveTypes: { type: PokemonType; name: string }[] = [];
  for (const moveName of mon.parsed.moves) {
    const moveData = lookupMove(moveName);
    if (moveData && moveData.category !== "Status" && moveData.power && moveData.power > 0) {
      moveTypes.push({ type: moveData.type, name: moveData.name });
    }
  }

  // Also include STAB types (in case a move isn't in the DB but the Pokemon has STAB)
  const pokemonTypes = mon.data?.types ?? [];

  for (const defType of ALL_TYPES) {
    let bestMult = 0;
    let bestMove: string | null = null;

    // Check each damaging move against the single defender type
    for (const { type: moveType, name } of moveTypes) {
      const mult = getEffectiveness(moveType, [defType]);
      if (mult > bestMult) {
        bestMult = mult;
        bestMove = name;
      }
    }

    // If no damaging moves found, check STAB types at least
    if (moveTypes.length === 0) {
      for (const stabType of pokemonTypes) {
        const mult = getEffectiveness(stabType, [defType]);
        if (mult > bestMult) {
          bestMult = mult;
          bestMove = null;
        }
      }
    }

    profile[defType] = { mult: bestMult, move: bestMove };
  }

  return profile;
}

function offensiveCell(mult: number): { bg: string; text: string; ring?: string } {
  if (mult === 0) return { bg: "bg-zinc-800", text: "text-zinc-400" };
  if (mult < 1) return { bg: "bg-red-500/20", text: "text-red-400" };
  if (mult === 1) return { bg: "", text: "text-text-tertiary/40" };
  if (mult === 2) return { bg: "bg-emerald-500/25", text: "text-emerald-300" };
  if (mult >= 4) return { bg: "bg-cyan-500/40", text: "text-white", ring: "ring-1 ring-cyan-400/60" };
  return { bg: "", text: "" };
}

function offensiveLabel(mult: number): string {
  if (mult === 0) return "0";
  if (mult === 0.5) return "\u00BDx";
  if (mult === 1) return "\u2022";
  if (mult === 2) return "2\u00D7";
  if (mult === 4) return "4\u00D7";
  return `${mult}x`;
}

export function OffensiveCoverageChart({ pokemon }: OffensiveCoverageChartProps) {
  const profiles = pokemon.map((mon) => ({
    species: mon.parsed.species,
    profile: getOffensiveProfile(mon),
  }));

  // Team-wide coverage summary: how many Pokemon hit each type SE
  const teamSummary = ALL_TYPES.map((defType) => {
    let seCount = 0; // super-effective coverage count
    for (const p of profiles) {
      if (p.profile[defType].mult >= 2) seCount++;
    }
    return { type: defType, seCount };
  });

  const gaps = teamSummary.filter((s) => s.seCount === 0);
  const strong = teamSummary.filter((s) => s.seCount >= 4);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-widest text-text-tertiary mb-1">
          Offensive Profile
        </h3>
        <p className="text-xs sm:text-sm text-text-tertiary leading-relaxed">
          Best coverage each Pok&eacute;mon has against every type based on their moves.
          <span className="inline-flex items-center mx-1 px-1.5 py-0.5 rounded bg-emerald-500/25 text-emerald-300 text-[10px] font-extrabold">2&times;</span>
          = super effective,
          <span className="inline-flex items-center mx-1 px-1.5 py-0.5 rounded bg-cyan-500/40 text-white text-[10px] font-extrabold ring-1 ring-cyan-400/60">4&times;</span>
          = double SE.
        </p>
      </div>

      {/* Callout badges */}
      {(gaps.length > 0 || strong.length > 0) && (
        <div className="flex flex-wrap gap-2">
          {gaps.map(({ type }) => {
            const tc = TYPE_COLORS[type];
            return (
              <span
                key={`gap-${type}`}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-red-500/10 border border-red-500/25 text-xs font-bold text-red-400"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
                  <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
                </svg>
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: tc.bg }} />
                {type}
                <span className="text-red-400/70">&mdash; no SE coverage</span>
              </span>
            );
          })}
          {strong.map(({ type, seCount }) => {
            const tc = TYPE_COLORS[type];
            return (
              <span
                key={`strong-${type}`}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-xs font-bold text-emerald-400"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: tc.bg }} />
                {type}
                <span className="text-emerald-400/70">&mdash; {seCount} hit SE</span>
              </span>
            );
          })}
        </div>
      )}

      {/* Heatmap grid */}
      <div className="overflow-x-auto -mx-2 px-2 scrollbar-none">
        <table className="w-full border-collapse text-center" style={{ minWidth: 640 }}>
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-background px-2 py-2 text-left text-[10px] sm:text-xs font-bold text-text-tertiary uppercase tracking-wider w-28 sm:w-32">
                Pok&eacute;mon
              </th>
              {ALL_TYPES.map((type) => {
                const tc = TYPE_COLORS[type];
                return (
                  <th key={type} className="px-0.5 py-2">
                    <span
                      className="inline-block w-full px-1 py-1 text-[9px] sm:text-[11px] font-bold uppercase rounded-md leading-tight"
                      style={{ backgroundColor: tc.bg, color: tc.text }}
                      title={type}
                    >
                      {type.slice(0, 3)}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {profiles.map((p) => (
              <tr key={p.species} className="border-t border-border/30 hover:bg-surface-alt/40 transition-colors">
                <td className="sticky left-0 z-10 bg-background px-2 py-2 text-left text-xs sm:text-sm font-bold text-text-primary truncate max-w-[7rem] sm:max-w-[8rem]">
                  {p.species}
                </td>
                {ALL_TYPES.map((defType) => {
                  const { mult, move } = p.profile[defType];
                  const label = offensiveLabel(mult);
                  const cell = offensiveCell(mult);
                  return (
                    <td key={defType} className="px-0.5 py-1">
                      <span
                        className={`inline-flex items-center justify-center w-full h-7 sm:h-8 rounded-md text-[11px] sm:text-xs tabular-nums ${cell.bg} ${cell.text} ${cell.ring ?? ""} ${
                          mult >= 4 ? "font-extrabold text-[12px] sm:text-sm" : "font-bold"
                        }`}
                        title={move ? `${move} → ${defType}: ${mult}x` : `vs ${defType}: ${mult}x`}
                      >
                        {label}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
            {/* Team coverage summary row */}
            <tr className="border-t-2 border-border/60">
              <td className="sticky left-0 z-10 bg-background px-2 py-2 text-left text-[10px] sm:text-xs font-extrabold text-text-tertiary uppercase tracking-wider">
                Team SE
              </td>
              {teamSummary.map(({ type, seCount }) => (
                <td key={type} className="px-0.5 py-1">
                  <span className={`inline-flex items-center justify-center w-full h-7 sm:h-8 rounded-md text-[11px] sm:text-xs font-extrabold tabular-nums ${
                    seCount === 0
                      ? "bg-red-500/30 text-red-300 ring-1 ring-red-500/40"
                      : seCount === 1
                        ? "bg-amber-500/20 text-amber-400"
                        : seCount >= 4
                          ? "bg-emerald-500/25 text-emerald-300"
                          : "text-text-secondary"
                  }`}>
                    {seCount > 0 ? seCount : "\u2013"}
                  </span>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[10px] sm:text-xs font-semibold text-text-tertiary">
        <span className="flex items-center gap-1.5">
          <span className="w-6 h-5 rounded-md bg-cyan-500/40 ring-1 ring-cyan-400/60 inline-flex items-center justify-center text-white text-[10px] sm:text-[11px] font-extrabold">4&times;</span>
          Double SE
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-6 h-5 rounded-md bg-emerald-500/25 inline-flex items-center justify-center text-emerald-300 text-[10px] sm:text-[11px] font-bold">2&times;</span>
          Super effective
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-6 h-5 rounded-md inline-flex items-center justify-center text-text-tertiary/40 text-[10px] sm:text-[11px] font-bold">&bull;</span>
          Neutral
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-6 h-5 rounded-md bg-red-500/20 inline-flex items-center justify-center text-red-400 text-[10px] sm:text-[11px] font-bold">&frac12;</span>
          Not very effective
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-6 h-5 rounded-md bg-zinc-800 inline-flex items-center justify-center text-zinc-400 text-[10px] sm:text-[11px] font-bold">0</span>
          No effect
        </span>
      </div>
    </div>
  );
}
