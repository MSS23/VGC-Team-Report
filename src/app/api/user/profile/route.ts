import { getDb } from "@/lib/db";
import { captureServerEvent } from "@/lib/posthog-server";
import { apiGuard } from "@/lib/security/api-guard";
import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { escapeHtml } from "@/lib/utils/sanitize";

const VALID_THEMES = ["rose", "ocean", "emerald", "amber", "violet", "sunset"];

// Allowlist of hostnames permitted for avatarUrl. Must align with CSP img-src
// in next.config.ts and the set of OAuth providers we support via Clerk.
// Prevents javascript:/data: URL XSS, SSRF to internal hosts, and tracking
// pixels from arbitrary domains.
const AVATAR_HOSTNAME_ALLOWLIST = new Set<string>([
  "img.clerk.com",
  "images.clerk.dev",
  "cdn.discordapp.com",
  "pbs.twimg.com",
  "lh3.googleusercontent.com",
]);

// Social handle regex: alphanumerics, underscore, dot, hyphen — 1..50 chars.
// Storage convention is the @handle WITHOUT the URL prefix.
const HANDLE_REGEX = /^[A-Za-z0-9_.-]{1,50}$/;

// Known URL prefixes we'll silently strip if a user pastes a full profile URL,
// then re-validate the trailing handle. Anything else → reject.
const HANDLE_URL_PREFIXES: Record<"twitter" | "discord" | "youtube", string[]> = {
  twitter: [
    "https://twitter.com/",
    "https://www.twitter.com/",
    "https://x.com/",
    "https://www.x.com/",
  ],
  discord: [
    "https://discord.com/users/",
    "https://discordapp.com/users/",
  ],
  youtube: [
    "https://youtube.com/@",
    "https://www.youtube.com/@",
    "https://youtube.com/",
    "https://www.youtube.com/",
  ],
};

function normalizeHandle(
  value: string,
  field: "twitter" | "discord" | "youtube",
): string {
  let v = value.trim();
  if (v === "") return v;
  for (const prefix of HANDLE_URL_PREFIXES[field]) {
    if (v.toLowerCase().startsWith(prefix.toLowerCase())) {
      v = v.slice(prefix.length);
      break;
    }
  }
  // Strip a leading "@" if user typed it — we store the bare handle.
  if (v.startsWith("@")) v = v.slice(1);
  // Strip a trailing slash if the URL had one.
  if (v.endsWith("/")) v = v.slice(0, -1);
  return v;
}

function handleSchema(field: "twitter" | "discord" | "youtube") {
  return z
    .string()
    .max(200)
    .optional()
    .transform((v) => (v === undefined ? v : normalizeHandle(v, field)))
    .refine(
      (v) => v === undefined || v === "" || HANDLE_REGEX.test(v),
      { message: "Invalid handle format" },
    );
}

const ProfileBody = z.object({
  bio: z.string().max(500).optional(),
  twitter: handleSchema("twitter"),
  discord: handleSchema("discord"),
  youtube: handleSchema("youtube"),
  isPublic: z.boolean().optional(),
  accentTheme: z.string().max(20).optional().refine(
    (v) => !v || VALID_THEMES.includes(v),
    { message: "Invalid theme" }
  ),
  avatarUrl: z.string().max(500).optional().refine(
    (v) => {
      if (!v) return true;
      let url: URL;
      try {
        url = new URL(v);
      } catch {
        return false;
      }
      if (url.protocol !== "https:") return false;
      return AVATAR_HOSTNAME_ALLOWLIST.has(url.hostname);
    },
    { message: "Avatar URL must be HTTPS and from an allowed host" }
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
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid profile data" }, { status: 400 });
    }

    const { bio, twitter, discord, youtube, isPublic, accentTheme, avatarUrl } = parsed.data;
    const isPublicValue = isPublic !== undefined ? isPublic : true;
    const sql = getDb();

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
