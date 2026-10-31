"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import type { ShareableState } from "@/lib/sharing/url-codec";

export type SyncStatus = "idle" | "connecting" | "syncing" | "synced" | "conflict" | "disconnected";

interface UseCollaborativeSyncOptions {
  /** The share ID being edited */
  shareId: string | null;
  /** Whether collaborative sync is enabled (must be in an editable shared view) */
  enabled: boolean;
  /** Called when a newer version is available from the server */
  onRemoteUpdate: (state: ShareableState, version: number) => void;
  getVersion?: () => number;
}

/**
 * Real-time collaborative sync via Server-Sent Events.
 *
 * Connects to /api/sync/{shareId} SSE stream for instant updates when
 * another collaborator saves changes. Reconnects with exponential backoff.
 */
export function useCollaborativeSync({
  shareId,
  enabled,
  onRemoteUpdate,
  getVersion,
}: UseCollaborativeSyncOptions) {
  const [collaborators, setCollaborators] = useState(0);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");
  const [lastRemoteUpdate, setLastRemoteUpdate] = useState<number | null>(null);
  const versionRef = useRef<number>(0);
  const savesInFlight = useRef(0);
  const pendingRemote = useRef<{ version: number; state: ShareableState } | null>(null);
  const onRemoteUpdateRef = useRef(onRemoteUpdate);
  onRemoteUpdateRef.current = onRemoteUpdate;
  const getVersionRef = useRef(getVersion);
  getVersionRef.current = getVersion;
  const applyRemote = useCallback((event: { version: number; state: ShareableState }) => {
    if (event.version <= versionRef.current) return;
    versionRef.current = event.version;
    setLastRemoteUpdate(Date.now());
    onRemoteUpdateRef.current(event.state, event.version);
    setSyncStatus("synced");
  }, []);
  const markSaving = useCallback(() => { savesInFlight.current++; }, []);
  const updateVersion = useCallback((version?: number) => {
    savesInFlight.current = Math.max(0, savesInFlight.current - 1);
    if (typeof version === "number") versionRef.current = Math.max(versionRef.current, version);
    if (!savesInFlight.current && pendingRemote.current) {
      const pending = pendingRemote.current; pendingRemote.current = null;
      applyRemote(pending);
    }
  }, [applyRemote]);

  /** Generate a stable session ID for presence tracking */
  const sessionIdRef = useRef<string>("");
  if (!sessionIdRef.current) {
    sessionIdRef.current = Math.random().toString(36).slice(2, 10);
  }

  useEffect(() => {
    if (!enabled || !shareId) {
      setSyncStatus("idle");
      setCollaborators(0);
      return;
    }

    versionRef.current = getVersionRef.current?.() ?? 0;
    pendingRemote.current = null; savesInFlight.current = 0;
    let eventSource: EventSource | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let retryCount = 0;
    let disposed = false;

    function connect() {
      if (disposed) return;

      const params = new URLSearchParams({
        session: sessionIdRef.current,
        ...(versionRef.current > 0 ? { since: String(versionRef.current) } : {}),
      });

      const url = `/api/sync/${shareId}?${params}`;
      setSyncStatus("connecting");

      const es = new EventSource(url);
      eventSource = es;

      es.addEventListener("version", (e) => {
        try {
          const { version, state } = JSON.parse(e.data);
          if (version <= versionRef.current) return; // already known — nothing new

          // Queue while saving. Once the POST returns its exact version, discard
          // only that version's echo; another editor's newer save must survive.
          if (savesInFlight.current) {
            if (!pendingRemote.current || version > pendingRemote.current.version) pendingRemote.current = { version, state };
            return;
          }
          applyRemote({ version, state });
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
  }, [enabled, shareId, applyRemote]);

  return { collaborators, syncStatus, lastRemoteUpdate, markSaving, updateVersion };
}
