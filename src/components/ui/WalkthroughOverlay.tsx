"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import type { WalkthroughStep } from "@/hooks/useWalkthrough";

interface WalkthroughOverlayProps {
  step: WalkthroughStep;
  stepIndex: number;
  totalSteps: number;
  onNext: () => void;
  onSkip: () => void;
}

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const SPOTLIGHT_PAD = 8;
const TOOLTIP_MARGIN = 12;
const TOOLTIP_GAP = 12;

export function WalkthroughOverlay({
  step,
  stepIndex,
  totalSteps,
  onNext,
  onSkip,
}: WalkthroughOverlayProps) {
  const [mounted, setMounted] = useState(false);
  const [targetRect, setTargetRect] = useState<Rect | null>(null);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const tooltipRef = useRef<HTMLDivElement>(null);
  const isVirtual = step.target === null;
  const isLastStep = stepIndex === totalSteps - 1;

  useEffect(() => {
    setMounted(true);
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

  // Position tooltip relative to target
  const positionTooltip = useCallback(() => {
    requestAnimationFrame(() => {
      const tt = tooltipRef.current;
      if (!tt) return;
      const ttW = tt.offsetWidth;
      const ttH = tt.offsetHeight;
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      if (isVirtual || !targetRect) {
        // Centered on screen
        setTooltipStyle({
          position: "fixed",
          top: `${Math.max(TOOLTIP_MARGIN, (vh - ttH) / 2)}px`,
          left: `${Math.max(TOOLTIP_MARGIN, (vw - ttW) / 2)}px`,
        });
        return;
      }

      const spotTop = targetRect.top - SPOTLIGHT_PAD;
      const spotLeft = targetRect.left - SPOTLIGHT_PAD;
      const spotW = targetRect.width + SPOTLIGHT_PAD * 2;
      const spotH = targetRect.height + SPOTLIGHT_PAD * 2;
      const spotBottom = spotTop + spotH;
      const spotCenterX = spotLeft + spotW / 2;

      let top: number;
      let left: number;

      if (step.placement === "above") {
        top = spotTop - TOOLTIP_GAP - ttH;
        if (top < TOOLTIP_MARGIN) {
          // Fall back to below
          top = spotBottom + TOOLTIP_GAP;
        }
      } else {
        top = spotBottom + TOOLTIP_GAP;
        if (top + ttH > vh - TOOLTIP_MARGIN) {
          // Fall back to above
          top = spotTop - TOOLTIP_GAP - ttH;
        }
      }

      left = spotCenterX - ttW / 2;
      // Clamp horizontal
      left = Math.max(TOOLTIP_MARGIN, Math.min(left, vw - ttW - TOOLTIP_MARGIN));
      // Clamp vertical
      top = Math.max(TOOLTIP_MARGIN, Math.min(top, vh - ttH - TOOLTIP_MARGIN));

      setTooltipStyle({ position: "fixed", top: `${top}px`, left: `${left}px` });
    });
  }, [isVirtual, targetRect, step.placement]);

  // Recalculate on step change
  useEffect(() => {
    measureTarget();
  }, [measureTarget]);

  // Position tooltip after target measured
  useEffect(() => {
    positionTooltip();
  }, [positionTooltip, targetRect]);

  // Resize and scroll listeners
  useEffect(() => {
    const update = () => {
      measureTarget();
    };
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
          boxShadow: "0 0 0 9999px rgba(0,0,0,0.5)",
          zIndex: 9999,
          pointerEvents: "none" as const,
          transition: "all 300ms ease",
        }
      : undefined;

  return createPortal(
    <>
      {/* Backdrop — for virtual steps or if target not found */}
      {(isVirtual || !targetRect) && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 9998, backgroundColor: "rgba(0,0,0,0.5)" }}
          onClick={onSkip}
        />
      )}

      {/* Spotlight cutout */}
      {spotlightStyle && (
        <div style={spotlightStyle} />
      )}

      {/* Click catcher behind tooltip for non-virtual steps */}
      {!isVirtual && targetRect && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 9998 }}
          onClick={onSkip}
        />
      )}

      {/* Tooltip card */}
      <div
        ref={tooltipRef}
        style={{
          ...tooltipStyle,
          zIndex: 10000,
          width: "min(340px, calc(100vw - 24px))",
        }}
        className="bg-surface rounded-2xl border border-border shadow-xl animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5">
          <h3 className="text-base font-bold text-text-primary mb-1.5">
            {step.title}
          </h3>
          <p className="text-sm text-text-secondary leading-relaxed">
            {step.description}
          </p>
        </div>
        <div className="flex items-center justify-between px-5 pb-4">
          <span className="text-xs text-text-tertiary tabular-nums">
            {stepIndex + 1} / {totalSteps}
          </span>
          <div className="flex items-center gap-2">
            {!isLastStep && (
              <button
                onClick={onSkip}
                className="text-xs text-text-tertiary hover:text-text-secondary px-3 py-1.5 rounded-lg transition-colors"
              >
                Skip
              </button>
            )}
            <button
              onClick={onNext}
              className="text-xs font-semibold text-white bg-accent hover:bg-accent/90 px-4 py-1.5 rounded-lg transition-colors"
            >
              {isLastStep ? "Done" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
