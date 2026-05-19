"use client";

import { useState, useRef, useEffect } from "react";
import { useNotifications } from "@/hooks/useNotifications";
import { relativeTime } from "@/lib/utils/relative-time";

const TYPE_ICONS: Record<string, { icon: React.ReactNode; color: string }> = {
  comment: {
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
      </svg>
    ),
    color: "text-blue-500",
  },
  reaction: {
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none">
        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
      </svg>
    ),
    color: "text-red-500",
  },
  new_report: {
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <polyline points="14 2 14 8 20 8" />
      </svg>
    ),
    color: "text-accent",
  },
  collab_invite: {
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87" />
        <path d="M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
    color: "text-purple-500",
  },
};

export function NotificationBell({ enabled }: { enabled: boolean }) {
  const { notifications, unreadCount, markAllRead } = useNotifications(enabled);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  if (!enabled) return null;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="true"
        className="relative p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-alt transition-all"
        aria-label={unreadCount > 0 ? `Notifications (${unreadCount} unread)` : "Notifications"}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 01-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Notifications"
          className="absolute right-0 top-full mt-2 w-80 bg-surface border border-border rounded-xl shadow-xl z-50 overflow-hidden animate-fade-in"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h3 className="text-sm font-bold text-text-primary">Notifications</h3>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => { markAllRead(); }}
                className="text-[10px] font-bold text-accent hover:underline cursor-pointer"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-text-tertiary text-sm">
                No notifications yet
              </div>
            ) : (
              notifications.map((n) => {
                const typeInfo = TYPE_ICONS[n.type] ?? TYPE_ICONS.comment;
                return (
                  <a
                    key={n.id}
                    href={n.sourceShareId ? `/s/${n.sourceShareId}` : n.sourceUserName ? `/creator/${n.sourceUserName}` : "#"}
                    className={`flex items-start gap-3 px-4 py-3 hover:bg-surface-alt/50 transition-colors border-b border-border/50 last:border-0 ${
                      !n.read ? "bg-accent/5" : ""
                    }`}
                    onClick={() => setOpen(false)}
                  >
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full bg-surface-alt flex items-center justify-center ${typeInfo.color}`}>
                      {typeInfo.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs leading-relaxed ${!n.read ? "text-text-primary font-semibold" : "text-text-secondary"}`}>
                        {n.message}
                      </p>
                      <p className="text-[10px] text-text-tertiary mt-0.5">
                        {relativeTime(n.createdAt)}
                      </p>
                    </div>
                    {!n.read && (
                      <div className="flex-shrink-0 w-2 h-2 rounded-full bg-accent mt-1.5" />
                    )}
                  </a>
                );
              })
            )}
          </div>
          <div className="px-4 py-2.5 border-t border-border flex items-center justify-end">
            <a
              href="/notifications"
              className="text-xs text-accent hover:underline"
              onClick={() => setOpen(false)}
            >
              View all notifications →
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
