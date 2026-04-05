import { getDb } from "@/lib/db";
import { isRateLimited } from "@/lib/rate-limit";
import { cacheGet, cacheSet, CacheKeys, CacheTTL } from "@/lib/cache";
import { normalizeReportData } from "@/lib/utils/normalize-report";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const IdSchema = z.string().regex(/^[A-Za-z0-9]{8}$/, "Invalid share ID");
const KeySchema = z.string().regex(/^[0-9a-f]{64}$/, "Invalid edit key");

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    if (isRateLimited(`share-get:${ip}`, 60, 60_000)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const { id: rawId } = await params;
    const idResult = IdSchema.safeParse(rawId);
    if (!idResult.success) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const id = idResult.data;

    const url = new URL(request.url);
    const key = url.searchParams.get("key");

    if (key) {
      const keyResult = KeySchema.safeParse(key);
      if (!keyResult.success) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
    }

    const sql = getDb();

    // Support version-check polling: ?since=N returns 304 if not changed
    const sinceVersion = url.searchParams.get("since");

    if (key) {
      // Validate edit key — return data + editable flag + version + visibility
      const rows = await sql`
        SELECT data, (edit_token = ${key}) AS editable, COALESCE(version, 1) AS version, is_public FROM shares WHERE id = ${id} AND deleted_at IS NULL
      `;
      if (rows.length === 0) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }

      // If polling with ?since=N, return 304 if version hasn't changed
      if (sinceVersion && Number(sinceVersion) >= Number(rows[0].version)) {
        return new Response(null, { status: 304 });
      }

      return NextResponse.json({
        ...normalizeReportData(rows[0].data as Record<string, unknown>),
        _editable: !!rows[0].editable,
        _version: Number(rows[0].version),
        _isPublic: !!rows[0].is_public,
      });
    }

    // Public access — check if the signed-in user is the owner
    let userId: string | null = null;
    try {
      const { userId: uid } = await auth();
      userId = uid;
    } catch { /* not authenticated */ }

    // If the user is the owner or a collaborator, grant edit access
    if (userId) {
      const ownerRows = await sql`
        SELECT data, edit_token, COALESCE(version, 1) AS version, is_public, owner_id
        FROM shares WHERE id = ${id} AND deleted_at IS NULL
      `;
      if (ownerRows.length > 0) {
        const isOwner = ownerRows[0].owner_id === userId;
        let isCollaborator = false;
        if (!isOwner) {
          const collabRows = await sql`
            SELECT 1 FROM collaborators WHERE share_id = ${id} AND user_id = ${userId}
              AND COALESCE(status, 'accepted') = 'accepted'
          `;
          isCollaborator = collabRows.length > 0;
        }

        if (isOwner || isCollaborator) {
          if (sinceVersion && Number(sinceVersion) >= Number(ownerRows[0].version)) {
            return new Response(null, { status: 304 });
          }
          const collabNameRows = await sql`SELECT user_name FROM collaborators WHERE share_id = ${id} AND COALESCE(status, 'accepted') = 'accepted'`;
          return NextResponse.json({
            ...normalizeReportData(ownerRows[0].data as Record<string, unknown>),
            _editable: true,
            _editToken: ownerRows[0].edit_token as string,
            _version: Number(ownerRows[0].version),
            _isPublic: !!ownerRows[0].is_public,
            _isOwner: isOwner,
            _collaborators: collabNameRows.map((r) => r.user_name as string),
          });
        }
      }
    }

    // Non-owner public access — read-only, no edit info leaked
    const rows = await sql`
      SELECT data, COALESCE(version, 1) AS version, is_public FROM shares WHERE id = ${id} AND deleted_at IS NULL
    `;
    if (rows.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Private reports: only accessible by owner/collaborator (handled above) or with edit key
    if (!rows[0].is_public) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Check cache for public reads (after privacy gate, skip if polling)
    if (!sinceVersion) {
      const cached = await cacheGet<Record<string, unknown>>(CacheKeys.share(id));
      if (cached) {
        return NextResponse.json(cached);
      }
    }

    // If polling with ?since=N, return 304 if version hasn't changed
    if (sinceVersion && Number(sinceVersion) >= Number(rows[0].version)) {
      return new Response(null, { status: 304 });
    }

    // Fetch accepted collaborator names for public display
    const collabRows = await sql`SELECT user_name FROM collaborators WHERE share_id = ${id} AND COALESCE(status, 'accepted') = 'accepted'`;
    const collaboratorNames = collabRows.map((r) => r.user_name as string);

    const responseData = {
      ...normalizeReportData(rows[0].data as Record<string, unknown>),
      _version: Number(rows[0].version),
      _isPublic: true,
      _collaborators: collaboratorNames,
    };

    // Cache public shares for 5 minutes
    await cacheSet(CacheKeys.share(id), responseData, CacheTTL.SHARE_PUBLIC);

    return NextResponse.json(responseData);
  } catch (e) {
    console.error("Share fetch error:", e);
    return NextResponse.json(
      { error: "Failed to load share" },
      { status: 500 }
    );
  }
}
