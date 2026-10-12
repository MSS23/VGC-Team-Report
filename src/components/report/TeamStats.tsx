"use client";

import type { AnalyzedPokemon } from "@/lib/types/analysis";
import { isChampionsFormat } from "@/lib/data/tags";
import { calculateChampionsStat, convertToChampionsSp } from "@/lib/analysis/stat-calculator";

interface TeamStatsProps {
  pokemon: AnalyzedPokemon[];
  /** Current regulation — Reg M-A (Champions) has no Tera, so the count is hidden. */
  regulation?: string;
}

/**
 * Fastest/slowest Speed across the team, in the same unit the rest of the
 * report shows.
 *
 * Champions regs budget Stat Points, not EVs, so Speed has to be rebuilt from
 * the SP spread exactly the way `PokemonCard` / `PokemonDetailSlide` /
 * `SpeedTierChart` do. `calculatedStats` is always the classic EV formula, and
 * reading it here made this panel disagree with the speed-tier chart about the
 * same Pokemon (VGC-292: Dragapult showed 182 here and 213 there).
 */
export function teamSpeedRange(
  pokemon: AnalyzedPokemon[],
  regulation?: string,
): { minSpeed: number; maxSpeed: number } {
  const isChampions = isChampionsFormat(regulation);
  const speeds = pokemon
    .map((p) => {
      if (isChampions && p.data) {
        const sp = convertToChampionsSp(p.parsed.evs);
        return calculateChampionsStat("spe", p.data.baseStats.spe, sp.spe, p.parsed.nature);
      }
      return p.calculatedStats.spe;
    })
    .filter((s) => s > 0)
    .sort((a, b) => a - b);
  return {
    minSpeed: speeds[0] ?? 0,
    maxSpeed: speeds[speeds.length - 1] ?? 0,
  };
}

export function TeamStats({ pokemon, regulation }: TeamStatsProps) {
  if (pokemon.length === 0) return null;

  // Unique types
  const allTypes = new Set<string>();
  pokemon.forEach((p) => {
    if (p.data?.types) p.data.types.forEach((t) => allTypes.add(t));
  });

  // Speed range — SP-derived in Champions regs
  const { minSpeed, maxSpeed } = teamSpeedRange(pokemon, regulation);

  // Average base stat total
  const bstValues = pokemon
    .filter((p) => p.data?.baseStats)
    .map((p) => Object.values(p.data!.baseStats).reduce((a, b) => a + b, 0));
  const avgBst = bstValues.length > 0 ? Math.round(bstValues.reduce((a, b) => a + b, 0) / bstValues.length) : 0;

  // Count Pokemon with Tera — always 0 in Champions (Reg M-A / M-B: no Tera).
  const teraCount = isChampionsFormat(regulation)
    ? 0
    : pokemon.filter((p) => p.parsed.teraType).length;

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[10px] sm:text-xs text-text-tertiary">
      <span className="inline-flex items-center gap-1">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-tertiary/60">
          <circle cx="12" cy="12" r="10" />
          <path d="M8 12h8" />
        </svg>
        <span className="font-semibold text-text-secondary">{allTypes.size}</span> types
      </span>
      <span className="inline-flex items-center gap-1">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-tertiary/60">
          <polyline points="13 17 18 12 13 7" />
          <polyline points="6 17 11 12 6 7" />
        </svg>
        <span className="font-semibold text-text-secondary">{minSpeed}–{maxSpeed}</span> speed
      </span>
      {avgBst > 0 && (
        <span className="inline-flex items-center gap-1">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-tertiary/60">
            <path d="M12 20V10" />
            <path d="M18 20V4" />
            <path d="M6 20v-4" />
          </svg>
          <span className="font-semibold text-text-secondary">{avgBst}</span> avg BST
        </span>
      )}
      {teraCount > 0 && (
        <span className="inline-flex items-center gap-1">
          <span className="text-text-tertiary/60">✦</span>
          <span className="font-semibold text-text-secondary">{teraCount}</span> tera
        </span>
      )}
    </div>
  );
}
