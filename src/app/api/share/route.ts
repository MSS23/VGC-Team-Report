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
    // "How to pilot this team" (Common Modes / leads / strengths / etc.).
    // MUST be listed here — the schema strips unknown keys, so omitting this
    // silently dropped the entire Modes section on every save (the client
    // showed "saved" but the DB never stored it).
    commonModes: z
      .object({
        leads: z.string().optional(),
        modes: z.string().optional(),
        strengths: z.string().optional(),
        weaknesses: z.string().optional(),
        gameplan: z.string().optional(),
      })
      .optional(),
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
      regulationAutoDetected: z.boolean().optional(),
    }).optional(),
    templateId: z.string().optional(),
    // Tiered-publishing per-field visibility flags. Also previously absent
    // from this schema, so the "hide fields from public viewers" choices were
    // stripped on save the same way commonModes was.
    privateFields: z.array(z.string()).optional(),
    genTheme: z.string().optional(),
  }).strip(),
  existingId: z.string().optional(),
  editToken: z.string().optional(),
  draftId: z.string().min(1).max(128).optional(),
  isPublic: z.boolean().optional(),
  isUnlisted: z.boolean().optional(),
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
    const { state, existingId, editToken, draftId, isPublic, isUnlisted, isPublish } = parsed.data;

    // Require authentication for ALL writes — both create and update. An edit
    // token in localStorage alone must never grant mutation rights to an
    // anonymous session: a signed-out user on the creator's own device would
    // otherwise keep silently autosaving into the published report. Saving
    // and sharing is an authenticated action, full stop.
    let authedUserId: string | null = null;
    try {
      const { userId } = await auth();
      authedUserId = userId;
    } catch { /* auth check failed */ }
    if (!authedUserId) {
      return NextResponse.json(
        { error: "Sign in to save or update a team report." },
        { status: 401 }
      );
    }

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
        SELECT data, COALESCE(version, 1) AS version, is_public, is_unlisted, owner_id FROM shares WHERE id = ${existingId} AND edit_token = ${editToken} AND deleted_at IS NULL
      `;

      // Detect actual changes before creating a version
      const oldState = oldRows.length > 0 ? (oldRows[0].data as Record<string, unknown>) : null;
      const sections = detectChangedSections(oldState, state);
      const hasDataChanges = sections.length > 0;

      // Only snapshot and increment version when data actually changed
      if (hasDataChanges && oldRows.length > 0) {
        const oldVersion = Number(oldRows[0].version);
        const oldData = oldRows[0].data;

        // ── Snapshot coalescing (§1-B) ──────────────────────────────────────
        // Writing a full-report JSONB blob into share_versions on every
        // 3-second autosave is what ballooned that table to 447MB / 131k rows
        // for 119 shares. Only take a fresh snapshot when EITHER this is an
        // explicit publish, OR the newest existing snapshot for this share is
        // older than the coalescing window. Otherwise skip the blob write and
        // let the version bump / changelog below carry the change.
        // The check is a single cheap indexed lookup (idx_share_versions_share).
        const COALESCE_WINDOW_MINUTES = 10;
        let shouldSnapshot = isPublish === true;
        if (!shouldSnapshot) {
          try {
            const latest = await sql`
              SELECT MAX(created_at) AS latest FROM share_versions WHERE share_id = ${existingId}
            `;
            const latestAt = latest.length > 0 ? latest[0].latest : null;
            // No prior snapshot, or the newest is older than the window → snapshot.
            shouldSnapshot =
              !latestAt ||
              Date.now() - new Date(latestAt as string).getTime() >
                COALESCE_WINDOW_MINUTES * 60_000;
          } catch (err) {
            // Fail open — a missed snapshot loses revert history; better to write.
            console.error("share_versions coalesce check failed:", err);
            shouldSnapshot = true;
          }
        }

        if (shouldSnapshot) {
          let snapshotInserted = false;
          try {
            const { userId } = await auth();
            const user = userId ? await currentUser() : null;
            const editorName = user?.firstName
              ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ""}`
              : user?.username ?? null;
            // Awaited so the snapshot actually completes before the Vercel lambda freezes
            // after responding (bare .catch() on Neon HTTP queries can be cancelled).
            // Non-fatal — log on failure but don't break the main update.
            try {
              await sql`
                INSERT INTO share_versions (share_id, version, data, editor_id, editor_name)
                VALUES (${existingId}, ${oldVersion}, ${JSON.stringify(oldData)}::jsonb, ${userId ?? null}, ${editorName})
                ON CONFLICT (share_id, version) DO NOTHING
              `;
              snapshotInserted = true;
            } catch (err) {
              console.error("share_versions snapshot failed (with editor):", err);
            }
          } catch {
            // Auth not available — snapshot without editor info
            try {
              await sql`
                INSERT INTO share_versions (share_id, version, data)
                VALUES (${existingId}, ${oldVersion}, ${JSON.stringify(oldData)}::jsonb)
                ON CONFLICT (share_id, version) DO NOTHING
              `;
              snapshotInserted = true;
            } catch (err) {
              console.error("share_versions snapshot failed (anon):", err);
            }
          }

          // ── Self-cleaning retention (§1-B) ──────────────────────────────
          // The versions UI only ever shows the newest 50, so anything beyond
          // that is invisible dead weight. Trim inline right after each insert
          // so the table can never regrow unbounded. Keyed to this share_id.
          if (snapshotInserted) {
            try {
              await sql`
                DELETE FROM share_versions
                WHERE share_id = ${existingId}
                  AND id NOT IN (
                    SELECT id FROM share_versions
                    WHERE share_id = ${existingId}
                    ORDER BY version DESC
                    LIMIT 50
                  )
              `;
            } catch (err) {
              console.error("share_versions retention trim failed:", err);
            }
          }
        }
      }

      // Preserve the report's current visibility whenever the client doesn't
      // explicitly send a new value. A bare update (e.g. a collaborator's
      // content autosave, or any older client) that omits isPublic/isUnlisted
      // must NOT silently demote a public or unlisted report to private —
      // that was the cause of "I set it to Unlisted and it reverted to
      // Private". Only an explicit flag from the owner changes visibility.
      const currentIsPublic = oldRows.length > 0 ? !!oldRows[0].is_public : false;
      const currentIsUnlisted = oldRows.length > 0 ? !!oldRows[0].is_unlisted : false;
      // Only the owner can change visibility — collaborators keep the existing value
      const effectiveIsPublic = isPublic ?? currentIsPublic;
      const effectiveIsUnlisted = isUnlisted ?? currentIsUnlisted;
      if (oldRows.length > 0 && isPublic !== undefined) {
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

      // Bump the version when visibility changes too, not just on data edits.
      // Version-based pollers (?since=N) get a 304 when the version is
      // unchanged — without this, a public→private flip would be invisible to
      // a client polling for updates and it would keep showing stale content.
      const visibilityChanged =
        effectiveIsPublic !== currentIsPublic || effectiveIsUnlisted !== currentIsUnlisted;
      const rows = await sql`
        UPDATE shares
        SET data = ${JSON.stringify(state)}::jsonb, updated_at = NOW(),
            version = COALESCE(version, 1) + ${hasDataChanges || visibilityChanged ? 1 : 0},
            is_public = ${effectiveIsPublic},
            is_unlisted = ${effectiveIsUnlisted},
            search_vector =
              setweight(to_tsvector('english', ${searchCreator}), 'A') ||
              setweight(to_tsvector('english', ${searchTournament}), 'A') ||
              setweight(to_tsvector('english', ${searchPaste}), 'B') ||
              setweight(to_tsvector('english', ${searchSummary}), 'C')
        WHERE id = ${existingId} AND edit_token = ${editToken}
        RETURNING id, COALESCE(version, 1) AS version, is_public, is_unlisted
      `;
      if (rows.length > 0) {
        // Record changelog entry — awaited so it actually completes on Vercel/Neon HTTP
        // (a bare .catch() promise can be cancelled when the lambda freezes after responding).
        // Failure is non-fatal: log and continue.
        if (hasDataChanges) {
          try {
            const { userId } = await auth();
            if (userId) {
              const user = await currentUser();
              const editorName = user?.firstName
                ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ""}`
                : user?.username ?? "Unknown";
              try {
                await sql`
                  INSERT INTO edit_changelog (share_id, version, editor_id, editor_name, sections, is_published)
                  VALUES (${existingId}, ${rows[0].version}, ${userId}, ${editorName}, ${JSON.stringify(sections)}::jsonb, ${isPublish ?? false})
                `;
                // Self-cleaning retention (§1-B): keep only the newest 50
                // changelog rows for this share, matching share_versions above.
                try {
                  await sql`
                    DELETE FROM edit_changelog
                    WHERE share_id = ${existingId}
                      AND id NOT IN (
                        SELECT id FROM edit_changelog
                        WHERE share_id = ${existingId}
                        ORDER BY version DESC, id DESC
                        LIMIT 50
                      )
                  `;
                } catch (err) {
                  console.error("edit_changelog retention trim failed:", err);
                }
              } catch (err) {
                console.error("edit_changelog insert failed (update path):", err);
              }
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

        return NextResponse.json({ id: existingId, editToken, updated: true, version: rows[0].version, isPublic: rows[0].is_public, isUnlisted: rows[0].is_unlisted });
      }
      // Token mismatch or not found — fall through to create new
    }

    // Create new share — auth was already enforced at the top of this handler.
    const ownerId: string = authedUserId;

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
      SELECT id, edit_token, COALESCE(version, 1) AS version, is_public, is_unlisted
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
      // Preserve existing unlisted state when the client doesn't explicitly
      // pass isUnlisted — otherwise a re-share silently flips unlisted → private.
      const effectiveIsUnlistedDup = isUnlisted ?? !!dup.is_unlisted;
      await sql`
        UPDATE shares
        SET data = ${JSON.stringify(state)}::jsonb, updated_at = NOW(),
            version = COALESCE(version, 1) + 1,
            is_public = ${effectiveIsPublic},
            is_unlisted = ${effectiveIsUnlistedDup},
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
      // Publishing a resumed draft should remove only that draft. Creators
      // may have several other works in progress in their dashboard.
      if (draftId) {
        try {
          await sql`
            DELETE FROM shares
            WHERE id = ${draftId} AND owner_id = ${ownerId} AND is_draft = TRUE
          `;
        } catch (err) {
          console.error("draft cleanup failed:", err);
        }
      }
      return NextResponse.json({
        id: dup.id,
        editToken: dup.edit_token,
        updated: true,
        version: Number(dup.version) + 1,
        isPublic: effectiveIsPublic,
        isUnlisted: effectiveIsUnlistedDup,
      });
    }

    const id = generateId();
    const newEditToken = generateEditToken();

    await sql`
      INSERT INTO shares (id, edit_token, data, version, is_public, is_unlisted, owner_id, search_vector)
      VALUES (
        ${id}, ${newEditToken}, ${JSON.stringify(state)}::jsonb, 1, ${isPublic ?? false}, ${isUnlisted ?? false}, ${ownerId},
        setweight(to_tsvector('english', ${searchCreator}), 'A') ||
        setweight(to_tsvector('english', ${searchTournament}), 'A') ||
        setweight(to_tsvector('english', ${searchPaste}), 'B') ||
        setweight(to_tsvector('english', ${searchSummary}), 'C')
      )
    `;

    // Record initial changelog entry — awaited so it completes before lambda freezes.
    // Non-fatal: log on failure but don't break the share creation response.
    if (ownerId) {
      try {
        const user = await currentUser();
        const editorName = user?.firstName
          ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ""}`
          : user?.username ?? "Unknown";
        try {
          await sql`
            INSERT INTO edit_changelog (share_id, version, editor_id, editor_name, sections, is_published)
            VALUES (${id}, 1, ${ownerId}, ${editorName}, ${JSON.stringify(["Created report"])}::jsonb, TRUE)
          `;
        } catch (err) {
          console.error("edit_changelog insert failed (create path):", err);
        }
      } catch { /* skip */ }
    }

    // Remove only the active draft being published; keep the creator's other
    // works in progress available in the dashboard.
    if (draftId) {
      try {
        await sql`
          DELETE FROM shares
          WHERE id = ${draftId} AND owner_id = ${ownerId} AND is_draft = TRUE
        `;
      } catch (err) {
        console.error("draft cleanup failed:", err);
      }
    }

    // Invalidate explore cache on new share — awaited so it actually flushes
    // before the lambda freezes (was previously fire-and-forget).
    try {
      await cacheInvalidatePrefix("explore:");
    } catch (err) {
      console.error("explore cache invalidate failed:", err);
    }

    // Notify followers when a new public (non-unlisted) report is created (fire-and-forget)
    if (isPublic && !isUnlisted && state.creatorName) {
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

    return NextResponse.json({ id, editToken: newEditToken, updated: false, version: 1, isPublic: isPublic ?? false, isUnlisted: isUnlisted ?? false });
  } catch (e) {
    console.error("Share create/update error:", e);
    return NextResponse.json(
      { error: "Failed to save share" },
      { status: 500 }
    );
  }
}
