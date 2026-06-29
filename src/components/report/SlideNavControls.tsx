"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useTranslation } from "@/lib/i18n";
import { hapticLight } from "@/lib/utils/haptics";

/**
 * Physical slide keys that describe the team as a whole (speed tiers +
 * coverage). They fold under the "Team" section tab rather than getting
 * their own — keeps the bottom nav to a clean three tabs.
 */
const COVERAGE_KEYS = ["speed-tiers", "offensive-coverage", "defensive-coverage"];

type Section = "overview" | "modes" | "team" | "matchups";

interface SlideNavControlsProps {
  currentSlide: number;
  totalSlides: number;
  isFirst: boolean;
  isLast: boolean;
  onPrev: () => void;
  onNext: () => void;
  /** Jump to a LOGICAL index into visibleIndices. goToSlide clamps the range. */
  onGoTo: (index: number) => void;
  /** Labels for the currently-visible slides, index-aligned with currentSlide. */
  slideLabels: string[];
  autoHide?: boolean;
  hiddenStates?: boolean[];
  onToggleHide?: () => void;
  isCurrentHidden?: boolean;
  onShowShortcuts?: () => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  changedSlides?: Set<number>;
  /** Physical indices currently shown (slides.visibleIndices). */
  visibleIndices: number[];
  /** Full physical key list (slides.allSlideKeys) — key-based jumps survive reordering. */
  allSlideKeys: string[];
  /**
   * Optional Base/Mega display toggle. When present, the bottom-nav overflow
   * sheet hosts it so shared (/s/) views never need the old floating pill.
   */
  displayToggle?: {
    hasMega: boolean;
    mode: "base" | "mega";
    onChange: (mode: "base" | "mega") => void;
  };
}

export function SlideNavControls({
  currentSlide,
  totalSlides,
  isFirst,
  isLast,
  onPrev,
  onNext,
  onGoTo,
  slideLabels,
  autoHide = false,
  hiddenStates,
  onToggleHide,
  isCurrentHidden = false,
  onShowShortcuts,
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
  changedSlides,
  visibleIndices,
  allSlideKeys,
  displayToggle,
}: SlideNavControlsProps) {
  const { t } = useTranslation();
  const [sheetOpen, setSheetOpen] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const hiddenCount = hiddenStates?.filter(Boolean).length ?? 0;

  // ── Section model (key-based so it survives any physical reordering) ──
  const { overviewPhys, modesPhys, firstPokemonPhys, firstMatchupPhys } = useMemo(() => {
    const ov = allSlideKeys.indexOf("overview");
    const modes = allSlideKeys.indexOf("common-modes");
    const poke = allSlideKeys.findIndex(
      (k, i) =>
        i > 0 &&
        k !== "common-modes" &&
        !COVERAGE_KEYS.includes(k) &&
        !k.startsWith("matchup-"),
    );
    // "matchup-sheet" also starts with "matchup-", so this resolves to the
    // first matchup PLAN, or the summary sheet when there are no plans.
    const match = allSlideKeys.findIndex((k) => k.startsWith("matchup-"));
    return { overviewPhys: ov, modesPhys: modes, firstPokemonPhys: poke, firstMatchupPhys: match };
  }, [allSlideKeys]);

  const sectionOf = useMemo(() => {
    return (physIdx: number): Section => {
      const k = allSlideKeys[physIdx] ?? "";
      if (physIdx === 0 || k === "overview") return "overview";
      if (k === "common-modes") return "modes";
      if (k.startsWith("matchup-")) return "matchups";
      return "team";
    };
  }, [allSlideKeys]);

  const overviewAvail = overviewPhys >= 0 && visibleIndices.indexOf(overviewPhys) >= 0;
  const modesAvail = modesPhys >= 0 && visibleIndices.indexOf(modesPhys) >= 0;
  const teamAvail = firstPokemonPhys >= 0 && visibleIndices.indexOf(firstPokemonPhys) >= 0;
  const matchupsAvail = firstMatchupPhys >= 0 && visibleIndices.indexOf(firstMatchupPhys) >= 0;

  const phys = visibleIndices[currentSlide] ?? 0;
  const activeSection = sectionOf(phys);

  // Position of the current slide within its section (for the progress fill
  // and the "n/N" sub-label).
  const { secFirst, secTotal } = useMemo(() => {
    let first = -1;
    let count = 0;
    for (let v = 0; v < visibleIndices.length; v++) {
      if (sectionOf(visibleIndices[v]) === activeSection) {
        if (first === -1) first = v;
        count++;
      }
    }
    return { secFirst: first, secTotal: count };
  }, [visibleIndices, activeSection, sectionOf]);

  const sectionPos = secFirst >= 0 ? currentSlide - secFirst : 0; // 0-based
  const sectionProgress = secTotal <= 1 ? 1 : sectionPos / (secTotal - 1);

  const jumpToPhysical = (physIdx: number) => {
    if (physIdx < 0) return;
    const v = visibleIndices.indexOf(physIdx);
    if (v < 0) return; // section currently hidden — no-op
    hapticLight();
    onGoTo(v);
  };

  const tabs: { key: Section; label: string; avail: boolean; target: number }[] = [
    { key: "overview", label: t.overview, avail: overviewAvail, target: overviewPhys },
    { key: "modes", label: "Modes", avail: modesAvail, target: modesPhys },
    { key: "team", label: "Team", avail: teamAvail, target: firstPokemonPhys },
    { key: "matchups", label: t.matchupsLabel, avail: matchupsAvail, target: firstMatchupPhys },
  ];

  // ── Overflow availability ──
  const hasCreatorTools = !!onToggleHide;
  const hasDisplay = !!displayToggle?.hasMega;
  const hasSheetMobile = hasCreatorTools || hasDisplay;
  const hasSheetDesktop = hasSheetMobile || !!onShowShortcuts;
  const showOverflow = hasSheetMobile || hasSheetDesktop;

  // Overflow sheet: Escape to close, Tab focus-trap, restore focus on close.
  // Mirrors the pattern used in OTSSheetModal / ShareModal so dialog behaviour
  // stays consistent across the report viewer.
  useEffect(() => {
    if (!sheetOpen) return;
    const sheet = sheetRef.current;
    // Remember whoever was focused (typically the overflow trigger) so we can
    // restore focus to it when the sheet closes.
    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;

    const focusableSelectors =
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

    // Move focus into the sheet so screen-reader / keyboard users land inside.
    if (sheet) {
      const firstFocusable = sheet.querySelector<HTMLElement>(focusableSelectors);
      firstFocusable?.focus();
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSheetOpen(false);
        return;
      }
      if (e.key !== "Tab" || !sheet) return;
      const focusable = Array.from(
        sheet.querySelectorAll<HTMLElement>(focusableSelectors),
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      // Restore focus to whatever was focused before the sheet opened.
      previouslyFocusedRef.current?.focus?.();
    };
  }, [sheetOpen]);

  // Auto-close the sheet if everything that fed it disappears (e.g. leaving
  // creator mode while it's open).
  useEffect(() => {
    if (sheetOpen && !showOverflow) setSheetOpen(false);
  }, [sheetOpen, showOverflow]);

  // ── Segmented section tabs ──
  const renderTabs = (compact = false) => (
    <div
      role="tablist"
      aria-label="Report sections"
      className={`flex ${compact ? "" : "w-full"} gap-0.5 rounded-full bg-surface-alt p-0.5`}
    >
      {tabs.map((tab) => {
        const active = activeSection === tab.key;
        return (
          <button
            key={tab.key}
            type="button"
            role="tab"
            id={`tab-section-${tab.key}`}
            aria-controls={`tabpanel-section-${tab.key}`}
            aria-selected={active}
            aria-disabled={!tab.avail}
            disabled={!tab.avail}
            onClick={() => jumpToPhysical(tab.target)}
            className={`${compact ? "px-4" : "flex-1"} min-h-[44px] sm:min-h-0 sm:py-1.5 px-2 rounded-full text-xs font-bold transition-colors active:scale-[0.97] ${
              active
                ? "bg-accent text-white shadow-sm shadow-accent/30"
                : "text-text-secondary hover:text-text-primary"
            } ${!tab.avail ? "opacity-40 pointer-events-none" : ""}`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );

  // ── Prev / Next ──
  const prevButton = (
    <button
      type="button"
      onClick={() => {
        hapticLight();
        onPrev();
      }}
      disabled={isFirst}
      aria-label="Previous slide"
      className="flex-shrink-0 flex items-center justify-center min-w-[44px] min-h-[44px] sm:min-w-0 sm:w-9 sm:h-9 rounded-full text-text-secondary hover:text-text-primary hover:bg-surface-alt active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition-all"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="15 18 9 12 15 6" />
      </svg>
    </button>
  );

  const nextButton = isLast ? (
    <span
      aria-label="End of report"
      className="flex-shrink-0 flex items-center justify-center min-w-[44px] min-h-[44px] sm:min-w-0 sm:w-9 sm:h-9 rounded-full text-accent cursor-default select-none"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    </span>
  ) : (
    <button
      type="button"
      onClick={() => {
        hapticLight();
        onNext();
      }}
      aria-label="Next slide"
      className="flex-shrink-0 flex items-center justify-center min-w-[44px] min-h-[44px] sm:min-w-0 sm:w-9 sm:h-9 rounded-full text-text-secondary hover:text-text-primary hover:bg-surface-alt active:scale-95 transition-all"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </button>
  );

  const overflowButton = showOverflow && (
    <button
      type="button"
      data-overflow-trigger
      onClick={() => setSheetOpen((v) => !v)}
      aria-haspopup="dialog"
      aria-expanded={sheetOpen}
      aria-label="More slide options"
      className={`relative flex-shrink-0 flex items-center justify-center min-w-[44px] min-h-[44px] sm:min-w-0 sm:w-9 sm:h-9 rounded-full text-text-tertiary hover:text-text-primary hover:bg-surface-alt active:scale-95 transition-all ${
        hasSheetMobile ? "flex" : "hidden sm:flex"
      }`}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <circle cx="5" cy="12" r="1.7" />
        <circle cx="12" cy="12" r="1.7" />
        <circle cx="19" cy="12" r="1.7" />
      </svg>
      {hiddenCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[15px] h-[15px] flex items-center justify-center px-0.5 rounded-full bg-amber-500 text-white text-[9px] font-extrabold leading-none">
          {hiddenCount}
        </span>
      )}
    </button>
  );

  // ── Overflow sheet body (shared between mobile sheet + desktop popover) ──
  const overflowBody = (
    <div className="p-3 space-y-3">
      {/* Mobile sheet header */}
      <div className="flex items-center justify-between sm:hidden">
        <span className="text-[11px] font-extrabold uppercase tracking-widest text-text-tertiary">
          Slide options
        </span>
        <button
          type="button"
          onClick={() => setSheetOpen(false)}
          aria-label="Close slide options"
          className="min-w-[44px] min-h-[44px] -mr-2 flex items-center justify-center rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-alt transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Display: Base / Mega */}
      {displayToggle?.hasMega && (
        <div>
          <div className="text-[11px] font-bold uppercase tracking-widest text-text-tertiary mb-1.5">
            Form
          </div>
          <div
            role="radiogroup"
            aria-label="Mega Evolution form"
            className="inline-flex w-full h-11 items-center rounded-lg bg-surface-alt border border-border p-0.5 gap-0.5"
          >
            <button
              type="button"
              role="radio"
              aria-checked={displayToggle.mode === "base"}
              onClick={() => displayToggle.onChange("base")}
              className={`flex-1 h-full rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                displayToggle.mode === "base"
                  ? "bg-accent text-white shadow-sm"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              Base
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={displayToggle.mode === "mega"}
              onClick={() => displayToggle.onChange("mega")}
              className={`flex-1 h-full rounded-md text-xs font-extrabold transition-colors cursor-pointer ${
                displayToggle.mode === "mega"
                  ? "bg-gradient-to-br from-pink-500 to-purple-600 text-white shadow-sm shadow-purple-500/30"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              Mega
            </button>
          </div>
        </div>
      )}

      {/* Creator tools */}
      {onToggleHide && (
        <div className="space-y-1">
          <div className="text-[11px] font-bold uppercase tracking-widest text-text-tertiary mb-1">
            Slide tools
          </div>
          <button
            type="button"
            onClick={onToggleHide}
            className="w-full flex items-center gap-2.5 min-h-[44px] px-2.5 rounded-lg text-sm font-semibold text-text-secondary hover:bg-surface-alt transition-colors"
          >
            {isCurrentHidden ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500">
                <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
                <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
            <span>{isCurrentHidden ? "Hidden from viewers" : "Visible to viewers"}</span>
            <span className="ml-auto text-[11px] font-extrabold text-accent">
              {isCurrentHidden ? "Show" : "Hide"}
            </span>
          </button>

          {(onMoveUp || onMoveDown) && (
            <div className="flex gap-1">
              <button
                type="button"
                onClick={onMoveUp}
                disabled={!canMoveUp}
                className="flex-1 flex items-center justify-center gap-1.5 min-h-[44px] rounded-lg text-xs font-bold text-text-secondary hover:bg-surface-alt disabled:opacity-30 disabled:pointer-events-none transition-colors"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="18 15 12 9 6 15" />
                </svg>
                Move earlier
              </button>
              <button
                type="button"
                onClick={onMoveDown}
                disabled={!canMoveDown}
                className="flex-1 flex items-center justify-center gap-1.5 min-h-[44px] rounded-lg text-xs font-bold text-text-secondary hover:bg-surface-alt disabled:opacity-30 disabled:pointer-events-none transition-colors"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
                Move later
              </button>
            </div>
          )}

          {hiddenCount > 0 && (
            <p className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 px-1">
              {hiddenCount} {hiddenCount === 1 ? "slide" : "slides"} hidden from viewers
            </p>
          )}
        </div>
      )}

      {/* Keyboard shortcuts (desktop only — irrelevant on touch) */}
      {onShowShortcuts && (
        <button
          type="button"
          onClick={() => {
            onShowShortcuts();
            setSheetOpen(false);
          }}
          className="hidden sm:flex w-full items-center gap-2.5 min-h-[40px] px-2.5 rounded-lg text-sm font-semibold text-text-secondary hover:bg-surface-alt transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M8 12h.01M12 12h.01M16 12h.01M7 16h10" />
          </svg>
          Keyboard shortcuts
        </button>
      )}
    </div>
  );

  const currentLabel = slideLabels[currentSlide] ?? "";

  return (
    <>
      {/* Overflow sheet (mobile) / popover (desktop) */}
      {sheetOpen && showOverflow && (
        <>
          <div
            aria-hidden
            onClick={() => setSheetOpen(false)}
            className="fixed inset-0 z-[55] bg-black/30 sm:bg-transparent animate-fade-in"
          />
          <div
            ref={sheetRef}
            role="dialog"
            aria-modal="true"
            aria-label="Slide options"
            className="fixed z-[60] bottom-0 left-0 right-0 rounded-t-2xl border-t border-border bg-surface shadow-2xl pb-[max(0.75rem,env(safe-area-inset-bottom))] animate-fade-in
                       sm:left-auto sm:right-4 sm:bottom-[calc(var(--bottom-nav-height,3.5rem)+0.75rem)] sm:w-72 sm:rounded-2xl sm:border sm:pb-0"
          >
            {overflowBody}
          </div>
        </>
      )}

      <div
        role="navigation"
        aria-label="Slide navigation"
        data-walkthrough="slide-nav"
        className={`fixed bottom-0 left-0 right-0 z-50 transition-opacity duration-200 safe-bottom safe-x ${
          autoHide
            ? "bg-surface/0 border-transparent opacity-0 hover:opacity-100 hover:bg-surface/95 hover:backdrop-blur-2xl"
            : "bg-surface/95 backdrop-blur-2xl border-t border-border/60"
        }`}
      >
        <div className="max-w-5xl mx-auto px-3 sm:px-6">
          {/* ── MOBILE (< sm): two-row segmented bar ── */}
          <div className="sm:hidden">
            {/* Row 0 — within-section progress */}
            <div className="h-1 w-full mt-1 rounded-full bg-text-tertiary/15 overflow-hidden">
              <div
                className="h-full rounded-full bg-accent transition-[width] duration-150 ease-out"
                style={{ width: `${sectionProgress * 100}%` }}
              />
            </div>
            {/* Row 1 — chevrons + tabs + overflow */}
            <div className="flex items-center gap-1.5 py-1">
              {prevButton}
              <div className="flex-1 min-w-0 flex flex-col items-center gap-0.5">
                {renderTabs()}
                <span className="max-w-full truncate text-[10px] leading-none font-semibold text-text-tertiary">
                  <span className="text-text-secondary font-bold">{currentLabel}</span>
                  {secTotal > 1 && (
                    <span className="ml-1.5 tabular-nums opacity-70">
                      {sectionPos + 1}/{secTotal}
                    </span>
                  )}
                </span>
              </div>
              {nextButton}
              {overflowButton}
            </div>
          </div>

          {/* ── DESKTOP (≥ sm): tabs + dots + counter ── */}
          <div className="hidden sm:flex items-center gap-3 py-1.5">
            {prevButton}
            {renderTabs(true)}

            {/* Dot indicators */}
            <div
              role="tablist"
              aria-label="Slides"
              className="flex-1 flex items-center justify-center gap-[5px] overflow-x-auto scrollbar-none"
            >
              {Array.from({ length: totalSlides }, (_, i) => {
                const isHidden = hiddenStates?.[i] ?? false;
                const isCurrent = i === currentSlide;
                const hasChanges = changedSlides?.has(i) ?? false;
                return (
                  <button
                    key={i}
                    type="button"
                    role="tab"
                    id={`tab-slide-${i}`}
                    aria-controls={`tabpanel-slide-${i}`}
                    aria-selected={isCurrent}
                    onClick={() => onGoTo(i)}
                    title={`${slideLabels[i]}${isHidden ? ` ${t.hiddenFromViewers}` : ""}${hasChanges ? " (changed)" : ""}`}
                    aria-label={`Go to ${slideLabels[i]}`}
                    className="relative flex items-center justify-center w-5 h-5 flex-shrink-0"
                  >
                    <span
                      className={`block rounded-full transition-all duration-200 ${
                        isCurrent
                          ? isHidden
                            ? "w-5 h-2 rounded bg-amber-400/70 shadow-sm shadow-amber-400/30"
                            : hasChanges
                              ? "w-5 h-2 bg-blue-500 shadow-sm shadow-blue-500/40"
                              : "w-5 h-2 bg-accent shadow-sm shadow-accent/30"
                          : isHidden
                            ? "w-1.5 h-1.5 bg-amber-400/40 hover:bg-amber-400/60"
                            : hasChanges
                              ? "w-2 h-2 bg-blue-500/70 hover:bg-blue-500 ring-1 ring-blue-500/30"
                              : "w-1.5 h-1.5 bg-text-tertiary/30 hover:bg-text-tertiary/60"
                      }`}
                    />
                  </button>
                );
              })}
            </div>

            {/* Current label + counter */}
            <span className="text-[11px] text-text-tertiary font-semibold tabular-nums flex-shrink-0 max-w-[180px] truncate">
              <span className="font-bold text-text-secondary">{currentLabel}</span>
              <span className="ml-1.5 text-text-tertiary/70">
                {currentSlide + 1}/{totalSlides}
              </span>
            </span>

            {nextButton}
            {overflowButton}
          </div>
        </div>

        {/* Screen-reader live region — announces slide changes */}
        <span className="sr-only" aria-live="polite" aria-atomic="true">
          Slide {currentSlide + 1} of {totalSlides}: {currentLabel}
        </span>
      </div>
    </>
  );
}
