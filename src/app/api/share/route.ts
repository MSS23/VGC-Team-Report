import { getDb } from "@/lib/db";
import { isRateLimited } from "@/lib/rate-limit";
import { notifyFollowers } from "@/lib/notifications";
import { detectChangedSections } from "@/lib/utils/diff-state";
import { cacheInvalidatePrefix, cacheDel, CacheKeys } from "@/lib/cache";
import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const MAX_BODY_SIZE = 512_000; // 500 KB

const ShareBodySchema = z.object({
  state: z.object({
    paste: z.string(),
    matchupPlans: z.array(z.unknown()).optional().default([]),
  }).passthrough(),
  existingId: z.string().optional(),
  editToken: z.string().optional(),
  isPublic: z.boolean().optional(),
});

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

export async function POST(request: Request) {
  try {
    // Rate limit by IP
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    if (isRateLimited(`share:${ip}`, 20, 60_000)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    // Check content length
    const contentLength = parseInt(request.headers.get("content-length") ?? "0", 10);
    if (contentLength > MAX_BODY_SIZE) {
      return NextResponse.json(
        { error: "Request too large" },
        { status: 413 }
      );
    }

    const raw = await request.json();
    const parsed = ShareBodySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const { state, existingId, editToken, isPublic } = parsed.data;

    const sql = getDb();

    // Build search vector text from state fields
    const searchCreator = (state.creatorName as string) ?? "";
    const searchTournament = (state.tournamentName as string) ?? "";
    const searchPaste = (state.paste as string) ?? "";
    const searchSummary = (state.teamSummary as string) ?? "";

    // Update existing share (increment version for collaborative sync)
    if (existingId && editToken) {
      // Fetch old state for changelog diff
      const oldRows = await sql`
        SELECT data, COALESCE(version, 1) AS version FROM shares WHERE id = ${existingId} AND edit_token = ${editToken} AND deleted_at IS NULL
      `;

      const rows = await sql`
        UPDATE shares
        SET data = ${JSON.stringify(state)}::jsonb, updated_at = NOW(), version = COALESCE(version, 1) + 1,
            is_public = ${isPublic ?? false},
            search_vector =
              setweight(to_tsvector('english', ${searchCreator}), 'A') ||
              setweight(to_tsvector('english', ${searchTournament}), 'A') ||
              setweight(to_tsvector('english', ${searchPaste}), 'B') ||
              setweight(to_tsvector('english', ${searchSummary}), 'C')
        WHERE id = ${existingId} AND edit_token = ${editToken}
        RETURNING id, COALESCE(version, 1) AS version, is_public
      `;
      if (rows.length > 0) {
        // Record changelog entry (fire-and-forget, only for authenticated users)
        try {
          const { userId } = await auth();
          if (userId) {
            const user = await currentUser();
            const editorName = user?.firstName
              ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ""}`
              : user?.username ?? "Unknown";
            const oldState = oldRows.length > 0 ? (oldRows[0].data as Record<string, unknown>) : null;
            const sections = detectChangedSections(oldState, state);
            if (sections.length > 0) {
              sql`
                INSERT INTO edit_changelog (share_id, version, editor_id, editor_name, sections)
                VALUES (${existingId}, ${rows[0].version}, ${userId}, ${editorName}, ${JSON.stringify(sections)}::jsonb)
              `.catch(() => { /* changelog insert is non-critical */ });
            }
          }
        } catch { /* not authenticated — skip changelog */ }

        // Invalidate caches for this share and explore listings
        await Promise.all([
          cacheDel(CacheKeys.share(existingId)),
          cacheInvalidatePrefix("explore:"),
        ]);
        return NextResponse.json({ id: existingId, editToken, updated: true, version: rows[0].version, isPublic: rows[0].is_public });
      }
      // Token mismatch or not found — fall through to create new
    }

    // Create new share — requires authentication
    const id = generateId();
    const newEditToken = generateEditToken();
    let ownerId: string | null = null;
    try {
      const { userId } = await auth();
      ownerId = userId;
    } catch { /* auth check failed */ }

    if (!ownerId) {
      return NextResponse.json(
        { error: "Sign in to share your team report" },
        { status: 401 }
      );
    }

    await sql`
      INSERT INTO shares (id, edit_token, data, version, is_public, owner_id, search_vector)
      VALUES (
        ${id}, ${newEditToken}, ${JSON.stringify(state)}::jsonb, 1, ${isPublic ?? false}, ${ownerId},
        setweight(to_tsvector('english', ${searchCreator}), 'A') ||
        setweight(to_tsvector('english', ${searchTournament}), 'A') ||
        setweight(to_tsvector('english', ${searchPaste}), 'B') ||
        setweight(to_tsvector('english', ${searchSummary}), 'C')
      )
    `;

    // Record initial changelog entry
    if (ownerId) {
      try {
        const user = await currentUser();
        const editorName = user?.firstName
          ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ""}`
          : user?.username ?? "Unknown";
        sql`
          INSERT INTO edit_changelog (share_id, version, editor_id, editor_name, sections)
          VALUES (${id}, 1, ${ownerId}, ${editorName}, ${JSON.stringify(["Created report"])}::jsonb)
        `.catch(() => {});
      } catch { /* skip */ }
    }

    // Invalidate explore cache on new share
    cacheInvalidatePrefix("explore:");

    // Notify followers when a new public report is created (fire-and-forget)
    if (isPublic && state.creatorName) {
      notifyFollowers(state.creatorName as string, id, ownerId ?? undefined);
    }

    return NextResponse.json({ id, editToken: newEditToken, updated: false, version: 1, isPublic: isPublic ?? false });
  } catch (e) {
    console.error("Share create/update error:", e);
    return NextResponse.json(
      { error: "Failed to save share" },
      { status: 500 }
    );
  }
}
