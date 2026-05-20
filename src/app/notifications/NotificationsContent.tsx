"use client";

import { useState, useEffect, useCallback } from "react";
import { useNotifications, type Notification } from "@/hooks/useNotifications";
import { relativeTime } from "@/lib/utils/relative-time";

const TYPE_ICONS: Record<string, { icon: React.ReactNode; color: string }> = {
  comment: {
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
      </svg>
    ),
    color: "text-blue-500",
  },
  reaction: {
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none">
        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
      </svg>
    ),
    color: "text-red-500",
  },
  new_report: {
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <polyline points="14 2 14 8 20 8" />
      </svg>
    ),
    color: "text-accent",
  },
  collab_invite: {
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87" />
        <path d="M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
    color: "text-purple-500",
  },
};

const PAGE_SIZE = 50;

function groupNotifications(notifications: Notification[]) {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfWeek = startOfToday - (now.getDay() === 0 ? 6 : now.getDay() - 1) * 86_400_000;

  const today: Notification[] = [];
  const thisWeek: Notification[] = [];
  const older: Notification[] = [];

  for (const n of notifications) {
    const ts = new Date(n.createdAt).getTime();
    if (ts >= startOfToday) {
      today.push(n);
    } else if (ts >= startOfWeek) {
      thisWeek.push(n);
    } else {
      older.push(n);
    }
  }

  return { today, thisWeek, older };
}

function NotificationItem({ notification }: { notification: Notification }) {
  const typeInfo = TYPE_ICONS[notification.type] ?? TYPE_ICONS.comment;
  const href = notification.sourceShareId
    ? `/s/${notification.sourceShareId}`
    : notification.sourceUserName
    ? `/creator/${notification.sourceUserName}`
    : "#";

  return (
    <li>
    <a
      href={href}
      className={`flex items-start gap-4 px-4 py-4 rounded-xl transition-colors hover:bg-surface-alt/50 ${
        !notification.read
          ? "border-l-2 border-accent bg-accent/5"
          : "border-l-2 border-transparent"
      }`}
    >
      <div
        className={`flex-shrink-0 w-10 h-10 rounded-full bg-surface-alt flex items-center justify-center ${typeInfo.color}`}
      >
        {typeInfo.icon}
      </div>
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm leading-relaxed ${
            !notification.read
              ? "text-text-primary font-semibold"
              : "text-text-secondary"
          }`}
        >
          {notification.message}
        </p>
        <p className="text-xs text-text-tertiary mt-1">
          {relativeTime(notification.createdAt)}
        </p>
      </div>
      {!notification.read && (
        <div className="flex-shrink-0 w-2.5 h-2.5 rounded-full bg-accent mt-2" aria-hidden="true" />
      )}
    </a>
    </li>
  );
}

function NotificationGroup({
  label,
  notifications,
}: {
  label: string;
  notifications: Notification[];
}) {
  if (notifications.length === 0) return null;
  const headingId = `notif-group-${label.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <section className="mb-6" aria-labelledby={headingId}>
      <h2 id={headingId} className="text-[10px] font-extrabold text-text-tertiary uppercase tracking-widest mb-2 px-1">
        {label}
      </h2>
      <ul className="bg-surface border border-border rounded-2xl overflow-hidden divide-y divide-border/50 list-none p-0 m-0">
        {notifications.map((n) => (
          <NotificationItem key={n.id} notification={n} />
        ))}
      </ul>
    </section>
  );
}

export function NotificationsContent() {
  const { notifications: realtimeNotifications, unreadCount, hasMore: hookHasMore, loading: hookLoading, markAllRead } =
    useNotifications(true);

  const [allNotifications, setAllNotifications] = useState<Notification[]>([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [liveMessage, setLiveMessage] = useState("");

  // Seed allNotifications from the hook's initial fetch (eliminates the duplicate fetchInitial call)
  useEffect(() => {
    if (realtimeNotifications.length > 0 && !initialLoaded) {
      setAllNotifications(realtimeNotifications);
      setOffset(realtimeNotifications.length);
      setHasMore(hookHasMore);
      setInitialLoaded(true);
    } else if (!hookLoading && !initialLoaded) {
      // Hook finished loading but returned empty — mark as loaded
      setInitialLoaded(true);
    } else if (realtimeNotifications.length > 0 && initialLoaded) {
      // Merge in any new notifications at the top without losing paginated ones
      setAllNotifications((prev) => {
        const existingIds = new Set(prev.map((n) => n.id));
        const newOnes = realtimeNotifications.filter((n) => !existingIds.has(n.id));
        if (newOnes.length === 0) {
          // Update read status for existing
          return prev.map((n) => {
            const updated = realtimeNotifications.find((r) => r.id === n.id);
            return updated ? { ...n, read: updated.read } : n;
          });
        }
        setLiveMessage(`${newOnes.length} new notification${newOnes.length === 1 ? "" : "s"} arrived.`);
        return [...newOnes, ...prev];
      });
    }
  }, [realtimeNotifications, hookHasMore, hookLoading, initialLoaded]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const res = await fetch(
        `/api/user/notifications?limit=${PAGE_SIZE}&offset=${offset}`
      );
      if (!res.ok) return;
      const data = await res.json();
      const newItems: Notification[] = data.notifications ?? [];
      setAllNotifications((prev) => {
        const existingIds = new Set(prev.map((n) => n.id));
        return [...prev, ...newItems.filter((n) => !existingIds.has(n.id))];
      });
      setOffset((prev) => prev + newItems.length);
      setHasMore(data.hasMore ?? false);
    } catch {
      // silently fail
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, offset]);

  const handleMarkAllRead = useCallback(async () => {
    await markAllRead();
    setAllNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, [markAllRead]);

  const { today, thisWeek, older } = groupNotifications(allNotifications);
  const isEmpty = allNotifications.length === 0 && initialLoaded;

  return (
    <div className="min-h-screen bg-background text-text-primary">
      <div aria-live="polite" aria-atomic="true" className="sr-only">{liveMessage}</div>
      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Notifications
            </h1>
            <p className="text-sm text-text-secondary mt-0.5">
              Your activity feed
            </p>
          </div>
          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-accent/10 text-accent">
                {unreadCount} unread
              </span>
            )}
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="px-4 py-2 text-sm font-bold rounded-xl bg-surface border border-border text-text-secondary hover:text-accent hover:border-accent/30 transition-all cursor-pointer"
              >
                Mark all as read
              </button>
            )}
          </div>
        </div>

        {/* Loading state */}
        {!initialLoaded && (
          <div className="flex justify-center items-start pt-16 min-h-[40vh]">
            <div className="flex items-center gap-3 text-text-secondary">
              <svg
                className="animate-spin h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              <span className="text-sm font-medium">Loading notifications...</span>
            </div>
          </div>
        )}

        {/* Empty state */}
        {isEmpty && (
          <div className="text-center py-20">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-surface-alt flex items-center justify-center">
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-text-tertiary"
              >
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 01-3.46 0" />
              </svg>
            </div>
            <p className="text-base font-bold text-text-primary mb-1">
              No notifications yet
            </p>
            <p className="text-sm text-text-secondary max-w-sm mx-auto">
              Share a report to get started! You&apos;ll see comments, reactions, and collaboration invites here.
            </p>
            <a
              href="/"
              className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-accent text-white text-sm font-bold rounded-xl hover:brightness-110 active:scale-[0.97] shadow-md shadow-accent/30 transition-all tracking-wide"
            >
              Create a Report
            </a>
          </div>
        )}

        {/* Grouped notifications */}
        {initialLoaded && !isEmpty && (
          <>
            <NotificationGroup label="Today" notifications={today} />
            <NotificationGroup label="This Week" notifications={thisWeek} />
            <NotificationGroup label="Older" notifications={older} />

            {/* Load more */}
            {hasMore && (
              <div className="flex justify-center mt-4">
                <button
                  type="button"
                  onClick={loadMore}
                  disabled={loadingMore}
                  aria-busy={loadingMore}
                  className="px-6 py-2.5 text-sm font-bold rounded-xl bg-surface border border-border text-text-secondary hover:text-accent hover:border-accent/30 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-wait"
                >
                  {loadingMore ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Loading...
                    </span>
                  ) : (
                    "Load more"
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
