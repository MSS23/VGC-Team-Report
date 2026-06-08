"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import type { ShareableState } from "@/lib/sharing/url-codec";

export type SyncStatus = "idle" | "connecting" | "syncing" | "synced" | "conflict" | "disconnected";

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
 * Real-time collaborative sync via Server-Sent Events.
 *
 * Connects to /api/sync/{shareId} SSE stream for instant updates when
 * another collaborator saves changes. Reconnects with exponential backoff.
 */
export function useCollaborativeSync({
  shareId,
  editKey,
  enabled,
  onRemoteUpdate,
}: UseCollaborativeSyncOptions) {
  const [collaborators, setCollaborators] = useState(0);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");
  const [lastRemoteUpdate, setLastRemoteUpdate] = useState<number | null>(null);
  const versionRef = useRef<number>(0);
  const isSaving = useRef(false);
  const onRemoteUpdateRef = useRef(onRemoteUpdate);
  onRemoteUpdateRef.current = onRemoteUpdate;

  /** Mark that we're about to save — ignore the next version event to avoid self-triggering */
  const markSaving = useCallback(() => {
    isSaving.current = true;
  }, []);

  /** Update our known version after a successful save */
  const updateVersion = useCallback((version: number) => {
    versionRef.current = version;
    isSaving.current = false;
  }, []);

  /** Generate a stable session ID for presence tracking */
  const sessionIdRef = useRef<string>("");
  if (!sessionIdRef.current) {
    sessionIdRef.current = Math.random().toString(36).slice(2, 10);
  }

  useEffect(() => {
    if (!enabled || !shareId || !editKey) {
      setSyncStatus("idle");
      setCollaborators(0);
      return;
    }

    let eventSource: EventSource | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let retryCount = 0;
    let disposed = false;

    function connect() {
      if (disposed) return;

      const params = new URLSearchParams({
        key: editKey!,
        session: sessionIdRef.current,
        ...(versionRef.current > 0 ? { since: String(versionRef.current) } : {}),
      });

      const url = `/api/sync/${shareId}?${params}`;
      setSyncStatus("connecting");

      const es = new EventSource(url);
      eventSource = es;

      es.addEventListener("version", (e) => {
        if (isSaving.current) return;

        try {
          const parsed: unknown = JSON.parse(e.data);
          if (!parsed || typeof parsed !== "object") return;
          const { version, state } = parsed as { version?: unknown; state?: unknown };
          if (typeof version !== "number" || !Number.isFinite(version)) return;
          if (!state || typeof state !== "object") return;
          if (version > versionRef.current) {
            versionRef.current = version;
            setSyncStatus("syncing");
            setLastRemoteUpdate(Date.now());
            onRemoteUpdateRef.current(state as ShareableState);
            setSyncStatus("synced");
            setTimeout(() => {
              if (!disposed) setSyncStatus("idle");
            }, 3000);
          }
        } catch {
          // Malformed event — ignore
        }
      });

      es.addEventListener("presence", (e) => {
        try {
          const { collaborators: count } = JSON.parse(e.data);
          setCollaborators(count);
        } catch {
          // Ignore
        }
      });

      es.addEventListener("ping", () => {
        retryCount = 0;
      });

      es.onopen = () => {
        setSyncStatus("idle");
        retryCount = 0;
      };

      es.onerror = () => {
        es.close();
        eventSource = null;
        if (disposed) return;
        setSyncStatus("disconnected");

        const delay = Math.min(1000 * Math.pow(2, retryCount), 30_000);
        retryCount++;
        retryTimer = setTimeout(connect, delay);
      };
    }

    connect();

    return () => {
      disposed = true;
      eventSource?.close();
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, [enabled, shareId, editKey]);

  return { collaborators, syncStatus, lastRemoteUpdate, markSaving, updateVersion };
}
