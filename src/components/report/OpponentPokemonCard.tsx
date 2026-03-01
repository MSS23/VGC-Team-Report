import type { ParsedPokemon, PokemonData, StatSpread } from "@/lib/types/pokemon";
import { Card } from "@/components/ui/Card";
import { PokemonSprite } from "./PokemonSprite";
import { TypeBadge } from "./TypeBadge";

interface OpponentPokemonCardProps {
  parsed: ParsedPokemon;
  data: PokemonData | null;
  calculatedStats?: StatSpread | null;
  hasEvs?: boolean;
}

const STAT_LABELS = {
  hp: "HP",
  atk: "Atk",
  def: "Def",
  spa: "SpA",
  spd: "SpD",
  spe: "Spe",
} as const;

export function OpponentPokemonCard({
  parsed,
  data,
  calculatedStats,
  hasEvs = false,
}: OpponentPokemonCardProps) {
  const types = data?.types ?? [];

  return (
    <Card className="p-3 sm:p-4">
      <div className="flex items-start gap-3">
        <PokemonSprite species={parsed.species} size={hasEvs ? 56 : 48} className="flex-shrink-0" />
        <div className="flex-1 min-w-0">
          {/* Name + Types + Tera */}
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="font-semibold text-sm text-text-primary truncate">
              {parsed.species}
            </span>
            {parsed.gender && (
              <span className={`text-xs font-medium ${parsed.gender === "M" ? "text-blue-500" : "text-pink-500"}`}>
                {parsed.gender === "M" ? "\u2642" : "\u2640"}
              </span>
            )}
            {types.map((type) => (
              <TypeBadge key={type} type={type} />
            ))}
            {parsed.teraType && (
              <span className="flex items-center gap-0.5">
                <span className="text-[10px] text-text-tertiary">Tera:</span>
                <TypeBadge type={parsed.teraType} />
              </span>
            )}
          </div>

          {/* Ability + Item */}
          <div className="flex flex-wrap gap-x-3 text-xs text-text-secondary mb-1.5">
            {parsed.ability && <span>{parsed.ability}</span>}
            {parsed.item && (
              <span className="text-text-primary font-medium">@ {parsed.item}</span>
            )}
          </div>

          {/* Moves */}
          <div className="flex flex-wrap gap-1">
            {parsed.moves.map((move) => (
              <span
                key={move}
                className="px-2 py-0.5 bg-surface-alt border border-border-subtle rounded-md text-xs text-text-secondary"
              >
                {move}
              </span>
            ))}
          </div>

          {/* Stats — only shown when EVs are present */}
          {hasEvs && calculatedStats && data && (
            <div className="mt-2.5 pt-2.5 border-t border-border-subtle">
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-text-tertiary">
                  Stats ({parsed.nature})
                </span>
                <span className="text-[10px] text-text-tertiary">
                  {(["hp", "atk", "def", "spa", "spd", "spe"] as const)
                    .filter((s) => parsed.evs[s] > 0)
                    .map((s) => `${parsed.evs[s]} ${STAT_LABELS[s]}`)
                    .join(" / ")}
                </span>
              </div>
              <div className="space-y-1">
                {(["hp", "atk", "def", "spa", "spd", "spe"] as const).map((stat) => {
                  const value = calculatedStats[stat];
                  const ev = parsed.evs[stat];
                  const maxStat = stat === "hp" ? 300 : 250;
                  const percentage = Math.min((value / maxStat) * 100, 100);

                  return (
                    <div key={stat} className="flex items-center gap-1.5">
                      <span className="text-[10px] font-medium text-text-tertiary w-6 text-right">
                        {STAT_LABELS[stat]}
                      </span>
                      <div className="flex-1 h-1.5 bg-surface-alt rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${percentage}%`,
                            backgroundColor: ev > 0 ? "#6366f1" : "#cbd5e1",
                          }}
                        />
                      </div>
                      <span className="text-[10px] font-mono w-6 text-right text-text-secondary">
                        {value}
                      </span>
                      {ev > 0 && (
                        <span className="text-[10px] text-accent font-medium w-7">
                          +{ev}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
