import { getDb } from "@/lib/db";
import { apiGuard } from "@/lib/security/api-guard";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

/** GET: Fetch notifications for the signed-in user */
export async function GET(request: Request) {
  const guard = await apiGuard(request, { rateLimit: { key: "notifications-read", max: 60 } });
  if (guard) return guard;

  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(request.url);
    const limit = Math.min(Number(url.searchParams.get("limit") ?? 50), 100);
    const offset = Number(url.searchParams.get("offset") ?? 0);

    const sql = getDb();
    const [rows, countRows] = await Promise.all([
      sql`
        SELECT id, type, source_share_id, source_user_name, message, read, created_at
        FROM notifications
        WHERE user_id = ${userId}
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `,
      sql`
        SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE read = FALSE) AS unread_count
        FROM notifications
        WHERE user_id = ${userId}
      `,
    ]);

    const total = Number(countRows[0]?.total ?? 0);
    const unreadCount = Number(countRows[0]?.unread_count ?? 0);
    const hasMore = offset + rows.length < total;

    return NextResponse.json({
      notifications: rows.map((r) => ({
        id: r.id,
        type: r.type,
        sourceShareId: r.source_share_id,
        sourceUserName: r.source_user_name,
        message: r.message,
        read: r.read,
        createdAt: (r.created_at as Date).toISOString(),
      })),
      unreadCount,
      total,
      hasMore,
    });
  } catch (e) {
    console.error("Notifications GET error:", e);
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
  }
}

/** PATCH: Mark notifications as read */
export async function PATCH(request: Request) {
  const guard = await apiGuard(request, { rateLimit: { key: "notifications-write", max: 30 } });
  if (guard) return guard;

  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rawBody = await request.json();
    const patchSchema = z.object({
      markAllRead: z.boolean().optional(),
      ids: z.array(z.number().int().positive()).min(1).max(100).optional(),
    });
    const parseResult = patchSchema.safeParse(rawBody);
    if (!parseResult.success) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }
    const body = parseResult.data;
    const sql = getDb();

    if (body.markAllRead) {
      await sql`UPDATE notifications SET read = TRUE WHERE user_id = ${userId} AND read = FALSE`;
    } else if (body.ids && body.ids.length > 0) {
      await sql`UPDATE notifications SET read = TRUE WHERE user_id = ${userId} AND id = ANY(${body.ids})`;
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Notifications PATCH error:", e);
    return NextResponse.json({ error: "Failed to update notifications" }, { status: 500 });
  }
}
