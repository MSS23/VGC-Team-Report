import { getDb } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const FollowBody = z.object({ creatorName: z.string().min(1) });

// GET: list followed creators
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const sql = getDb();
    const rows = await sql`SELECT creator_name, created_at FROM follows WHERE user_id = ${userId} ORDER BY created_at DESC`;
    return NextResponse.json({ following: rows.map((r) => r.creator_name as string) });
  } catch (e) {
    console.error("Follow GET error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// POST: follow a creator
export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const raw = await request.json();
    const parsed = FollowBody.safeParse(raw);
    if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

    const sql = getDb();
    await sql`INSERT INTO follows (user_id, creator_name) VALUES (${userId}, ${parsed.data.creatorName}) ON CONFLICT DO NOTHING`;
    return NextResponse.json({ followed: true });
  } catch (e) {
    console.error("Follow POST error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// DELETE: unfollow a creator
export async function DELETE(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const raw = await request.json();
    const parsed = FollowBody.safeParse(raw);
    if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

    const sql = getDb();
    await sql`DELETE FROM follows WHERE user_id = ${userId} AND creator_name = ${parsed.data.creatorName}`;
    return NextResponse.json({ unfollowed: true });
  } catch (e) {
    console.error("Follow DELETE error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
