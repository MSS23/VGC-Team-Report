import { getDb } from "@/lib/db";
import { apiGuard } from "@/lib/security/api-guard";
import { notifyFollowers } from "@/lib/notifications";
import { detectChangedSections } from "@/lib/utils/diff-state";
import { cacheInvalidatePrefix, cacheDel, CacheKeys } from "@/lib/cache";
import { captureServerEvent } from "@/lib/posthog-server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const MAX_BODY_SIZE = 512_000; // 500 KB

const ShareBodySchema = z.object({
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
    allowComments: z.boolean().optional(),
    tags: z.object({
      regulation: z.string().optional(),
      eventType: z.string().optional(),
      archetype: z.array(z.string()).optional(),
    }).optional(),
    templateId: z.string().optional(),
    genTheme: z.string().optional(),
  }).strip(),
  existingId: z.string().optional(),
  editToken: z.string().optional(),
  isPublic: z.boolean().optional(),
  isPublish: z.boolean().optional(),
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
    // Rate limit + body size guard
    const guard = await apiGuard(request, { rateLimit: { key: "share", max: 20 }, maxBodySize: MAX_BODY_SIZE });
    if (guard) return guard;

    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

    const raw = await request.json();
    const parsed = ShareBodySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const { state, existingId, editToken, isPublic, isPublish } = parsed.data;

    // Never save sample teams
    if (state.paste.trimStart().startsWith("Kangaskhan-Mega @ Kangaskhanite\nAbility: Parental Bond")) {
      return NextResponse.json({ error: "Sample teams cannot be saved" }, { status: 400 });
    }

    // Creator name is mandatory for all shares
    const creatorNameValue = (state.creatorName as string)?.trim();
    if (!creatorNameValue) {
      return NextResponse.json(
        { error: "Add your name in the \"By\" field before sharing. Every report needs an author." },
        { status: 400 }
      );
    }

    const sql = getDb();

    // Build search vector text from state fields
    const searchCreator = (state.creatorName as string) ?? "";
    const searchTournament = (state.tournamentName as string) ?? "";
    const searchPaste = (state.paste as string) ?? "";
    const searchSummary = (state.teamSummary as string) ?? "";

    // Update existing share (increment version for collaborative sync)
    if (existingId && editToken) {
      // Fetch old state for changelog diff and version snapshot
      const oldRows = await sql`
        SELECT data, COALESCE(version, 1) AS version, is_public, owner_id FROM shares WHERE id = ${existingId} AND edit_token = ${editToken} AND deleted_at IS NULL
      `;

      // Detect actual changes before creating a version
      const oldState = oldRows.length > 0 ? (oldRows[0].data as Record<string, unknown>) : null;
      const sections = detectChangedSections(oldState, state);
      const hasDataChanges = sections.length > 0;

      // Only snapshot and increment version when data actually changed
      if (hasDataChanges && oldRows.length > 0) {
        const oldVersion = Number(oldRows[0].version);
        const oldData = oldRows[0].data;
        try {
          const { userId } = await auth();
          const user = userId ? await currentUser() : null;
          const editorName = user?.firstName
            ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ""}`
            : user?.username ?? null;
          sql`
            INSERT INTO share_versions (share_id, version, data, editor_id, editor_name)
            VALUES (${existingId}, ${oldVersion}, ${JSON.stringify(oldData)}::jsonb, ${userId ?? null}, ${editorName})
            ON CONFLICT (share_id, version) DO NOTHING
          `.catch(() => { /* version snapshot is non-critical */ });
        } catch {
          // Auth not available — snapshot without editor info
          sql`
            INSERT INTO share_versions (share_id, version, data)
            VALUES (${existingId}, ${oldVersion}, ${JSON.stringify(oldData)}::jsonb)
            ON CONFLICT (share_id, version) DO NOTHING
          `.catch(() => {});
        }
      }

      // Only the owner can change visibility — collaborators keep the existing value
      let effectiveIsPublic = isPublic ?? false;
      if (oldRows.length > 0 && isPublic !== undefined) {
        const currentIsPublic = !!oldRows[0].is_public;
        if (isPublic !== currentIsPublic) {
          // Visibility is changing — verify caller is the owner
          let callerId: string | null = null;
          try {
            const { userId: uid } = await auth();
            callerId = uid;
          } catch { /* not authenticated */ }
          if (!callerId || callerId !== oldRows[0].owner_id) {
            // Not the owner — return an explicit error so the client can surface
            // it and the user isn't left staring at a "saved" toggle that didn't
            // actually publish. Previously this silently reverted the value,
            // which caused "I clicked List on Explore but it didn't appear".
            return NextResponse.json(
              { error: "Only the report owner can change visibility." },
              { status: 403 }
            );
          }
        }
      }

      // Require tags to publish — only block when going from private → public
      const wasPublic = oldRows.length > 0 && !!oldRows[0].is_public;
      if (effectiveIsPublic && !wasPublic) {
        const tags = (state.tags ?? {}) as Record<string, unknown>;
        const hasRegulation = !!tags.regulation;
        const hasEventType = !!tags.eventType;
        const hasArchetype = Array.isArray(tags.archetype) && tags.archetype.length > 0;
        if (!hasRegulation && !hasEventType && !hasArchetype) {
          return NextResponse.json(
            { error: "Cannot publish to the public as there are no tags on this report." },
            { status: 400 }
          );
        }
      }

      const rows = await sql`
        UPDATE shares
        SET data = ${JSON.stringify(state)}::jsonb, updated_at = NOW(),
            version = COALESCE(version, 1) + ${hasDataChanges ? 1 : 0},
            is_public = ${effectiveIsPublic},
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
        if (hasDataChanges) {
          try {
            const { userId } = await auth();
            if (userId) {
              const user = await currentUser();
              const editorName = user?.firstName
                ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ""}`
                : user?.username ?? "Unknown";
              sql`
                INSERT INTO edit_changelog (share_id, version, editor_id, editor_name, sections, is_published)
                VALUES (${existingId}, ${rows[0].version}, ${userId}, ${editorName}, ${JSON.stringify(sections)}::jsonb, ${isPublish ?? false})
              `.catch(() => { /* changelog insert is non-critical */ });
            }
          } catch { /* not authenticated — skip changelog */ }
        }

        // Invalidate caches for this share and explore listings
        await Promise.all([
          cacheDel(CacheKeys.share(existingId)),
          cacheInvalidatePrefix("explore:"),
        ]);

        // Track server-side
        captureServerEvent(ip, "report_updated", {
          report_id: existingId,
          version: rows[0].version,
          sections_changed: hasDataChanges ? sections : [],
          is_publish: isPublish ?? false,
        });

        return NextResponse.json({ id: existingId, editToken, updated: true, version: rows[0].version, isPublic: rows[0].is_public });
      }
      // Token mismatch or not found — fall through to create new
    }

    // Create new share — requires authentication
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

    // Require tags to publish new reports
    if (isPublic) {
      const tags = (state.tags ?? {}) as Record<string, unknown>;
      const hasRegulation = !!tags.regulation;
      const hasEventType = !!tags.eventType;
      const hasArchetype = Array.isArray(tags.archetype) && tags.archetype.length > 0;
      if (!hasRegulation && !hasEventType && !hasArchetype) {
        return NextResponse.json(
          { error: "Cannot publish to the public as there are no tags on this report." },
          { status: 400 }
        );
      }
    }

    // ── Dedup: check if this owner already has a share with the same paste ──
    // This prevents duplicate public reports when a user navigates away from
    // /s/{id} (clearing the client-side session refs) and clicks Share again.
    const existingDup = await sql`
      SELECT id, edit_token, COALESCE(version, 1) AS version, is_public
      FROM shares
      WHERE owner_id = ${ownerId}
        AND deleted_at IS NULL
        AND is_draft = FALSE
        AND data->>'paste' = ${state.paste}
      ORDER BY updated_at DESC
      LIMIT 1
    `;

    if (existingDup.length > 0) {
      // Update the existing share instead of creating a duplicate
      const dup = existingDup[0];
      const effectiveIsPublic = isPublic ?? !!dup.is_public;
      await sql`
        UPDATE shares
        SET data = ${JSON.stringify(state)}::jsonb, updated_at = NOW(),
            version = COALESCE(version, 1) + 1,
            is_public = ${effectiveIsPublic},
            search_vector =
              setweight(to_tsvector('english', ${searchCreator}), 'A') ||
              setweight(to_tsvector('english', ${searchTournament}), 'A') ||
              setweight(to_tsvector('english', ${searchPaste}), 'B') ||
              setweight(to_tsvector('english', ${searchSummary}), 'C')
        WHERE id = ${dup.id}
      `;
      await Promise.all([
        cacheDel(CacheKeys.share(dup.id)),
        cacheInvalidatePrefix("explore:"),
      ]);
      return NextResponse.json({
        id: dup.id,
        editToken: dup.edit_token,
        updated: true,
        version: Number(dup.version) + 1,
        isPublic: effectiveIsPublic,
      });
    }

    const id = generateId();
    const newEditToken = generateEditToken();

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
          INSERT INTO edit_changelog (share_id, version, editor_id, editor_name, sections, is_published)
          VALUES (${id}, 1, ${ownerId}, ${editorName}, ${JSON.stringify(["Created report"])}::jsonb, TRUE)
        `.catch(() => {});
      } catch { /* skip */ }
    }

    // Clean up any drafts for this user (fire-and-forget — the real share replaces the draft)
    if (ownerId) {
      sql`DELETE FROM shares WHERE owner_id = ${ownerId} AND is_draft = TRUE`.catch(() => {});
    }

    // Invalidate explore cache on new share
    cacheInvalidatePrefix("explore:");

    // Notify followers when a new public report is created (fire-and-forget)
    if (isPublic && state.creatorName) {
      notifyFollowers(state.creatorName as string, id, ownerId ?? undefined);
    }

    // Track server-side
    captureServerEvent(ownerId, "report_created", {
      report_id: id,
      is_public: isPublic ?? false,
      has_tournament: !!state.tournamentName,
      has_matchup_plans: (state.matchupPlans?.length ?? 0) > 0,
      has_notes: !!state.notes && Object.keys(state.notes).length > 0,
      creator_name: state.creatorName ?? null,
    });

    return NextResponse.json({ id, editToken: newEditToken, updated: false, version: 1, isPublic: isPublic ?? false });
  } catch (e) {
    console.error("Share create/update error:", e);
    return NextResponse.json(
      { error: "Failed to save share" },
      { status: 500 }
    );
  }
}
