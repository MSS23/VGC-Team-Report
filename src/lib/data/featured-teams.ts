import { getDb } from "@/lib/db";
import { extractSpecies } from "@/lib/utils/extract-species";
import { getRegMCMegasWithSprites } from "@/lib/data/mega-pokemon";
import { isDatabaseConfigured, warnDatabaseUnavailableOnce } from "@/lib/db-availability";
import type { ExploreReport } from "@/components/explore/ReportCard";

/**
 * Featured public teams for the /champions/[pokemon] Mega guide pages.
 *
 * The data is genuinely per-species — each Mega matches on its own Mega Stone
 * or its exact Mega species form — but it used to be fetched with one query
 * *per statically generated page*. With 81 sprited Reg M-C Megas that is 81
 * round-trips to a free-tier Neon database on every single build (and 81
 * identical error lines when there is no `DATABASE_URL` at all).
 *
 * So: still per-species, but fetched as ONE batched query for every Mega at
 * once, memoised in-process, with each page selecting its slice. No new
 * tables, no cache rows — the 512MB Neon free tier gets strictly fewer
 * queries, not more storage.
 *
 * The row sets are identical to the old per-page query by construction: the
 * batch runs the same `is_public / deleted_at / ILIKE stone OR species` filter
 * with the same `ORDER BY updated_at DESC LIMIT 9`, once per Mega, inside a
 * LATERAL join instead of once per HTTP round-trip.
 */

/** Teams shown per Mega guide page. Must match the old per-page `LIMIT 9`. */
const TEAMS_PER_MEGA = 9;

/**
 * How long the in-process batch is reused. Matches `export const revalidate =
 * 3600` on the Mega guide pages, so a long-lived server can never serve
 * featured teams staler than the page itself already is. A whole `next build`
 * finishes well inside this window, which is what collapses 81 queries into 1.
 */
const BATCH_TTL_MS = 3_600_000;

/**
 * After a failed batch, how long before another attempt. Short enough that a
 * transient Neon blip self-heals at runtime, long enough that a hard outage
 * during a build logs a handful of lines instead of one per page. During a
 * production build we never retry at all (see `isBuildPhase`) — a build is a
 * single shot and 81 copies of the same failure is pure noise.
 */
const FAILURE_TTL_MS = 60_000;

function isBuildPhase(): boolean {
  return process.env.NEXT_PHASE === "phase-production-build";
}

/**
 * Showdown-format Mega species form from a dataKey, e.g.
 * "charizard-mega-y" -> "Charizard-Mega-Y".
 *
 * Must stay the FULL form name: the shorter "{baseName}-Mega" pattern matched
 * every Charizard-Mega-X paste on the Mega-Charizard-Y page because ILIKE with
 * a trailing wildcard treats "Charizard-Mega" as a prefix of
 * "Charizard-Mega-X". ILIKE is case-insensitive, so the casing here only
 * affects how the pattern reads in a log.
 */
function megaSpeciesForm(dataKey: string): string {
  return dataKey
    .split("-")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join("-");
}

type ShareRow = Record<string, unknown>;

function toExploreReport(row: ShareRow, likeMap: Record<string, number>): ExploreReport {
  const data = row.data as Record<string, unknown>;
  const paste = (data.paste as string) ?? "";
  const sid = row.id as string;
  return {
    id: sid,
    species: extractSpecies(paste),
    tournamentName: (data.tournamentName as string) || undefined,
    creatorName: (data.creatorName as string) || undefined,
    placement: (data.placement as string) || undefined,
    teamSummary: (data.teamSummary as string) || undefined,
    createdAt: (row.created_at as Date).toISOString(),
    updatedAt: (row.updated_at as Date).toISOString(),
    viewCount: row.view_count as number,
    likeCount: likeMap[sid] ?? 0,
    tags: (data.tags as ExploreReport["tags"]) || undefined,
    collaborators: [],
  };
}

/** One batched `share_id -> like count` lookup for every row in the batch. */
async function fetchLikeCounts(
  sql: ReturnType<typeof getDb>,
  shareIds: string[],
): Promise<Record<string, number>> {
  const likeMap: Record<string, number> = {};
  if (shareIds.length === 0) return likeMap;
  const likeRows = await sql`
    SELECT share_id, COUNT(*)::int as count
    FROM reactions
    WHERE share_id = ANY(${shareIds})
    GROUP BY share_id
  `;
  for (const r of likeRows) {
    likeMap[r.share_id as string] = r.count as number;
  }
  return likeMap;
}

/**
 * One query for every Mega's featured teams.
 *
 * `unnest(keys, stonePatterns, speciesPatterns)` turns the Mega list into rows,
 * and the LATERAL subquery runs the original per-Mega query against each one —
 * so each Mega still gets its own top-9 by `updated_at DESC`, capped at
 * 81 x 9 rows total rather than an unbounded table scan.
 */
async function fetchBatch(): Promise<Map<string, ExploreReport[]>> {
  const megas = getRegMCMegasWithSprites();
  const keys = megas.map((m) => m.dataKey);
  const stonePatterns = megas.map((m) => `%${m.megaStone}%`);
  const speciesPatterns = megas.map((m) => `%${megaSpeciesForm(m.dataKey)}%`);

  const sql = getDb();
  const rows = await sql`
    SELECT m.mega_key, t.id, t.data, t.created_at, t.updated_at, t.view_count
    FROM unnest(
      ${keys}::text[],
      ${stonePatterns}::text[],
      ${speciesPatterns}::text[]
    ) AS m(mega_key, stone_pattern, species_pattern)
    CROSS JOIN LATERAL (
      SELECT s.id, s.data, s.created_at, s.updated_at, COALESCE(s.view_count, 0) as view_count
      FROM shares s
      WHERE s.is_public = TRUE
        AND s.deleted_at IS NULL
        AND (
          s.data->>'paste' ILIKE m.stone_pattern
          OR s.data->>'paste' ILIKE m.species_pattern
        )
      ORDER BY s.updated_at DESC
      LIMIT ${TEAMS_PER_MEGA}
    ) t
  `;

  const likeMap = await fetchLikeCounts(
    sql,
    Array.from(new Set(rows.map((r) => r.id as string))),
  );

  const byMega = new Map<string, ExploreReport[]>();
  for (const key of keys) byMega.set(key, []);
  for (const row of rows) {
    const key = row.mega_key as string;
    const bucket = byMega.get(key);
    if (bucket) bucket.push(toExploreReport(row, likeMap));
  }
  // The LATERAL subquery already ordered each group, but sort defensively so
  // the rendered order never depends on the planner's row-return order.
  for (const bucket of byMega.values()) {
    bucket.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }
  return byMega;
}

let batch: Promise<Map<string, ExploreReport[]>> | null = null;
let batchExpiresAt = 0;

/**
 * The shared batch promise. Every caller awaits the SAME promise, which is
 * what makes 81 concurrent or sequential page renders cost one query.
 *
 * React's `cache()` is the idiomatic App Router dedupe, but it is scoped to a
 * single render pass — during `generateStaticParams` each page is its own
 * render, so `cache()` would still have produced 81 queries. Hence a
 * module-level promise memo with an explicit TTL.
 */
function getBatch(): Promise<Map<string, ExploreReport[]>> {
  const now = Date.now();
  if (batch && now < batchExpiresAt) return batch;
  batchExpiresAt = now + BATCH_TTL_MS;
  batch = fetchBatch().catch((e) => {
    // Logged once for the whole batch rather than once per page.
    console.error("Failed to fetch featured teams for Mega guide pages:", e);
    if (!isBuildPhase()) batchExpiresAt = Date.now() + FAILURE_TTL_MS;
    return new Map<string, ExploreReport[]>();
  });
  return batch;
}

/**
 * Featured teams for a single Mega.
 *
 * Returns the same rows the old per-page query returned, including `[]` on any
 * failure — these pages must keep rendering without a database.
 */
export async function getFeaturedTeamsForMega(
  dataKey: string,
  megaStone: string,
): Promise<ExploreReport[]> {
  if (!isDatabaseConfigured()) {
    warnDatabaseUnavailableOnce("Mega guide featured teams");
    return [];
  }

  const byMega = await getBatch();
  const hit = byMega.get(dataKey);
  if (hit) return hit;

  // Not in the batch: a Mega resolved on demand via dynamicParams (legal but
  // sprite-less, so it is not in generateStaticParams). One extra query for a
  // rare on-demand render is fine; silently returning [] would be a product
  // change.
  return fetchOneMega(dataKey, megaStone);
}

async function fetchOneMega(dataKey: string, megaStone: string): Promise<ExploreReport[]> {
  try {
    const sql = getDb();
    const rows = await sql`
      SELECT s.id, s.data, s.created_at, s.updated_at, COALESCE(s.view_count, 0) as view_count
      FROM shares s
      WHERE s.is_public = TRUE
        AND s.deleted_at IS NULL
        AND (
          s.data->>'paste' ILIKE ${`%${megaStone}%`}
          OR s.data->>'paste' ILIKE ${`%${megaSpeciesForm(dataKey)}%`}
        )
      ORDER BY s.updated_at DESC
      LIMIT ${TEAMS_PER_MEGA}
    `;
    const likeMap = await fetchLikeCounts(sql, rows.map((r) => r.id as string));
    return rows.map((row) => toExploreReport(row, likeMap));
  } catch (e) {
    console.error("Failed to fetch teams for", dataKey, e);
    return [];
  }
}

/** Test-only: drop the memoised batch. */
export function __resetFeaturedTeamsBatch(): void {
  batch = null;
  batchExpiresAt = 0;
}
