"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(max-width: 639px)";

function subscribe(callback: () => void) {
  const mq = window.matchMedia(QUERY);
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}

function getSnapshot() {
  return window.matchMedia(QUERY).matches;
}

function getServerSnapshot() {
  return false; // SSR fallback — CSS handles responsive layout, JS check runs after hydration
}

/** Returns true when viewport width < 640px (matches Tailwind `sm:` breakpoint).
 *  Uses useSyncExternalStore for hydration-safe rendering. */
export function useIsMobile() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
