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
    <Card className="p-4 sm:p-5">
      <div className="flex items-start gap-3 sm:gap-4">
        <PokemonSprite species={parsed.species} size={hasEvs ? 64 : 56} className="flex-shrink-0" />
        <div className="flex-1 min-w-0">
          {/* Name + Types + Tera */}
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="font-bold text-base text-text-primary truncate">
              {parsed.species}
            </span>
            {parsed.gender && (
              <span className={`text-sm font-medium ${parsed.gender === "M" ? "text-blue-500" : "text-pink-500"}`}>
                {parsed.gender === "M" ? "\u2642" : "\u2640"}
              </span>
            )}
            {types.map((type) => (
              <TypeBadge key={type} type={type} />
            ))}
            {parsed.teraType && (
              <span className="flex items-center gap-0.5">
                <span className="text-xs text-text-tertiary">Tera:</span>
                <TypeBadge type={parsed.teraType} />
              </span>
            )}
          </div>

          {/* Ability + Item */}
          <div className="flex flex-wrap gap-x-3 text-sm text-text-secondary mb-2">
            {parsed.ability && <span>{parsed.ability}</span>}
            {parsed.item && (
              <span className="text-text-primary font-medium">@ {parsed.item}</span>
            )}
          </div>

          {/* Moves */}
          <div className="flex flex-wrap gap-1.5">
            {parsed.moves.map((move) => (
              <span
                key={move}
                className="px-2.5 py-1 bg-surface-alt border border-border-subtle rounded-lg text-xs font-medium text-text-secondary"
              >
                {move}
              </span>
            ))}
          </div>

          {/* Stats — only shown when EVs are present */}
          {hasEvs && calculatedStats && data && (
            <div className="mt-3 pt-3 border-t border-border-subtle">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">
                  Stats ({parsed.nature})
                </span>
                <span className="text-xs text-text-tertiary">
                  {(["hp", "atk", "def", "spa", "spd", "spe"] as const)
                    .filter((s) => parsed.evs[s] > 0)
                    .map((s) => `${parsed.evs[s]} ${STAT_LABELS[s]}`)
                    .join(" / ")}
                </span>
              </div>
              <div className="space-y-1.5" role="list" aria-label={`${parsed.species} stat values`}>
                {(["hp", "atk", "def", "spa", "spd", "spe"] as const).map((stat) => {
                  const value = calculatedStats[stat];
                  const ev = parsed.evs[stat];
                  const maxStat = stat === "hp" ? 300 : 250;
                  const percentage = Math.min((value / maxStat) * 100, 100);

                  return (
                    <div key={stat} className="flex items-center gap-2" role="listitem" aria-label={`${STAT_LABELS[stat]}: ${value}${ev > 0 ? `, ${ev} EVs` : ""}`}>
                      <span className="text-xs font-semibold w-8 text-right uppercase text-text-tertiary">
                        {STAT_LABELS[stat]}
                      </span>
                      <div className="flex-1 h-2 bg-surface-alt rounded-full overflow-hidden" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={maxStat}>
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${percentage}%`,
                            backgroundColor: ev > 0 ? "var(--accent)" : "#94a3b8",
                          }}
                        />
                      </div>
                      <span className={`text-sm font-mono w-8 text-right tabular-nums ${ev > 0 ? "text-accent font-bold" : "text-text-secondary"}`}>
                        {value}
                      </span>
                      {ev > 0 ? (
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
        </div>
      </div>
    </Card>
  );
}
