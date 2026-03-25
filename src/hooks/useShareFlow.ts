"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useShareUrl } from "@/hooks/useShareUrl";
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
    urlWarning, decodeFailed, exitSharedView, isEditingUnlocked,
    lastShareResult, getEditUrl, hasExistingShare, clearStoredShare,
  } = useShareUrl();

  const [isPublic, setIsPublic] = useState(false);
  const [allowComments, setAllowComments] = useState(false);
  const [showEditUrl, setShowEditUrl] = useState(false);
  const [editLinkCopied, setEditLinkCopied] = useState(false);

  const handleShareClick = useCallback(() => {
    if (!analysis || isSampleTeam) return;
    copyShareUrl(buildShareState(), isPublic);
    setShowEditUrl(true);
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

  const handleSetPublic = useCallback((v: boolean) => {
    setIsPublic(v);
    autoSave(buildShareState(), v);
  }, [autoSave, buildShareState]);

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
    shareStatus, urlWarning, decodeFailed, exitSharedView, isEditingUnlocked,
    lastShareResult, hasExistingShare, clearStoredShare,
    showEditUrl, setShowEditUrl, editLinkCopied, shareButtonText,
    handleShareClick, handleReshare, handleCopyEditLink, handleFreshReshare,
    isPublic, setIsPublic, handleSetPublic,
    allowComments, setAllowComments,
  };
}
