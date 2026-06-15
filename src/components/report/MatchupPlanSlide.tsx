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
import { FieldDiffHighlight } from "./TeamReport";
import { useIsPrintMode } from "@/components/ui/print-context";
import { GAME_COLORS } from "@/lib/utils/game-plan-helpers";
import { useTranslation } from "@/lib/i18n";
import { hapticLight } from "@/lib/utils/haptics";

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
  onGamePlanResultChange: (matchupId: string, gamePlanId: string, result: GameResult) => void;
  onAddGamePlan: (matchupId: string) => void;
  onRemoveGamePlan: (matchupId: string, gamePlanId: string) => void;
  onRemove: (id: string) => void;
}

function totalEvs(evs: StatSpread): number {
  return evs.hp + evs.atk + evs.def + evs.spa + evs.spd + evs.spe;
}

/** Side-by-side speed tiers: your team vs opponent */
function SpeedComparison({
  yourPokemon,
  opponentPokemon,
}: {
  yourPokemon: AnalyzedPokemon[];
  opponentPokemon: OpponentPokemonInfo[];
}) {
  // Build combined speed entries
  const entries: Array<{ species: string; speed: number; isYours: boolean }> = [];

  yourPokemon.forEach((p) => {
    entries.push({ species: p.parsed.species, speed: p.calculatedStats.spe, isYours: true });
  });

  opponentPokemon.forEach((p) => {
    const speed = p.calculatedStats?.spe ?? (p.data?.baseStats.spe ?? 0);
    if (speed > 0) entries.push({ species: p.parsed.species, speed, isYours: false });
  });

  // Sort fastest to slowest
  entries.sort((a, b) => b.speed - a.speed);
  const maxSpeed = entries[0]?.speed ?? 1;

  if (entries.length === 0) return null;

  return (
    <div>
      <h3 className="text-sm font-semibold uppercase tracking-widest text-text-tertiary mb-3">
        Speed Tiers
      </h3>
      <div className="bg-surface border border-border rounded-2xl p-3 sm:p-4">
        <div className="space-y-1.5">
          {entries.map((entry, i) => {
            const pct = Math.max((entry.speed / maxSpeed) * 100, 8);
            return (
              <div key={`${entry.species}-${entry.isYours}-${i}`} className="flex items-center gap-2">
                <div className="w-5 flex-shrink-0">
                  <PokemonSprite species={entry.species} size={20} />
                </div>
                <span className={`text-xs font-semibold w-20 sm:w-24 truncate ${
                  entry.isYours ? "text-accent" : "text-text-secondary"
                }`}>
                  {entry.species}
                </span>
                <div className="flex-1 h-4 bg-surface-alt rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: entry.isYours ? "var(--accent)" : "#64748b",
                    }}
                  />
                </div>
                <span className={`text-xs font-mono font-bold w-8 text-right tabular-nums ${
                  entry.isYours ? "text-accent" : "text-text-secondary"
                }`}>
                  {entry.speed}
                </span>
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-4 mt-3 pt-2 border-t border-border-subtle">
          <span className="flex items-center gap-1.5 text-[10px] font-semibold text-text-tertiary">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "var(--accent)" }} />
            Your team
          </span>
          <span className="flex items-center gap-1.5 text-[10px] font-semibold text-text-tertiary">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />
            Opponent
          </span>
        </div>
      </div>
    </div>
  );
}

export function MatchupPlanSlide({
  plan,
  yourPokemon,
  isReadOnly,
  onGamePlanNotesChange,
  onGamePlanBringChange,
  onReorderGamePlanBring,
  onGamePlanResultChange,
  onAddGamePlan,
  onRemoveGamePlan,
  onRemove,
}: MatchupPlanSlideProps) {
  const { t } = useTranslation();
  const STAT_LABELS = { hp: t.statHp, atk: t.statAtk, def: t.statDef, spa: t.statSpa, spd: t.statSpd, spe: t.statSpe } as const;
  const [collapsedPlans, setCollapsedPlans] = useState<Set<string>>(new Set());
  const [activeGameTab, setActiveGameTab] = useState(0);
  const gamePlansRef = useRef<HTMLDivElement>(null);
  const prevPlanCount = useRef(plan.gamePlans.length);

  useEffect(() => {
    if (plan.gamePlans.length > prevPlanCount.current) {
      // Auto-switch to the new tab on mobile
      setActiveGameTab(plan.gamePlans.length - 1);
      if (gamePlansRef.current) {
        const lastChild = gamePlansRef.current.lastElementChild;
        lastChild?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
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
    <FieldDiffHighlight field="matchupPlans" label="Plans changed">
      <div className="flex flex-col gap-6 sm:gap-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">
          <span className="text-accent">vs.</span> {plan.opponentLabel}
        </h2>
        {!isReadOnly && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemove(plan.id)}
            className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
          >
            {t.remove}
          </Button>
        )}
      </div>

      {/* Opponent Team Overview */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold uppercase tracking-widest text-text-tertiary">
            {t.opponentTeam}
          </h3>
          {anyHasEvs && (
            <span className="text-xs text-accent font-medium px-2.5 py-0.5 bg-accent-surface rounded-full">
              {t.fullSpreads}
            </span>
          )}
        </div>

        <div className="bg-surface border border-border rounded-2xl p-3 sm:p-6">
          <div
            className="flex overflow-x-auto snap-x snap-mandatory scrollbar-none sm:grid sm:grid-cols-6 gap-3 sm:gap-5 pb-2 sm:pb-0 -mx-1 px-1 sm:mx-0 sm:px-0"
            style={{ touchAction: "pan-x" }}
          >
            {opponentPokemon.map((mon, i) => (
              <div key={i} className="flex-shrink-0 w-[140px] sm:w-auto sm:flex-shrink-[unset] snap-center flex flex-col items-center text-center min-h-0">
                {/* Sprite — fixed height container for alignment */}
                <div className="h-[56px] sm:h-[72px] flex items-end justify-center mb-1">
                  <PokemonSprite species={mon.parsed.species} size={56} className="sm:hidden" />
                  <PokemonSprite species={mon.parsed.species} size={72} className="hidden sm:block" />
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
            <div className="mt-5 pt-5 border-t border-border-subtle">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
                {opponentPokemon.map((mon, i) => (
                  <div key={i} role="group" aria-label={`${mon.parsed.species} stats`}>
                    {mon.hasEvs && mon.calculatedStats ? (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <PokemonSprite species={mon.parsed.species} size={28} />
                          <span className="text-sm font-bold text-text-primary">{mon.parsed.species}</span>
                          <span className="text-xs font-medium text-text-secondary">({mon.parsed.nature})</span>
                        </div>
                        <div className="space-y-1.5" role="list" aria-label="Stat values">
                          {(["hp", "atk", "def", "spa", "spd", "spe"] as const).map((stat) => {
                            const value = mon.calculatedStats![stat];
                            const ev = mon.parsed.evs[stat];
                            const maxStat = stat === "hp" ? 300 : 250;
                            const percentage = Math.min((value / maxStat) * 100, 100);
                            return (
                              <div key={stat} className="flex items-center gap-2" role="listitem" aria-label={`${STAT_LABELS[stat]}: ${value}${ev > 0 ? `, ${ev} EVs invested` : ""}`}>
                                <span className="text-xs font-semibold w-8 text-right uppercase text-text-tertiary">
                                  {STAT_LABELS[stat]}
                                </span>
                                <div className="flex-1 h-2 bg-surface-alt rounded-full overflow-hidden" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={maxStat} aria-label={`${STAT_LABELS[stat]} stat bar`}>
                                  <div
                                    className="h-full rounded-full transition-all"
                                    style={{
                                      width: `${percentage}%`,
                                      backgroundColor: ev > 0 ? "var(--accent)" : "#94a3b8",
                                    }}
                                  />
                                </div>
                                <span className={`text-sm font-mono w-8 text-right tabular-nums ${ev > 0 ? "text-accent font-bold" : "text-text-primary"}`}>
                                  {value}
                                </span>
                                {ev > 0 ? (
                                  <span className="text-xs text-accent font-semibold w-10 text-left">+{ev}</span>
                                ) : (
                                  <span className="w-10" />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-text-tertiary">
                        <PokemonSprite species={mon.parsed.species} size={28} />
                        <span className="text-sm">{mon.parsed.species}</span>
                        <span className="text-xs">— {t.noSpreadData}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Speed Comparison */}
      {opponentPokemon.length > 0 && (
        <SpeedComparison yourPokemon={yourPokemon} opponentPokemon={opponentPokemon} />
      )}

      {/* Game Plans */}
      <div ref={gamePlansRef} className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-widest text-text-tertiary">
            {t.gamePlans} ({plan.gamePlans.length}/3)
          </h3>
          {!isReadOnly && plan.gamePlans.length < 3 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onAddGamePlan(plan.id)}
              className="text-accent"
            >
              + {t.addGamePlan}
            </Button>
          )}
        </div>

        {/* Mobile: tab bar for game plans */}
        {plan.gamePlans.length > 1 && (
          <div className={`flex gap-1.5 ${plan.gamePlans.length === 2 ? "lg:hidden" : "sm:hidden"}`} role="tablist" aria-label="Game plan tabs">
            {plan.gamePlans.map((gp, gpIndex) => {
              const color = GAME_COLORS[gpIndex] ?? GAME_COLORS[0];
              const isActive = activeGameTab === gpIndex;
              return (
                <button
                  key={gp.id}
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={`game-plan-panel-${gp.id}`}
                  onClick={() => {
                    setActiveGameTab(gpIndex);
                    hapticLight();
                  }}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    isActive
                      ? "bg-surface border border-border shadow-sm"
                      : "text-text-tertiary hover:bg-surface-alt/50"
                  }`}
                >
                  <span className={`inline-flex items-center justify-center w-6 h-6 rounded-md text-xs font-bold border ${color.badge}`}>
                    {gpIndex + 1}
                  </span>
                  G{gpIndex + 1}
                </button>
              );
            })}
          </div>
        )}

        {/* Mobile: only render active tab; Desktop: side-by-side columns */}
        <div className={`flex flex-col gap-4 ${plan.gamePlans.length === 2 ? "lg:grid lg:grid-cols-2 lg:gap-4" : ""}`}
        >
        {plan.gamePlans.map((gp, gpIndex) => {
          const isCollapsed = collapsedPlans.has(gp.id);
          return (
            <div
              key={gp.id}
              id={`game-plan-panel-${gp.id}`}
              role="tabpanel"
              className={plan.gamePlans.length > 1 && gpIndex !== activeGameTab ? `hidden ${plan.gamePlans.length === 2 ? "lg:block" : "sm:block"}` : ""}
            >
              <GamePlanSection
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
                onResultChange={(result) => onGamePlanResultChange(plan.id, gp.id, result)}
                onDelete={() => onRemoveGamePlan(plan.id, gp.id)}
              />
            </div>
          );
        })}
        </div>
      </div>
      </div>
    </FieldDiffHighlight>
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
  onResultChange: (result: GameResult) => void;
  onDelete: () => void;
}

function GamePlanSection({
  gamePlan,
  index,
  yourPokemon,
  isReadOnly,
  isCollapsed: isCollapsedProp,
  canDelete,
  onToggle,
  onNotesChange,
  onBringChange,
  onReorderBring,
  onResultChange,
  onDelete,
}: GamePlanSectionProps) {
  const { t } = useTranslation();
  // Force expanded in print mode so all game plans are visible in PDF
  const isPrint = useIsPrintMode();
  const isCollapsed = isPrint ? false : isCollapsedProp;
  const color = GAME_COLORS[index] ?? GAME_COLORS[0];
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

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
    <div className={`bg-surface border border-border rounded-2xl border-l-[3px] ${color.accent} shadow-sm transition-shadow hover:shadow-md`}>
      {/* Header — always visible */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 sm:px-5 py-3.5 hover:bg-surface-alt/30 transition-colors rounded-t-2xl"
      >
        <div className="flex items-center gap-3">
          <svg
            width="10"
            height="10"
            viewBox="0 0 10 10"
            fill="currentColor"
            className="text-text-tertiary/60 transition-transform flex-shrink-0"
            style={{ transform: isCollapsed ? "rotate(-90deg)" : "rotate(0deg)" }}
          >
            <polygon points="0,0 10,5 0,10" />
          </svg>
          <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold border ${color.badge}`}>
            {index + 1}
          </span>
          <span className="text-sm font-semibold text-text-primary">
            {t.gameN} {index + 1}
          </span>
          {/* Show lead/back sprites inline when collapsed */}
          {isCollapsed && (
            <div className="flex items-center gap-2 ml-1">
              {/* Lead indicators */}
              {gamePlan.bring.slice(0, 2).some((idx) => idx !== null) && (
                <div className="flex items-center gap-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400/70">L</span>
                  {([0, 1] as const).map((i) => {
                    const idx = gamePlan.bring[i];
                    return idx !== null && yourPokemon[idx] ? (
                      <PokemonSprite key={i} species={yourPokemon[idx].parsed.species} size={18} />
                    ) : null;
                  })}
                </div>
              )}
              {/* Back indicators */}
              {gamePlan.bring.slice(2, 4).some((idx) => idx !== null) && (
                <div className="flex items-center gap-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400/70">B</span>
                  {([2, 3] as const).map((i) => {
                    const idx = gamePlan.bring[i];
                    return idx !== null && yourPokemon[idx] ? (
                      <PokemonSprite key={i} species={yourPokemon[idx].parsed.species} size={18} />
                    ) : null;
                  })}
                </div>
              )}
            </div>
          )}
        </div>
        {!isReadOnly && canDelete && (
          <span
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="text-text-tertiary hover:text-red-400 text-xs px-2 py-1 rounded-md hover:bg-red-400/10 transition-colors"
          >
            {t.delete}
          </span>
        )}
      </button>

      {/* Content — collapsible */}
      {!isCollapsed && (
        <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-1">
          <div className="grid grid-cols-1 gap-4 sm:gap-5">
            {/* Bring Four — Lead / Back split */}
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Lead */}
              <div className="flex-1 bg-surface-alt/50 rounded-xl p-3 sm:p-4 border border-border-subtle">
                <div className="flex items-center gap-2 mb-2.5">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-blue-500/20 text-blue-400">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /></svg>
                  </span>
                  <span className="text-xs font-bold uppercase tracking-widest text-blue-400">{t.lead}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {([0, 1] as const).map((bringIdx) => {
                    const hasSelection = gamePlan.bring[bringIdx] !== null;
                    return (
                      <div
                        key={bringIdx}
                        className={`flex flex-col items-center gap-1 transition-all rounded-xl ${
                          dragOverIndex === bringIdx ? "ring-2 ring-blue-400/50 scale-105" : ""
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

              {/* Swap lead/back button (touch-friendly alternative to drag) */}
              {!isReadOnly && (
                <button
                  type="button"
                  onClick={() => {
                    // Swap lead[0]↔back[0] and lead[1]↔back[1]
                    onReorderBring(0 as 0 | 1 | 2 | 3, 2 as 0 | 1 | 2 | 3);
                    onReorderBring(1 as 0 | 1 | 2 | 3, 3 as 0 | 1 | 2 | 3);
                  }}
                  className="self-center p-1.5 rounded-lg text-text-tertiary hover:text-accent hover:bg-accent-surface/50 transition-all cursor-pointer lg:hidden"
                  title="Swap lead and back"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="17 1 21 5 17 9" />
                    <path d="M3 11V9a4 4 0 014-4h14" />
                    <polyline points="7 23 3 19 7 15" />
                    <path d="M21 13v2a4 4 0 01-4 4H3" />
                  </svg>
                </button>
              )}

              {/* Back */}
              <div className="flex-1 bg-surface-alt/50 rounded-xl p-3 sm:p-4 border border-border-subtle">
                <div className="flex items-center gap-2 mb-2.5">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-amber-500/20 text-amber-400">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                  </span>
                  <span className="text-xs font-bold uppercase tracking-widest text-amber-400">{t.back}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {([2, 3] as const).map((bringIdx) => {
                    const hasSelection = gamePlan.bring[bringIdx] !== null;
                    return (
                      <div
                        key={bringIdx}
                        className={`flex flex-col items-center gap-1 transition-all rounded-xl ${
                          dragOverIndex === bringIdx ? "ring-2 ring-amber-400/50 scale-105" : ""
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
            </div>

            {/* Notes */}
            <div className="flex flex-col gap-4">
              <div>
                <span className="text-sm font-semibold uppercase tracking-wider text-text-tertiary block mb-3 presenting:text-base presenting:mb-4">
                  {t.notesLabel}
                </span>
                {isReadOnly ? (
                  <div className="w-full min-h-[7rem] sm:min-h-[6rem] p-3 sm:p-4 bg-surface-alt border border-border-subtle rounded-xl text-sm text-text-primary whitespace-pre-wrap leading-relaxed presenting:text-xl presenting:leading-9 presenting:p-8 presenting:tracking-wide presenting:min-h-[10rem]">
                    {gamePlan.notes || t.noNotes}
                  </div>
                ) : (
                  <textarea
                    value={gamePlan.notes}
                    onChange={(e) => onNotesChange(e.target.value)}
                    placeholder={t.gamePlanNotesPlaceholder}
                    className="w-full min-h-[7rem] sm:min-h-[6rem] p-3 sm:p-4 bg-surface-alt border border-border-subtle rounded-xl text-sm text-text-primary placeholder:text-text-tertiary resize-y focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent leading-relaxed transition-shadow"
                    spellCheck={false}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
