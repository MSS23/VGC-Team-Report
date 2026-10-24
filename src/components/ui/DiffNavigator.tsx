"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type { DiffChange } from "@/lib/utils/version-diff";

interface DiffNavigatorProps {
  changes: DiffChange[];
  onNavigate: (change: DiffChange) => void;
  onDismiss: () => void;
  version: number;
  editorName?: string | null;
}

/**
 * Floating navigator bar for stepping through version diff changes.
 * Shows "1 of N" with prev/next buttons and the current change label.
 */
export function DiffNavigator({ changes, onNavigate, onDismiss, version, editorName }: DiffNavigatorProps) {
  const [index, setIndex] = useState(0);
  const count = changes.length;

  // Reset index when changes list updates
  useEffect(() => { setIndex(0); }, [count]);

  const go = useCallback((i: number) => {
    const next = ((i % count) + count) % count;
    setIndex(next);
    onNavigate(changes[next]);

    // Scroll to the element after a short delay for slide transition
    setTimeout(() => {
      const el = document.querySelector(`[data-diff-field="${changes[next].field}"]`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 200);
  }, [changes, count, onNavigate]);

  const handlePrev = useCallback(() => go(index - 1), [go, index]);
  const handleNext = useCallback(() => go(index + 1), [go, index]);

  // Stable ref so keyboard listener doesn't re-attach on every render
  const navRef = useRef({ handlePrev, handleNext });
  navRef.current = { handlePrev, handleNext };

  // Keyboard: J/K when this is visible — attaches once
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't capture if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;
      if (e.key === "j" || e.key === "J") { e.preventDefault(); navRef.current.handleNext(); }
      if (e.key === "k" || e.key === "K") { e.preventDefault(); navRef.current.handlePrev(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  if (count === 0) return null;

  const current = changes[index];

  return (
    <div className="fixed bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
      <div className="flex items-center gap-1 bg-blue-600 text-white rounded-2xl shadow-2xl shadow-blue-900/40 px-1.5 py-1.5 sm:px-2 sm:py-1.5">
        {/* Prev */}
        <button
          onClick={handlePrev}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl hover:bg-white/15 active:scale-90 transition-all cursor-pointer"
          aria-label="Previous change"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        {/* Counter + label */}
        <div className="flex items-center gap-2.5 px-2 sm:px-3 min-w-0">
          <span className="text-xs font-bold tabular-nums whitespace-nowrap opacity-80">
            {index + 1}/{count}
          </span>
          <span className="text-xs font-semibold truncate max-w-[160px] sm:max-w-[240px]">
            {current.label}
          </span>
        </div>

        {/* Next */}
        <button
          onClick={handleNext}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl hover:bg-white/15 active:scale-90 transition-all cursor-pointer"
          aria-label="Next change"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>

        {/* Divider */}
        <span className="w-px h-5 bg-white/25 mx-0.5" />

        {/* Version + editor badge */}
        <span className="text-[10px] font-bold opacity-60 whitespace-nowrap px-1 hidden sm:inline">
          v{version}{editorName ? ` by ${editorName}` : ""}
        </span>

        {/* Dismiss */}
        <button
          onClick={onDismiss}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl hover:bg-white/15 active:scale-90 transition-all cursor-pointer"
          aria-label="Dismiss comparison"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </div>
  );
}
