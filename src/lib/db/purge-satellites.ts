import type { NeonQueryFunction, NeonQueryPromise } from "@neondatabase/serverless";

/**
 * Shared satellite-purge SQL for the two paths that hard-delete `shares`:
 *   - `src/app/api/cleanup/route.ts`     — a SHARE dies (trash TTL / stale sweep)
 *   - `src/app/api/user/delete/route.ts` — an ACCOUNT dies (GDPR erasure)
 *
 * None of the satellite tables declare a real FK to `shares` (see
 * `src/lib/db.ts`), so `DELETE FROM shares` never errors on leftovers — it just
 * silently orphans them. That is how the account-deletion path drifted away
 * from the cleanup path (VGC-288) and how `share_versions` grew to 447MB on a
 * 512MB Neon free tier in July 2026. Both paths now build their statements from
 * this one module so they cannot drift again.
 *
 * Every statement here is parameter-scoped to a caller-supplied `shareIds` or
 * `userId`. There is deliberately no unscoped `DELETE` in this file. The
 * builders return un-awaited `NeonQueryPromise`s so callers can hand them
 * straight to `sql.transaction([...])` — all-or-nothing, never a partial purge.
 */

type SqlClient = NeonQueryFunction<false, false>;
export type PurgeStatements = NeonQueryPromise<false, false>[];

/**
 * Rows keyed off a set of share ids. Shared verbatim by both paths.
 *
 * Order matters: `comment_flags` points at `comments.id`, so the flags must go
 * before the comments they reference (the account path also deletes `comments`,
 * so running this block first is what keeps the flags reachable).
 */
function shareScopedStatements(sql: SqlClient, shareIds: string[]): PurgeStatements {
  return [
    sql`DELETE FROM comment_flags
        WHERE comment_id IN (SELECT id FROM comments WHERE share_id = ANY(${shareIds}::text[]))`,
    sql`DELETE FROM reactions WHERE share_id = ANY(${shareIds}::text[])`,
    sql`DELETE FROM comments WHERE share_id = ANY(${shareIds}::text[])`,
    sql`DELETE FROM saved_reports WHERE share_id = ANY(${shareIds}::text[])`,
    sql`DELETE FROM share_versions WHERE share_id = ANY(${shareIds}::text[])`,
    sql`DELETE FROM edit_changelog WHERE share_id = ANY(${shareIds}::text[])`,
    sql`DELETE FROM collection_items WHERE share_id = ANY(${shareIds}::text[])`,
    sql`DELETE FROM collaborators WHERE share_id = ANY(${shareIds}::text[])`,
    sql`DELETE FROM notifications WHERE source_share_id = ANY(${shareIds}::text[])`,
  ];
}

/**
 * Satellite purge for the SHARE-death path (cleanup cron / manual sweep).
 *
 * `match_logs` is NULLed rather than deleted here: the report died, but the
 * match history belongs to a still-existing user, so we keep their rows and
 * only drop the dangling reference. Contrast `buildAccountSatellitePurge`.
 *
 * Returns `[]` for an empty id list so callers never emit `ANY('{}')`.
 */
export function buildShareSatellitePurge(sql: SqlClient, shareIds: string[]): PurgeStatements {
  if (shareIds.length === 0) return [];
  return [
    ...shareScopedStatements(sql, shareIds),
    sql`UPDATE match_logs SET share_id = NULL WHERE share_id = ANY(${shareIds}::text[])`,
  ];
}

/**
 * Satellite purge for the ACCOUNT-death path (GDPR erasure).
 *
 * JUDGEMENT CALL — `match_logs` diverges from the cleanup path on purpose.
 * The cleanup path NULLs `match_logs.share_id` because only the *share* died.
 * On account deletion the *owner* is gone, and `match_logs` carries
 * `user_id TEXT NOT NULL` plus free-text `notes` and `tournament_name`
 * (`src/lib/db.ts`) — user-authored personal data. NULLing `share_id` would
 * leave that text, still keyed to the deleted user's id, in the database
 * forever. So here the rows are DELETEd by `user_id`. This is scoped to the
 * requesting user only; it never touches another user's match history, and it
 * covers logs with `share_id IS NULL` (logged without a report) too, which an
 * id-scoped delete would miss.
 *
 * `shareIds` may be empty (a user with no reports); the user-scoped statements
 * still run.
 */
export function buildAccountSatellitePurge(
  sql: SqlClient,
  userId: string,
  shareIds: string[]
): PurgeStatements {
  const statements: PurgeStatements =
    shareIds.length > 0 ? shareScopedStatements(sql, shareIds) : [];
  statements.push(sql`DELETE FROM match_logs WHERE user_id = ${userId}`);
  return statements;
}
