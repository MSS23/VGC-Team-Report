"use client";

import { createContext, useContext } from "react";
import type { VersionDiff } from "@/lib/utils/version-diff";

export interface VersionDiffState {
  /** Active diff comparison, or null if not comparing */
  diff: VersionDiff | null;
  /** Whether a version is currently being fetched for comparison */
  loading: boolean;
  /** Clear the comparison and exit diff mode */
  clearDiff: () => void;
}

const VersionDiffContext = createContext<VersionDiffState>({
  diff: null,
  loading: false,
  clearDiff: () => {},
});

export const VersionDiffProvider = VersionDiffContext.Provider;

export function useVersionDiff(): VersionDiffState {
  return useContext(VersionDiffContext);
}
