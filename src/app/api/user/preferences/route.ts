import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { apiGuard } from "@/lib/security/api-guard";

export const dynamic = "force-dynamic";

const PreferencesSchema = z.object({
  digestUnsubscribed: z.boolean().optional(),
});

/**
 * POST /api/user/preferences
 *
 * Updates the authenticated user's email preferences in Clerk publicMetadata.
 * Currently supports: digestUnsubscribed (controls weekly digest opt-out).
 */
export async function POST(request: Request) {
  const guard = await apiGuard(request, { rateLimit: { key: "user-preferences", max: 20 } });
  if (guard) return guard;

  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = PreferencesSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const updates = parsed.data;
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ ok: true });
  }

  try {
    const clerk = await clerkClient();
    const user = await clerk.users.getUser(userId);
    const currentMeta = (user.publicMetadata ?? {}) as Record<string, unknown>;

    await clerk.users.updateUserMetadata(userId, {
      publicMetadata: {
        ...currentMeta,
        ...updates,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[user/preferences] Failed to update Clerk metadata:", e);
    return NextResponse.json({ error: "Failed to update preferences" }, { status: 500 });
  }
}

/**
 * GET /api/user/preferences
 *
 * Returns the current email preferences for the authenticated user.
 */
export async function GET(request: Request) {
  const guard = await apiGuard(request, { rateLimit: { key: "user-preferences-read", max: 60 } });
  if (guard) return guard;

  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const clerk = await clerkClient();
    const user = await clerk.users.getUser(userId);
    const meta = (user.publicMetadata ?? {}) as Record<string, unknown>;

    return NextResponse.json({
      digestUnsubscribed: meta.digestUnsubscribed === true,
    });
  } catch (e) {
    console.error("[user/preferences] Failed to read Clerk metadata:", e);
    return NextResponse.json({ error: "Failed to read preferences" }, { status: 500 });
  }
}
