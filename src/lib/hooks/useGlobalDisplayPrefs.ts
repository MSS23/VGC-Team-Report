"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Global display preferences that persist across sessions.
 *
 * These are per-user / per-browser preferences — NOT stored inside a
 * specific report's data. Used by the DisplayTogglePill and the per-card
 * stat controls so flipping SP/EV mode on one card flips the whole team
 * and survives page reloads.
 *
 * Separate from `TeamMeta.megaStates` (which is per-report data that gets
 * saved with the shared team) and `TeamMeta.globalMegaDefault` (which is
 * per-report default).
 */

const EV_MODE_KEY = "vgc.display.evMode";
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
  // SP/EV mode: `false` = SP (default), `true` = EV
  const [evMode, setEvModeState] = useState<boolean>(false);
  // First-run discovery pulse on the floating pill — only fires once ever
  const [hasSeenPill, setHasSeenPillState] = useState<boolean>(true);

  // Hydrate from localStorage after mount to avoid SSR/client hydration mismatch
  useEffect(() => {
    setEvModeState(readBool(EV_MODE_KEY, false));
    setHasSeenPillState(readBool(PILL_SEEN_KEY, false));
  }, []);

  const setEvMode = useCallback((v: boolean) => {
    setEvModeState(v);
    writeBool(EV_MODE_KEY, v);
  }, []);

  const markPillSeen = useCallback(() => {
    setHasSeenPillState(true);
    writeBool(PILL_SEEN_KEY, true);
  }, []);

  return { evMode, setEvMode, hasSeenPill, markPillSeen };
}
