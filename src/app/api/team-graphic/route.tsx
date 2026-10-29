import { getDb } from "@/lib/db";
import { renderTeamGraphic } from "@/lib/sharing/team-graphic-image";
import { apiGuard } from "@/lib/security/api-guard";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export const runtime = "edge";

/**
 * Cache-Control for the generated PNG.
 *
 * - Public reports render identically for every viewer, so they keep the
 *   aggressive edge cache — unfurlers (Twitter/Discord/Slack/iMessage) hold
 *   OG images for hours-to-days anyway.
 * - Unlisted reports get the short edge window that GET /api/share/{id}
 *   uses. `cacheDel()` cannot purge Vercel's CDN, so a day-long `s-maxage`
 *   would keep handing out the graphic after the creator flips the report to
 *   private.
 * - A private report is only ever rendered for its owner or an accepted
 *   collaborator, so its PNG must never land in a shared cache.
 */
function graphicCacheControl(isPublic: boolean, privileged: boolean): string {
  if (isPublic) {
    return "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800";
  }
  if (privileged) return "private, no-store";
  return "public, max-age=0, s-maxage=30, must-revalidate";
}

/**
 * GET /api/team-graphic?id=SHARE_ID&style=compact|wide
 * Generates a downloadable team graphic PNG for content creators.
 */
export async function GET(request: Request) {
  const guard = await apiGuard(request, { rateLimit: { key: "graphic", max: 10 } });
  if (guard) return guard;

  const url = new URL(request.url);
  const shareId = url.searchParams.get("id");
  const style = url.searchParams.get("style") ?? "wide";

  if (!shareId) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  // ── Visibility gate ───────────────────────────────────────────
  // This endpoint is the report in PNG form (and /api/oembed publishes it as
  // `thumbnail_url`), so it obeys exactly the rules /s/{id} and
  // GET /api/share/{id} enforce: public and unlisted reports are viewable by
  // link — unlisted is link-shareable by design — while a private report
  // renders only for its owner or an accepted collaborator. Blocked requests
  // get 404, never 403, so the graphic can't be used to confirm that a share
  // id exists.
  const sql = getDb();
  const rows = await sql`
    SELECT data, is_public, is_unlisted, owner_id
    FROM shares WHERE id = ${shareId} AND deleted_at IS NULL
  `;
  if (rows.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const isPublic = rows[0].is_public === true;
  const isUnlisted = rows[0].is_unlisted === true;

  // Owner/collaborator access is account-based, same as GET /api/share/{id}:
  // a legacy ?key= edit token must never unlock a graphic. Resolved only when
  // the report isn't already link-viewable, so public unfurls keep their
  // zero-auth fast path.
  let privileged = false;
  if (!isPublic && !isUnlisted) {
    let userId: string | null = null;
    try {
      const { userId: uid } = await auth();
      userId = uid;
    } catch { /* not authenticated */ }
    if (userId) {
      if (rows[0].owner_id === userId) {
        privileged = true;
      } else {
        const collabRows = await sql`
          SELECT 1 FROM collaborators WHERE share_id = ${shareId} AND user_id = ${userId}
            AND COALESCE(status, 'accepted') = 'accepted'
        `;
        privileged = collabRows.length > 0;
      }
    }
    if (!privileged) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
  }

  const cacheControl = graphicCacheControl(isPublic, privileged);

  const data = rows[0].data as Record<string, unknown>;
  return renderTeamGraphic(data, style, cacheControl);
}
