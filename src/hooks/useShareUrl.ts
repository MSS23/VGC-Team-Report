"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import {
  encodeShareState,
  decodeShareState,
  type ShareableState,
} from "@/lib/sharing/url-codec";

type ShareStatus = "idle" | "copying" | "copied" | "error";

export interface ForkedFromMeta {
  id: string;
  creatorName: string | null;
  tournamentName: string | null;
  species: string[];
  deleted: boolean;
}

const SHARE_TOKENS_KEY = "vgc-share-tokens";

interface StoredShareInfo {
  shareId: string;
  editToken: string;
}

function storeShareInfo(info: StoredShareInfo) {
  try {
    const existing = localStorage.getItem(SHARE_TOKENS_KEY);
    let tokens: StoredShareInfo[] = [];
    if (existing) {
      const parsed = JSON.parse(existing);
      // Handle legacy single-object format
      tokens = Array.isArray(parsed) ? parsed : [parsed];
    }
    // Replace if same shareId exists, otherwise append
    const idx = tokens.findIndex((t) => t.shareId === info.shareId);
    if (idx >= 0) tokens[idx] = info;
    else tokens.push(info);
    localStorage.setItem(SHARE_TOKENS_KEY, JSON.stringify(tokens));
  } catch {
    localStorage.setItem(SHARE_TOKENS_KEY, JSON.stringify([info]));
  }
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
  const [isOwner, setIsOwner] = useState(false);
  const [fetchedIsPublic, setFetchedIsPublic] = useState<boolean | null>(null);
  const [forkedFrom, setForkedFrom] = useState<ForkedFromMeta | null>(null);
  const [lastShareResult, setLastShareResult] = useState<{
    updated: boolean;
    editUrl?: string;
    publicUrl?: string;
  } | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Active session refs — only set when we have a verified edit session
  // (loaded via edit link or just created/updated a share in this session).
  // These are the ONLY source of truth for whether to update vs create.
  // localStorage is only used to persist across page refreshes within the same editing session.
  const activeEditTokenRef = useRef<string | null>(null);
  const activeShareIdRef = useRef<string | null>(null);
  // Reactive state version of activeShareIdRef — tracks whether a share session exists
  // (set after sharing from home page, or when viewing own report at /s/{id})
  const [sessionShareId, setSessionShareId] = useState<string | null>(null);

  // Clear session state when URL no longer points at a share.
  // Without this, navigating from /s/{id} back to / would leave
  // activeShareIdRef/activeEditTokenRef pointing at the old share, causing
  // the next Share click to silently overwrite that report with whatever
  // is currently in memory. React bails out of setState when the value is
  // unchanged, so running this unconditionally on every home-page render
  // is effectively free.
  useEffect(() => {
    if (shareId || inlineData) return;
    activeEditTokenRef.current = null;
    activeShareIdRef.current = null;
    setSessionShareId(null);
    setSharedState(null);
    setIsSharedView(false);
    setIsEditingUnlocked(false);
    setIsOwner(false);
    setFetchedIsPublic(null);
    setForkedFrom(null);
  }, [shareId, inlineData]);

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
      // Always fetch without the edit key first — the API will grant edit
      // access to authenticated owners/collaborators automatically.
      // The ?key= param is preserved in editKeyFromUrl for the sign-in gate
      // in page.tsx. After sign-in, the page reloads and the authenticated
      // request gets edit access without needing the key in the URL.
      const fetchUrl = `/api/share/${shareId}`;

      fetch(fetchUrl)
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (!data) return settle(null);
          const editable = data._editable === true;
          if (data._isPublic !== undefined) setFetchedIsPublic(!!data._isPublic);
          setIsOwner(!!data._isOwner);
          setForkedFrom((data._forkedFrom as ForkedFromMeta | null) ?? null);
          // The API returns _editToken for authenticated owners/collaborators
          const ownerEditToken = data._editToken as string | undefined;
          // Strip internal flags before treating as ShareableState
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { _editable, _isPublic: _ip, _editToken: _et, _isOwner: _io, _version: _v, _collaborators: _c, _forkedFrom: _ff, ...state } = data;
          // Set active edit session — only from server-provided token (authenticated)
          if (editable && ownerEditToken) {
            activeEditTokenRef.current = ownerEditToken;
            activeShareIdRef.current = shareId;
            setSessionShareId(shareId);
            storeShareInfo({ shareId, editToken: ownerEditToken });
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

  const copyShareUrl = useCallback(async (state: ShareableState, isPublic?: boolean) => {
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
            isPublic,
            isPublish: true,
          }),
        });
        if (!res.ok) throw new Error("API error");
        const { id, editToken, updated } = await res.json();
        publicUrl = `${window.location.origin}/s/${id}`;
        editUrl = `${window.location.origin}/s/${id}?key=${editToken}`;

        storeShareInfo({ shareId: id, editToken });
        activeEditTokenRef.current = editToken;
        activeShareIdRef.current = id;
        setSessionShareId(id);
        setLastShareResult({ updated, editUrl, publicUrl });
      } catch {
        setShareStatus("error");
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => setShareStatus("idle"), 3000);
        return;
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

  const [autoSaveStatus, setAutoSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const autoSaveResetRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** Silent auto-save: push current state to the server (only when active session exists). */
  const autoSave = useCallback(async (state: ShareableState, isPublic?: boolean) => {
    const active = getActiveShare();
    if (!active) return;
    setAutoSaveStatus("saving");
    if (autoSaveResetRef.current) clearTimeout(autoSaveResetRef.current);
    try {
      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          state,
          existingId: active.shareId,
          editToken: active.editToken,
          isPublic,
        }),
      });
      setAutoSaveStatus(res.ok ? "saved" : "error");
    } catch {
      setAutoSaveStatus("error");
    }
    autoSaveResetRef.current = setTimeout(() => setAutoSaveStatus("idle"), 3000);
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
  const freshShare = useCallback(async (state: ShareableState, isPublic?: boolean) => {
    setShareStatus("copying");
    setUrlWarning(null);
    setLastShareResult(null);
    try {
      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state, isPublic }),
      });
      if (!res.ok) throw new Error("API error");
      const { id, editToken } = await res.json();
      const publicUrl = `${window.location.origin}/s/${id}`;
      const editUrl = `${window.location.origin}/s/${id}?key=${editToken}`;

      storeShareInfo({ shareId: id, editToken });
      activeEditTokenRef.current = editToken;
      activeShareIdRef.current = id;
      setSessionShareId(id);
      setLastShareResult({ updated: false, editUrl, publicUrl });

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

  /**
   * Fork an existing share: creates a new report owned by the current user
   * that tracks its lineage back to the source via forked_from_id.
   * Returns { id, editToken } on success, null on failure.
   */
  const forkReport = useCallback(async (
    sourceId: string
  ): Promise<{ id: string; editToken: string } | null> => {
    try {
      const res = await fetch(`/api/share/${sourceId}/fork`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) return null;
      const data = await res.json();
      if (!data?.id || !data?.editToken) return null;
      storeShareInfo({ shareId: data.id, editToken: data.editToken });
      return { id: data.id, editToken: data.editToken };
    } catch {
      return null;
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
    setSessionShareId(null);
  }, []);

  return {
    isSharedView,
    isSharePending,
    sharedState,
    shareId,
    editKeyFromUrl,
    copyShareUrl,
    freshShare,
    autoSave,
    shareStatus,
    urlWarning,
    decodeFailed,
    exitSharedView,
    isEditingUnlocked,
    isOwner,
    sessionShareId,
    lastShareResult,
    getEditUrl,
    hasExistingShare,
    clearStoredShare,
    fetchedIsPublic,
    autoSaveStatus,
    forkedFrom,
    forkReport,
  };
}
