"use client";

import type { AnalyzedPokemon } from "@/lib/types/analysis";
import type { PokemonType } from "@/lib/types/pokemon";
import { lookupMoveType } from "@/lib/data/move-types";
import { TYPE_CHART } from "@/lib/data/type-chart";
import { TYPE_COLORS } from "@/lib/utils/type-colors";

const ALL_TYPES: PokemonType[] = [
  "Normal", "Fire", "Water", "Electric", "Grass", "Ice",
  "Fighting", "Poison", "Ground", "Flying", "Psychic", "Bug",
  "Rock", "Ghost", "Dragon", "Dark", "Steel", "Fairy",
];

interface TypeCoverageMatrixProps {
  pokemon: AnalyzedPokemon[];
}

function hasSuperEffectiveCoverage(mon: AnalyzedPokemon, defenderType: PokemonType): boolean {
  for (const move of mon.parsed.moves) {
    const moveType = lookupMoveType(move);
    if (!moveType) continue;
    if ((TYPE_CHART[moveType]?.[defenderType] ?? 1) >= 2) return true;
  }
  return false;
}

export function TypeCoverageMatrix({ pokemon }: TypeCoverageMatrixProps) {
  const coverageData = ALL_TYPES.map((type) => {
    const coverers: number[] = [];
    pokemon.forEach((mon, i) => {
      if (hasSuperEffectiveCoverage(mon, type)) coverers.push(i);
    });
    return { type, count: coverers.length, coverers };
  });

  // Sort: gaps first, then thin, then good coverage
  const sorted = [...coverageData].sort((a, b) => a.count - b.count);
  const gaps = sorted.filter(d => d.count === 0);
  const thin = sorted.filter(d => d.count === 1);
  const ok = sorted.filter(d => d.count >= 2);

  const renderGroup = (label: string, items: typeof coverageData, color: string) => {
    if (items.length === 0) return null;
    return (
      <div className="flex flex-col gap-1.5">
        <span className={`text-xs font-bold uppercase tracking-wider ${color}`}>{label}</span>
        <div className="flex flex-wrap gap-2">
          {items.map(({ type, count, coverers }) => {
            const tc = TYPE_COLORS[type];
            return (
              <div
                key={type}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-surface border border-border-subtle/60"
                title={count === 0
                  ? `Nothing hits ${type} super-effectively`
                  : `${coverers.map(i => pokemon[i].parsed.species).join(", ")} → ${type}`}
              >
                <span
                  className="px-1.5 py-0.5 text-[10px] font-bold uppercase rounded leading-none"
                  style={{ backgroundColor: tc.bg, color: tc.text }}
                >
                  {type}
                </span>
                <span className={`text-sm font-bold tabular-nums ${
                  count === 0 ? "text-red-400" : count === 1 ? "text-amber-400" : "text-emerald-400"
                }`}>
                  {count === 0 ? "0" : `${count}`}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-text-tertiary mb-0.5">
          Offensive Type Coverage
        </h3>
        <p className="text-sm text-text-tertiary">
          Number of team members that hit each type super-effectively
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {renderGroup(
          gaps.length > 0 ? `Gaps — no SE coverage (${gaps.length})` : "",
          gaps,
          "text-red-400"
        )}
        {renderGroup(
          thin.length > 0 ? `Thin — only 1 answer (${thin.length})` : "",
          thin,
          "text-amber-400"
        )}
        {renderGroup(
          ok.length > 0 ? `Covered — 2+ answers (${ok.length})` : "",
          ok,
          "text-emerald-400"
        )}
      </div>
    </div>
  );
}
