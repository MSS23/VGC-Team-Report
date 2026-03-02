"use client";

import { useMemo, useState } from "react";
import type { MatchupPlan, GamePlan } from "@/hooks/useMatchupPlans";
import type { AnalyzedPokemon } from "@/lib/types/analysis";
import { parseShowdownPaste } from "@/lib/parser/showdown-parser";
import { PokemonSprite } from "./PokemonSprite";
import { PokemonDropdown } from "./PokemonDropdown";
import { Button } from "@/components/ui/Button";

const GAME_COLORS = [
  { badge: "bg-blue-500/20 text-blue-400 border-blue-500/30", accent: "border-l-blue-500" },
  { badge: "bg-amber-500/20 text-amber-400 border-amber-500/30", accent: "border-l-amber-500" },
  { badge: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", accent: "border-l-emerald-500" },
] as const;

interface MatchupSheetRowProps {
  plan: MatchupPlan;
  rowNumber: number;
  yourPokemon: AnalyzedPokemon[];
  isReadOnly: boolean;
  onRemove: () => void;
  onGamePlanNotesChange: (gamePlanId: string, notes: string) => void;
  onGamePlanBringChange: (gamePlanId: string, bringIndex: 0 | 1 | 2 | 3, pokemonIndex: number | null) => void;
  onReorderBring: (gamePlanId: string, fromIndex: 0 | 1 | 2 | 3, toIndex: 0 | 1 | 2 | 3) => void;
  onAddGamePlan: () => void;
  onRemoveGamePlan: (gamePlanId: string) => void;
}

export function MatchupSheetRow({
  plan,
  rowNumber,
  yourPokemon,
  isReadOnly,
  onRemove,
  onGamePlanNotesChange,
  onGamePlanBringChange,
  onReorderBring,
  onAddGamePlan,
  onRemoveGamePlan,
}: MatchupSheetRowProps) {
  const [expanded, setExpanded] = useState(false);

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
        <span className="text-sm font-bold text-text-tertiary w-8 flex-shrink-0">
          #{rowNumber}
        </span>

        {/* Opponent info */}
        <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <span className="text-sm font-semibold text-text-primary truncate sm:max-w-[240px]" title={plan.opponentLabel}>
            {plan.opponentLabel}
          </span>

          {/* Opponent sprites */}
          <div className="flex items-center gap-1">
            {opponentPokemon.map((species, i) => (
              <div key={i} className="w-7 h-7 flex items-center justify-center flex-shrink-0">
                <PokemonSprite species={species} size={26} />
              </div>
            ))}
          </div>
        </div>

        {/* Right side: bring preview + plan count + expand arrow */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {bringPreview.length > 0 && (
            <div className="hidden sm:flex items-center gap-0.5">
              {bringPreview.map((species, i) => (
                <PokemonSprite key={i} species={species} size={22} />
              ))}
            </div>
          )}
          <span className="text-xs font-medium text-text-tertiary whitespace-nowrap">
            {plan.gamePlans.length} plan{plan.gamePlans.length !== 1 ? "s" : ""}
          </span>
          <span
            className="text-text-tertiary text-xs transition-transform duration-200"
            style={{ transform: expanded ? "rotate(0deg)" : "rotate(-90deg)" }}
          >
            &#9662;
          </span>
        </div>

        {/* Remove button */}
        {!isReadOnly && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            className="text-text-tertiary hover:text-red-400 p-1.5 rounded-lg hover:bg-red-400/10 transition-colors flex-shrink-0"
            title="Remove matchup"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      {/* Expanded game plans */}
      {expanded && (
        <div className="px-4 sm:px-5 py-4 border-t border-border space-y-3">
          {/* Game plan header */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-text-tertiary">
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
              onBringChange={(bringIdx, pokIdx) => onGamePlanBringChange(gp.id, bringIdx, pokIdx)}
              onReorderBring={(fromIdx, toIdx) => onReorderBring(gp.id, fromIdx, toIdx)}
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
  onBringChange: (bringIndex: 0 | 1 | 2 | 3, pokemonIndex: number | null) => void;
  onReorderBring: (fromIndex: 0 | 1 | 2 | 3, toIndex: 0 | 1 | 2 | 3) => void;
  onDelete: () => void;
}

function InlineGamePlan({
  gamePlan,
  index,
  yourPokemon,
  isReadOnly,
  canDelete,
  onNotesChange,
  onBringChange,
  onReorderBring,
  onDelete,
}: InlineGamePlanProps) {
  const color = GAME_COLORS[index] ?? GAME_COLORS[0];
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const dragType = `application/x-gameplan-${gamePlan.id}`;

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
            <span className={`inline-flex items-center justify-center w-6 h-6 rounded-md text-[10px] font-bold border ${color.badge}`}>
              {index + 1}
            </span>
            <span className="text-sm font-semibold text-text-primary">
              Game {index + 1}
            </span>
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
            <span className="text-[10px] font-semibold uppercase tracking-wider text-text-tertiary block mb-2">
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
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Notes */}
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-text-tertiary block mb-2">
              Notes
            </span>
            {isReadOnly ? (
              <div className="w-full min-h-[5rem] p-3 bg-surface-alt border border-border-subtle rounded-lg text-sm text-text-primary whitespace-pre-wrap leading-relaxed">
                {gamePlan.notes || "No notes."}
              </div>
            ) : (
              <textarea
                value={gamePlan.notes}
                onChange={(e) => onNotesChange(e.target.value)}
                placeholder="Why are you bringing these four? What's the win condition?"
                className="w-full min-h-[5rem] p-3 bg-surface-alt border border-border-subtle rounded-lg text-sm text-text-primary placeholder:text-text-tertiary resize-y focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent leading-relaxed transition-shadow"
                spellCheck={false}
                onClick={(e) => e.stopPropagation()}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
