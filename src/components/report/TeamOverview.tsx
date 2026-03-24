"use client";

import { useState, useRef } from "react";
import type { AnalyzedPokemon } from "@/lib/types/analysis";
import type { SpriteConfig } from "@/lib/types/sprites";
import { PokemonCard } from "./PokemonCard";
import { useTranslation } from "@/lib/i18n";

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
  creatorName?: string;
  onCreatorNameChange?: (text: string) => void;
  mvpIndex?: number | null;
  onMvpIndexChange?: (index: number | null) => void;
  isReadOnly: boolean;
  getSpriteConfig?: (key: string) => SpriteConfig;
  onReorderPokemon?: (fromIndex: number, toIndex: number) => void;
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
  creatorName,
  onCreatorNameChange,
  mvpIndex,
  onMvpIndexChange,
  isReadOnly,
  getSpriteConfig,
  onReorderPokemon,
}: TeamOverviewProps) {
  const { t } = useTranslation();
  const hasTournamentInfo = !!(tournamentName || placement || record);
  const hasCreatorInfo = !!creatorName;
  const [rentalCopied, setRentalCopied] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragCounter = useRef(0);
  const canDrag = !isReadOnly && !!onReorderPokemon;

  const copyRentalCode = () => {
    if (!rentalCode) return;
    navigator.clipboard.writeText(rentalCode);
    setRentalCopied(true);
    setTimeout(() => setRentalCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-4 sm:gap-8 animate-fade-in">
      {/* Tournament Context */}
      {isReadOnly ? (
        (hasTournamentInfo || rentalCode || hasCreatorInfo) && (
          <div className="flex flex-col gap-2 px-1">
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              {tournamentName && (
                <h2 className="text-lg sm:text-2xl font-extrabold text-text-primary tracking-tight">
                  {tournamentName}
                </h2>
              )}
              {placement && (
                <span className="text-sm font-extrabold text-accent bg-accent-surface px-3 py-1 rounded-md border border-accent/20 tracking-wide">
                  {placement}
                </span>
              )}
              {record && (
                <span className="text-sm text-text-secondary font-semibold">({record})</span>
              )}
            </div>
            {rentalCode && (
              <button
                onClick={copyRentalCode}
                className="flex items-center gap-2 self-start px-3 py-1.5 bg-surface border-2 border-border rounded-lg hover:bg-surface-alt hover:border-accent/30 transition-all"
                title={t.copyRentalCode}
              >
                <span className="text-sm font-[family-name:var(--font-mono)] font-extrabold text-text-primary tracking-widest">
                  {rentalCode}
                </span>
                <span className="text-xs font-semibold text-text-tertiary">
                  {rentalCopied ? t.copied : t.copy}
                </span>
              </button>
            )}
            {creatorName && (
              <p className="text-sm text-text-secondary font-medium">
                {t.by} <span className="text-text-primary font-bold">{creatorName}</span>
              </p>
            )}
          </div>
        )
      ) : (
        <div>
          <h3 className="text-xs font-extrabold uppercase tracking-widest text-text-tertiary mb-3" data-walkthrough="tournament-info">
            {t.tournamentInfo}
          </h3>
          <div className="flex flex-col gap-1.5 sm:flex-row sm:flex-wrap sm:gap-3">
            <input
              type="text"
              value={tournamentName ?? ""}
              onChange={(e) => onTournamentNameChange?.(e.target.value)}
              placeholder={t.eventNamePlaceholder}
              className="w-full sm:flex-1 sm:min-w-[180px] px-3 sm:px-4 py-2 sm:py-2.5 bg-surface border-2 border-border rounded-lg text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-shadow"
            />
            <div className="grid grid-cols-3 gap-1.5 sm:flex sm:gap-3 sm:w-auto">
              <input
                type="text"
                value={placement ?? ""}
                onChange={(e) => onPlacementChange?.(e.target.value)}
                placeholder={t.placementPlaceholder}
                className="w-full sm:w-[140px] px-3 sm:px-4 py-2 sm:py-2.5 bg-surface border-2 border-border rounded-lg text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-shadow"
              />
              <input
                type="text"
                value={record ?? ""}
                onChange={(e) => onRecordChange?.(e.target.value)}
                placeholder={t.recordPlaceholder}
                className="w-full sm:w-[120px] px-3 sm:px-4 py-2 sm:py-2.5 bg-surface border-2 border-border rounded-lg text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-shadow"
              />
              <input
                type="text"
                value={rentalCode ?? ""}
                onChange={(e) => onRentalCodeChange?.(e.target.value.toUpperCase())}
                placeholder={t.rentalPlaceholder}
                maxLength={20}
                className="w-full sm:flex-none sm:w-[160px] px-3 sm:px-4 py-2 sm:py-2.5 bg-surface border-2 border-border rounded-lg text-sm font-[family-name:var(--font-mono)] font-bold text-text-primary placeholder:text-text-tertiary placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-shadow tracking-widest"
              />
            </div>
            <input
              type="text"
              value={creatorName ?? ""}
              onChange={(e) => onCreatorNameChange?.(e.target.value)}
              placeholder={t.creatorNamePlaceholder}
              className="w-full sm:flex-1 sm:min-w-[200px] px-3 sm:px-4 py-2 sm:py-2.5 bg-surface border-2 border-border rounded-lg text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-shadow"
            />
          </div>
        </div>
      )}

      {/* Team Summary */}
      <div>
        <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-widest text-text-tertiary mb-2 sm:mb-3 presenting:text-base presenting:mb-4" data-walkthrough="team-summary">
          {t.teamSummary}
        </h3>
        {isReadOnly ? (
          summary ? (
            <div className="w-full min-h-[8rem] p-5 sm:p-6 bg-surface border border-border rounded-xl text-base sm:text-lg text-text-primary whitespace-pre-wrap leading-relaxed presenting:text-xl presenting:leading-9 presenting:p-8 presenting:bg-surface-alt presenting:border-border-subtle presenting:tracking-wide">
              {summary}
            </div>
          ) : (
            <div className="w-full p-5 sm:p-6 bg-surface-alt/50 border border-border-subtle rounded-xl text-base text-text-tertiary italic font-medium presenting:text-lg presenting:p-8">
              {t.noTeamSummary}
            </div>
          )
        ) : (
          <textarea
            value={summary}
            onChange={(e) => onSummaryChange(e.target.value)}
            placeholder={t.teamSummaryPlaceholder}
            className="w-full min-h-[4rem] sm:min-h-[8rem] p-3 sm:p-6 bg-surface border-2 border-border rounded-xl text-sm sm:text-lg text-text-primary placeholder:text-text-tertiary resize-y focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent leading-relaxed transition-shadow"
            spellCheck={false}
          />
        )}
      </div>

      {/* Pokemon Grid */}
      <div data-walkthrough="pokemon-grid" className={`stagger-children grid gap-2 sm:gap-4 creator:gap-6 ${
        creatorMode
          ? "grid-cols-2 md:grid-cols-2"
          : "grid-cols-2 sm:grid-cols-2 lg:grid-cols-3"
      }`}>
        {pokemon.map((mon, i) => {
          const sc = getSpriteConfig?.(speciesKeys[i]);
          const isDragging = dragIndex === i;
          const isDragOver = dragOverIndex === i && dragIndex !== i;
          return (
            <div
              key={`${mon.parsed.species}-${i}`}
              draggable={canDrag}
              onDragStart={(e) => {
                setDragIndex(i);
                e.dataTransfer.effectAllowed = "move";
                e.dataTransfer.setData("text/plain", String(i));
              }}
              onDragEnd={() => {
                setDragIndex(null);
                setDragOverIndex(null);
                dragCounter.current = 0;
              }}
              onDragEnter={(e) => {
                e.preventDefault();
                dragCounter.current++;
                setDragOverIndex(i);
              }}
              onDragLeave={() => {
                dragCounter.current--;
                if (dragCounter.current <= 0) {
                  setDragOverIndex(null);
                  dragCounter.current = 0;
                }
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
              }}
              onDrop={(e) => {
                e.preventDefault();
                const from = dragIndex ?? parseInt(e.dataTransfer.getData("text/plain"), 10);
                if (!isNaN(from) && from !== i) {
                  onReorderPokemon?.(from, i);
                }
                setDragIndex(null);
                setDragOverIndex(null);
                dragCounter.current = 0;
              }}
              className={`transition-all duration-200 rounded-2xl ${
                canDrag ? "cursor-grab active:cursor-grabbing" : ""
              } ${isDragging ? "opacity-40 scale-95" : ""} ${
                isDragOver ? "ring-2 ring-accent ring-offset-2 ring-offset-background scale-[1.02]" : ""
              }`}
            >
              <PokemonCard
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
            </div>
          );
        })}
      </div>

      {/* App trademark */}
      <div className="text-center pt-4 border-t border-border-subtle">
        <p className="text-xs text-text-tertiary/60 font-medium">
          {t.builtWith}{" "}
          <a
            href="https://x.com/Manny64Official"
            target="_blank"
            rel="noopener noreferrer"
            className="text-text-tertiary/80 hover:text-accent transition-colors font-bold"
          >
            @Manny64Official
          </a>
        </p>
      </div>

    </div>
  );
}
