"use client";

import { useState, useCallback, useEffect, useRef } from "react";

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
  onToggleCreatorMode?: () => void;
  onToggleHideSlide?: () => void;
  onMoveSlideUp?: () => void;
  onMoveSlideDown?: () => void;
}

export function useSlideNavigation({ totalSlides, enabled, resetKey, bypassFocusGuard = false, onEscape, onToggleDarkMode, onToggleFullscreen, onShowHelp, onTogglePresentation, onUndo, onRedo, onToggleCreatorMode, onToggleHideSlide, onMoveSlideUp, onMoveSlideDown }: UseSlideNavigationOptions) {
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

  // Store callbacks in refs so the keydown listener never needs re-attaching
  const callbacksRef = useRef({
    onEscape, onToggleDarkMode, onToggleFullscreen, onShowHelp,
    onTogglePresentation, onUndo, onRedo, onToggleCreatorMode,
    onToggleHideSlide, onMoveSlideUp, onMoveSlideDown,
  });
  callbacksRef.current = {
    onEscape, onToggleDarkMode, onToggleFullscreen, onShowHelp,
    onTogglePresentation, onUndo, onRedo, onToggleCreatorMode,
    onToggleHideSlide, onMoveSlideUp, onMoveSlideDown,
  };

  const totalSlidesRef = useRef(totalSlides);
  totalSlidesRef.current = totalSlides;

  const bypassFocusGuardRef = useRef(bypassFocusGuard);
  bypassFocusGuardRef.current = bypassFocusGuard;

  // Keyboard listener — only re-attaches when `enabled` changes
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const cbs = callbacksRef.current;
      const total = totalSlidesRef.current;

      // Focus guard: skip when cursor is in a textarea or input (unless bypassed for presentation mode)
      if (!bypassFocusGuardRef.current) {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === "TEXTAREA" || tag === "INPUT") return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey && cbs.onUndo) {
        e.preventDefault();
        cbs.onUndo();
        return;
      } else if ((e.ctrlKey || e.metaKey) && ((e.key === "z" && e.shiftKey) || e.key === "y") && cbs.onRedo) {
        e.preventDefault();
        cbs.onRedo();
        return;
      }

      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        withTransition(() => setCurrentSlide((prev) => Math.min(prev + 1, total - 1)));
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        withTransition(() => setCurrentSlide((prev) => Math.max(prev - 1, 0)));
      } else if (e.key === "Escape" && cbs.onEscape) {
        e.preventDefault();
        cbs.onEscape();
      } else if ((e.key === "d" || e.key === "D") && cbs.onToggleDarkMode) {
        e.preventDefault();
        cbs.onToggleDarkMode();
      } else if ((e.key === "f" || e.key === "F") && cbs.onToggleFullscreen) {
        e.preventDefault();
        cbs.onToggleFullscreen();
      } else if (e.key === "?" && cbs.onShowHelp) {
        e.preventDefault();
        cbs.onShowHelp();
      } else if ((e.key === "p" || e.key === "P") && cbs.onTogglePresentation) {
        e.preventDefault();
        cbs.onTogglePresentation();
      } else if ((e.key === "e" || e.key === "E") && cbs.onToggleCreatorMode) {
        // E = toggle edit/lock mode
        e.preventDefault();
        cbs.onToggleCreatorMode();
      } else if ((e.key === "h" || e.key === "H") && cbs.onToggleHideSlide) {
        // H = hide/show current slide
        e.preventDefault();
        cbs.onToggleHideSlide();
      } else if (e.key === "[" && cbs.onMoveSlideUp) {
        // [ = move slide earlier
        e.preventDefault();
        cbs.onMoveSlideUp();
      } else if (e.key === "]" && cbs.onMoveSlideDown) {
        // ] = move slide later
        e.preventDefault();
        cbs.onMoveSlideDown();
      } else if (e.key >= "1" && e.key <= "9") {
        // Number keys 1-9 = jump to slide
        const slideIndex = parseInt(e.key, 10) - 1;
        if (slideIndex < total) {
          e.preventDefault();
          withTransition(() => setCurrentSlide(slideIndex));
        }
      } else if (e.key === "0") {
        // 0 = jump to last slide
        e.preventDefault();
        withTransition(() => setCurrentSlide(total - 1));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enabled, withTransition]);

  // Touch swipe is handled by useSwipeNavigation on the slide container.
  // Having a second window-level handler here caused conflicts (double-firing,
  // preventDefault blocking vertical scroll in PWA, swipe eating coverage-chart
  // horizontal scroll). Removed in favour of the single container-scoped handler.

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
