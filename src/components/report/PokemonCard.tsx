"use client";

import type { AnalyzedPokemon } from "@/lib/types/analysis";
import { Card } from "@/components/ui/Card";
import { PokemonSprite } from "./PokemonSprite";
import { TypeBadge } from "./TypeBadge";
import { getMoveTypeStyle } from "@/lib/utils/move-type-style";
import { NATURES } from "@/lib/data/natures";

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
}

export function PokemonCard({ pokemon, creatorMode, role, onRoleChange, isReadOnly, isMvp, onToggleMvp, shiny = false, animated = true }: PokemonCardProps) {
  const { parsed, data, calculatedStats, itemBoost } = pokemon;
  const types = data?.types ?? [];
  const spriteSizeSm = creatorMode ? 88 : 76;
  const spriteSizeLg = creatorMode ? 120 : 104;
  const natureData = NATURES[parsed.nature];

  // Non-default IVs (not 31)
  const nonDefaultIvs = (["hp", "atk", "def", "spa", "spd", "spe"] as const).filter(
    (stat) => parsed.ivs[stat] !== 31
  );
  const ivLabels = { hp: "HP", atk: "Atk", def: "Def", spa: "SpA", spd: "SpD", spe: "Spe" } as const;

  return (
    <Card className={`p-5 sm:p-6 creator:p-7 flex flex-col gap-4 creator:gap-5 transition-all duration-200 ${
      isMvp ? "ring-2 ring-amber-400/50 shadow-lg shadow-amber-400/10" : ""
    }`}>
      {/* MVP Banner */}
      {isMvp && (
        <div className="flex items-center gap-1.5 -mb-1">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-amber-500">
            <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
          </svg>
          <span className="text-xs font-bold text-amber-500 uppercase tracking-wider">Team MVP</span>
        </div>
      )}

      {/* Header: Sprite + Name + Types */}
      <div className="flex items-start gap-3 creator:gap-4">
        <div className="flex-shrink-0">
          <PokemonSprite
            species={parsed.species}
            size={spriteSizeSm}
            className="sm:hidden"
            animated={animated}
            shiny={shiny}
          />
          <PokemonSprite
            species={parsed.species}
            size={spriteSizeLg}
            className="hidden sm:block"
            animated={animated}
            shiny={shiny}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h3 className="text-lg font-bold text-text-primary creator:text-xl truncate leading-tight">
              {parsed.species}
            </h3>
            {parsed.gender && (
              <span className={`text-sm font-medium ${parsed.gender === "M" ? "text-blue-500" : "text-pink-500"}`}>
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
                title={isMvp ? "Remove MVP" : "Set as MVP"}
                aria-label={isMvp ? "Remove MVP" : "Set as MVP"}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill={isMvp ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                  <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
                </svg>
              </button>
            )}
          </div>

          {/* Types */}
          <div className="flex items-center gap-1 mt-1.5 flex-wrap">
            {types.map((type) => (
              <TypeBadge key={type} type={type} />
            ))}
            {parsed.teraType && (
              <span className="flex items-center gap-0.5 ml-1">
                <span className="text-xs text-text-tertiary">Tera:</span>
                <TypeBadge type={parsed.teraType} />
              </span>
            )}
          </div>

          {/* Item + Ability */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-2 text-sm text-text-secondary">
            {parsed.item && (
              <span className="font-semibold text-text-primary">@ {parsed.item}</span>
            )}
            {parsed.ability && <span>{parsed.ability}</span>}
          </div>

          {/* Non-default IVs */}
          {nonDefaultIvs.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
              {nonDefaultIvs.map((stat) => (
                <span
                  key={stat}
                  className="text-xs font-mono font-medium text-text-tertiary bg-surface-alt px-1.5 py-0.5 rounded"
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
        <h4 className="text-xs font-semibold uppercase tracking-widest text-text-tertiary mb-2 creator:mb-2.5">
          Moves
        </h4>
        <div className="grid grid-cols-2 gap-2 stagger-moves">
          {parsed.moves.map((move) => {
            const typeStyle = getMoveTypeStyle(move);
            return (
              <span
                key={move}
                className={`text-sm creator:text-base truncate px-3 py-2 rounded-lg border font-medium text-center transition-colors ${
                  typeStyle ? "shadow-sm" : "text-text-primary bg-surface-alt/60 border-transparent"
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
          <h4 className="text-xs font-semibold uppercase tracking-widest text-text-tertiary mb-1.5 creator:mb-2">
            Stats <span className="normal-case tracking-normal font-normal text-text-tertiary/70">({parsed.nature}{natureData?.plus ? ` +${({ atk: "Atk", def: "Def", spa: "SpA", spd: "SpD", spe: "Spe" } as Record<string, string>)[natureData.plus]}` : ""}{natureData?.minus ? ` -${({ atk: "Atk", def: "Def", spa: "SpA", spd: "SpD", spe: "Spe" } as Record<string, string>)[natureData.minus]}` : ""})</span>
          </h4>
          <div className="space-y-1.5 stagger-stats" role="list" aria-label={`${parsed.species} stats`}>
            {(["hp", "atk", "def", "spa", "spd", "spe"] as const).map((stat) => {
              const value = calculatedStats[stat];
              const ev = parsed.evs[stat];
              const isBoosted = itemBoost?.stat === stat;
              const displayValue = isBoosted ? itemBoost.boostedValue : value;
              const maxStat = stat === "hp" ? 300 : 250;
              const percentage = Math.min((displayValue / maxStat) * 100, 100);
              const labels = { hp: "HP", atk: "Atk", def: "Def", spa: "SpA", spd: "SpD", spe: "Spe" };

              return (
                <div key={stat} className="flex items-center gap-2" role="listitem" aria-label={`${labels[stat]}: ${displayValue}${ev > 0 ? `, ${ev} EVs` : ""}${isBoosted ? `, boosted by item` : ""}`}>
                  <span className="text-xs font-semibold w-8 text-right uppercase text-text-tertiary flex items-center justify-end gap-px">
                    {natureData?.plus === stat && <span className="text-[9px]" aria-label="boosted by nature">{"\u25B2"}</span>}
                    {natureData?.minus === stat && <span className="text-[9px]" aria-label="reduced by nature">{"\u25BC"}</span>}
                    {labels[stat]}
                  </span>
                  <div className="flex-1 h-2 bg-surface-alt rounded-full overflow-hidden creator:h-2.5" role="progressbar" aria-valuenow={displayValue} aria-valuemin={0} aria-valuemax={maxStat} aria-label={`${labels[stat]} stat bar`}>
                    <div
                      className="h-full rounded-full animate-bar-fill"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: isBoosted ? "#f59e0b" : ev > 0 ? "var(--accent)" : "#94a3b8",
                      }}
                    />
                  </div>
                  <span className={`text-sm font-mono w-8 text-right tabular-nums ${
                    isBoosted ? "text-amber-500 font-semibold" : "text-text-secondary"
                  }`}>
                    {displayValue}
                  </span>
                  {isBoosted ? (
                    <span className="text-xs text-amber-500 font-medium w-9" title={`${value} × ${itemBoost.multiplier}`}>
                      ×{itemBoost.multiplier}
                    </span>
                  ) : ev > 0 ? (
                    <span className="text-xs text-accent font-semibold w-9">
                      +{ev}
                    </span>
                  ) : (
                    <span className="w-9" />
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
