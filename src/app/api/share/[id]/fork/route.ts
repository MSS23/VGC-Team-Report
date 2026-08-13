import { getDb } from "@/lib/db";
import { apiGuard } from "@/lib/security/api-guard";
import { getClientIp } from "@/lib/security/input-validation";
import { cacheInvalidatePrefix } from "@/lib/cache";
import { captureServerEvent } from "@/lib/posthog-server";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const IdSchema = z.string().regex(/^[A-Za-z0-9]{8}$/, "Invalid share ID");

function generateId(): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}

function generateEditToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * POST /api/share/{id}/fork
 *
 * Forks an existing share into a new report owned by the current user.
 * The new report:
 *   - is private (unlisted) by default — the forker can publish it later
 *   - keeps the team paste, notes, calcs, roles, summary, matchup plans, tags
 *   - clears event-specific fields (tournament name, placement, record, rental code)
 *   - clears the creator name (forker should set their own)
 *   - tracks the original via the `forked_from_id` column for attribution
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await apiGuard(request, { rateLimit: { key: "share-fork", max: 10 } });
    if (guard) return guard;

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Sign in to fork a report" },
        { status: 401 }
      );
    }

    const { id: rawId } = await params;
    const idResult = IdSchema.safeParse(rawId);
    if (!idResult.success) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const sourceId = idResult.data;

    const sql = getDb();

    // Load source. Drop forked_from_id from the SELECT so this route works
    // even before the migration runs — the fork INSERT below is the only
    // place this route touches that column, and it's guarded by the fork
    // route itself requiring the column to exist.
    const sourceRows = await sql`
      SELECT data, owner_id, is_public
      FROM shares
      WHERE id = ${sourceId} AND deleted_at IS NULL
    `;
    if (sourceRows.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Forking is restricted to public reports only. Unlisted/private reports
    // stay the owner's — link-possession grants view, not the right to copy
    // the team into a new report. The owner can still duplicate their own
    // team through the normal editor flow.
    const sourceIsPublic = !!sourceRows[0].is_public;
    if (!sourceIsPublic) {
      return NextResponse.json(
        { error: "Only public reports can be forked" },
        { status: 403 }
      );
    }

    const sourceData = sourceRows[0].data as Record<string, unknown>;

    // Build the forked state: preserve team-building content, clear event-specific fields
    // and the original creator name so the new owner can populate their own.
    const forkedData: Record<string, unknown> = {
      ...sourceData,
      creatorName: "",
      tournamentName: "",
      placement: "",
      record: "",
      rentalCode: "",
      // Reset MVP since the new owner may pick a different one
      mvpIndex: null,
    };

    const newId = generateId();
    const newEditToken = generateEditToken();

    // Build search vector — fork starts private so this is informational;
    // it gets rebuilt when/if the user publishes via the normal share update path.
    const searchPaste = (forkedData.paste as string) ?? "";
    const searchSummary = (forkedData.teamSummary as string) ?? "";

    await sql`
      INSERT INTO shares (
        id, edit_token, data, version, is_public, owner_id, forked_from_id, search_vector
      )
      VALUES (
        ${newId},
        ${newEditToken},
        ${JSON.stringify(forkedData)}::jsonb,
        1,
        FALSE,
        ${userId},
        ${sourceId},
        setweight(to_tsvector('english', ''), 'A') ||
        setweight(to_tsvector('english', ''), 'A') ||
        setweight(to_tsvector('english', ${searchPaste}), 'B') ||
        setweight(to_tsvector('english', ${searchSummary}), 'C')
      )
    `;

    // Record creation in changelog so the edit history shows it started as a fork
    sql`
      INSERT INTO edit_changelog (share_id, version, editor_id, editor_name, sections, is_published)
      VALUES (${newId}, 1, ${userId}, ${null}, ${JSON.stringify([`Forked from ${sourceId}`])}::jsonb, FALSE)
    `.catch(() => { /* changelog insert is non-critical */ });

    // Invalidate dashboard/explore caches in case they list this owner's reports
    cacheInvalidatePrefix("explore:");

    // Server-side analytics
    const ip = getClientIp(request);
    captureServerEvent(ip, "report_forked", {
      report_id: newId,
      source_report_id: sourceId,
      source_owner_id: (sourceRows[0].owner_id as string | null) ?? null,
    });

    return NextResponse.json({
      id: newId,
      editToken: newEditToken,
      forkedFromId: sourceId,
    });
  } catch (e) {
    console.error("Fork error:", e);
    return NextResponse.json({ error: "Failed to fork report" }, { status: 500 });
  }
}
