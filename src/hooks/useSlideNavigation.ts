"use client";

import { useState, useCallback, useEffect } from "react";

interface UseSlideNavigationOptions {
  totalSlides: number;
  enabled: boolean;
  resetKey?: string;
  bypassFocusGuard?: boolean;
}

export function useSlideNavigation({ totalSlides, enabled, resetKey, bypassFocusGuard = false }: UseSlideNavigationOptions) {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Reset to slide 0 when team changes (resetKey), or when totalSlides changes if no resetKey
  useEffect(() => {
    setCurrentSlide(0);
  }, [resetKey ?? totalSlides]);

  // Clamp when totalSlides decreases (e.g., plan removed)
  useEffect(() => {
    setCurrentSlide((prev) => Math.min(prev, Math.max(0, totalSlides - 1)));
  }, [totalSlides]);

  const goToSlide = useCallback(
    (index: number) => {
      setCurrentSlide(Math.max(0, Math.min(index, totalSlides - 1)));
    },
    [totalSlides]
  );

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => Math.min(prev + 1, totalSlides - 1));
  }, [totalSlides]);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => Math.max(prev - 1, 0));
  }, [totalSlides]);

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
        setCurrentSlide((prev) => Math.min(prev + 1, totalSlides - 1));
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        setCurrentSlide((prev) => Math.max(prev - 1, 0));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enabled, totalSlides, bypassFocusGuard]);

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
