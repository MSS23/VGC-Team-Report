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

type ForkedFromMeta = {
  id: string;
  creatorName: string | null;
  tournamentName: string | null;
  species: string[];
  deleted: boolean;
};

type SqlClient = ReturnType<typeof getDb>;

/**
 * Run a share-row SELECT in a fault-tolerant way with respect to the
 * `forked_from_id` column. `withFork` selects the column inline (so the fork
 * lineage rides along with the main read instead of costing an extra
 * round-trip); if that column does not yet exist in this environment (the
 * migration hasn't run), the query throws and we fall back to `withoutFork`.
 * This isolates the fork feature from the main share-read path so a missing
 * column can never break `/s/{id}` for end users.
 */
async function selectShareRowTolerant<T>(
  withFork: () => Promise<T>,
  withoutFork: () => Promise<T>,
): Promise<{ rows: T; hasForkColumn: boolean }> {
  try {
    return { rows: await withFork(), hasForkColumn: true };
  } catch {
    return { rows: await withoutFork(), hasForkColumn: false };
  }
}

/** Read the forked_from_id off an already-fetched share row (null-safe). */
function forkedFromIdFromRow(
  row: Record<string, unknown> | undefined,
  hasForkColumn: boolean,
): string | null {
  if (!hasForkColumn || !row) return null;
  return (row.forked_from_id as string | null) ?? null;
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
    const sql = getDb();

    // Support version-check polling: ?since=N returns 304 if not changed
    const sinceVersion = url.searchParams.get("since");

    // Edit access is account-based. Legacy ?key= values are deliberately
    // ignored so copied URLs, cookies, and browser storage can never unlock a
    // report. Signed-in owners and accepted collaborators are resolved below.
    let userId: string | null = null;
    try {
      const { userId: uid } = await auth();
      userId = uid;
    } catch { /* not authenticated */ }

    // If the user is the owner or a collaborator, grant edit access
    if (userId) {
      const { rows: ownerRows, hasForkColumn } = await selectShareRowTolerant(
        () => sql`
          SELECT data, edit_token, COALESCE(version, 1) AS version, is_public, is_unlisted, owner_id, forked_from_id
          FROM shares WHERE id = ${id} AND deleted_at IS NULL
        `,
        () => sql`
          SELECT data, edit_token, COALESCE(version, 1) AS version, is_public, is_unlisted, owner_id
          FROM shares WHERE id = ${id} AND deleted_at IS NULL
        `,
      );
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
          const forkedFromId = forkedFromIdFromRow(ownerRows[0], hasForkColumn);
          const [collabNameRows, forkedFrom] = await Promise.all([
            sql`SELECT user_name FROM collaborators WHERE share_id = ${id} AND COALESCE(status, 'accepted') = 'accepted'`,
            fetchForkedFromMeta(sql, forkedFromId),
          ]);
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

    // Non-owner access — read-only, with no edit information leaked. Public
    // and unlisted reports may continue below; truly private reports are
    // rejected after the visibility flags are loaded.
    const { rows, hasForkColumn } = await selectShareRowTolerant(
      () => sql`
        SELECT data, COALESCE(version, 1) AS version, is_public, is_unlisted, forked_from_id FROM shares WHERE id = ${id} AND deleted_at IS NULL
      `,
      () => sql`
        SELECT data, COALESCE(version, 1) AS version, is_public, is_unlisted FROM shares WHERE id = ${id} AND deleted_at IS NULL
      `,
    );
    if (rows.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const isPublic = !!rows[0].is_public;
    const isUnlisted = !!rows[0].is_unlisted;

    // Enforce real privacy (VGC: "Private = Only accessible to you"). The
    // owner and accepted collaborators were already served above with edit
    // access. Anyone reaching this point is an outsider, so a report that is
    // neither public nor unlisted must not be viewable via the bare /s/{id}
    // link — return 404. Unlisted reports remain link-viewable by design.
    if (!isPublic && !isUnlisted) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

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

    // Fetch accepted collaborator names for public display, in parallel with
    // fork-source metadata (both are independent of each other).
    const forkedFromId = forkedFromIdFromRow(rows[0], hasForkColumn);
    const [collabRows, forkedFrom] = await Promise.all([
      sql`SELECT user_name FROM collaborators WHERE share_id = ${id} AND COALESCE(status, 'accepted') = 'accepted'`,
      fetchForkedFromMeta(sql, forkedFromId),
    ]);
    const collaboratorNames = collabRows.map((r) => r.user_name as string);

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
      // Keep the edge window short. cacheDel() invalidates our Redis copy on a
      // visibility flip, but it cannot purge Vercel's edge CDN — that entry
      // only expires with s-maxage. A long window (was 300s + 900s SWR ≈ 20m)
      // meant a public→private flip kept serving the public body for minutes.
      // 30s caps that stale-serve window while still absorbing view spikes.
      res.headers.set("Cache-Control", "public, s-maxage=30, must-revalidate");
      res.headers.set("CDN-Cache-Control", "public, s-maxage=30");
      res.headers.set("Vercel-CDN-Cache-Control", "public, s-maxage=30");
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
