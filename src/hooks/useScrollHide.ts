"use client";

import { useEffect, useRef, useState } from "react";

interface UseScrollHideOptions {
  /**
   * Pixel delta required between scroll samples before we react.
   * Higher = less jitter, but slower to respond. Default 6.
   */
  threshold?: number;
  /**
   * Minimum scrollY before we ever hide. Keeps the affordance visible
   * at the very top of the page so first-paint includes it. Default 120.
   */
  minScrollY?: number;
  /**
   * Distance from the bottom of the document at which we force-reveal
   * the affordance, on the assumption the viewer has reached the
   * meaningful end of the content and CTAs are most useful here.
   * Default 240.
   */
  bottomRevealOffset?: number;
  /**
   * Optional ref to the floating element. When provided and the
   * element contains the currently focused node (`:focus-within`),
   * the hook will not hide — protects keyboard users from losing
   * focus to an off-screen transform. Optional but strongly
   * recommended for interactive docks.
   */
  containerRef?: React.RefObject<HTMLElement | null>;
}

/**
 * Smart "auto-hide on scroll-down, reveal on scroll-up" behavior for
 * floating action affordances (share dock, like/save pill, etc.).
 *
 * Returns `hidden=true` while the user is actively scrolling down past
 * `minScrollY`. Reveals on any upward scroll, near the bottom of the
 * page, or when reduced-motion is preferred (where we keep the dock
 * static rather than animate it off-screen).
 *
 * Apply the boolean to a CSS transform — never to `display: none` —
 * so the element remains in the accessibility tree and screen readers
 * can still surface it via region landmarks.
 */
export function useScrollHide(options: UseScrollHideOptions = {}): boolean {
  const {
    threshold = 6,
    minScrollY = 120,
    bottomRevealOffset = 240,
    containerRef,
  } = options;

  const [hidden, setHidden] = useState(false);
  const reducedMotionRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Honor the user's motion preference: never animate the dock off-screen
    // for users who've opted out of motion. They get a static, always-visible
    // dock — slightly more cluttered, but no surprise transforms.
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    reducedMotionRef.current = mq.matches;
    if (mq.matches) {
      // Reveal via functional update — only triggers a re-render if the
      // dock was previously hidden, so we avoid the cascading-render lint
      // warning when this hook mounts with hidden=false already.
      setHidden((h) => (h ? false : h));
      return;
    }

    const onMotionChange = (e: MediaQueryListEvent) => {
      reducedMotionRef.current = e.matches;
      if (e.matches) setHidden((h) => (h ? false : h));
    };
    mq.addEventListener("change", onMotionChange);

    let lastY = window.scrollY;
    let raf = 0;

    const onScroll = () => {
      if (reducedMotionRef.current) return;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const y = window.scrollY;
        const delta = y - lastY;

        // Always reveal near the bottom — viewers have finished reading
        // and the share/save CTAs are most useful at the end.
        const docHeight = document.documentElement.scrollHeight;
        const viewportH = window.innerHeight;
        const nearBottom = y + viewportH >= docHeight - bottomRevealOffset;

        // Protect keyboard users: if focus is inside the dock, stay visible.
        const focusInside =
          containerRef?.current?.contains(document.activeElement) ?? false;

        if (focusInside || nearBottom || y <= minScrollY) {
          setHidden(false);
          lastY = y;
          return;
        }

        if (Math.abs(delta) > threshold) {
          setHidden(delta > 0);
          lastY = y;
        }
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    // Run once to handle "user already scrolled when the component mounted".
    onScroll();

    return () => {
      window.removeEventListener("scroll", onScroll);
      mq.removeEventListener("change", onMotionChange);
      cancelAnimationFrame(raf);
    };
  }, [threshold, minScrollY, bottomRevealOffset, containerRef]);

  return hidden;
}
