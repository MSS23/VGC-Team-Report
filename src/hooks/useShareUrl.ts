"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  encodeShareState,
  decodeShareState,
  type ShareableState,
} from "@/lib/sharing/url-codec";

type ShareStatus = "idle" | "copying" | "copied" | "error";

/** Synchronously detect share URL from query params or hash (runs before effects). */
function detectShareParam(): string | null {
  if (typeof window === "undefined") return null;
  // Primary: ?s= query param (from server-side redirect)
  const url = new URL(window.location.href);
  const s = url.searchParams.get("s");
  if (s) return s;
  // Legacy: #id= hash
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
  // Detect share params synchronously so isSharePending is true from first render
  const [shareId] = useState(detectShareParam);
  const [inlineData] = useState(detectInlineData);
  const isSharePending = !!(shareId || inlineData);

  const [isSharedView, setIsSharedView] = useState(false);
  const [sharedState, setSharedState] = useState<ShareableState | null>(null);
  const [shareStatus, setShareStatus] = useState<ShareStatus>("idle");
  const [urlWarning, setUrlWarning] = useState<string | null>(null);
  const [decodeFailed, setDecodeFailed] = useState(false);
  const [isEditingUnlocked, setIsEditingUnlocked] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hasPasscode = useMemo(
    () => !!sharedState?.passcodeHash,
    [sharedState?.passcodeHash]
  );

  const passcodeHash = sharedState?.passcodeHash ?? null;

  // Fetch shared state on mount
  useEffect(() => {
    let settled = false;
    const timeout = setTimeout(() => {
      if (!settled) {
        settled = true;
        setDecodeFailed(true);
      }
    }, 5000);

    const settle = (state: ShareableState | null) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      if (state) {
        setIsSharedView(true);
        setSharedState(state);
      } else {
        setDecodeFailed(true);
      }
    };

    if (shareId) {
      fetch(`/api/share/${shareId}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((state) => settle(state as ShareableState | null))
        .catch(() => settle(null));

      // Clean up query param from URL (cosmetic)
      const url = new URL(window.location.href);
      if (url.searchParams.has("s")) {
        url.searchParams.delete("s");
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

    // No share params — clear timeout
    clearTimeout(timeout);
  }, [shareId, inlineData]);

  const copyShareUrl = useCallback(async (state: ShareableState) => {
    setShareStatus("copying");
    setUrlWarning(null);
    try {
      let url: string;

      // Try short URL via API
      try {
        const res = await fetch("/api/share", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(state),
        });
        if (!res.ok) throw new Error("API error");
        const { id } = await res.json();
        url = `${window.location.origin}/s/${id}`;
      } catch {
        // Fallback to inline encoding
        const encoded = await encodeShareState(state);
        url = `${window.location.origin}${window.location.pathname}#data=${encoded}`;
        if (url.length > 10000) {
          setUrlWarning(
            `Share URL is very long (${Math.round(url.length / 1000)}KB). Some browsers may truncate it. Consider reducing notes or calcs.`
          );
        }
      }

      await navigator.clipboard.writeText(url);
      setShareStatus("copied");

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setShareStatus("idle"), 2000);
    } catch {
      setShareStatus("error");
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setShareStatus("idle"), 2000);
    }
  }, []);

  const unlockEditing = useCallback(() => {
    setIsEditingUnlocked(true);
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
    shareStatus,
    urlWarning,
    decodeFailed,
    exitSharedView,
    isEditingUnlocked,
    hasPasscode,
    passcodeHash,
    unlockEditing,
  };
}
