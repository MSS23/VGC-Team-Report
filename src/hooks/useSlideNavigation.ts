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
  onUndo?: () => void;
  onRedo?: () => void;
}

export function useSlideNavigation({ totalSlides, enabled, resetKey, bypassFocusGuard = false, onEscape, onToggleDarkMode, onToggleFullscreen, onShowHelp, onTogglePresentation, onUndo, onRedo }: UseSlideNavigationOptions) {
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

      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey && onUndo) {
        e.preventDefault();
        onUndo();
        return;
      } else if ((e.ctrlKey || e.metaKey) && ((e.key === "z" && e.shiftKey) || e.key === "y") && onRedo) {
        e.preventDefault();
        onRedo();
        return;
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
  }, [enabled, totalSlides, bypassFocusGuard, withTransition, onEscape, onToggleDarkMode, onToggleFullscreen, onShowHelp, onTogglePresentation, onUndo, onRedo]);

  // Touch swipe listener with velocity-based detection
  useEffect(() => {
    if (!enabled) return;

    let startX = 0;
    let startY = 0;
    let startTime = 0;
    let tracking = false; // true once we commit to a horizontal gesture
    let decided = false;  // true once direction (horizontal vs vertical) is locked

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      startX = touch.clientX;
      startY = touch.clientY;
      startTime = Date.now();
      tracking = false;
      decided = false;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (decided && !tracking) return; // vertical scroll — let it go

      const touch = e.touches[0];
      const dx = Math.abs(touch.clientX - startX);
      const dy = Math.abs(touch.clientY - startY);

      // Decide direction after 10px of movement
      if (!decided && (dx > 10 || dy > 10)) {
        decided = true;
        tracking = dx > dy; // horizontal wins
      }

      // Once we're tracking a horizontal swipe, prevent vertical scroll
      if (tracking) {
        e.preventDefault();
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!tracking) return; // was a vertical scroll, ignore

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - startX;
      const absDeltaX = Math.abs(deltaX);
      const elapsed = Math.max(Date.now() - startTime, 1);
      const velocity = absDeltaX / elapsed; // px/ms

      // Navigate if: distance-based (≥40px) OR velocity-based (fast flick ≥0.3 px/ms with ≥20px)
      const distanceSwipe = absDeltaX >= 40;
      const velocitySwipe = velocity >= 0.3 && absDeltaX >= 20;

      if (distanceSwipe || velocitySwipe) {
        if (deltaX < 0) {
          withTransition(() => setCurrentSlide((prev) => Math.min(prev + 1, totalSlides - 1)));
        } else {
          withTransition(() => setCurrentSlide((prev) => Math.max(prev - 1, 0)));
        }
      }
    };

    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
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
