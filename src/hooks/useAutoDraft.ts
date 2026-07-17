"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import type { ShareableState } from "@/lib/sharing/url-codec";
import type { TeamAnalysis } from "@/lib/types/analysis";

const DRAFT_ID_KEY = "vgc-draft-id";
const DRAFT_DEBOUNCE_MS = 4000;
const SAVED_STATUS_MS = 3000;

export type DraftSaveStatus = "idle" | "saving" | "saved" | "error";

export interface DraftSaveResult {
  ok: boolean;
  id?: string;
  error?: string;
}

interface AutoDraftOptions {
  isSignedIn: boolean;
  analysis: TeamAnalysis | null;
  isSampleTeam: boolean;
  isSharedView: boolean;
  buildShareState: () => ShareableState;
}

function readStoredDraftId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(DRAFT_ID_KEY);
  } catch {
    return null;
  }
}

/**
 * Auto-saves local reports for signed-in users and exposes an immediate
 * "save for later" action. A resumed draft can explicitly replace the local
 * draft ID so edits always update the report the user actually opened.
 */
export function useAutoDraft({ isSignedIn, analysis, isSampleTeam, isSharedView, buildShareState }: AutoDraftOptions) {
  const [draftId, setDraftIdState] = useState<string | null>(readStoredDraftId);
  const [status, setStatus] = useState<DraftSaveStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const draftIdRef = useRef<string | null>(draftId);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const statusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlightRef = useRef<Promise<DraftSaveResult> | null>(null);

  const setActiveDraft = useCallback((id: string | null) => {
    draftIdRef.current = id;
    setDraftIdState(id);
    try {
      if (id) localStorage.setItem(DRAFT_ID_KEY, id);
      else localStorage.removeItem(DRAFT_ID_KEY);
    } catch { /* local persistence is best-effort */ }
  }, []);

  const clearDraft = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (statusTimerRef.current) clearTimeout(statusTimerRef.current);
    setActiveDraft(null);
    setStatus("idle");
    setError(null);
  }, [setActiveDraft]);

  const saveDraft = useCallback(async (): Promise<DraftSaveResult> => {
    if (!isSignedIn || !analysis || isSampleTeam || isSharedView) {
      return { ok: false, error: "Sign in and load your own team before saving a draft." };
    }

    // Serialize overlapping autosave/manual-save requests. After the earlier
    // request completes, build state again so the second save includes edits
    // made while the first request was in flight.
    if (inFlightRef.current) await inFlightRef.current;

    const state = buildShareState();
    if (!state.paste?.trim()) return { ok: false, error: "Add a team before saving a draft." };

    if (statusTimerRef.current) clearTimeout(statusTimerRef.current);
    setStatus("saving");
    setError(null);

    const request = (async (): Promise<DraftSaveResult> => {
      try {
        const res = await fetch("/api/user/drafts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ state, draftId: draftIdRef.current }),
        });
        const data = await res.json().catch(() => null) as { id?: string; error?: string } | null;
        if (!res.ok || !data?.id) {
          throw new Error(data?.error || "Could not save this draft. Please try again.");
        }

        setActiveDraft(data.id);
        setStatus("saved");
        statusTimerRef.current = setTimeout(() => setStatus("idle"), SAVED_STATUS_MS);
        return { ok: true, id: data.id };
      } catch (saveError) {
        const message = saveError instanceof Error ? saveError.message : "Could not save this draft. Please try again.";
        setStatus("error");
        setError(message);
        return { ok: false, error: message };
      }
    })();

    inFlightRef.current = request;
    const result = await request;
    if (inFlightRef.current === request) inFlightRef.current = null;
    return result;
  }, [analysis, buildShareState, isSampleTeam, isSharedView, isSignedIn, setActiveDraft]);

  useEffect(() => {
    if (!isSignedIn || !analysis || isSampleTeam || isSharedView) return;

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => { void saveDraft(); }, DRAFT_DEBOUNCE_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isSignedIn, analysis, isSampleTeam, isSharedView, saveDraft]);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (statusTimerRef.current) clearTimeout(statusTimerRef.current);
  }, []);

  return {
    draftId,
    status,
    error,
    saveDraft,
    setActiveDraft,
    clearDraft,
  };
}
