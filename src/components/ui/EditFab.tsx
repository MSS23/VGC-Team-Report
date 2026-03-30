"use client";

import { hapticMedium } from "@/lib/utils/haptics";

interface EditFabProps {
  creatorMode: boolean;
  onToggle: () => void;
  visible: boolean;
}

/** Floating action button for edit/view toggle — bottom-right corner */
export function EditFab({ creatorMode, onToggle, visible }: EditFabProps) {
  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={() => { hapticMedium(); onToggle(); }}
      className={`fixed bottom-16 right-3 sm:bottom-20 sm:right-6 z-40 w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all active:scale-90 hover:scale-105 safe-bottom group ${
        creatorMode
          ? "bg-accent text-white shadow-accent/30 hover:shadow-accent/50"
          : "bg-surface text-text-secondary border border-border shadow-black/10 hover:shadow-black/20 hover:border-accent/30"
      }`}
      aria-label={creatorMode ? "Switch to view mode" : "Switch to edit mode"}
      title={creatorMode ? "Switch to view mode (editing)" : "Switch to edit mode (viewing)"}
    >
      {creatorMode ? (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
        </svg>
      ) : (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
        </svg>
      )}
    </button>
  );
}
