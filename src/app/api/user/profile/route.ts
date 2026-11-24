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
    // VGC-253: `name` is stored at the user's own casing but matched case
    // insensitively, so rows differing only in case can both match. Prefer
    // this caller's own row, then an unclaimed legacy row, and never surface a
    // row owned by another account into their editor.
    const rows = await sql`
      SELECT bio, twitter, discord, youtube, is_public, accent_theme, avatar_url
      FROM creator_profiles
      WHERE LOWER(name) = ${creatorName.toLowerCase()}
      ORDER BY CASE WHEN user_id = ${user.id} THEN 0 WHEN user_id IS NULL THEN 1 ELSE 2 END, name
      LIMIT 1
    `;

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

    // VGC-253: `creatorName` comes from the Clerk display name, which the user
    // can edit freely, so the row must be bound to the account that owns it.
    // The conflict update only fires for a row this caller already owns, or an
    // unclaimed legacy row (user_id IS NULL) which the write then claims. A
    // row owned by someone else fails the WHERE, so DO UPDATE touches nothing
    // and RETURNING yields zero rows — which we surface as a 409 instead of
    // reporting a success that never happened.
    const saved = await sql`
      INSERT INTO creator_profiles (name, user_id, bio, twitter, discord, youtube, is_public, accent_theme, avatar_url, updated_at)
      VALUES (${creatorName}, ${user.id}, ${bio ? escapeHtml(bio) : null}, ${twitter || null}, ${discord || null}, ${youtube || null}, ${isPublicValue}, ${accentTheme || null}, ${avatarUrl || null}, NOW())
      ON CONFLICT (name) DO UPDATE SET
        user_id = ${user.id},
        bio = ${bio ? escapeHtml(bio) : null},
        twitter = ${twitter || null},
        discord = ${discord || null},
        youtube = ${youtube || null},
        is_public = ${isPublicValue},
        accent_theme = ${accentTheme || null},
        avatar_url = ${avatarUrl || null},
        updated_at = NOW()
      WHERE creator_profiles.user_id IS NULL OR creator_profiles.user_id = ${user.id}
      RETURNING name
    `;

    if (saved.length === 0) {
      return NextResponse.json(
        { error: "That creator name already belongs to another account. Change your display name to claim a creator page." },
        { status: 409 },
      );
    }

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
