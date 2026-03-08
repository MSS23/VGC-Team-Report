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
  onRemove: () => void;
}

export function MatchupSheetRow({
  plan,
  rowNumber,
  yourPokemon,
  isReadOnly,
  onRemove,
}: MatchupSheetRowProps) {
  const opponentPokemon = useMemo(() => {
    const parsed = parseShowdownPaste(plan.opponentPaste);
    return parsed.pokemon.map((p) => p.species);
  }, [plan.opponentPaste]);

  // Gather bring info from first game plan — lead (0,1) and back (2,3)
  const firstPlan = plan.gamePlans[0];
  const leadPreview = firstPlan
    ? ([0, 1] as const)
        .map((i) => firstPlan.bring[i])
        .filter((idx): idx is number => idx !== null)
        .map((idx) => yourPokemon[idx]?.parsed.species)
        .filter(Boolean)
    : [];
  const backPreview = firstPlan
    ? ([2, 3] as const)
        .map((i) => firstPlan.bring[i])
        .filter((idx): idx is number => idx !== null)
        .map((idx) => yourPokemon[idx]?.parsed.species)
        .filter(Boolean)
    : [];
  const hasBringPreview = leadPreview.length > 0 || backPreview.length > 0;

  return (
    <div className="bg-surface border border-border rounded-2xl shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-2 sm:gap-4 px-3 sm:px-5 py-3 sm:py-4">
        {/* Row number */}
        <span className="text-sm font-bold text-text-tertiary/60 tabular-nums w-5 sm:w-6 flex-shrink-0 text-center">
          {rowNumber}
        </span>

        {/* Opponent info */}
        <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-4">
          <span
            className="text-sm sm:text-lg font-semibold text-text-primary truncate sm:max-w-[280px]"
            title={plan.opponentLabel}
          >
            {plan.opponentLabel}
          </span>

          {/* Opponent sprites */}
          <div className="flex items-center gap-0.5 sm:gap-1 overflow-x-auto max-w-full sm:max-w-none scroll-smooth-touch">
            {opponentPokemon.map((species, i) => (
              <div key={i} className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center flex-shrink-0">
                <PokemonSprite species={species} size={26} className="sm:hidden" />
                <PokemonSprite species={species} size={30} className="hidden sm:block" />
              </div>
            ))}
          </div>
        </div>

        {/* Right side: lead/back preview + plan count + actions */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {hasBringPreview && (
            <div className="hidden sm:flex items-center gap-2">
              {/* Lead preview */}
              {leadPreview.length > 0 && (
                <div className="flex items-center gap-0.5">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-blue-400/70 mr-0.5">L</span>
                  {leadPreview.map((species, i) => (
                    <PokemonSprite key={i} species={species} size={20} />
                  ))}
                </div>
              )}
              {/* Back preview */}
              {backPreview.length > 0 && (
                <div className="flex items-center gap-0.5">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-amber-400/70 mr-0.5">B</span>
                  {backPreview.map((species, i) => (
                    <PokemonSprite key={i} species={species} size={20} />
                  ))}
                </div>
              )}
            </div>
          )}

          <span className="text-xs font-medium text-text-tertiary whitespace-nowrap px-2 py-1 bg-surface-alt rounded-md">
            {plan.gamePlans.length} plan{plan.gamePlans.length !== 1 ? "s" : ""}
          </span>

          {/* Remove */}
          {!isReadOnly && (
            <button
              type="button"
              onClick={onRemove}
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
      </div>
    </div>
  );
}
