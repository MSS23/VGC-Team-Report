"use client";

import { useEffect, useState, useRef, useCallback, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import type { WalkthroughStep } from "@/hooks/useWalkthrough";
import { PokemonSprite } from "@/components/report/PokemonSprite";
import { useTranslation } from "@/lib/i18n";

// useLayoutEffect on client, useEffect on server (avoids SSR warnings)
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

interface WalkthroughOverlayProps {
  step: WalkthroughStep;
  stepIndex: number;
  totalSteps: number;
  onNext: () => void;
  onSkip: () => void;
  guidePokemon?: string;
}

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const SPOTLIGHT_PAD = 8;
const TOOLTIP_MARGIN = 16;
const TOOLTIP_GAP = 12;
const NAVBAR_HEIGHT = 52;
const MOBILE_BROWSER_CHROME_PAD = 60;

// Smooth, snappy easing — fast start, gentle deceleration
const EASE_OUT = "cubic-bezier(0.22, 1, 0.36, 1)";
const SPOTLIGHT_DURATION = 250;
const TOOLTIP_DURATION = 220;

export function WalkthroughOverlay({
  step,
  stepIndex,
  totalSteps,
  onNext,
  onSkip,
  guidePokemon,
}: WalkthroughOverlayProps) {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const [targetRect, setTargetRect] = useState<Rect | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const prevStepRef = useRef(stepIndex);
  const positionedRef = useRef(false);
  const [renderKey, setRenderKey] = useState(0); // forces re-render after positioning
  const [transitioning, setTransitioning] = useState(false); // true during cross-slide fade
  const isVirtual = step.target === null;
  const isLastStep = stepIndex === totalSteps - 1;

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scrolling while walkthrough is active (CSS-only, no event blocking)
  useEffect(() => {
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    };
  }, []);

  // Measure target element
  const measureTarget = useCallback(() => {
    if (isVirtual) {
      setTargetRect(null);
      return;
    }
    const el = document.querySelector(`[data-walkthrough="${step.target}"]`);
    if (!el) {
      setTargetRect(null);
      return;
    }
    const r = el.getBoundingClientRect();
    setTargetRect({ top: r.top, left: r.left, width: r.width, height: r.height });
  }, [step.target, isVirtual]);

  useEffect(() => {
    measureTarget();
  }, [measureTarget]);

  useEffect(() => {
    const update = () => measureTarget();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    window.visualViewport?.addEventListener("resize", update);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
      window.visualViewport?.removeEventListener("resize", update);
    };
  }, [measureTarget]);

  // Keyboard handling
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onSkip();
      } else if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onNext();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onNext, onSkip]);

  // Position the tooltip. On same-slide steps, smoothly transition position.
  // On cross-slide steps, fade out → reposition → fade in to avoid clunky sliding.
  useIsomorphicLayoutEffect(() => {
    if (!mounted) return;
    const tt = tooltipRef.current;
    if (!tt) return;

    const stepChanged = prevStepRef.current !== stepIndex;
    if (stepChanged) {
      prevStepRef.current = stepIndex;
    }

    const position = () => {
      const ttW = tt.offsetWidth;
      const ttH = tt.offsetHeight;
      const vv = window.visualViewport;
      const vw = vv?.width ?? window.innerWidth;
      const vh = vv?.height ?? window.innerHeight;
      const vvOffsetTop = vv?.offsetTop ?? 0;
      const isMobile = window.innerWidth < 640;
      const bottomPad = NAVBAR_HEIGHT + (isMobile ? MOBILE_BROWSER_CHROME_PAD : 0);
      const safeBottom = vvOffsetTop + vh - bottomPad;

      let top: number;
      let left: number;

      if (isVirtual || !targetRect) {
        const visibleCenter = vvOffsetTop + (vh - bottomPad - ttH) / 2;
        top = Math.max(TOOLTIP_MARGIN, visibleCenter);
        left = Math.max(TOOLTIP_MARGIN, (vw - ttW) / 2);
      } else {
        const spotTop = targetRect.top - SPOTLIGHT_PAD;
        const spotH = targetRect.height + SPOTLIGHT_PAD * 2;
        const spotBottom = spotTop + spotH;
        const spotCenterX = targetRect.left + targetRect.width / 2;

        if (step.placement === "above") {
          top = spotTop - TOOLTIP_GAP - ttH;
          if (top < TOOLTIP_MARGIN) top = spotBottom + TOOLTIP_GAP;
        } else {
          top = spotBottom + TOOLTIP_GAP;
          if (top + ttH > safeBottom - TOOLTIP_MARGIN) top = spotTop - TOOLTIP_GAP - ttH;
        }

        left = spotCenterX - ttW / 2;
        left = Math.max(TOOLTIP_MARGIN, Math.min(left, vw - ttW - TOOLTIP_MARGIN));
        top = Math.max(TOOLTIP_MARGIN, Math.min(top, safeBottom - ttH - TOOLTIP_MARGIN));
      }

      tt.style.top = `${top}px`;
      tt.style.left = `${left}px`;

      if (!positionedRef.current) {
        positionedRef.current = true;
        setRenderKey((k) => k + 1);
      }
    };

    // On step change, fade out briefly then reposition and fade back in
    if (stepChanged) {
      setTransitioning(true);
      // Disable CSS position transitions during the jump
      tt.style.transition = "none";
      const timer = setTimeout(() => {
        position();
        // Re-enable transitions and fade back in
        requestAnimationFrame(() => {
          setTransitioning(false);
        });
      }, 120); // brief fade-out duration
      return () => clearTimeout(timer);
    }

    position();

    const vv = window.visualViewport;
    if (vv) {
      vv.addEventListener("resize", position);
      return () => vv.removeEventListener("resize", position);
    }
  }, [mounted, isVirtual, targetRect, step.placement, stepIndex]);

  if (!mounted) return null;

  const OVERLAY_OPACITY = 0.55;

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const spotlightRect =
    !isVirtual && targetRect
      ? {
          top: targetRect.top - SPOTLIGHT_PAD,
          left: targetRect.left - SPOTLIGHT_PAD,
          width: targetRect.width + SPOTLIGHT_PAD * 2,
          height: targetRect.height + SPOTLIGHT_PAD * 2,
          borderRadius: 12,
        }
      : {
          top: vh / 2,
          left: vw / 2,
          width: 0,
          height: 0,
          borderRadius: 0,
        };

  // After first position, tooltip transitions smoothly between positions.
  // Before first position, it's invisible (no flash of wrong position).
  const isPositioned = positionedRef.current;

  return createPortal(
    <>
      {/* Backdrop click-catcher */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9998,
        }}
        onClick={onSkip}
      />

      {/* Spotlight overlay — fades between targets on step change */}
      <div
        style={{
          position: "fixed",
          top: spotlightRect.top,
          left: spotlightRect.left,
          width: spotlightRect.width,
          height: spotlightRect.height,
          borderRadius: spotlightRect.borderRadius,
          boxShadow: `0 0 0 9999px rgba(0,0,0,${transitioning ? 0.65 : OVERLAY_OPACITY})`,
          zIndex: 9999,
          pointerEvents: "none",
          transition: transitioning
            ? `box-shadow 100ms ease-out`
            : `top ${SPOTLIGHT_DURATION}ms ${EASE_OUT}, left ${SPOTLIGHT_DURATION}ms ${EASE_OUT}, width ${SPOTLIGHT_DURATION}ms ${EASE_OUT}, height ${SPOTLIGHT_DURATION}ms ${EASE_OUT}, border-radius ${SPOTLIGHT_DURATION}ms ${EASE_OUT}, box-shadow ${SPOTLIGHT_DURATION}ms ${EASE_OUT}`,
        }}
      />

      {/* Tooltip — fades between steps for clean transitions */}
      <div
        ref={tooltipRef}
        role="dialog"
        aria-label="Walkthrough"
        data-render-key={renderKey}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          zIndex: 10000,
          width: "min(360px, calc(100vw - 32px))",
          opacity: isPositioned && !transitioning ? 1 : 0,
          transform: isPositioned && !transitioning ? "scale(1) translateY(0)" : "scale(0.97) translateY(4px)",
          transition: transitioning
            ? `opacity 100ms ease-out, transform 100ms ease-out`
            : `opacity ${TOOLTIP_DURATION}ms ${EASE_OUT}, transform ${TOOLTIP_DURATION}ms ${EASE_OUT}`,
        }}
        className="relative bg-surface rounded-2xl border border-border shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onSkip}
          aria-label="Close walkthrough"
          className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-alt active:scale-[0.92] transition-all cursor-pointer z-10"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Pokemon guide + content */}
        <div className="p-5 pr-10">
          <div className="flex items-start gap-3">
            {guidePokemon && guidePokemon !== "your Pokemon" && (
              <div className="flex-shrink-0 -mt-1">
                <PokemonSprite
                  species={guidePokemon}
                  size={52}
                  animated
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-text-primary mb-1.5 leading-snug">
                {step.title}
              </h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                {step.description}
              </p>
            </div>
          </div>
        </div>
        {/* Step dots + progress */}
        <div className="px-5 pb-3 flex items-center gap-1.5">
          {Array.from({ length: totalSteps }, (_, i) => (
            <div
              key={i}
              className={`h-1 rounded-full flex-1 transition-all duration-200 ${
                i <= stepIndex ? "bg-accent" : "bg-surface-alt"
              }`}
            />
          ))}
        </div>
        <div className="flex items-center justify-between px-5 pb-4">
          <span className="text-xs text-text-tertiary tabular-nums font-medium">
            {stepIndex + 1} {t.of} {totalSteps}
          </span>
          <div className="flex items-center gap-2">
            {!isLastStep && (
              <button
                onClick={onSkip}
                aria-label="Skip all"
                className="text-xs font-medium text-text-tertiary hover:text-text-secondary px-3 py-2 rounded-lg active:scale-[0.95] transition-all cursor-pointer"
              >
                {t.skipAll}
              </button>
            )}
            <button
              onClick={onNext}
              aria-label={isLastStep ? "Finish walkthrough" : "Next step"}
              className="text-xs font-bold text-white bg-accent hover:brightness-110 px-5 py-2 rounded-lg active:scale-[0.95] transition-all cursor-pointer shadow-sm shadow-accent/25"
            >
              {isLastStep ? t.done : t.next}
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
