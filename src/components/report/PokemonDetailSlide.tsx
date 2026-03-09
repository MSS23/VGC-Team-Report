"use client";

import { useState, useRef, useEffect } from "react";
import type { AnalyzedPokemon } from "@/lib/types/analysis";
import type { CalcEntry, CalcCategory } from "@/hooks/useDamageCalcs";
import { PokemonSprite } from "./PokemonSprite";
import { TypeBadge } from "./TypeBadge";
import { CalcInput } from "./CalcInput";
import { getMoveTypeStyle } from "@/lib/utils/move-type-style";
import { NATURES } from "@/lib/data/natures";

interface PokemonDetailSlideProps {
  pokemon: AnalyzedPokemon;
  note: string;
  onNoteChange: (text: string) => void;
  calcs: CalcEntry[];
  onAddCalc: (text: string, category: CalcCategory) => void;
  onRemoveCalc: (index: number) => void;
  onEditCalc?: (index: number, updates: Partial<CalcEntry>) => void;
  isReadOnly?: boolean;
  isPresentationMode?: boolean;
  shiny?: boolean;
  animated?: boolean;
}

const CATEGORY_CONFIG = {
  offensive: {
    label: "Offensive",
    icon: "\u2694\uFE0F",
    borderClass: "border-red-400/25",
    leftBorder: "border-l-red-400",
    bgClass: "bg-red-500/8",
    presentBgClass: "presenting:bg-red-500/12",
    tagBg: "bg-red-500/15",
    tagText: "text-red-500 dark:text-red-400",
    iconColor: "text-red-400",
    bulletColor: "text-red-400/70",
  },
  defensive: {
    label: "Defensive",
    icon: "\uD83D\uDEE1\uFE0F",
    borderClass: "border-emerald-400/25",
    leftBorder: "border-l-emerald-400",
    bgClass: "bg-emerald-500/8",
    presentBgClass: "presenting:bg-emerald-500/12",
    tagBg: "bg-emerald-500/15",
    tagText: "text-emerald-600 dark:text-emerald-400",
    iconColor: "text-emerald-400",
    bulletColor: "text-emerald-400/70",
  },
  speed: {
    label: "Speed Tier",
    icon: "\u26A1",
    borderClass: "border-amber-400/25",
    leftBorder: "border-l-amber-400",
    bgClass: "bg-amber-500/8",
    presentBgClass: "presenting:bg-amber-500/12",
    tagBg: "bg-amber-500/15",
    tagText: "text-amber-600 dark:text-amber-400",
    iconColor: "text-amber-400",
    bulletColor: "text-amber-400/70",
  },
} as const;

type CategoryCfg = typeof CATEGORY_CONFIG[CalcCategory];

function EditableCalcEntry({
  entry,
  cfg,
  isReadOnly,
  onRemove,
  onEdit,
  categories,
}: {
  entry: CalcEntry;
  cfg: CategoryCfg;
  isReadOnly: boolean;
  onRemove: () => void;
  onEdit?: (updates: Partial<CalcEntry>) => void;
  categories: CalcCategory[];
}) {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(entry.text);
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.selectionStart = inputRef.current.value.length;
    }
  }, [editing]);

  useEffect(() => {
    if (!showCategoryMenu) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowCategoryMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showCategoryMenu]);

  const commitEdit = () => {
    const trimmed = editText.trim();
    if (trimmed && trimmed !== entry.text) {
      onEdit?.({ text: trimmed });
    }
    setEditing(false);
  };

  return (
    <div
      className={`group flex items-start gap-3 px-4 py-3 ${cfg.bgClass} ${cfg.presentBgClass} border ${cfg.borderClass} border-l-[3px] ${cfg.leftBorder} rounded-xl transition-colors presenting:px-5`}
    >
      <span className={`${cfg.bulletColor} text-sm mt-px flex-shrink-0 presenting:text-base`}>&#9656;</span>
      {editing && !isReadOnly ? (
        <textarea
          ref={inputRef}
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); commitEdit(); }
            if (e.key === "Escape") { setEditText(entry.text); setEditing(false); }
          }}
          className="flex-1 text-sm sm:text-base text-text-primary leading-relaxed bg-transparent border-none outline-none resize-none min-h-[1.5em]"
          rows={1}
          spellCheck={false}
        />
      ) : (
        <span
          className={`flex-1 text-sm sm:text-base text-text-primary leading-relaxed ${!isReadOnly ? "cursor-text" : ""}`}
          onClick={() => {
            if (!isReadOnly && onEdit) {
              setEditText(entry.text);
              setEditing(true);
            }
          }}
        >
          {entry.text}
        </span>
      )}
      {!isReadOnly && (
        <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex-shrink-0 ml-1 mt-0.5">
          {/* Category switcher */}
          {onEdit && (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowCategoryMenu(!showCategoryMenu)}
                className="text-text-tertiary hover:text-text-secondary text-xs px-1.5 py-0.5 rounded-md hover:bg-surface-alt transition-colors"
                aria-label="Change category"
                title="Change category"
              >
                {CATEGORY_CONFIG[entry.category].icon}
              </button>
              {showCategoryMenu && (
                <div className="absolute right-0 top-full mt-1 z-20 bg-surface border border-border rounded-lg shadow-lg py-1 min-w-[140px]">
                  {categories.map((cat) => {
                    const catCfg = CATEGORY_CONFIG[cat];
                    return (
                      <button
                        key={cat}
                        onClick={() => {
                          if (cat !== entry.category) onEdit({ category: cat });
                          setShowCategoryMenu(false);
                        }}
                        className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm text-left hover:bg-surface-alt transition-colors ${
                          cat === entry.category ? "font-semibold" : ""
                        }`}
                      >
                        <span>{catCfg.icon}</span>
                        <span className={catCfg.tagText}>{catCfg.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
          <button
            onClick={onRemove}
            className="text-text-tertiary hover:text-red-400 text-sm transition-colors"
            aria-label="Remove calc"
          >
            &#10005;
          </button>
        </div>
      )}
    </div>
  );
}

function CollapsibleCalcGroup({
  category,
  cfg,
  entries,
  globalCalcs,
  isReadOnly,
  isPresentationMode,
  onRemoveCalc,
  onEditCalc,
  categories,
}: {
  category: CalcCategory;
  cfg: CategoryCfg;
  entries: CalcEntry[];
  globalCalcs: CalcEntry[];
  isReadOnly: boolean;
  isPresentationMode: boolean;
  onRemoveCalc: (index: number) => void;
  onEditCalc?: (index: number, updates: Partial<CalcEntry>) => void;
  categories: CalcCategory[];
}) {
  const [isOpen, setIsOpen] = useState(!isPresentationMode);

  return (
    <div className="presenting:flex-1 presenting:min-w-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 w-full mb-1 group/header cursor-pointer"
      >
        <span className="text-sm">{cfg.icon}</span>
        <span className={`text-xs font-bold uppercase tracking-widest ${cfg.tagText}`}>
          {cfg.label}
        </span>
        <span className={`text-xs font-medium ${cfg.tagText} opacity-60`}>
          ({entries.length})
        </span>
        <span className={`flex-1 h-px ${cfg.tagBg}`} />
        <svg
          className={`w-3.5 h-3.5 ${cfg.tagText} opacity-50 group-hover/header:opacity-100 transition-all duration-200 ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div
        className="transition-all duration-200 ease-in-out"
        style={{
          display: "grid",
          gridTemplateRows: isOpen ? "1fr" : "0fr",
          opacity: isOpen ? 1 : 0,
        }}
      >
        <div className="overflow-hidden">
        <div className="flex flex-col gap-2 pt-1">
          {entries.map((entry) => {
            const globalIndex = globalCalcs.indexOf(entry);
            return (
              <EditableCalcEntry
                key={globalIndex}
                entry={entry}
                cfg={cfg}
                isReadOnly={isReadOnly}
                onRemove={() => onRemoveCalc(globalIndex)}
                onEdit={onEditCalc ? (updates) => onEditCalc(globalIndex, updates) : undefined}
                categories={categories}
              />
            );
          })}
        </div>
        </div>
      </div>
    </div>
  );
}

export function PokemonDetailSlide({
  pokemon,
  note,
  onNoteChange,
  calcs,
  onAddCalc,
  onRemoveCalc,
  onEditCalc,
  isReadOnly = false,
  isPresentationMode = false,
  shiny = false,
  animated = true,
}: PokemonDetailSlideProps) {
  const { parsed, data, calculatedStats, itemBoost } = pokemon;
  const types = data?.types ?? [];
  const natureData = NATURES[parsed.nature];
  const statLabels = {
    hp: "HP",
    atk: "Atk",
    def: "Def",
    spa: "SpA",
    spd: "SpD",
    spe: "Spe",
  } as const;

  // Non-default IVs (not 31)
  const nonDefaultIvs = (["hp", "atk", "def", "spa", "spd", "spe"] as const).filter(
    (stat) => parsed.ivs[stat] !== 31
  );

  const offensiveCalcs = calcs.filter((c) => c.category === "offensive");
  const defensiveCalcs = calcs.filter((c) => c.category === "defensive");
  const speedCalcs = calcs.filter((c) => c.category === "speed");

  const CATEGORIES: CalcCategory[] = ["offensive", "defensive", "speed"];

  const renderCalcGroup = (
    entries: CalcEntry[],
    category: CalcCategory,
    globalCalcs: CalcEntry[]
  ) => {
    if (entries.length === 0) return null;
    const cfg = CATEGORY_CONFIG[category];

    return (
      <CollapsibleCalcGroup
        category={category}
        cfg={cfg}
        entries={entries}
        globalCalcs={globalCalcs}
        isReadOnly={isReadOnly}
        isPresentationMode={isPresentationMode}
        onRemoveCalc={onRemoveCalc}
        onEditCalc={onEditCalc}
        categories={CATEGORIES}
      />
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[45%_55%] gap-4 sm:gap-6 lg:gap-8 items-start animate-fade-in">
      {/* Left Column: Pokemon Info */}
      <div className="flex flex-col gap-4 sm:gap-6">
        {/* Header: Sprite + Name + Types */}
        <div className="flex items-start gap-3 sm:gap-6">
          <div className="flex-shrink-0 flex flex-col items-center gap-1.5">
            <PokemonSprite
              species={parsed.species}
              size={isPresentationMode ? 140 : 96}
              className="sm:hidden"
              animated={animated}
              shiny={shiny}
            />
            <PokemonSprite
              species={parsed.species}
              size={isPresentationMode ? 160 : 160}
              className="hidden sm:block"
              animated={animated}
              shiny={shiny}
            />
          </div>
          <div className="flex flex-col gap-1.5 sm:gap-2 pt-0.5 sm:pt-2 min-w-0">
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
            <div className="flex flex-wrap items-center gap-x-3 sm:gap-x-4 text-sm sm:text-base text-text-secondary presenting:text-lg">
              {parsed.ability && <span>{parsed.ability}</span>}
              {parsed.item && (
                <span className="text-text-primary font-medium">
                  @ {parsed.item}
                </span>
              )}
            </div>

            {/* Non-default IVs */}
            {nonDefaultIvs.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-text-tertiary presenting:text-sm">IVs:</span>
                {nonDefaultIvs.map((stat) => (
                  <span
                    key={stat}
                    className="text-xs font-mono font-medium text-text-tertiary bg-surface-alt px-2 py-0.5 rounded presenting:text-sm presenting:px-2.5 presenting:py-1"
                  >
                    {parsed.ivs[stat]} {statLabels[stat]}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Moves - 2x2 grid */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-widest text-text-tertiary mb-2 sm:mb-3" data-walkthrough="pokemon-moves">
            Moves
          </h3>
          <div className="grid grid-cols-2 gap-2 stagger-moves">
            {parsed.moves.map((move) => {
              const typeStyle = getMoveTypeStyle(move);
              return (
                <div
                  key={move}
                  className={`px-3 sm:px-4 py-2.5 sm:py-3 border rounded-xl text-xs sm:text-sm font-semibold text-center transition-colors ${
                    typeStyle ? "shadow-sm" : "text-text-primary bg-surface border-border"
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
            <h3 className="text-xs font-semibold uppercase tracking-widest text-text-tertiary mb-2">
              Stats <span className="normal-case tracking-normal font-normal text-text-tertiary/70">({parsed.nature}{natureData?.plus ? ` +${({ atk: "Atk", def: "Def", spa: "SpA", spd: "SpD", spe: "Spe" } as Record<string, string>)[natureData.plus]}` : ""}{natureData?.minus ? ` -${({ atk: "Atk", def: "Def", spa: "SpA", spd: "SpD", spe: "Spe" } as Record<string, string>)[natureData.minus]}` : ""})</span>
            </h3>
            <div className="space-y-1 sm:space-y-1.5 stagger-stats">
              {(["hp", "atk", "def", "spa", "spd", "spe"] as const).map(
                (stat) => {
                  const value = calculatedStats[stat];
                  const ev = parsed.evs[stat];
                  const iv = parsed.ivs[stat];
                  const isBoosted = itemBoost?.stat === stat;
                  const displayValue = isBoosted ? itemBoost.boostedValue : value;
                  const maxStat = stat === "hp" ? 300 : 250;
                  const percentage = Math.min((displayValue / maxStat) * 100, 100);
                  const hasNonDefaultIv = iv !== 31;

                  return (
                    <div key={stat} className="flex items-center gap-2">
                      <span className="text-xs font-semibold w-8 text-right uppercase text-text-tertiary flex items-center justify-end gap-0.5">
                        {natureData?.plus === stat && <span className="text-[10px]">{"\u25B2"}</span>}
                        {natureData?.minus === stat && <span className="text-[10px]">{"\u25BC"}</span>}
                        {statLabels[stat]}
                      </span>
                      <div className="flex-1 h-2.5 sm:h-3 bg-surface-alt rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full animate-bar-fill"
                          style={{
                            width: `${percentage}%`,
                            backgroundColor: isBoosted ? "#f59e0b" : ev > 0 ? "var(--accent)" : "#94a3b8",
                          }}
                        />
                      </div>
                      <span className={`text-xs sm:text-sm font-mono w-8 text-right tabular-nums ${
                        isBoosted ? "text-amber-500 font-semibold" : "text-text-secondary"
                      }`}>
                        {displayValue}
                      </span>
                      <div className="flex items-center gap-1 w-16">
                        {ev > 0 ? (
                          <span className="text-[10px] sm:text-xs text-accent font-semibold">
                            +{ev}
                          </span>
                        ) : null}
                        {hasNonDefaultIv && (
                          <span className="text-[10px] sm:text-xs text-text-tertiary font-medium" title={`${iv} IV`}>
                            {iv}iv
                          </span>
                        )}
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </div>
        )}
      </div>

      {/* Right Column: User Notes + Notable Calcs */}
      <div className="flex flex-col gap-4 sm:gap-6">
        {/* Notes */}
        <div className="flex flex-col gap-2">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-text-tertiary presenting:text-sm" data-walkthrough="pokemon-notes">
            {isPresentationMode ? "Notes" : isReadOnly ? "About This Pokemon" : "Your Explanation"}
          </h3>
          {isReadOnly ? (
            <div className={`w-full bg-surface border border-border rounded-2xl text-sm sm:text-base text-text-primary whitespace-pre-wrap leading-relaxed presenting:bg-surface-alt presenting:border-border-subtle ${isPresentationMode ? "p-3 sm:p-4" : "min-h-[5rem] sm:min-h-[10rem] p-3 sm:p-6"}`}>
              {note || "No notes yet."}
            </div>
          ) : (
            <textarea
              value={note}
              onChange={(e) => onNoteChange(e.target.value)}
              placeholder={`Explain ${parsed.species}'s role, key matchups, how to use it...`}
              className="w-full min-h-[5rem] sm:min-h-[10rem] p-3 sm:p-6 bg-surface border border-border rounded-2xl text-sm sm:text-base text-text-primary placeholder:text-text-tertiary resize-y focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent leading-relaxed transition-shadow"
              spellCheck={false}
            />
          )}
        </div>

        {/* Notable Calcs */}
        <div className="flex flex-col gap-4">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-text-tertiary presenting:text-sm" data-walkthrough="notable-calcs">
            Notable Calcs
          </h3>

          {calcs.length > 0 ? (
            <div className="flex flex-col gap-5 presenting:flex-row presenting:gap-3 presenting:items-start">
              {renderCalcGroup(offensiveCalcs, "offensive", calcs)}
              {renderCalcGroup(defensiveCalcs, "defensive", calcs)}
              {renderCalcGroup(speedCalcs, "speed", calcs)}
            </div>
          ) : isReadOnly ? (
            <div className="flex items-center justify-center py-8 sm:py-12 text-text-tertiary presenting:py-16 bg-surface-alt/50 rounded-2xl border border-border-subtle">
              <p className="text-sm presenting:text-base">No notable calcs added.</p>
            </div>
          ) : (
            <p className="text-sm text-text-tertiary italic">
              Add damage calcs, speed benchmarks, and other key numbers.
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
