"use client";

import { useEffect, useState, useCallback } from "react";

export function ServiceWorkerRegistration() {
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

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

      // Also check for updates periodically (every 30 min)
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
    <div className="fixed bottom-20 sm:bottom-4 right-4 z-50 animate-fade-in">
      <div className="bg-surface border border-border rounded-xl shadow-2xl p-3 flex items-center gap-3 max-w-xs">
        <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
            <path d="M21 2v6h-6" />
            <path d="M3 12a9 9 0 0115-6.7L21 8" />
            <path d="M3 22v-6h6" />
            <path d="M21 12a9 9 0 01-15 6.7L3 16" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-text-primary">Update available</p>
          <p className="text-[10px] text-text-tertiary">New features and fixes ready.</p>
        </div>
        <button
          type="button"
          onClick={handleUpdate}
          className="px-3 py-1.5 text-xs font-bold text-white bg-accent rounded-lg hover:brightness-110 transition-all cursor-pointer flex-shrink-0"
        >
          Refresh
        </button>
      </div>
    </div>
  );
}
