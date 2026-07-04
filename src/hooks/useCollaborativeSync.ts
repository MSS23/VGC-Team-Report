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
  // Timestamp until which incoming version events are treated as our own
  // save being echoed back (and therefore consumed, not re-applied). The
  // server polls every ~5s, so a self-save can echo up to a full poll cycle
  // after the POST resolves — we keep suppressing briefly past `isSaving`.
  const suppressEchoUntil = useRef(0);
  const onRemoteUpdateRef = useRef(onRemoteUpdate);
  onRemoteUpdateRef.current = onRemoteUpdate;

  /** Mark that we're about to save — the resulting version bump is our own,
   *  so its echo must not be re-applied (re-applying regenerates IDs and
   *  retriggers autosave: the runaway loop that produced 98k version rows). */
  const markSaving = useCallback(() => {
    isSaving.current = true;
  }, []);

  /** Call after a save resolves. Clears the in-flight flag, optionally
   *  advances our known version, and keeps suppressing self-echoes for one
   *  poll interval so the server's lagging version echo is consumed rather
   *  than applied back into local state. */
  const updateVersion = useCallback((version?: number) => {
    isSaving.current = false;
    if (typeof version === "number" && version > versionRef.current) {
      versionRef.current = version;
    }
    suppressEchoUntil.current = Date.now() + 8000;
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
        try {
          const { version, state } = JSON.parse(e.data);
          if (version <= versionRef.current) return; // already known — nothing new

          // Self-echo suppression: while a save is in flight, or shortly after
          // one resolved, an incoming version bump is our own write coming back
          // from the server. Advance our pointer so we stay in sync, but do NOT
          // re-apply it — re-applying re-parses the paste and mints new plan IDs,
          // which makes local state differ and fires another autosave. That
          // feedback loop is what created 98,905 versions on a single share.
          if (isSaving.current || Date.now() < suppressEchoUntil.current) {
            versionRef.current = version;
            return;
          }

          versionRef.current = version;
          setSyncStatus("syncing");
          setLastRemoteUpdate(Date.now());
          onRemoteUpdateRef.current(state as ShareableState);
          setSyncStatus("synced");
          setTimeout(() => {
            if (!disposed) setSyncStatus("idle");
          }, 3000);
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
