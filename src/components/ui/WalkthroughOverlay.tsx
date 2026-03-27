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
  onPrev?: () => void;
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

export function WalkthroughOverlay({
  step,
  stepIndex,
  totalSteps,
  onNext,
  onPrev,
  onSkip,
  guidePokemon,
}: WalkthroughOverlayProps) {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [spotlightRect, setSpotlightRect] = useState<Rect | null>(null);
  const isVirtual = step.target === null;
  const isLastStep = stepIndex === totalSteps - 1;

  useEffect(() => { setMounted(true); }, []);

  // Lock body scrolling
  useEffect(() => {
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    };
  }, []);

  // Keyboard handling
  useEffect(() => {
    const NAV_KEYS = new Set(["Escape", "Enter", " ", "ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp"]);
    const handleKey = (e: KeyboardEvent) => {
      if (!NAV_KEYS.has(e.key)) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      if (e.key === "Escape") onSkip();
      else if (["Enter", " ", "ArrowRight", "ArrowDown"].includes(e.key)) onNext();
      else if (["ArrowLeft", "ArrowUp"].includes(e.key)) onPrev?.();
    };
    window.addEventListener("keydown", handleKey, { capture: true });
    return () => window.removeEventListener("keydown", handleKey, { capture: true });
  }, [onNext, onSkip, onPrev]);

  // Measure target and position tooltip — reads DOM directly, no stale state
  const positionTooltip = useCallback(() => {
    const tt = tooltipRef.current;
    if (!tt) return;

    let targetRect: Rect | null = null;
    if (!isVirtual) {
      const el = document.querySelector(`[data-walkthrough="${step.target}"]`);
      if (el) {
        const r = el.getBoundingClientRect();
        targetRect = { top: r.top, left: r.left, width: r.width, height: r.height };
      }
    }

    setSpotlightRect(targetRect);

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

    if (!targetRect) {
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
  }, [step.target, step.placement, isVirtual]);

  // On step change: fade out → wait for slide render → position → fade in
  useEffect(() => {
    if (!mounted) return;

    // Immediately hide
    setVisible(false);

    // Wait for slide navigation + React render, then try to find target and position
    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 10;

    const tryPosition = () => {
      if (cancelled) return;
      attempts++;

      const tt = tooltipRef.current;
      if (!tt) {
        if (attempts < maxAttempts) setTimeout(tryPosition, 50);
        return;
      }

      // For virtual steps (no target), position immediately
      if (isVirtual) {
        positionTooltip();
        requestAnimationFrame(() => { if (!cancelled) setVisible(true); });
        return;
      }

      // For targeted steps, wait until the element exists
      const el = document.querySelector(`[data-walkthrough="${step.target}"]`);
      if (el) {
        positionTooltip();
        requestAnimationFrame(() => { if (!cancelled) setVisible(true); });
      } else if (attempts < maxAttempts) {
        // Element not in DOM yet (slide still rendering) — retry
        setTimeout(tryPosition, 100);
      } else {
        // Give up — position anyway (centered fallback) and show
        positionTooltip();
        requestAnimationFrame(() => { if (!cancelled) setVisible(true); });
      }
    };

    // Start after a brief delay for the fade-out to register
    const timer = setTimeout(tryPosition, 150);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [mounted, stepIndex, step.target, isVirtual, positionTooltip]);

  // Reposition on resize/scroll without fading
  useEffect(() => {
    if (!visible) return;
    const update = () => positionTooltip();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [visible, positionTooltip]);

  if (!mounted) return null;

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const spot = spotlightRect
    ? {
        top: spotlightRect.top - SPOTLIGHT_PAD,
        left: spotlightRect.left - SPOTLIGHT_PAD,
        width: spotlightRect.width + SPOTLIGHT_PAD * 2,
        height: spotlightRect.height + SPOTLIGHT_PAD * 2,
        borderRadius: 12,
      }
    : { top: vh / 2, left: vw / 2, width: 0, height: 0, borderRadius: 0 };

  return createPortal(
    <>
      {/* Backdrop */}
      <div style={{ position: "fixed", inset: 0, zIndex: 9998 }} onClick={onSkip} />

      {/* Spotlight */}
      <div
        style={{
          position: "fixed",
          top: spot.top,
          left: spot.left,
          width: spot.width,
          height: spot.height,
          borderRadius: spot.borderRadius,
          boxShadow: `0 0 0 9999px rgba(0,0,0,${visible ? 0.55 : 0.65})`,
          zIndex: 9999,
          pointerEvents: "none",
          transition: "top 250ms ease-out, left 250ms ease-out, width 250ms ease-out, height 250ms ease-out, box-shadow 200ms ease-out",
        }}
      />

      {/* Tooltip */}
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
          opacity: visible ? 1 : 0,
          transform: visible ? "scale(1) translateY(0)" : "scale(0.97) translateY(4px)",
          transition: "opacity 200ms ease-out, transform 200ms ease-out",
        }}
        className="bg-surface rounded-2xl border border-border shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onSkip}
          aria-label="Close"
          className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-alt active:scale-[0.92] transition-all cursor-pointer z-10"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Content */}
        <div className="p-5 pr-10">
          <div className="flex items-start gap-3">
            {guidePokemon && guidePokemon !== "your Pokemon" && (
              <div className="flex-shrink-0 -mt-1">
                <PokemonSprite species={guidePokemon} size={52} animated />
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

        {/* Progress bar */}
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

        {/* Navigation */}
        <div className="flex items-center justify-between px-5 pb-4">
          <div className="flex items-center gap-2">
            {stepIndex > 0 && onPrev ? (
              <button
                onClick={onPrev}
                className="text-xs font-medium text-text-tertiary hover:text-text-secondary px-3 py-2 rounded-lg active:scale-[0.95] transition-all cursor-pointer"
              >
                &larr; {t.prev}
              </button>
            ) : (
              <span className="text-xs text-text-tertiary tabular-nums font-medium">
                {stepIndex + 1} {t.of} {totalSteps}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {!isLastStep && (
              <button
                onClick={onSkip}
                className="text-xs font-medium text-text-tertiary hover:text-text-secondary px-3 py-2 rounded-lg active:scale-[0.95] transition-all cursor-pointer"
              >
                {t.skipAll}
              </button>
            )}
            <button
              onClick={onNext}
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
