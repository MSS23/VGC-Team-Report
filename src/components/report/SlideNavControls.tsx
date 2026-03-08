"use client";

import { Button } from "@/components/ui/Button";

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
}: SlideNavControlsProps) {
  const hiddenCount = hiddenStates?.filter(Boolean).length ?? 0;

  return (
    <div
      role="navigation"
      aria-label="Slide navigation"
      data-walkthrough="slide-nav"
      className={`fixed bottom-0 left-0 right-0 z-50 backdrop-blur-xl border-t transition-all duration-300 ${
        autoHide
          ? "bg-surface/0 border-transparent opacity-0 hover:opacity-100 hover:bg-surface/95 hover:border-border"
          : "bg-surface/95 border-border shadow-[0_-2px_12px_rgba(0,0,0,0.06)]"
      }`}
    >
      <div className="max-w-7xl mx-auto px-2 sm:px-4 py-1 sm:py-1.5 flex items-center gap-2 sm:gap-3">
        {/* Prev button */}
        <Button
          variant="secondary"
          size="sm"
          onClick={onPrev}
          disabled={isFirst}
          aria-label="Previous slide"
          className="!py-1 !px-2 sm:!px-3 !text-xs"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="hidden sm:block">
            <polyline points="15,18 9,12 15,6" />
          </svg>
          Prev
        </Button>

        {/* Center: Dots + label on one row */}
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1 justify-center overflow-hidden">
          {/* Dots */}
          <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
            {Array.from({ length: totalSlides }, (_, i) => {
              const isHidden = hiddenStates?.[i] ?? false;
              const isCurrent = i === currentSlide;
              return (
                <button
                  key={i}
                  onClick={() => onGoTo(i)}
                  title={`${slideLabels[i]}${isHidden ? " (hidden from viewers)" : ""}`}
                  aria-label={`Go to ${slideLabels[i]}${isHidden ? " (hidden from viewers)" : ""}`}
                  className={`rounded-full transition-all duration-300 flex-shrink-0 ${
                    isCurrent
                      ? isHidden
                        ? "w-3 sm:w-3.5 h-2 sm:h-2.5 bg-amber-400/70 shadow-sm shadow-amber-400/30 ring-1 ring-amber-400/40"
                        : "w-3 sm:w-3.5 h-2 sm:h-2.5 bg-accent shadow-sm shadow-accent/40"
                      : isHidden
                        ? "w-1.5 sm:w-2 h-1.5 sm:h-2 bg-amber-400/30 hover:bg-amber-400/50"
                        : "w-1.5 sm:w-2 h-1.5 sm:h-2 bg-border hover:bg-text-tertiary hover:scale-125"
                  }`}
                />
              );
            })}
          </div>
          {/* Label + counter (desktop) */}
          <span className="text-xs text-text-tertiary truncate hidden sm:inline">
            <span className="font-semibold text-text-primary">{slideLabels[currentSlide]}</span>
            <span className="mx-1 text-border">&middot;</span>
            <span className="tabular-nums">{currentSlide + 1}/{totalSlides}</span>
          </span>
          {/* Mobile: label + counter */}
          <span className="text-xs text-text-tertiary truncate sm:hidden">
            <span className="font-semibold text-text-primary">{slideLabels[currentSlide]}</span>
            <span className="mx-1 text-border">&middot;</span>
            <span className="tabular-nums">{currentSlide + 1}/{totalSlides}</span>
          </span>
        </div>

        {/* Hide/Show slide toggle (creator only) */}
        {onToggleHide && (
          <button
            type="button"
            onClick={onToggleHide}
            className={`relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all duration-200 ${
              isCurrentHidden
                ? "bg-amber-400/20 text-amber-700 dark:text-amber-300 border-amber-400/40 hover:bg-amber-400/30 font-bold"
                : "bg-surface-alt text-text-tertiary border-border hover:text-text-secondary hover:bg-surface-alt/80"
            }`}
            title={
              isCurrentHidden
                ? "This slide is hidden — viewers won't see it when you share or present. Click to make it visible again."
                : "Click to hide this slide from viewers when you share or present."
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
            <span className="hidden sm:inline">{isCurrentHidden ? "Hidden" : "Visible"}</span>
            {/* Badge showing hidden count */}
            {hiddenCount > 0 && !isCurrentHidden && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 flex items-center justify-center px-1 rounded-full bg-amber-500 text-white text-[10px] font-bold leading-none">
                {hiddenCount}
              </span>
            )}
          </button>
        )}

        {/* Keyboard shortcuts */}
        {onShowShortcuts && (
          <button
            type="button"
            onClick={onShowShortcuts}
            className="flex items-center justify-center w-7 h-7 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-alt/60 transition-colors cursor-pointer flex-shrink-0"
            aria-label="Keyboard shortcuts"
            title="Keyboard shortcuts (?)"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M8 12h.01M12 12h.01M16 12h.01M7 16h10" />
            </svg>
          </button>
        )}

        {/* Next button */}
        <Button
          variant="secondary"
          size="sm"
          onClick={onNext}
          disabled={isLast}
          aria-label="Next slide"
          className="!py-1 !px-2 sm:!px-3 !text-xs"
        >
          Next
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="hidden sm:block">
            <polyline points="9,18 15,12 9,6" />
          </svg>
        </Button>
      </div>
    </div>
  );
}
