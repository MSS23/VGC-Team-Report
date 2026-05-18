# /notifications Page Design
_Audit date: 2026-05-18_

---

## 1. Infrastructure Audit

### What exists

| File | Role | Notes |
|------|------|-------|
| `src/hooks/useNotifications.ts` | Client hook | Fetches `/api/user/notifications`, polls every 60 s + on tab-focus, exposes `markAllRead` (PATCH), `refetch` |
| `src/components/ui/NotificationBell.tsx` | Dropdown | Renders last ~50 items in a 320px popover; links to `/s/{shareId}` or `#` |
| `src/app/api/user/notifications/route.ts` | API – GET + PATCH | GET returns the most-recent 50, **no pagination params**. PATCH accepts `markAllRead: true` or `ids: uuid[]` |
| `src/lib/notifications.ts` | Server helpers | `createNotification`, `notifyFollowers` — four types: `comment`, `reaction`, `new_report`, `collab_invite` |

### Key gaps before the page can be built

1. **No pagination on the API GET.** The SQL query is hard-capped at `LIMIT 50`. A full /notifications page needs cursor/offset pagination.
2. **No single-read endpoint.** The PATCH supports `ids: uuid[]` but the hook never calls it; the page will need per-item mark-read on click.
3. **`ids` PATCH schema expects `uuid[]` but `id` is typed as `number` in the hook** (`id: number`). The DB column is likely an integer auto-increment, not UUID. The Zod schema `z.array(z.string().uuid())` is therefore wrong for single-item reads — needs fixing to `z.array(z.number().int())` (or a string-cast of the integer).
4. **`collab_invite` type exists in `src/lib/notifications.ts` but is absent from `TYPE_ICONS` in `NotificationBell`.** The page needs to handle it.
5. **No `sourceUserName` link target.** When `sourceShareId` is null and `sourceUserName` is set (e.g. a follow event), there is no link. The page should route to `/creator/{sourceUserName}`.

---

## 2. File Structure Needed

```
src/
  app/
    notifications/
      page.tsx                  ← Server component: auth redirect + metadata
      NotificationsContent.tsx  ← "use client" — all interactive logic
  hooks/
    useNotificationsPaged.ts    ← Extended hook with page/cursor support
  app/api/user/notifications/
    route.ts                    ← Extend GET to accept ?page=N&limit=50
```

No new components needed beyond `NotificationsContent.tsx`; all UI tokens are already in the design system.

---

## 3. API Changes Required

### GET `/api/user/notifications?page=1&limit=50`

Add offset pagination to the existing route:

```ts
// Parse query params
const url = new URL(request.url);
const page  = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
const limit = 50;
const offset = (page - 1) * limit;

// SQL
const rows = await sql`
  SELECT id, type, source_share_id, source_user_name, message, read, created_at
  FROM notifications
  WHERE user_id = ${userId}
  ORDER BY created_at DESC
  LIMIT ${limit} OFFSET ${offset}
`;

// Also return total for pagination UI
const [{ count }] = await sql`
  SELECT COUNT(*) FROM notifications WHERE user_id = ${userId}
`;

return NextResponse.json({
  notifications: rows.map(...),
  unreadCount,          // keep for bell badge compatibility
  total: Number(count),
  page,
  totalPages: Math.ceil(Number(count) / limit),
});
```

The existing bell (`useNotifications`) always calls without `?page`, so it stays at page 1 — backward-compatible.

### PATCH fix: ids schema

```ts
// Change from:
ids: z.array(z.string().uuid()).min(1).max(100).optional()
// To:
ids: z.array(z.number().int().positive()).min(1).max(100).optional()
```

---

## 4. `useNotificationsPaged` Hook Pseudocode

```ts
// src/hooks/useNotificationsPaged.ts
"use client";

export function useNotificationsPaged() {
  const [page, setPage] = useState(1);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);

  const fetch = useCallback(async (p: number) => {
    setLoading(true);
    const res = await fetch(`/api/user/notifications?page=${p}&limit=50`);
    const data = await res.json();
    setNotifications(data.notifications ?? []);
    setTotal(data.total ?? 0);
    setTotalPages(data.totalPages ?? 1);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(page); }, [page, fetch]);

  const markAllRead = useCallback(async () => {
    setMarkingAll(true);
    await fetch("/api/user/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAllRead: true }),
    });
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setMarkingAll(false);
  }, []);

  const markOneRead = useCallback(async (id: number) => {
    // Optimistic update
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    await fetch("/api/user/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [id] }),
    });
  }, []);

  return { notifications, total, totalPages, page, setPage, loading, markingAll, markAllRead, markOneRead };
}
```

---

## 5. Page Component Pseudocode

### `src/app/notifications/page.tsx` (Server Component)

```tsx
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import { NotificationsContent } from "./NotificationsContent";

export const metadata: Metadata = {
  title: "Notifications | VGC Team Report",
  robots: { index: false, follow: false },
};

export default async function NotificationsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in?redirect_url=/notifications");

  return (
    <main id="main-content" className="min-h-screen bg-background">
      <NotificationsContent />
    </main>
  );
}
```

### `src/app/notifications/NotificationsContent.tsx` (Client Component)

```tsx
"use client";

import { useNotificationsPaged } from "@/hooks/useNotificationsPaged";
import { relativeTime } from "@/lib/utils/relative-time";

// Group notifications into buckets
function groupByAge(notifications: Notification[]) {
  const now = Date.now();
  const DAY  = 86_400_000;
  const WEEK = 7 * DAY;

  const today: Notification[]    = [];
  const thisWeek: Notification[] = [];
  const older: Notification[]    = [];

  for (const n of notifications) {
    const age = now - new Date(n.createdAt).getTime();
    if (age < DAY)       today.push(n);
    else if (age < WEEK) thisWeek.push(n);
    else                 older.push(n);
  }

  return { today, thisWeek, older };
}

function notificationHref(n: Notification): string {
  if (n.sourceShareId) return `/s/${n.sourceShareId}`;
  if (n.sourceUserName) return `/creator/${n.sourceUserName}`;
  return "#";
}

export function NotificationsContent() {
  const { notifications, totalPages, page, setPage, loading, markingAll, markAllRead, markOneRead } = useNotificationsPaged();
  const hasUnread = notifications.some(n => !n.read);
  const { today, thisWeek, older } = groupByAge(notifications);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 sm:px-6 lg:px-8">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Notifications</h1>
        {hasUnread && (
          <button
            type="button"
            onClick={markAllRead}
            disabled={markingAll}
            className="text-sm font-semibold text-accent hover:underline disabled:opacity-50 min-h-[44px] min-w-[44px] flex items-center"
            aria-label="Mark all notifications as read"
          >
            {markingAll ? "Marking..." : "Mark all read"}
          </button>
        )}
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-3" aria-busy="true" aria-label="Loading notifications">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-surface-alt animate-pulse" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && notifications.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               strokeWidth="1.5" className="text-text-tertiary">
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 01-3.46 0" />
          </svg>
          <p className="text-text-secondary text-sm">You have no notifications yet.</p>
        </div>
      )}

      {/* Grouped notification list */}
      {!loading && (
        <div className="space-y-6">
          <NotificationGroup label="Today" items={today} onRead={markOneRead} />
          <NotificationGroup label="This Week" items={thisWeek} onRead={markOneRead} />
          <NotificationGroup label="Older" items={older} onRead={markOneRead} />
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8" role="navigation" aria-label="Notification pages">
          <button
            type="button"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 rounded-lg border border-border text-sm font-medium text-text-secondary
                       hover:bg-surface-alt disabled:opacity-40 min-h-[44px] transition-colors"
            aria-label="Previous page"
          >
            Previous
          </button>
          <span className="text-sm text-text-tertiary">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 rounded-lg border border-border text-sm font-medium text-text-secondary
                       hover:bg-surface-alt disabled:opacity-40 min-h-[44px] transition-colors"
            aria-label="Next page"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
```

### `NotificationGroup` subcomponent (inline or extracted)

```tsx
const TYPE_CONFIG = {
  comment:       { icon: <CommentIcon />,    color: "text-blue-500"  },
  reaction:      { icon: <HeartIcon />,      color: "text-red-500"   },
  new_report:    { icon: <FileIcon />,       color: "text-accent"    },
  collab_invite: { icon: <UsersIcon />,      color: "text-emerald-500" },
} as const;

function NotificationGroup({
  label,
  items,
  onRead,
}: {
  label: string;
  items: Notification[];
  onRead: (id: number) => void;
}) {
  if (items.length === 0) return null;

  return (
    <section aria-labelledby={`group-${label.replace(" ", "-").toLowerCase()}`}>
      <h2
        id={`group-${label.replace(" ", "-").toLowerCase()}`}
        className="text-xs font-bold text-text-tertiary uppercase tracking-widest mb-2 px-1"
      >
        {label}
      </h2>
      <div className="bg-surface border border-border rounded-xl overflow-hidden divide-y divide-border/50">
        {items.map(n => {
          const cfg = TYPE_CONFIG[n.type] ?? TYPE_CONFIG.comment;
          const href = notificationHref(n);

          return (
            <a
              key={n.id}
              href={href}
              onClick={() => { if (!n.read) onRead(n.id); }}
              className={`flex items-start gap-3 px-4 py-3.5 transition-colors
                hover:bg-surface-alt/50 focus-visible:outline-none focus-visible:ring-2
                focus-visible:ring-accent focus-visible:ring-inset
                ${!n.read ? "bg-accent/5" : ""}`}
            >
              {/* Type icon */}
              <div className={`flex-shrink-0 w-9 h-9 rounded-full bg-surface-alt
                              flex items-center justify-center ${cfg.color}`}>
                {cfg.icon}
              </div>

              {/* Message + timestamp */}
              <div className="flex-1 min-w-0">
                <p className={`text-sm leading-relaxed break-words
                  ${!n.read ? "text-text-primary font-semibold" : "text-text-secondary"}`}>
                  {n.message}
                </p>
                <p className="text-xs text-text-tertiary mt-0.5">
                  {relativeTime(n.createdAt)}
                </p>
              </div>

              {/* Unread dot */}
              {!n.read && (
                <div
                  className="flex-shrink-0 w-2.5 h-2.5 rounded-full bg-accent mt-2"
                  aria-label="Unread"
                />
              )}
            </a>
          );
        })}
      </div>
    </section>
  );
}
```

---

## 6. Routing + Auth

- `page.tsx` is a **Server Component** — calls `auth()` from `@clerk/nextjs/server` before rendering.
- Unauthenticated users are redirected to `/sign-in?redirect_url=/notifications` (Clerk handles the return).
- Add `/notifications` to `PersistentNavbar`'s `getActivePage` (or leave it unmapped — it will fall through to `"home"` harmlessly).
- No `robots` indexing needed (private, user-specific page).

---

## 7. Missing Pieces Summary (to fix before implementation)

| # | Gap | Fix |
|---|-----|-----|
| 1 | API GET hardcapped at 50, no pagination | Add `?page=N` + `OFFSET` to SQL + return `total` / `totalPages` |
| 2 | PATCH `ids` schema is `uuid[]` but IDs are integers | Change Zod schema to `z.array(z.number().int().positive())` |
| 3 | `collab_invite` type missing from `NotificationBell` `TYPE_ICONS` | Add icon to both bell and new page; use `UsersIcon` (SVG inline) |
| 4 | No link target for `sourceUserName`-only notifications | Route to `/creator/{sourceUserName}` when `sourceShareId` is null |
| 5 | `useNotifications` hook returns `Notification[]` typed with `id: number` but route response IDs may be strings from Postgres driver | Verify DB driver coercion; cast explicitly in route response |
| 6 | `PersistentNavbar` `HIDDEN_PREFIXES` does not need updating — `/notifications` should show the nav | No change needed |
| 7 | Bell dropdown "See all" link missing | Add `<a href="/notifications">See all</a>` footer to `NotificationBell` dropdown |

---

## 8. Accessibility Checklist

- All interactive elements have `min-h-[44px]` touch targets per project UI standards.
- Unread dot uses `aria-label="Unread"` (not color alone).
- Groups use `<section aria-labelledby>` + `<h2>` — screen reader announces each section.
- Loading state uses `aria-busy="true"` on the skeleton container.
- Pagination nav uses `role="navigation"` + `aria-label`.
- "Mark all read" button has explicit `aria-label`.
- Focus rings: `focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset` on notification rows.
