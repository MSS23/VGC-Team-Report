"use client";

import { useMemo, useState } from "react";
import type { AnalyzedPokemon } from "@/lib/types/analysis";
import { Card } from "@/components/ui/Card";
import { PokemonSprite } from "./PokemonSprite";
import { TypeBadge } from "./TypeBadge";
import { getMoveTypeStyle } from "@/lib/utils/move-type-style";
import { NATURES } from "@/lib/data/natures";
import { useTranslation } from "@/lib/i18n";
import { translateMove } from "@/lib/utils/translate-move";
import { getRelevantStats } from "@/lib/utils/stat-relevance";
import { detectMegaFromItem, isMegaForm } from "@/lib/utils/mega-detect";
import { lookupPokemon } from "@/lib/data/pokemon";
import { calculateAllStats, calculateAllChampionsStats, CHAMPIONS_TOTAL_SP, CHAMPIONS_MAX_SP_PER_STAT, convertToChampionsSp } from "@/lib/analysis/stat-calculator";

interface PokemonCardProps {
  pokemon: AnalyzedPokemon;
  creatorMode: boolean;
  role?: string;
  onRoleChange?: (text: string) => void;
  isReadOnly?: boolean;
  isMvp?: boolean;
  onToggleMvp?: () => void;
  shiny?: boolean;
  animated?: boolean;
  isMega?: boolean;
  onToggleMega?: () => void;
  regulation?: string;
}

const STAT_COLORS: Record<string, string> = {
  hp: "var(--stat-hp)",
  atk: "var(--stat-atk)",
  def: "var(--stat-def)",
  spa: "var(--stat-spa)",
  spd: "var(--stat-spd)",
  spe: "var(--stat-spe)",
};

export function PokemonCard({ pokemon, creatorMode, role, onRoleChange, isReadOnly, isMvp, onToggleMvp, shiny = false, animated = true, isMega, onToggleMega, regulation }: PokemonCardProps) {
  const { t, language } = useTranslation();
  const { parsed, data, calculatedStats, itemBoost } = pokemon;
  const [showEvMode, setShowEvMode] = useState(false);

  // Mega Evolution detection
  const megaEntry = useMemo(
    () => detectMegaFromItem(parsed.item, parsed.species),
    [parsed.item, parsed.species],
  );
  const alreadyMega = isMegaForm(parsed.species);
  const canMega = !!megaEntry && !alreadyMega;
  // Auto-detect: if isMega prop is undefined and mega stone detected, default to mega
  const showMega = alreadyMega || (canMega && (isMega ?? true));
  // Only show toggle for M-A regulation or unset
  const showMegaToggle = canMega && (!regulation || regulation === "Reg M-A");

  // Resolve mega overrides for display
  const megaData = useMemo(() => {
    if (!showMega || !megaEntry) return null;
    return lookupPokemon(megaEntry.dataKey);
  }, [showMega, megaEntry]);

  const megaStats = useMemo(() => {
    if (!megaData) return null;
    return calculateAllStats(megaData.baseStats, parsed.ivs, parsed.evs, parsed.level, parsed.nature);
  }, [megaData, parsed.ivs, parsed.evs, parsed.level, parsed.nature]);

  // Champions stat recalculation when regulation is M-A
  const championsStats = useMemo(() => {
    if (regulation !== "Reg M-A") return null;
    const baseData = megaData ?? data;
    if (!baseData) return null;
    const sp = convertToChampionsSp(parsed.evs);
    return calculateAllChampionsStats(baseData.baseStats, sp, parsed.nature);
  }, [regulation, megaData, data, parsed.evs, parsed.nature]);

  const displaySpecies = showMega && megaEntry ? megaEntry.displayName : parsed.species;
  const displayTypes = (showMega && megaData ? megaData.types : data?.types) ?? [];
  const displayAbility = showMega && megaEntry ? megaEntry.ability : parsed.ability;
  const displayStats = championsStats ?? megaStats ?? calculatedStats;
  const displayData = megaData ?? data;
  // Sprite uses data key for mega form (e.g. "kangaskhan-mega")
  const spriteSpecies = showMega && megaEntry ? megaEntry.dataKey : parsed.species;

  const spriteSizeSm = creatorMode ? 64 : 44;
  const spriteSizeLg = creatorMode ? 120 : 104;
  const natureData = NATURES[parsed.nature];
  const relevantStats = getRelevantStats(parsed);

  // Non-default IVs (not 31)
  const nonDefaultIvs = (["hp", "atk", "def", "spa", "spd", "spe"] as const).filter(
    (stat) => parsed.ivs[stat] !== 31
  );
  const ivLabels = { hp: t.statHp, atk: t.statAtk, def: t.statDef, spa: t.statSpa, spd: t.statSpd, spe: t.statSpe } as const;

  return (
    <Card className={`p-2.5 sm:p-6 creator:p-7 flex flex-col gap-2 sm:gap-4 creator:gap-5 transition-all duration-200 ${
      isMvp ? "ring-2 ring-amber-400/60 shadow-lg shadow-amber-400/15 border-amber-400/30" : ""
    }`}>
      {/* MVP Banner */}
      {isMvp && (
        <div className="flex items-center gap-1.5 -mb-1">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-amber-500">
            <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
          </svg>
          <span className="text-xs font-extrabold text-amber-500 uppercase tracking-widest">{t.teamMvp}</span>
        </div>
      )}

      {/* Header: Sprite + Name + Types */}
      <div className="flex items-start gap-1.5 sm:gap-3 creator:gap-4">
        <div className="flex-shrink-0">
          <PokemonSprite
            species={spriteSpecies}
            size={spriteSizeSm}
            className="sm:hidden"
            animated={animated}
            shiny={shiny}
          />
          <PokemonSprite
            species={spriteSpecies}
            size={spriteSizeLg}
            className="hidden sm:block"
            animated={animated}
            shiny={shiny}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
            <h3 className="text-sm sm:text-lg font-extrabold text-text-primary creator:text-xl truncate leading-tight tracking-tight">
              {displaySpecies}
            </h3>
            {/* Mega Evolution toggle */}
            {showMegaToggle && (
              <button
                type="button"
                onClick={onToggleMega}
                className={`inline-flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-md text-[10px] sm:text-xs font-extrabold transition-all duration-200 ${
                  showMega
                    ? "bg-gradient-to-br from-pink-500 to-purple-600 text-white shadow-sm shadow-purple-500/30"
                    : "bg-surface-alt text-text-tertiary hover:text-purple-500 hover:bg-purple-500/10 border border-border-subtle"
                }`}
                title={showMega ? "Show base form" : "Show Mega Evolution"}
                aria-label={showMega ? "Show base form" : "Show Mega Evolution"}
              >
                M
              </button>
            )}
            {/* Mega indicator for already-mega imported Pokemon */}
            {alreadyMega && (
              <span className="inline-flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-md text-[10px] sm:text-xs font-extrabold bg-gradient-to-br from-pink-500 to-purple-600 text-white">
                M
              </span>
            )}
            {parsed.gender && (
              <span className={`text-sm font-bold ${parsed.gender === "M" ? "text-blue-500" : "text-pink-500"}`}>
                {parsed.gender === "M" ? "\u2642" : "\u2640"}
              </span>
            )}
            {/* MVP star */}
            {!isReadOnly && onToggleMvp && (
              <button
                type="button"
                onClick={onToggleMvp}
                className={`ml-auto p-2 rounded-lg transition-all duration-200 ${
                  isMvp
                    ? "text-amber-500 bg-amber-500/10"
                    : "text-text-tertiary/40 hover:text-amber-400 hover:bg-amber-400/5"
                }`}
                title={isMvp ? t.removeMvp : t.setAsMvp}
                aria-label={isMvp ? t.removeMvp : t.setAsMvp}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill={isMvp ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                  <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
                </svg>
              </button>
            )}
          </div>

          {/* Types */}
          <div className="flex items-center gap-0.5 sm:gap-1 mt-0.5 sm:mt-1.5 flex-wrap">
            {displayTypes.map((type) => (
              <TypeBadge key={type} type={type} />
            ))}
            {parsed.teraType && (
              <span className="flex items-center gap-0.5 ml-0.5 sm:ml-1">
                <span className="text-[9px] sm:text-xs text-text-tertiary font-semibold">{t.tera}:</span>
                <TypeBadge type={parsed.teraType} />
              </span>
            )}
          </div>

          {/* Item + Ability */}
          <div className="flex flex-wrap items-center gap-x-1.5 sm:gap-x-3 gap-y-0.5 mt-0.5 sm:mt-2 text-[10px] sm:text-sm text-text-secondary">
            {parsed.item && (
              <span className="font-bold text-text-primary">@ {parsed.item}</span>
            )}
            {displayAbility && <span className="font-medium">{displayAbility}</span>}
          </div>

          {/* Non-default IVs */}
          {nonDefaultIvs.length > 0 && (
            <div className="hidden sm:flex flex-wrap items-center gap-1.5 mt-1.5">
              {nonDefaultIvs.map((stat) => (
                <span
                  key={stat}
                  className="text-xs font-[family-name:var(--font-mono)] font-semibold text-text-tertiary bg-surface-alt px-1.5 py-0.5 rounded"
                >
                  {parsed.ivs[stat]} {ivLabels[stat]}
                </span>
              ))}
            </div>
          )}

          {/* Role */}
          {onRoleChange && !isReadOnly ? (
            <input
              type="text"
              value={role ?? ""}
              onChange={(e) => onRoleChange(e.target.value)}
              placeholder={t.rolePlaceholder}
              maxLength={40}
              className="mt-1.5 sm:mt-2.5 w-full text-[11px] sm:text-xs font-semibold px-2 sm:px-3 py-1 sm:py-1.5 bg-surface-alt/60 border-2 border-border-subtle rounded-lg text-text-primary placeholder:text-text-tertiary/60 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent/50 transition-all"
            />
          ) : role ? (
            <span className="mt-1 sm:mt-2.5 inline-flex items-center gap-1 sm:gap-1.5 text-[9px] sm:text-xs font-extrabold tracking-widest uppercase text-accent bg-accent-surface/80 border border-accent/20 px-2 py-1 sm:px-3 sm:py-1.5 rounded-md">
              <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-accent/60 flex-shrink-0" />
              {role}
            </span>
          ) : null}
        </div>
      </div>

      {/* Moves */}
      <div>
        <h4 className="text-[10px] sm:text-xs font-extrabold uppercase tracking-widest text-text-tertiary mb-0.5 sm:mb-2 creator:mb-2.5">
          {t.moves}
        </h4>
        <div className="grid grid-cols-2 gap-0.5 sm:gap-2 stagger-moves">
          {parsed.moves.map((move) => {
            const typeStyle = getMoveTypeStyle(move);
            return (
              <span
                key={move}
                className={`text-[10px] sm:text-sm creator:text-base leading-tight px-1.5 sm:px-3 py-1.5 sm:py-2 rounded-md sm:rounded-lg border font-semibold text-center transition-colors break-words hyphens-auto ${
                  typeStyle ? "shadow-sm" : "text-text-primary bg-surface-alt/60 border-transparent"
                }`}
                style={typeStyle ?? undefined}
              >
                {translateMove(move, language)}
              </span>
            );
          })}
        </div>
      </div>

      {/* Stats */}
      {displayData && (() => {
        const isChampions = regulation === "Reg M-A";
        const totalEvs = Object.values(parsed.evs).reduce((a, b) => a + b, 0);
        const spSpread = convertToChampionsSp(parsed.evs);
        const totalSp = (["hp", "atk", "def", "spa", "spd", "spe"] as const).reduce((sum, s) => sum + spSpread[s], 0);
        const isValidChampionsEv = (ev: number) => ev === 0 || (ev >= 4 && (ev - 4) % 8 === 0);
        const hasWastedEvs = isChampions && (["hp", "atk", "def", "spa", "spd", "spe"] as const).some((s) => !isValidChampionsEv(parsed.evs[s]) && parsed.evs[s] > 0);
        const overSp = isChampions && totalSp > CHAMPIONS_TOTAL_SP;

        return (
        <div>
          <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2 creator:mb-2.5 flex-wrap">
            <h4 className="text-[9px] sm:text-xs font-extrabold uppercase tracking-widest text-text-tertiary">
              {t.stats} <span className="normal-case tracking-normal font-medium text-text-tertiary/70 hidden sm:inline">({parsed.nature})</span>
            </h4>

            {isChampions ? (() => {
              const spCurrent = totalSp;
              const spMax = CHAMPIONS_TOTAL_SP;
              const spOver = spCurrent > spMax;
              const spUnder = spCurrent < spMax && spCurrent > 0;
              const evCurrent = totalEvs;
              const evOver = evCurrent > 510;
              const evUnder = evCurrent < 510 && evCurrent > 0;
              const spDot = spOver ? "bg-danger" : spUnder ? "bg-amber-500" : "bg-emerald-500";
              const evDot = evOver ? "bg-danger" : evUnder ? "bg-amber-500" : "bg-emerald-500";
              return (
                <div
                  role="tablist"
                  aria-label="Investment mode"
                  className="inline-flex h-7 items-center rounded-md bg-surface-alt border border-border p-0.5 gap-0.5 ml-auto"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={!showEvMode}
                    onClick={(e) => { e.stopPropagation(); setShowEvMode(false); }}
                    className={`inline-flex items-center gap-1 h-full rounded px-2 text-[10px] font-semibold tracking-wide tabular-nums transition-colors duration-150 min-w-[44px] cursor-pointer ${
                      !showEvMode
                        ? "bg-accent text-white shadow-sm"
                        : "text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    <span className={`h-1 w-1 rounded-full ${spDot}`} aria-hidden />
                    <span>SP</span>
                    <span className={!showEvMode ? "text-white/85" : "text-text-tertiary"}>
                      {spCurrent}/{spMax}
                    </span>
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={showEvMode}
                    onClick={(e) => { e.stopPropagation(); setShowEvMode(true); }}
                    className={`inline-flex items-center gap-1 h-full rounded px-2 text-[10px] font-semibold tracking-wide tabular-nums transition-colors duration-150 min-w-[44px] cursor-pointer ${
                      showEvMode
                        ? "bg-accent text-white shadow-sm"
                        : "text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    <span className={`h-1 w-1 rounded-full ${evDot}`} aria-hidden />
                    <span>EV</span>
                    <span className={showEvMode ? "text-white/85" : "text-text-tertiary"}>
                      {evCurrent}/510
                    </span>
                  </button>
                </div>
              );
            })() : (
              <>
                {totalEvs > 510 ? (
                  <span className="text-[10px] sm:text-xs font-bold text-danger ml-auto tabular-nums">{totalEvs}/510</span>
                ) : totalEvs > 0 && totalEvs < 510 ? (
                  <span className="text-[10px] sm:text-xs font-bold text-amber-500 ml-auto tabular-nums">{totalEvs}/510<span className="hidden sm:inline"> · {510 - totalEvs} left</span></span>
                ) : totalEvs > 0 ? (
                  <span className="text-[10px] sm:text-xs font-bold text-text-tertiary/50 ml-auto tabular-nums hidden sm:inline">{totalEvs}/510</span>
                ) : null}
              </>
            )}
          </div>

          {/* Critical warnings only: over budget or auto-converted */}
          {isChampions && !showEvMode && totalEvs > 0 && (overSp || (hasWastedEvs && !overSp)) && (
            <div className="flex flex-wrap gap-1.5 mb-1.5 sm:mb-2">
              {overSp && (
                <span className="text-[9px] sm:text-[10px] font-bold text-danger bg-danger/10 px-1.5 py-0.5 rounded">
                  Over budget by {totalSp - CHAMPIONS_TOTAL_SP} SP
                </span>
              )}
              {hasWastedEvs && !overSp && (
                <span className="text-[9px] sm:text-[10px] font-bold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded">
                  Auto-converted from EVs
                </span>
              )}
            </div>
          )}

          <div className="space-y-1 sm:space-y-1.5 stagger-stats" role="list" aria-label={`${displaySpecies} stats`}>
            {(["hp", "atk", "def", "spa", "spd", "spe"] as const).filter((stat) => relevantStats.has(stat)).map((stat) => {
              const value = displayStats[stat];
              const ev = parsed.evs[stat];
              const sp = spSpread[stat];
              const isBoosted = itemBoost?.stat === stat;
              const displayValue = isBoosted ? itemBoost.boostedValue : value;
              const maxStat = stat === "hp" ? 300 : 250;
              const percentage = Math.min((displayValue / maxStat) * 100, 100);
              const labels = { hp: t.statHp, atk: t.statAtk, def: t.statDef, spa: t.statSpa, spd: t.statSpd, spe: t.statSpe };
              const isOverMax = isChampions && sp > CHAMPIONS_MAX_SP_PER_STAT;

              // Champions default: show SP. Toggle to show EVs.
              const showSp = isChampions && !showEvMode;
              const investLabel = showSp ? sp : ev;
              const investUnit = showSp ? "SP" : "";

              return (
                <div key={stat} className="flex items-center gap-1 sm:gap-2" role="listitem" aria-label={`${labels[stat]}: ${displayValue}${showSp && sp > 0 ? `, ${sp} SP` : ev > 0 ? `, ${ev} EVs` : ""}${isBoosted ? `, boosted by item` : ""}`}>
                  <span className="text-[9px] sm:text-xs font-bold w-6 sm:w-8 text-right uppercase text-text-tertiary flex items-center justify-end gap-px">
                    {natureData?.plus === stat && <span className="text-[8px] sm:text-[11px]" aria-label="boosted by nature">{"\u25B2"}</span>}
                    {natureData?.minus === stat && <span className="text-[8px] sm:text-[11px]" aria-label="reduced by nature">{"\u25BC"}</span>}
                    {labels[stat]}
                  </span>
                  <div className="flex-1 h-2 sm:h-2.5 bg-surface-alt rounded-full overflow-hidden creator:h-3" role="progressbar" aria-valuenow={displayValue} aria-valuemin={0} aria-valuemax={maxStat} aria-label={`${labels[stat]} stat bar${isBoosted ? " (item boosted)" : ""}`}>
                    <div
                      className={`h-full rounded-full animate-bar-fill ${isBoosted ? "bar-boosted" : ""}`}
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: isBoosted ? "#f59e0b" : STAT_COLORS[stat],
                      }}
                    />
                  </div>
                  <span className={`text-[11px] sm:text-sm font-[family-name:var(--font-mono)] font-bold w-7 sm:w-8 text-right tabular-nums ${
                    isBoosted ? "text-amber-500" : "text-text-secondary"
                  }`}>
                    {displayValue}{isBoosted && <span className="text-[8px] align-super" aria-label="boosted by item">*</span>}
                  </span>
                  {investLabel > 0 ? (
                    <span className={`hidden sm:inline text-xs font-bold w-12 tabular-nums ${isOverMax && showSp ? "text-amber-500" : "text-accent"}`}>
                      +{investLabel}{investUnit && <span className="text-[9px] ml-px">{investUnit}</span>}
                    </span>
                  ) : (
                    <span className="hidden sm:inline w-12" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
        );
      })()}
    </Card>
  );
}
