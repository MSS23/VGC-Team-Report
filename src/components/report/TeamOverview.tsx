"use client";

import { useState } from "react";
import type { AnalyzedPokemon } from "@/lib/types/analysis";
import type { SpriteConfig } from "@/lib/types/sprites";
import { PokemonCard } from "./PokemonCard";

interface TeamOverviewProps {
  pokemon: AnalyzedPokemon[];
  creatorMode: boolean;
  speciesKeys: string[];
  roles: Record<string, string>;
  onRoleChange: (speciesKey: string, text: string) => void;
  summary: string;
  onSummaryChange: (text: string) => void;
  tournamentName?: string;
  onTournamentNameChange?: (text: string) => void;
  placement?: string;
  onPlacementChange?: (text: string) => void;
  record?: string;
  onRecordChange?: (text: string) => void;
  rentalCode?: string;
  onRentalCodeChange?: (text: string) => void;
  mvpIndex?: number | null;
  onMvpIndexChange?: (index: number | null) => void;
  isReadOnly: boolean;
  getSpriteConfig?: (key: string) => SpriteConfig;
}

export function TeamOverview({
  pokemon,
  creatorMode,
  speciesKeys,
  roles,
  onRoleChange,
  summary,
  onSummaryChange,
  tournamentName,
  onTournamentNameChange,
  placement,
  onPlacementChange,
  record,
  onRecordChange,
  rentalCode,
  onRentalCodeChange,
  mvpIndex,
  onMvpIndexChange,
  isReadOnly,
  getSpriteConfig,
}: TeamOverviewProps) {
  const hasTournamentInfo = !!(tournamentName || placement || record);
  const [rentalCopied, setRentalCopied] = useState(false);

  const copyRentalCode = () => {
    if (!rentalCode) return;
    navigator.clipboard.writeText(rentalCode);
    setRentalCopied(true);
    setTimeout(() => setRentalCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-6 sm:gap-8 animate-fade-in">
      {/* Tournament Context */}
      {isReadOnly ? (
        (hasTournamentInfo || rentalCode) && (
          <div className="flex items-center gap-3 flex-wrap px-1">
            {tournamentName && (
              <h2 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight">
                {tournamentName}
              </h2>
            )}
            {placement && (
              <span className="text-sm font-bold text-accent bg-accent-surface px-3 py-1 rounded-full border border-accent/20">
                {placement}
              </span>
            )}
            {record && (
              <span className="text-sm text-text-secondary font-medium">({record})</span>
            )}
            {rentalCode && (
              <button
                onClick={copyRentalCode}
                className="flex items-center gap-2 ml-auto px-3 py-1.5 bg-surface border border-border rounded-xl hover:bg-surface-alt transition-colors"
                title="Copy rental code"
              >
                <span className="text-sm font-mono font-bold text-text-primary tracking-wider">
                  {rentalCode}
                </span>
                <span className="text-xs text-text-tertiary">
                  {rentalCopied ? "Copied!" : "Copy"}
                </span>
              </button>
            )}
          </div>
        )
      ) : (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-widest text-text-tertiary mb-3" data-walkthrough="tournament-info">
            Tournament Info
          </h3>
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <input
              type="text"
              value={tournamentName ?? ""}
              onChange={(e) => onTournamentNameChange?.(e.target.value)}
              placeholder="Event name (e.g. EUIC 2025)"
              className="flex-1 min-w-[150px] sm:min-w-[180px] px-3 sm:px-4 py-2.5 bg-surface border border-border rounded-xl text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-shadow"
            />
            <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
              <input
                type="text"
                value={placement ?? ""}
                onChange={(e) => onPlacementChange?.(e.target.value)}
                placeholder="Placement"
                className="flex-1 sm:flex-none sm:w-[140px] px-3 sm:px-4 py-2.5 bg-surface border border-border rounded-xl text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-shadow"
              />
              <input
                type="text"
                value={record ?? ""}
                onChange={(e) => onRecordChange?.(e.target.value)}
                placeholder="Record"
                className="flex-1 sm:flex-none sm:w-[120px] px-3 sm:px-4 py-2.5 bg-surface border border-border rounded-xl text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-shadow"
              />
              <input
                type="text"
                value={rentalCode ?? ""}
                onChange={(e) => onRentalCodeChange?.(e.target.value.toUpperCase())}
                placeholder="Rental"
                maxLength={20}
                className="flex-1 sm:flex-none sm:w-[160px] px-3 sm:px-4 py-2.5 bg-surface border border-border rounded-xl text-sm font-mono font-bold text-text-primary placeholder:text-text-tertiary placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-shadow tracking-wider"
              />
            </div>
          </div>
        </div>
      )}

      {/* Team Summary */}
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-widest text-text-tertiary mb-3 presenting:text-base presenting:mb-4" data-walkthrough="team-summary">
          Team Summary
        </h3>
        {isReadOnly ? (
          summary ? (
            <div className="w-full min-h-[8rem] p-5 sm:p-6 bg-surface border border-border rounded-2xl text-base sm:text-lg text-text-primary whitespace-pre-wrap leading-relaxed presenting:text-xl presenting:leading-9 presenting:p-8 presenting:bg-surface-alt presenting:border-border-subtle presenting:tracking-wide">
              {summary}
            </div>
          ) : (
            <div className="w-full p-5 sm:p-6 bg-surface-alt/50 border border-border-subtle rounded-2xl text-base text-text-tertiary italic presenting:text-lg presenting:p-8">
              No team summary.
            </div>
          )
        ) : (
          <textarea
            value={summary}
            onChange={(e) => onSummaryChange(e.target.value)}
            placeholder="Summarize your team's overall strategy, win conditions, and key synergies..."
            className="w-full min-h-[8rem] p-5 sm:p-6 bg-surface border border-border rounded-2xl text-base sm:text-lg text-text-primary placeholder:text-text-tertiary resize-y focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent leading-relaxed transition-shadow"
            spellCheck={false}
          />
        )}
      </div>

      {/* Pokemon Grid */}
      <div data-walkthrough="pokemon-grid" className={`stagger-children grid gap-3 sm:gap-4 creator:gap-6 ${
        creatorMode
          ? "grid-cols-1 md:grid-cols-2"
          : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
      }`}>
        {pokemon.map((mon, i) => {
          const sc = getSpriteConfig?.(speciesKeys[i]);
          return (
            <PokemonCard
              key={`${mon.parsed.species}-${i}`}
              pokemon={mon}
              creatorMode={creatorMode}
              role={roles[speciesKeys[i]] ?? ""}
              onRoleChange={(text) => onRoleChange(speciesKeys[i], text)}
              isReadOnly={isReadOnly}
              isMvp={mvpIndex === i}
              onToggleMvp={() => onMvpIndexChange?.(mvpIndex === i ? null : i)}
              shiny={sc?.shiny}
              animated={sc?.animated}
            />
          );
        })}
      </div>

    </div>
  );
}
