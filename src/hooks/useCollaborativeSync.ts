"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import type { ShareableState } from "@/lib/sharing/url-codec";

const POLL_INTERVAL = 5000; // 5 seconds

interface UseCollaborativeSyncOptions {
  /** The share ID being edited */
  shareId: string | null;
  /** The edit key for authorization */
  editKey: string | null;
  /** Whether collaborative sync is enabled (must be in an editable shared view) */
  enabled: boolean;
  /** Called when a newer version is available from the server */
  onRemoteUpdate: (state: ShareableState) => void;
}

/**
 * Polls the server for updates to a shared team report.
 * When another collaborator saves changes, this hook detects the newer
 * version and calls onRemoteUpdate with the updated state.
 */
export function useCollaborativeSync({
  shareId,
  editKey,
  enabled,
  onRemoteUpdate,
}: UseCollaborativeSyncOptions) {
  const [collaborators, setCollaborators] = useState(0);
  const versionRef = useRef<number>(0);
  const isSaving = useRef(false);

  /** Mark that we're about to save — skip the next poll to avoid self-triggering */
  const markSaving = useCallback(() => {
    isSaving.current = true;
  }, []);

  /** Update our known version after a successful save */
  const updateVersion = useCallback((version: number) => {
    versionRef.current = version;
    isSaving.current = false;
  }, []);

  useEffect(() => {
    if (!enabled || !shareId || !editKey) return;

    let mounted = true;

    const poll = async () => {
      if (!mounted || isSaving.current) return;

      try {
        const url = versionRef.current > 0
          ? `/api/share/${shareId}?key=${editKey}&since=${versionRef.current}`
          : `/api/share/${shareId}?key=${editKey}`;

        const res = await fetch(url);

        if (!mounted) return;

        // 304 = no changes since our version
        if (res.status === 304) return;

        if (res.ok) {
          const data = await res.json();
          const serverVersion = data._version ?? 0;

          // First poll — just record the version
          if (versionRef.current === 0) {
            versionRef.current = serverVersion;
            return;
          }

          // Server has a newer version than what we know
          if (serverVersion > versionRef.current) {
            versionRef.current = serverVersion;
            // Strip internal fields before passing to handler
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { _editable, _version, ...state } = data;
            onRemoteUpdate(state as ShareableState);
          }
        }
      } catch {
        // Network error — silently retry on next interval
      }
    };

    // Initial poll to get current version
    poll();

    const interval = setInterval(poll, POLL_INTERVAL);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [enabled, shareId, editKey, onRemoteUpdate]);

  return { collaborators, markSaving, updateVersion };
}
