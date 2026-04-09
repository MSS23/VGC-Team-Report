"use client";

import { useState, useEffect, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { useTranslation } from "@/lib/i18n";
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
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const activeFilterCount = [
    searchCategory !== "all",
    regulation !== "",
    eventType !== "",
    archetype !== "",
    species !== "",
    excludeSpecies !== "",
    placement !== "",
    followingOnly,
    tournamentMode,
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
    setLocalQuery("");
    onQueryChange("");
  };

  // Active filter pills data
  const pills: { label: string; onClear: () => void; color?: string }[] = [];
  if (searchCategory !== "all") pills.push({ label: searchCategory.charAt(0).toUpperCase() + searchCategory.slice(1), onClear: () => onSearchCategoryChange("all") });
  if (regulation) pills.push({ label: regulation, onClear: () => onRegulationChange("") });
  if (tournamentMode) pills.push({ label: "Tournament", onClear: () => { onTournamentModeChange(false); onPlacementChange(""); onEventTypeChange(""); } });
  if (placement && !tournamentMode) pills.push({ label: placement, onClear: () => onPlacementChange("") });
  if (eventType) pills.push({ label: eventType, onClear: () => onEventTypeChange("") });
  if (species) pills.push({ label: species, onClear: () => onSpeciesChange("") });
  if (excludeSpecies) pills.push({ label: `- ${excludeSpecies}`, onClear: () => onExcludeSpeciesChange(""), color: "red" });
  if (archetype) {
    archetype.split(",").filter(Boolean).forEach((a) => {
      pills.push({ label: a, onClear: () => {
        const next = archetype.split(",").filter(Boolean).filter(x => x !== a);
        onArchetypeChange(next.join(","));
      }});
    });
  }
  if (followingOnly) pills.push({ label: "Following", onClear: () => onFollowingOnlyChange(false) });

  return (
    <div className="sticky top-12 sm:top-14 z-30 -mx-4 sm:-mx-6 px-4 sm:px-6 py-2.5 bg-background/80 backdrop-blur-lg border-b border-border/40 mb-4 sm:mb-6 space-y-2">
      {/* Single row: search + sort + filters */}
      <div className="flex items-center gap-2">
        {/* Search */}
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
            placeholder="Search teams..."
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

        {/* Sort */}
        <div className="relative flex-shrink-0">
          <select
            value={sort}
            onChange={(e) => onSortChange(e.target.value as "newest" | "updated" | "popular" | "views")}
            className="pl-3 pr-7 py-2 bg-surface border border-border rounded-lg text-xs font-semibold text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all appearance-none cursor-pointer"
          >
            <option value="popular">Popular</option>
            <option value="newest">{t.sortNewest}</option>
            <option value="views">Views</option>
            <option value="updated">{t.sortUpdated}</option>
          </select>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="absolute right-2 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>

        {/* Filters button */}
        <button
          type="button"
          onClick={() => setDrawerOpen(!drawerOpen)}
          aria-expanded={drawerOpen}
          className={`relative flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer active:scale-[0.97] ${
            drawerOpen || activeFilterCount > 0
              ? "bg-accent/10 text-accent border border-accent/30"
              : "bg-surface border border-border text-text-secondary hover:text-text-primary hover:bg-surface-alt"
          }`}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
          <span className="hidden sm:inline">Filters</span>
          <AnimatePresence>
            {activeFilterCount > 0 && (
              <motion.span
                key="badge"
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.6, opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 flex items-center justify-center bg-accent text-white text-[9px] font-bold rounded-full px-1"
              >
                {activeFilterCount}
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>

      {/* Active filter pills */}
      {pills.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
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
          <button
            type="button"
            onClick={clearAll}
            className="text-[10px] font-bold text-text-tertiary hover:text-text-primary flex-shrink-0 px-1.5 py-1 cursor-pointer transition-colors"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Advanced filter drawer */}
      <AdvancedFilterDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        searchCategory={searchCategory}
        onSearchCategoryChange={onSearchCategoryChange}
        placement={placement}
        onPlacementChange={onPlacementChange}
        eventType={eventType}
        onEventTypeChange={onEventTypeChange}
        followingOnly={followingOnly}
        onFollowingOnlyChange={onFollowingOnlyChange}
        excludeSpecies={excludeSpecies}
        onExcludeSpeciesChange={onExcludeSpeciesChange}
        isAuthenticated={!!user}
        species={species}
        onSpeciesChange={onSpeciesChange}
        regulation={regulation}
        onRegulationChange={onRegulationChange}
        archetype={archetype}
        onArchetypeChange={onArchetypeChange}
        tournamentMode={tournamentMode}
        onTournamentModeChange={onTournamentModeChange}
      />
    </div>
  );
}
