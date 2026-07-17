"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useShareUrl } from "@/hooks/useShareUrl";
import { useAuth } from "@clerk/nextjs";
import { usePostHog } from "@/components/providers/PostHogProvider";
import type { ShareableState } from "@/lib/sharing/url-codec";
import type { TeamAnalysis } from "@/lib/types/analysis";
import type { TranslationKeys } from "@/lib/i18n/translations/en";

interface ShareFlowOptions {
  analysis: TeamAnalysis | null;
  isSampleTeam: boolean;
  buildShareState: () => ShareableState;
  t: TranslationKeys;
  /** Called immediately before any client-initiated save POST fires, so the
   *  collaborative-sync layer can suppress the resulting self-echo. */
  onSaveStart?: () => void;
  /** Called after a save POST resolves (success or failure). */
  onSaveEnd?: () => void;
}

export function useShareFlow({ analysis, isSampleTeam, buildShareState, t, onSaveStart, onSaveEnd }: ShareFlowOptions) {
  const { isSignedIn } = useAuth();
  const posthog = usePostHog();
  const {
    isSharedView, isSharePending, sharedState, shareId: activeShareId,
    editKeyFromUrl, copyShareUrl, freshShare, autoSave, shareStatus,
    urlWarning, decodeFailed, exitSharedView, isEditingUnlocked, isOwner,
    sessionShareId, lastShareResult, openShareSheetForUrl, getEditUrl, hasExistingShare, clearStoredShare,
    fetchedIsPublic, fetchedIsUnlisted, fetchedCollaborators, autoSaveStatus, forkedFrom, forkReport, redactedFields,
  } = useShareUrl();

  // New reports are link-only by default. Sharing with friends should not
  // silently publish a report to Explore; creators can opt into discovery in
  // the share sheet once they are ready.
  const [isPublic, setIsPublic] = useState(false);
  const [isUnlisted, setIsUnlisted] = useState(true);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [creatorRequired, setCreatorRequired] = useState(false);

  // Once the user manually changes visibility, the server-fetched values must
  // stop overwriting their choice. The fetch that populates fetchedIsPublic
  // can resolve AFTER an optimistic toggle, which would otherwise snap the
  // toggle back on screen (a visible flicker + UI disagreeing with the save).
  // The ref resets when the values clear (fetchedIsPublic → null on navigating
  // away), so the next report still seeds correctly.
  const visibilityTouchedRef = useRef(false);
  useEffect(() => {
    if (fetchedIsPublic === null) { visibilityTouchedRef.current = false; return; }
    if (!visibilityTouchedRef.current) setIsPublic(fetchedIsPublic);
  }, [fetchedIsPublic]);

  useEffect(() => {
    if (fetchedIsUnlisted === null) return;
    if (!visibilityTouchedRef.current) setIsUnlisted(fetchedIsUnlisted);
  }, [fetchedIsUnlisted]);
  const [allowComments, setAllowComments] = useState(false);
  const [showEditUrl, setShowEditUrl] = useState(false);
  const [editLinkCopied, setEditLinkCopied] = useState(false);

  // Wrap any client-initiated write so the collaborative-sync layer can
  // suppress the self-echo the server sends back for our own version bump.
  // Without this, our own save echoes back over SSE, gets re-applied, mutates
  // local state, and fires another autosave — the runaway loop (§1-B).
  const withSaveSuppression = useCallback(
    async <T>(fn: () => Promise<T>): Promise<T> => {
      onSaveStart?.();
      try {
        return await fn();
      } finally {
        onSaveEnd?.();
      }
    },
    [onSaveStart, onSaveEnd],
  );

  const handleShareClick = useCallback(async () => {
    if (!analysis || isSampleTeam) return;
    if (!isSignedIn) {
      setPublishError("Sign in to save and share your team report.");
      return;
    }
    const state = buildShareState();
    if (!state.creatorName?.trim()) {
      setCreatorRequired(true);
      return;
    }
    setCreatorRequired(false);
    const result = await withSaveSuppression(() => copyShareUrl(state, isPublic, isUnlisted));
    if (result && !result.ok) {
      // Don't open the edit-link panel on a failed share — surface why instead.
      setPublishError(result.error ?? "Could not share report. Please try again.");
      return;
    }
    setShowEditUrl(true);
    const hasMega = analysis.pokemon.some((p) => p.parsed.species.includes("-Mega") || p.parsed.species.includes("-Primal"));
    posthog?.capture("report_shared", {
      regulation: (state.tags as Record<string, unknown>)?.regulation as string ?? "unknown",
      has_mega: hasMega,
      is_public: isPublic,
      pokemon_count: analysis.pokemon.length,
    });
  }, [analysis, isSampleTeam, copyShareUrl, buildShareState, isPublic, isUnlisted, isSignedIn, posthog, withSaveSuppression]);

  const handleReshare = useCallback(() => {
    if (!analysis) return;
    withSaveSuppression(() => copyShareUrl(buildShareState(), isPublic, isUnlisted));
  }, [analysis, copyShareUrl, buildShareState, isPublic, isUnlisted, withSaveSuppression]);

  const handleCopyEditLink = useCallback(() => {
    const url = getEditUrl();
    if (!url) return;
    navigator.clipboard.writeText(url);
    setEditLinkCopied(true);
    setTimeout(() => setEditLinkCopied(false), 2000);
  }, [getEditUrl]);

  const handleFreshReshare = useCallback(() => {
    if (!analysis) return;
    withSaveSuppression(() => freshShare(buildShareState(), isPublic, isUnlisted));
    setShowEditUrl(true);
  }, [analysis, freshShare, buildShareState, isPublic, isUnlisted, withSaveSuppression]);

  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!analysis || !isEditingUnlocked || !isSignedIn) return;
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => {
      withSaveSuppression(() => autoSave(buildShareState(), isPublic, isUnlisted));
    }, 3000);
    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [analysis, isEditingUnlocked, isSignedIn, buildShareState, autoSave, isPublic, isUnlisted, withSaveSuppression]);

  // Monotonic token so that if two visibility changes overlap, a stale earlier
  // response can't revert the UI to a value the user has since moved past.
  const visibilityReqRef = useRef(0);

  const handleSetPublic = useCallback(async (v: boolean) => {
    visibilityTouchedRef.current = true;
    const reqId = ++visibilityReqRef.current;
    const prevPublic = isPublic; // real previous value, not !v
    setIsPublic(v);
    setPublishError(null);
    const result = await withSaveSuppression(() => autoSave(buildShareState(), v, isUnlisted));
    if (reqId !== visibilityReqRef.current) return; // superseded by a newer toggle
    if (!result.ok) {
      setIsPublic(prevPublic);
      setPublishError(result.error ?? "Could not update visibility.");
    }
  }, [autoSave, buildShareState, isPublic, isUnlisted, withSaveSuppression]);

  const handleSetVisibility = useCallback(async (newIsPublic: boolean, newIsUnlisted: boolean) => {
    visibilityTouchedRef.current = true;
    const reqId = ++visibilityReqRef.current;
    const prevPublic = isPublic;
    const prevUnlisted = isUnlisted;
    setIsPublic(newIsPublic);
    setIsUnlisted(newIsUnlisted);
    setPublishError(null);
    const result = await withSaveSuppression(() => autoSave(buildShareState(), newIsPublic, newIsUnlisted));
    if (reqId !== visibilityReqRef.current) return; // superseded by a newer toggle
    if (!result.ok) {
      setIsPublic(prevPublic);
      setIsUnlisted(prevUnlisted);
      setPublishError(result.error ?? "Could not update visibility.");
    }
  }, [autoSave, buildShareState, isPublic, isUnlisted, withSaveSuppression]);

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
    isUnlisted, setIsUnlisted, handleSetVisibility,
    publishError, clearPublishError,
    creatorRequired,
    allowComments, setAllowComments,
    autoSaveStatus,
    fetchedCollaborators,
    forkedFrom, forkReport,
    redactedFields,
  };
}
