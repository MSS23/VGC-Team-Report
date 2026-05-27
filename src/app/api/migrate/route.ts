import { timingSafeEqual } from "crypto";
import { getDb } from "@/lib/db";
import { normalizeReportData } from "@/lib/utils/normalize-report";
import { NextResponse } from "next/server";

function safeCompare(a: string, b: string): boolean {
  const aBuf = Buffer.from(a, "utf8");
  const bBuf = Buffer.from(b, "utf8");
  if (aBuf.length !== bBuf.length) return false;
  return timingSafeEqual(aBuf, bBuf);
}

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
    const expected = process.env.MIGRATE_SECRET;
    if (!secret || !expected || !safeCompare(secret, expected)) {
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
          const normalized = normalizeReportData(data);
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

