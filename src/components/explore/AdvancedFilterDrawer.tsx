"use client";

import { useState, useEffect, useSyncExternalStore, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { ARCHETYPES, EVENT_TYPES, REGULATIONS } from "@/lib/data/tags";

interface AdvancedFilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  placement: string;
  onPlacementChange: (p: string) => void;
  eventType: string;
  onEventTypeChange: (e: string) => void;
  followingOnly: boolean;
  onFollowingOnlyChange: (v: boolean) => void;
  excludeSpecies: string;
  onExcludeSpeciesChange: (s: string) => void;
  isAuthenticated: boolean;
  species?: string;
  onSpeciesChange?: (s: string) => void;
  regulation?: string;
  onRegulationChange?: (r: string) => void;
  archetype?: string;
  onArchetypeChange?: (a: string) => void;
}

function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (callback) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", callback);
      return () => mql.removeEventListener("change", callback);
    },
    () => window.matchMedia(query).matches,
    () => false, // SSR fallback
  );
}

export function AdvancedFilterDrawer({
  isOpen,
  onClose,
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
}: AdvancedFilterDrawerProps) {
  const isDesktop = useMediaQuery("(min-width: 640px)");
  const shouldReduceMotion = useReducedMotion();
  const drawerRef = useRef<HTMLDivElement>(null);

  const advancedFilterCount = [
    placement !== "",
    eventType !== "",
    followingOnly,
    excludeSpecies !== "",
  ].filter(Boolean).length;

  // Focus first focusable element on open (mobile sheet)
  useEffect(() => {
    if (isOpen && !isDesktop && drawerRef.current) {
      const focusable = drawerRef.current.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (focusable) {
        setTimeout(() => focusable.focus(), 50);
      }
    }
  }, [isOpen, isDesktop]);

  // Escape key handler (both variants)
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  // Click-outside handler (desktop only)
  useEffect(() => {
    if (!isOpen || !isDesktop) return;
    const handler = (e: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    // Delay to avoid the click that opened the drawer from immediately closing it
    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handler);
    }, 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handler);
    };
  }, [isOpen, isDesktop, onClose]);

  const mobileEnter = shouldReduceMotion
    ? { opacity: 0 }
    : { y: "100%", opacity: 0 };
  const mobileAnimate = shouldReduceMotion
    ? { opacity: 1 }
    : { y: 0, opacity: 1 };
  const mobileExit = shouldReduceMotion
    ? { opacity: 0 }
    : { y: "100%", opacity: 0 };

  const desktopEnter = shouldReduceMotion
    ? { opacity: 0 }
    : { opacity: 0, scale: 0.96 };
  const desktopAnimate = shouldReduceMotion
    ? { opacity: 1 }
    : { opacity: 1, scale: 1 };
  const desktopExit = shouldReduceMotion
    ? { opacity: 0 }
    : { opacity: 0, scale: 0.96 };

  const filterContent = (
    <div className="p-4 sm:p-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Species filter — mobile only (shown inline on desktop) */}
        {onSpeciesChange && (
          <div className="sm:hidden sm:col-span-2">
            <label htmlFor="drawer-species" className={`text-[11px] font-bold uppercase tracking-wide mb-1 block ${species ? "text-accent" : "text-text-tertiary"}`}>
              Filter by Pokemon
            </label>
            <input
              id="drawer-species"
              type="text"
              value={species ?? ""}
              onChange={(e) => onSpeciesChange(e.target.value)}
              placeholder="e.g. Flutter Mane, Incineroar"
              className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-xs font-semibold text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent appearance-none"
            />
          </div>
        )}

        {/* Exclude species input */}
        <div className="sm:col-span-2">
          <label
            htmlFor="filter-exclude-species"
            className={`text-[11px] font-bold uppercase tracking-wide mb-1 block ${excludeSpecies !== "" ? "text-red-400" : "text-text-tertiary"}`}
          >
            Exclude Pokemon
          </label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-red-400">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </div>
            <input
              id="filter-exclude-species"
              type="text"
              value={excludeSpecies}
              onChange={(e) => onExcludeSpeciesChange(e.target.value)}
              placeholder="e.g. Flutter Mane, Urshifu"
              className="w-full pl-8 pr-3 py-2 bg-surface border border-border rounded-lg text-xs font-semibold text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-red-400/40 focus:border-red-400 appearance-none"
            />
          </div>
        </div>

        {/* Placement dropdown */}
        <div>
          <label
            htmlFor="filter-placement"
            className={`text-[11px] font-bold uppercase tracking-wide mb-1 block ${
              placement !== "" ? "text-accent" : "text-text-tertiary"
            }`}
          >
            Placement
          </label>
          <div className="relative">
            <select
              id="filter-placement"
              value={placement}
              onChange={(e) => onPlacementChange(e.target.value)}
              className="w-full px-3 py-2 pr-8 bg-surface border border-border rounded-lg text-xs font-semibold text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent appearance-none cursor-pointer"
            >
              <option value="">Any placement</option>
              <option value="1st">1st Place</option>
              <option value="Top 4">Top 4</option>
              <option value="Top 8">Top 8</option>
              <option value="Top 16">Top 16</option>
            </select>
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </div>

        {/* Event type dropdown */}
        <div>
          <label
            htmlFor="filter-event-type"
            className={`text-[11px] font-bold uppercase tracking-wide mb-1 block ${
              eventType !== "" ? "text-accent" : "text-text-tertiary"
            }`}
          >
            Event type
          </label>
          <div className="relative">
            <select
              id="filter-event-type"
              value={eventType}
              onChange={(e) => onEventTypeChange(e.target.value)}
              className="w-full px-3 py-2 pr-8 bg-surface border border-border rounded-lg text-xs font-semibold text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent appearance-none cursor-pointer"
            >
              <option value="">Any event</option>
              {EVENT_TYPES.map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </select>
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </div>

        {/* Regulation — mobile only */}
        {onRegulationChange && (
          <div className="sm:hidden">
            <label htmlFor="drawer-regulation" className={`text-[11px] font-bold uppercase tracking-wide mb-1 block ${regulation ? "text-accent" : "text-text-tertiary"}`}>
              Regulation
            </label>
            <div className="relative">
              <select
                id="drawer-regulation"
                value={regulation ?? ""}
                onChange={(e) => onRegulationChange(e.target.value)}
                className="w-full px-3 py-2 pr-8 bg-surface border border-border rounded-lg text-xs font-semibold text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent appearance-none cursor-pointer"
              >
                <option value="">Any regulation</option>
                {REGULATIONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
          </div>
        )}

        {/* Archetype — mobile only */}
        {onArchetypeChange && (
          <div className="sm:hidden sm:col-span-2">
            <span className={`text-[11px] font-bold uppercase tracking-wide mb-1.5 block ${archetype ? "text-accent" : "text-text-tertiary"}`}>
              Archetype
            </span>
            <div className="flex flex-wrap gap-1.5">
              {ARCHETYPES.map((a) => {
                const active = (archetype ?? "").split(",").filter(Boolean).includes(a);
                return (
                  <button
                    key={a}
                    type="button"
                    onClick={() => {
                      const current = (archetype ?? "").split(",").filter(Boolean);
                      const next = active ? current.filter((x) => x !== a) : [...current, a];
                      onArchetypeChange(next.join(","));
                    }}
                    className={`text-[10px] font-bold px-2.5 py-1.5 rounded-md border transition-all cursor-pointer min-h-[36px] ${
                      active
                        ? "bg-accent text-white border-accent"
                        : "bg-surface-alt/50 text-text-tertiary border-transparent hover:text-text-secondary"
                    }`}
                  >
                    {active && <span aria-hidden="true" className="mr-0.5">&#10003;</span>}{a}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Following toggle (authenticated only) */}
        {isAuthenticated && (
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wide text-text-tertiary mb-1 block">
              Following
            </span>
            <button
              type="button"
              onClick={() => onFollowingOnlyChange(!followingOnly)}
              aria-pressed={followingOnly}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer active:scale-[0.97] ${
                followingOnly
                  ? "bg-accent text-white shadow-sm shadow-accent/20 ring-2 ring-accent/30 ring-offset-1 ring-offset-background"
                  : "bg-surface-alt/50 text-text-secondary hover:text-text-primary hover:bg-surface-alt"
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
              >
                <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <polyline points="16 11 18 13 22 9" />
              </svg>
              Following only
            </button>
          </div>
        )}
      </div>

      {/* Clear advanced filters */}
      {advancedFilterCount > 0 && (
        <div className="mt-4">
          <button
            type="button"
            onClick={() => {
              onPlacementChange("");
              onEventTypeChange("");
              onFollowingOnlyChange(false);
              onExcludeSpeciesChange("");
            }}
            className="text-xs font-bold text-accent hover:text-accent/80 transition-colors cursor-pointer min-h-[44px] flex items-center"
          >
            Clear advanced filters
          </button>
        </div>
      )}
    </div>
  );

  if (!isDesktop) {
    // Mobile: bottom sheet with backdrop
    return (
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={
                shouldReduceMotion
                  ? { duration: 0.1 }
                  : { duration: 0.2, ease: "easeOut" }
              }
              onClick={onClose}
              aria-label="Close advanced filters"
            />
            {/* Sheet */}
            <motion.div
              ref={drawerRef}
              role="dialog"
              aria-modal="true"
              aria-label="Advanced filters"
              id="advanced-filter-drawer"
              className="fixed bottom-0 left-0 right-0 z-50 bg-background rounded-t-2xl max-h-[85dvh] overflow-y-auto scrollbar-none"
              initial={mobileEnter}
              animate={mobileAnimate}
              exit={mobileExit}
              transition={
                shouldReduceMotion
                  ? { duration: 0.1 }
                  : { duration: 0.35, ease: [0.32, 0.72, 0, 1] }
              }
            >
              {/* Drag handle */}
              <div className="w-8 h-1 bg-border rounded-full mx-auto mt-3 mb-4" />

              {/* Header */}
              <div className="flex items-center justify-between px-4 pb-2">
                <span className="text-sm font-bold text-text-primary">
                  Advanced filters
                </span>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close advanced filters"
                  className="w-[44px] h-[44px] flex items-center justify-center rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-alt transition-colors"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              {filterContent}

              {/* Safe area footer */}
              <div className="pb-[env(safe-area-inset-bottom,0px)]" />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );
  }

  // Desktop: dropdown panel
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={drawerRef}
          role="region"
          aria-label="Advanced filters"
          id="advanced-filter-drawer"
          className="absolute top-full left-0 right-0 mt-1 bg-background/95 backdrop-blur-lg border border-border rounded-xl shadow-lg z-50"
          initial={desktopEnter}
          animate={desktopAnimate}
          exit={desktopExit}
          transition={
            shouldReduceMotion
              ? { duration: 0.1 }
              : { duration: 0.2, ease: [0.16, 1, 0.3, 1] }
          }
        >
          {filterContent}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
