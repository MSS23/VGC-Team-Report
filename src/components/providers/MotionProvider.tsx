"use client";

import { MotionConfig } from "motion/react";

/**
 * Site-wide reduced-motion gate (WCAG 2.3.3 / 2.2.2).
 *
 * Every `motion/react` animation in the tree inherits `reducedMotion="user"`
 * from this single provider, so entrance/transform animations are skipped
 * automatically when the visitor has "reduce motion" set at the OS level.
 * CSS animations are already handled by the `prefers-reduced-motion` block in
 * `globals.css`; this covers the JS-driven half that CSS can't reach.
 *
 * It is a Client Component purely because MotionConfig uses React context —
 * it renders no markup of its own, so `layout.tsx` stays a Server Component
 * (same pattern as PostHogProvider / ClarityProvider).
 */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
