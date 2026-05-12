"use client";

import { useState, useEffect, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { useTranslation } from "@/lib/i18n";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ARCHETYPES, REGULATIONS, EVENT_TYPES } from "@/lib/data/tags";

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

const CATEGORIES: { value: SearchCategory; label: string; icon: React.ReactNode }[] = [
  {
    value: "all",
    label: "All",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    ),
  },
  {
    value: "pokemon",
    label: "Pokemon",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="3" /><line x1="2" y1="12" x2="9" y2="12" /><line x1="15" y1="12" x2="22" y2="12" />
      </svg>
    ),
  },
  {
    value: "tournament",
    label: "Tournament",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="6" y="2" width="12" height="10" rx="2" /><path d="M12 12v4" /><path d="M8 20h8" /><path d="M9 16h6" />
      </svg>
    ),
  },
  {
    value: "creator",
    label: "Creator",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
];

const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: "popular", label: "Popular" },
  { value: "newest", label: "Newest" },
  { value: "views", label: "Views" },
  { value: "updated", label: "Updated" },
];

const PLACEMENTS = [
  { value: "1st", label: "1st" },
  { value: "Top 4", label: "Top 4" },
  { value: "Top 8", label: "Top 8" },
  { value: "Top 16", label: "Top 16" },
];

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
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={localQuery}
            onChange={(e) => setLocalQuery(e.target.value)}
            placeholder={
              searchCategory === "pokemon"
                ? "Search by Pokemon..."
                : searchCategory === "tournament"
                ? "Search tournaments..."
                : searchCategory === "creator"
                ? "Search creators..."
                : "Search teams, players, Pokémon..."
            }
            className="w-full pl-9 pr-8 py-2 bg-surface border border-border rounded-lg text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all"
          />
          {localQuery && (
            <button
              onClick={() => setLocalQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded text-text-tertiary hover:text-text-primary transition-colors"
              aria-label="Clear search"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>

        {/* Sort dropdown */}
        <div className="relative flex-shrink-0">
          <select
            value={sort}
            onChange={(e) => onSortChange(e.target.value as "newest" | "updated" | "popular" | "views")}
            className="pl-3 pr-7 py-2 bg-surface border border-border rounded-lg text-xs font-semibold text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all appearance-none cursor-pointer"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="absolute right-2 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* ROW 2: Search categories + inline quick filters                    */}
      {/* Wraps to multiple lines so every chip (including "Top 8" / "Top    */}
      {/* 16" at the end) stays clickable on desktop. Previously this row   */}
      {/* used overflow-x-auto and the right-most chips got cut off behind  */}
      {/* the container edge on wide screens with no obvious scroll UX.     */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
        {/* Search category chips */}
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            type="button"
            onClick={() => onSearchCategoryChange(cat.value)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-full flex-shrink-0 transition-all cursor-pointer active:scale-[0.97] whitespace-nowrap ${
              searchCategory === cat.value
                ? "bg-accent text-white shadow-sm"
                : "bg-surface-alt/60 text-text-tertiary hover:text-text-secondary hover:bg-surface-alt"
            }`}
          >
            {cat.icon}
            {cat.label}
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
            className={`px-2.5 py-1.5 text-[11px] font-bold rounded-full flex-shrink-0 transition-all cursor-pointer active:scale-[0.97] whitespace-nowrap ${
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
        {PLACEMENTS.map((p) => (
          <button
            key={p.value}
            type="button"
            onClick={() => onPlacementChange(placement === p.value ? "" : p.value)}
            className={`px-2.5 py-1.5 text-[11px] font-bold rounded-full flex-shrink-0 transition-all cursor-pointer active:scale-[0.97] whitespace-nowrap ${
              placement === p.value
                ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/30"
                : "bg-surface-alt/40 text-text-tertiary hover:text-text-secondary hover:bg-surface-alt/70"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* ROW 3: "More filters" toggle + active pills                        */}
      {/* Also wraps — active-filter pills would otherwise clip when several */}
      {/* are applied at once.                                               */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
        {/* More filters toggle */}
        <button
          type="button"
          onClick={() => setMoreOpen(!moreOpen)}
          aria-expanded={moreOpen}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold rounded-full flex-shrink-0 transition-all cursor-pointer active:scale-[0.97] ${
            moreOpen || advancedFilterCount > 0
              ? "bg-accent/10 text-accent ring-1 ring-accent/20"
              : "bg-surface-alt/40 text-text-tertiary hover:text-text-secondary"
          }`}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`transition-transform ${moreOpen ? "rotate-180" : ""}`}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
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
            className={`inline-flex items-center gap-1 px-2 py-1 text-[10px] font-bold rounded-md flex-shrink-0 transition-all active:scale-[0.95] cursor-pointer ${
              pill.color === "red"
                ? "bg-red-500/10 text-red-500"
                : "bg-accent/10 text-accent"
            }`}
          >
            {pill.label}
            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        ))}

        {/* Clear all (when any filter active) */}
        {(pills.length > 0 || regulation || placement || searchCategory !== "all") && (
          <button
            type="button"
            onClick={clearAll}
            className="text-[10px] font-bold text-text-tertiary hover:text-text-primary flex-shrink-0 px-1.5 py-1 cursor-pointer transition-colors whitespace-nowrap"
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

              {/* Pokemon include/exclude inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label htmlFor="filter-species" className={`text-[11px] font-bold uppercase tracking-wide mb-1 block ${species ? "text-accent" : "text-text-tertiary"}`}>
                    Include Pokemon
                  </label>
                  <input
                    id="filter-species"
                    type="text"
                    value={species}
                    onChange={(e) => onSpeciesChange(e.target.value)}
                    placeholder="e.g. Flutter Mane, Incineroar"
                    className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all"
                  />
                </div>
                <div>
                  <label htmlFor="filter-exclude" className={`text-[11px] font-bold uppercase tracking-wide mb-1 block ${excludeSpecies ? "text-red-400" : "text-text-tertiary"}`}>
                    Exclude Pokemon
                  </label>
                  <input
                    id="filter-exclude"
                    type="text"
                    value={excludeSpecies}
                    onChange={(e) => onExcludeSpeciesChange(e.target.value)}
                    placeholder="e.g. Urshifu, Calyrex"
                    className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-red-400/40 focus:border-red-400 transition-all"
                  />
                </div>
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
                      className="w-full px-3 py-2 pr-7 bg-surface border border-border rounded-lg text-xs font-semibold text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/40 appearance-none cursor-pointer"
                    >
                      <option value="">Any</option>
                      {EVENT_TYPES.map((e) => <option key={e} value={e}>{e}</option>)}
                    </select>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none"><polyline points="6 9 12 15 18 9" /></svg>
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
                        className={`text-[10px] font-bold px-2.5 py-1.5 rounded-md border transition-all cursor-pointer active:scale-[0.97] ${
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
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleTournamentToggle}
                  aria-pressed={tournamentMode}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer active:scale-[0.97] ${
                    tournamentMode
                      ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/30"
                      : "bg-surface-alt/50 text-text-secondary hover:text-text-primary"
                  }`}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="6" y="2" width="12" height="10" rx="2" />
                    <path d="M12 12v4" /><path d="M8 20h8" /><path d="M9 16h6" />
                  </svg>
                  Tournament results
                </button>

                <button
                  type="button"
                  onClick={() => onHasRentalChange(!hasRental)}
                  aria-pressed={hasRental}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer active:scale-[0.97] ${
                    hasRental
                      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/30"
                      : "bg-surface-alt/50 text-text-secondary hover:text-text-primary"
                  }`}
                  title="Only show teams with a rental code"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer active:scale-[0.97] ${
                      followingOnly
                        ? "bg-accent text-white"
                        : "bg-surface-alt/50 text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
