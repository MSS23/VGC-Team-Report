"use client";

import { useEffect } from "react";

/**
 * Detects ChunkLoadError (stale tabs after deploy) and reloads the page once.
 * Uses sessionStorage to prevent infinite reload loops.
 */
export function ChunkErrorReloader() {
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      const msg = event.message || "";
      if (
        msg.includes("Loading chunk") ||
        msg.includes("ChunkLoadError") ||
        msg.includes("Failed to fetch dynamically imported module")
      ) {
        const key = "chunk-reload";
        if (!sessionStorage.getItem(key)) {
          sessionStorage.setItem(key, "1");
          window.location.reload();
        }
      }
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      const reason = String(event.reason?.message || event.reason || "");
      if (
        reason.includes("Loading chunk") ||
        reason.includes("ChunkLoadError") ||
        reason.includes("Failed to fetch dynamically imported module")
      ) {
        const key = "chunk-reload";
        if (!sessionStorage.getItem(key)) {
          sessionStorage.setItem(key, "1");
          window.location.reload();
        }
      }
    };

    // Clear the reload guard on successful page load (new chunks loaded fine)
    sessionStorage.removeItem("chunk-reload");

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleRejection);
    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleRejection);
    };
  }, []);

  return null;
}
