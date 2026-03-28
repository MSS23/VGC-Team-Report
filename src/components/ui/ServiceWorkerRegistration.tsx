"use client";

import { useEffect, useState, useCallback } from "react";

export function ServiceWorkerRegistration() {
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    // Auto-reload when a new SW takes control (after skipWaiting)
    let refreshing = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });

    navigator.serviceWorker.register("/sw.js").then((reg) => {
      // Check for updates on registration
      reg.addEventListener("updatefound", () => {
        const newWorker = reg.installing;
        if (!newWorker) return;

        newWorker.addEventListener("statechange", () => {
          // New SW installed and waiting — prompt user to reload
          if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
            setUpdateAvailable(true);
          }
        });
      });

      // Check for updates periodically (every 30 min)
      setInterval(() => reg.update(), 30 * 60 * 1000);
    }).catch(() => {
      // Silent fail — SW is a progressive enhancement
    });
  }, []);

  const handleUpdate = useCallback(() => {
    setUpdateAvailable(false);
    window.location.reload();
  }, []);

  if (!updateAvailable) return null;

  return (
    <div className="fixed bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 sm:left-auto sm:translate-x-0 sm:right-4 z-50 w-[calc(100%-2rem)] sm:w-auto max-w-sm animate-toast-in">
      <div className="bg-surface border border-border/60 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] p-3.5 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
            <path d="M21 2v6h-6" />
            <path d="M3 12a9 9 0 0115-6.7L21 8" />
            <path d="M3 22v-6h6" />
            <path d="M21 12a9 9 0 01-15 6.7L3 16" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-text-primary leading-tight">Update available</p>
          <p className="text-xs text-text-tertiary mt-0.5">New features and fixes ready.</p>
        </div>
        <button
          type="button"
          onClick={handleUpdate}
          className="px-4 py-2 text-xs font-bold text-white bg-accent rounded-xl hover:brightness-110 active:scale-[0.96] transition-all cursor-pointer flex-shrink-0 shadow-sm shadow-accent/20"
        >
          Refresh
        </button>
      </div>
    </div>
  );
}
