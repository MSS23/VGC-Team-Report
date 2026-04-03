"use client";

import { useState, useEffect, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { useTranslation } from "@/lib/i18n";
import { ARCHETYPES, REGULATIONS } from "@/lib/data/tags";
import { AnimatePresence, motion } from "motion/react";
import { AdvancedFilterDrawer } from "./AdvancedFilterDrawer";

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
}

const CATEGORIES: { value: SearchCategory; label: string; icon: React.ReactNode }[] = [
  {
    value: "all",
    label: "All",
    icon: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    ),
  },
  {
    value: "pokemon",
    label: "Pokemon",
    icon: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="3" />
        <line x1="2" y1="12" x2="9" y2="12" />
        <line x1="15" y1="12" x2="22" y2="12" />
      </svg>
    ),
  },
  {
    value: "tournament",
    label: "Tournament",
    icon: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 9H4.5a2.5 2.5 0 010-5H6" />
        <path d="M18 9h1.5a2.5 2.5 0 000-5H18" />
        <path d="M4 22h16" />
        <path d="M10 22V2h4v20" />
      </svg>
    ),
  },
  {
    value: "creator",
    label: "Creator",
    icon: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
];

const PLACEHOLDERS: Record<SearchCategory, string> = {
  all: "Search by Pokemon, tournament, or creator...",
  pokemon: "Search by Pokemon name (e.g. Flutter Mane, Incineroar)...",
  tournament: "Search by tournament name (e.g. EUIC, Worlds)...",
  creator: "Search by creator name...",
};

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
}: ExploreFiltersProps) {
  const { t } = useTranslation();
  const { user } = useUser();
  const [localQuery, setLocalQuery] = useState(query);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const hasActiveFilters =
    query !== "" ||
    sort !== "newest" ||
    searchCategory !== "all" ||
    regulation !== "" ||
    eventType !== "" ||
    archetype !== "" ||
    species !== "" ||
    excludeSpecies !== "" ||
    placement !== "" ||
    followingOnly ||
    tournamentMode;

  function handleCopyLink() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const advancedFilterCount = [
    placement !== "",
    eventType !== "",
    followingOnly,
    excludeSpecies !== "",
    tournamentMode,
  ].filter(Boolean).length;

  function handleTournamentToggle() {
    const next = !tournamentMode;
    onTournamentModeChange(next);
    if (next) {
      if (!placement) onPlacementChange("Top 8");
      setDrawerOpen(true);
    } else {
      onPlacementChange("");
      onEventTypeChange("");
    }
  }

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onQueryChange(localQuery);
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [localQuery, onQueryChange]);

  // Sync external changes
  useEffect(() => {
    setLocalQuery(query);
  }, [query]);

  return (
    <div className={`sticky top-14 z-30 -mx-4 sm:-mx-6 px-4 sm:px-6 py-3 bg-background/80 backdrop-blur-lg border-b border-border/50 mb-6 space-y-3 relative${tournamentMode ? " border-t-2 border-t-amber-500/50" : ""}`}>
      {/* Search category tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            type="button"
            onClick={() => onSearchCategoryChange(cat.value)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap cursor-pointer active:scale-[0.97] ${
              searchCategory === cat.value
                ? "bg-accent text-white shadow-sm shadow-accent/20 ring-2 ring-accent/30 ring-offset-1 ring-offset-background"
                : "bg-surface-alt/50 text-text-secondary hover:text-text-primary hover:bg-surface-alt"
            }`}
          >
            {cat.icon}
            {cat.label}
          </button>
        ))}

        {/* Tournament Results toggle */}
        <button
          type="button"
          onClick={handleTournamentToggle}
          aria-pressed={tournamentMode}
          className={`inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[44px] text-xs font-bold rounded-lg transition-all whitespace-nowrap cursor-pointer active:scale-[0.97] ${
            tournamentMode
              ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 ring-2 ring-amber-500/30 ring-offset-1 ring-offset-background font-bold"
              : "bg-surface-alt/50 text-text-secondary hover:text-text-primary hover:bg-surface-alt"
          }`}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 9H4a2 2 0 01-2-2V4h4" />
            <path d="M18 9h2a2 2 0 002-2V4h-4" />
            <rect x="6" y="2" width="12" height="10" rx="2" />
            <path d="M12 12v4" />
            <path d="M8 20h8" />
            <path d="M9 16h6" />
          </svg>
          <span className="hidden sm:inline">Tournament</span>
        </button>

        {/* More filters button */}
        <button
          type="button"
          onClick={() => setDrawerOpen(!drawerOpen)}
          aria-expanded={drawerOpen}
          aria-controls="advanced-filter-drawer"
          className={`relative inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap cursor-pointer active:scale-[0.97] ${
            drawerOpen
              ? "bg-surface-alt text-text-primary ring-2 ring-accent/30 ring-offset-1 ring-offset-background"
              : "bg-surface-alt/50 text-text-secondary hover:text-text-primary hover:bg-surface-alt"
          }`}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="4" y1="21" x2="4" y2="14" />
            <line x1="4" y1="10" x2="4" y2="3" />
            <line x1="12" y1="21" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12" y2="3" />
            <line x1="20" y1="21" x2="20" y2="16" />
            <line x1="20" y1="12" x2="20" y2="3" />
            <line x1="1" y1="14" x2="7" y2="14" />
            <line x1="9" y1="8" x2="15" y2="8" />
            <line x1="17" y1="16" x2="23" y2="16" />
          </svg>
          More filters
          <AnimatePresence>
            {advancedFilterCount > 0 && (
              <motion.span
                key="badge"
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.6, opacity: 0 }}
                transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] flex items-center justify-center bg-accent text-white text-[10px] font-bold rounded-full"
              >
                {advancedFilterCount}
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        {/* Copy link button — only when filters are active */}
        <AnimatePresence>
          {hasActiveFilters && (
            <motion.button
              key="copy-link"
              type="button"
              onClick={handleCopyLink}
              aria-label="Copy shareable link to clipboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="ml-auto inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg whitespace-nowrap cursor-pointer active:scale-[0.97] transition-all bg-accent/10 text-accent hover:bg-accent/20"
            >
              {copied ? (
                <>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
                    <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
                  </svg>
                  Copy link
                </>
              )}
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <svg
            width="16"
            height="16"
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
            placeholder={PLACEHOLDERS[searchCategory]}
            className="w-full pl-10 pr-4 py-2.5 bg-surface border border-border rounded-xl text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all"
          />
          {localQuery && (
            <button
              onClick={() => setLocalQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-alt transition-colors"
              aria-label="Clear search"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>

        {/* Sort */}
        <div className="relative sm:w-48">
          <select
            value={sort}
            onChange={(e) => onSortChange(e.target.value as "newest" | "updated" | "popular" | "views")}
            className="w-full px-4 py-2.5 pr-9 bg-surface border border-border rounded-xl text-sm font-semibold text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all appearance-none cursor-pointer"
          >
            <option value="newest">{t.sortNewest}</option>
            <option value="popular">Most Liked</option>
            <option value="views">Most Viewed</option>
            <option value="updated">{t.sortUpdated}</option>
          </select>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>

      {/* Species filter */}
      <div className="relative">
        <input
          type="text"
          value={species}
          onChange={(e) => onSpeciesChange(e.target.value)}
          placeholder="Filter by Pokemon (comma-separated, e.g. Flutter Mane, Incineroar)"
          className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all"
        />
        {species && (
          <button
            onClick={() => onSpeciesChange("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded text-text-tertiary hover:text-text-primary transition-colors"
            aria-label="Clear species filter"
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      {/* Exclude species filter */}
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-red-400">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        </div>
        <input
          type="text"
          value={excludeSpecies}
          onChange={(e) => onExcludeSpeciesChange(e.target.value)}
          placeholder="Exclude Pokemon (e.g. Flutter Mane, Urshifu)"
          className="w-full pl-8 pr-8 py-2 bg-surface border border-border rounded-lg text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-red-400/40 focus:border-red-400 transition-all"
        />
        {excludeSpecies && (
          <button
            onClick={() => onExcludeSpeciesChange("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded text-text-tertiary hover:text-text-primary transition-colors"
            aria-label="Clear exclude species filter"
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      {/* Tag filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <div className="relative">
          <select
            value={regulation}
            onChange={(e) => onRegulationChange(e.target.value)}
            className="w-full px-3 py-2 pr-8 bg-surface border border-border rounded-lg text-xs font-semibold text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all appearance-none cursor-pointer"
          >
            <option value="">Regulation</option>
            {REGULATIONS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
        <div className="flex flex-wrap gap-1">
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
                className={`text-[10px] font-bold px-2 py-1 rounded-md border transition-all cursor-pointer ${
                  active
                    ? "bg-accent text-white border-accent ring-1 ring-accent/30 ring-offset-1 ring-offset-background"
                    : "bg-surface-alt/50 text-text-tertiary border-transparent hover:text-text-secondary"
                }`}
              >
                {active && <span aria-hidden="true" className="mr-0.5">&#10003;</span>}{a}
              </button>
            );
          })}
        </div>
      </div>

      {/* Advanced filter drawer */}
      <AdvancedFilterDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        placement={placement}
        onPlacementChange={onPlacementChange}
        eventType={eventType}
        onEventTypeChange={onEventTypeChange}
        followingOnly={followingOnly}
        onFollowingOnlyChange={onFollowingOnlyChange}
        excludeSpecies={excludeSpecies}
        onExcludeSpeciesChange={onExcludeSpeciesChange}
        isAuthenticated={!!user}
      />
    </div>
  );
}
