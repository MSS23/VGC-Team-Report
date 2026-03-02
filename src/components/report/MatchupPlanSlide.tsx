"use client";

import { useMemo, useState } from "react";
import type { MatchupPlan, GamePlan } from "@/hooks/useMatchupPlans";
import type { AnalyzedPokemon } from "@/lib/types/analysis";
import type { StatSpread } from "@/lib/types/pokemon";
import { parseShowdownPaste } from "@/lib/parser/showdown-parser";
import { lookupPokemon } from "@/lib/data/pokemon";
import { calculateAllStats } from "@/lib/analysis/stat-calculator";
import { PokemonSprite } from "./PokemonSprite";
import { TypeBadge } from "./TypeBadge";
import { PokemonDropdown } from "./PokemonDropdown";
import { Button } from "@/components/ui/Button";

interface OpponentPokemonInfo {
  parsed: ReturnType<typeof parseShowdownPaste>["pokemon"][number];
  data: ReturnType<typeof lookupPokemon>;
  calculatedStats: StatSpread | null;
  hasEvs: boolean;
}

interface MatchupPlanSlideProps {
  plan: MatchupPlan;
  yourPokemon: AnalyzedPokemon[];
  isReadOnly: boolean;
  onGamePlanNotesChange: (matchupId: string, gamePlanId: string, notes: string) => void;
  onGamePlanBringChange: (
    matchupId: string,
    gamePlanId: string,
    bringIndex: 0 | 1 | 2 | 3,
    pokemonIndex: number | null
  ) => void;
  onReorderGamePlanBring: (
    matchupId: string,
    gamePlanId: string,
    fromIndex: 0 | 1 | 2 | 3,
    toIndex: 0 | 1 | 2 | 3
  ) => void;
  onAddGamePlan: (matchupId: string) => void;
  onRemoveGamePlan: (matchupId: string, gamePlanId: string) => void;
  onRemove: (id: string) => void;
}

function totalEvs(evs: StatSpread): number {
  return evs.hp + evs.atk + evs.def + evs.spa + evs.spd + evs.spe;
}

const STAT_LABELS = { hp: "HP", atk: "Atk", def: "Def", spa: "SpA", spd: "SpD", spe: "Spe" } as const;

export function MatchupPlanSlide({
  plan,
  yourPokemon,
  isReadOnly,
  onGamePlanNotesChange,
  onGamePlanBringChange,
  onReorderGamePlanBring,
  onAddGamePlan,
  onRemoveGamePlan,
  onRemove,
}: MatchupPlanSlideProps) {
  const [collapsedPlans, setCollapsedPlans] = useState<Set<string>>(new Set());

  const opponentPokemon = useMemo<OpponentPokemonInfo[]>(() => {
    const parsed = parseShowdownPaste(plan.opponentPaste);
    return parsed.pokemon.map((p) => {
      const data = lookupPokemon(p.species);
      const hasEvs = totalEvs(p.evs) > 0;
      const calculatedStats =
        hasEvs && data
          ? calculateAllStats(data.baseStats, p.ivs, p.evs, p.level, p.nature)
          : null;
      return { parsed: p, data, calculatedStats, hasEvs };
    });
  }, [plan.opponentPaste]);

  const anyHasEvs = opponentPokemon.some((p) => p.hasEvs);

  const toggleCollapse = (gamePlanId: string) => {
    setCollapsedPlans((prev) => {
      const next = new Set(prev);
      if (next.has(gamePlanId)) next.delete(gamePlanId);
      else next.add(gamePlanId);
      return next;
    });
  };

  return (
    <div className="flex flex-col gap-6 sm:gap-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl sm:text-2xl font-bold text-text-primary">
          vs. {plan.opponentLabel}
        </h2>
        {!isReadOnly && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemove(plan.id)}
            className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
          >
            Remove
          </Button>
        )}
      </div>

      {/* Opponent Team Overview */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">
            Opponent Team
          </h3>
          {anyHasEvs && (
            <span className="text-[10px] text-accent font-medium px-2 py-0.5 bg-accent-surface rounded-full">
              Full Spreads
            </span>
          )}
        </div>

        <div className="bg-surface border border-border rounded-2xl p-4 sm:p-5">
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 sm:gap-4">
            {opponentPokemon.map((mon, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5 text-center">
                <PokemonSprite species={mon.parsed.species} size={56} />
                <span className="text-xs font-semibold text-text-primary truncate w-full">
                  {mon.parsed.species}
                </span>
                <div className="flex items-center gap-0.5 flex-wrap justify-center">
                  {(mon.data?.types ?? []).map((type) => (
                    <TypeBadge key={type} type={type} />
                  ))}
                </div>
                {mon.parsed.item && (
                  <span className="text-[10px] text-text-secondary truncate w-full">
                    {mon.parsed.item}
                  </span>
                )}
                {mon.parsed.ability && (
                  <span className="text-[10px] text-text-tertiary truncate w-full">
                    {mon.parsed.ability}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Calculated stats when EVs are present */}
          {anyHasEvs && (
            <div className="mt-4 pt-4 border-t border-border-subtle">
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 sm:gap-4">
                {opponentPokemon.map((mon, i) => (
                  <div key={i} className="text-center">
                    {mon.hasEvs && mon.calculatedStats ? (
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-medium text-text-tertiary block">
                          {mon.parsed.nature}
                        </span>
                        {(["hp", "atk", "def", "spa", "spd", "spe"] as const).map((stat) => {
                          const value = mon.calculatedStats![stat];
                          const ev = mon.parsed.evs[stat];
                          return (
                            <div key={stat} className="flex items-center justify-center gap-1 text-[10px]">
                              <span className="text-text-tertiary w-6 text-right">{STAT_LABELS[stat]}</span>
                              <span className={`font-mono ${ev > 0 ? "text-accent font-semibold" : "text-text-secondary"}`}>
                                {value}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <span className="text-[10px] text-text-tertiary">—</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Game Plans */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">
            Game Plans ({plan.gamePlans.length}/3)
          </h3>
          {!isReadOnly && plan.gamePlans.length < 3 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onAddGamePlan(plan.id)}
              className="text-accent"
            >
              + Add Game Plan
            </Button>
          )}
        </div>

        {plan.gamePlans.map((gp, gpIndex) => {
          const isCollapsed = collapsedPlans.has(gp.id);
          return (
            <GamePlanSection
              key={gp.id}
              gamePlan={gp}
              index={gpIndex}
              matchupId={plan.id}
              yourPokemon={yourPokemon}
              isReadOnly={isReadOnly}
              isCollapsed={isCollapsed}
              canDelete={plan.gamePlans.length > 1}
              onToggle={() => toggleCollapse(gp.id)}
              onNotesChange={(notes) => onGamePlanNotesChange(plan.id, gp.id, notes)}
              onBringChange={(bringIndex, pokemonIndex) =>
                onGamePlanBringChange(plan.id, gp.id, bringIndex, pokemonIndex)
              }
              onReorderBring={(fromIndex, toIndex) =>
                onReorderGamePlanBring(plan.id, gp.id, fromIndex, toIndex)
              }
              onDelete={() => onRemoveGamePlan(plan.id, gp.id)}
            />
          );
        })}
      </div>
    </div>
  );
}

// Individual game plan section component
interface GamePlanSectionProps {
  gamePlan: GamePlan;
  index: number;
  matchupId: string;
  yourPokemon: AnalyzedPokemon[];
  isReadOnly: boolean;
  isCollapsed: boolean;
  canDelete: boolean;
  onToggle: () => void;
  onNotesChange: (notes: string) => void;
  onBringChange: (bringIndex: 0 | 1 | 2 | 3, pokemonIndex: number | null) => void;
  onReorderBring: (fromIndex: 0 | 1 | 2 | 3, toIndex: 0 | 1 | 2 | 3) => void;
  onDelete: () => void;
}

const GAME_COLORS = [
  { badge: "bg-blue-500/20 text-blue-400 border-blue-500/30", accent: "border-l-blue-500" },
  { badge: "bg-amber-500/20 text-amber-400 border-amber-500/30", accent: "border-l-amber-500" },
  { badge: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", accent: "border-l-emerald-500" },
] as const;

function GamePlanSection({
  gamePlan,
  index,
  yourPokemon,
  isReadOnly,
  isCollapsed,
  canDelete,
  onToggle,
  onNotesChange,
  onBringChange,
  onReorderBring,
  onDelete,
}: GamePlanSectionProps) {
  const color = GAME_COLORS[index] ?? GAME_COLORS[0];
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, bringIdx: number) => {
    e.dataTransfer.setData("text/plain", String(bringIdx));
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, bringIdx: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIndex(bringIdx);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, toIdx: number) => {
    e.preventDefault();
    setDragOverIndex(null);
    const fromIdx = parseInt(e.dataTransfer.getData("text/plain"), 10);
    if (!isNaN(fromIdx) && fromIdx !== toIdx) {
      onReorderBring(fromIdx as 0 | 1 | 2 | 3, toIdx as 0 | 1 | 2 | 3);
    }
  };

  return (
    <div className={`bg-surface border border-border rounded-2xl border-l-[3px] ${color.accent}`}>
      {/* Header — always visible */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 sm:px-5 py-3 hover:bg-surface-alt/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-text-tertiary text-xs transition-transform" style={{ transform: isCollapsed ? "rotate(-90deg)" : "rotate(0deg)" }}>
            &#9662;
          </span>
          <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold border ${color.badge}`}>
            {index + 1}
          </span>
          <span className="text-sm font-semibold text-text-primary">
            Game {index + 1}
          </span>
          {/* Show selected Pokemon sprites inline when collapsed */}
          {isCollapsed && (
            <div className="flex items-center gap-1 ml-1">
              {gamePlan.bring.map((idx, i) =>
                idx !== null && yourPokemon[idx] ? (
                  <PokemonSprite key={i} species={yourPokemon[idx].parsed.species} size={20} />
                ) : null
              )}
            </div>
          )}
        </div>
        {!isReadOnly && canDelete && (
          <span
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="text-text-tertiary hover:text-red-400 text-xs px-2 py-1 rounded-md hover:bg-red-400/10 transition-colors"
          >
            Delete
          </span>
        )}
      </button>

      {/* Content — collapsible */}
      {!isCollapsed && (
        <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-1">
          <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-4 sm:gap-6">
            {/* Choose Your Four */}
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-text-tertiary block mb-3">
                Bring Four
              </span>
              <div className="grid grid-cols-4 lg:grid-cols-2 gap-3">
                {([0, 1, 2, 3] as const).map((bringIdx) => {
                  const hasSelection = gamePlan.bring[bringIdx] !== null;
                  return (
                    <div
                      key={bringIdx}
                      className={`flex flex-col items-center gap-1 transition-all rounded-xl ${
                        dragOverIndex === bringIdx ? "ring-2 ring-accent/50 scale-105" : ""
                      }`}
                      onDragOver={(e) => handleDragOver(e, bringIdx)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, bringIdx)}
                    >
                      <PokemonDropdown
                        yourPokemon={yourPokemon}
                        selectedIndex={gamePlan.bring[bringIdx]}
                        onChange={(idx) => onBringChange(bringIdx, idx)}
                        isReadOnly={isReadOnly}
                        takenIndices={gamePlan.bring.filter((_, i) => i !== bringIdx)}
                        draggable={hasSelection && !isReadOnly}
                        onDragStart={(e) => handleDragStart(e, bringIdx)}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Notes */}
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-text-tertiary block mb-3">
                Notes
              </span>
              {isReadOnly ? (
                <div className="w-full min-h-[8rem] p-4 bg-surface-alt border border-border-subtle rounded-xl text-sm text-text-primary whitespace-pre-wrap leading-relaxed">
                  {gamePlan.notes || "No notes."}
                </div>
              ) : (
                <textarea
                  value={gamePlan.notes}
                  onChange={(e) => onNotesChange(e.target.value)}
                  placeholder="Why are you bringing these four? What's the win condition?"
                  className="w-full min-h-[8rem] p-4 bg-surface-alt border border-border-subtle rounded-xl text-sm text-text-primary placeholder:text-text-tertiary resize-y focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent leading-relaxed transition-shadow"
                  spellCheck={false}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
