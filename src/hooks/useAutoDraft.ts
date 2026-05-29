"use client";

import { useEffect, useRef, useCallback } from "react";
import type { ShareableState } from "@/lib/sharing/url-codec";
import type { TeamAnalysis } from "@/lib/types/analysis";

const DRAFT_ID_KEY = "vgc-draft-id";
const DRAFT_DEBOUNCE_MS = 5000;

interface AutoDraftOptions {
  isSignedIn: boolean;
  analysis: TeamAnalysis | null;
  isSampleTeam: boolean;
  isSharedView: boolean;
  buildShareState: () => ShareableState;
}

/**
 * Auto-saves local team reports as drafts for signed-in users.
 * Returns the active draft ID (if any) and a method to clear it.
 */
export function useAutoDraft({ isSignedIn, analysis, isSampleTeam, isSharedView, buildShareState }: AutoDraftOptions) {
  const draftIdRef = useRef<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savingRef = useRef(false);

  // Load draft ID from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(DRAFT_ID_KEY);
      if (stored) draftIdRef.current = stored;
    } catch { /* ignore */ }
  }, []);

  const clearDraft = useCallback(() => {
    draftIdRef.current = null;
    try { localStorage.removeItem(DRAFT_ID_KEY); } catch { /* ignore */ }
  }, []);

  // Auto-save draft when state changes
  useEffect(() => {
    // Only auto-draft for signed-in users with a local (non-shared) team
    if (!isSignedIn || !analysis || isSampleTeam || isSharedView) return;

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(async () => {
      if (savingRef.current) return;
      savingRef.current = true;

      try {
        const state = buildShareState();
        // Don't save empty pastes
        if (!state.paste?.trim()) { savingRef.current = false; return; }

        const res = await fetch("/api/user/drafts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ state, draftId: draftIdRef.current }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.id && data.id !== draftIdRef.current) {
            draftIdRef.current = data.id;
            try { localStorage.setItem(DRAFT_ID_KEY, data.id); } catch { /* ignore */ }
          }
        }
      } catch { /* silent — draft save is non-critical */ }
      finally { savingRef.current = false; }
    }, DRAFT_DEBOUNCE_MS);

    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [isSignedIn, analysis, isSampleTeam, isSharedView, buildShareState]);

  return { draftId: draftIdRef.current, clearDraft };
}
