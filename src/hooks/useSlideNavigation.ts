"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { areShortcutsEnabled, subscribeShortcutsEnabled } from "@/lib/utils/keyboard-shortcuts";

/** Marks the report shell — single-character shortcuts only fire inside it. */
const SHORTCUT_SCOPE_SELECTOR = "[data-slide-shortcut-scope]";
/** Marks the scrolling slide region so arrow keys scroll it before paging. */
const SCROLL_REGION_SELECTOR = "[data-slide-scroll]";

/**
 * WCAG 2.1.4 — character shortcuts must be scoped to focus (as well as being
 * disableable). Focus on an unrelated part of the page (nav, footer, another
 * landmark) must not reach the report's letter shortcuts. Nothing focused at
 * all still counts as in scope: the report shell is the page's only interactive
 * surface at that point, and the documented shortcuts would otherwise be dead
 * on load.
 */
function isWithinShortcutScope(): boolean {
  if (typeof document === "undefined") return false;
  const active = document.activeElement as HTMLElement | null;
  if (!active || active === document.body || active === document.documentElement) return true;
  return !!active.closest?.(SHORTCUT_SCOPE_SELECTOR);
}

/** True when `el` still has room to scroll in `direction` (-1 up, 1 down). */
function canScrollFurther(el: HTMLElement, direction: 1 | -1): boolean {
  const max = el.scrollHeight - el.clientHeight;
  if (max <= 1) return false;
  return direction === -1 ? el.scrollTop > 0 : el.scrollTop < max - 1;
}

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

  // Wrap state updates in View Transitions API when available.
  // Rapid navigation can abort transitions (.ready and .finished both reject), and
  // calling startViewTransition() while the document is hidden throws synchronously.
  // Both are harmless — fall back to a plain update so the UI stays responsive.
  const withTransition = useCallback((update: () => void) => {
    if (typeof document === "undefined" || !("startViewTransition" in document) || document.visibilityState === "hidden") {
      update();
      return;
    }
    try {
      const transition = document.startViewTransition?.(update);
      transition?.ready.catch(() => { /* superseded by newer transition */ });
      transition?.finished.catch(() => { /* superseded by newer transition */ });
    } catch {
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
  useEffect(() => {
    callbacksRef.current = {
      onEscape, onToggleDarkMode, onToggleFullscreen, onShowHelp,
      onTogglePresentation, onUndo, onRedo, onToggleCreatorMode,
      onToggleHideSlide, onMoveSlideUp, onMoveSlideDown,
    };
  }, [onEscape, onMoveSlideDown, onMoveSlideUp, onRedo, onShowHelp, onToggleCreatorMode, onToggleDarkMode, onToggleFullscreen, onToggleHideSlide, onTogglePresentation, onUndo]);

  const totalSlidesRef = useRef(totalSlides);
  useEffect(() => {
    totalSlidesRef.current = totalSlides;
  }, [totalSlides]);

  const bypassFocusGuardRef = useRef(bypassFocusGuard);
  useEffect(() => {
    bypassFocusGuardRef.current = bypassFocusGuard;
  }, [bypassFocusGuard]);

  // WCAG 2.1.4 — the user can switch the single-character shortcuts off.
  // Read lazily (localStorage is unavailable during SSR) and kept in sync with
  // the toggle in the keyboard-shortcuts dialog and with other tabs.
  const shortcutsEnabledRef = useRef(true);
  useEffect(() => {
    shortcutsEnabledRef.current = areShortcutsEnabled();
    return subscribeShortcutsEnabled((value) => {
      shortcutsEnabledRef.current = value;
    });
  }, []);

  // Keyboard listener — only re-attaches when `enabled` changes
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const cbs = callbacksRef.current;
      const total = totalSlidesRef.current;

      // Never steal navigation keys from editable or composite controls.
      // Presentation mode may bypass the general focus guard for ordinary
      // buttons, but text entry and arrow-driven widgets must retain their
      // native keyboard behaviour.
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      const role = target?.getAttribute?.("role");
      const isEditable =
        tag === "TEXTAREA" ||
        tag === "INPUT" ||
        tag === "SELECT" ||
        target?.isContentEditable;
      const ownsArrowKeys = role === "radio" || role === "slider" || role === "listbox" || role === "menu";
      if (isEditable || ownsArrowKeys) return;
      if (!bypassFocusGuardRef.current && role === "tab") return;

      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey && cbs.onUndo) {
        e.preventDefault();
        cbs.onUndo();
        return;
      } else if ((e.ctrlKey || e.metaKey) && ((e.key === "z" && e.shiftKey) || e.key === "y") && cbs.onRedo) {
        e.preventDefault();
        cbs.onRedo();
        return;
      }

      // The slide body is its own scroll container on >= sm. When focus is
      // inside it and it still has somewhere to scroll, Up/Down must scroll it
      // rather than page the deck — otherwise overflowing slide content is
      // unreachable by keyboard (WCAG 2.1.1).
      const verticalDirection = e.key === "ArrowDown" ? 1 : e.key === "ArrowUp" ? -1 : 0;
      if (verticalDirection !== 0) {
        const scroller = target?.closest?.(SCROLL_REGION_SELECTOR) as HTMLElement | null;
        if (scroller && canScrollFurther(scroller, verticalDirection)) return;
      }

      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        withTransition(() => setCurrentSlide((prev) => Math.min(prev + 1, total - 1)));
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        withTransition(() => setCurrentSlide((prev) => Math.max(prev - 1, 0)));
      } else if (e.key === "Home") {
        e.preventDefault();
        withTransition(() => setCurrentSlide(0));
      } else if (e.key === "End") {
        e.preventDefault();
        withTransition(() => setCurrentSlide(Math.max(0, total - 1)));
      } else if (e.key === "Escape" && cbs.onEscape) {
        e.preventDefault();
        cbs.onEscape();
      }
      // ---- Single-character shortcuts below (WCAG 2.1.4) --------------------
      // They fire only while the report shell holds focus and only while the
      // user has left them switched on. Everything above this line is a
      // navigation key (arrows / Home / End / Escape) or a modified chord, and
      // is outside 2.1.4.
      else if (!shortcutsEnabledRef.current || !isWithinShortcutScope()) {
        return;
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
