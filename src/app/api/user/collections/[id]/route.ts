import { getDb } from "@/lib/db";
import { extractSpecies } from "@/lib/utils/extract-species";
import { normalizePrivateFields, redactPasteFields } from "@/lib/sharing/redact-paste";
import { apiGuard } from "@/lib/security/api-guard";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

/**
 * Apply tiered-publishing redaction (VGC-142) for non-owner viewers.
 * Mirrors the helper in /api/share/[id]/route.ts so collection viewers
 * never see hidden spreads/items on shares whose creator marked them
 * private. Returns the (possibly mutated) data plus the list of fields
 * that were redacted.
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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await apiGuard(request, { rateLimit: { key: "collection-detail", max: 60 } });
  if (guard) return guard;

  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const sql = getDb();

    // Verify ownership
    const col = await sql`SELECT id FROM collections WHERE id = ${id} AND user_id = ${userId}`;
    if (col.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Get items with share data. We additionally pull owner_id and is_public so
    // we can re-verify access per-share at read time (mirrors the check in
    // /api/user/saved): the caller must own the share OR the share must be
    // public. Anything else is filtered out — this prevents leaking team
    // JSON for shares that have since been made private/unlisted/redacted, or
    // that were never accessible to the caller in the first place.
    const rows = await sql`
      SELECT s.id, s.data, COALESCE(s.view_count, 0) as view_count, s.is_public, s.owner_id, s.created_at, s.updated_at, ci.added_at
      FROM collection_items ci
      INNER JOIN shares s ON s.id = ci.share_id
      WHERE ci.collection_id = ${id} AND s.deleted_at IS NULL
      ORDER BY ci.added_at DESC
    `;

    const items = rows
      .filter((row) => row.is_public === true || row.owner_id === userId)
      .map((row) => {
        const rawData = row.data as Record<string, unknown>;
        const isOwner = row.owner_id === userId;
        // Owners see the full data; everyone else gets the same tiered-publishing
        // redaction the public share endpoint applies.
        const { data } = isOwner
          ? { data: rawData }
          : applyPrivateFieldRedaction(rawData);
        const paste = (data.paste as string) ?? "";
        return {
          id: row.id as string,
          species: extractSpecies(paste),
          tournamentName: (data.tournamentName as string) || undefined,
          creatorName: (data.creatorName as string) || undefined,
          placement: (data.placement as string) || undefined,
          teamSummary: (data.teamSummary as string) || undefined,
          createdAt: (row.created_at as Date).toISOString(),
          updatedAt: (row.updated_at as Date).toISOString(),
          viewCount: row.view_count as number,
          addedAt: (row.added_at as Date).toISOString(),
        };
      });

    return NextResponse.json({ items });
  } catch (e) {
    console.error("Collection detail error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
