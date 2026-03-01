"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // On mount: check URL hash for shared data
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash.startsWith("#data=")) return;

    const encoded = hash.slice("#data=".length);
    if (!encoded) return;

    decodeShareState(encoded).then((state) => {
      if (state) {
        setIsSharedView(true);
        setSharedState(state);
      }
    });
  }, []);

  const copyShareUrl = useCallback(async (state: ShareableState) => {
    setShareStatus("copying");
    try {
      const encoded = await encodeShareState(state);
      const url = `${window.location.origin}${window.location.pathname}#data=${encoded}`;
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

  return { isSharedView, sharedState, copyShareUrl, shareStatus };
}
