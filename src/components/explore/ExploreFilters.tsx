"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslation } from "@/lib/i18n";
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
  placement: string;
  onPlacementChange: (p: string) => void;
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
  placement,
  onPlacementChange,
}: ExploreFiltersProps) {
  const { t } = useTranslation();
  const [localQuery, setLocalQuery] = useState(query);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

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
    <div className="sticky top-14 z-30 -mx-4 sm:-mx-6 px-4 sm:px-6 py-3 bg-background/80 backdrop-blur-lg border-b border-border/50 mb-6 space-y-3">
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

      {/* Species + placement filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <div className="relative flex-1">
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
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
        <div className="relative sm:w-36">
          <select
            value={placement}
            onChange={(e) => onPlacementChange(e.target.value)}
            className="w-full px-3 py-2 pr-8 bg-surface border border-border rounded-lg text-xs font-semibold text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all appearance-none cursor-pointer"
          >
            <option value="">Placement</option>
            <option value="1st">1st Place</option>
            <option value="Top 4">Top 4</option>
            <option value="Top 8">Top 8</option>
            <option value="Top 16">Top 16</option>
          </select>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>

      {/* Tag filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <div className="flex gap-2">
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
          <div className="relative">
            <select
              value={eventType}
              onChange={(e) => onEventTypeChange(e.target.value)}
              className="w-full px-3 py-2 pr-8 bg-surface border border-border rounded-lg text-xs font-semibold text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all appearance-none cursor-pointer"
            >
              <option value="">Event Type</option>
              {EVENT_TYPES.map((e) => <option key={e} value={e}>{e}</option>)}
            </select>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
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
    </div>
  );
}
