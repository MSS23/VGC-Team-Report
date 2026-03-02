"use client";

import type { AnalyzedPokemon } from "@/lib/types/analysis";
import { Card } from "@/components/ui/Card";
import { PokemonSprite } from "./PokemonSprite";
import { TypeBadge } from "./TypeBadge";
import { getMoveTypeStyle } from "@/lib/utils/move-type-style";

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

  return (
    <Card className={`p-4 sm:p-5 creator:p-6 flex flex-col gap-3 creator:gap-4 ${isMvp ? "ring-1 ring-amber-400/40 shadow-amber-500/10" : ""}`}>
      {/* Header: Sprite + Name + Types */}
      <div className="flex items-start gap-3 creator:gap-4">
        <div className="flex-shrink-0 relative group/sprite">
          <button
            type="button"
            onClick={onToggleAnimated}
            title={animated ? "Switch to static sprite" : "Switch to animated GIF"}
            aria-label={animated ? "Switch to static sprite" : "Switch to animated sprite"}
            className="block cursor-pointer rounded-xl transition-transform hover:scale-105 active:scale-95 min-w-[44px] min-h-[44px]"
          >
            <PokemonSprite
              species={parsed.species}
              size={spriteSize}
              variant={animated ? "ani" : "gen5"}
              shiny={shiny}
            />
          </button>
          {onToggleShiny && (
            <button
              type="button"
              onClick={onToggleShiny}
              title={shiny ? "Show normal sprite" : "Show shiny sprite"}
              aria-label={shiny ? "Disable shiny sprite" : "Enable shiny sprite"}
              className={`absolute -bottom-1 left-1/2 -translate-x-1/2 px-2 py-1 rounded text-[9px] font-bold uppercase tracking-wide border transition-all min-w-[44px] min-h-[44px] flex items-center justify-center ${
                shiny
                  ? "bg-amber-400/25 text-amber-500 border-amber-400/50"
                  : "bg-surface text-text-tertiary/60 border-border-subtle hover:text-text-tertiary"
              }`}
            >
              {shiny ? "\u2728" : "Shiny"}
            </button>
          )}
          {isMvp && (
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center shadow-sm shadow-amber-400/30">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="white"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" /></svg>
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-bold text-text-primary creator:text-xl truncate leading-tight">
              {parsed.species}
            </h3>
            {parsed.gender && (
              <span className={`text-sm font-medium ${parsed.gender === "M" ? "text-blue-500" : "text-pink-500"}`}>
                {parsed.gender === "M" ? "\u2642" : "\u2640"}
              </span>
            )}
            {!isReadOnly && onToggleMvp && (
              <button
                type="button"
                onClick={onToggleMvp}
                className={`p-1 rounded-md transition-all duration-200 ${
                  isMvp
                    ? "text-amber-500 hover:bg-amber-500/10"
                    : "text-text-tertiary/40 hover:text-amber-400 hover:bg-amber-400/10"
                }`}
                title={isMvp ? "Remove MVP" : "Set as MVP"}
                aria-label={isMvp ? "Remove MVP" : "Set as MVP"}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill={isMvp ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
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
                <span className="text-[10px] text-text-tertiary">Tera:</span>
                <TypeBadge type={parsed.teraType} />
              </span>
            )}
          </div>

          {/* Item + Ability */}
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-2 text-xs text-text-secondary">
            {parsed.item && (
              <span className="font-semibold text-text-primary">@ {parsed.item}</span>
            )}
            {parsed.ability && <span>{parsed.ability}</span>}
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
          <h4 className="text-[10px] font-semibold uppercase tracking-widest text-text-tertiary mb-2 creator:mb-2.5">
            Stats <span className="normal-case tracking-normal font-normal text-text-tertiary/70">({parsed.nature})</span>
          </h4>
          <div className="space-y-1.5 stagger-stats">
            {(["hp", "atk", "def", "spa", "spd", "spe"] as const).map((stat) => {
              const value = calculatedStats[stat];
              const ev = parsed.evs[stat];
              const isBoosted = itemBoost?.stat === stat;
              const displayValue = isBoosted ? itemBoost.boostedValue : value;
              const maxStat = stat === "hp" ? 300 : 250;
              const percentage = Math.min((displayValue / maxStat) * 100, 100);
              const labels = { hp: "HP", atk: "Atk", def: "Def", spa: "SpA", spd: "SpD", spe: "Spe" };

              return (
                <div key={stat} className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold text-text-tertiary w-7 text-right uppercase">
                    {labels[stat]}
                  </span>
                  <div className="flex-1 h-1.5 bg-surface-alt rounded-full overflow-hidden creator:h-2">
                    <div
                      className="h-full rounded-full animate-bar-fill"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: isBoosted ? "#f59e0b" : ev > 0 ? "#6366f1" : "#cbd5e1",
                      }}
                    />
                  </div>
                  <span className={`text-xs font-mono w-7 text-right tabular-nums ${
                    isBoosted ? "text-amber-500 font-semibold" : "text-text-secondary"
                  }`}>
                    {displayValue}
                  </span>
                  {isBoosted ? (
                    <span className="text-[10px] text-amber-500 font-medium whitespace-nowrap" title={`${value} × ${itemBoost.multiplier}`}>
                      ×{itemBoost.multiplier}
                    </span>
                  ) : ev > 0 ? (
                    <span className="text-[10px] text-accent font-semibold w-8">
                      +{ev}
                    </span>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Card>
  );
}
