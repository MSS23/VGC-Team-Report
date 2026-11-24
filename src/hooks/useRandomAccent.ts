"use client";

import { useEffect } from "react";
import { applyRandomAccent } from "@/lib/utils/random-accent";

/**
 * Apply a random accent palette in a post-mount effect, with no cleanup —
 * the same `useEffect(() => { applyRandomAccent(); }, [...])` every page had
 * inline. Pass values to re-roll the palette whenever one changes, for pages
 * whose effect listed them (e.g. `useRandomAccent(posthog)`). The number of
 * arguments must stay fixed per call site, as with any dependency list.
 */
export function useRandomAccent(...rerunOn: unknown[]): void {
  // eslint-disable-next-line react-hooks/exhaustive-deps -- rerunOn IS the caller's dependency list
  useEffect(() => { applyRandomAccent(); }, rerunOn);
}
