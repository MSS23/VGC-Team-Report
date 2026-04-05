import { getDb } from "@/lib/db";
import { isRateLimited } from "@/lib/rate-limit";
import { createNotification } from "@/lib/notifications";
import { captureServerEvent } from "@/lib/posthog-server";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const ALLOWED_TYPES = ["fire", "heart", "brain", "battle", "clap"] as const;

const ToggleBody = z.object({
  reactionType: z.enum(ALLOWED_TYPES),
  sessionId: z.string().min(1),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ shareId: string }> },
) {
  try {
    const { shareId } = await params;
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    if (isRateLimited(`reactions-read:${ip}`, 60, 60_000)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }
    const sessionId = new URL(request.url).searchParams.get("sessionId") ?? "";
    const sql = getDb();

    const [counts, userReactions] = await Promise.all([
      sql`SELECT reaction_type, COUNT(*)::int as count FROM reactions WHERE share_id = ${shareId} GROUP BY reaction_type`,
      sessionId
        ? sql`SELECT reaction_type FROM reactions WHERE share_id = ${shareId} AND session_id = ${sessionId}`
        : Promise.resolve([]),
    ]);

    const countsMap: Record<string, number> = {};
    for (const row of counts) {
      countsMap[row.reaction_type as string] = row.count as number;
    }

    return NextResponse.json({
      counts: countsMap,
      userReactions: (userReactions as Array<{ reaction_type: string }>).map((r) => r.reaction_type),
    });
  } catch (e) {
    console.error("Reactions GET error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ shareId: string }> },
) {
  try {
    const { shareId } = await params;
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    if (isRateLimited(`reactions:${ip}`, 30, 60_000)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const raw = await request.json();
    const parsed = ToggleBody.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }
    const { reactionType, sessionId } = parsed.data;
    const sql = getDb();

    // Prevent owners from liking their own reports
    const { userId } = await auth();
    if (userId) {
      const ownerCheck = await sql`SELECT owner_id FROM shares WHERE id = ${shareId}`;
      if (ownerCheck.length > 0 && ownerCheck[0].owner_id === userId) {
        return NextResponse.json({ error: "Cannot like your own report" }, { status: 403 });
      }
    }

    // Check if already exists
    const existing = await sql`
      SELECT id FROM reactions
      WHERE share_id = ${shareId} AND reaction_type = ${reactionType} AND session_id = ${sessionId}
    `;

    let action: "added" | "removed";
    if (existing.length > 0) {
      await sql`
        DELETE FROM reactions
        WHERE share_id = ${shareId} AND reaction_type = ${reactionType} AND session_id = ${sessionId}
      `;
      action = "removed";
    } else {
      await sql`
        INSERT INTO reactions (share_id, reaction_type, session_id)
        VALUES (${shareId}, ${reactionType}, ${sessionId})
      `;
      action = "added";

      // Notify report owner (fire-and-forget)
      const ownerRows = await sql`SELECT owner_id FROM shares WHERE id = ${shareId}`;
      const ownerId = ownerRows[0]?.owner_id as string | undefined;
      if (ownerId) {
        createNotification(ownerId, "reaction", shareId, null, `Someone liked your report`);
      }
    }

    captureServerEvent(sessionId, action === "added" ? "reaction_added" : "reaction_removed", {
      report_id: shareId,
      reaction_type: reactionType,
    });

    return NextResponse.json({ action });
  } catch (e) {
    console.error("Reactions POST error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
