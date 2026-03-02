"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import type { MatchupPlan, GamePlan, GameResult } from "@/hooks/useMatchupPlans";
import type { AnalyzedPokemon } from "@/lib/types/analysis";
import { parseShowdownPaste } from "@/lib/parser/showdown-parser";
import { PokemonSprite } from "./PokemonSprite";
import { PokemonDropdown } from "./PokemonDropdown";
import { Button } from "@/components/ui/Button";
import { GAME_COLORS, getReplayInfo, ReplayIcon, ResultBadge, ResultToggle } from "@/lib/utils/game-plan-helpers";

interface MatchupSheetRowProps {
  plan: MatchupPlan;
  rowNumber: number;
  yourPokemon: AnalyzedPokemon[];
  isReadOnly: boolean;
  showSlide?: boolean;
  onToggleSlide?: () => void;
  onRemove: () => void;
  onGamePlanNotesChange: (gamePlanId: string, notes: string) => void;
  onGamePlanReplaysChange: (gamePlanId: string, replays: string[]) => void;
  onGamePlanBringChange: (gamePlanId: string, bringIndex: 0 | 1 | 2 | 3, pokemonIndex: number | null) => void;
  onReorderBring: (gamePlanId: string, fromIndex: 0 | 1 | 2 | 3, toIndex: 0 | 1 | 2 | 3) => void;
  onResultChange: (gamePlanId: string, result: GameResult) => void;
  onAddGamePlan: () => void;
  onRemoveGamePlan: (gamePlanId: string) => void;
}

export function MatchupSheetRow({
  plan,
  rowNumber,
  yourPokemon,
  isReadOnly,
  showSlide = true,
  onToggleSlide,
  onRemove,
  onGamePlanNotesChange,
  onGamePlanReplaysChange,
  onGamePlanBringChange,
  onReorderBring,
  onResultChange,
  onAddGamePlan,
  onRemoveGamePlan,
}: MatchupSheetRowProps) {
  const [expanded, setExpanded] = useState(false);
  const gamePlansRef = useRef<HTMLDivElement>(null);
  const prevPlanCount = useRef(plan.gamePlans.length);

  useEffect(() => {
    if (plan.gamePlans.length > prevPlanCount.current && gamePlansRef.current) {
      const lastChild = gamePlansRef.current.lastElementChild;
      lastChild?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    prevPlanCount.current = plan.gamePlans.length;
  }, [plan.gamePlans.length]);

  const opponentPokemon = useMemo(() => {
    const parsed = parseShowdownPaste(plan.opponentPaste);
    return parsed.pokemon.map((p) => p.species);
  }, [plan.opponentPaste]);

  // Gather bring sprites from first game plan for a quick preview
  const firstPlan = plan.gamePlans[0];
  const bringPreview = firstPlan
    ? firstPlan.bring
        .filter((idx): idx is number => idx !== null)
        .map((idx) => yourPokemon[idx]?.parsed.species)
        .filter(Boolean)
    : [];

  // Collect results for preview
  const resultPreview = plan.gamePlans
    .map((gp) => gp.result)
    .filter((r): r is "W" | "L" | "T" => r != null);

  return (
    <div className="bg-surface border border-border rounded-2xl shadow-sm">
      {/* Collapsed header — clickable to expand */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setExpanded(!expanded)}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setExpanded(!expanded); } }}
        className={`w-full flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3 sm:py-4 transition-colors cursor-pointer select-none ${
          expanded ? "bg-surface-alt/50 rounded-t-2xl" : "hover:bg-surface-alt/30 rounded-2xl"
        }`}
      >
        {/* Row number */}
        <span className="text-base sm:text-lg font-bold text-text-tertiary w-8 flex-shrink-0">
          #{rowNumber}
        </span>

        {/* Opponent info */}
        <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <span className="text-base sm:text-lg font-semibold text-text-primary truncate sm:max-w-[280px]" title={plan.opponentLabel}>
            {plan.opponentLabel}
          </span>

          {/* Opponent sprites */}
          <div className="flex items-center gap-1.5 overflow-x-auto max-w-[220px] sm:max-w-none">
            {opponentPokemon.map((species, i) => (
              <div key={i} className="w-9 h-9 flex items-center justify-center flex-shrink-0">
                <PokemonSprite species={species} size={34} />
              </div>
            ))}
          </div>
        </div>

        {/* Right side: results + bring preview + plan count + expand arrow */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {resultPreview.length > 0 && (
            <div className="hidden sm:flex items-center gap-1">
              {resultPreview.map((r, i) => (
                <ResultBadge key={i} result={r} />
              ))}
            </div>
          )}
          {bringPreview.length > 0 && (
            <div className="hidden sm:flex items-center gap-0.5">
              {bringPreview.map((species, i) => (
                <PokemonSprite key={i} species={species} size={22} />
              ))}
            </div>
          )}
          <span className="text-sm font-medium text-text-tertiary whitespace-nowrap">
            {plan.gamePlans.length} plan{plan.gamePlans.length !== 1 ? "s" : ""}
          </span>
          <span
            className="text-text-tertiary text-xs transition-transform duration-200"
            style={{ transform: expanded ? "rotate(0deg)" : "rotate(-90deg)" }}
          >
            &#9662;
          </span>
        </div>

        {/* Slide visibility toggle + Remove button */}
        {!isReadOnly && (
          <div className="flex items-center gap-1 flex-shrink-0">
            {onToggleSlide && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onToggleSlide(); }}
                className={`p-1.5 rounded-lg transition-colors ${
                  showSlide
                    ? "text-accent hover:bg-accent/10"
                    : "text-text-tertiary hover:bg-surface-alt"
                }`}
                title={showSlide ? "Has dedicated slide — click to hide" : "No dedicated slide — click to show"}
              >
                {showSlide ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
                    <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                )}
              </button>
            )}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onRemove(); }}
              className="text-text-tertiary hover:text-red-400 p-1.5 rounded-lg hover:bg-red-400/10 transition-colors"
              title="Remove matchup"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Expanded game plans */}
      {expanded && (
        <div ref={gamePlansRef} className="px-4 sm:px-5 py-4 border-t border-border space-y-3">
          {/* Game plan header */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold uppercase tracking-widest text-text-tertiary">
              Game Plans ({plan.gamePlans.length}/3)
            </span>
            {!isReadOnly && plan.gamePlans.length < 3 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onAddGamePlan}
                className="text-accent"
              >
                + Add Game Plan
              </Button>
            )}
          </div>

          {/* Individual game plans */}
          {plan.gamePlans.map((gp, gpIndex) => (
            <InlineGamePlan
              key={gp.id}
              gamePlan={gp}
              index={gpIndex}
              yourPokemon={yourPokemon}
              isReadOnly={isReadOnly}
              canDelete={plan.gamePlans.length > 1}
              onNotesChange={(notes) => onGamePlanNotesChange(gp.id, notes)}
              onReplaysChange={(replays) => onGamePlanReplaysChange(gp.id, replays)}
              onBringChange={(bringIdx, pokIdx) => onGamePlanBringChange(gp.id, bringIdx, pokIdx)}
              onReorderBring={(fromIdx, toIdx) => onReorderBring(gp.id, fromIdx, toIdx)}
              onResultChange={(result) => onResultChange(gp.id, result)}
              onDelete={() => onRemoveGamePlan(gp.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface InlineGamePlanProps {
  gamePlan: GamePlan;
  index: number;
  yourPokemon: AnalyzedPokemon[];
  isReadOnly: boolean;
  canDelete: boolean;
  onNotesChange: (notes: string) => void;
  onReplaysChange: (replays: string[]) => void;
  onBringChange: (bringIndex: 0 | 1 | 2 | 3, pokemonIndex: number | null) => void;
  onReorderBring: (fromIndex: 0 | 1 | 2 | 3, toIndex: 0 | 1 | 2 | 3) => void;
  onResultChange: (result: GameResult) => void;
  onDelete: () => void;
}

function InlineGamePlan({
  gamePlan,
  index,
  yourPokemon,
  isReadOnly,
  canDelete,
  onNotesChange,
  onReplaysChange,
  onBringChange,
  onReorderBring,
  onResultChange,
  onDelete,
}: InlineGamePlanProps) {
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
    <div className={`bg-surface border border-border rounded-xl border-l-[3px] ${color.accent}`}>
      <div className="px-4 py-3">
        {/* Game plan header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center justify-center w-7 h-7 rounded-md text-xs font-bold border ${color.badge}`}>
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
          </div>
          {!isReadOnly && canDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="text-text-tertiary hover:text-red-400 text-xs px-2 py-1 rounded-md hover:bg-red-400/10 transition-colors"
            >
              Delete
            </button>
          )}
        </div>

        {/* Bring four + notes side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-4">
          {/* Bring Four */}
          <div>
            <span className="text-sm font-semibold uppercase tracking-widest text-text-tertiary block mb-2">
              Bring Four
            </span>
            <div className="grid grid-cols-4 gap-2">
              {([0, 1, 2, 3] as const).map((bringIdx) => {
                const hasSelection = gamePlan.bring[bringIdx] !== null;
                return (
                  <div
                    key={bringIdx}
                    onDragOver={(e) => handleDragOver(e, bringIdx)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, bringIdx)}
                    className={`transition-all rounded-xl ${
                      dragOverIndex === bringIdx ? "ring-2 ring-accent/50 scale-105" : ""
                    }`}
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
          <div className="flex flex-col gap-3">
            <div>
              <span className="text-sm font-semibold uppercase tracking-widest text-text-tertiary block mb-2">
                Notes
              </span>
              {isReadOnly ? (
                <div className="w-full min-h-[5rem] p-3 sm:p-4 bg-surface-alt border border-border-subtle rounded-lg text-sm sm:text-base text-text-primary whitespace-pre-wrap leading-relaxed">
                  {gamePlan.notes || "No notes."}
                </div>
              ) : (
                <textarea
                  value={gamePlan.notes}
                  onChange={(e) => onNotesChange(e.target.value)}
                  placeholder="Why are you bringing these four? What's the win condition?"
                  className="w-full min-h-[5rem] p-3 sm:p-4 bg-surface-alt border border-border-subtle rounded-lg text-sm sm:text-base text-text-primary placeholder:text-text-tertiary resize-y focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent leading-relaxed transition-shadow"
                  spellCheck={false}
                  onClick={(e) => e.stopPropagation()}
                />
              )}
            </div>

            {/* Replays */}
            {(gamePlan.replays.length > 0 || !isReadOnly) && (
              <div>
                <span className="text-sm font-semibold uppercase tracking-widest text-text-tertiary block mb-2">
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
                                onClick={(e) => e.stopPropagation()}
                              >
                                {info.label}
                              </a>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onReplaysChange(gamePlan.replays.filter((_, j) => j !== i));
                                }}
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
                  <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
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
                      className="flex-1 min-w-0 px-2.5 py-1.5 bg-surface-alt border border-border-subtle rounded-lg text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-shadow"
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
    </div>
  );
}
