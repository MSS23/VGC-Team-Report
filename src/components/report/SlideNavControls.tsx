"use client";

import { useTranslation } from "@/lib/i18n";

interface SlideNavControlsProps {
  currentSlide: number;
  totalSlides: number;
  isFirst: boolean;
  isLast: boolean;
  onPrev: () => void;
  onNext: () => void;
  onGoTo: (index: number) => void;
  slideLabels: string[];
  autoHide?: boolean;
  /** Per-dot hidden state (true = hidden slide). Only provided in creator mode. */
  hiddenStates?: boolean[];
  /** Toggle hide/show for the current slide. Only provided in creator mode. */
  onToggleHide?: () => void;
  /** Whether the current slide is hidden. */
  isCurrentHidden?: boolean;
  /** Callback to show keyboard shortcuts overlay. */
  onShowShortcuts?: () => void;
  /** Callback to start the walkthrough tour. */
  onStartTour?: () => void;
  /** Whether current slide can be moved up (earlier). */
  canMoveUp?: boolean;
  /** Whether current slide can be moved down (later). */
  canMoveDown?: boolean;
  /** Move current slide up (swap with previous). */
  onMoveUp?: () => void;
  /** Move current slide down (swap with next). */
  onMoveDown?: () => void;
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
  onStartTour,
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
}: SlideNavControlsProps) {
  const { t } = useTranslation();
  const hiddenCount = hiddenStates?.filter(Boolean).length ?? 0;

  return (
    <div
      role="navigation"
      aria-label="Slide navigation"
      data-walkthrough="slide-nav"
      className={`fixed bottom-0 left-0 right-0 z-50 backdrop-blur-xl border-t transition-all duration-300 safe-bottom ${
        autoHide
          ? "bg-surface/0 border-transparent opacity-0 hover:opacity-100 hover:bg-surface/95 hover:border-border"
          : "bg-surface/95 border-border shadow-[0_-2px_12px_rgba(0,0,0,0.06)]"
      }`}
    >
      {/* 3-zone layout: Left (prev) | Center (dots + label) | Right (actions + next) */}
      <div className="max-w-7xl mx-auto px-2 sm:px-4 py-2 sm:py-1.5 flex items-center gap-1.5 sm:gap-3">
        {/* === LEFT: Prev button === */}
        <button
          onClick={onPrev}
          disabled={isFirst}
          aria-label="Previous slide"
          className="flex-shrink-0 flex items-center justify-center w-11 h-11 sm:w-auto sm:h-auto sm:px-3 sm:py-2 text-xs font-bold rounded-xl sm:rounded-lg bg-surface text-text-primary border-2 border-border hover:bg-surface-alt hover:border-accent/30 active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="sm:mr-1 sm:w-3 sm:h-3">
            <polyline points="15,18 9,12 15,6" />
          </svg>
          <span className="hidden sm:inline">{t.prev}</span>
        </button>

        {/* === CENTER: Dots + slide counter === */}
        <div className="flex-1 min-w-0 flex items-center justify-center gap-1.5 sm:gap-2 overflow-hidden">
          {/* Dots */}
          <div role="tablist" aria-label="Slides" className="flex items-center gap-1 sm:gap-1 overflow-x-auto flex-shrink scrollbar-none">
            {Array.from({ length: totalSlides }, (_, i) => {
              const isHidden = hiddenStates?.[i] ?? false;
              const isCurrent = i === currentSlide;
              return (
                <button
                  key={i}
                  role="tab"
                  aria-selected={isCurrent}
                  onClick={() => onGoTo(i)}
                  title={`${slideLabels[i]}${isHidden ? ` ${t.hiddenFromViewers}` : ""}`}
                  aria-label={`Go to ${slideLabels[i]}${isHidden ? ` ${t.hiddenFromViewers}` : ""}`}
                  className="relative flex items-center justify-center w-6 h-6 sm:w-auto sm:h-auto flex-shrink-0"
                >
                  <span className={`block transition-all duration-300 ${
                    isCurrent
                      ? isHidden
                        ? "w-4 h-2.5 rounded bg-amber-400/70 shadow-sm shadow-amber-400/30 ring-1 ring-amber-400/40 border border-dashed border-amber-400/60"
                        : "w-4 h-2.5 rounded-full bg-accent shadow-sm shadow-accent/40"
                      : isHidden
                        ? "w-2 h-2 rounded bg-amber-400/30 hover:bg-amber-400/50 border border-dashed border-amber-400/40"
                        : "w-2 h-2 rounded-full bg-border hover:bg-text-tertiary hover:scale-125"
                  }`} />
                </button>
              );
            })}
          </div>
          {/* Label + counter */}
          <span className="text-xs text-text-tertiary truncate font-semibold flex-shrink-0">
            <span className="font-bold text-text-primary hidden sm:inline">{slideLabels[currentSlide]}</span>
            <span className="hidden sm:inline mx-1 text-border">&middot;</span>
            <span className="font-[family-name:var(--font-mono)] tabular-nums">{currentSlide + 1}/{totalSlides}</span>
          </span>
          {/* Screen reader live region for slide changes */}
          <span className="sr-only" aria-live="polite" aria-atomic="true">
            Slide {currentSlide + 1} of {totalSlides}: {slideLabels[currentSlide]}{isLast ? " — End of report" : ""}
          </span>
        </div>

        {/* === RIGHT: Actions + Next button === */}
        <div className="flex-shrink-0 flex items-center gap-1.5 sm:gap-2">
          {/* Reorder slide (creator only, Pokemon & matchup plan slides) */}
          {(canMoveUp || canMoveDown) && (
            <span className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={onMoveUp}
                disabled={!canMoveUp}
                className="flex items-center justify-center w-8 h-8 sm:w-7 sm:h-7 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-alt/60 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-default"
                title="Move slide earlier"
                aria-label="Move slide earlier"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15,18 9,12 15,6" />
                </svg>
              </button>
              <button
                type="button"
                onClick={onMoveDown}
                disabled={!canMoveDown}
                className="flex items-center justify-center w-8 h-8 sm:w-7 sm:h-7 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-alt/60 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-default"
                title="Move slide later"
                aria-label="Move slide later"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9,18 15,12 9,6" />
                </svg>
              </button>
            </span>
          )}

          {/* Hide/Show slide toggle (creator only) */}
          {onToggleHide && (
            <button
              type="button"
              onClick={onToggleHide}
              className={`relative flex items-center justify-center gap-1.5 w-10 h-10 sm:w-auto sm:h-auto sm:px-2.5 sm:py-2 rounded-lg border-2 text-xs font-bold transition-all duration-200 ${
                isCurrentHidden
                  ? "bg-amber-400/20 text-amber-700 dark:text-amber-300 border-amber-400/40 hover:bg-amber-400/30"
                  : "bg-surface-alt text-text-tertiary border-border hover:text-text-secondary hover:bg-surface-alt/80"
              }`}
              title={
                isCurrentHidden
                  ? t.hiddenSlideTooltip
                  : t.hideSlideTooltip
              }
            >
              {isCurrentHidden ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
                  <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
              <span className="hidden sm:inline tracking-wide">{isCurrentHidden ? t.hidden : t.visible}</span>
              {/* Badge showing hidden count */}
              {hiddenCount > 0 && !isCurrentHidden && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 flex items-center justify-center px-1 rounded-full bg-amber-500 text-white text-[10px] font-extrabold leading-none">
                  {hiddenCount}
                </span>
              )}
            </button>
          )}

          {/* Take a Tour */}
          {onStartTour && (
            <button
              type="button"
              onClick={onStartTour}
              className="flex items-center justify-center gap-1.5 h-9 px-2.5 sm:px-3 rounded-lg text-xs font-bold text-text-tertiary hover:text-accent hover:bg-accent-surface/60 border border-transparent hover:border-accent/20 transition-all cursor-pointer flex-shrink-0"
              aria-label={t.takeATour}
              title={t.takeATour}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <span className="hidden sm:inline">{t.takeATour}</span>
            </button>
          )}

          {/* Keyboard shortcuts — desktop only */}
          {onShowShortcuts && (
            <button
              type="button"
              onClick={onShowShortcuts}
              className="hidden sm:flex items-center justify-center w-8 h-8 rounded-lg text-text-tertiary hover:text-accent hover:bg-accent-surface/60 transition-colors cursor-pointer flex-shrink-0"
              aria-label="Keyboard shortcuts"
              title="Keyboard shortcuts (?)"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M8 12h.01M12 12h.01M16 12h.01M7 16h10" />
              </svg>
            </button>
          )}

          {/* Next / End button */}
          {isLast ? (
            <span
              aria-label="End of report"
              className="flex-shrink-0 flex items-center justify-center w-11 h-11 sm:w-auto sm:h-auto sm:px-3 sm:py-2 text-xs font-bold rounded-xl sm:rounded-lg bg-accent/10 text-accent border-2 border-accent/30 cursor-default select-none transition-all"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="sm:mr-1 sm:w-3 sm:h-3">
                <polyline points="20,6 9,17 4,12" />
              </svg>
              <span className="hidden sm:inline">End</span>
            </span>
          ) : (
            <button
              onClick={onNext}
              disabled={isFirst && totalSlides <= 1}
              aria-label="Next slide"
              className="flex-shrink-0 flex items-center justify-center w-11 h-11 sm:w-auto sm:h-auto sm:px-3 sm:py-2 text-xs font-bold rounded-xl sm:rounded-lg bg-surface text-text-primary border-2 border-border hover:bg-surface-alt hover:border-accent/30 active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <span className="hidden sm:inline">{t.next}</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="sm:ml-1 sm:w-3 sm:h-3">
                <polyline points="9,18 15,12 9,6" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
