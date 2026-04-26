"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { useTranslation } from "@/lib/i18n";
import { hapticLight } from "@/lib/utils/haptics";

/** Small tooltip that explains what the navigation bar does */
function NavHelpTooltip() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("touchstart", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("touchstart", close);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center justify-center w-8 h-8 sm:w-auto sm:h-auto sm:px-2 sm:py-1.5 rounded-full sm:rounded-lg text-xs font-bold text-text-tertiary hover:text-accent hover:bg-accent/5 transition-all"
        aria-label="Navigation help"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      </button>
      {open && (
        <div className="absolute bottom-full right-0 mb-2 w-56 px-3 py-2.5 rounded-lg bg-surface-alt border border-border shadow-xl text-xs text-text-secondary leading-relaxed z-50 animate-fade-in">
          <p className="font-bold text-text-primary mb-1">Slide Navigation</p>
          <p>Drag the bar or tap anywhere on it to jump between slides. Use arrow keys on desktop. Swipe left/right on mobile.</p>
        </div>
      )}
    </div>
  );
}

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
  hiddenStates?: boolean[];
  onToggleHide?: () => void;
  isCurrentHidden?: boolean;
  onShowShortcuts?: () => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  changedSlides?: Set<number>;
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
}: SlideNavControlsProps) {
  const { t } = useTranslation();
  const hiddenCount = hiddenStates?.filter(Boolean).length ?? 0;

  // --- Mobile progress bar state ---
  const barRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [tooltipLabel, setTooltipLabel] = useState<string | null>(null);
  const [tooltipX, setTooltipX] = useState(0);
  const lastSlideRef = useRef(currentSlide);

  const resolveSlideFromX = useCallback(
    (clientX: number): number => {
      const bar = barRef.current;
      if (!bar) return currentSlide;
      const rect = bar.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      return Math.min(totalSlides - 1, Math.max(0, Math.round(ratio * (totalSlides - 1))));
    },
    [currentSlide, totalSlides],
  );

  const handleBarTouchStart = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      const touch = e.touches[0];
      const idx = resolveSlideFromX(touch.clientX);
      setIsDragging(true);
      lastSlideRef.current = idx;

      const bar = barRef.current;
      if (bar) {
        const rect = bar.getBoundingClientRect();
        setTooltipX(touch.clientX - rect.left);
      }
      setTooltipLabel(slideLabels[idx] ?? null);

      if (idx !== currentSlide) {
        hapticLight();
        onGoTo(idx);
      }
    },
    [resolveSlideFromX, currentSlide, onGoTo, slideLabels],
  );

  const handleBarTouchMove = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      if (!isDragging) return;
      const touch = e.touches[0];
      const idx = resolveSlideFromX(touch.clientX);

      const bar = barRef.current;
      if (bar) {
        const rect = bar.getBoundingClientRect();
        setTooltipX(Math.max(0, Math.min(rect.width, touch.clientX - rect.left)));
      }
      setTooltipLabel(slideLabels[idx] ?? null);

      if (idx !== lastSlideRef.current) {
        lastSlideRef.current = idx;
        hapticLight();
        onGoTo(idx);
      }
    },
    [isDragging, resolveSlideFromX, onGoTo, slideLabels],
  );

  const handleBarTouchEnd = useCallback(() => {
    setIsDragging(false);
    setTooltipLabel(null);
  }, []);

  const handleBarClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const idx = resolveSlideFromX(e.clientX);
      if (idx !== currentSlide) {
        hapticLight();
        onGoTo(idx);
      }
    },
    [resolveSlideFromX, currentSlide, onGoTo],
  );

  // Progress fraction for the bar
  const progress = totalSlides <= 1 ? 1 : currentSlide / (totalSlides - 1);

  return (
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
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-1 sm:py-1.5 flex items-center gap-2 sm:gap-3">
        {/* === LEFT: Home + Prev === */}
        {currentSlide > 0 && (
          <button
            onClick={() => {
              hapticLight();
              onGoTo(0);
            }}
            aria-label="Back to team overview"
            title="Back to team overview"
            className="flex-shrink-0 flex items-center justify-center w-8 h-8 sm:w-auto sm:h-auto sm:px-3 sm:py-1.5 text-xs font-bold rounded-full sm:rounded-lg text-text-secondary hover:text-accent hover:bg-accent/5 active:scale-95 transition-all"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="sm:mr-1 sm:w-3.5 sm:h-3.5">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            <span className="hidden sm:inline">Home</span>
          </button>
        )}
        <button
          onClick={onPrev}
          disabled={isFirst}
          aria-label="Previous slide"
          className="flex-shrink-0 flex items-center justify-center w-8 h-8 sm:w-auto sm:h-auto sm:px-3 sm:py-1.5 text-xs font-bold rounded-full sm:rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-alt active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition-all"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="sm:mr-1 sm:w-3.5 sm:h-3.5">
            <polyline points="15,18 9,12 15,6" />
          </svg>
          <span className="hidden sm:inline">{t.prev}</span>
        </button>

        {/* === CENTER: Mobile progress bar / Desktop dots === */}
        <div className="flex-1 min-w-0 flex items-center justify-center gap-2">
          {/* --- Mobile: draggable progress bar (< 640px) --- */}
          <div className="flex sm:hidden flex-1 flex-col items-center gap-0.5">
            <div
              ref={barRef}
              className="relative w-full h-5 flex items-center touch-none cursor-pointer"
              onTouchStart={handleBarTouchStart}
              onTouchMove={handleBarTouchMove}
              onTouchEnd={handleBarTouchEnd}
              onClick={handleBarClick}
              role="slider"
              aria-label="Slide progress"
              aria-valuemin={1}
              aria-valuemax={totalSlides}
              aria-valuenow={currentSlide + 1}
              aria-valuetext={slideLabels[currentSlide]}
              tabIndex={0}
            >
              {/* Tooltip */}
              {isDragging && tooltipLabel && (
                <div
                  className="absolute -top-8 px-2 py-0.5 rounded bg-surface-alt text-text-primary text-[11px] font-semibold shadow-lg whitespace-nowrap pointer-events-none -translate-x-1/2 border border-border/40"
                  style={{ left: tooltipX }}
                >
                  {tooltipLabel}
                </div>
              )}

              {/* Track */}
              <div className="w-full h-1.5 rounded-full bg-text-tertiary/20 relative overflow-hidden">
                {/* Filled portion */}
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-accent transition-[width] duration-100 ease-out"
                  style={{ width: `${progress * 100}%` }}
                />
              </div>

              {/* Thumb */}
              <div
                className={`absolute w-3 h-3 rounded-full bg-accent shadow-sm shadow-accent/30 -translate-x-1/2 pointer-events-none transition-opacity duration-150 ${
                  isDragging ? "opacity-100 scale-110" : "opacity-70"
                }`}
                style={{ left: `${progress * 100}%` }}
              />
            </div>
          </div>

          {/* --- Desktop: dot indicators (sm: and above) --- */}
          <div role="tablist" aria-label="Slides" className="hidden sm:flex items-center gap-[5px] overflow-x-auto scrollbar-none">
            {Array.from({ length: totalSlides }, (_, i) => {
              const isHidden = hiddenStates?.[i] ?? false;
              const isCurrent = i === currentSlide;
              const hasChanges = changedSlides?.has(i) ?? false;
              return (
                <button
                  key={i}
                  role="tab"
                  aria-selected={isCurrent}
                  onClick={() => onGoTo(i)}
                  title={`${slideLabels[i]}${isHidden ? ` ${t.hiddenFromViewers}` : ""}${hasChanges ? " (changed)" : ""}`}
                  aria-label={`Go to ${slideLabels[i]}`}
                  className="relative flex items-center justify-center w-5 h-5 flex-shrink-0"
                >
                  <span className={`block rounded-full transition-all duration-200 ${
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
                  }`} />
                </button>
              );
            })}
          </div>

          {/* Current slide label + counter */}
          <span className="text-[11px] text-text-tertiary font-semibold tabular-nums flex-shrink-0">
            <span className="font-bold text-text-secondary">{slideLabels[currentSlide]}</span>
            <span className="ml-1.5 text-text-tertiary/70">{currentSlide + 1}/{totalSlides}</span>
          </span>
          <span className="sr-only" aria-live="polite" aria-atomic="true">
            Slide {currentSlide + 1} of {totalSlides}: {slideLabels[currentSlide]}
          </span>
        </div>

        {/* === RIGHT: Actions + Next === */}
        <div className="flex-shrink-0 flex items-center gap-1">
          {/* Reorder (creator only) */}
          {(canMoveUp || canMoveDown) && (
            <span className="hidden sm:flex items-center">
              <button
                type="button"
                onClick={onMoveUp}
                disabled={!canMoveUp}
                className="flex items-center justify-center w-7 h-7 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-alt transition-colors disabled:opacity-20 disabled:pointer-events-none"
                title="Move slide earlier"
                aria-label="Move slide earlier"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15,18 9,12 15,6" /></svg>
              </button>
              <button
                type="button"
                onClick={onMoveDown}
                disabled={!canMoveDown}
                className="flex items-center justify-center w-7 h-7 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-alt transition-colors disabled:opacity-20 disabled:pointer-events-none"
                title="Move slide later"
                aria-label="Move slide later"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9,18 15,12 9,6" /></svg>
              </button>
            </span>
          )}

          {/* Hide/Show toggle (creator only) */}
          {onToggleHide && (
            <button
              type="button"
              onClick={onToggleHide}
              className={`relative flex items-center justify-center w-8 h-8 sm:w-auto sm:h-auto sm:px-2 sm:py-1.5 rounded-full sm:rounded-lg text-xs font-bold transition-all ${
                isCurrentHidden
                  ? "text-amber-500 hover:bg-amber-500/10"
                  : "text-text-tertiary hover:text-text-secondary hover:bg-surface-alt"
              }`}
              title={isCurrentHidden ? t.hiddenSlideTooltip : t.hideSlideTooltip}
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
              <span className="hidden sm:inline ml-1">{isCurrentHidden ? t.hidden : t.visible}</span>
              {hiddenCount > 0 && !isCurrentHidden && (
                <span className="absolute -top-1 -right-1 min-w-[14px] h-[14px] flex items-center justify-center px-0.5 rounded-full bg-amber-500 text-white text-[9px] font-extrabold leading-none">
                  {hiddenCount}
                </span>
              )}
            </button>
          )}

          {/* Help tooltip — explains the navigation bar */}
          <NavHelpTooltip />

          {/* Keyboard shortcuts — desktop only */}
          {onShowShortcuts && (
            <button
              type="button"
              onClick={onShowShortcuts}
              className="hidden sm:flex items-center justify-center w-7 h-7 rounded-lg text-text-tertiary hover:text-accent hover:bg-accent/5 transition-colors"
              aria-label="Keyboard shortcuts"
              title="Keyboard shortcuts (?)"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M8 12h.01M12 12h.01M16 12h.01M7 16h10" />
              </svg>
            </button>
          )}

          {/* Next / End */}
          {isLast ? (
            <span
              aria-label="End of report"
              className="flex-shrink-0 flex items-center justify-center w-8 h-8 sm:w-auto sm:h-auto sm:px-3 sm:py-1.5 text-xs font-bold rounded-full sm:rounded-lg text-accent cursor-default select-none"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="sm:mr-1 sm:w-3.5 sm:h-3.5">
                <polyline points="20,6 9,17 4,12" />
              </svg>
              <span className="hidden sm:inline">End</span>
            </span>
          ) : (
            <button
              onClick={onNext}
              disabled={isFirst && totalSlides <= 1}
              aria-label="Next slide"
              className="flex-shrink-0 flex items-center justify-center w-8 h-8 sm:w-auto sm:h-auto sm:px-3 sm:py-1.5 text-xs font-bold rounded-full sm:rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-alt active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition-all"
            >
              <span className="hidden sm:inline">{t.next}</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="sm:ml-1 sm:w-3.5 sm:h-3.5">
                <polyline points="9,18 15,12 9,6" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
