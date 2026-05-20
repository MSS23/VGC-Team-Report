"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface UseIdleHideOptions {
  /** Milliseconds of inactivity before hiding (after first interaction). Default 4000. */
  delay?: number;
  /**
   * Milliseconds the dock stays visible on initial mount before auto-hiding
   * if no interaction occurs ("flash on entry" hint). Default 2000.
   * Set to 0 to disable the initial flash.
   */
  initialFlashMs?: number;
  /**
   * Optional ref to the floating element. When provided, the hook stays
   * visible while focus is inside the element (keyboard users) or while
   * the user is actively hovering inside it (desktop).
   */
  containerRef?: React.RefObject<HTMLElement | null>;
  /** Disable the hook entirely. When true, never hides. */
  enabled?: boolean;
}

/**
 * Drives Instagram-style "flash then collapse" behavior on floating
 * docks across both touch and desktop devices.
 *
 * Behavior:
 *  - On mount: dock starts visible.
 *  - After `initialFlashMs` it hides — the "brief flash" hint.
 *  - Stays hidden until the user **deliberately** engages with the
 *    dock: hovering it, focusing it, or tapping the peek tab (the
 *    parent component is responsible for re-revealing via its own
 *    `userCollapsed` state in response to a tap).
 *  - Once revealed by hover/focus, schedules another hide after
 *    `delay` ms when the pointer leaves and focus is elsewhere.
 *  - `prefers-reduced-motion`: bypassed entirely (always visible,
 *    never hides) so users with motion sensitivity get a static dock.
 *
 * Deliberately does NOT listen for document-wide `pointermove`,
 * `touchmove`, `scroll`, or `keydown` — those would re-reveal the
 * dock every time the user moves the mouse to read, which is exactly
 * the intrusive behavior we're trying to fix. `useScrollHide` still
 * handles the scroll-driven reveal for the bottom-of-page CTA case.
 *
 * Apply the returned `hidden` boolean to a CSS transform — never to
 * `display: none` — so the dock stays in the accessibility tree.
 */
interface IdleHideHandle {
  /** True when the hook has decided to hide the dock. */
  hidden: boolean;
  /**
   * Manually re-reveal the dock (e.g. when a peek tab is tapped on touch
   * devices, where no `pointerenter` fires). Resets the hide timer to the
   * standard `delay` so the dock stays open briefly before auto-hiding
   * again.
   */
  reveal: () => void;
}

export function useTouchIdleHide(options: UseIdleHideOptions = {}): IdleHideHandle {
  const { delay = 4000, initialFlashMs = 2000, containerRef, enabled = true } = options;
  const [hidden, setHidden] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pointerInsideRef = useRef(false);
  const delayRef = useRef(delay);
  delayRef.current = delay;
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  // Cleanup any pending hide timer. Defined outside the main effect so
  // `reveal()` can call it without depending on closure scope.
  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Schedule a future hide. Read from refs so the callback never goes stale
  // when the hook's options change.
  const scheduleHide = useCallback((ms: number) => {
    clearTimer();
    timerRef.current = setTimeout(() => {
      const focusInside =
        containerRef?.current?.contains(document.activeElement) ?? false;
      if (focusInside) return;
      if (pointerInsideRef.current) return;
      setHidden(true);
    }, ms);
  }, [clearTimer, containerRef]);

  /** Imperatively re-reveal — used by parents when the user taps a peek tab.
   *  Touch devices don't fire `pointerenter` from a tap on a sibling element,
   *  so the hook can't infer the reveal on its own. */
  const reveal = useCallback(() => {
    if (!enabledRef.current) return;
    setHidden(false);
    scheduleHide(delayRef.current);
  }, [scheduleHide]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!enabled) {
      setHidden(false);
      return;
    }

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) {
      // Honor the user's motion preference: never auto-transform off-screen.
      setHidden(false);
      return;
    }

    // Start visible. Schedule the initial flash hide if configured.
    setHidden(false);
    if (initialFlashMs > 0) {
      scheduleHide(initialFlashMs);
    }

    // Container-scoped events keep the dock open while hovered/focused
    // and re-arm the hide timer on the way out.
    const el = containerRef?.current;
    const onPointerEnter = () => {
      pointerInsideRef.current = true;
      clearTimer();
      setHidden(false);
    };
    const onPointerLeave = () => {
      pointerInsideRef.current = false;
      scheduleHide(delay);
    };
    const onFocusIn = () => {
      clearTimer();
      setHidden(false);
    };
    const onFocusOut = () => {
      // Defer to next tick so document.activeElement reflects the new focus target.
      setTimeout(() => {
        const focusInside =
          containerRef?.current?.contains(document.activeElement) ?? false;
        if (!focusInside && !pointerInsideRef.current) {
          scheduleHide(delay);
        }
      }, 0);
    };
    if (el) {
      el.addEventListener("pointerenter", onPointerEnter);
      el.addEventListener("pointerleave", onPointerLeave);
      el.addEventListener("focusin", onFocusIn);
      el.addEventListener("focusout", onFocusOut);
    }

    return () => {
      if (el) {
        el.removeEventListener("pointerenter", onPointerEnter);
        el.removeEventListener("pointerleave", onPointerLeave);
        el.removeEventListener("focusin", onFocusIn);
        el.removeEventListener("focusout", onFocusOut);
      }
      clearTimer();
    };
  }, [delay, initialFlashMs, containerRef, enabled, clearTimer, scheduleHide]);

  return { hidden, reveal };
}
