import { getDb } from "@/lib/db";
import { captureServerEvent } from "@/lib/posthog-server";
import { apiGuard } from "@/lib/security/api-guard";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const FollowBody = z.object({ creatorName: z.string().min(1) });

// GET: list followed creators, or check single creator with ?creator=X
export async function GET(request: Request) {
  const guard = await apiGuard(request, { rateLimit: { key: "follow-read", max: 60 } });
  if (guard) return guard;

  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const sql = getDb();

    // Single-creator check: GET /api/user/follow?creator=X
    const url = new URL(request.url);
    const creatorParam = url.searchParams.get("creator");
    if (creatorParam) {
      const row = await sql`SELECT 1 FROM follows WHERE user_id = ${userId} AND LOWER(creator_name) = ${creatorParam.toLowerCase()} LIMIT 1`;
      return NextResponse.json({ following: row.length > 0 });
    }

    // Full list: GET /api/user/follow
    const rows = await sql`SELECT creator_name, created_at FROM follows WHERE user_id = ${userId} ORDER BY created_at DESC`;
    return NextResponse.json({ following: rows.map((r) => r.creator_name as string) });
  } catch (e) {
    console.error("Follow GET error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// POST: follow a creator
export async function POST(request: Request) {
  const guard = await apiGuard(request, { rateLimit: { key: "follow-write", max: 20 } });
  if (guard) return guard;

  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const raw = await request.json();
    const parsed = FollowBody.safeParse(raw);
    if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

    const sql = getDb();
    await sql`INSERT INTO follows (user_id, creator_name) VALUES (${userId}, ${parsed.data.creatorName}) ON CONFLICT DO NOTHING`;

    captureServerEvent(userId, "creator_followed", {
      creator_name: parsed.data.creatorName,
    });

    return NextResponse.json({ followed: true });
  } catch (e) {
    console.error("Follow POST error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// DELETE: unfollow a creator
export async function DELETE(request: Request) {
  const guard = await apiGuard(request, { rateLimit: { key: "follow-write", max: 20 } });
  if (guard) return guard;

  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const raw = await request.json();
    const parsed = FollowBody.safeParse(raw);
    if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

    const sql = getDb();
    await sql`DELETE FROM follows WHERE user_id = ${userId} AND creator_name = ${parsed.data.creatorName}`;

    captureServerEvent(userId, "creator_unfollowed", {
      creator_name: parsed.data.creatorName,
    });

    return NextResponse.json({ unfollowed: true });
  } catch (e) {
    console.error("Follow DELETE error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
