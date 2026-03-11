"use client";

import { useState, useCallback, useEffect } from "react";

interface UseSlideNavigationOptions {
  totalSlides: number;
  enabled: boolean;
  resetKey?: string;
  bypassFocusGuard?: boolean;
  onEscape?: () => void;
  onToggleDarkMode?: () => void;
  onToggleFullscreen?: () => void;
  onShowHelp?: () => void;
  onTogglePresentation?: () => void;
}

export function useSlideNavigation({ totalSlides, enabled, resetKey, bypassFocusGuard = false, onEscape, onToggleDarkMode, onToggleFullscreen, onShowHelp, onTogglePresentation }: UseSlideNavigationOptions) {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Reset to slide 0 when team changes (resetKey), or when totalSlides changes if no resetKey
  useEffect(() => {
    setCurrentSlide(0);
  }, [resetKey ?? totalSlides]);

  // Clamp when totalSlides decreases (e.g., plan removed)
  useEffect(() => {
    setCurrentSlide((prev) => Math.min(prev, Math.max(0, totalSlides - 1)));
  }, [totalSlides]);

  // Wrap state updates in View Transitions API when available
  const withTransition = useCallback((update: () => void) => {
    if (typeof document !== "undefined" && "startViewTransition" in document) {
      (document as unknown as { startViewTransition: (cb: () => void) => void }).startViewTransition(update);
    } else {
      update();
    }
  }, []);

  const goToSlide = useCallback(
    (index: number) => {
      withTransition(() => setCurrentSlide(Math.max(0, Math.min(index, totalSlides - 1))));
    },
    [totalSlides, withTransition]
  );

  const nextSlide = useCallback(() => {
    withTransition(() => setCurrentSlide((prev) => Math.min(prev + 1, totalSlides - 1)));
  }, [totalSlides, withTransition]);

  const prevSlide = useCallback(() => {
    withTransition(() => setCurrentSlide((prev) => Math.max(prev - 1, 0)));
  }, [totalSlides, withTransition]);

  // Keyboard listener
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Focus guard: skip when cursor is in a textarea or input (unless bypassed for presentation mode)
      if (!bypassFocusGuard) {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === "TEXTAREA" || tag === "INPUT") return;
      }

      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        withTransition(() => setCurrentSlide((prev) => Math.min(prev + 1, totalSlides - 1)));
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        withTransition(() => setCurrentSlide((prev) => Math.max(prev - 1, 0)));
      } else if (e.key === "Escape" && onEscape) {
        e.preventDefault();
        onEscape();
      } else if ((e.key === "d" || e.key === "D") && onToggleDarkMode) {
        e.preventDefault();
        onToggleDarkMode();
      } else if ((e.key === "f" || e.key === "F") && onToggleFullscreen) {
        e.preventDefault();
        onToggleFullscreen();
      } else if (e.key === "?" && onShowHelp) {
        e.preventDefault();
        onShowHelp();
      } else if ((e.key === "p" || e.key === "P") && onTogglePresentation) {
        e.preventDefault();
        onTogglePresentation();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enabled, totalSlides, bypassFocusGuard, withTransition, onEscape, onToggleDarkMode, onToggleFullscreen, onShowHelp, onTogglePresentation]);

  // Touch swipe listener
  useEffect(() => {
    if (!enabled) return;

    let startX = 0;
    let startY = 0;
    let startTime = 0;

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      startX = touch.clientX;
      startY = touch.clientY;
      startTime = Date.now();
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - startX;
      const deltaY = touch.clientY - startY;
      const elapsed = Date.now() - startTime;

      // Thresholds: 50px min, 300ms max, within 30-degree angle from horizontal
      if (elapsed > 300 || Math.abs(deltaX) < 50) return;
      const angle = Math.abs(Math.atan2(deltaY, deltaX) * (180 / Math.PI));
      if (angle > 30 && angle < 150) return; // too vertical

      if (deltaX < 0) {
        // Swipe left → next slide
        withTransition(() => setCurrentSlide((prev) => Math.min(prev + 1, totalSlides - 1)));
      } else {
        // Swipe right → prev slide
        withTransition(() => setCurrentSlide((prev) => Math.max(prev - 1, 0)));
      }
    };

    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [enabled, totalSlides, withTransition]);

  return {
    currentSlide,
    totalSlides,
    goToSlide,
    nextSlide,
    prevSlide,
    isFirst: currentSlide === 0,
    isLast: currentSlide === totalSlides - 1,
  };
}
