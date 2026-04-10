import { getDb } from "@/lib/db";
import { apiGuard } from "@/lib/security/api-guard";
import { cacheGet, cacheSet, CacheKeys, CacheTTL } from "@/lib/cache";
import { normalizeReportData } from "@/lib/utils/normalize-report";
import { extractSpecies } from "@/lib/utils/extract-species";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const IdSchema = z.string().regex(/^[A-Za-z0-9]{8}$/, "Invalid share ID");
const KeySchema = z.string().regex(/^[0-9a-f]{64}$/, "Invalid edit key");

type ForkedFromMeta = {
  id: string;
  creatorName: string | null;
  tournamentName: string | null;
  species: string[];
  deleted: boolean;
};

type SqlClient = ReturnType<typeof getDb>;

/** Fetch lightweight metadata about the source a share was forked from (if any). */
async function fetchForkedFromMeta(
  sql: SqlClient,
  sourceId: string | null | undefined
): Promise<ForkedFromMeta | null> {
  if (!sourceId) return null;
  const rows = await sql`
    SELECT data, deleted_at FROM shares WHERE id = ${sourceId}
  `;
  if (rows.length === 0) {
    return { id: sourceId, creatorName: null, tournamentName: null, species: [], deleted: true };
  }
  const data = rows[0].data as Record<string, unknown>;
  const deleted = rows[0].deleted_at !== null;
  return {
    id: sourceId,
    creatorName: ((data.creatorName as string) || null) ?? null,
    tournamentName: ((data.tournamentName as string) || null) ?? null,
    species: extractSpecies((data.paste as string) ?? ""),
    deleted,
  };
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await apiGuard(request, { rateLimit: { key: "share-get", max: 60 } });
    if (guard) return guard;

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
        SELECT data, (edit_token = ${key}) AS editable, COALESCE(version, 1) AS version, is_public, forked_from_id FROM shares WHERE id = ${id} AND deleted_at IS NULL
      `;
      if (rows.length === 0) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }

      // If polling with ?since=N, return 304 if version hasn't changed
      if (sinceVersion && Number(sinceVersion) >= Number(rows[0].version)) {
        return new Response(null, { status: 304 });
      }

      const forkedFrom = await fetchForkedFromMeta(sql, rows[0].forked_from_id as string | null);

      return NextResponse.json({
        ...normalizeReportData(rows[0].data as Record<string, unknown>),
        _editable: !!rows[0].editable,
        _version: Number(rows[0].version),
        _isPublic: !!rows[0].is_public,
        _isOwner: false,
        _forkedFrom: forkedFrom,
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
        SELECT data, edit_token, COALESCE(version, 1) AS version, is_public, owner_id, forked_from_id
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
          const forkedFrom = await fetchForkedFromMeta(sql, ownerRows[0].forked_from_id as string | null);
          return NextResponse.json({
            ...normalizeReportData(ownerRows[0].data as Record<string, unknown>),
            _editable: true,
            _editToken: ownerRows[0].edit_token as string,
            _version: Number(ownerRows[0].version),
            _isPublic: !!ownerRows[0].is_public,
            _isOwner: isOwner,
            _collaborators: collabNameRows.map((r) => r.user_name as string),
            _forkedFrom: forkedFrom,
          });
        }
      }
    }

    // Non-owner access — read-only, no edit info leaked.
    // Private reports behave as "unlisted": anyone with the /s/{id} link can view,
    // but they are not listed on Explore and edit requires the ?key= collab token.
    const rows = await sql`
      SELECT data, COALESCE(version, 1) AS version, is_public, forked_from_id FROM shares WHERE id = ${id} AND deleted_at IS NULL
    `;
    if (rows.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const isPublic = !!rows[0].is_public;

    // Check cache for public reads only — unlisted reports skip cache to avoid
    // leaking stale visibility state on public↔private toggles.
    if (isPublic && !sinceVersion) {
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

    const forkedFrom = await fetchForkedFromMeta(sql, rows[0].forked_from_id as string | null);

    const responseData = {
      ...normalizeReportData(rows[0].data as Record<string, unknown>),
      _version: Number(rows[0].version),
      _isPublic: isPublic,
      _isOwner: false,
      _collaborators: collaboratorNames,
      _forkedFrom: forkedFrom,
    };

    // Cache public shares for 5 minutes
    if (isPublic) {
      await cacheSet(CacheKeys.share(id), responseData, CacheTTL.SHARE_PUBLIC);
    }

    return NextResponse.json(responseData);
  } catch (e) {
    console.error("Share fetch error:", e);
    return NextResponse.json(
      { error: "Failed to load share" },
      { status: 500 }
    );
  }
}
