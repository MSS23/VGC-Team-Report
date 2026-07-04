"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export interface Notification {
  id: number;
  type: "comment" | "reaction" | "new_report" | "collab_invite";
  sourceShareId: string | null;
  sourceUserName: string | null;
  message: string;
  read: boolean;
  createdAt: string;
}

export function useNotifications(enabled: boolean) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);

  const fetchNotifications = useCallback(async () => {
    if (!enabled) return;
    try {
      const res = await fetch("/api/user/notifications?limit=50&offset=0");
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data.notifications ?? []);
      setUnreadCount(data.unreadCount ?? 0);
      setHasMore(data.hasMore ?? false);
      setTotal(data.total ?? 0);
    } catch {
      // silently fail
    }
  }, [enabled]);

  // Lightweight poll: fetch only the unread count, skipping the full row list.
  const fetchCount = useCallback(async () => {
    if (!enabled) return;
    try {
      const res = await fetch("/api/user/notifications?countOnly=1");
      if (!res.ok) return;
      const data = await res.json();
      setUnreadCount(data.unreadCount ?? 0);
      setTotal(data.total ?? 0);
    } catch {
      // silently fail
    }
  }, [enabled]);

  // Initial fetch
  useEffect(() => {
    if (!enabled) return;
    setLoading(true);
    fetchNotifications().finally(() => setLoading(false));
  }, [enabled, fetchNotifications]);

  // Poll on visibility change (when tab becomes visible) — count-only, cheap.
  useEffect(() => {
    if (!enabled) return;
    const handleVisibility = () => {
      if (document.visibilityState === "visible") fetchCount();
    };
    document.addEventListener("visibilitychange", handleVisibility);

    // Also poll every 60s — count-only to keep DB load minimal.
    intervalRef.current = setInterval(fetchCount, 60_000);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      clearInterval(intervalRef.current);
    };
  }, [enabled, fetchCount]);

  const markAllRead = useCallback(async () => {
    try {
      await fetch("/api/user/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
      // silently fail
    }
  }, []);

  const markIdsRead = useCallback(async (ids: number[]) => {
    if (ids.length === 0) return;
    try {
      await fetch("/api/user/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      setNotifications((prev) =>
        prev.map((n) => (ids.includes(n.id) ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - ids.length));
    } catch {
      // silently fail
    }
  }, []);

  return { notifications, unreadCount, hasMore, total, loading, markAllRead, markIdsRead, refetch: fetchNotifications };
}
