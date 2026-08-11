import { getDb } from "@/lib/db";
import { extractSpecies } from "@/lib/utils/extract-species";
import { captureServerEvent } from "@/lib/posthog-server";
import { apiGuard } from "@/lib/security/api-guard";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";

// GET: list saved reports
export async function GET(request: Request) {
  const guard = await apiGuard(request, { rateLimit: { key: "saved-read", max: 60 } });
  if (guard) return guard;

  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sql = getDb();

    // Lightweight mode for the Explore grid: just the saved share ids, no
    // JSONB payloads. One cheap query instead of the full join per caller.
    if (new URL(request.url).searchParams.get("idsOnly")) {
      const idRows = await sql`
        SELECT share_id FROM saved_reports WHERE user_id = ${userId}
      `;
      return NextResponse.json({ ids: idRows.map((r) => r.share_id as string) });
    }

    const rows = await sql`
      SELECT s.id, s.data, s.created_at, s.updated_at, COALESCE(s.view_count, 0) as view_count
      FROM saved_reports sr
      JOIN shares s ON sr.share_id = s.id
      WHERE sr.user_id = ${userId} AND s.deleted_at IS NULL
      ORDER BY sr.created_at DESC
      LIMIT 100
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
  const guard = await apiGuard(request, { rateLimit: { key: "saved-write", max: 20 } });
  if (guard) return guard;

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

    // Verify the share exists and is accessible to this user before saving.
    // Without this, a caller could save arbitrary share ids and then leak
    // title/preview of private shares via GET /api/user/saved (which JOINs
    // the shares table). Return 404 — not 403 — so we don't confirm the
    // existence of private shares to an unauthorised caller.
    const accessible = await sql`
      SELECT 1
      FROM shares
      WHERE id = ${parsed.data.shareId}
        AND deleted_at IS NULL
        AND (is_public = true OR owner_id = ${userId})
      LIMIT 1
    `;
    if (accessible.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await sql`
      INSERT INTO saved_reports (user_id, share_id)
      VALUES (${userId}, ${parsed.data.shareId})
      ON CONFLICT DO NOTHING
    `;

    captureServerEvent(userId, "report_saved", {
      report_id: parsed.data.shareId,
    });

    return NextResponse.json({ saved: true });
  } catch (e) {
    console.error("Save report error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// DELETE: unsave a report
export async function DELETE(request: Request) {
  const guard = await apiGuard(request, { rateLimit: { key: "saved-write", max: 20 } });
  if (guard) return guard;

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

    captureServerEvent(userId, "report_unsaved", {
      report_id: parsed.data.shareId,
    });

    return NextResponse.json({ unsaved: true });
  } catch (e) {
    console.error("Unsave report error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
