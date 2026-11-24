import { getDb } from "@/lib/db";
import { extractSpecies } from "@/lib/utils/extract-species";
import { generateAlphanumericId, generateEditToken, ShareIdSchema } from "@/lib/api/ids";
import { readJsonBody } from "@/lib/api/json-body";
import { apiGuard } from "@/lib/security/api-guard";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
// Server-only route: import the schemas module directly so this path keeps a
// static zod import. `url-codec.ts` no longer re-exports the schemas (VGC-256)
// because it sits in the homepage client graph.
import { ShareableStateSchema } from "@/lib/sharing/url-codec.schemas";

const DraftBodySchema = z.object({
  // Reuse the canonical report schema so drafts cannot silently lose newly
  // added fields when they are saved and resumed later.
  state: ShareableStateSchema,
  draftId: z.string().optional(),
});

/** GET /api/user/drafts — list user's draft reports */
export async function GET(request: NextRequest) {
  const guard = await apiGuard(request, { rateLimit: { key: "user-drafts", max: 30 } });
  if (guard) return guard;

  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sql = getDb();

    // Single draft fetch with full data (for resuming)
    const draftId = request.nextUrl.searchParams.get("id");
    if (draftId) {
      const rows = await sql`
        SELECT id, data, created_at, updated_at
        FROM shares
        WHERE id = ${draftId} AND owner_id = ${userId} AND is_draft = TRUE AND deleted_at IS NULL
      `;
      if (rows.length === 0) {
        return NextResponse.json({ drafts: [] });
      }
      const row = rows[0];
      return NextResponse.json({
        drafts: [{
          id: row.id as string,
          data: row.data,
          createdAt: (row.created_at as Date).toISOString(),
          updatedAt: (row.updated_at as Date).toISOString(),
        }],
      });
    }

    const rows = await sql`
      SELECT id, data, created_at, updated_at
      FROM shares
      WHERE owner_id = ${userId} AND is_draft = TRUE AND deleted_at IS NULL
      ORDER BY updated_at DESC
      LIMIT 20
    `;

    const drafts = rows.map((row) => {
      const data = row.data as Record<string, unknown>;
      const paste = (data.paste as string) ?? "";
      return {
        id: row.id as string,
        species: extractSpecies(paste),
        tournamentName: (data.tournamentName as string) || undefined,
        creatorName: (data.creatorName as string) || undefined,
        teamSummary: (data.teamSummary as string) || undefined,
        createdAt: (row.created_at as Date).toISOString(),
        updatedAt: (row.updated_at as Date).toISOString(),
      };
    });

    return NextResponse.json({ drafts });
  } catch (e) {
    console.error("User drafts error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

/** POST /api/user/drafts — create or update a draft */
export async function POST(request: NextRequest) {
  const guard = await apiGuard(request, { rateLimit: { key: "user-drafts-save", max: 60 }, maxBodySize: 512_000 });
  if (guard) return guard;

  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const json = await readJsonBody(request);
    if ("error" in json) return json.error;
    const parsed = DraftBodySchema.safeParse(json.body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }

    const { state, draftId } = parsed.data;

    // Never save sample teams — reject any paste that starts with the sample identifier
    if (state.paste.trimStart().startsWith("Kangaskhan-Mega @ Kangaskhanite\nAbility: Parental Bond")) {
      return NextResponse.json({ error: "Sample teams cannot be saved as drafts" }, { status: 400 });
    }

    const sql = getDb();

    // Update existing draft
    if (draftId) {
      const rows = await sql`
        UPDATE shares
        SET data = ${JSON.stringify(state)}::jsonb, updated_at = NOW()
        WHERE id = ${draftId} AND owner_id = ${userId} AND is_draft = TRUE AND deleted_at IS NULL
        RETURNING id
      `;
      if (rows.length > 0) {
        return NextResponse.json({ id: draftId, updated: true });
      }
      // Draft not found — fall through to create new
    }

    // Create new draft
    const id = generateAlphanumericId(8);
    const editToken = generateEditToken();

    await sql`
      INSERT INTO shares (id, edit_token, data, version, is_public, is_draft, owner_id)
      VALUES (${id}, ${editToken}, ${JSON.stringify(state)}::jsonb, 1, FALSE, TRUE, ${userId})
    `;

    return NextResponse.json({ id, updated: false });
  } catch (e) {
    console.error("Draft save error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

/** DELETE /api/user/drafts — delete a draft */
export async function DELETE(request: NextRequest) {
  const guard = await apiGuard(request, { rateLimit: { key: "user-drafts-del", max: 30 } });
  if (guard) return guard;

  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const json = await readJsonBody(request);
    if ("error" in json) return json.error;
    const raw = json.body as { draftId?: unknown };
    if (!raw.draftId) {
      return NextResponse.json({ error: "Missing draftId" }, { status: 400 });
    }
    const parsedId = ShareIdSchema.safeParse(raw.draftId);
    if (!parsedId.success) {
      return NextResponse.json({ error: "Invalid draftId" }, { status: 400 });
    }
    const draftId = parsedId.data;

    const sql = getDb();
    await sql`
      DELETE FROM shares
      WHERE id = ${draftId} AND owner_id = ${userId} AND is_draft = TRUE
    `;

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Draft delete error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
