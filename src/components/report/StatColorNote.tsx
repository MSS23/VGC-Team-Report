"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * "Bar color = stat type, not quality" caption under stat bars, with a
 * dismiss button. Dismissal is a per-browser display preference persisted
 * in localStorage; a custom event keeps every rendered instance (each
 * PokemonCard + the detail slide) in sync within the tab.
 */

const KEY = "vgc.display.hideStatColorNote";
const EVENT = "vgc:stat-color-note-dismissed";

function subscribe(callback: () => void) {
  window.addEventListener(EVENT, callback);
  return () => window.removeEventListener(EVENT, callback);
}

function getSnapshot(): boolean {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

export function StatColorNote() {
  const dismissed = useSyncExternalStore(subscribe, getSnapshot, () => false);

  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(KEY, "1");
    } catch {
      // private browsing / quota exceeded — hides for this tab only
    }
    window.dispatchEvent(new Event(EVENT));
  }, []);

  if (dismissed) return null;

  // The row is sized to hold the 44×44 dismiss target (min-h-11) rather than
  // letting the button overflow its line box via negative margins — an
  // overflowing hit area sits invisibly on top of the stat rows and swallows
  // their taps.
  return (
    <p
      role="note"
      className="flex min-h-11 items-center text-xs font-semibold uppercase tracking-wide text-text-tertiary"
    >
      Bar color = stat type, not quality
      <button
        type="button"
        onClick={dismiss}
        aria-label="Hide this note permanently"
        title="Hide this note"
        className="inline-flex items-center justify-center min-w-11 min-h-11 shrink-0 text-text-tertiary hover:text-text-primary transition-colors duration-150 cursor-pointer rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </p>
  );
}
