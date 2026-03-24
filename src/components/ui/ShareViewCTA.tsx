"use client";

import { useState } from "react";

interface ShareViewCTAProps {
  onCreateOwn: () => void;
}

export function ShareViewCTA({ onCreateOwn }: ShareViewCTAProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="fixed bottom-14 sm:bottom-12 inset-x-0 z-30 pointer-events-none">
      <div className="max-w-7xl mx-auto px-4 pb-2">
        <div className="pointer-events-auto bg-surface/95 backdrop-blur-xl border border-border rounded-2xl shadow-2xl px-5 py-3.5 flex items-center justify-between gap-3 animate-fade-in">
          <div className="min-w-0">
            <p className="text-sm font-bold text-text-primary tracking-tight">
              Want to build your own team report?
            </p>
            <p className="text-xs text-text-tertiary mt-0.5 hidden sm:block">
              Paste a Showdown team, add notes and matchup plans, then share it with one click.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={onCreateOwn}
              className="px-5 py-2.5 bg-accent text-white text-sm font-bold rounded-xl hover:brightness-110 active:scale-[0.97] transition-all shadow-md shadow-accent/30 cursor-pointer"
            >
              Create yours free
            </button>
            <button
              type="button"
              onClick={() => setDismissed(true)}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-alt transition-colors cursor-pointer"
              aria-label="Dismiss"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
