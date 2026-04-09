"use client";

import { useState, useEffect, useSyncExternalStore, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { ARCHETYPES, EVENT_TYPES, REGULATIONS } from "@/lib/data/tags";
import type { SearchCategory } from "./ExploreFilters";

interface AdvancedFilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  searchCategory: SearchCategory;
  onSearchCategoryChange: (c: SearchCategory) => void;
  placement: string;
  onPlacementChange: (p: string) => void;
  eventType: string;
  onEventTypeChange: (e: string) => void;
  followingOnly: boolean;
  onFollowingOnlyChange: (v: boolean) => void;
  excludeSpecies: string;
  onExcludeSpeciesChange: (s: string) => void;
  isAuthenticated: boolean;
  species: string;
  onSpeciesChange: (s: string) => void;
  regulation: string;
  onRegulationChange: (r: string) => void;
  archetype: string;
  onArchetypeChange: (a: string) => void;
  tournamentMode: boolean;
  onTournamentModeChange: (v: boolean) => void;
}

function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (callback) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", callback);
      return () => mql.removeEventListener("change", callback);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

const CATEGORIES: { value: SearchCategory; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pokemon", label: "Pokemon" },
  { value: "tournament", label: "Tournament" },
  { value: "creator", label: "Creator" },
];

export function AdvancedFilterDrawer({
  isOpen,
  onClose,
  searchCategory,
  onSearchCategoryChange,
  placement,
  onPlacementChange,
  eventType,
  onEventTypeChange,
  followingOnly,
  onFollowingOnlyChange,
  excludeSpecies,
  onExcludeSpeciesChange,
  isAuthenticated,
  species,
  onSpeciesChange,
  regulation,
  onRegulationChange,
  archetype,
  onArchetypeChange,
  tournamentMode,
  onTournamentModeChange,
}: AdvancedFilterDrawerProps) {
  const isDesktop = useMediaQuery("(min-width: 640px)");
  const shouldReduceMotion = useReducedMotion();
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && !isDesktop && drawerRef.current) {
      const focusable = drawerRef.current.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (focusable) setTimeout(() => focusable.focus(), 50);
    }
  }, [isOpen, isDesktop]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen || !isDesktop) return;
    const handler = (e: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) onClose();
    };
    const timer = setTimeout(() => document.addEventListener("mousedown", handler), 0);
    return () => { clearTimeout(timer); document.removeEventListener("mousedown", handler); };
  }, [isOpen, isDesktop, onClose]);

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

  const filterContent = (
    <div className="p-4 space-y-4">
      {/* Search category */}
      <div>
        <span className="text-[11px] font-bold uppercase tracking-wide text-text-tertiary mb-1.5 block">Search in</span>
        <div className="flex gap-1.5">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              type="button"
              onClick={() => onSearchCategoryChange(cat.value)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer active:scale-[0.97] ${
                searchCategory === cat.value
                  ? "bg-accent text-white"
                  : "bg-surface-alt/60 text-text-tertiary hover:text-text-secondary"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Pokemon filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
            className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
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
            className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-red-400/40 focus:border-red-400"
          />
        </div>
      </div>

      {/* Regulation + event type + placement */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div>
          <label htmlFor="filter-regulation" className={`text-[11px] font-bold uppercase tracking-wide mb-1 block ${regulation ? "text-accent" : "text-text-tertiary"}`}>
            Regulation
          </label>
          <div className="relative">
            <select
              id="filter-regulation"
              value={regulation}
              onChange={(e) => onRegulationChange(e.target.value)}
              className="w-full px-3 py-2 pr-7 bg-surface border border-border rounded-lg text-xs font-semibold text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/40 appearance-none cursor-pointer"
            >
              <option value="">Any</option>
              {REGULATIONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none"><polyline points="6 9 12 15 18 9" /></svg>
          </div>
        </div>
        <div>
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
        <div>
          <label htmlFor="filter-placement" className={`text-[11px] font-bold uppercase tracking-wide mb-1 block ${placement ? "text-accent" : "text-text-tertiary"}`}>
            Placement
          </label>
          <div className="relative">
            <select
              id="filter-placement"
              value={placement}
              onChange={(e) => onPlacementChange(e.target.value)}
              className="w-full px-3 py-2 pr-7 bg-surface border border-border rounded-lg text-xs font-semibold text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/40 appearance-none cursor-pointer"
            >
              <option value="">Any</option>
              <option value="1st">1st Place</option>
              <option value="Top 4">Top 4</option>
              <option value="Top 8">Top 8</option>
              <option value="Top 16">Top 16</option>
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
                className={`text-[10px] font-bold px-2.5 py-1.5 rounded-md border transition-all cursor-pointer ${
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

        {isAuthenticated && (
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
  );

  if (!isDesktop) {
    return (
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={shouldReduceMotion ? { duration: 0.1 } : { duration: 0.2, ease: "easeOut" }}
              onClick={onClose}
              aria-label="Close filters"
            />
            <motion.div
              ref={drawerRef}
              role="dialog"
              aria-modal="true"
              aria-label="Filters"
              className="fixed bottom-0 left-0 right-0 z-50 bg-background rounded-t-2xl max-h-[85dvh] overflow-y-auto scrollbar-none"
              initial={shouldReduceMotion ? { opacity: 0 } : { y: "100%", opacity: 0 }}
              animate={shouldReduceMotion ? { opacity: 1 } : { y: 0, opacity: 1 }}
              exit={shouldReduceMotion ? { opacity: 0 } : { y: "100%", opacity: 0 }}
              transition={shouldReduceMotion ? { duration: 0.1 } : { duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
            >
              <div className="w-8 h-1 bg-border rounded-full mx-auto mt-3 mb-3" />
              <div className="flex items-center justify-between px-4 pb-1">
                <span className="text-sm font-bold text-text-primary">Filters</span>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close filters"
                  className="w-10 h-10 flex items-center justify-center rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-alt transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
              {filterContent}
              <div className="pb-[env(safe-area-inset-bottom,0px)]" />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={drawerRef}
          role="region"
          aria-label="Filters"
          className="absolute top-full left-0 right-0 mt-1 bg-background/95 backdrop-blur-lg border border-border rounded-xl shadow-lg z-50"
          initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.97 }}
          animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
          exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.97 }}
          transition={shouldReduceMotion ? { duration: 0.1 } : { duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          {filterContent}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
