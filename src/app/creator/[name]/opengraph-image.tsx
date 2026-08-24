import { ImageResponse } from "next/og";
import { getDb } from "@/lib/db";
import { ACCENT_THEMES } from "@/lib/accent-themes";

export const runtime = "edge";
export const alt = "VGC Team Report — Creator profile";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Unfurlers (Discord ~5s) have to get this image inside their budget, so the
// card is rendered from ONE direct Postgres round trip — no self-fetch of our
// own API, and no external avatar/sprite downloads. It is then cached hard at
// the edge, so a creator's second unfurl is a CDN hit. (Mirrors the fix that
// /api/team-graphic uses for share cards.)
const CACHE_CONTROL = "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800";
const DB_TIMEOUT_MS = 2500;

interface CreatorCardData {
  /** false only when the creator explicitly made their profile private */
  isPublic: boolean;
  bio: string;
  accentTheme: string | null;
  isVerified: boolean;
  totalReports: number;
  totalViews: number;
  followerCount: number;
}

/** Bios are stored HTML-escaped (see /api/user/profile). Satori draws text, not HTML. */
function decodeEntities(str: string): string {
  return str
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, "&");
}

function truncate(str: string, max: number): string {
  const clean = str.replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max - 1).trimEnd()}…` : clean;
}

function compactNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(n);
}

/** First letters of the creator's name, for the avatar monogram. */
function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

/**
 * One query, one round trip: profile row + verified flag + follower count +
 * public-report totals. Anything slower than DB_TIMEOUT_MS falls back to the
 * generic card rather than making the unfurler wait.
 */
async function fetchCreatorData(creator: string): Promise<CreatorCardData | null> {
  const lower = creator.toLowerCase();
  try {
    const sql = getDb();
    const query = sql`
      SELECT
        (SELECT bio FROM creator_profiles WHERE LOWER(name) = ${lower}) AS bio,
        (SELECT accent_theme FROM creator_profiles WHERE LOWER(name) = ${lower}) AS accent_theme,
        (SELECT is_public FROM creator_profiles WHERE LOWER(name) = ${lower}) AS is_public,
        (SELECT COUNT(*)::int FROM verified_creators WHERE LOWER(name) = ${lower}) AS verified,
        (SELECT COUNT(*)::int FROM follows WHERE LOWER(creator_name) = ${lower}) AS followers,
        (SELECT COUNT(*)::int FROM shares
           WHERE is_public = TRUE AND deleted_at IS NULL
             AND LOWER(data->>'creatorName') = ${lower}) AS total_reports,
        (SELECT COALESCE(SUM(COALESCE(view_count, 0)), 0)::int FROM shares
           WHERE is_public = TRUE AND deleted_at IS NULL
             AND LOWER(data->>'creatorName') = ${lower}) AS total_views
    `;
    const rows = (await Promise.race([
      query,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("og-db-timeout")), DB_TIMEOUT_MS),
      ),
    ])) as Record<string, unknown>[];

    const row = rows[0];
    if (!row) return null;

    return {
      // Only an explicit `false` means private; a creator with no profile row
      // at all is still a public creator page.
      isPublic: row.is_public !== false,
      bio: (row.bio as string) || "",
      accentTheme: (row.accent_theme as string) || null,
      isVerified: Number(row.verified ?? 0) > 0,
      totalReports: Number(row.total_reports ?? 0),
      totalViews: Number(row.total_views ?? 0),
      followerCount: Number(row.followers ?? 0),
    };
  } catch {
    return null;
  }
}

const SHELL: React.CSSProperties = {
  width: "100%",
  height: "100%",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  background: "linear-gradient(135deg, #0B0B1A 0%, #1A1035 40%, #0B0B1A 100%)",
  fontFamily: "system-ui, sans-serif",
  position: "relative",
  overflow: "hidden",
};

const GRID: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.04) 1px, transparent 0)",
  backgroundSize: "32px 32px",
};

/**
 * Shown for private profiles, unknown creators, and any DB hiccup. It carries
 * NO profile details — a creator who set is_public = false must never have a
 * bio, follower count or report count leak into a social card.
 */
function FallbackCard() {
  return (
    <div style={SHELL}>
      <div style={GRID} />
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 72,
          height: 72,
          borderRadius: "50%",
          background: "linear-gradient(135deg, #E11D48, #BE123C)",
          marginBottom: 28,
          boxShadow: "0 0 60px rgba(225,29,72,0.3), 0 4px 24px rgba(0,0,0,0.3)",
        }}
      >
        <div style={{ width: 24, height: 24, borderRadius: "50%", background: "white", border: "3px solid #BE123C" }} />
      </div>
      <div style={{ fontSize: 52, fontWeight: 800, color: "#F0EDE6", letterSpacing: "-0.02em", marginBottom: 12 }}>
        VGC Team Report
      </div>
      <div style={{ fontSize: 22, color: "#8A8AA3", textAlign: "center" }}>
        Build, share, and present professional VGC team reports
      </div>
      <div style={{ marginTop: 36, width: 120, height: 4, borderRadius: 2, background: "linear-gradient(90deg, #E11D48, #FB7185, #8B5CF6)" }} />
      <div style={{ position: "absolute", bottom: 28, fontSize: 14, color: "#4A4A68", letterSpacing: "0.05em" }}>
        pokemonvgcteamreport.com
      </div>
    </div>
  );
}

export default async function Image({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  let creator: string;
  try {
    creator = decodeURIComponent(name);
  } catch {
    creator = name;
  }
  creator = truncate(creator, 40);

  const data = await fetchCreatorData(creator);

  // Private profile, missing creator, or a slow/failed query → generic card.
  if (!data || !data.isPublic || !creator) {
    return new ImageResponse(<FallbackCard />, { ...size, headers: { "Cache-Control": CACHE_CONTROL } });
  }

  const theme =
    ACCENT_THEMES.find((t) => t.id === data.accentTheme) ?? ACCENT_THEMES[0];
  const accent = theme.darkAccent;
  const accentDeep = theme.accent;

  const bio = data.bio ? truncate(decodeEntities(data.bio), 150) : "";
  const subtitle = bio || "VGC team reports, open team sheets, and tournament results";
  const nameSize = creator.length > 24 ? 46 : creator.length > 16 ? 56 : 64;

  const stats: { label: string; value: string }[] = [
    { label: data.totalReports === 1 ? "Report" : "Reports", value: compactNumber(data.totalReports) },
    { label: data.totalViews === 1 ? "View" : "Views", value: compactNumber(data.totalViews) },
    { label: data.followerCount === 1 ? "Follower" : "Followers", value: compactNumber(data.followerCount) },
  ];

  return new ImageResponse(
    (
      <div style={{ ...SHELL, padding: "48px 72px" }}>
        <div style={GRID} />

        {/* Top accent bar */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background: `linear-gradient(90deg, transparent 5%, ${accentDeep} 30%, ${accent} 55%, rgba(99,102,241,0.5) 75%, transparent 95%)`,
          }}
        />

        {/* Glow orbs, tinted with the creator's accent theme */}
        <div
          style={{
            position: "absolute",
            top: -90,
            right: -90,
            width: 360,
            height: 360,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${accentDeep}2E 0%, transparent 70%)`,
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -70,
            left: -70,
            width: 300,
            height: 300,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(139,92,246,0.14) 0%, transparent 70%)",
          }}
        />

        {/* Avatar monogram — deliberately not the stored avatar_url: an
            external image fetch is exactly what makes an unfurl time out. */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 132,
            height: 132,
            borderRadius: "50%",
            background: `linear-gradient(135deg, ${accent}, ${accentDeep})`,
            marginBottom: 26,
            fontSize: 52,
            fontWeight: 800,
            color: "#FFFFFF",
            boxShadow: `0 0 70px ${accentDeep}4D, 0 4px 24px rgba(0,0,0,0.35)`,
          }}
        >
          {initials(creator)}
        </div>

        {/* Creator name + verified badge */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
          <div
            style={{
              fontSize: nameSize,
              fontWeight: 800,
              color: "#F0EDE6",
              letterSpacing: "-0.02em",
              textAlign: "center",
            }}
          >
            {creator}
          </div>
          {data.isVerified && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 38,
                height: 38,
                borderRadius: "50%",
                background: accentDeep,
                color: "#FFFFFF",
                fontSize: 20,
                fontWeight: 800,
              }}
            >
              ✓
            </div>
          )}
        </div>

        {/* Bio, or a generic line when the creator hasn't written one */}
        <div
          style={{
            fontSize: bio ? 24 : 22,
            color: bio ? "#B9B6CE" : "#8A8AA3",
            maxWidth: 860,
            textAlign: "center",
            lineHeight: 1.45,
            marginBottom: 30,
          }}
        >
          {subtitle}
        </div>

        {/* Stat row */}
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          {stats.map((stat) => (
            <div
              key={stat.label}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 2,
                minWidth: 128,
                padding: "12px 20px",
                borderRadius: 14,
                background: "linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <div style={{ fontSize: 30, fontWeight: 800, color: "#F0EDE6" }}>{stat.value}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#8A8AA3", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Accent bar */}
        <div
          style={{
            marginTop: 28,
            width: 120,
            height: 4,
            borderRadius: 2,
            background: `linear-gradient(90deg, ${accent}, ${accentDeep}, #8B5CF6)`,
          }}
        />

        <div
          style={{
            position: "absolute",
            bottom: 26,
            right: 36,
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 14,
            fontWeight: 600,
            color: "#4A4A68",
            letterSpacing: "0.04em",
          }}
        >
          pokemonvgcteamreport.com
        </div>
      </div>
    ),
    { ...size, headers: { "Cache-Control": CACHE_CONTROL } },
  );
}
