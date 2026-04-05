"use client";

import { useRef, useEffect } from "react";

interface UseSwipeNavigationOptions {
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  threshold?: number;
  enabled?: boolean;
}

/**
 * Adds horizontal swipe gesture detection for mobile slide navigation.
 * Returns a ref to attach to the swipeable container.
 * Includes visual drag feedback and optional haptic vibration.
 *
 * Touch listeners attach ONCE and read callbacks via refs so they are
 * never torn down mid-gesture when the parent re-renders.
 */

/** Width of the edge zone (px) where browser back/forward gestures trigger on Android/iOS.
 *  Disabled in PWA standalone mode since there's no browser navigation to conflict with. */
const EDGE_GUARD = 30;

function isStandalonePwa(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(display-mode: standalone)").matches;
}

export function useSwipeNavigation({
  onSwipeLeft,
  onSwipeRight,
  threshold = 55,
  enabled = true,
}: UseSwipeNavigationOptions) {
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const touchEnd = useRef<{ x: number; y: number } | null>(null);
  const isDragging = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const ignoreSwipe = useRef(false);

  // Store callbacks and config in refs — listeners never need re-attaching
  const callbacksRef = useRef({ onSwipeLeft, onSwipeRight, threshold, enabled });
  callbacksRef.current = { onSwipeLeft, onSwipeRight, threshold, enabled };

  // Single useEffect — attaches once when containerRef is set, never tears down mid-gesture
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (!callbacksRef.current.enabled) return;
      touchEnd.current = null;
      isDragging.current = false;

      const startX = e.targetTouches[0].clientX;

      // Ignore swipes that start near screen edges — let the browser handle
      // back/forward navigation (Android gesture nav, iOS edge swipe).
      // Skip this guard in PWA standalone mode (no browser nav to conflict with).
      ignoreSwipe.current = false;
      if (!isStandalonePwa() && (startX < EDGE_GUARD || startX > window.innerWidth - EDGE_GUARD)) {
        ignoreSwipe.current = true;
        return;
      }

      // Don't hijack swipes that start inside a horizontally scrollable element
      // (e.g. coverage chart tables with overflow-x-auto)
      let node = e.target as HTMLElement | null;
      while (node && node !== el) {
        if (node.scrollWidth > node.clientWidth + 1 && getComputedStyle(node).overflowX !== "hidden") {
          ignoreSwipe.current = true;
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

      // Only apply visual feedback if horizontal swipe is dominant
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
        isDragging.current = true;
        // Prevent horizontal scroll — swipe should navigate slides, not scroll
        e.preventDefault();
        // Clamp drag offset to a subtle range (-20px to 20px) with resistance
        const offset = Math.max(-20, Math.min(20, -deltaX * 0.15));
        el.style.transform = `translateX(${offset}px)`;
        el.style.transition = "none";
      }
    };

    const handleTouchEnd = () => {
      const { enabled: en, threshold: thr, onSwipeLeft: swL, onSwipeRight: swR } = callbacksRef.current;

      if (!en || !touchStart.current || !touchEnd.current || ignoreSwipe.current) {
        touchStart.current = null;
        touchEnd.current = null;
        isDragging.current = false;
        ignoreSwipe.current = false;
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
    };

    el.addEventListener("touchstart", handleTouchStart, { passive: true });
    el.addEventListener("touchmove", handleTouchMove, { passive: false });
    el.addEventListener("touchend", handleTouchEnd);

    return () => {
      el.removeEventListener("touchstart", handleTouchStart);
      el.removeEventListener("touchmove", handleTouchMove);
      el.removeEventListener("touchend", handleTouchEnd);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps — refs are stable, listeners attach once

  return containerRef;
}
