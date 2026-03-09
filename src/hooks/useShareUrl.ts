"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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

function getStoredShareInfo(): StoredShareInfo | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SHARE_TOKENS_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredShareInfo;
  } catch {
    return null;
  }
}

function storeShareInfo(info: StoredShareInfo) {
  localStorage.setItem(SHARE_TOKENS_KEY, JSON.stringify(info));
}

/** Synchronously detect share URL from query params or hash (runs before effects). */
function detectShareParam(): string | null {
  if (typeof window === "undefined") return null;
  const url = new URL(window.location.href);
  const s = url.searchParams.get("s");
  if (s) return s;
  const hash = window.location.hash;
  if (hash.startsWith("#id=")) return hash.slice("#id=".length) || null;
  return null;
}

/** Detect edit key from ?key= query param. */
function detectEditKey(): string | null {
  if (typeof window === "undefined") return null;
  const url = new URL(window.location.href);
  return url.searchParams.get("key");
}

function detectInlineData(): string | null {
  if (typeof window === "undefined") return null;
  const hash = window.location.hash;
  if (hash.startsWith("#data=")) return hash.slice("#data=".length) || null;
  return null;
}

export function useShareUrl() {
  const [shareId] = useState(detectShareParam);
  const [editKeyFromUrl] = useState(detectEditKey);
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
  // Store the active edit token (from URL key or from creating a share)
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
            activeEditTokenRef.current = editKeyFromUrl;
            activeShareIdRef.current = shareId;
            // Also store locally for auto-save
            storeShareInfo({ shareId, editToken: editKeyFromUrl });
          }
          settle(state as ShareableState, editable);
        })
        .catch(() => settle(null));

      // Clean up query params from URL (cosmetic)
      const url = new URL(window.location.href);
      if (url.searchParams.has("s") || url.searchParams.has("key")) {
        url.searchParams.delete("s");
        url.searchParams.delete("key");
        const clean = url.pathname + (url.search || "") + url.hash;
        history.replaceState(null, "", clean);
      }

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

  const copyShareUrl = useCallback(async (state: ShareableState) => {
    setShareStatus("copying");
    setUrlWarning(null);
    setLastShareResult(null);
    try {
      let publicUrl: string;
      let editUrl: string | undefined;

      const stored = getStoredShareInfo();

      try {
        const res = await fetch("/api/share", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            state,
            existingId: stored?.shareId,
            editToken: stored?.editToken,
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
  }, []);

  /** Silent auto-save: push current state to the server without copying URL. */
  const autoSave = useCallback(async (state: ShareableState) => {
    const stored = getStoredShareInfo();
    if (!stored) return;
    try {
      await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          state,
          existingId: stored.shareId,
          editToken: stored.editToken,
        }),
      });
    } catch {
      // Silent fail — auto-save is best-effort
    }
  }, []);

  /** Get the edit URL from localStorage (if a share exists on this browser). */
  const getEditUrl = useCallback((): string | null => {
    const stored = getStoredShareInfo();
    if (!stored) return null;
    return `${window.location.origin}/s/${stored.shareId}?key=${stored.editToken}`;
  }, []);

  /** Whether this browser has a stored share (edit link can be recovered). */
  const hasExistingShare = useCallback((): boolean => {
    return !!getStoredShareInfo();
  }, []);

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
  };
}
