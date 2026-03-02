"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import type { MatchupPlan, GamePlan, GameResult } from "@/hooks/useMatchupPlans";
import type { AnalyzedPokemon } from "@/lib/types/analysis";
import type { StatSpread } from "@/lib/types/pokemon";
import { parseShowdownPaste } from "@/lib/parser/showdown-parser";
import { lookupPokemon } from "@/lib/data/pokemon";
import { calculateAllStats } from "@/lib/analysis/stat-calculator";
import { PokemonSprite } from "./PokemonSprite";
import { TypeBadge } from "./TypeBadge";
import { ItemIcon } from "./ItemIcon";
import { PokemonDropdown } from "./PokemonDropdown";
import { Button } from "@/components/ui/Button";
import { GAME_COLORS, getReplayInfo, ReplayIcon, ResultBadge, ResultToggle } from "@/lib/utils/game-plan-helpers";

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
  onGamePlanReplaysChange: (matchupId: string, gamePlanId: string, replays: string[]) => void;
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
  onGamePlanResultChange: (matchupId: string, gamePlanId: string, result: GameResult) => void;
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
  onGamePlanReplaysChange,
  onGamePlanBringChange,
  onReorderGamePlanBring,
  onGamePlanResultChange,
  onAddGamePlan,
  onRemoveGamePlan,
  onRemove,
}: MatchupPlanSlideProps) {
  const [collapsedPlans, setCollapsedPlans] = useState<Set<string>>(new Set());
  const gamePlansRef = useRef<HTMLDivElement>(null);
  const prevPlanCount = useRef(plan.gamePlans.length);

  useEffect(() => {
    if (plan.gamePlans.length > prevPlanCount.current && gamePlansRef.current) {
      const lastChild = gamePlansRef.current.lastElementChild;
      lastChild?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    prevPlanCount.current = plan.gamePlans.length;
  }, [plan.gamePlans.length]);

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
        <h2 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">
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
          <h3 className="text-sm font-semibold uppercase tracking-widest text-text-tertiary">
            Opponent Team
          </h3>
          {anyHasEvs && (
            <span className="text-xs text-accent font-medium px-2.5 py-0.5 bg-accent-surface rounded-full">
              Full Spreads
            </span>
          )}
        </div>

        <div className="bg-surface border border-border rounded-2xl p-4 sm:p-6">
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-4 sm:gap-5">
            {opponentPokemon.map((mon, i) => (
              <div key={i} className="flex flex-col items-center text-center min-h-0">
                {/* Sprite — fixed height container for alignment */}
                <div className="h-[72px] flex items-end justify-center mb-1.5">
                  <PokemonSprite species={mon.parsed.species} size={72} />
                </div>
                {/* Name */}
                <span className="text-sm sm:text-base font-bold text-text-primary truncate w-full leading-tight">
                  {mon.parsed.species}
                </span>
                {/* Types */}
                <div className="flex items-center gap-0.5 flex-wrap justify-center mt-1.5">
                  {(mon.data?.types ?? []).map((type) => (
                    <TypeBadge key={type} type={type} />
                  ))}
                </div>
                {/* Item with icon */}
                {mon.parsed.item && (
                  <div className="flex items-center gap-1 justify-center mt-1.5 w-full">
                    <ItemIcon item={mon.parsed.item} size={20} />
                    <span className="text-xs font-medium text-text-primary truncate">
                      {mon.parsed.item}
                    </span>
                  </div>
                )}
                {/* Ability */}
                {mon.parsed.ability && (
                  <span className="text-xs text-text-secondary mt-0.5 truncate w-full">
                    {mon.parsed.ability}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Calculated stats when EVs are present */}
          {anyHasEvs && (
            <div className="mt-4 pt-4 border-t border-border-subtle">
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-4 sm:gap-5">
                {opponentPokemon.map((mon, i) => (
                  <div key={i} className="text-center">
                    {mon.hasEvs && mon.calculatedStats ? (
                      <div className="space-y-0.5">
                        <span className="text-xs font-semibold text-text-secondary block mb-1">
                          {mon.parsed.nature}
                        </span>
                        {(["hp", "atk", "def", "spa", "spd", "spe"] as const).map((stat) => {
                          const value = mon.calculatedStats![stat];
                          const ev = mon.parsed.evs[stat];
                          return (
                            <div key={stat} className="flex items-center justify-center gap-1.5 text-xs">
                              <span className="text-text-tertiary font-medium w-7 text-right">{STAT_LABELS[stat]}</span>
                              <span className={`font-mono tabular-nums w-7 text-left ${ev > 0 ? "text-accent font-bold" : "text-text-primary"}`}>
                                {value}
                              </span>
                              {ev > 0 && (
                                <span className="text-accent/70 text-[10px] font-medium w-6 text-left">+{ev}</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <span className="text-xs text-text-tertiary">—</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Game Plans */}
      <div ref={gamePlansRef} className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-widest text-text-tertiary">
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
              onReplaysChange={(replays) => onGamePlanReplaysChange(plan.id, gp.id, replays)}
              onBringChange={(bringIndex, pokemonIndex) =>
                onGamePlanBringChange(plan.id, gp.id, bringIndex, pokemonIndex)
              }
              onReorderBring={(fromIndex, toIndex) =>
                onReorderGamePlanBring(plan.id, gp.id, fromIndex, toIndex)
              }
              onResultChange={(result) => onGamePlanResultChange(plan.id, gp.id, result)}
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
  onReplaysChange: (replays: string[]) => void;
  onBringChange: (bringIndex: 0 | 1 | 2 | 3, pokemonIndex: number | null) => void;
  onReorderBring: (fromIndex: 0 | 1 | 2 | 3, toIndex: 0 | 1 | 2 | 3) => void;
  onResultChange: (result: GameResult) => void;
  onDelete: () => void;
}

function GamePlanSection({
  gamePlan,
  index,
  yourPokemon,
  isReadOnly,
  isCollapsed,
  canDelete,
  onToggle,
  onNotesChange,
  onReplaysChange,
  onBringChange,
  onReorderBring,
  onResultChange,
  onDelete,
}: GamePlanSectionProps) {
  const color = GAME_COLORS[index] ?? GAME_COLORS[0];
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [replayInput, setReplayInput] = useState("");

  const dragType = `application/x-gameplan-${gamePlan.id}`;

  const speciesLabels = useMemo(() => {
    const totals: Record<string, number> = {};
    yourPokemon.forEach(mon => { totals[mon.parsed.species] = (totals[mon.parsed.species] ?? 0) + 1; });
    const counts: Record<string, number> = {};
    return yourPokemon.map(mon => {
      const s = mon.parsed.species;
      if (totals[s] <= 1) return s;
      counts[s] = (counts[s] ?? 0) + 1;
      return `${s} (${counts[s]})`;
    });
  }, [yourPokemon]);

  const handleDragStart = (e: React.DragEvent, bringIdx: number) => {
    e.dataTransfer.setData(dragType, String(bringIdx));
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, bringIdx: number) => {
    if (!e.dataTransfer.types.includes(dragType)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIndex(bringIdx);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, toIdx: number) => {
    if (!e.dataTransfer.types.includes(dragType)) return;
    e.preventDefault();
    setDragOverIndex(null);
    const fromIdx = parseInt(e.dataTransfer.getData(dragType), 10);
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
          <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-sm font-bold border ${color.badge}`}>
            {index + 1}
          </span>
          <span className="text-base font-semibold text-text-primary">
            Game {index + 1}
          </span>
          {isReadOnly ? (
            <ResultBadge result={gamePlan.result ?? null} />
          ) : (
            <ResultToggle result={gamePlan.result ?? null} onChange={onResultChange} />
          )}
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
              <span className="text-sm font-semibold uppercase tracking-wider text-text-tertiary block mb-3">
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
                        speciesLabels={speciesLabels}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Notes + Replays */}
            <div className="flex flex-col gap-4">
              <div>
                <span className="text-sm font-semibold uppercase tracking-wider text-text-tertiary block mb-3">
                  Notes
                </span>
                {isReadOnly ? (
                  <div className="w-full min-h-[8rem] p-4 sm:p-5 bg-surface-alt border border-border-subtle rounded-xl text-sm sm:text-base text-text-primary whitespace-pre-wrap leading-relaxed">
                    {gamePlan.notes || "No notes."}
                  </div>
                ) : (
                  <textarea
                    value={gamePlan.notes}
                    onChange={(e) => onNotesChange(e.target.value)}
                    placeholder="Why are you bringing these four? What's the win condition?"
                    className="w-full min-h-[8rem] p-4 sm:p-5 bg-surface-alt border border-border-subtle rounded-xl text-sm sm:text-base text-text-primary placeholder:text-text-tertiary resize-y focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent leading-relaxed transition-shadow"
                    spellCheck={false}
                  />
                )}
              </div>

              {/* Replays */}
              {(gamePlan.replays.length > 0 || !isReadOnly) && (
                <div>
                  <span className="text-sm font-semibold uppercase tracking-wider text-text-tertiary block mb-3">
                    Replays
                  </span>
                  {gamePlan.replays.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {gamePlan.replays.map((url, i) => {
                        const info = getReplayInfo(url);
                        return (
                          <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface-alt border border-border-subtle rounded-lg text-sm">
                            <ReplayIcon type={info.type} />
                            {isReadOnly ? (
                              <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-accent hover:underline"
                              >
                                {info.label}
                              </a>
                            ) : (
                              <>
                                <a
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-accent hover:underline"
                                >
                                  {info.label}
                                </a>
                                <button
                                  type="button"
                                  onClick={() => onReplaysChange(gamePlan.replays.filter((_, j) => j !== i))}
                                  className="text-text-tertiary hover:text-red-400 transition-colors"
                                >
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                  </svg>
                                </button>
                              </>
                            )}
                          </span>
                        );
                      })}
                    </div>
                  )}
                  {!isReadOnly && (
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={replayInput}
                        onChange={(e) => setReplayInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && replayInput.trim()) {
                            e.preventDefault();
                            onReplaysChange([...gamePlan.replays, replayInput.trim()]);
                            setReplayInput("");
                          }
                        }}
                        placeholder="Paste replay URL..."
                        className="flex-1 min-w-0 px-3 py-1.5 bg-surface-alt border border-border-subtle rounded-lg text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-shadow"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (replayInput.trim()) {
                            onReplaysChange([...gamePlan.replays, replayInput.trim()]);
                            setReplayInput("");
                          }
                        }}
                        className="px-3 py-1.5 bg-accent/10 text-accent text-xs font-medium rounded-lg hover:bg-accent/20 transition-colors flex-shrink-0"
                      >
                        Add
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
