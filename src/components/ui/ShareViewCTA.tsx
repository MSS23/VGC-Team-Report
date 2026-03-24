"use client";

interface ShareViewCTAProps {
  onCreateOwn: () => void;
}

export function ShareViewCTA({ onCreateOwn }: ShareViewCTAProps) {
  return (
    <div className="fixed bottom-0 inset-x-0 z-30 pointer-events-none">
      <div className="max-w-7xl mx-auto px-4 pb-4">
        <div className="pointer-events-auto bg-surface/95 backdrop-blur-xl border border-border rounded-2xl shadow-2xl px-5 py-4 flex items-center justify-between gap-4 animate-fade-in">
          <div className="min-w-0">
            <p className="text-sm font-bold text-text-primary tracking-tight">
              Want to build your own team report?
            </p>
            <p className="text-xs text-text-tertiary mt-0.5 hidden sm:block">
              Paste a Showdown team, add notes and matchup plans, then share it with one click.
            </p>
          </div>
          <button
            type="button"
            onClick={onCreateOwn}
            className="flex-shrink-0 px-5 py-2.5 bg-accent text-white text-sm font-bold rounded-xl hover:brightness-110 active:scale-[0.97] transition-all shadow-md shadow-accent/30 cursor-pointer"
          >
            Create yours free
          </button>
        </div>
      </div>
    </div>
  );
}
