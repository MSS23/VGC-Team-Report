"use client";

import { useMemo } from "react";
import type { AnalyzedPokemon } from "@/lib/types/analysis";
import type { PokemonType } from "@/lib/types/pokemon";
import type { MatchupPlan } from "@/hooks/useMatchupPlans";
import { parseShowdownPaste } from "@/lib/parser/showdown-parser";
import { lookupPokemon } from "@/lib/data/pokemon";
import { calculateAllStats } from "@/lib/analysis/stat-calculator";
import { getItemStatBoost } from "@/lib/analysis/item-boosts";
import { getEffectiveness } from "@/lib/data/type-chart";
import { MOVES } from "@/lib/data/moves";
import { PokemonSprite } from "./PokemonSprite";
import { TypeBadge } from "./TypeBadge";

interface TeamComparisonSlideProps {
  plan: MatchupPlan;
  yourPokemon: AnalyzedPokemon[];
}

interface ComparedPokemon {
  species: string;
  types: PokemonType[];
  speed: number;
  boostedSpeed: number | null;
  item: string | null;
  ability: string | null;
  moves: string[];
  moveTypes: (PokemonType | null)[];
}

function lookupMoveType(name: string): PokemonType | null {
  const key = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return MOVES[key]?.type ?? null;
}

function getThreats(
  attacker: ComparedPokemon,
  defenderTypes: PokemonType[]
): { move: string; effectiveness: number }[] {
  const threats: { move: string; effectiveness: number }[] = [];
  for (let i = 0; i < attacker.moves.length; i++) {
    const moveType = attacker.moveTypes[i];
    if (!moveType) continue;
    const eff = getEffectiveness(moveType, defenderTypes);
    if (eff >= 2) {
      threats.push({ move: attacker.moves[i], effectiveness: eff });
    }
  }
  return threats;
}

function parseTeamComparison(pokemon: AnalyzedPokemon[]): ComparedPokemon[] {
  return pokemon.map((mon) => {
    const speed = mon.calculatedStats.spe;
    const boostedSpeed = mon.itemBoost?.stat === "spe" ? mon.itemBoost.boostedValue : null;
    return {
      species: mon.parsed.species,
      types: mon.data?.types ?? [],
      speed,
      boostedSpeed,
      item: mon.parsed.item,
      ability: mon.parsed.ability,
      moves: mon.parsed.moves,
      moveTypes: mon.parsed.moves.map(lookupMoveType),
    };
  });
}

function parseOpponentComparison(paste: string): ComparedPokemon[] {
  const parsed = parseShowdownPaste(paste);
  return parsed.pokemon.map((p) => {
    const data = lookupPokemon(p.species);
    const hasEvs = Object.values(p.evs).reduce((a, b) => a + b, 0) > 0;
    const stats = data && hasEvs
      ? calculateAllStats(data.baseStats, p.ivs, p.evs, p.level, p.nature)
      : data
        ? calculateAllStats(data.baseStats, p.ivs, { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 }, p.level, p.nature)
        : null;
    const itemBoost = stats ? getItemStatBoost(p.item, p.ability, stats) : null;
    const speed = stats?.spe ?? 0;
    const boostedSpeed = itemBoost?.stat === "spe" ? itemBoost.boostedValue : null;
    return {
      species: p.species,
      types: data?.types ?? [],
      speed,
      boostedSpeed,
      item: p.item,
      ability: p.ability,
      moves: p.moves,
      moveTypes: p.moves.map(lookupMoveType),
    };
  });
}

export function TeamComparisonSlide({ plan, yourPokemon }: TeamComparisonSlideProps) {
  const yours = useMemo(() => parseTeamComparison(yourPokemon), [yourPokemon]);
  const theirs = useMemo(() => parseOpponentComparison(plan.opponentPaste), [plan.opponentPaste]);

  // Speed comparison: sort all Pokemon by effective speed
  const speedComparison = useMemo(() => {
    const all = [
      ...yours.map((p) => ({ ...p, team: "yours" as const, effectiveSpeed: p.boostedSpeed ?? p.speed })),
      ...theirs.map((p) => ({ ...p, team: "theirs" as const, effectiveSpeed: p.boostedSpeed ?? p.speed })),
    ];
    return all.sort((a, b) => b.effectiveSpeed - a.effectiveSpeed);
  }, [yours, theirs]);

  // Threat matrix: for each of your Pokemon, which opponent Pokemon threaten it
  const threatMatrix = useMemo(() => {
    return yours.map((yourMon) => ({
      species: yourMon.species,
      types: yourMon.types,
      threatenedBy: theirs
        .map((opp) => ({
          species: opp.species,
          threats: getThreats(opp, yourMon.types),
        }))
        .filter((t) => t.threats.length > 0),
      threatens: theirs
        .map((opp) => ({
          species: opp.species,
          threats: getThreats(yourMon, opp.types),
        }))
        .filter((t) => t.threats.length > 0),
    }));
  }, [yours, theirs]);

  const maxSpeed = speedComparison[0]?.effectiveSpeed ?? 1;

  return (
    <div className="animate-fade-in flex flex-col gap-6">
      <div>
        <h2 className="text-lg sm:text-xl font-extrabold text-text-primary tracking-tight mb-1">
          Team Comparison
        </h2>
        <p className="text-sm text-text-secondary">
          vs. <span className="font-bold text-text-primary">{plan.opponentLabel}</span>
        </p>
      </div>

      {/* Speed Comparison */}
      <div>
        <h3 className="text-xs font-extrabold uppercase tracking-widest text-text-tertiary mb-3">
          Speed Tiers
        </h3>
        <div className="space-y-1.5">
          {speedComparison.map((mon, i) => {
            const pct = Math.max((mon.effectiveSpeed / maxSpeed) * 100, 8);
            const isYours = mon.team === "yours";
            return (
              <div key={`${mon.species}-${mon.team}-${i}`} className="flex items-center gap-2">
                <div className="w-24 sm:w-32 flex items-center gap-1.5 flex-shrink-0">
                  <PokemonSprite species={mon.species} size={24} />
                  <span className={`text-xs font-bold truncate ${isYours ? "text-accent" : "text-blue-500"}`}>
                    {mon.species}
                  </span>
                </div>
                <div className="flex-1 h-5 bg-surface-alt rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      isYours ? "bg-accent/70" : "bg-blue-500/70"
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-xs font-[family-name:var(--font-mono)] font-bold text-text-secondary w-8 text-right tabular-nums">
                  {mon.effectiveSpeed}
                </span>
                {mon.boostedSpeed !== null && (
                  <span className="text-[10px] text-amber-500 font-bold flex-shrink-0">
                    {mon.item?.toLowerCase().includes("scarf") ? "scarf" : "boost"}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Threat Analysis */}
      <div>
        <h3 className="text-xs font-extrabold uppercase tracking-widest text-text-tertiary mb-3">
          Threat Analysis
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {threatMatrix.map((entry) => (
            <div key={entry.species} className="bg-surface border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <PokemonSprite species={entry.species} size={32} />
                <div>
                  <span className="text-sm font-bold text-text-primary">{entry.species}</span>
                  <div className="flex gap-1 mt-0.5">
                    {entry.types.map((t) => <TypeBadge key={t} type={t} />)}
                  </div>
                </div>
              </div>

              {/* What threatens this Pokemon */}
              {entry.threatenedBy.length > 0 && (
                <div className="mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-danger">
                    Threatened by
                  </span>
                  <div className="mt-1 space-y-0.5">
                    {entry.threatenedBy.map((threat) => (
                      <div key={threat.species} className="flex items-center gap-1.5 text-xs">
                        <PokemonSprite species={threat.species} size={18} />
                        <span className="font-medium text-text-secondary">{threat.species}</span>
                        <span className="text-text-tertiary">
                          ({threat.threats.map((t) => t.move).join(", ")})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* What this Pokemon threatens */}
              {entry.threatens.length > 0 && (
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-success">
                    Threatens
                  </span>
                  <div className="mt-1 space-y-0.5">
                    {entry.threatens.map((threat) => (
                      <div key={threat.species} className="flex items-center gap-1.5 text-xs">
                        <PokemonSprite species={threat.species} size={18} />
                        <span className="font-medium text-text-secondary">{threat.species}</span>
                        <span className="text-text-tertiary">
                          ({threat.threats.map((t) => t.move).join(", ")})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {entry.threatenedBy.length === 0 && entry.threatens.length === 0 && (
                <p className="text-xs text-text-tertiary italic">No direct type threats</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
