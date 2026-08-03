import { getDb } from "@/lib/db";
import { captureServerEvent } from "@/lib/posthog-server";
import { apiGuard } from "@/lib/security/api-guard";
import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { escapeHtml } from "@/lib/utils/sanitize";

const VALID_THEMES = ["rose", "ocean", "emerald", "amber", "violet", "sunset"];

const ProfileBody = z.object({
  bio: z.string().max(500).optional(),
  twitter: z.string().max(100).optional(),
  discord: z.string().max(100).optional(),
  youtube: z.string().max(100).optional(),
  isPublic: z.boolean().optional(),
  accentTheme: z.string().max(20).optional().refine(
    (v) => !v || VALID_THEMES.includes(v),
    { message: "Invalid theme" }
  ),
  avatarUrl: z.string().max(500).optional().refine(
    (v) => !v || v.startsWith("https://"),
    { message: "Avatar URL must be HTTPS" }
  ),
});

/**
 * `creator_profiles` is keyed on the display name, not on the Clerk user id, so
 * `INSERT … ON CONFLICT (name) DO UPDATE` lets anyone who sets their Clerk name
 * to a known creator's name overwrite that creator's public bio, links and
 * avatar. The correct fix is to key the row on `user_id`, which needs a schema
 * change (new column + unique index + a backfill) — deliberately NOT done here.
 *
 * Until that lands, this is the strongest ownership signal available in
 * application code: `shares.owner_id` records which Clerk account published
 * each report, and `data->>'creatorName'` records the name it was published
 * under. If a *different* account has already published under this name, the
 * name is considered claimed and the upsert is refused. First claim wins; a
 * user editing their own profile is unaffected because their own reports carry
 * their own owner_id (and a user with no reports at all hits no owner rows).
 *
 * Verified names get the stricter rule: they may only be written by an account
 * that has actually published under that name, never claimed by an unrelated
 * new account.
 */
async function findNameConflict(
  creatorName: string,
  userId: string,
): Promise<string | null> {
  const sql = getDb();
  const nameLower = creatorName.toLowerCase();

  const [ownerRows, verifiedRows] = await Promise.all([
    sql`
      SELECT DISTINCT owner_id
      FROM shares
      WHERE owner_id IS NOT NULL
        AND deleted_at IS NULL
        AND LOWER(data->>'creatorName') = ${nameLower}
      LIMIT 20
    `,
    sql`SELECT name FROM verified_creators WHERE LOWER(name) = ${nameLower} LIMIT 1`,
  ]);

  const owners = ownerRows.map((r) => r.owner_id as string);
  const isOwnName = owners.includes(userId);

  if (owners.length > 0 && !isOwnName) {
    return "This creator name is already in use by another account.";
  }
  if (verifiedRows.length > 0 && !isOwnName) {
    return "This creator name belongs to a verified creator.";
  }
  return null;
}

// GET: fetch current user's creator profile
export async function GET(request: Request) {
  const guard = await apiGuard(request, { rateLimit: { key: "profile-read", max: 30 } });
  if (guard) return guard;

  try {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const creatorName = user.firstName
      ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ""}`
      : user.username || "Unknown";

    const sql = getDb();
    const rows = await sql`SELECT bio, twitter, discord, youtube, is_public, accent_theme, avatar_url FROM creator_profiles WHERE LOWER(name) = ${creatorName.toLowerCase()}`;

    return NextResponse.json({
      creatorName,
      clerkImageUrl: user.imageUrl || null,
      profile: rows.length > 0 ? {
        bio: rows[0].bio || "",
        twitter: rows[0].twitter || "",
        discord: rows[0].discord || "",
        youtube: rows[0].youtube || "",
        isPublic: rows[0].is_public !== false,
        accentTheme: rows[0].accent_theme || null,
        avatarUrl: rows[0].avatar_url || "",
      } : { bio: "", twitter: "", discord: "", youtube: "", isPublic: true, accentTheme: null, avatarUrl: "" },
    });
  } catch (e) {
    console.error("Profile GET error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// PUT: update creator profile
export async function PUT(request: Request) {
  const guard = await apiGuard(request, { rateLimit: { key: "profile-write", max: 10 } });
  if (guard) return guard;

  try {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const creatorName = user.firstName
      ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ""}`
      : user.username || "Unknown";

    const raw = await request.json();
    const parsed = ProfileBody.safeParse(raw);
    if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

    const { bio, twitter, discord, youtube, isPublic, accentTheme, avatarUrl } = parsed.data;
    const isPublicValue = isPublic !== undefined ? isPublic : true;
    const sql = getDb();

    // Refuse to write a profile row that belongs to somebody else (see
    // findNameConflict — a real fix needs the row keyed on the Clerk user id).
    const conflict = await findNameConflict(creatorName, user.id);
    if (conflict) {
      return NextResponse.json({ error: conflict }, { status: 409 });
    }

    await sql`
      INSERT INTO creator_profiles (name, bio, twitter, discord, youtube, is_public, accent_theme, avatar_url, updated_at)
      VALUES (${creatorName}, ${bio ? escapeHtml(bio) : null}, ${twitter || null}, ${discord || null}, ${youtube || null}, ${isPublicValue}, ${accentTheme || null}, ${avatarUrl || null}, NOW())
      ON CONFLICT (name) DO UPDATE SET
        bio = ${bio ? escapeHtml(bio) : null},
        twitter = ${twitter || null},
        discord = ${discord || null},
        youtube = ${youtube || null},
        is_public = ${isPublicValue},
        accent_theme = ${accentTheme || null},
        avatar_url = ${avatarUrl || null},
        updated_at = NOW()
    `;

    captureServerEvent(user.id, "profile_updated", {
      has_bio: !!bio,
      has_twitter: !!twitter,
      has_discord: !!discord,
      has_youtube: !!youtube,
      has_avatar: !!avatarUrl,
      is_public: isPublicValue,
      accent_theme: accentTheme || null,
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Profile PUT error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
