"use client";

import { useCallback, useEffect, useRef } from "react";

interface UseSwipeNavigationOptions {
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  /** Deliberate double-tap on non-interactive report space advances a slide. */
  onDoubleTap?: () => void;
  threshold?: number;
  enabled?: boolean;
}

/**
 * Adds horizontal swipe gesture detection for mobile slide navigation.
 * Returns a callback ref to attach to the swipeable container.
 *
 * Why a callback ref (not a regular ref + useEffect): the swipeable
 * container is conditionally rendered after the team analysis is loaded,
 * so a useEffect with [] dependency would run BEFORE the ref is populated
 * and never reattach. A callback ref fires when the element mounts and
 * unmounts, so we attach the touch listeners exactly when the container
 * is in the DOM.
 *
 * Touch listeners read callbacks via refs so they remain stable across
 * re-renders — handlers aren't torn down mid-gesture when the parent
 * component re-renders.
 */

/** Width of the edge zone (px) where browser back/forward gestures trigger on Android/iOS.
 *  Disabled in PWA standalone mode since there's no browser navigation to conflict with. */
const EDGE_GUARD = 30;
const DOUBLE_TAP_WINDOW_MS = 325;
const DOUBLE_TAP_DISTANCE_PX = 32;
const TAP_MOVE_TOLERANCE_PX = 12;

const INTERACTIVE_SELECTOR = [
  "button",
  "a",
  "input",
  "textarea",
  "select",
  '[role="button"]',
  '[role="link"]',
  '[role="tab"]',
  '[contenteditable="true"]',
  "[data-slide-navigation-ignore]",
].join(",");

function isStandalonePwa(): boolean {
  return typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(display-mode: standalone)").matches;
}

export function useSwipeNavigation({
  onSwipeLeft,
  onSwipeRight,
  onDoubleTap,
  threshold = 55,
  enabled = true,
}: UseSwipeNavigationOptions) {
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const touchEnd = useRef<{ x: number; y: number } | null>(null);
  const isDragging = useRef(false);
  const ignoreSwipe = useRef(false);
  // The nearest horizontally-scrollable ancestor under the finger at touch
  // start (e.g. the coverage-chart heatmap). We DON'T blanket-disable swipe
  // when one exists — instead we let it consume the gesture only while it has
  // room to scroll in the swipe direction, then hand off to slide navigation
  // at its edge. This is the native-carousel behaviour and is what makes
  // "swipe to the next page" reliably work even on the wide data tables.
  const innerScroller = useRef<HTMLElement | null>(null);
  // Locks the gesture to "scroll" (let the inner table scroll) or "nav"
  // (navigate slides) on the first horizontal-dominant move, so a single
  // gesture never does both.
  const gestureMode = useRef<"scroll" | "nav" | null>(null);
  const lastTap = useRef<{ time: number; x: number; y: number } | null>(null);
  const tapStartedOnInteractive = useRef(false);
  const attachedElRef = useRef<HTMLDivElement | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  // Store callbacks and config in refs — listeners never need re-attaching
  const callbacksRef = useRef({ onSwipeLeft, onSwipeRight, onDoubleTap, threshold, enabled });
  useEffect(() => {
    callbacksRef.current = { onSwipeLeft, onSwipeRight, onDoubleTap, threshold, enabled };
  }, [enabled, onDoubleTap, onSwipeLeft, onSwipeRight, threshold]);

  // Callback ref — fires when the swipeable container mounts or unmounts.
  // Attaches listeners on mount, detaches on unmount, and stays idempotent
  // if React calls it with the same element (which it normally does not,
  // but we guard against it).
  const setSwipeRef = useCallback((el: HTMLDivElement | null) => {
    if (attachedElRef.current === el) return;

    // Detach from previous element if any
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }
    attachedElRef.current = el;
    if (!el) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (!callbacksRef.current.enabled) return;
      touchEnd.current = null;
      isDragging.current = false;
      gestureMode.current = null;
      innerScroller.current = null;
      const target = e.target as HTMLElement | null;
      tapStartedOnInteractive.current = !!target?.closest(INTERACTIVE_SELECTOR);

      const startX = e.targetTouches[0].clientX;

      // Ignore swipes that start near screen edges — let the browser handle
      // back/forward navigation (Android gesture nav, iOS edge swipe).
      // Skip this guard in PWA standalone mode (no browser nav to conflict with).
      ignoreSwipe.current = false;
      if (!isStandalonePwa() && (startX < EDGE_GUARD || startX > window.innerWidth - EDGE_GUARD)) {
        ignoreSwipe.current = true;
        return;
      }

      // Record the nearest horizontally-scrollable ancestor (e.g. a coverage
      // heatmap). We no longer abort the swipe just because one exists —
      // handleTouchMove decides per-gesture whether the table still has room
      // to scroll in the swipe direction, and only then yields to it.
      let node = e.target as HTMLElement | null;
      while (node && node !== el) {
        if (node.scrollWidth > node.clientWidth + 1 && getComputedStyle(node).overflowX !== "hidden") {
          innerScroller.current = node;
          break;
        }
        node = node.parentElement;
      }

      touchStart.current = {
        x: startX,
        y: e.targetTouches[0].clientY,
      };
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!callbacksRef.current.enabled || !touchStart.current || ignoreSwipe.current) return;
      touchEnd.current = {
        x: e.targetTouches[0].clientX,
        y: e.targetTouches[0].clientY,
      };

      const deltaX = touchStart.current.x - touchEnd.current.x;
      const deltaY = touchStart.current.y - touchEnd.current.y;

      // Wait until the gesture is clearly horizontal before doing anything.
      if (Math.abs(deltaX) <= Math.abs(deltaY) || Math.abs(deltaX) <= 10) return;

      // Decide once, on the first horizontal-dominant move, whether this
      // gesture scrolls the inner table or navigates slides — then lock it so
      // a single swipe never does both.
      if (gestureMode.current === null) {
        const sc = innerScroller.current;
        if (sc) {
          const maxScroll = sc.scrollWidth - sc.clientWidth;
          // deltaX > 0 → finger moving left → "next" → table would scroll right.
          // deltaX < 0 → finger moving right → "prev" → table would scroll left.
          const canScrollInDirection =
            deltaX > 0 ? sc.scrollLeft < maxScroll - 1 : sc.scrollLeft > 1;
          gestureMode.current = canScrollInDirection ? "scroll" : "nav";
        } else {
          gestureMode.current = "nav";
        }
      }

      // Let the inner table own this gesture — don't preventDefault (so it can
      // scroll natively) and don't drag the slide.
      if (gestureMode.current === "scroll") return;

      isDragging.current = true;
      // Prevent horizontal scroll — swipe should navigate slides, not scroll
      e.preventDefault();
      // Clamp drag offset to a subtle range (-20px to 20px) with resistance
      const offset = Math.max(-20, Math.min(20, -deltaX * 0.15));
      el.style.transform = `translateX(${offset}px)`;
      el.style.transition = "none";
    };

    const handleTouchEnd = () => {
      const {
        enabled: en,
        threshold: thr,
        onSwipeLeft: swL,
        onSwipeRight: swR,
        onDoubleTap: doubleTap,
      } = callbacksRef.current;

      // A double-tap is an explicit mobile presentation gesture. Only count
      // short, stationary taps on non-interactive report space so buttons,
      // links, Pokemon cards, text fields, and scrollable charts keep their
      // native behaviour.
      if (
        en &&
        doubleTap &&
        touchStart.current &&
        !ignoreSwipe.current &&
        !tapStartedOnInteractive.current &&
        gestureMode.current !== "scroll"
      ) {
        const end = touchEnd.current ?? touchStart.current;
        const moveX = Math.abs(end.x - touchStart.current.x);
        const moveY = Math.abs(end.y - touchStart.current.y);
        if (moveX <= TAP_MOVE_TOLERANCE_PX && moveY <= TAP_MOVE_TOLERANCE_PX) {
          const now = Date.now();
          const previous = lastTap.current;
          if (
            previous &&
            now - previous.time <= DOUBLE_TAP_WINDOW_MS &&
            Math.hypot(touchStart.current.x - previous.x, touchStart.current.y - previous.y) <= DOUBLE_TAP_DISTANCE_PX
          ) {
            lastTap.current = null;
            navigator.vibrate?.(8);
            doubleTap();
          } else {
            lastTap.current = { time: now, x: touchStart.current.x, y: touchStart.current.y };
          }
        } else {
          lastTap.current = null;
        }
      }

      if (!en || !touchStart.current || !touchEnd.current || ignoreSwipe.current || gestureMode.current === "scroll") {
        touchStart.current = null;
        touchEnd.current = null;
        isDragging.current = false;
        ignoreSwipe.current = false;
        gestureMode.current = null;
        innerScroller.current = null;
        tapStartedOnInteractive.current = false;
        return;
      }

      // Snap back with smooth transition
      if (isDragging.current) {
        el.style.transition = "transform 0.25s cubic-bezier(0.32, 0.72, 0, 1)";
        el.style.transform = "";
      }

      const deltaX = touchStart.current.x - touchEnd.current.x;
      const deltaY = touchStart.current.y - touchEnd.current.y;

      // Only trigger if horizontal swipe is dominant (not vertical scroll)
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > thr) {
        // Haptic feedback if available
        if (navigator.vibrate) {
          navigator.vibrate(8);
        }

        if (deltaX > 0) {
          swL(); // swipe left = next slide
        } else {
          swR(); // swipe right = prev slide
        }
      }

      touchStart.current = null;
      touchEnd.current = null;
      isDragging.current = false;
      gestureMode.current = null;
      innerScroller.current = null;
      tapStartedOnInteractive.current = false;
    };

    el.addEventListener("touchstart", handleTouchStart, { passive: true });
    el.addEventListener("touchmove", handleTouchMove, { passive: false });
    el.addEventListener("touchend", handleTouchEnd);

    cleanupRef.current = () => {
      el.removeEventListener("touchstart", handleTouchStart);
      el.removeEventListener("touchmove", handleTouchMove);
      el.removeEventListener("touchend", handleTouchEnd);
    };
  }, []);

  return setSwipeRef;
}
