"use client";

import { useState, useRef, useEffect } from "react";
import QRCode from "qrcode";
import type { AnalyzedPokemon } from "@/lib/types/analysis";
import type { SpriteConfig } from "@/lib/types/sprites";
import { PokemonCard } from "./PokemonCard";
import { TeamStats } from "./TeamStats";
import { useTranslation } from "@/lib/i18n";
import { ARCHETYPES, REGULATIONS, EVENT_TYPES } from "@/lib/data/tags";
import type { ReportTags } from "@/lib/data/tags";

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
  tags?: ReportTags;
  onTagsChange?: (tags: ReportTags) => void;
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
  tags,
  onTagsChange,
  isReadOnly,
  getSpriteConfig,
  onReorderPokemon,
}: TeamOverviewProps) {
  const { t } = useTranslation();
  const hasTournamentInfo = !!(tournamentName || placement || record);
  const hasCreatorInfo = !!creatorName;
  const [rentalCopied, setRentalCopied] = useState(false);
  const [summaryExpanded, setSummaryExpanded] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragCounter = useRef(0);
  const canDrag = !isReadOnly && !!onReorderPokemon;

  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!rentalCode) { setQrDataUrl(null); return; }
    QRCode.toDataURL(rentalCode, { width: 80, margin: 1, color: { dark: "#000000", light: "#ffffff" } })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(null));
  }, [rentalCode]);

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
              <div className="flex items-center gap-3 self-start">
                <button
                  onClick={copyRentalCode}
                  className="flex items-center gap-2 px-3 py-1.5 bg-surface border-2 border-border rounded-lg hover:bg-surface-alt hover:border-accent/30 transition-all"
                  title={t.copyRentalCode}
                >
                  <span className="text-sm font-[family-name:var(--font-mono)] font-extrabold text-text-primary tracking-widest">
                    {rentalCode}
                  </span>
                  <span className={`text-xs font-semibold transition-colors duration-200 ${rentalCopied ? "text-emerald-500" : "text-text-tertiary"}`}>
                    {rentalCopied ? "\u2713 " + t.copied : t.copy}
                  </span>
                </button>
                {qrDataUrl && (
                  <img
                    src={qrDataUrl}
                    alt={`QR code for rental code ${rentalCode}`}
                    width={64}
                    height={64}
                    className="rounded-lg border border-border shadow-sm"
                  />
                )}
              </div>
            )}
            {creatorName && (
              <p className="text-sm text-text-secondary font-medium">
                {t.by} <span className="text-text-primary font-bold">{creatorName}</span>
              </p>
            )}
            {tags && (tags.archetype?.length || tags.regulation || tags.eventType) && (
              <div className="flex flex-wrap gap-1.5 mt-1">
                {tags.regulation && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                    {tags.regulation}
                  </span>
                )}
                {tags.eventType && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                    {tags.eventType}
                  </span>
                )}
                {tags.archetype?.map((a) => (
                  <span key={a} className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-accent/10 text-accent border border-accent/20">
                    {a}
                  </span>
                ))}
              </div>
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
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:flex sm:gap-3 sm:w-auto">
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
          <p className="text-[10px] text-text-tertiary mt-1.5 flex items-center gap-1">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            Optional — but filling these in helps your report appear in search results on the Explore page.
          </p>

          {/* Tags */}
          <div className="mt-3 flex flex-col gap-2">
            <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-text-tertiary">Tags</h4>
            <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
              <select
                value={tags?.regulation ?? ""}
                onChange={(e) => onTagsChange?.({ ...(tags ?? {}), regulation: e.target.value || undefined })}
                className="w-full sm:w-[140px] px-3 py-2 bg-surface border-2 border-border rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-shadow"
              >
                <option value="">Regulation</option>
                {REGULATIONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
              <select
                value={tags?.eventType ?? ""}
                onChange={(e) => onTagsChange?.({ ...(tags ?? {}), eventType: e.target.value || undefined })}
                className="w-full sm:w-[160px] px-3 py-2 bg-surface border-2 border-border rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-shadow"
              >
                <option value="">Event Type</option>
                {EVENT_TYPES.map((e) => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {ARCHETYPES.map((a) => {
                const active = tags?.archetype?.includes(a);
                return (
                  <button
                    key={a}
                    type="button"
                    onClick={() => {
                      const current = tags?.archetype ?? [];
                      const next = active ? current.filter((x) => x !== a) : [...current, a];
                      onTagsChange?.({ ...(tags ?? {}), archetype: next.length > 0 ? next : undefined });
                    }}
                    className={`text-xs font-semibold px-2.5 py-1 rounded-md border transition-all ${
                      active
                        ? "bg-accent text-white border-accent shadow-sm shadow-accent/20"
                        : "bg-surface-alt/50 text-text-secondary border-border hover:border-accent/30 hover:text-accent"
                    }`}
                  >
                    {a}
                  </button>
                );
              })}
            </div>
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
            <div className="relative">
              <div
                className={`w-full p-5 sm:p-6 bg-surface border border-border rounded-xl text-base sm:text-lg text-text-primary whitespace-pre-wrap leading-relaxed presenting:text-xl presenting:leading-9 presenting:p-8 presenting:bg-surface-alt presenting:border-border-subtle presenting:tracking-wide ${
                  !summaryExpanded && summary.length > 200 ? "sm:min-h-[8rem] max-h-28 sm:max-h-none overflow-hidden" : "min-h-[8rem]"
                }`}
              >
                {summary}
              </div>
              {/* Show more/less toggle — mobile only, for long summaries */}
              {summary.length > 200 && (
                <button
                  type="button"
                  onClick={() => setSummaryExpanded(!summaryExpanded)}
                  className={`sm:hidden w-full text-center py-2 text-xs font-bold text-accent active:scale-[0.97] transition-all ${
                    !summaryExpanded ? "-mt-8 relative z-10 bg-gradient-to-t from-surface via-surface/95 to-transparent pt-6 rounded-b-xl border-x border-b border-border" : "mt-1"
                  }`}
                >
                  {summaryExpanded ? "Show less" : "Show more"}
                </button>
              )}
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

      {/* Team Stats Summary */}
      <div className="mb-3 sm:mb-4">
        <TeamStats pokemon={pokemon} />
      </div>

      {/* Pokemon Grid */}
      <div data-walkthrough="pokemon-grid" className={`stagger-children grid gap-3 sm:gap-4 creator:gap-6 ${
        creatorMode
          ? "grid-cols-1 sm:grid-cols-2"
          : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
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
