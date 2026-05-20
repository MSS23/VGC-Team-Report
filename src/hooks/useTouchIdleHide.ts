"use client";

import { useEffect, useRef, useState } from "react";

interface UseTouchIdleHideOptions {
  /** Milliseconds of touch/scroll inactivity before hiding. Default 4000. */
  delay?: number;
  /**
   * Optional ref to the floating element. When provided, the hook stays
   * visible while focus is inside the element (keyboard users) or while
   * the user is actively pointing inside it.
   */
  containerRef?: React.RefObject<HTMLElement | null>;
  /** Disable the hook entirely (e.g. desktop). When true, never hides. */
  enabled?: boolean;
}

/**
 * Hides a floating dock after `delay` ms of touch inactivity on
 * touch-first devices. Any touch, tap, scroll, or pointer move resets
 * the timer and re-reveals the dock. Designed to declutter the mobile/PWA
 * presentation experience where persistent affordances feel intrusive.
 *
 * Desktop (no coarse pointer) is opted out by default — desktop already
 * has the existing scroll-driven `useScrollHide` for the same effect.
 *
 * Apply the returned `hidden` boolean to a CSS transform — never to
 * `display: none` — so the dock remains in the accessibility tree.
 */
export function useTouchIdleHide(options: UseTouchIdleHideOptions = {}): boolean {
  const { delay = 4000, containerRef, enabled = true } = options;
  const [hidden, setHidden] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!enabled) {
      setHidden(false);
      return;
    }

    // Only engage on touch-first devices. Desktops with a mouse keep the
    // dock visible (covered by useScrollHide elsewhere).
    const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
    if (!coarsePointer) {
      setHidden(false);
      return;
    }

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) {
      // Honor the user's motion preference: never auto-transform off-screen.
      setHidden(false);
      return;
    }

    const reveal = () => {
      setHidden(false);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        // Don't hide while keyboard focus is inside the dock.
        const focusInside =
          containerRef?.current?.contains(document.activeElement) ?? false;
        if (focusInside) return;
        setHidden(true);
      }, delay);
    };

    reveal();

    // Reset the timer on any meaningful user interaction.
    const events: Array<keyof DocumentEventMap> = [
      "touchstart",
      "touchmove",
      "scroll",
      "pointermove",
      "keydown",
    ];
    for (const evt of events) {
      document.addEventListener(evt, reveal, { passive: true });
    }

    return () => {
      for (const evt of events) {
        document.removeEventListener(evt, reveal);
      }
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [delay, containerRef, enabled]);

  return hidden;
}
