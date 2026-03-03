"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  encodeShareState,
  decodeShareState,
  type ShareableState,
} from "@/lib/sharing/url-codec";

type ShareStatus = "idle" | "copying" | "copied" | "error";

export function useShareUrl() {
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

  // On mount: check URL hash for shared data
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash.startsWith("#data=")) return;

    const encoded = hash.slice("#data=".length);
    if (!encoded) return;

    let settled = false;
    const timeout = setTimeout(() => {
      if (!settled) {
        settled = true;
        setDecodeFailed(true);
      }
    }, 5000);

    decodeShareState(encoded).then((state) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      if (state) {
        setIsSharedView(true);
        setSharedState(state);
      } else {
        setDecodeFailed(true);
      }
    }).catch(() => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      setDecodeFailed(true);
    });

    return () => clearTimeout(timeout);
  }, []);

  const copyShareUrl = useCallback(async (state: ShareableState) => {
    setShareStatus("copying");
    setUrlWarning(null);
    try {
      const encoded = await encodeShareState(state);
      const url = `${window.location.origin}${window.location.pathname}#data=${encoded}`;

      if (url.length > 10000) {
        setUrlWarning(`Share URL is very long (${Math.round(url.length / 1000)}KB). Some browsers may truncate it. Consider reducing notes or calcs.`);
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
    // Remove the hash from the URL without reloading
    history.replaceState(null, "", window.location.pathname);
  }, []);

  return {
    isSharedView,
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
