import { getDb } from "@/lib/db";
import { auth, currentUser } from "@clerk/nextjs/server";
import { cacheDel, CacheKeys } from "@/lib/cache";
import { NextResponse } from "next/server";

/**
 * GET /api/user/guest-collabs
 * Returns guest collaborator entries that match the current user's name.
 * These are collabs added by name before the user had an account.
 */
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

    const user = await currentUser();
    if (!user) return NextResponse.json({ pending: [] });

    const displayName = user.firstName
      ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ""}`
      : user.username ?? "";

    if (!displayName) return NextResponse.json({ pending: [] });

    const sql = getDb();

    // Find guest collab entries matching this user's name (case-insensitive)
    // Exclude any shares where this user is already a real collaborator or the owner
    const rows = await sql`
      SELECT c.user_id as guest_id, c.user_name, c.share_id, c.created_at,
             s.data->>'tournamentName' as tournament_name,
             s.data->>'creatorName' as creator_name
      FROM collaborators c
      JOIN shares s ON s.id = c.share_id AND s.deleted_at IS NULL
      WHERE c.is_guest = TRUE
        AND LOWER(c.user_name) = ${displayName.toLowerCase()}
        AND NOT EXISTS (
          SELECT 1 FROM collaborators c2
          WHERE c2.share_id = c.share_id AND c2.user_id = ${userId}
        )
        AND s.owner_id != ${userId}
      ORDER BY c.created_at DESC
      LIMIT 20
    `;

    const pending = rows.map((r) => ({
      guestId: r.guest_id as string,
      shareId: r.share_id as string,
      guestName: r.user_name as string,
      tournamentName: (r.tournament_name as string) || undefined,
      creatorName: (r.creator_name as string) || undefined,
      addedAt: (r.created_at as Date).toISOString(),
    }));

    return NextResponse.json({ pending });
  } catch (e) {
    console.error("Guest collabs check error:", e);
    return NextResponse.json({ pending: [] });
  }
}

/**
 * POST /api/user/guest-collabs
 * Claim a guest collaboration — upgrades the guest entry to a real user.
 * Body: { guestId: string, shareId: string }
 */
export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

    const user = await currentUser();
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 401 });

    const body = await request.json();
    const { guestId, shareId } = body as { guestId?: string; shareId?: string };

    if (!guestId || !shareId) {
      return NextResponse.json({ error: "guestId and shareId required" }, { status: 400 });
    }

    const displayName = user.firstName
      ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ""}`
      : user.username ?? "Unknown";

    const sql = getDb();

    // Verify the guest entry exists and matches the current user's name
    const existing = await sql`
      SELECT user_name FROM collaborators
      WHERE share_id = ${shareId} AND user_id = ${guestId} AND is_guest = TRUE
    `;

    if (existing.length === 0) {
      return NextResponse.json({ error: "Guest collaboration not found" }, { status: 404 });
    }

    // Check the user isn't already a collaborator on this share
    const alreadyCollab = await sql`
      SELECT 1 FROM collaborators WHERE share_id = ${shareId} AND user_id = ${userId}
    `;
    if (alreadyCollab.length > 0) {
      // Already a collaborator — just delete the guest entry
      await sql`DELETE FROM collaborators WHERE share_id = ${shareId} AND user_id = ${guestId}`;
      return NextResponse.json({ success: true, alreadyClaimed: true });
    }

    // Replace the guest entry with the real user
    // Delete guest row first, then insert real user to avoid PK conflicts
    await sql`DELETE FROM collaborators WHERE share_id = ${shareId} AND user_id = ${guestId}`;
    await sql`
      INSERT INTO collaborators (share_id, user_id, user_name, added_by, is_guest)
      VALUES (${shareId}, ${userId}, ${displayName}, ${guestId}, FALSE)
      ON CONFLICT (share_id, user_id) DO UPDATE SET is_guest = FALSE, user_name = ${displayName}
    `;

    // Bust cache so the share page reflects the change
    await cacheDel(CacheKeys.share(shareId)).catch(() => {});

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Claim guest collab error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
