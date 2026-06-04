import { getDb } from "@/lib/db";
import { apiGuard } from "@/lib/security/api-guard";
import { cacheGet, cacheSet, CacheKeys, CacheTTL } from "@/lib/cache";
import { normalizeReportData } from "@/lib/utils/normalize-report";
import { extractSpecies } from "@/lib/utils/extract-species";
import { normalizePrivateFields, redactPasteFields } from "@/lib/sharing/redact-paste";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";

/**
 * Apply tiered-publishing redaction (VGC-142) for non-owner viewers.
 * If the share data declares `privateFields`, strip those fields from the
 * paste so anonymous/public callers never see hidden spreads or items.
 * Returns the (possibly mutated) data plus the list of fields that were
 * redacted, so the client can show a "Some fields hidden by creator" banner.
 */
function applyPrivateFieldRedaction(data: Record<string, unknown>): {
  data: Record<string, unknown>;
  redactedFields: string[];
} {
  const fields = normalizePrivateFields(data.privateFields as string[] | undefined);
  if (fields.length === 0) return { data, redactedFields: [] };
  const paste = (data.paste as string) ?? "";
  const redacted = redactPasteFields(paste, fields);
  return {
    data: { ...data, paste: redacted },
    redactedFields: fields,
  };
}

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

/**
 * Look up the forked_from_id for a share in a fault-tolerant way.
 * Returns null if the column does not yet exist in the database (i.e. the
 * migration hasn't been run on this environment). This isolates the fork
 * feature from the main share-read path so a missing column can never
 * break `/s/{id}` for end users.
 */
async function loadForkedFromId(sql: SqlClient, id: string): Promise<string | null> {
  try {
    const rows = await sql`SELECT forked_from_id FROM shares WHERE id = ${id}`;
    if (rows.length === 0) return null;
    return (rows[0].forked_from_id as string | null) ?? null;
  } catch {
    // Column does not exist yet — treat as "no fork lineage"
    return null;
  }
}

/** Fetch lightweight metadata about the source a share was forked from (if any). */
async function fetchForkedFromMeta(
  sql: SqlClient,
  sourceId: string | null | undefined
): Promise<ForkedFromMeta | null> {
  if (!sourceId) return null;
  try {
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
  } catch {
    return null;
  }
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
      // Validate edit key — return data + editable flag + version + visibility.
      // Require an authenticated session: the key alone does not grant edit
      // access. Anonymous callers (even with a correct token) get read-only
      // so a logged-out user cannot mutate a published report via a stale
      // localStorage token or tampered URL.
      let authedUserId: string | null = null;
      try {
        const { userId: uid } = await auth();
        authedUserId = uid;
      } catch { /* not authenticated */ }

      const rows = await sql`
        SELECT data, (edit_token = ${key}) AS editable, COALESCE(version, 1) AS version, is_public, is_unlisted FROM shares WHERE id = ${id} AND deleted_at IS NULL
      `;
      if (rows.length === 0) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }

      // If polling with ?since=N, return 304 if version hasn't changed
      if (sinceVersion && Number(sinceVersion) >= Number(rows[0].version)) {
        return new Response(null, { status: 304 });
      }

      const forkedFromId = await loadForkedFromId(sql, id);
      const forkedFrom = await fetchForkedFromMeta(sql, forkedFromId);

      const editable = !!rows[0].editable && !!authedUserId;
      const normalized = normalizeReportData(rows[0].data as Record<string, unknown>);
      // Editors with a valid key see full data; bare-link viewers get redacted (VGC-142)
      const { data: viewable, redactedFields } = editable
        ? { data: normalized, redactedFields: [] as string[] }
        : applyPrivateFieldRedaction(normalized);
      return NextResponse.json({
        ...viewable,
        _editable: editable,
        _version: Number(rows[0].version),
        _isPublic: !!rows[0].is_public,
        _isUnlisted: !!rows[0].is_unlisted,
        _isOwner: false,
        _forkedFrom: forkedFrom,
        _redactedFields: redactedFields,
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
        SELECT data, edit_token, COALESCE(version, 1) AS version, is_public, is_unlisted, owner_id
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
          const [collabNameRows, forkedFromId] = await Promise.all([
            sql`SELECT user_name FROM collaborators WHERE share_id = ${id} AND COALESCE(status, 'accepted') = 'accepted'`,
            loadForkedFromId(sql, id),
          ]);
          const forkedFrom = await fetchForkedFromMeta(sql, forkedFromId);
          return NextResponse.json({
            ...normalizeReportData(ownerRows[0].data as Record<string, unknown>),
            _editable: true,
            _editToken: ownerRows[0].edit_token as string,
            _version: Number(ownerRows[0].version),
            _isPublic: !!ownerRows[0].is_public,
            _isUnlisted: !!ownerRows[0].is_unlisted,
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
      SELECT data, COALESCE(version, 1) AS version, is_public, is_unlisted FROM shares WHERE id = ${id} AND deleted_at IS NULL
    `;
    if (rows.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const isPublic = !!rows[0].is_public;
    const isUnlisted = !!rows[0].is_unlisted;

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

    // Fetch accepted collaborator names + fork lineage in parallel.
    const [collabRows, forkedFromId] = await Promise.all([
      sql`SELECT user_name FROM collaborators WHERE share_id = ${id} AND COALESCE(status, 'accepted') = 'accepted'`,
      loadForkedFromId(sql, id),
    ]);
    const collaboratorNames = collabRows.map((r) => r.user_name as string);
    const forkedFrom = await fetchForkedFromMeta(sql, forkedFromId);

    const normalized = normalizeReportData(rows[0].data as Record<string, unknown>);
    const { data: viewable, redactedFields } = applyPrivateFieldRedaction(normalized);

    const responseData = {
      ...viewable,
      _version: Number(rows[0].version),
      _isPublic: isPublic,
      _isUnlisted: isUnlisted,
      _isOwner: false,
      _collaborators: collaboratorNames,
      _forkedFrom: forkedFrom,
      _redactedFields: redactedFields,
    };

    // Cache public shares for 5 minutes in Redis (for our own fast-path)
    if (isPublic) {
      await cacheSet(CacheKeys.share(id), responseData, CacheTTL.SHARE_PUBLIC);
    }

    // Also let Vercel's edge CDN cache public responses — this is the
    // bigger lever: repeat views of the same public share get served
    // by the edge without invoking this function at all. The SWR
    // window lets the edge keep serving while a background refresh
    // runs. Private/unlisted reads are not cached at the edge so
    // visibility toggles aren't masked by stale CDN entries.
    const res = NextResponse.json(responseData);
    if (isPublic && !sinceVersion) {
      res.headers.set(
        "Cache-Control",
        "public, s-maxage=300, stale-while-revalidate=900",
      );
      res.headers.set("CDN-Cache-Control", "public, s-maxage=300");
      res.headers.set("Vercel-CDN-Cache-Control", "public, s-maxage=300");
    }
    return res;
  } catch (e) {
    console.error("Share fetch error:", e);
    return NextResponse.json(
      { error: "Failed to load share" },
      { status: 500 }
    );
  }
}
