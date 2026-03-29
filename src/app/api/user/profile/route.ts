import { getDb } from "@/lib/db";
import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { escapeHtml } from "@/lib/utils/sanitize";

const ProfileBody = z.object({
  bio: z.string().max(500).optional(),
  twitter: z.string().max(100).optional(),
  discord: z.string().max(100).optional(),
  youtube: z.string().max(100).optional(),
  isPublic: z.boolean().optional(),
});

// GET: fetch current user's creator profile
export async function GET() {
  try {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const creatorName = user.firstName
      ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ""}`
      : user.username || "Unknown";

    const sql = getDb();
    const rows = await sql`SELECT bio, twitter, discord, youtube, is_public FROM creator_profiles WHERE LOWER(name) = ${creatorName.toLowerCase()}`;

    return NextResponse.json({
      creatorName,
      profile: rows.length > 0 ? {
        bio: rows[0].bio || "",
        twitter: rows[0].twitter || "",
        discord: rows[0].discord || "",
        youtube: rows[0].youtube || "",
        isPublic: rows[0].is_public !== false,
      } : { bio: "", twitter: "", discord: "", youtube: "", isPublic: true },
    });
  } catch (e) {
    console.error("Profile GET error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// PUT: update creator profile
export async function PUT(request: Request) {
  try {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const creatorName = user.firstName
      ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ""}`
      : user.username || "Unknown";

    const raw = await request.json();
    const parsed = ProfileBody.safeParse(raw);
    if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

    const { bio, twitter, discord, youtube, isPublic } = parsed.data;
    const isPublicValue = isPublic !== undefined ? isPublic : true;
    const sql = getDb();

    await sql`
      INSERT INTO creator_profiles (name, bio, twitter, discord, youtube, is_public, updated_at)
      VALUES (${creatorName}, ${bio ? escapeHtml(bio) : null}, ${twitter || null}, ${discord || null}, ${youtube || null}, ${isPublicValue}, NOW())
      ON CONFLICT (name) DO UPDATE SET
        bio = ${bio ? escapeHtml(bio) : null},
        twitter = ${twitter || null},
        discord = ${discord || null},
        youtube = ${youtube || null},
        is_public = ${isPublicValue},
        updated_at = NOW()
    `;

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Profile PUT error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
