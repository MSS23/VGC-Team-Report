"use client";

import type { AnalyzedPokemon } from "@/lib/types/analysis";
import { Card } from "@/components/ui/Card";
import { PokemonSprite } from "./PokemonSprite";
import { TypeBadge } from "./TypeBadge";
import { getMoveTypeStyle } from "@/lib/utils/move-type-style";

interface PokemonCardProps {
  pokemon: AnalyzedPokemon;
  creatorMode: boolean;
}

export function PokemonCard({ pokemon, creatorMode }: PokemonCardProps) {
  const { parsed, data, calculatedStats, itemBoost } = pokemon;
  const types = data?.types ?? [];
  const spriteSize = creatorMode ? 96 : 72;

  return (
    <Card className="p-4 sm:p-5 creator:p-6 flex flex-col gap-3 creator:gap-4">
      {/* Header: Sprite + Name + Types */}
      <div className="flex items-start gap-3 creator:gap-4">
        <PokemonSprite
          species={parsed.species}
          size={spriteSize}
          className="flex-shrink-0"
        />
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
        </div>
      </div>

      {/* Moves */}
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-text-tertiary mb-2 creator:mb-2.5">
          Moves
        </h4>
        <div className="grid grid-cols-2 gap-1.5">
          {parsed.moves.map((move) => {
            const typeStyle = getMoveTypeStyle(move);
            return (
              <span
                key={move}
                className={`text-xs text-text-primary creator:text-sm truncate px-2.5 py-1.5 rounded-lg border ${
                  typeStyle ? "" : "bg-surface-alt/60 border-transparent"
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
          <h4 className="text-xs font-semibold uppercase tracking-wider text-text-tertiary mb-2 creator:mb-2.5">
            Stats ({parsed.nature})
          </h4>
          <div className="space-y-1.5">
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
                  <span className="text-xs font-medium text-text-tertiary w-7 text-right">
                    {labels[stat]}
                  </span>
                  <div className="flex-1 h-1.5 bg-surface-alt rounded-full overflow-hidden creator:h-2">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: isBoosted ? "#f59e0b" : ev > 0 ? "#6366f1" : "#cbd5e1",
                      }}
                    />
                  </div>
                  <span className={`text-xs font-mono w-7 text-right ${
                    isBoosted ? "text-amber-500 font-semibold" : "text-text-secondary"
                  }`}>
                    {displayValue}
                  </span>
                  {isBoosted ? (
                    <span className="text-xs text-amber-500 font-medium w-8" title={`${value} × ${itemBoost.multiplier}`}>
                      ×{itemBoost.multiplier}
                    </span>
                  ) : ev > 0 ? (
                    <span className="text-xs text-accent font-medium w-8">
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
