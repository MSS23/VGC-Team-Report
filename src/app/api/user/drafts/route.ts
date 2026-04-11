import { getDb } from "@/lib/db";
import { extractSpecies } from "@/lib/utils/extract-species";
import { apiGuard } from "@/lib/security/api-guard";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const DraftBodySchema = z.object({
  state: z.object({
    paste: z.string(),
    matchupPlans: z.array(z.unknown()).optional().default([]),
    notes: z.record(z.string(), z.unknown()).optional(),
    calcs: z.record(z.string(), z.unknown()).optional(),
    roles: z.record(z.string(), z.unknown()).optional(),
    teamSummary: z.string().optional(),
    teamName: z.string().optional(),
    tournamentName: z.string().optional(),
    placement: z.string().optional(),
    record: z.string().optional(),
    mvpIndex: z.number().nullable().optional(),
    rentalCode: z.string().optional(),
    creatorName: z.string().optional(),
    spriteSettings: z.unknown().optional(),
    hiddenSlides: z.array(z.union([z.number(), z.string()])).optional(),
    tags: z.object({
      regulation: z.string().optional(),
      eventType: z.string().optional(),
      archetype: z.array(z.string()).optional(),
    }).optional(),
    templateId: z.string().optional(),
    genTheme: z.string().optional(),
  }).strip(),
  draftId: z.string().optional(),
});

function generateId(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}

function generateEditToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

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
        SELECT id, edit_token, data, created_at, updated_at
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
          editToken: row.edit_token as string,
          data: row.data,
          createdAt: (row.created_at as Date).toISOString(),
          updatedAt: (row.updated_at as Date).toISOString(),
        }],
      });
    }

    const rows = await sql`
      SELECT id, edit_token, data, created_at, updated_at
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
        editToken: row.edit_token as string,
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

    const raw = await request.json();
    const parsed = DraftBodySchema.safeParse(raw);
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
    const id = generateId();
    const editToken = generateEditToken();

    await sql`
      INSERT INTO shares (id, edit_token, data, version, is_public, is_draft, owner_id)
      VALUES (${id}, ${editToken}, ${JSON.stringify(state)}::jsonb, 1, FALSE, TRUE, ${userId})
    `;

    return NextResponse.json({ id, editToken, updated: false });
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

    const { draftId } = await request.json();
    if (!draftId) {
      return NextResponse.json({ error: "Missing draftId" }, { status: 400 });
    }

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
