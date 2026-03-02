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
}: SlideNavControlsProps) {
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
            {Array.from({ length: totalSlides }, (_, i) => (
              <button
                key={i}
                onClick={() => onGoTo(i)}
                title={slideLabels[i]}
                aria-label={`Go to ${slideLabels[i]}`}
                className={`rounded-full transition-all duration-300 flex-shrink-0 ${
                  i === currentSlide
                    ? "w-2.5 sm:w-3 h-1.5 sm:h-2 bg-accent shadow-sm shadow-accent/40"
                    : "w-1 sm:w-1.5 h-1 sm:h-1.5 bg-border hover:bg-text-tertiary hover:scale-125"
                }`}
              />
            ))}
          </div>
          {/* Label + counter */}
          <span className="text-[10px] sm:text-xs text-text-tertiary truncate hidden sm:inline">
            <span className="font-semibold text-text-primary">{slideLabels[currentSlide]}</span>
            <span className="mx-1 text-border">&middot;</span>
            <span className="tabular-nums">{currentSlide + 1}/{totalSlides}</span>
          </span>
          {/* Mobile: just counter */}
          <span className="text-[10px] text-text-tertiary tabular-nums sm:hidden">
            {currentSlide + 1}/{totalSlides}
          </span>
        </div>

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
