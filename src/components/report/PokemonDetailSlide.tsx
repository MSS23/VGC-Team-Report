"use client";

import type { AnalyzedPokemon } from "@/lib/types/analysis";
import type { CalcEntry, CalcCategory } from "@/hooks/useDamageCalcs";
import { PokemonSprite } from "./PokemonSprite";
import { TypeBadge } from "./TypeBadge";
import { CalcInput } from "./CalcInput";
import { getMoveTypeStyle } from "@/lib/utils/move-type-style";

interface PokemonDetailSlideProps {
  pokemon: AnalyzedPokemon;
  note: string;
  onNoteChange: (text: string) => void;
  calcs: CalcEntry[];
  onAddCalc: (text: string, category: CalcCategory) => void;
  onRemoveCalc: (index: number) => void;
  slideNumber: number;
  isReadOnly?: boolean;
  isPresentationMode?: boolean;
}

const CATEGORY_CONFIG = {
  offensive: {
    label: "Offensive",
    icon: "\u2694\uFE0F",
    borderClass: "border-red-400/30",
    bgClass: "bg-red-500/10",
    presentBgClass: "presenting:bg-red-500/15",
    tagBg: "bg-red-500/20",
    tagText: "text-red-400",
    iconColor: "text-red-400",
  },
  defensive: {
    label: "Defensive",
    icon: "\uD83D\uDEE1\uFE0F",
    borderClass: "border-emerald-400/30",
    bgClass: "bg-emerald-500/10",
    presentBgClass: "presenting:bg-emerald-500/15",
    tagBg: "bg-emerald-500/20",
    tagText: "text-emerald-400",
    iconColor: "text-emerald-400",
  },
  speed: {
    label: "Speed Tier",
    icon: "\u26A1",
    borderClass: "border-border-subtle",
    bgClass: "bg-surface-alt/50",
    presentBgClass: "presenting:bg-surface-alt/70",
    tagBg: "bg-surface-alt",
    tagText: "text-text-tertiary",
    iconColor: "text-text-tertiary",
  },
} as const;

export function PokemonDetailSlide({
  pokemon,
  note,
  onNoteChange,
  calcs,
  onAddCalc,
  onRemoveCalc,
  slideNumber,
  isReadOnly = false,
  isPresentationMode = false,
}: PokemonDetailSlideProps) {
  const { parsed, data, calculatedStats, itemBoost } = pokemon;
  const types = data?.types ?? [];

  const statLabels = {
    hp: "HP",
    atk: "Atk",
    def: "Def",
    spa: "SpA",
    spd: "SpD",
    spe: "Spe",
  } as const;

  const evString = (["hp", "atk", "def", "spa", "spd", "spe"] as const)
    .map((s) => parsed.evs[s])
    .join("/");

  const offensiveCalcs = calcs.filter((c) => c.category === "offensive");
  const defensiveCalcs = calcs.filter((c) => c.category === "defensive");
  const speedCalcs = calcs.filter((c) => c.category === "speed");

  const renderCalcGroup = (
    entries: CalcEntry[],
    category: CalcCategory,
    globalCalcs: CalcEntry[]
  ) => {
    if (entries.length === 0) return null;
    const cfg = CATEGORY_CONFIG[category];

    return (
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-1.5">
          <span className={`text-xs ${cfg.tagText}`}>{cfg.icon}</span>
          <span className={`text-[10px] font-semibold uppercase tracking-wider ${cfg.tagText}`}>
            {cfg.label}
          </span>
        </div>
        {entries.map((entry) => {
          const globalIndex = globalCalcs.indexOf(entry);
          return (
            <div
              key={globalIndex}
              className={`group flex items-start gap-2 px-3 py-2 ${cfg.bgClass} ${cfg.presentBgClass} border ${cfg.borderClass} rounded-xl`}
            >
              <span className={`${cfg.iconColor} text-xs mt-0.5 flex-shrink-0`}>&#9656;</span>
              <span className="flex-1 text-sm text-text-primary leading-relaxed presenting:text-base">
                {entry.text}
              </span>
              {!isReadOnly && (
                <button
                  onClick={() => onRemoveCalc(globalIndex)}
                  className="opacity-0 group-hover:opacity-100 text-text-tertiary hover:text-red-400 text-sm flex-shrink-0 transition-opacity ml-1"
                  aria-label="Remove calc"
                >
                  &#10005;
                </button>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[45%_55%] gap-4 sm:gap-6 lg:gap-8 items-start animate-fade-in">
      {/* Left Column: Pokemon Info */}
      <div className="flex flex-col gap-4 sm:gap-6">
        {/* Header: Sprite + Name + Types */}
        <div className="flex items-start gap-3 sm:gap-6">
          <PokemonSprite
            species={parsed.species}
            size={isPresentationMode ? 224 : 120}
            className="flex-shrink-0 sm:hidden"
          />
          <PokemonSprite
            species={parsed.species}
            size={isPresentationMode ? 224 : 160}
            className="flex-shrink-0 hidden sm:block"
          />
          <div className="flex flex-col gap-1.5 sm:gap-2 pt-1 sm:pt-2 min-w-0">
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <h2 className="text-2xl sm:text-3xl font-bold text-text-primary presenting:text-4xl truncate">
                {parsed.species}
              </h2>
              {parsed.gender && (
                <span
                  className={`text-lg sm:text-xl font-medium ${
                    parsed.gender === "M" ? "text-blue-500" : "text-pink-500"
                  }`}
                >
                  {parsed.gender === "M" ? "\u2642" : "\u2640"}
                </span>
              )}
            </div>

            {/* Types + Tera */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {types.map((type) => (
                <TypeBadge key={type} type={type} />
              ))}
              {parsed.teraType && (
                <span className="flex items-center gap-1 ml-1 sm:ml-2">
                  <span className="text-xs text-text-tertiary">Tera:</span>
                  <TypeBadge type={parsed.teraType} />
                </span>
              )}
            </div>

            {/* Ability + Item */}
            <div className="flex flex-wrap gap-x-3 sm:gap-x-4 text-sm sm:text-base text-text-secondary presenting:text-lg">
              {parsed.ability && <span>{parsed.ability}</span>}
              {parsed.item && (
                <span className="text-text-primary font-medium">
                  @ {parsed.item}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Moves - 2x2 grid */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-text-tertiary mb-2 sm:mb-3">
            Moves
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {parsed.moves.map((move) => {
              const typeStyle = getMoveTypeStyle(move);
              return (
                <div
                  key={move}
                  className={`px-3 sm:px-4 py-2.5 sm:py-3 border rounded-xl text-xs sm:text-sm font-semibold text-text-primary text-center presenting:text-base presenting:py-4 shadow-sm ${
                    typeStyle ? "" : "bg-surface border-border"
                  }`}
                  style={typeStyle ?? undefined}
                >
                  {move}
                </div>
              );
            })}
          </div>
        </div>

        {/* Stats */}
        {data && (
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-text-tertiary mb-2 sm:mb-3">
              Stats ({parsed.nature})
            </h3>
            <div className="space-y-2">
              {(["hp", "atk", "def", "spa", "spd", "spe"] as const).map(
                (stat) => {
                  const value = calculatedStats[stat];
                  const ev = parsed.evs[stat];
                  const isBoosted = itemBoost?.stat === stat;
                  const displayValue = isBoosted ? itemBoost.boostedValue : value;
                  const maxStat = stat === "hp" ? 300 : 250;
                  const percentage = Math.min((displayValue / maxStat) * 100, 100);

                  return (
                    <div key={stat} className="flex items-center gap-2 sm:gap-3">
                      <span className="text-xs sm:text-sm font-medium text-text-tertiary w-7 sm:w-8 text-right">
                        {statLabels[stat]}
                      </span>
                      <div className="flex-1 h-3 sm:h-4 bg-surface-alt rounded-full overflow-hidden presenting:h-5">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${percentage}%`,
                            backgroundColor: isBoosted ? "#f59e0b" : ev > 0 ? "#6366f1" : "#cbd5e1",
                          }}
                        />
                      </div>
                      <span className={`text-sm sm:text-base font-mono w-8 sm:w-10 text-right ${
                        isBoosted ? "text-amber-500 font-semibold" : "text-text-secondary"
                      }`}>
                        {displayValue}
                      </span>
                      {isBoosted ? (
                        <span className="text-xs sm:text-sm text-amber-500 font-medium w-10 sm:w-12" title={`${value} × ${itemBoost.multiplier}`}>
                          {value} ×{itemBoost.multiplier}
                        </span>
                      ) : ev > 0 ? (
                        <span className="text-xs sm:text-sm text-accent font-medium w-10 sm:w-12">
                          +{ev}
                        </span>
                      ) : (
                        <span className="w-10 sm:w-12" />
                      )}
                    </div>
                  );
                }
              )}
            </div>
            <p className="text-sm sm:text-base text-text-secondary mt-3 presenting:text-lg presenting:font-medium">
              {parsed.nature} &middot; {evString}
            </p>
          </div>
        )}
      </div>

      {/* Right Column: User Notes + Notable Calcs */}
      <div className="flex flex-col gap-4 sm:gap-6">
        {/* Notes */}
        <div className="flex flex-col gap-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-text-tertiary presenting:text-sm">
            {isPresentationMode ? "Notes" : isReadOnly ? "About This Pokemon" : "Your Explanation"}
          </h3>
          {isReadOnly ? (
            <div className="w-full min-h-[6rem] sm:min-h-[10rem] p-3 sm:p-6 bg-surface border border-border rounded-2xl text-sm sm:text-base text-text-primary whitespace-pre-wrap leading-relaxed presenting:text-lg presenting:leading-8 presenting:bg-surface-alt presenting:border-border-subtle">
              {note || "No notes yet."}
            </div>
          ) : (
            <textarea
              value={note}
              onChange={(e) => onNoteChange(e.target.value)}
              placeholder={`Explain ${parsed.species}'s role on the team, why you chose this spread, key matchups, how to use it...\n\nThis will be formatted nicely when shared.`}
              className="w-full min-h-[6rem] sm:min-h-[10rem] p-3 sm:p-6 bg-surface border border-border rounded-2xl text-sm sm:text-base text-text-primary placeholder:text-text-tertiary resize-y focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent leading-relaxed transition-shadow"
              spellCheck={false}
            />
          )}
        </div>

        {/* Notable Calcs */}
        <div className="flex flex-col gap-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-text-tertiary presenting:text-sm">
            Notable Calcs
          </h3>

          {calcs.length > 0 ? (
            <div className="flex flex-col gap-4">
              {renderCalcGroup(offensiveCalcs, "offensive", calcs)}
              {renderCalcGroup(defensiveCalcs, "defensive", calcs)}
              {renderCalcGroup(speedCalcs, "speed", calcs)}
            </div>
          ) : (
            <p className="text-sm text-text-tertiary italic">
              {isReadOnly ? "No notable calcs." : "Add damage calcs, speed benchmarks, and other key numbers."}
            </p>
          )}

          {/* Add calc input */}
          {!isReadOnly && (
            <CalcInput
              pokemonSpecies={parsed.species}
              onAddCalc={onAddCalc}
            />
          )}
        </div>
      </div>
    </div>
  );
}
