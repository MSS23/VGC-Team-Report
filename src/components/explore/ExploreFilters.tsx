"use client";

import { useState, useEffect, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { useTranslation } from "@/lib/i18n";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ARCHETYPES, REGULATIONS, EVENT_TYPES } from "@/lib/data/tags";
import { SearchIcon, UserIcon, TrophyIcon, CloseIcon, ChevronDownIcon } from "@/components/ui/icons";

export type SearchCategory = "all" | "pokemon" | "tournament" | "creator";

interface ExploreFiltersProps {
  query: string;
  onQueryChange: (q: string) => void;
  sort: "newest" | "updated" | "popular" | "views";
  onSortChange: (s: "newest" | "updated" | "popular" | "views") => void;
  searchCategory: SearchCategory;
  onSearchCategoryChange: (c: SearchCategory) => void;
  regulation: string;
  onRegulationChange: (r: string) => void;
  eventType: string;
  onEventTypeChange: (e: string) => void;
  archetype: string;
  onArchetypeChange: (a: string) => void;
  species: string;
  onSpeciesChange: (s: string) => void;
  excludeSpecies: string;
  onExcludeSpeciesChange: (s: string) => void;
  placement: string;
  onPlacementChange: (p: string) => void;
  followingOnly: boolean;
  onFollowingOnlyChange: (v: boolean) => void;
  tournamentMode: boolean;
  onTournamentModeChange: (v: boolean) => void;
  hasRental: boolean;
  onHasRentalChange: (v: boolean) => void;
}

const CATEGORY_ICONS: Record<SearchCategory, React.ReactNode> = {
  all: (
    <SearchIcon width="14" height="14" />
  ),
  pokemon: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="3" /><line x1="2" y1="12" x2="9" y2="12" /><line x1="15" y1="12" x2="22" y2="12" />
    </svg>
  ),
  tournament: (
    <TrophyIcon width="14" height="14" />
  ),
  creator: (
    <UserIcon width="14" height="14" />
  ),
};

const CATEGORY_KEYS: SearchCategory[] = ["all", "pokemon", "tournament", "creator"];
const SORT_KEYS = ["popular", "newest", "views", "updated"] as const;
const PLACEMENT_KEYS = ["1st", "Top 4", "Top 8", "Top 16"] as const;
export function ExploreFilters({
  query,
  onQueryChange,
  sort,
  onSortChange,
  searchCategory,
  onSearchCategoryChange,
  regulation,
  onRegulationChange,
  eventType,
  onEventTypeChange,
  archetype,
  onArchetypeChange,
  species,
  onSpeciesChange,
  excludeSpecies,
  onExcludeSpeciesChange,
  placement,
  onPlacementChange,
  followingOnly,
  onFollowingOnlyChange,
  tournamentMode,
  onTournamentModeChange,
  hasRental,
  onHasRentalChange,
}: ExploreFiltersProps) {
  const { t } = useTranslation();
  const { user } = useUser();
  const [localQuery, setLocalQuery] = useState(query);

  const catLabel: Record<string, string> = {
    all: t.filterCatAll,
    pokemon: t.filterCatPokemon,
    tournament: t.filterCatTournament,
    creator: t.filterCatCreator,
  };
  const sortLabel: Record<string, string> = {
    popular: t.filterSortPopular,
    newest: t.filterSortNewest,
    views: t.filterSortViews,
    updated: t.filterSortUpdated,
  };
  const placementLabel: Record<string, string> = {
    "1st": t.filterPlace1st,
    "Top 4": t.filterPlaceTop4,
    "Top 8": t.filterPlaceTop8,
    "Top 16": t.filterPlaceTop16,
  };
  const [moreOpen, setMoreOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const shouldReduceMotion = useReducedMotion();

  const advancedFilterCount = [
    species !== "",
    excludeSpecies !== "",
    eventType !== "",
    archetype !== "",
    followingOnly,
    tournamentMode,
    hasRental,
  ].filter(Boolean).length;

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onQueryChange(localQuery);
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [localQuery, onQueryChange]);

  useEffect(() => {
    setLocalQuery(query);
  }, [query]);

  const clearAll = () => {
    onSearchCategoryChange("all");
    onRegulationChange("");
    onEventTypeChange("");
    onArchetypeChange("");
    onSpeciesChange("");
    onExcludeSpeciesChange("");
    onPlacementChange("");
    onFollowingOnlyChange(false);
    onTournamentModeChange(false);
    onHasRentalChange(false);
    setLocalQuery("");
    onQueryChange("");
  };

  function handleTournamentToggle() {
    const next = !tournamentMode;
    onTournamentModeChange(next);
    if (next) {
      if (!placement) onPlacementChange("Top 8");
    } else {
      onPlacementChange("");
      onEventTypeChange("");
    }
  }

  // Active filter pills for the summary row
  const pills: { label: string; onClear: () => void; color?: string }[] = [];
  if (species) pills.push({ label: species, onClear: () => onSpeciesChange("") });
  if (excludeSpecies) pills.push({ label: `- ${excludeSpecies}`, onClear: () => onExcludeSpeciesChange(""), color: "red" });
  if (tournamentMode) pills.push({ label: "Tournament", onClear: () => { onTournamentModeChange(false); onPlacementChange(""); onEventTypeChange(""); } });
  if (eventType) pills.push({ label: eventType, onClear: () => onEventTypeChange("") });
  if (archetype) {
    archetype.split(",").filter(Boolean).forEach((a) => {
      pills.push({ label: a, onClear: () => {
        const next = archetype.split(",").filter(Boolean).filter(x => x !== a);
        onArchetypeChange(next.join(","));
      }});
    });
  }
  if (followingOnly) pills.push({ label: "Following", onClear: () => onFollowingOnlyChange(false) });
  if (hasRental) pills.push({ label: "Rental available", onClear: () => onHasRentalChange(false) });

  return (
    <div className="sticky top-12 sm:top-14 z-30 -mx-4 sm:-mx-6 px-4 sm:px-6 py-2.5 bg-background/80 backdrop-blur-lg border-b border-border/40 mb-4 sm:mb-6">

      {/* ------------------------------------------------------------------ */}
      {/* ROW 1: Search bar with category tabs integrated                    */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex items-center gap-2">
        {/* Search input */}
        <div className="relative flex-1 min-w-0">
          <SearchIcon
            width="15"
            height="15"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none"
          />
          <input
            type="text"
            value={localQuery}
            onChange={(e) => setLocalQuery(e.target.value)}
            aria-label="Search team reports"
            placeholder={
              searchCategory === "pokemon"
                ? "Search by Pokemon..."
                : searchCategory === "tournament"
                ? "Search tournaments..."
                : searchCategory === "creator"
                ? "Search creators..."
                : "Search teams, players, Pokémon..."
            }
            className="w-full min-h-11 pl-9 pr-11 py-2 bg-surface border border-border rounded-lg text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all"
          />
          {localQuery && (
            <button
              onClick={() => setLocalQuery("")}
              className="absolute right-0 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center rounded text-text-tertiary hover:text-text-primary active:text-text-primary transition-colors"
              aria-label="Clear search"
            >
              <CloseIcon width="12" height="12" strokeWidth="2.5" />
            </button>
          )}
        </div>

        {/* Sort dropdown */}
        <div className="relative flex-shrink-0">
          <select
            value={sort}
            onChange={(e) => onSortChange(e.target.value as "newest" | "updated" | "popular" | "views")}
            aria-label="Sort reports by"
            className="min-h-11 pl-3 pr-7 py-2 bg-surface border border-border rounded-lg text-xs font-semibold text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all appearance-none cursor-pointer"
          >
            {SORT_KEYS.map((key) => (
              <option key={key} value={key}>{sortLabel[key] ?? key}</option>
            ))}
          </select>
          <ChevronDownIcon width="12" height="12" strokeWidth="2.5" className="absolute right-2 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none" />
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* ROW 2: Search categories + inline quick filters                    */}
      {/* Wraps to multiple lines so every chip (including "Top 8" / "Top    */}
      {/* 16" at the end) stays clickable on desktop. Previously this row   */}
      {/* used overflow-x-auto and the right-most chips got cut off behind  */}
      {/* the container edge on wide screens with no obvious scroll UX.     */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex items-center gap-2 mt-2 -mx-4 px-4 overflow-x-auto scrollbar-none sm:mx-0 sm:px-0 sm:overflow-visible sm:flex-wrap" aria-label="Quick filters">
        {/* Search category chips */}
        {CATEGORY_KEYS.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => onSearchCategoryChange(key)}
            aria-label={`Filter by ${catLabel[key] ?? key}`}
            aria-pressed={searchCategory === key}
            className={`inline-flex min-h-11 items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-full flex-shrink-0 transition-all cursor-pointer active:scale-[0.97] whitespace-nowrap ${
              searchCategory === key
                ? "bg-accent text-white shadow-sm"
                : "bg-surface-alt/60 text-text-tertiary hover:text-text-secondary hover:bg-surface-alt"
            }`}
          >
            <span aria-hidden="true">{CATEGORY_ICONS[key]}</span>
            {catLabel[key] ?? key}
          </button>
        ))}

        {/* Divider */}
        <div className="w-px h-5 bg-border/60 flex-shrink-0 mx-0.5" />

        {/* Regulation quick-select chips */}
        {REGULATIONS.map((reg) => (
          <button
            key={reg}
            type="button"
            onClick={() => onRegulationChange(regulation === reg ? "" : reg)}
            className={`min-h-11 px-3 py-2 text-xs font-bold rounded-full flex-shrink-0 transition-all cursor-pointer active:scale-[0.97] whitespace-nowrap ${
              regulation === reg
                ? "bg-accent/15 text-accent ring-1 ring-accent/30"
                : "bg-surface-alt/40 text-text-tertiary hover:text-text-secondary hover:bg-surface-alt/70"
            }`}
          >
            {reg.replace("Reg ", "")}
          </button>
        ))}

        {/* Divider */}
        <div className="w-px h-5 bg-border/60 flex-shrink-0 mx-0.5" />

        {/* Placement quick-select chips */}
        {PLACEMENT_KEYS.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => onPlacementChange(placement === key ? "" : key)}
            className={`min-h-11 px-3 py-2 text-xs font-bold rounded-full flex-shrink-0 transition-all cursor-pointer active:scale-[0.97] whitespace-nowrap ${
              placement === key
                ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/30"
                : "bg-surface-alt/40 text-text-tertiary hover:text-text-secondary hover:bg-surface-alt/70"
            }`}
          >
            {placementLabel[key] ?? key}
          </button>
        ))}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* ROW 3: "More filters" toggle + active pills                        */}
      {/* Also wraps — active-filter pills would otherwise clip when several */}
      {/* are applied at once.                                               */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex items-center gap-2 mt-2 -mx-4 px-4 overflow-x-auto scrollbar-none sm:mx-0 sm:px-0 sm:overflow-visible sm:flex-wrap" aria-label="Active filters">
        {/* More filters toggle */}
        <button
          type="button"
          onClick={() => setMoreOpen(!moreOpen)}
          aria-expanded={moreOpen}
          className={`inline-flex min-h-11 items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-full flex-shrink-0 transition-all cursor-pointer active:scale-[0.97] ${
            moreOpen || advancedFilterCount > 0
              ? "bg-accent/10 text-accent ring-1 ring-accent/20"
              : "bg-surface-alt/40 text-text-tertiary hover:text-text-secondary"
          }`}
        >
          <ChevronDownIcon
            width="12"
            height="12"
            strokeWidth="2.5"
            className={`transition-transform ${moreOpen ? "rotate-180" : ""}`}
          />
          More filters
          {advancedFilterCount > 0 && (
            <span className="min-w-[16px] h-4 flex items-center justify-center bg-accent text-white text-[9px] font-bold rounded-full px-1">
              {advancedFilterCount}
            </span>
          )}
        </button>

        {/* Active filter pills */}
        {pills.map((pill, i) => (
          <button
            key={`${pill.label}-${i}`}
            type="button"
            onClick={pill.onClear}
            className={`inline-flex min-h-11 items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg flex-shrink-0 transition-all active:scale-[0.95] cursor-pointer ${
              pill.color === "red"
                ? "bg-red-500/10 text-red-500"
                : "bg-accent/10 text-accent"
            }`}
          >
            {pill.label}
            <CloseIcon width="8" height="8" strokeWidth="3" />
          </button>
        ))}

        {/* Clear all (when any filter active) */}
        {(pills.length > 0 || regulation || placement || searchCategory !== "all") && (
          <button
            type="button"
            onClick={clearAll}
            className="min-h-11 text-xs font-bold text-text-tertiary hover:text-text-primary flex-shrink-0 px-3 py-2 cursor-pointer transition-colors whitespace-nowrap"
          >
            Clear all
          </button>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* EXPANDABLE: Advanced filters panel (inline, not a drawer/modal)     */}
      {/* ------------------------------------------------------------------ */}
      <AnimatePresence>
        {moreOpen && (
          <motion.div
            initial={shouldReduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
            animate={shouldReduceMotion ? { opacity: 1 } : { height: "auto", opacity: 1 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={shouldReduceMotion ? { duration: 0.1 } : { duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="pt-3 pb-1 space-y-3">

              {/* Pokemon include/exclude chip pickers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <SpeciesChipPicker
                  id="filter-species"
                  label="Include Pokemon"
                  value={species}
                  onChange={onSpeciesChange}
                  placeholder="e.g. Flutter Mane, Incineroar"
                  variant="include"
                />
                <SpeciesChipPicker
                  id="filter-exclude"
                  label="Exclude Pokemon"
                  value={excludeSpecies}
                  onChange={onExcludeSpeciesChange}
                  placeholder="e.g. Urshifu, Calyrex"
                  variant="exclude"
                />
              </div>

              {/* Event type dropdown */}
              <div className="flex items-end gap-2.5">
                <div className="flex-1 min-w-0 max-w-[200px]">
                  <label htmlFor="filter-event" className={`text-[11px] font-bold uppercase tracking-wide mb-1 block ${eventType ? "text-accent" : "text-text-tertiary"}`}>
                    Event type
                  </label>
                  <div className="relative">
                    <select
                      id="filter-event"
                      value={eventType}
                      onChange={(e) => onEventTypeChange(e.target.value)}
                      className="w-full min-h-11 px-3 py-2 pr-7 bg-surface border border-border rounded-lg text-xs font-semibold text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/40 appearance-none cursor-pointer"
                    >
                      <option value="">Any</option>
                      {EVENT_TYPES.map((e) => <option key={e} value={e}>{e}</option>)}
                    </select>
                    <ChevronDownIcon width="10" height="10" strokeWidth="3" className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Archetype chips */}
              <div>
                <span className={`text-[11px] font-bold uppercase tracking-wide mb-1.5 block ${archetype ? "text-accent" : "text-text-tertiary"}`}>
                  Archetype
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {ARCHETYPES.map((a) => {
                    const active = archetype.split(",").filter(Boolean).includes(a);
                    return (
                      <button
                        key={a}
                        type="button"
                        onClick={() => {
                          const current = archetype.split(",").filter(Boolean);
                          const next = active ? current.filter((x) => x !== a) : [...current, a];
                          onArchetypeChange(next.join(","));
                        }}
                        className={`min-h-11 text-xs font-bold px-3 py-2 rounded-lg border transition-all cursor-pointer active:scale-[0.97] ${
                          active
                            ? "bg-accent text-white border-accent"
                            : "bg-surface-alt/50 text-text-tertiary border-transparent hover:text-text-secondary"
                        }`}
                      >
                        {active && <span aria-hidden="true" className="mr-0.5">&#10003; </span>}{a}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Toggle row: tournament + following */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleTournamentToggle}
                  aria-pressed={tournamentMode}
                  aria-label="Filter by tournament results"
                  className={`inline-flex min-h-11 items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer active:scale-[0.97] ${
                    tournamentMode
                      ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/30"
                      : "bg-surface-alt/50 text-text-secondary hover:text-text-primary"
                  }`}
                >
                  <TrophyIcon width="12" height="12" strokeWidth="2.5" aria-hidden="true" />
                  Tournament results
                </button>

                <button
                  type="button"
                  onClick={() => onHasRentalChange(!hasRental)}
                  aria-pressed={hasRental}
                  aria-label="Filter to teams with rental codes"
                  className={`inline-flex min-h-11 items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer active:scale-[0.97] ${
                    hasRental
                      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/30"
                      : "bg-surface-alt/50 text-text-secondary hover:text-text-primary"
                  }`}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="3" y="11" width="18" height="11" rx="2" />
                    <path d="M7 11V7a5 5 0 0110 0v4" />
                    <circle cx="12" cy="16" r="1.5" />
                  </svg>
                  Rental code
                </button>

                {!!user && (
                  <button
                    type="button"
                    onClick={() => onFollowingOnlyChange(!followingOnly)}
                    aria-pressed={followingOnly}
                    aria-label="Show reports from creators I follow"
                    className={`inline-flex min-h-11 items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer active:scale-[0.97] ${
                      followingOnly
                        ? "bg-accent text-white"
                        : "bg-surface-alt/50 text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><polyline points="16 11 18 13 22 9" />
                    </svg>
                    Following only
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* SpeciesChipPicker                                                          */
/* -------------------------------------------------------------------------- */
/* Chip-based input that stores its value as a comma-separated string so it   */
/* drops into the existing onSpeciesChange / onExcludeSpeciesChange API       */
/* without touching ExploreContent.tsx or the /api/explore route.             */

const MAX_CHIPS = 10;

interface SpeciesChipPickerProps {
  id: string;
  label: string;
  value: string; // comma-separated
  onChange: (next: string) => void;
  placeholder: string;
  variant: "include" | "exclude";
}

function parseChips(value: string): string[] {
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function serializeChips(chips: string[]): string {
  return chips.join(",");
}

function SpeciesChipPicker({
  id,
  label,
  value,
  onChange,
  placeholder,
  variant,
}: SpeciesChipPickerProps) {
  const [draft, setDraft] = useState("");
  const chips = parseChips(value);
  const atMax = chips.length >= MAX_CHIPS;

  const accentText = variant === "include" ? "text-accent" : "text-red-400";
  const chipClass =
    variant === "include"
      ? "bg-accent/10 text-accent ring-1 ring-accent/20"
      : "bg-red-500/10 text-red-500 ring-1 ring-red-500/20";
  const focusRing =
    variant === "include"
      ? "focus-within:ring-accent/40 focus-within:border-accent"
      : "focus-within:ring-red-400/40 focus-within:border-red-400";

  const commitTokens = (raw: string) => {
    const incoming = parseChips(raw);
    if (incoming.length === 0) return;
    const existing = new Set(chips.map((c) => c.toLowerCase()));
    const merged = [...chips];
    for (const tok of incoming) {
      if (merged.length >= MAX_CHIPS) break;
      const key = tok.toLowerCase();
      if (!existing.has(key)) {
        merged.push(tok);
        existing.add(key);
      }
    }
    onChange(serializeChips(merged));
    setDraft("");
  };

  const removeChip = (name: string) => {
    const next = chips.filter((c) => c !== name);
    onChange(serializeChips(next));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const trimmed = draft.trim();
      if (trimmed) commitTokens(trimmed);
    } else if (e.key === "Backspace" && draft === "" && chips.length > 0) {
      e.preventDefault();
      const next = chips.slice(0, -1);
      onChange(serializeChips(next));
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData("text");
    if (text.includes(",")) {
      e.preventDefault();
      commitTokens(text);
    }
  };

  const handleBlur = () => {
    const trimmed = draft.trim();
    if (trimmed) commitTokens(trimmed);
  };

  return (
    <div>
      <label
        htmlFor={id}
        className={`text-[11px] font-bold uppercase tracking-wide mb-1 block ${
          value ? accentText : "text-text-tertiary"
        }`}
      >
        {label}
      </label>
      <div
        className={`flex min-h-11 flex-wrap items-center gap-1 w-full px-2 py-1.5 bg-surface border border-border rounded-lg transition-all focus-within:outline-none focus-within:ring-2 ${focusRing}`}
      >
        {chips.map((chip) => (
          <button
            key={chip}
            type="button"
            onClick={() => removeChip(chip)}
            aria-label={`Remove ${chip}`}
            className={`inline-flex items-center gap-1 min-h-11 px-3 py-1 text-xs font-bold rounded-lg transition-all active:scale-[0.95] cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-surface ${
              variant === "include" ? "focus:ring-accent/50" : "focus:ring-red-400/50"
            } ${chipClass}`}
          >
            <span>{chip}</span>
            <CloseIcon
              width="8"
              height="8"
              strokeWidth="3"
              aria-hidden="true"
            />
          </button>
        ))}
        <input
          id={id}
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onBlur={handleBlur}
          disabled={atMax}
          placeholder={
            atMax
              ? `Max ${MAX_CHIPS} reached`
              : chips.length === 0
              ? placeholder
              : "Add another..."
          }
          aria-label={label}
          className="flex-1 min-w-[120px] min-h-11 bg-transparent border-0 px-1.5 py-2 text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none disabled:opacity-50"
        />
      </div>
    </div>
  );
}
