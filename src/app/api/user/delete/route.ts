import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
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
    const creatorName = (userShares[0]?.creator_name as string) ?? null;

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
    const statements = [
      // collection_items (via user's collection IDs — FK-safe before collections)
      sql`DELETE FROM collection_items
          WHERE collection_id IN (SELECT id FROM collections WHERE user_id = ${userId})`,
      sql`DELETE FROM collections WHERE user_id = ${userId}`,
      sql`DELETE FROM collaborators WHERE user_id = ${userId}`,
      sql`DELETE FROM edit_changelog WHERE editor_id = ${userId}`,
      sql`DELETE FROM share_versions WHERE editor_id = ${userId}`,
    ];

    // comments & reactions on user's shares — guard against empty array to avoid
    // SQL error with ANY('{}'::text[])
    if (shareIds.length > 0) {
      statements.push(sql`DELETE FROM comments WHERE share_id = ANY(${shareIds}::text[])`);
      statements.push(sql`DELETE FROM reactions WHERE share_id = ANY(${shareIds}::text[])`);
    }

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
    // creator_profiles (by creator name from shares)
    if (creatorName) {
      statements.push(sql`DELETE FROM creator_profiles WHERE LOWER(name) = LOWER(${creatorName})`);
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
