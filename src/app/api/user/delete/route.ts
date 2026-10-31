import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { buildAccountSatellitePurge } from "@/lib/db/purge-satellites";
import { apiGuard } from "@/lib/security/api-guard";
import { cacheInvalidatePrefix } from "@/lib/cache";

export async function DELETE(request: Request) {
  const guard = await apiGuard(request, { rateLimit: { key: "account-delete", max: 2 } });
  if (guard) return guard;

  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const sql = getDb();

    // Step 0: Get share IDs and creator name BEFORE deleting anything
    const userShares = await sql`
      SELECT id, data->>'creatorName' as creator_name
      FROM shares WHERE owner_id = ${userId}
    `;
    const shareIds = userShares.map((r) => r.id as string);

    // Every distinct creator name this user published under — not just the
    // first row. The old code read userShares[0] only, which both missed the
    // other names (leaving their profiles behind) and picked an arbitrary row,
    // since the SELECT has no ORDER BY.
    // Deduped case-insensitively (the DELETE below matches on LOWER(name)),
    // keeping the first spelling seen so the queued statements are stable.
    const creatorNames: string[] = [];
    const seenNames = new Set<string>();
    for (const row of userShares) {
      const name = (row.creator_name as string | null)?.trim();
      if (!name) continue;
      const key = name.toLowerCase();
      if (seenNames.has(key)) continue;
      seenNames.add(key);
      creatorNames.push(name);
    }

    // Ordering decision: delete the Clerk account FIRST, then purge the DB in a
    // single atomic transaction.
    //
    // The old order (DB purge, then Clerk) had two failure modes:
    //   - a DB delete failing mid-sequence left PARTIAL data (no transaction), and
    //   - a Clerk failure after the DB purge orphaned the user: "data gone,
    //     account remains" — the worst outcome, a working account with no content
    //     and no signal to retry.
    //
    // By deleting Clerk first and wrapping every DB write in one transaction:
    //   - if Clerk deletion fails, we abort and NOTHING is touched (fully
    //     recoverable — the user can retry); and
    //   - if the DB transaction fails after Clerk succeeds, we get at worst
    //     "account gone, data intact" (all-or-nothing thanks to the transaction) —
    //     recoverable orphan rows, never the "data gone, account remains" case.
    // The account is the identity, so its removal is the point of no return.

    // Step 1: Delete the user from Clerk. If this fails, the catch below returns
    // 500 and no DB rows have been touched yet.
    const client = await clerkClient();
    await client.users.deleteUser(userId);

    // Step 2: Purge all DB rows in ONE atomic transaction (Neon HTTP driver's
    // sql.transaction([...]) runs the whole batch or none of it). Statements are
    // built as un-awaited query promises and ordered FK-safe.
    //
    // The share-keyed satellite rows (comment_flags → comments → reactions →
    // saved_reports → share_versions → edit_changelog → collection_items →
    // collaborators → notifications) plus match_logs come from the SHARED
    // builder in @/lib/db/purge-satellites — the same module the cleanup cron
    // uses — so these two hard-delete paths can no longer drift apart (VGC-288,
    // which is how comment_flags/match_logs and every share_id-keyed purge came
    // to be missing here). It is first in the array because it purges
    // comment_flags before the comments they reference, and it internally
    // guards the empty-shareIds case so no ANY('{}') is ever emitted.
    //
    // NOTE on match_logs: the builder DELETEs those rows by user_id on this
    // path (not NULL-ing share_id as the cleanup path does) because the rows
    // carry the departing user's free-text notes/tournament_name. See the
    // builder's comment for the full reasoning.
    const statements = [
      ...buildAccountSatellitePurge(sql, userId, shareIds),
      // collection_items (via user's collection IDs — FK-safe before collections)
      sql`DELETE FROM collection_items
          WHERE collection_id IN (SELECT id FROM collections WHERE user_id = ${userId})`,
      sql`DELETE FROM collections WHERE user_id = ${userId}`,
      sql`DELETE FROM collaborators WHERE user_id = ${userId}`,
      sql`DELETE FROM edit_changelog WHERE editor_id = ${userId}`,
      sql`DELETE FROM share_versions WHERE editor_id = ${userId}`,
    ];

    statements.push(sql`DELETE FROM saved_reports WHERE user_id = ${userId}`);
    statements.push(sql`DELETE FROM follows WHERE user_id = ${userId}`);
    statements.push(sql`DELETE FROM notifications WHERE user_id = ${userId}`);
    // ANONYMIZE feedback (preserve rows, wipe PII only)
    statements.push(sql`
      UPDATE feedback SET submitter_id = NULL, submitter_name = NULL
      WHERE submitter_id = ${userId}
    `);
    // Delete ALL shares (including soft-deleted with deleted_at IS NOT NULL)
    statements.push(sql`DELETE FROM shares WHERE owner_id = ${userId}`);
    // creator_profiles (by creator name from shares).
    //
    // `creatorName` is unbound free text on the share payload
    // (api/share/route.ts) — anyone can publish a share claiming ANY creator
    // name — and creator_profiles is keyed on that name alone, with no owner
    // column (see VGC-253). Deleting purely by name therefore let one account
    // destroy another creator's profile: publish a share carrying the victim's
    // creator name, then delete your own account, and their bio, socials and
    // avatar went with it. Two requests, irreversible, cross-tenant.
    //
    // Guard: only drop the profile if NO share under that name survives this
    // transaction. The user's own shares are deleted by the statement above, so
    // anything still matching belongs to someone else — which means the name is
    // not exclusively this user's and the profile is not theirs to delete. The
    // owner_id clause keeps that true even if the statement order changes.
    //
    // ponytail: a victim who holds a creator_profiles row but currently has no
    // shares under that name is still exposed. Closing that needs the owner
    // column from VGC-253; this guard covers every case reachable today.
    for (const name of creatorNames) {
      statements.push(sql`
        DELETE FROM creator_profiles
        WHERE LOWER(name) = LOWER(${name})
          AND NOT EXISTS (
            SELECT 1 FROM shares
            WHERE LOWER(data->>'creatorName') = LOWER(${name})
              AND owner_id IS DISTINCT FROM ${userId}
          )
      `);
    }

    await sql.transaction(statements);

    // Step 3: Flush Redis cache (FINAL step)
    for (const id of shareIds) {
      await cacheInvalidatePrefix(`share:${id}`);
    }
    await cacheInvalidatePrefix("explore:");

    return NextResponse.json({ deleted: true });
  } catch (e) {
    console.error("Account deletion error:", e);
    return NextResponse.json({ error: "Deletion failed" }, { status: 500 });
  }
}
