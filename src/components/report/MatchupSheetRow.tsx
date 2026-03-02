"use client";

import { useMemo } from "react";
import type { MatchupPlan } from "@/hooks/useMatchupPlans";
import type { AnalyzedPokemon } from "@/lib/types/analysis";
import { parseShowdownPaste } from "@/lib/parser/showdown-parser";
import { PokemonSprite } from "./PokemonSprite";

interface MatchupSheetRowProps {
  plan: MatchupPlan;
  rowNumber: number;
  yourPokemon: AnalyzedPokemon[];
  isReadOnly: boolean;
  showSlide?: boolean;
  onToggleSlide?: () => void;
  onRemove: () => void;
}

export function MatchupSheetRow({
  plan,
  rowNumber,
  yourPokemon,
  isReadOnly,
  showSlide = true,
  onToggleSlide,
  onRemove,
}: MatchupSheetRowProps) {
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
    <div className={`bg-surface border border-border rounded-2xl shadow-sm transition-opacity ${
      !showSlide ? "opacity-50" : ""
    }`}>
      <div className="flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3 sm:py-4">
        {/* Row number */}
        <span className="text-base sm:text-lg font-bold text-text-tertiary w-8 flex-shrink-0">
          #{rowNumber}
        </span>

        {/* Opponent info */}
        <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <span
            className="text-base sm:text-lg font-semibold text-text-primary truncate sm:max-w-[280px]"
            title={plan.opponentLabel}
          >
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

        {/* Right side: bring preview + plan count + actions */}
        <div className="flex items-center gap-3 flex-shrink-0">
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

          {/* Hide/show slide + Remove */}
          {!isReadOnly && (
            <div className="flex items-center gap-1 flex-shrink-0">
              {onToggleSlide && (
                <button
                  type="button"
                  onClick={onToggleSlide}
                  className={`p-1.5 rounded-lg transition-colors ${
                    showSlide
                      ? "text-accent hover:bg-accent/10"
                      : "text-text-tertiary hover:bg-surface-alt"
                  }`}
                  title={showSlide ? "Hide this slide" : "Show this slide"}
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
                onClick={onRemove}
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
      </div>
    </div>
  );
}
