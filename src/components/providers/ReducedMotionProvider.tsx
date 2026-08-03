"use client";

import { MotionConfig } from "motion/react";
import type { ReactNode } from "react";

/**
 * Makes every `motion.*` element below it honour `prefers-reduced-motion`.
 *
 * The `@media (prefers-reduced-motion: reduce)` block in globals.css only
 * neutralises CSS animations and transitions. framer-motion drives `initial`
 * / `animate` from JavaScript, writing inline `transform` and `opacity` per
 * frame, so the media query never reaches it — entrance animations played in
 * full for users who had explicitly asked for reduced motion.
 *
 * `reducedMotion="user"` reads the same media query through framer's own
 * `useReducedMotion` and, when it matches, replaces the transition for every
 * positional/transform key (x, y, scale, rotate, width, height, top, left…)
 * with `{ type: false }` — the value snaps straight to its target. Opacity is
 * deliberately left animating, which is the WCAG-preferred behaviour, and it
 * guarantees nothing is left parked off-screen at its `initial` offset.
 *
 * Mount this once per top-level client tree that contains motion elements
 * rather than repeating `useReducedMotion()` at every call site.
 */
export function ReducedMotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
