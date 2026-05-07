"use client";

interface ShareViewCTAProps {
  onCreateOwn: () => void;
  /** Dismiss callback — parent owns the dismissed state so sibling
   *  components (e.g. the floating Display pill) can react to it and
   *  drop their collision-avoidance offset when the CTA goes away. */
  onDismiss: () => void;
}

export function ShareViewCTA({ onCreateOwn, onDismiss }: ShareViewCTAProps) {

  return (
    <div className="fixed bottom-14 sm:bottom-12 inset-x-0 z-30 pointer-events-none">
      <div className="max-w-5xl mx-auto px-2 sm:px-4 pb-1.5 sm:pb-2">
        <div className="pointer-events-auto bg-surface/95 backdrop-blur-xl border border-border rounded-xl sm:rounded-2xl shadow-2xl px-3 py-2.5 sm:px-5 sm:py-3.5 flex items-center justify-between gap-2 sm:gap-3 animate-fade-in">
          <div className="min-w-0">
            <p className="text-xs sm:text-sm font-bold text-text-primary tracking-tight">
              Build your own team report
            </p>
            <p className="text-xs text-text-tertiary mt-0.5 hidden sm:block">
              Add notes, matchup plans, damage calcs — then share it with the community or present it at your next tournament.
            </p>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={onCreateOwn}
              className="px-3.5 py-2 sm:px-5 sm:py-2.5 bg-accent text-white text-xs sm:text-sm font-bold rounded-lg sm:rounded-xl hover:brightness-110 active:scale-[0.97] transition-all shadow-md shadow-accent/30 cursor-pointer"
            >
              Create yours
            </button>
            <button
              type="button"
              onClick={onDismiss}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-alt transition-colors cursor-pointer"
              aria-label="Dismiss"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
