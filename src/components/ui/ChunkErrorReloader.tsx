"use client";

import { useEffect } from "react";

const CHUNK_PATTERNS = [
  "Loading chunk",
  "Loading CSS chunk",
  "ChunkLoadError",
  "Failed to fetch dynamically imported module",
  "error loading dynamically imported module",
];

function isChunkError(text: string): boolean {
  return CHUNK_PATTERNS.some((p) => text.includes(p));
}

/**
 * Detects ChunkLoadError (stale tabs after deploy) and reloads the page once.
 * Uses sessionStorage to prevent infinite reload loops, and preventDefault on
 * the event so PostHog's exception capture doesn't log it as a real error.
 */
export function ChunkErrorReloader() {
  useEffect(() => {
    const RELOAD_KEY = "chunk-reload";

    const tryReload = () => {
      if (!sessionStorage.getItem(RELOAD_KEY)) {
        sessionStorage.setItem(RELOAD_KEY, "1");
        window.location.reload();
      }
    };

    const handleError = (event: ErrorEvent) => {
      if (isChunkError(event.message || "")) {
        event.preventDefault();
        tryReload();
      }
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      const reason = String(event.reason?.message || event.reason || "");
      if (isChunkError(reason)) {
        event.preventDefault();
        tryReload();
      }
    };

    // Keep the guard in place long enough to prove that the new page is stable.
    // Clearing it immediately on mount allowed a persistent chunk failure to
    // reload forever: mount -> clear -> error -> reload -> repeat.
    const clearGuardTimer = window.setTimeout(() => {
      sessionStorage.removeItem(RELOAD_KEY);
    }, 10_000);

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleRejection);
    return () => {
      window.clearTimeout(clearGuardTimer);
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleRejection);
    };
  }, []);

  return null;
}
