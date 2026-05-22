"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { hapticLight } from "@/lib/utils/haptics";
import type { AnalyzedPokemon } from "@/lib/types/analysis";
import type { CalcEntry, CalcCategory } from "@/hooks/useDamageCalcs";
import { PokemonSprite } from "./PokemonSprite";
import { TypeBadge } from "./TypeBadge";
import { CalcInput } from "./CalcInput";
import { getMoveTypeStyle } from "@/lib/utils/move-type-style";
import { NATURES } from "@/lib/data/natures";
import { useTranslation } from "@/lib/i18n";
import { translateMove } from "@/lib/utils/translate-move";
import { getRelevantStats } from "@/lib/utils/stat-relevance";
import { detectMegaFromItem, isMegaForm, getMegaEntryFromSpecies } from "@/lib/utils/mega-detect";
import { lookupPokemon } from "@/lib/data/pokemon";
import {
  calculateAllStats,
  calculateAllChampionsStats,
  convertToChampionsSp,
  CHAMPIONS_TOTAL_SP,
  CHAMPIONS_MAX_SP_PER_STAT,
} from "@/lib/analysis/stat-calculator";
import { FieldDiffHighlight } from "./TeamReport";
import { useIsPrintMode } from "@/components/ui/print-context";

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
  /** Species key for diff highlighting */
  speciesKey?: string;
  /** Pokemon index for diff highlighting */
  pokemonIndex?: number;
  /** Current regulation (e.g. "Reg M-A" for Champions) */
  regulation?: string;
  /** Mega Evolution toggle: undefined auto-detects from mega stone */
  isMega?: boolean;
  /** Flip between base and Mega form. When omitted the toggle is hidden. */
  onToggleMega?: () => void;
}

const STAT_COLORS: Record<string, string> = {
  hp: "var(--stat-hp)",
  atk: "var(--stat-atk)",
  def: "var(--stat-def)",
  spa: "var(--stat-spa)",
  spd: "var(--stat-spd)",
  spe: "var(--stat-spe)",
};

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
  const { t } = useTranslation();
  const catLabelMap: Record<string, string> = {
    "Offensive": t.offensive,
    "Defensive": t.defensive,
    "Speed Tier": t.speedTier,
  };
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(entry.text);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.selectionStart = inputRef.current.value.length;
    }
  }, [editing]);

  const commitEdit = () => {
    const trimmed = editText.trim();
    if (trimmed && trimmed !== entry.text) {
      onEdit?.({ text: trimmed });
    }
    setEditing(false);
  };

  return (
    <div
      className={`group flex items-start gap-3 px-3 py-2.5 sm:px-4 sm:py-3 ${cfg.bgClass} ${cfg.presentBgClass} border ${cfg.borderClass} border-l-[3px] ${cfg.leftBorder} rounded-lg transition-all hover:shadow-sm presenting:px-5`}
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
        <div
          className="flex items-center gap-1 shrink-0 self-start"
          role="group"
          aria-label={t.changeCategory}
        >
          {/* Always-visible segmented category switcher */}
          {onEdit && (
            <div className="flex items-center gap-0.5 rounded-lg bg-surface-alt/60 border border-border p-0.5">
              {categories.map((cat) => {
                const catCfg = CATEGORY_CONFIG[cat];
                const isActive = entry.category === cat;
                const label = catLabelMap[catCfg.label] ?? catCfg.label;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      if (!isActive) onEdit({ category: cat });
                    }}
                    aria-label={`${t.changeCategory}: ${label}`}
                    aria-pressed={isActive}
                    title={label}
                    className={`inline-flex items-center justify-center h-8 w-8 sm:h-9 sm:w-9 rounded-md text-sm transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 focus-visible:ring-offset-surface ${
                      isActive
                        ? `${catCfg.tagBg} ${catCfg.tagText} border ${catCfg.borderClass} shadow-sm`
                        : "text-text-tertiary hover:text-text-primary hover:bg-surface active:scale-95"
                    }`}
                  >
                    <span aria-hidden>{catCfg.icon}</span>
                    {isActive && <span className="sr-only"> (current)</span>}
                  </button>
                );
              })}
            </div>
          )}

          {/* Divider */}
          <div className="mx-0.5 sm:mx-1 h-6 w-px bg-border" aria-hidden />

          {/* Delete */}
          <button
            type="button"
            onClick={onRemove}
            aria-label={t.removeCalc}
            title={t.removeCalc}
            className="inline-flex items-center justify-center h-8 w-8 sm:h-9 sm:w-9 rounded-md text-text-tertiary hover:text-red-500 hover:bg-red-500/10 active:scale-95 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-1 focus-visible:ring-offset-surface"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M6 6l8 8M14 6l-8 8" />
            </svg>
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
  translatedLabel,
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
  translatedLabel: string;
}) {
  const isPrint = useIsPrintMode();
  const [isOpen, setIsOpen] = useState(!isPresentationMode);
  // Force open in print mode so all calcs are visible; guests can still toggle
  const effectiveOpen = isPrint || isOpen;

  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 w-full mb-1 group/header cursor-pointer"
      >
        <span className="text-sm">{cfg.icon}</span>
        <span className={`text-xs font-extrabold uppercase tracking-widest ${cfg.tagText}`}>
          {translatedLabel}
        </span>
        <span className={`text-xs font-semibold ${cfg.tagText} opacity-60`}>
          ({entries.length})
        </span>
        <span className={`flex-1 h-px ${cfg.tagBg}`} />
        <svg
          className={`w-3.5 h-3.5 ${cfg.tagText} opacity-50 group-hover/header:opacity-100 transition-all duration-200 ${effectiveOpen ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div
        className={`grid transition-all duration-200 ease-in-out ${effectiveOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
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
  speciesKey,
  pokemonIndex,
  regulation,
  isMega,
  onToggleMega,
}: PokemonDetailSlideProps) {
  const { t, language } = useTranslation();
  const { parsed, data, calculatedStats, itemBoost } = pokemon;

  // ── Mega Evolution resolution ────────────────────────────────────
  // Mirrors PokemonCard. Two paste shapes collapse into the same "mega
  // capable" concept: base+stone (Kangaskhan @ Kangaskhanite) and already
  // in Mega form (Kangaskhan-Mega @ Kangaskhanite). Both allow flipping
  // between forms so the user can compare stats, types, and ability.
  const alreadyMega = isMegaForm(parsed.species);
  const megaEntry = useMemo(() => {
    if (alreadyMega) return getMegaEntryFromSpecies(parsed.species);
    return detectMegaFromItem(parsed.item, parsed.species);
  }, [alreadyMega, parsed.item, parsed.species]);
  const isMegaCapable = !!megaEntry;

  // Base form data — resolved first so the toggle logic below can know
  // whether we actually have a base side to flip to. For base+stone
  // pastes the parsed `data` is already the base form.
  const baseFormData = useMemo(() => {
    if (!alreadyMega || !megaEntry) return null;
    return lookupPokemon(megaEntry.baseName);
  }, [alreadyMega, megaEntry]);

  // Can this slide actually flip to its base side? alreadyMega pastes
  // require baseFormData to resolve in the Pokemon DB, otherwise the
  // base view would render empty. If not, lock to Mega and hide toggle.
  const canFlipToBase = isMegaCapable && (!alreadyMega || !!baseFormData);

  // Mirrors PokemonCard's two-gate rule: toggle (and default Mega rendering)
  // require BOTH a Reg M-A regulation (or undefined for legacy reports)
  // AND the Pokemon actually carrying a Mega Stone for its species. Without
  // either, no toggle and no auto-Mega rendering.
  const isExplicitlyNonMA = !!regulation && regulation !== "Reg M-A";
  const hasMegaStone = useMemo(
    () => !!detectMegaFromItem(parsed.item, parsed.species),
    [parsed.item, parsed.species],
  );
  const defaultShowMega = !isExplicitlyNonMA && hasMegaStone;
  const showMega = isMegaCapable && (canFlipToBase ? (isMega ?? defaultShowMega) : true);
  const showMegaToggle =
    canFlipToBase && hasMegaStone && !isExplicitlyNonMA && !!onToggleMega;

  const megaData = useMemo(() => {
    if (!showMega || !megaEntry) return null;
    return lookupPokemon(megaEntry.dataKey);
  }, [showMega, megaEntry]);

  // Resolve "base side" data for this slide. For base+stone pastes the
  // parsed Pokemon's own data already IS the base; for alreadyMega it
  // comes from the explicit lookup. `?? data` is a defensive safety net
  // — canFlipToBase blocks the path that reaches this when baseFormData
  // is null, but it guards against future reordering churn.
  const effectiveBaseData = alreadyMega ? (baseFormData ?? data) : data;

  const megaStats = useMemo(() => {
    if (!megaData) return null;
    return calculateAllStats(
      megaData.baseStats,
      parsed.ivs,
      parsed.evs,
      parsed.level,
      parsed.nature,
    );
  }, [megaData, parsed.ivs, parsed.evs, parsed.level, parsed.nature]);

  // Base-form stats when alreadyMega is flipped to base.
  const baseFormStats = useMemo(() => {
    if (!alreadyMega || showMega || !baseFormData) return null;
    return calculateAllStats(
      baseFormData.baseStats,
      parsed.ivs,
      parsed.evs,
      parsed.level,
      parsed.nature,
    );
  }, [alreadyMega, showMega, baseFormData, parsed.ivs, parsed.evs, parsed.level, parsed.nature]);

  // Base-form stats used for the Mega delta comparison strip (shown when mega is active).
  // For base+stone pastes, effectiveBaseData IS the base form already.
  // For already-Mega pastes, effectiveBaseData resolves to baseFormData.
  // Champions format uses SP-based calculation to match the displayStats source.
  const baseStatsForComparison = useMemo(() => {
    if (!showMega || !megaData || !effectiveBaseData) return null;
    if (regulation === "Reg M-A") {
      const sp = convertToChampionsSp(parsed.evs);
      return calculateAllChampionsStats(effectiveBaseData.baseStats, sp, parsed.nature);
    }
    return calculateAllStats(
      effectiveBaseData.baseStats,
      parsed.ivs,
      parsed.evs,
      parsed.level,
      parsed.nature,
    );
  }, [showMega, megaData, effectiveBaseData, regulation, parsed.ivs, parsed.evs, parsed.level, parsed.nature]);

  // Champions (Reg M-A) recomputes stats from the SP budget — must run
  // against whichever side (Mega or base) is currently displayed.
  const championsStats = useMemo(() => {
    if (regulation !== "Reg M-A") return null;
    const sourceData = showMega ? megaData : effectiveBaseData;
    if (!sourceData) return null;
    const sp = convertToChampionsSp(parsed.evs);
    return calculateAllChampionsStats(sourceData.baseStats, sp, parsed.nature);
  }, [regulation, showMega, megaData, effectiveBaseData, parsed.evs, parsed.nature]);

  const displaySpecies = showMega && megaEntry
    ? megaEntry.displayName
    : (alreadyMega && megaEntry ? megaEntry.baseName : parsed.species);
  const displayTypes = (
    showMega && megaData ? megaData.types : effectiveBaseData?.types
  ) ?? [];
  // Base-form ability fallback: paste carries the Mega ability, so when
  // flipping alreadyMega cards to base we show the base Pokemon's primary
  // ability with an asterisk to flag it's a best guess.
  const displayAbility = showMega && megaEntry
    ? megaEntry.ability
    : (alreadyMega && baseFormData
        ? `${baseFormData.abilities[0] ?? parsed.ability} *`
        : parsed.ability);
  const displayData = showMega ? megaData : effectiveBaseData;
  const displayStats = championsStats
    ?? (showMega ? megaStats : baseFormStats)
    ?? calculatedStats;
  // Sprite: Mega uses the mega data key; base uses the resolved base name
  // so already-Mega flips to the real base sprite, not the mega slug.
  const spriteSpecies = showMega && megaEntry
    ? megaEntry.dataKey
    : (alreadyMega && megaEntry ? megaEntry.baseName : parsed.species);

  const types = displayTypes;
  const natureData = NATURES[parsed.nature];
  const relevantStats = getRelevantStats(parsed);
  const statLabels = {
    hp: t.statHp,
    atk: t.statAtk,
    def: t.statDef,
    spa: t.statSpa,
    spd: t.statSpd,
    spe: t.statSpe,
  } as const;

  // Reg M-A (Champions): no Tera, IVs locked to 31. Gate both displays.
  const isRegMA = regulation === "Reg M-A";

  // Non-default IVs (not 31) — hidden entirely in Reg M-A since IVs are locked.
  const nonDefaultIvs = isRegMA
    ? []
    : (["hp", "atk", "def", "spa", "spd", "spe"] as const).filter(
        (stat) => parsed.ivs[stat] !== 31
      );

  const offensiveCalcs = calcs.filter((c) => c.category === "offensive");
  const defensiveCalcs = calcs.filter((c) => c.category === "defensive");
  const speedCalcs = calcs.filter((c) => c.category === "speed");

  const CATEGORIES: CalcCategory[] = ["offensive", "defensive", "speed"];

  const categoryLabelMap: Record<string, string> = {
    "Offensive": t.offensive,
    "Defensive": t.defensive,
    "Speed Tier": t.speedTier,
  };

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
        translatedLabel={categoryLabelMap[cfg.label] ?? cfg.label}
      />
    );
  };

  // ── Mobile card tabs ──────────────────────────────────────────────
  const MOBILE_TABS = ["set", "stats", "notes", "calcs"] as const;
  type MobileTab = typeof MOBILE_TABS[number];
  const [mobileTab, setMobileTab] = useState<MobileTab>("set");

  const handleTabChange = useCallback((tab: MobileTab) => {
    setMobileTab(tab);
    hapticLight();
  }, []);

  // Listen for walkthrough tab switch events
  useEffect(() => {
    const handler = (e: Event) => {
      const tab = (e as CustomEvent).detail as MobileTab;
      if (MOBILE_TABS.includes(tab)) setMobileTab(tab);
    };
    window.addEventListener("walkthrough-tab", handler);
    return () => window.removeEventListener("walkthrough-tab", handler);
  }, []);

  const mobileTabLabels: Record<MobileTab, string> = {
    set: t.moves ?? "Set",
    stats: t.stats ?? "Stats",
    notes: t.notes ?? "Notes",
    calcs: t.notableCalcs ?? "Calcs",
  };

  const mobileTabIcons: Record<MobileTab, React.ReactNode> = {
    set: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>,
    stats: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>,
    notes: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>,
    calcs: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" /><line x1="8" y1="6" x2="16" y2="6" /><line x1="16" y1="14" x2="16" y2="18" /><line x1="8" y1="10" x2="8" y2="10.01" /><line x1="12" y1="10" x2="12" y2="10.01" /><line x1="16" y1="10" x2="16" y2="10.01" /><line x1="8" y1="14" x2="8" y2="14.01" /><line x1="12" y1="14" x2="12" y2="14.01" /><line x1="8" y1="18" x2="8" y2="18.01" /><line x1="12" y1="18" x2="12" y2="18.01" /></svg>,
  };

  // ── Shared sub-renderers ──────────────────────────────────────────
  const renderHeroHeader = () => (
    <div className="flex items-start gap-3 sm:gap-6">
      <div className="flex-shrink-0 flex flex-col items-center gap-1.5">
        <PokemonSprite
          species={spriteSpecies}
          size={isPresentationMode ? 140 : 80}
          className="sm:hidden"
          animated={animated}
          shiny={shiny}
        />
        <PokemonSprite
          species={spriteSpecies}
          size={isPresentationMode ? 160 : 160}
          className="hidden sm:block"
          animated={animated}
          shiny={shiny}
        />
      </div>
      <div className="flex flex-col gap-1.5 sm:gap-2 pt-0.5 sm:pt-2 min-w-0">
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-text-primary presenting:text-4xl truncate tracking-tight">
            {displaySpecies}
          </h2>
          {/* Mega toggle — same control covers base+stone AND already-Mega
              pastes now that the detail slide resolves megaEntry from
              either the item or the species key. */}
          {showMegaToggle && (
            <button
              type="button"
              onClick={onToggleMega}
              className={`inline-flex items-center justify-center min-w-[44px] min-h-[44px] rounded-md text-sm font-extrabold transition-all duration-200 ${
                showMega
                  ? "bg-gradient-to-br from-pink-500 to-purple-600 text-white shadow-sm shadow-purple-500/30"
                  : "bg-surface-alt text-text-tertiary hover:text-purple-500 hover:bg-purple-500/10 border border-border-subtle"
              }`}
              title={showMega ? "Show base form" : "Show Mega Evolution"}
              aria-label={showMega ? "Show base form" : "Show Mega Evolution"}
              aria-pressed={showMega}
            >
              M
            </button>
          )}
          {parsed.gender && (
            <span
              className={`text-lg sm:text-xl font-bold ${
                parsed.gender === "M" ? "text-blue-500" : "text-pink-500"
              }`}
            >
              {parsed.gender === "M" ? "\u2642" : "\u2640"}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {types.map((type) => (
            <TypeBadge key={type} type={type} />
          ))}
          {parsed.teraType && !isRegMA && (
            <span className="flex items-center gap-1 ml-1 sm:ml-2">
              <span className="text-xs text-text-tertiary font-semibold">{t.tera}:</span>
              <TypeBadge type={parsed.teraType} />
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-x-3 sm:gap-x-4 text-sm sm:text-base text-text-secondary presenting:text-lg">
          {displayAbility && <span className="font-medium">{displayAbility}</span>}
          {parsed.item && (
            <span className="text-text-primary font-bold">
              @ {parsed.item}
            </span>
          )}
        </div>
        {nonDefaultIvs.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <span className="text-xs font-extrabold uppercase tracking-widest text-text-tertiary presenting:text-sm">{t.ivs}:</span>
            {nonDefaultIvs.map((stat) => (
              <span
                key={stat}
                className="text-xs font-[family-name:var(--font-mono)] font-semibold text-text-tertiary bg-surface-alt px-2 py-0.5 rounded presenting:text-sm presenting:px-2.5 presenting:py-1"
              >
                {parsed.ivs[stat]} {statLabels[stat]}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderMoves = () => (
    <div>
      <h3 className="text-xs font-extrabold uppercase tracking-widest text-text-tertiary mb-2 sm:mb-3" data-walkthrough="pokemon-moves">
        {t.moves}
      </h3>
      <div className="grid grid-cols-2 gap-2 stagger-moves">
        {parsed.moves.map((move) => {
          const typeStyle = getMoveTypeStyle(move);
          return (
            <div
              key={move}
              className={`px-3.5 sm:px-5 py-3 sm:py-3.5 border rounded-xl text-xs sm:text-sm font-bold text-center transition-all hover:scale-[1.02] hover:shadow-sm ${
                typeStyle ? "shadow-sm" : "text-text-primary bg-surface border-border"
              }`}
              style={typeStyle ?? undefined}
            >
              {translateMove(move, language)}
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderStats = () => {
    if (!displayData) return null;
    const isChampions = regulation === "Reg M-A";
    const totalEvs = Object.values(parsed.evs).reduce((a, b) => a + b, 0);
    const spSpread = convertToChampionsSp(parsed.evs);
    const totalSp = (["hp", "atk", "def", "spa", "spd", "spe"] as const).reduce((sum, s) => sum + spSpread[s], 0);

    return (
    <div>
      <div className="flex items-center gap-2 sm:gap-3 mb-2.5 sm:mb-3 flex-wrap">
        <h3 className="text-xs font-extrabold uppercase tracking-widest text-text-tertiary">
          {t.stats} <span className="normal-case tracking-normal font-medium text-text-tertiary/70">({parsed.nature})</span>
        </h3>

        {isChampions ? (() => {
          // Reg M-A is an SP-only format. EV totals are misleading here
          // (66 SP ≠ 66 EVs — the conversion curve is non-linear), so the
          // budget badge stays SP-native instead of offering an EV toggle
          // that would mix two unit systems.
          const spOver = totalSp > CHAMPIONS_TOTAL_SP;
          const spUnder = totalSp < CHAMPIONS_TOTAL_SP && totalSp > 0;
          const spDot = spOver ? "bg-danger" : spUnder ? "bg-amber-500" : "bg-emerald-500";
          return (
            <div
              className="inline-flex h-8 sm:h-9 items-center rounded-lg bg-surface-alt border border-border px-2.5 sm:px-3 gap-1.5 ml-auto"
              aria-label={`Stat Points: ${totalSp} of ${CHAMPIONS_TOTAL_SP}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${spDot}`} aria-hidden />
              <span className="text-[11px] sm:text-xs font-semibold tracking-wide tabular-nums text-text-secondary">SP</span>
              <span className="text-[11px] sm:text-xs font-semibold tabular-nums text-text-tertiary">
                {totalSp}/{CHAMPIONS_TOTAL_SP}
              </span>
            </div>
          );
        })() : totalEvs > 0 ? (
          /* Traditional VGC cap: 508 is the usable maximum. The game allows
             510 total but the last 2 EVs in a 252 slot provide no stat gain,
             so 508 is the correctly optimized target (e.g. 252/252/4 = 508). */
          <span className={`text-xs sm:text-sm font-bold ml-auto tabular-nums ${
            totalEvs > 508 ? "text-danger" : totalEvs < 508 ? "text-amber-500" : "text-text-tertiary/50"
          }`}>
            {totalEvs}/508{totalEvs < 508 && ` · ${508 - totalEvs} left`}
          </span>
        ) : null}
      </div>

      <div className="space-y-1 sm:space-y-1.5 stagger-stats">
        {(["hp", "atk", "def", "spa", "spd", "spe"] as const).filter((stat) => relevantStats.has(stat)).map(
          (stat) => {
            const value = displayStats[stat];
            const ev = parsed.evs[stat];
            const sp = spSpread[stat];
            const iv = parsed.ivs[stat];
            const isBoosted = itemBoost?.stat === stat;
            // Recompute from displayStats so Champions SP recalcs and Mega
            // form swaps feed the multiplier the correct base — itemBoost
            // carries the multiplier (and picks the boosted stat for
            // Booster Energy) but its baked-in boostedValue was computed
            // against the standard-EV calculatedStats and goes stale.
            const displayValue = isBoosted && itemBoost
              ? Math.floor(value * itemBoost.multiplier)
              : value;
            const maxStat = stat === "hp" ? 300 : 250;
            const percentage = Math.min((displayValue / maxStat) * 100, 100);
            const hasNonDefaultIv = iv !== 31;

            // Reg M-A: SP only. Other regs: EVs.
            const showSp = isChampions;
            const investLabel = showSp ? sp : ev;
            const investUnit = showSp ? "SP" : "";
            const isOverMax = isChampions && sp > CHAMPIONS_MAX_SP_PER_STAT;

            const natureUp = natureData?.plus === stat;
            const natureDown = natureData?.minus === stat;
            const hasBuff = natureUp || isBoosted;
            const hasNerf = natureDown;

            return (
              <div key={stat} className="flex items-center gap-2" aria-label={`${statLabels[stat]}: ${displayValue}${natureUp ? ", boosted by nature" : ""}${natureDown ? ", reduced by nature" : ""}${isBoosted ? ", boosted by item" : ""}`}>
                <span className="text-xs font-bold w-11 text-right uppercase text-text-tertiary flex items-center justify-end gap-0.5 flex-shrink-0">
                  {natureUp && <span className="text-[12px] text-emerald-500 dark:text-emerald-400 leading-none" aria-label="boosted by nature">{"\u25B2"}</span>}
                  {natureDown && <span className="text-[12px] text-rose-500 dark:text-rose-400 leading-none" aria-label="reduced by nature">{"\u25BC"}</span>}
                  {statLabels[stat]}
                </span>
                <div className="flex-1 h-3 sm:h-3.5 bg-surface-alt rounded-full overflow-hidden shadow-inner">
                  <div
                    className="h-full rounded-full animate-bar-fill"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: isBoosted ? "#f59e0b" : STAT_COLORS[stat],
                    }}
                  />
                </div>
                {/* Number value — color coded for nature/item modifiers.
                    The up/down arrows live exclusively on the left next
                    to the stat label so each affected stat shows exactly
                    one arrow (not two). */}
                <span className={`text-xs sm:text-sm font-[family-name:var(--font-mono)] font-bold w-8 text-right tabular-nums ${
                  isBoosted ? "text-amber-500" : hasBuff ? "text-emerald-600 dark:text-emerald-400" : hasNerf ? "text-rose-600 dark:text-rose-400" : "text-text-secondary"
                }`}>
                  {displayValue}
                </span>
                <div className="flex items-center gap-1 w-16">
                  {investLabel > 0 ? (
                    <span className={`text-xs font-bold ${isOverMax && showSp ? "text-amber-500" : "text-accent"}`}>
                      +{investLabel}{investUnit && <span className="text-[9px] ml-px">{investUnit}</span>}
                    </span>
                  ) : null}
                  {hasNonDefaultIv && (
                    <span className="text-xs text-text-tertiary font-semibold" title={`${iv} IV`}>
                      {iv}iv
                    </span>
                  )}
                </div>
              </div>
            );
          }
        )}
      </div>

      {/* Mega stat delta strip — shows base → mega changes when Mega is active.
          Uses championsStats in Reg M-A (SP-based) and megaStats otherwise so
          the delta always matches what the stat bars above actually display. */}
      {showMega && baseStatsForComparison && (() => {
        const megaForDelta = championsStats ?? megaStats;
        if (!megaForDelta) return null;
        const STAT_ORDER = ["hp", "atk", "def", "spa", "spd", "spe"] as const;
        const changed = STAT_ORDER.filter(
          (stat) => megaForDelta[stat] !== baseStatsForComparison[stat]
        );
        if (changed.length === 0) return null;
        return (
          <div className="mt-3 pt-3 border-t border-border-subtle" aria-label="Mega stat changes">
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-purple-400/70 mb-2 presenting:text-xs">
              Mega boosts
            </p>
            <div className="flex flex-wrap gap-1.5">
              {changed.map((stat) => {
                const delta = megaForDelta[stat] - baseStatsForComparison[stat];
                const positive = delta > 0;
                return (
                  <span
                    key={stat}
                    className={`inline-flex items-center gap-1 text-[11px] sm:text-xs font-bold px-2 py-1 rounded-md presenting:text-sm ${
                      positive
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                    }`}
                    aria-label={`${statLabels[stat as keyof typeof statLabels]}: ${baseStatsForComparison[stat]} to ${megaForDelta[stat]}, ${positive ? "+" : ""}${delta}`}
                  >
                    <span className="uppercase text-text-tertiary font-extrabold tracking-widest text-[9px] sm:text-[10px]">
                      {statLabels[stat as keyof typeof statLabels]}
                    </span>
                    <span className="font-[family-name:var(--font-mono)] tabular-nums">
                      {baseStatsForComparison[stat]}
                    </span>
                    <span className="text-text-tertiary opacity-60">{"→"}</span>
                    <span className="font-[family-name:var(--font-mono)] tabular-nums">
                      {megaForDelta[stat]}
                    </span>
                    <span className="opacity-80">({positive ? "+" : ""}{delta})</span>
                  </span>
                );
              })}
            </div>
          </div>
        );
      })()}
    </div>
    );
  };

  const renderNotes = () => (
    <FieldDiffHighlight field={speciesKey ? [`notes:${speciesKey}`] : []} label="Notes changed">
    <div className="flex flex-col gap-2">
      <h3 className="text-xs font-extrabold uppercase tracking-widest text-text-tertiary presenting:text-sm" data-walkthrough="pokemon-notes">
        {isPresentationMode ? t.notes : isReadOnly ? t.aboutThisPokemon : t.yourExplanation}
      </h3>
      {isReadOnly ? (
        <div className={`w-full bg-surface border border-border rounded-xl text-sm sm:text-base text-text-primary whitespace-pre-wrap leading-relaxed presenting:bg-surface-alt presenting:border-border-subtle ${isPresentationMode ? "p-3 sm:p-4" : "min-h-[4rem] sm:min-h-[10rem] p-3 sm:p-6"}`}>
          {note || t.noNotesYet}
        </div>
      ) : (
        <textarea
          value={note}
          onChange={(e) => onNoteChange(e.target.value)}
          placeholder={t.notesPlaceholder.replace("{species}", parsed.species)}
          className="w-full min-h-[4rem] sm:min-h-[10rem] p-3 sm:p-6 bg-surface border-2 border-border rounded-xl text-sm sm:text-base text-text-primary placeholder:text-text-tertiary resize-y focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent leading-relaxed transition-shadow"
          spellCheck={false}
        />
      )}
    </div>
    </FieldDiffHighlight>
  );

  const renderCalcs = () => (
    <FieldDiffHighlight field={speciesKey ? [`calcs:${speciesKey}`] : []} label="Calcs changed">
    <div className="flex flex-col gap-4">
      <h3 className="text-xs font-extrabold uppercase tracking-widest text-text-tertiary presenting:text-sm" data-walkthrough="notable-calcs">
        {t.notableCalcs}
      </h3>
      {calcs.length > 0 ? (
        <div className="flex flex-col gap-5 sm:gap-4">
          {!isReadOnly && (
            <p className="text-[11px] sm:text-xs text-text-tertiary leading-snug flex items-start gap-1.5">
              <span aria-hidden className="mt-px">&#9432;</span>
              <span>
                Auto-detected as offensive / defensive / speed.
                Tap the <span className="text-red-500 dark:text-red-400">&#9876;</span>{" "}
                <span className="text-emerald-500 dark:text-emerald-400">&#128737;</span>{" "}
                <span className="text-amber-500 dark:text-amber-400">&#9889;</span>{" "}
                icons on any calc to move it to a different group.
              </span>
            </p>
          )}
          {renderCalcGroup(offensiveCalcs, "offensive", calcs)}
          {renderCalcGroup(defensiveCalcs, "defensive", calcs)}
          {renderCalcGroup(speedCalcs, "speed", calcs)}
        </div>
      ) : isReadOnly ? (
        <div className="flex items-center justify-center py-6 sm:py-12 text-text-tertiary presenting:py-16 bg-surface-alt/50 rounded-xl border border-border-subtle">
          <p className="text-sm presenting:text-base font-medium">{t.noNotableCalcs}</p>
        </div>
      ) : (
        <p className="text-sm text-text-tertiary italic font-medium">
          {t.addDamageCalcsHint}
        </p>
      )}
      {!isReadOnly && (
        <CalcInput
          pokemonSpecies={parsed.species}
          onAddCalc={onAddCalc}
        />
      )}
    </div>
    </FieldDiffHighlight>
  );

  // ── Single return: mobile tabs + desktop two-column via CSS ─────
  return (
    <div className="animate-fade-in">
      {/* ── Mobile: card-based tabbed layout (< 640px) ── */}
      <div className="sm:hidden flex flex-col gap-3">
        <FieldDiffHighlight field={pokemonIndex !== undefined ? [`pokemon:${pokemonIndex}`] : []} label="Set changed">
          {renderHeroHeader()}
        </FieldDiffHighlight>

        {/* Tab bar */}
        <div className="flex gap-1 bg-surface-alt/60 rounded-xl p-1" style={{ touchAction: "pan-x" }}>
          {MOBILE_TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => handleTabChange(tab)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition-all ${
                mobileTab === tab
                  ? "bg-surface text-accent shadow-sm"
                  : "text-text-tertiary hover:text-text-secondary"
              }`}
            >
              {mobileTabIcons[tab]}
              <span>{mobileTabLabels[tab]}</span>
            </button>
          ))}
        </div>

        <div className="min-h-[200px]">
          {mobileTab === "set" && <div className="flex flex-col gap-3">{renderMoves()}</div>}
          {mobileTab === "stats" && <div className="flex flex-col gap-3">{renderStats()}</div>}
          {mobileTab === "notes" && renderNotes()}
          {mobileTab === "calcs" && <div className="pb-16">{renderCalcs()}</div>}
        </div>
      </div>

      {/* ── Desktop: two-column layout (>= 640px) ── */}
      <div className="hidden sm:grid sm:grid-cols-[9fr_11fr] gap-6 lg:gap-10 items-start">
        <FieldDiffHighlight field={pokemonIndex !== undefined ? [`pokemon:${pokemonIndex}`] : []} label="Set changed">
        <div className="flex flex-col gap-6 min-w-0">
          {renderHeroHeader()}
          {renderMoves()}
          {renderStats()}
        </div>
        </FieldDiffHighlight>

        <div className="flex flex-col gap-6 min-w-0 sm:max-h-[calc(100dvh-12rem)] sm:overflow-y-auto sm:scrollbar-thin sm:pr-1">
          {renderNotes()}
          {renderCalcs()}
        </div>
      </div>
    </div>
  );
}
