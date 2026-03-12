"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import {
  encodeShareState,
  decodeShareState,
  type ShareableState,
} from "@/lib/sharing/url-codec";

type ShareStatus = "idle" | "copying" | "copied" | "error";

const SHARE_TOKENS_KEY = "vgc-share-tokens";

interface StoredShareInfo {
  shareId: string;
  editToken: string;
}

function storeShareInfo(info: StoredShareInfo) {
  localStorage.setItem(SHARE_TOKENS_KEY, JSON.stringify(info));
}

/** Detect share ID from hash (fallback for #id= links). */
function detectHashId(): string | null {
  if (typeof window === "undefined") return null;
  const hash = window.location.hash;
  if (hash.startsWith("#id=")) return hash.slice("#id=".length) || null;
  return null;
}

function detectInlineData(): string | null {
  if (typeof window === "undefined") return null;
  const hash = window.location.hash;
  if (hash.startsWith("#data=")) return hash.slice("#data=".length) || null;
  return null;
}

export function useShareUrl() {
  // Use Next.js searchParams (works correctly across SSR and hydration)
  const searchParams = useSearchParams();
  const shareId = searchParams.get("s") || detectHashId();
  const editKeyFromUrl = searchParams.get("key") || null;
  const [inlineData] = useState(detectInlineData);
  const isSharePending = !!(shareId || inlineData);

  const [isSharedView, setIsSharedView] = useState(false);
  const [sharedState, setSharedState] = useState<ShareableState | null>(null);
  const [shareStatus, setShareStatus] = useState<ShareStatus>("idle");
  const [urlWarning, setUrlWarning] = useState<string | null>(null);
  const [decodeFailed, setDecodeFailed] = useState(false);
  const [isEditingUnlocked, setIsEditingUnlocked] = useState(false);
  const [lastShareResult, setLastShareResult] = useState<{
    updated: boolean;
    editUrl?: string;
  } | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Active session refs — only set when we have a verified edit session
  // (loaded via edit link or just created/updated a share in this session).
  // These are the ONLY source of truth for whether to update vs create.
  // localStorage is only used to persist across page refreshes within the same editing session.
  const activeEditTokenRef = useRef<string | null>(null);
  const activeShareIdRef = useRef<string | null>(null);

  // Fetch shared state on mount
  useEffect(() => {
    let settled = false;
    const timeout = setTimeout(() => {
      if (!settled) {
        settled = true;
        setDecodeFailed(true);
      }
    }, 5000);

    const settle = (state: ShareableState | null, editable?: boolean) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      if (state) {
        setIsSharedView(true);
        setSharedState(state);
        if (editable) {
          setIsEditingUnlocked(true);
        }
      } else {
        setDecodeFailed(true);
      }
    };

    if (shareId) {
      // Build fetch URL with key if present
      const fetchUrl = editKeyFromUrl
        ? `/api/share/${shareId}?key=${encodeURIComponent(editKeyFromUrl)}`
        : `/api/share/${shareId}`;

      fetch(fetchUrl)
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (!data) return settle(null);
          const editable = data._editable === true;
          // Strip internal flag before treating as ShareableState
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { _editable, ...state } = data;
          if (editable && editKeyFromUrl) {
            // Only set active refs when we have a verified edit session
            activeEditTokenRef.current = editKeyFromUrl;
            activeShareIdRef.current = shareId;
            storeShareInfo({ shareId, editToken: editKeyFromUrl });
          }
          settle(state as ShareableState, editable);
        })
        .catch(() => settle(null));

      // Replace URL with clean /s/{id} path (strip query params but keep share context)
      history.replaceState(null, "", `/s/${shareId}`);

      return () => clearTimeout(timeout);
    }

    if (inlineData) {
      decodeShareState(inlineData)
        .then((state) => settle(state))
        .catch(() => settle(null));
      return () => clearTimeout(timeout);
    }

    clearTimeout(timeout);
  }, [shareId, inlineData, editKeyFromUrl]);

  /** Get the active share info for this session (from refs, not localStorage). */
  const getActiveShare = useCallback((): StoredShareInfo | null => {
    if (activeShareIdRef.current && activeEditTokenRef.current) {
      return {
        shareId: activeShareIdRef.current,
        editToken: activeEditTokenRef.current,
      };
    }
    return null;
  }, []);

  const copyShareUrl = useCallback(async (state: ShareableState) => {
    setShareStatus("copying");
    setUrlWarning(null);
    setLastShareResult(null);
    try {
      let publicUrl: string;
      let editUrl: string | undefined;

      // Only reuse an existing share if we have an active session with it
      const active = getActiveShare();

      try {
        const res = await fetch("/api/share", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            state,
            existingId: active?.shareId,
            editToken: active?.editToken,
          }),
        });
        if (!res.ok) throw new Error("API error");
        const { id, editToken, updated } = await res.json();
        publicUrl = `${window.location.origin}/s/${id}`;
        editUrl = `${window.location.origin}/s/${id}?key=${editToken}`;

        storeShareInfo({ shareId: id, editToken });
        activeEditTokenRef.current = editToken;
        activeShareIdRef.current = id;
        setLastShareResult({ updated, editUrl });
      } catch {
        const encoded = await encodeShareState(state);
        publicUrl = `${window.location.origin}${window.location.pathname}#data=${encoded}`;
        if (publicUrl.length > 10000) {
          setUrlWarning(
            `Share URL is very long (${Math.round(publicUrl.length / 1000)}KB). Some browsers may truncate it.`
          );
        }
        setLastShareResult({ updated: false });
      }

      await navigator.clipboard.writeText(publicUrl);
      setShareStatus("copied");

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setShareStatus("idle");
      }, 5000);
    } catch {
      setShareStatus("error");
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setShareStatus("idle"), 2000);
    }
  }, [getActiveShare]);

  /** Silent auto-save: push current state to the server (only when active session exists). */
  const autoSave = useCallback(async (state: ShareableState) => {
    const active = getActiveShare();
    if (!active) return;
    try {
      await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          state,
          existingId: active.shareId,
          editToken: active.editToken,
        }),
      });
    } catch {
      // Silent fail — auto-save is best-effort
    }
  }, [getActiveShare]);

  /** Get the edit URL for the active session. */
  const getEditUrl = useCallback((): string | null => {
    const active = getActiveShare();
    if (!active) return null;
    return `${window.location.origin}/s/${active.shareId}?key=${active.editToken}`;
  }, [getActiveShare]);

  /** Whether this session has an active share (edit link can be recovered). */
  const hasExistingShare = useCallback((): boolean => {
    return !!getActiveShare();
  }, [getActiveShare]);

  /** Force a fresh share with a new ID and edit token (invalidates old edit link). */
  const freshShare = useCallback(async (state: ShareableState) => {
    setShareStatus("copying");
    setUrlWarning(null);
    setLastShareResult(null);
    try {
      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state }),
      });
      if (!res.ok) throw new Error("API error");
      const { id, editToken } = await res.json();
      const publicUrl = `${window.location.origin}/s/${id}`;
      const editUrl = `${window.location.origin}/s/${id}?key=${editToken}`;

      storeShareInfo({ shareId: id, editToken });
      activeEditTokenRef.current = editToken;
      activeShareIdRef.current = id;
      setLastShareResult({ updated: false, editUrl });

      await navigator.clipboard.writeText(publicUrl);
      setShareStatus("copied");

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setShareStatus("idle");
      }, 5000);
    } catch {
      setShareStatus("error");
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setShareStatus("idle"), 2000);
    }
  }, []);

  const exitSharedView = useCallback(() => {
    setIsSharedView(false);
    setIsEditingUnlocked(false);
    history.replaceState(null, "", window.location.pathname);
  }, []);

  /** Clear active share session so the next Share creates a fresh link. */
  const clearStoredShare = useCallback(() => {
    try {
      localStorage.removeItem(SHARE_TOKENS_KEY);
    } catch {
      // ignore
    }
    activeEditTokenRef.current = null;
    activeShareIdRef.current = null;
  }, []);

  return {
    isSharedView,
    isSharePending,
    sharedState,
    copyShareUrl,
    freshShare,
    autoSave,
    shareStatus,
    urlWarning,
    decodeFailed,
    exitSharedView,
    isEditingUnlocked,
    lastShareResult,
    getEditUrl,
    hasExistingShare,
    clearStoredShare,
  };
}
