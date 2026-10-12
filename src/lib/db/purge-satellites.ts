import type { NeonQueryFunction } from "@neondatabase/serverless";

type Sql = NeonQueryFunction<false, false>;

/** A built-but-not-yet-executed neon query (NeonQueryPromise is lazy: it only runs on await/then). */
export type SatellitePurgeStatement = ReturnType<Sql>;

/**
 * Every satellite row tied to a set of share ids that are about to be
 * hard-deleted, as un-awaited query promises in FK-safe order.
 *
 * This is the single source of truth for that sequence. It used to live inline
 * in /api/cleanup, which meant the parallel hard-delete path in
 * /api/user/delete silently missed comment_flags, share_versions,
 * edit_changelog, collection_items and notifications when the cleanup route
 * was widened (VGC-288 — GDPR exposure plus dead rows on a 512MB Neon tier).
 * Both routes now call in here so the two paths cannot drift again.
 *
 * Callers decide the execution semantics: /api/cleanup awaits them in sequence
 * (see purgeSatellites), /api/user/delete folds them into its single
 * sql.transaction([...]) batch. Callers must also guard against an empty `ids`
 * array — ANY('{}') is a SQL error.
 */
export function satellitePurgeStatements(sql: Sql, ids: string[]): SatellitePurgeStatement[] {
  return [
    // comment_flags reference comments by id — purge them before the
    // comments they point at are gone.
    sql`
        DELETE FROM comment_flags
        WHERE comment_id IN (SELECT id FROM comments WHERE share_id = ANY(${ids}))
      `,
    sql`DELETE FROM reactions WHERE share_id = ANY(${ids})`,
    sql`DELETE FROM comments WHERE share_id = ANY(${ids})`,
    sql`DELETE FROM saved_reports WHERE share_id = ANY(${ids})`,
    sql`DELETE FROM share_versions WHERE share_id = ANY(${ids})`,
    sql`DELETE FROM edit_changelog WHERE share_id = ANY(${ids})`,
    sql`DELETE FROM collection_items WHERE share_id = ANY(${ids})`,
    sql`DELETE FROM collaborators WHERE share_id = ANY(${ids})`,
    sql`DELETE FROM notifications WHERE source_share_id = ANY(${ids})`,
    // match_logs are the USER'S match history — keep the rows, drop the
    // reference to the now-deleted report.
    sql`UPDATE match_logs SET share_id = NULL WHERE share_id = ANY(${ids})`,
  ];
}

/**
 * Delete every satellite row tied to `ids`, one statement at a time in FK-safe
 * order (no transaction — this is the long-standing /api/cleanup behaviour).
 */
export async function purgeSatellites(sql: Sql, ids: string[]): Promise<void> {
  for (const statement of satellitePurgeStatements(sql, ids)) {
    await statement;
  }
}
