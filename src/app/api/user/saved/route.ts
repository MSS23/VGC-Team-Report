import { getDb } from "@/lib/db";
import { extractSpecies } from "@/lib/utils/extract-species";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";

// GET: list saved reports
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sql = getDb();
    const rows = await sql`
      SELECT s.id, s.data, s.created_at, s.updated_at, COALESCE(s.view_count, 0) as view_count
      FROM saved_reports sr
      JOIN shares s ON sr.share_id = s.id
      WHERE sr.user_id = ${userId}
      ORDER BY sr.created_at DESC
    `;

    const reports = rows.map((row) => {
      const data = row.data as Record<string, unknown>;
      const paste = (data.paste as string) ?? "";
      return {
        id: row.id as string,
        species: extractSpecies(paste),
        tournamentName: (data.tournamentName as string) || undefined,
        creatorName: (data.creatorName as string) || undefined,
        placement: (data.placement as string) || undefined,
        createdAt: (row.created_at as Date).toISOString(),
        updatedAt: (row.updated_at as Date).toISOString(),
        viewCount: row.view_count as number,
      };
    });

    return NextResponse.json({ reports });
  } catch (e) {
    console.error("Saved reports error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

const SaveBody = z.object({ shareId: z.string().min(1) });

// POST: save a report
export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const raw = await request.json();
    const parsed = SaveBody.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }

    const sql = getDb();
    await sql`
      INSERT INTO saved_reports (user_id, share_id)
      VALUES (${userId}, ${parsed.data.shareId})
      ON CONFLICT DO NOTHING
    `;

    return NextResponse.json({ saved: true });
  } catch (e) {
    console.error("Save report error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// DELETE: unsave a report
export async function DELETE(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const raw = await request.json();
    const parsed = SaveBody.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }

    const sql = getDb();
    await sql`
      DELETE FROM saved_reports
      WHERE user_id = ${userId} AND share_id = ${parsed.data.shareId}
    `;

    return NextResponse.json({ unsaved: true });
  } catch (e) {
    console.error("Unsave report error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
