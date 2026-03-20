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
const MOBILE_BROWSER_CHROME_PAD = 60; // Extra padding for mobile browser bottom nav bar

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
  const [positioned, setPositioned] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const prevStepRef = useRef(stepIndex);
  const isVirtual = step.target === null;
  const isLastStep = stepIndex === totalSteps - 1;

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock scrolling while walkthrough is active
  useEffect(() => {
    const { style } = document.body;
    const prevOverflow = style.overflow;
    style.overflow = "hidden";

    const block = (e: Event) => e.preventDefault();
    document.addEventListener("wheel", block, { passive: false });
    document.addEventListener("touchmove", block, { passive: false });

    return () => {
      // Restore scrolling — always clean up even if component errors
      style.overflow = prevOverflow;
      document.removeEventListener("wheel", block);
      document.removeEventListener("touchmove", block);
    };
  }, []);

  // Safety: if the component unmounts for any reason, ensure body scroll is restored
  useEffect(() => {
    return () => {
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

  // Recalculate on step change, resize, scroll
  useEffect(() => {
    measureTarget();
  }, [measureTarget]);

  useEffect(() => {
    const update = () => measureTarget();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    // Re-measure when mobile browser chrome shows/hides (e.g. address bar)
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

  // Position the tooltip synchronously before paint to prevent flicker.
  // Also handles step-change resets — if stepIndex changed, we hide the tooltip
  // first (opacity 0), then reposition and reveal, all before the browser paints.
  useIsomorphicLayoutEffect(() => {
    if (!mounted) return;
    const tt = tooltipRef.current;
    if (!tt) return;

    // If step changed, immediately hide tooltip before repositioning
    const stepChanged = prevStepRef.current !== stepIndex;
    if (stepChanged) {
      prevStepRef.current = stepIndex;
      setPositioned(false);
      tt.style.opacity = "0";
    }

    const position = () => {
      tt.style.transform = "none";

      const ttW = tt.offsetWidth;
      const ttH = tt.offsetHeight;
      const vv = window.visualViewport;
      const vw = vv?.width ?? window.innerWidth;
      const vh = vv?.height ?? window.innerHeight;
      const vvOffsetTop = vv?.offsetTop ?? 0;
      const isMobile = window.innerWidth < 640;
      const bottomPad = NAVBAR_HEIGHT + (isMobile ? MOBILE_BROWSER_CHROME_PAD : 0);
      const safeBottom = vvOffsetTop + vh - bottomPad;

      if (isVirtual || !targetRect) {
        const visibleCenter = vvOffsetTop + (vh - bottomPad - ttH) / 2;
        tt.style.top = `${Math.max(TOOLTIP_MARGIN, visibleCenter)}px`;
        tt.style.left = `${Math.max(TOOLTIP_MARGIN, (vw - ttW) / 2)}px`;
      } else {
        const spotTop = targetRect.top - SPOTLIGHT_PAD;
        const spotH = targetRect.height + SPOTLIGHT_PAD * 2;
        const spotBottom = spotTop + spotH;
        const spotCenterX = targetRect.left + targetRect.width / 2;

        let top: number;
        let left: number;

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

        tt.style.top = `${top}px`;
        tt.style.left = `${left}px`;
      }

      setPositioned(true);
    };

    // If step changed, wait a frame for the new slide to render before positioning
    if (stepChanged) {
      const raf = requestAnimationFrame(() => position());
      return () => cancelAnimationFrame(raf);
    }

    // Otherwise position synchronously on layout
    position();

    // Reposition when mobile browser chrome shows/hides
    const vv = window.visualViewport;
    if (vv) {
      vv.addEventListener("resize", position);
      return () => vv.removeEventListener("resize", position);
    }
  }, [mounted, isVirtual, targetRect, step.placement, stepIndex]);

  if (!mounted) return null;

  const OVERLAY_OPACITY = 0.55;

  // Always render a single spotlight div. For virtual steps (no target) it
  // collapses to a zero-size point at the center of the viewport — the huge
  // box-shadow still covers the entire screen as a solid overlay. For targeted
  // steps it expands around the element. Because the div is always mounted,
  // CSS transitions animate smoothly between states with no flicker.
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
          // Zero-size point in center — box-shadow covers everything
          top: vh / 2,
          left: vw / 2,
          width: 0,
          height: 0,
          borderRadius: 0,
        };

  return createPortal(
    <>
      {/* Invisible click-catcher for backdrop clicks (skip on tap outside) */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9998,
        }}
        onClick={onSkip}
      />

      {/* Single spotlight — always mounted so CSS transitions work.
          Its box-shadow provides the dark overlay for the entire screen. */}
      <div
        style={{
          position: "fixed",
          top: spotlightRect.top,
          left: spotlightRect.left,
          width: spotlightRect.width,
          height: spotlightRect.height,
          borderRadius: spotlightRect.borderRadius,
          boxShadow: `0 0 0 9999px rgba(0,0,0,${OVERLAY_OPACITY})`,
          zIndex: 9999,
          pointerEvents: "none",
          transition: "top 300ms ease, left 300ms ease, width 300ms ease, height 300ms ease, border-radius 300ms ease",
        }}
      />

      {/* Tooltip card — hidden until positioned to prevent flash */}
      <div
        ref={tooltipRef}
        role="dialog"
        aria-label="Walkthrough"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          zIndex: 10000,
          width: "min(360px, calc(100vw - 32px))",
          opacity: positioned ? 1 : 0,
          transition: "opacity 150ms ease",
        }}
        className="relative bg-surface rounded-2xl border border-border shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onSkip}
          aria-label="Close walkthrough"
          className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-alt transition-colors cursor-pointer z-10"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Pokemon guide + content */}
        <div className="p-5 pr-10">
          <div className="flex items-start gap-3">
            {/* Pokemon guide sprite */}
            {guidePokemon && guidePokemon !== "your Pokemon" && (
              <div className="flex-shrink-0 -mt-1">
                <div className="relative">
                  <PokemonSprite
                    species={guidePokemon}
                    size={56}
                    animated
                  />
                  {/* Speech bubble tail */}
                  <div
                    className="absolute -right-1 top-3 w-2.5 h-2.5 bg-accent/15 rotate-45 rounded-sm"
                  />
                </div>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-text-primary mb-1.5">
                {step.title}
              </h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                {step.description}
              </p>
            </div>
          </div>
        </div>
        {/* Progress bar */}
        <div className="px-5 pb-3">
          <div className="h-1 bg-surface-alt rounded-full overflow-hidden">
            <div
              className="h-full bg-accent rounded-full transition-all duration-300"
              style={{ width: `${((stepIndex + 1) / totalSteps) * 100}%` }}
            />
          </div>
        </div>
        <div className="flex items-center justify-between px-5 pb-4">
          <span className="text-xs text-text-tertiary tabular-nums">
            {stepIndex + 1} {t.of} {totalSteps}
          </span>
          <div className="flex items-center gap-2">
            {!isLastStep && (
              <button
                onClick={onSkip}
                aria-label="Skip all"
                className="text-xs text-text-tertiary hover:text-text-secondary px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                {t.skipAll}
              </button>
            )}
            <button
              onClick={onNext}
              aria-label={isLastStep ? "Finish walkthrough" : "Next step"}
              className="text-xs font-semibold text-white bg-accent hover:bg-accent/90 px-4 py-1.5 rounded-lg transition-colors cursor-pointer"
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
