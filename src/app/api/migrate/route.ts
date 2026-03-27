import { getDb } from "@/lib/db";
import { NextResponse } from "next/server";

/**
 * POST /api/migrate
 *
 * Batch-migrates all reports in the database to the latest data format.
 * Protected by MIGRATE_SECRET environment variable.
 *
 * What it does:
 * 1. Normalizes matchupPlans from legacy planA/planB/selectedIndices → gamePlans[]
 * 2. Ensures all top-level fields exist with proper defaults
 * 3. Backfills search_vector for public reports missing it
 * 4. Preserves ALL existing user data — only adds missing defaults
 *
 * Safe to run multiple times (idempotent).
 */
export async function POST(request: Request) {
  try {
    // Auth check — require secret to prevent abuse
    const { secret } = await request.json().catch(() => ({ secret: "" }));
    if (!secret || secret !== process.env.MIGRATE_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sql = getDb();
    const stats = { total: 0, migrated: 0, searchVectorBackfilled: 0, errors: 0 };

    // Fetch all shares in batches of 100
    let offset = 0;
    const batchSize = 100;

    while (true) {
      const rows = await sql`
        SELECT id, data, is_public, search_vector
        FROM shares
        WHERE deleted_at IS NULL
        ORDER BY created_at ASC
        LIMIT ${batchSize} OFFSET ${offset}
      `;

      if (rows.length === 0) break;
      offset += rows.length;

      for (const row of rows) {
        stats.total++;
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const data = row.data as Record<string, any>;
          const normalized = normalizeForMigration(data);
          const changed = JSON.stringify(data) !== JSON.stringify(normalized);

          // Check if search_vector needs backfill
          const needsSearchVector = row.is_public && !row.search_vector;
          const searchCreator = (normalized.creatorName as string) ?? "";
          const searchTournament = (normalized.tournamentName as string) ?? "";
          const searchPaste = (normalized.paste as string) ?? "";
          const searchSummary = (normalized.teamSummary as string) ?? "";

          if (changed && needsSearchVector) {
            await sql`
              UPDATE shares
              SET data = ${JSON.stringify(normalized)}::jsonb,
                  search_vector =
                    setweight(to_tsvector('english', ${searchCreator}), 'A') ||
                    setweight(to_tsvector('english', ${searchTournament}), 'A') ||
                    setweight(to_tsvector('english', ${searchPaste}), 'B') ||
                    setweight(to_tsvector('english', ${searchSummary}), 'C')
              WHERE id = ${row.id}
            `;
            stats.migrated++;
            stats.searchVectorBackfilled++;
          } else if (changed) {
            await sql`
              UPDATE shares SET data = ${JSON.stringify(normalized)}::jsonb WHERE id = ${row.id}
            `;
            stats.migrated++;
          } else if (needsSearchVector) {
            await sql`
              UPDATE shares
              SET search_vector =
                setweight(to_tsvector('english', ${searchCreator}), 'A') ||
                setweight(to_tsvector('english', ${searchTournament}), 'A') ||
                setweight(to_tsvector('english', ${searchPaste}), 'B') ||
                setweight(to_tsvector('english', ${searchSummary}), 'C')
              WHERE id = ${row.id}
            `;
            stats.searchVectorBackfilled++;
          }
        } catch (e) {
          console.error(`Migration error for share ${row.id}:`, e);
          stats.errors++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      stats,
      message: `Processed ${stats.total} reports. Migrated ${stats.migrated} data structures. Backfilled ${stats.searchVectorBackfilled} search vectors. ${stats.errors} errors.`,
    });
  } catch (e) {
    console.error("Migration error:", e);
    return NextResponse.json({ error: "Migration failed" }, { status: 500 });
  }
}

/**
 * Normalize a report's data to the latest format.
 * Preserves all existing user input — only fills in missing defaults.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeForMigration(data: Record<string, any>): Record<string, any> {
  // ── Matchup plans migration ──────────────────────────────────
  const rawPlans = Array.isArray(data.matchupPlans) ? data.matchupPlans : [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const matchupPlans = rawPlans.map((plan: any) => {
    // Already current format
    if (Array.isArray(plan.gamePlans) && plan.gamePlans.length > 0) {
      return {
        opponentPaste: plan.opponentPaste ?? "",
        opponentLabel: plan.opponentLabel ?? "",
        showSlide: plan.showSlide,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        gamePlans: plan.gamePlans.map((gp: any) => ({
          bring: Array.isArray(gp.bring) ? gp.bring : [null, null, null, null],
          notes: gp.notes ?? "",
          replays: Array.isArray(gp.replays) ? gp.replays : [],
          result: gp.result ?? undefined,
        })),
      };
    }

    // Legacy: planA/planB → gamePlans[0]
    let bring: [number | null, number | null, number | null, number | null] = [null, null, null, null];
    if (plan.planA) {
      bring = [
        plan.planA.lead?.[0] ?? null, plan.planA.lead?.[1] ?? null,
        plan.planA.back?.[0] ?? null, plan.planA.back?.[1] ?? null,
      ];
    } else if (Array.isArray(plan.selectedIndices)) {
      bring = [
        plan.selectedIndices[0] ?? null, plan.selectedIndices[1] ?? null,
        plan.selectedIndices[2] ?? null, plan.selectedIndices[3] ?? null,
      ];
    }

    return {
      opponentPaste: plan.opponentPaste ?? "",
      opponentLabel: plan.opponentLabel ?? "",
      showSlide: plan.showSlide,
      gamePlans: [{
        bring,
        notes: plan.notes ?? "",
        replays: [],
      }],
    };
  });

  // ── Migrate calcs: old entries may be plain strings ──────────
  const rawCalcs = data.calcs ?? {};
  const calcs: Record<string, Array<{ text: string; category: string }>> = {};
  for (const [key, entries] of Object.entries(rawCalcs)) {
    if (!Array.isArray(entries)) continue;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    calcs[key] = (entries as any[]).map((entry) => {
      if (typeof entry === "string") return { text: entry, category: "offensive" };
      if (entry && typeof entry === "object" && "text" in entry) {
        return { text: entry.text ?? "", category: entry.category ?? "offensive" };
      }
      return { text: String(entry), category: "offensive" };
    });
  }

  // ── Build normalized data (preserves all existing fields) ────
  return {
    ...data,
    // Core team data
    paste: data.paste ?? "",
    notes: data.notes ?? {},
    calcs,
    roles: data.roles ?? {},
    spreadNotes: data.spreadNotes ?? {},
    // Tournament metadata
    teamSummary: data.teamSummary ?? "",
    tournamentName: data.tournamentName ?? undefined,
    placement: data.placement ?? undefined,
    record: data.record ?? undefined,
    mvpIndex: data.mvpIndex ?? null,
    rentalCode: data.rentalCode ?? undefined,
    creatorName: data.creatorName ?? undefined,
    // Matchup plans (migrated)
    matchupPlans,
    // UI state
    spriteSettings: data.spriteSettings ?? undefined,
    hiddenSlides: Array.isArray(data.hiddenSlides) ? data.hiddenSlides : [],
    allowComments: data.allowComments ?? false,
    tags: data.tags ?? undefined,
    templateId: data.templateId ?? undefined,
    // Remove legacy fields that have been migrated
    // (planA, planB, selectedIndices are now inside gamePlans)
  };
}
