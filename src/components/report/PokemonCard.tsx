"use client";

import type { AnalyzedPokemon } from "@/lib/types/analysis";
import { Card } from "@/components/ui/Card";
import { PokemonSprite } from "./PokemonSprite";
import { TypeBadge } from "./TypeBadge";
import { getMoveTypeStyle } from "@/lib/utils/move-type-style";
import { NATURES } from "@/lib/data/natures";
import { getUsagePercent } from "@/lib/data/usage-stats";

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
  onToggleShiny?: () => void;
  onToggleAnimated?: () => void;
}

export function PokemonCard({ pokemon, creatorMode, role, onRoleChange, isReadOnly, isMvp, onToggleMvp, shiny = false, animated = true, onToggleShiny, onToggleAnimated }: PokemonCardProps) {
  const { parsed, data, calculatedStats, itemBoost } = pokemon;
  const types = data?.types ?? [];
  const spriteSize = creatorMode ? 96 : 72;
  const natureData = NATURES[parsed.nature];
  const usagePercent = getUsagePercent(parsed.species);

  return (
    <Card className={`p-4 sm:p-5 creator:p-6 flex flex-col gap-3 creator:gap-4 transition-all duration-200 ${
      isMvp ? "ring-2 ring-amber-400/50 shadow-lg shadow-amber-400/10" : ""
    }`}>
      {/* MVP Banner */}
      {isMvp && (
        <div className="flex items-center gap-1.5 -mb-1">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-amber-500">
            <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
          </svg>
          <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">Team MVP</span>
        </div>
      )}

      {/* Header: Sprite + Name + Types */}
      <div className="flex items-start gap-3 creator:gap-4">
        <div className="flex-shrink-0">
          <button
            type="button"
            onClick={onToggleAnimated}
            title={animated ? "Switch to static sprite" : "Switch to animated GIF"}
            aria-label={animated ? "Switch to static sprite" : "Switch to animated sprite"}
            className="block cursor-pointer rounded-xl transition-transform hover:scale-105 active:scale-95"
          >
            <PokemonSprite
              species={parsed.species}
              size={spriteSize}
              animated={animated}
              shiny={shiny}
            />
          </button>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h3 className="text-base font-bold text-text-primary creator:text-xl truncate leading-tight">
              {parsed.species}
            </h3>
            {parsed.gender && (
              <span className={`text-sm font-medium ${parsed.gender === "M" ? "text-blue-500" : "text-pink-500"}`}>
                {parsed.gender === "M" ? "\u2642" : "\u2640"}
              </span>
            )}
            {/* Action buttons: MVP star + Shiny sparkle */}
            {!isReadOnly && (
              <div className="flex items-center ml-auto">
                {onToggleMvp && (
                  <button
                    type="button"
                    onClick={onToggleMvp}
                    className={`p-2 rounded-lg transition-all duration-200 ${
                      isMvp
                        ? "text-amber-500 bg-amber-500/10"
                        : "text-text-tertiary/40 hover:text-amber-400 hover:bg-amber-400/5"
                    }`}
                    title={isMvp ? "Remove MVP" : "Set as MVP"}
                    aria-label={isMvp ? "Remove MVP" : "Set as MVP"}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill={isMvp ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                      <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
                    </svg>
                  </button>
                )}
                {onToggleShiny && (
                  <button
                    type="button"
                    onClick={onToggleShiny}
                    className={`p-2 rounded-lg transition-all duration-200 ${
                      shiny
                        ? "text-amber-500 bg-amber-500/10"
                        : "text-text-tertiary/40 hover:text-amber-400 hover:bg-amber-400/5"
                    }`}
                    title={shiny ? "Show normal sprite" : "Show shiny sprite"}
                    aria-label={shiny ? "Disable shiny sprite" : "Enable shiny sprite"}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill={shiny ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2L14 10L22 12L14 14L12 22L10 14L2 12L10 10Z" />
                    </svg>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Types */}
          <div className="flex items-center gap-1 mt-1.5 flex-wrap">
            {types.map((type) => (
              <TypeBadge key={type} type={type} />
            ))}
            {parsed.teraType && (
              <span className="flex items-center gap-0.5 ml-1">
                <span className="text-[10px] text-text-tertiary">Tera:</span>
                <TypeBadge type={parsed.teraType} />
              </span>
            )}
          </div>

          {/* Item + Ability + Usage */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-2 text-xs text-text-secondary">
            {parsed.item && (
              <span className="font-semibold text-text-primary">@ {parsed.item}</span>
            )}
            {parsed.ability && <span>{parsed.ability}</span>}
            {usagePercent !== null && (
              <span className="text-[10px] font-medium text-text-tertiary bg-surface-alt px-1.5 py-0.5 rounded-md" title="VGC usage rate">
                {usagePercent}%
              </span>
            )}
          </div>

          {/* Role */}
          {onRoleChange && !isReadOnly ? (
            <input
              type="text"
              value={role ?? ""}
              onChange={(e) => onRoleChange(e.target.value)}
              placeholder="Role..."
              maxLength={40}
              className="mt-2 w-full text-xs px-2.5 py-1 bg-surface-alt border border-border-subtle rounded-lg text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-shadow"
            />
          ) : role ? (
            <span className="mt-2 inline-block text-xs font-semibold text-accent bg-accent-surface px-2.5 py-1 rounded-lg">
              {role}
            </span>
          ) : null}
        </div>
      </div>

      {/* Moves */}
      <div>
        <h4 className="text-[10px] font-semibold uppercase tracking-widest text-text-tertiary mb-2 creator:mb-2.5">
          Moves
        </h4>
        <div className="grid grid-cols-2 gap-1.5 stagger-moves">
          {parsed.moves.map((move) => {
            const typeStyle = getMoveTypeStyle(move);
            return (
              <span
                key={move}
                className={`text-xs text-text-primary creator:text-sm truncate px-2.5 py-1.5 rounded-lg border font-medium text-center transition-colors ${
                  typeStyle ? "shadow-sm" : "bg-surface-alt/60 border-transparent"
                }`}
                style={typeStyle ?? undefined}
              >
                {move}
              </span>
            );
          })}
        </div>
      </div>

      {/* Stats */}
      {data && (
        <div>
          <h4 className="text-[10px] font-semibold uppercase tracking-widest text-text-tertiary mb-1.5 creator:mb-2">
            Stats <span className="normal-case tracking-normal font-normal text-text-tertiary/70">({parsed.nature}{natureData?.plus ? ` +${({ atk: "Atk", def: "Def", spa: "SpA", spd: "SpD", spe: "Spe" } as Record<string, string>)[natureData.plus]}` : ""}{natureData?.minus ? ` -${({ atk: "Atk", def: "Def", spa: "SpA", spd: "SpD", spe: "Spe" } as Record<string, string>)[natureData.minus]}` : ""})</span>
          </h4>
          <div className="space-y-1 stagger-stats">
            {(["hp", "atk", "def", "spa", "spd", "spe"] as const).map((stat) => {
              const value = calculatedStats[stat];
              const ev = parsed.evs[stat];
              const isBoosted = itemBoost?.stat === stat;
              const displayValue = isBoosted ? itemBoost.boostedValue : value;
              const maxStat = stat === "hp" ? 300 : 250;
              const percentage = Math.min((displayValue / maxStat) * 100, 100);
              const labels = { hp: "HP", atk: "Atk", def: "Def", spa: "SpA", spd: "SpD", spe: "Spe" };

              return (
                <div key={stat} className="flex items-center gap-1.5">
                  <span className={`text-[10px] font-semibold w-6 text-right uppercase ${
                    natureData?.plus === stat ? "text-red-500" : natureData?.minus === stat ? "text-blue-500" : "text-text-tertiary"
                  }`}>
                    {labels[stat]}
                  </span>
                  <div className="flex-1 h-1.5 bg-surface-alt rounded-full overflow-hidden creator:h-2">
                    <div
                      className="h-full rounded-full animate-bar-fill"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: isBoosted ? "#f59e0b" : ev > 0 ? "var(--accent)" : "#cbd5e1",
                      }}
                    />
                  </div>
                  <span className={`text-[10px] font-mono w-6 text-right tabular-nums ${
                    isBoosted ? "text-amber-500 font-semibold" : "text-text-secondary"
                  }`}>
                    {displayValue}
                  </span>
                  {isBoosted ? (
                    <span className="text-[9px] text-amber-500 font-medium w-7" title={`${value} × ${itemBoost.multiplier}`}>
                      ×{itemBoost.multiplier}
                    </span>
                  ) : ev > 0 ? (
                    <span className="text-[9px] text-accent font-semibold w-7">
                      +{ev}
                    </span>
                  ) : (
                    <span className="w-7" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Card>
  );
}
