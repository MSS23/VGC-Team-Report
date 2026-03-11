"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import type { WalkthroughStep } from "@/hooks/useWalkthrough";
import { PokemonSprite } from "@/components/report/PokemonSprite";
import { useTranslation } from "@/lib/i18n";

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
      style.overflow = prevOverflow;
      document.removeEventListener("wheel", block);
      document.removeEventListener("touchmove", block);
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
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
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

  // Position the tooltip after render using layout effect
  useEffect(() => {
    if (!mounted) return;
    const tt = tooltipRef.current;
    if (!tt) return;

    const position = () => {
      // Clear the initial CSS centering transform so calculated values work
      tt.style.transform = "none";

      const ttW = tt.offsetWidth;
      const ttH = tt.offsetHeight;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const safeBottom = vh - NAVBAR_HEIGHT;

      if (isVirtual || !targetRect) {
        // Center on screen above navbar
        tt.style.top = `${Math.max(TOOLTIP_MARGIN, (safeBottom - ttH) / 2)}px`;
        tt.style.left = `${Math.max(TOOLTIP_MARGIN, (vw - ttW) / 2)}px`;
        return;
      }

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
    };

    // Position on next frame to ensure layout is computed
    requestAnimationFrame(position);
  }, [mounted, isVirtual, targetRect, step.placement]);

  if (!mounted) return null;

  const spotlightStyle: React.CSSProperties | undefined =
    !isVirtual && targetRect
      ? {
          position: "fixed",
          top: targetRect.top - SPOTLIGHT_PAD,
          left: targetRect.left - SPOTLIGHT_PAD,
          width: targetRect.width + SPOTLIGHT_PAD * 2,
          height: targetRect.height + SPOTLIGHT_PAD * 2,
          borderRadius: 12,
          boxShadow: "0 0 0 9999px rgba(0,0,0,0.55)",
          zIndex: 9999,
          pointerEvents: "none" as const,
          transition: "all 300ms ease",
        }
      : undefined;

  return createPortal(
    <>
      {/* Full-screen backdrop — always visible */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9998,
          backgroundColor: "rgba(0,0,0,0.5)",
        }}
        onClick={onSkip}
      />

      {/* Spotlight cutout (brighter hole over targeted element) */}
      {spotlightStyle && (
        <div style={spotlightStyle} />
      )}

      {/* Tooltip card — starts centered via CSS, then repositioned by effect */}
      <div
        ref={tooltipRef}
        role="dialog"
        aria-label="Walkthrough"
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 10000,
          width: "min(360px, calc(100vw - 32px))",
        }}
        className="bg-surface rounded-2xl border border-border shadow-xl animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Pokemon guide + content */}
        <div className="p-5">
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
