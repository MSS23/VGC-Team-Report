"use client";

import { useState } from "react";
import type { AnalyzedPokemon } from "@/lib/types/analysis";
import type { PokemonType } from "@/lib/types/pokemon";
import { lookupMoveType } from "@/lib/data/move-types";
import { TYPE_CHART, getEffectiveness } from "@/lib/data/type-chart";
import { TYPE_COLORS } from "@/lib/utils/type-colors";

const ALL_TYPES: PokemonType[] = [
  "Normal", "Fire", "Water", "Electric", "Grass", "Ice",
  "Fighting", "Poison", "Ground", "Flying", "Psychic", "Bug",
  "Rock", "Ghost", "Dragon", "Dark", "Steel", "Fairy",
];

type CoverageMode = "offensive" | "defensive";

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

function isWeakTo(mon: AnalyzedPokemon, attackType: PokemonType): boolean {
  const types = mon.data?.types;
  if (!types) return false;
  return getEffectiveness(attackType, types) >= 2;
}

export function TypeCoverageMatrix({ pokemon }: TypeCoverageMatrixProps) {
  const [mode, setMode] = useState<CoverageMode>("offensive");

  // Offensive: how many team members hit each type SE
  const offensiveData = ALL_TYPES.map((type) => {
    const coverers: number[] = [];
    pokemon.forEach((mon, i) => {
      if (hasSuperEffectiveCoverage(mon, type)) coverers.push(i);
    });
    return { type, count: coverers.length, indices: coverers };
  });

  // Defensive: how many team members are weak to each attacking type
  const defensiveData = ALL_TYPES.map((attackType) => {
    const weakIndices: number[] = [];
    pokemon.forEach((mon, i) => {
      if (isWeakTo(mon, attackType)) weakIndices.push(i);
    });
    return { type: attackType, count: weakIndices.length, indices: weakIndices };
  });

  const data = mode === "offensive" ? offensiveData : defensiveData;

  // Offensive: sort gaps (0) first → thin (1) → covered (2+)
  // Defensive: sort most weak first (high count = bad) → moderate → safe (0)
  const sorted = [...data].sort((a, b) =>
    mode === "offensive" ? a.count - b.count : b.count - a.count
  );

  const group1 = mode === "offensive"
    ? sorted.filter(d => d.count === 0)
    : sorted.filter(d => d.count >= 3);
  const group2 = mode === "offensive"
    ? sorted.filter(d => d.count === 1)
    : sorted.filter(d => d.count === 2);
  const group3 = mode === "offensive"
    ? sorted.filter(d => d.count >= 2)
    : sorted.filter(d => d.count === 1);
  const group4 = mode === "defensive"
    ? sorted.filter(d => d.count === 0)
    : [];

  const offensiveGroups = {
    g1: { label: `Gaps — no SE coverage (${group1.length})`, color: "text-red-400" },
    g2: { label: `Thin — only 1 answer (${group2.length})`, color: "text-amber-400" },
    g3: { label: `Covered — 2+ answers (${group3.length})`, color: "text-emerald-400" },
  };

  const defensiveGroups = {
    g1: { label: `Vulnerable — 3+ weak (${group1.length})`, color: "text-red-400" },
    g2: { label: `Exposed — 2 weak (${group2.length})`, color: "text-amber-400" },
    g3: { label: `Manageable — 1 weak (${group3.length})`, color: "text-emerald-400" },
    g4: { label: `Resistant — no weakness (${group4.length})`, color: "text-cyan-400" },
  };

  const groups = mode === "offensive" ? offensiveGroups : defensiveGroups;

  function getCountColor(count: number): string {
    if (mode === "offensive") {
      if (count === 0) return "text-red-400";
      if (count === 1) return "text-amber-400";
      return "text-emerald-400";
    }
    // Defensive: high count = bad
    if (count >= 3) return "text-red-400";
    if (count === 2) return "text-amber-400";
    if (count === 1) return "text-emerald-400";
    return "text-cyan-400";
  }

  function getTooltip(type: string, count: number, indices: number[]): string {
    const names = indices.map(i => pokemon[i].parsed.species).join(", ");
    if (mode === "offensive") {
      return count === 0
        ? `Nothing hits ${type} super-effectively`
        : `${names} → ${type}`;
    }
    return count === 0
      ? `No team members are weak to ${type}`
      : `${names} weak to ${type}`;
  }

  const renderGroup = (
    label: string,
    items: typeof data,
    color: string,
  ) => {
    if (items.length === 0) return null;
    return (
      <div className="flex flex-col gap-1.5">
        <span className={`text-xs font-bold uppercase tracking-wider ${color}`}>{label}</span>
        <div className="flex flex-wrap gap-2">
          {items.map(({ type, count, indices }) => {
            const tc = TYPE_COLORS[type];
            return (
              <div
                key={type}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-surface border border-border-subtle/60"
                title={getTooltip(type, count, indices)}
              >
                <span
                  className="px-1.5 py-0.5 text-[10px] font-bold uppercase rounded leading-none"
                  style={{ backgroundColor: tc.bg, color: tc.text }}
                >
                  {type}
                </span>
                <span className={`text-sm font-bold tabular-nums ${getCountColor(count)}`}>
                  {count}
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
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-widest text-text-tertiary mb-0.5">
            {mode === "offensive" ? "Offensive Type Coverage" : "Defensive Type Coverage"}
          </h3>
          <p className="text-sm text-text-tertiary">
            {mode === "offensive"
              ? "Number of team members that hit each type super-effectively"
              : "Number of team members weak to each attacking type"}
          </p>
        </div>

        {/* Toggle */}
        <div className="flex items-center bg-surface-alt rounded-lg p-0.5 flex-shrink-0">
          <button
            type="button"
            onClick={() => setMode("offensive")}
            className={`px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide rounded-md transition-colors ${
              mode === "offensive"
                ? "bg-surface text-text-primary shadow-sm"
                : "text-text-tertiary hover:text-text-secondary"
            }`}
          >
            Offensive
          </button>
          <button
            type="button"
            onClick={() => setMode("defensive")}
            className={`px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide rounded-md transition-colors ${
              mode === "defensive"
                ? "bg-surface text-text-primary shadow-sm"
                : "text-text-tertiary hover:text-text-secondary"
            }`}
          >
            Defensive
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {renderGroup(groups.g1.label, group1, groups.g1.color)}
        {renderGroup(groups.g2.label, group2, groups.g2.color)}
        {renderGroup(groups.g3.label, group3, groups.g3.color)}
        {mode === "defensive" && renderGroup(
          (defensiveGroups as typeof defensiveGroups).g4.label,
          group4,
          (defensiveGroups as typeof defensiveGroups).g4.color,
        )}
      </div>
    </div>
  );
}
