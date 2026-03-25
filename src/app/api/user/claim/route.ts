import { getDb } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const ClaimBody = z.object({
  shareId: z.string().min(1),
  editToken: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const raw = await request.json();
    const parsed = ClaimBody.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }

    const { shareId, editToken } = parsed.data;
    const sql = getDb();

    // Verify edit token matches and report isn't already claimed by another user
    const rows = await sql`
      UPDATE shares
      SET owner_id = ${userId}
      WHERE id = ${shareId} AND edit_token = ${editToken} AND (owner_id IS NULL OR owner_id = ${userId})
      RETURNING id
    `;

    if (rows.length === 0) {
      return NextResponse.json({ error: "Invalid token or already claimed by another user" }, { status: 403 });
    }

    return NextResponse.json({ claimed: true, shareId });
  } catch (e) {
    console.error("Claim error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
