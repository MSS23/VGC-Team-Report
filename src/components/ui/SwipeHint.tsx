"use client";

import { useState, useEffect } from "react";

const STORAGE_KEY = "vgc-swipe-hint-seen";

/**
 * One-time swipe hint shown on mobile when first viewing a report.
 * Dismisses on tap or after 4 seconds. Remembers via localStorage.
 */
export function SwipeHint() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Only show on touch devices
    if (typeof window === "undefined" || !("ontouchstart" in window)) return;
    if (localStorage.getItem(STORAGE_KEY)) return;

    // Small delay so it doesn't flash during page load
    const showTimer = setTimeout(() => setVisible(true), 1200);

    return () => clearTimeout(showTimer);
  }, []);

  useEffect(() => {
    if (!visible) return;
    const hideTimer = setTimeout(() => {
      setVisible(false);
      localStorage.setItem(STORAGE_KEY, "1");
    }, 4000);
    return () => clearTimeout(hideTimer);
  }, [visible]);

  const dismiss = () => {
    setVisible(false);
    localStorage.setItem(STORAGE_KEY, "1");
  };

  if (!visible) return null;

  return (
    <div
      onClick={dismiss}
      className="fixed left-1/2 -translate-x-1/2 z-50 sm:hidden animate-fade-in"
      style={{ bottom: "calc(var(--bottom-nav-height, 3.5rem) + 1rem)" }}
    >
      <div className="flex items-center gap-2.5 px-4 py-2.5 bg-surface/95 backdrop-blur-lg border border-border rounded-full shadow-lg">
        {/* Left arrow */}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent animate-[swipe-arrow_1.5s_ease-in-out_infinite]">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        <span className="text-xs font-bold text-text-primary whitespace-nowrap">Swipe to navigate slides</span>
        {/* Right arrow */}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent animate-[swipe-arrow_1.5s_ease-in-out_infinite_reverse]">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </div>
    </div>
  );
}
