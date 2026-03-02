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
      data-walkthrough="slide-nav"
      className={`fixed bottom-0 left-0 right-0 z-50 backdrop-blur-xl border-t transition-all duration-300 ${
        autoHide
          ? "bg-surface/0 border-transparent opacity-0 hover:opacity-100 hover:bg-surface/95 hover:border-border"
          : "bg-surface/95 border-border shadow-[0_-4px_20px_rgba(0,0,0,0.08)]"
      }`}
    >
      <div className="max-w-7xl mx-auto px-2 sm:px-5 py-1.5 sm:py-3 flex items-center justify-between gap-2 sm:gap-3">
        {/* Prev button */}
        <Button
          variant="secondary"
          size="sm"
          onClick={onPrev}
          disabled={isFirst}
          className="min-w-[60px] sm:min-w-[100px]"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="hidden sm:block">
            <polyline points="15,18 9,12 15,6" />
          </svg>
          Prev
        </Button>

        {/* Center: Dots + counter */}
        <div className="flex flex-col items-center gap-1.5 min-w-0 flex-1">
          {/* Dots */}
          <div className="hidden sm:flex items-center gap-1.5 max-w-full overflow-x-auto py-0.5">
            {Array.from({ length: totalSlides }, (_, i) => (
              <button
                key={i}
                onClick={() => onGoTo(i)}
                title={slideLabels[i]}
                className={`rounded-full transition-all duration-300 flex-shrink-0 ${
                  i === currentSlide
                    ? "w-4 h-2.5 bg-accent shadow-sm shadow-accent/40"
                    : "w-2 h-2 bg-border hover:bg-text-tertiary hover:scale-125"
                }`}
              />
            ))}
          </div>
          <span className="text-xs text-text-tertiary truncate max-w-[220px]">
            <span className="font-semibold text-text-primary">{slideLabels[currentSlide]}</span>
            <span className="mx-1.5 text-border">&middot;</span>
            <span className="tabular-nums">{currentSlide + 1}/{totalSlides}</span>
          </span>
        </div>

        {/* Next button */}
        <Button
          variant="secondary"
          size="sm"
          onClick={onNext}
          disabled={isLast}
          className="min-w-[60px] sm:min-w-[100px]"
        >
          Next
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="hidden sm:block">
            <polyline points="9,18 15,12 9,6" />
          </svg>
        </Button>
      </div>
    </div>
  );
}
