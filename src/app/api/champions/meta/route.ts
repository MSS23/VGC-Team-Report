import { getDb } from "@/lib/db";
import { apiGuard } from "@/lib/security/api-guard";
import { cacheGet, cacheSet } from "@/lib/cache";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const CACHE_KEY = "champions:meta:snapshot";
const CACHE_TTL = 300; // 5 minutes
const MIN_REPORTS = 5;
const TOP_N = 20;

export interface MetaEntry {
  name: string;
  count: number;
  percentage: number;
}

export interface ChampionsMetaResult {
  entries: MetaEntry[];
  totalReports: number;
  hasEnoughData: boolean;
}

export async function GET(request: Request) {
  try {
    const guard = await apiGuard(request, { rateLimit: { key: "champions-meta", max: 60 } });
    if (guard) return guard;

    // Check cache first
    const cached = await cacheGet<ChampionsMetaResult>(CACHE_KEY);
    if (cached) {
      const res = NextResponse.json(cached);
      res.headers.set("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
      return res;
    }

    const sql = getDb();

    // Single SQL query: extract species from paste text using CTEs, aggregate in-DB.
    // Returns at most TOP_N rows instead of transferring up to 500 paste blobs (~5MB).
    // Uses WITH ORDINALITY for stable block ordering and replicates extractSpecies() logic:
    //   - CRLF normalisation
    //   - blank-line block split
    //   - "@ Item" suffix strip
    //   - "(M)"/"(F)" gender suffix strip
    //   - "Nickname (Species)" pattern detection
    //   - 6-block cap per team, de-dup species within a team
    const rows = await sql`
      WITH filtered AS (
        SELECT id, data->>'paste' AS paste
        FROM shares
        WHERE is_public = TRUE
          AND deleted_at IS NULL
          AND (
            data->>'regulation' ILIKE '%champion%'
            OR data->>'regulation' ILIKE '%reg-m%'
            OR data->'tags'->>'regulation' ILIKE '%champion%'
            OR data->'tags'->>'regulation' ILIKE '%reg-m%'
          )
        ORDER BY created_at DESC
        LIMIT 500
      ),
      blocks AS (
        SELECT
          f.id,
          t.block_num,
          trim(split_part(trim(t.block), E'\n', 1)) AS first_line
        FROM filtered f,
        LATERAL regexp_split_to_table(
          regexp_replace(f.paste, E'\r\n', E'\n', 'g'),
          E'\n[ \t]*\n'
        ) WITH ORDINALITY AS t(block, block_num)
        WHERE trim(t.block) <> ''
      ),
      name_parts AS (
        SELECT
          id,
          row_number() OVER (PARTITION BY id ORDER BY block_num) AS block_num,
          trim(split_part(first_line, ' @ ', 1)) AS name_part
        FROM blocks
        WHERE first_line <> '' AND first_line !~ '^==='
      ),
      gender_stripped AS (
        SELECT
          id,
          block_num,
          trim(regexp_replace(name_part, E'\\s+\\([MF]\\)\\s*$', '')) AS stripped
        FROM name_parts
      ),
      species_extracted AS (
        SELECT
          id,
          block_num,
          CASE
            WHEN stripped ~ E'^.+\\s+\\([^)]+\\)$'
              THEN trim(regexp_replace(stripped, E'^.*\\(([^)]+)\\)$', E'\\1'))
            ELSE stripped
          END AS species
        FROM gender_stripped
      ),
      per_team AS (
        SELECT DISTINCT id, species
        FROM species_extracted
        WHERE block_num <= 6 AND species <> ''
      ),
      total AS (
        SELECT count(DISTINCT id) AS total_reports FROM filtered
      ),
      counts AS (
        SELECT species, count(*) AS usage_count
        FROM per_team
        GROUP BY species
      )
      SELECT
        c.species AS name,
        c.usage_count AS count,
        (SELECT total_reports FROM total) AS total_reports
      FROM counts c
      ORDER BY c.usage_count DESC
      LIMIT ${TOP_N}
    `;

    if (rows.length === 0) {
      const empty: ChampionsMetaResult = { entries: [], totalReports: 0, hasEnoughData: false };
      await cacheSet(CACHE_KEY, empty, CACHE_TTL);
      const res = NextResponse.json(empty);
      res.headers.set("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
      return res;
    }

    const totalReports = Number((rows[0] as { total_reports: string }).total_reports ?? 0);
    const hasEnoughData = totalReports >= MIN_REPORTS;

    const entries: MetaEntry[] = hasEnoughData
      ? (rows as Array<{ name: string; count: string; total_reports: string }>).map(r => ({
          name: r.name,
          count: Number(r.count),
          percentage: totalReports > 0 ? Math.round((Number(r.count) / totalReports) * 100) : 0,
        }))
      : [];

    const result: ChampionsMetaResult = { entries, totalReports, hasEnoughData };

    await cacheSet(CACHE_KEY, result, CACHE_TTL);

    const res = NextResponse.json(result);
    res.headers.set("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
    return res;
  } catch (e) {
    console.error("Champions meta API error:", e);
    return NextResponse.json({ error: "Failed to load Champions meta data" }, { status: 500 });
  }
}
