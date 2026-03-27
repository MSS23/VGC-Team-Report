"use client";

import type { AnalyzedPokemon } from "@/lib/types/analysis";
import type { PokemonType } from "@/lib/types/pokemon";
import { getDefensiveProfile } from "@/lib/data/type-chart";
import { TYPE_COLORS } from "@/lib/utils/type-colors";

const ALL_TYPES: PokemonType[] = [
  "Normal", "Fire", "Water", "Electric", "Grass", "Ice",
  "Fighting", "Poison", "Ground", "Flying", "Psychic", "Bug",
  "Rock", "Ghost", "Dragon", "Dark", "Steel", "Fairy",
];

interface DefensiveCoverageChartProps {
  pokemon: AnalyzedPokemon[];
}

function effectivenessLabel(mult: number): string {
  if (mult === 0) return "0";
  if (mult === 0.25) return "\u00BCx";
  if (mult === 0.5) return "\u00BDx";
  if (mult === 1) return "\u2022";
  if (mult === 2) return "2\u00D7";
  if (mult === 4) return "4\u00D7";
  return `${mult}x`;
}

function effectivenessCell(mult: number): { bg: string; text: string; ring?: string } {
  if (mult === 0) return { bg: "bg-zinc-800", text: "text-zinc-400" };
  if (mult <= 0.25) return { bg: "bg-cyan-500/30", text: "text-cyan-300" };
  if (mult <= 0.5) return { bg: "bg-emerald-500/25", text: "text-emerald-300" };
  if (mult === 1) return { bg: "", text: "text-text-tertiary/40" };
  if (mult === 2) return { bg: "bg-red-500/20", text: "text-red-400" };
  if (mult >= 4) return { bg: "bg-red-600/50", text: "text-white", ring: "ring-1 ring-red-500/60" };
  return { bg: "", text: "" };
}

export function DefensiveCoverageChart({ pokemon }: DefensiveCoverageChartProps) {

  const profiles = pokemon.map((mon) => {
    const types = mon.data?.types ?? [];
    return {
      species: mon.parsed.species,
      types,
      profile: getDefensiveProfile(types),
    };
  });

  // Compute team-wide weakness/resistance summary
  const teamSummary = ALL_TYPES.map((attackType) => {
    let weakCount = 0;
    let resistCount = 0;
    let immuneCount = 0;
    for (const p of profiles) {
      const mult = p.profile[attackType];
      if (mult === 0) immuneCount++;
      else if (mult >= 2) weakCount++;
      else if (mult < 1) resistCount++;
    }
    return { type: attackType, weakCount, resistCount, immuneCount };
  });

  const blindspots = teamSummary.filter((s) => s.weakCount >= 3 && s.immuneCount === 0);
  const strengths = teamSummary.filter((s) => s.resistCount + s.immuneCount >= 4);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-widest text-text-tertiary mb-1">
          Defensive Profile
        </h3>
        <p className="text-xs sm:text-sm text-text-tertiary leading-relaxed">
          How each Pok&eacute;mon handles incoming attacks. Watch for
          <span className="inline-flex items-center mx-1 px-1.5 py-0.5 rounded bg-red-600/50 text-white text-[10px] font-extrabold ring-1 ring-red-500/60">4&times;</span>
          double weaknesses.
        </p>
      </div>

      {/* Callout badges */}
      {(blindspots.length > 0 || strengths.length > 0) && (
        <div className="flex flex-wrap gap-2">
          {blindspots.map(({ type, weakCount }) => {
            const tc = TYPE_COLORS[type];
            return (
              <span
                key={`blind-${type}`}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-red-500/10 border border-red-500/25 text-xs font-bold text-red-400"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: tc.bg }} />
                {type}
                <span className="text-red-400/70">&mdash; {weakCount} weak</span>
              </span>
            );
          })}
          {strengths.map(({ type, resistCount, immuneCount }) => {
            const tc = TYPE_COLORS[type];
            return (
              <span
                key={`strong-${type}`}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-xs font-bold text-emerald-400"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: tc.bg }} />
                {type}
                <span className="text-emerald-400/70">&mdash; {resistCount + immuneCount} resist</span>
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
                {ALL_TYPES.map((attackType) => {
                  const mult = p.profile[attackType];
                  const label = effectivenessLabel(mult);
                  const cell = effectivenessCell(mult);
                  return (
                    <td key={attackType} className="px-0.5 py-1">
                      <span
                        className={`inline-flex items-center justify-center w-full h-7 sm:h-8 rounded-md text-[11px] sm:text-xs tabular-nums ${cell.bg} ${cell.text} ${cell.ring ?? ""} ${
                          mult >= 4 ? "font-extrabold text-[12px] sm:text-sm" : "font-bold"
                        }`}
                        title={`${attackType} → ${p.species}: ${mult}x`}
                      >
                        {label}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
            {/* Team summary row */}
            <tr className="border-t-2 border-border/60">
              <td className="sticky left-0 z-10 bg-background px-2 py-2 text-left text-[10px] sm:text-xs font-extrabold text-text-tertiary uppercase tracking-wider">
                Team Weak
              </td>
              {teamSummary.map(({ type, weakCount }) => (
                <td key={type} className="px-0.5 py-1">
                  <span className={`inline-flex items-center justify-center w-full h-7 sm:h-8 rounded-md text-[11px] sm:text-xs font-extrabold tabular-nums ${
                    weakCount >= 3
                      ? "bg-red-500/30 text-red-300 ring-1 ring-red-500/40"
                      : weakCount === 2
                        ? "bg-amber-500/20 text-amber-400"
                        : weakCount === 1
                          ? "text-text-tertiary"
                          : "text-text-tertiary/25"
                  }`}>
                    {weakCount > 0 ? weakCount : "\u2013"}
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
          <span className="w-6 h-5 rounded-md bg-red-600/50 ring-1 ring-red-500/60 inline-flex items-center justify-center text-white text-[10px] sm:text-[11px] font-extrabold">4&times;</span>
          Double weak
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-6 h-5 rounded-md bg-red-500/20 inline-flex items-center justify-center text-red-400 text-[10px] sm:text-[11px] font-bold">2&times;</span>
          Weak
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-6 h-5 rounded-md bg-emerald-500/25 inline-flex items-center justify-center text-emerald-300 text-[10px] sm:text-[11px] font-bold">&frac12;</span>
          Resist
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-6 h-5 rounded-md bg-cyan-500/30 inline-flex items-center justify-center text-cyan-300 text-[10px] sm:text-[11px] font-bold">&frac14;</span>
          Double resist
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-6 h-5 rounded-md bg-zinc-800 inline-flex items-center justify-center text-zinc-400 text-[10px] sm:text-[11px] font-bold">0</span>
          Immune
        </span>
      </div>
    </div>
  );
}
