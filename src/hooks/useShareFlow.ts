"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useShareUrl } from "@/hooks/useShareUrl";
import { track } from "@vercel/analytics";
import posthog from "posthog-js";
import type { ShareableState } from "@/lib/sharing/url-codec";
import type { TeamAnalysis } from "@/lib/types/analysis";

interface ShareFlowOptions {
  analysis: TeamAnalysis | null;
  isSampleTeam: boolean;
  buildShareState: () => ShareableState;
  t: Record<string, string>;
}

export function useShareFlow({ analysis, isSampleTeam, buildShareState, t }: ShareFlowOptions) {
  const {
    isSharedView, isSharePending, sharedState, shareId: activeShareId,
    editKeyFromUrl, copyShareUrl, freshShare, autoSave, shareStatus,
    urlWarning, decodeFailed, exitSharedView, isEditingUnlocked, isOwner,
    sessionShareId, lastShareResult, openShareSheetForUrl, getEditUrl, hasExistingShare, clearStoredShare,
    fetchedIsPublic, autoSaveStatus, forkedFrom, forkReport,
  } = useShareUrl();

  const [isPublic, setIsPublic] = useState(false);
  // Surfaced to ShareModal so a failed visibility toggle shows a real error
  // instead of a silent "saved" that didn't actually publish anything.
  const [publishError, setPublishError] = useState<string | null>(null);

  // Sync isPublic from server when share data is fetched (e.g. opening a shared view or dashboard toggle)
  useEffect(() => {
    if (fetchedIsPublic !== null) {
      setIsPublic(fetchedIsPublic);
    }
  }, [fetchedIsPublic]);
  const [allowComments, setAllowComments] = useState(false);
  const [showEditUrl, setShowEditUrl] = useState(false);
  const [editLinkCopied, setEditLinkCopied] = useState(false);

  const handleShareClick = useCallback(() => {
    if (!analysis || isSampleTeam) return;
    const state = buildShareState();
    copyShareUrl(state, isPublic);
    setShowEditUrl(true);
    // Track share event
    const hasMega = analysis.pokemon.some((p) => p.parsed.species.includes("-Mega") || p.parsed.species.includes("-Primal"));
    track("report_shared", {
      regulation: (state.tags as Record<string, unknown>)?.regulation as string ?? "unknown",
      hasMega: hasMega ? "yes" : "no",
    });
    posthog.capture("report_shared", {
      regulation: (state.tags as Record<string, unknown>)?.regulation as string ?? "unknown",
      has_mega: hasMega,
      is_public: isPublic,
      pokemon_count: analysis.pokemon.length,
    });
  }, [analysis, isSampleTeam, copyShareUrl, buildShareState, isPublic]);

  const handleReshare = useCallback(() => {
    if (!analysis) return;
    copyShareUrl(buildShareState(), isPublic);
  }, [analysis, copyShareUrl, buildShareState, isPublic]);

  const handleCopyEditLink = useCallback(() => {
    const url = getEditUrl();
    if (!url) return;
    navigator.clipboard.writeText(url);
    setEditLinkCopied(true);
    setTimeout(() => setEditLinkCopied(false), 2000);
  }, [getEditUrl]);

  const handleFreshReshare = useCallback(() => {
    if (!analysis) return;
    freshShare(buildShareState(), isPublic);
    setShowEditUrl(true);
  }, [analysis, freshShare, buildShareState, isPublic]);

  // Auto-save: debounce pushes to server when editing an unlocked shared view
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!analysis || !isEditingUnlocked) return;
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => {
      autoSave(buildShareState(), isPublic);
    }, 3000);
    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [analysis, isEditingUnlocked, buildShareState, autoSave, isPublic]);

  const handleSetPublic = useCallback(async (v: boolean) => {
    // Optimistic toggle for responsive UI — reverted if the server rejects.
    setIsPublic(v);
    setPublishError(null);
    const result = await autoSave(buildShareState(), v);
    if (!result.ok) {
      setIsPublic(!v);
      setPublishError(result.error ?? "Could not update visibility.");
    }
  }, [autoSave, buildShareState]);

  const clearPublishError = useCallback(() => setPublishError(null), []);

  const shareButtonText =
    shareStatus === "copying"
      ? t.copying
      : shareStatus === "copied"
        ? lastShareResult?.updated ? t.updated : t.copied
        : shareStatus === "error"
          ? t.failed
          : t.share;

  return {
    isSharedView, isSharePending, sharedState, activeShareId, editKeyFromUrl,
    shareStatus, urlWarning, decodeFailed, exitSharedView, isEditingUnlocked, isOwner,
    sessionShareId, lastShareResult, openShareSheetForUrl, hasExistingShare, clearStoredShare,
    showEditUrl, setShowEditUrl, editLinkCopied, shareButtonText,
    handleShareClick, handleReshare, handleCopyEditLink, handleFreshReshare,
    isPublic, setIsPublic, handleSetPublic,
    publishError, clearPublishError,
    allowComments, setAllowComments,
    autoSaveStatus,
    forkedFrom, forkReport,
  };
}
