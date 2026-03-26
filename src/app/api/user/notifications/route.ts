import { getDb } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** GET: Fetch notifications for the signed-in user */
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const sql = getDb();
    const rows = await sql`
      SELECT id, type, source_share_id, source_user_name, message, read, created_at
      FROM notifications
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT 50
    `;

    const unreadCount = rows.filter((r) => !r.read).length;

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
    });
  } catch (e) {
    console.error("Notifications GET error:", e);
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
  }
}

/** PATCH: Mark notifications as read */
export async function PATCH(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const sql = getDb();

    if (body.markAllRead) {
      await sql`UPDATE notifications SET read = TRUE WHERE user_id = ${userId} AND read = FALSE`;
    } else if (Array.isArray(body.ids) && body.ids.length > 0) {
      await sql`UPDATE notifications SET read = TRUE WHERE user_id = ${userId} AND id = ANY(${body.ids})`;
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Notifications PATCH error:", e);
    return NextResponse.json({ error: "Failed to update notifications" }, { status: 500 });
  }
}
