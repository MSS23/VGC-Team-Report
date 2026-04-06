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

    // Step 1: Delete collection_items (via user's collection IDs — FK-safe before collections)
    await sql`
      DELETE FROM collection_items
      WHERE collection_id IN (SELECT id FROM collections WHERE user_id = ${userId})
    `;

    // Step 2: Delete collections
    await sql`DELETE FROM collections WHERE user_id = ${userId}`;

    // Step 3: Delete collaborators
    await sql`DELETE FROM collaborators WHERE user_id = ${userId}`;

    // Step 4: Delete edit_changelog
    await sql`DELETE FROM edit_changelog WHERE editor_id = ${userId}`;

    // Step 5: Delete share_versions
    await sql`DELETE FROM share_versions WHERE editor_id = ${userId}`;

    // Steps 6 & 7: Delete comments and reactions on user's shares
    // Guard against empty array to avoid SQL error with ANY('{}'::text[])
    if (shareIds.length > 0) {
      await sql`DELETE FROM comments WHERE share_id = ANY(${shareIds}::text[])`;
      await sql`DELETE FROM reactions WHERE share_id = ANY(${shareIds}::text[])`;
    }

    // Step 8: Delete saved_reports
    await sql`DELETE FROM saved_reports WHERE user_id = ${userId}`;

    // Step 9: Delete follows
    await sql`DELETE FROM follows WHERE user_id = ${userId}`;

    // Step 10: Delete notifications
    await sql`DELETE FROM notifications WHERE user_id = ${userId}`;

    // Step 11: ANONYMIZE feedback (preserve rows, wipe PII only)
    await sql`
      UPDATE feedback SET submitter_id = NULL, submitter_name = NULL
      WHERE submitter_id = ${userId}
    `;

    // Step 12: Delete ALL shares (including soft-deleted with deleted_at IS NOT NULL)
    await sql`DELETE FROM shares WHERE owner_id = ${userId}`;

    // Step 13: Delete creator_profiles (by creator name from shares)
    if (creatorName) {
      await sql`DELETE FROM creator_profiles WHERE LOWER(name) = LOWER(${creatorName})`;
    }

    // Step 14: Delete user from Clerk (AFTER all DB steps succeed)
    const client = await clerkClient();
    await client.users.deleteUser(userId);

    // Step 15: Flush Redis cache (FINAL step)
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
