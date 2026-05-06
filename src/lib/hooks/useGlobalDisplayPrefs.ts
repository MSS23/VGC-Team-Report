"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Global display preferences that persist across sessions.
 *
 * These are per-user / per-browser preferences — NOT stored inside a
 * specific report's data. Used by the DisplayTogglePill to track
 * first-run discovery; per-card preferences (Mega form) are stored
 * inside `TeamMeta` so they ride along with shared reports.
 */

const PILL_SEEN_KEY = "vgc.display.pillSeen";

function readBool(key: string, fallback: boolean): boolean {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return raw === "1" || raw === "true";
  } catch {
    return fallback;
  }
}

function writeBool(key: string, value: boolean): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, value ? "1" : "0");
  } catch {
    // private browsing / quota exceeded — preference just won't persist
  }
}

export function useGlobalDisplayPrefs() {
  // First-run discovery pulse on the floating pill — only fires once ever
  const [hasSeenPill, setHasSeenPillState] = useState<boolean>(true);

  // Hydrate from localStorage after mount to avoid SSR/client hydration mismatch
  useEffect(() => {
    setHasSeenPillState(readBool(PILL_SEEN_KEY, false));
  }, []);

  const markPillSeen = useCallback(() => {
    setHasSeenPillState(true);
    writeBool(PILL_SEEN_KEY, true);
  }, []);

  return { hasSeenPill, markPillSeen };
}
