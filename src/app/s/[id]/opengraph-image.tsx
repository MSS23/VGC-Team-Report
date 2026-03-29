import { ImageResponse } from "next/og";
import { getDb } from "@/lib/db";

export const runtime = "edge";
export const alt = "VGC Team Report";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Minimal paste parser — extracts species + item from each block's first line
function extractTeamFromPaste(paste: string): { species: string; item: string | null }[] {
  const blocks = paste.trim().split(/\n\s*\n/);
  const team: { species: string; item: string | null }[] = [];

  for (const block of blocks) {
    const firstLine = block.trim().split("\n")[0]?.trim();
    if (!firstLine) continue;

    let species: string;
    let item: string | null = null;

    // Split on " @ " for item
    const [before, ...rest] = firstLine.split(" @ ");
    if (rest.length > 0) item = rest.join(" @ ").trim();

    let namePart = before.trim();

    // Remove gender suffix like " (M)" or " (F)"
    namePart = namePart.replace(/\s*\([MF]\)\s*$/, "");

    // Check for nickname: "Nickname (Species)" pattern
    const nicknameMatch = namePart.match(/^.+\((.+)\)$/);
    if (nicknameMatch) {
      species = nicknameMatch[1].trim();
    } else {
      species = namePart;
    }

    if (species) team.push({ species, item });
  }

  return team.slice(0, 6);
}

// Use canonical slug resolver — single source of truth for all sprite slugs
import { resolveSlug as toSpriteSlug } from "@/lib/utils/sprite-slug";

function toItemSlug(item: string): string {
  return item
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+/g, "-");
}

// Placement badge colors
function getPlacementStyle(placement: string): { bg: string; border: string; color: string } {
  const p = placement.toLowerCase().trim();
  if (p === "1st" || p === "1" || p === "winner" || p === "champion") {
    return { bg: "rgba(234,179,8,0.15)", border: "rgba(234,179,8,0.4)", color: "#EAB308" };
  }
  if (p === "2nd" || p === "2" || p === "finalist" || p === "runner-up") {
    return { bg: "rgba(148,163,184,0.15)", border: "rgba(148,163,184,0.4)", color: "#94A3B8" };
  }
  if (p === "3rd" || p === "3") {
    return { bg: "rgba(217,119,6,0.15)", border: "rgba(217,119,6,0.4)", color: "#D97706" };
  }
  // Top cut / other placements
  return { bg: "rgba(225,29,72,0.12)", border: "rgba(225,29,72,0.25)", color: "#FB7185" };
}

export default async function Image({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let paste = "";
  let tournamentName = "";
  let placement = "";
  let creatorName = "";

  try {
    const sql = getDb();
    const rows = await sql`SELECT data FROM shares WHERE id = ${id} AND deleted_at IS NULL`;
    if (rows.length > 0) {
      const data = rows[0].data as Record<string, unknown>;
      paste = (data.paste as string) ?? "";
      tournamentName = (data.tournamentName as string) ?? "";
      placement = (data.placement as string) ?? "";
      creatorName = (data.creatorName as string) ?? "";
    }
  } catch {
    // Fall through to generic image
  }

  const team = extractTeamFromPaste(paste);

  // If no team data, render a generic fallback
  if (team.length === 0) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg, #0B0B1A 0%, #1C1C38 40%, #0B0B1A 100%)",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          <div style={{ fontSize: 56, fontWeight: 800, color: "#F0EDE6" }}>
            VGC Team Report
          </div>
          <div style={{ fontSize: 22, color: "#8A8AA3", marginTop: 16 }}>
            Team not found
          </div>
        </div>
      ),
      { ...size }
    );
  }

  const SPRITE_BASE = "https://play.pokemonshowdown.com/sprites";
  const hasHeader = !!(tournamentName || creatorName);
  const placementColors = placement ? getPlacementStyle(placement) : null;

  // Calculate sprite size based on team size
  const spriteContainerSize = team.length <= 4 ? 150 : 140;
  const spriteSize = team.length <= 4 ? 110 : 100;
  const spriteGap = team.length <= 4 ? 28 : 16;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(150deg, #0B0B1A 0%, #141428 35%, #1A1035 65%, #0B0B1A 100%)",
          fontFamily: "system-ui, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Subtle grid */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.03) 1px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />

        {/* Large glow behind team row */}
        <div
          style={{
            position: "absolute",
            top: "35%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 800,
            height: 400,
            borderRadius: "50%",
            background: "radial-gradient(ellipse, rgba(225,29,72,0.06) 0%, transparent 70%)",
          }}
        />

        {/* Top-right accent glow */}
        <div
          style={{
            position: "absolute",
            top: -100,
            right: -100,
            width: 350,
            height: 350,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)",
          }}
        />

        {/* Bottom-left accent glow */}
        <div
          style={{
            position: "absolute",
            bottom: -80,
            left: -80,
            width: 300,
            height: 300,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(225,29,72,0.08) 0%, transparent 70%)",
          }}
        />

        {/* Top accent line */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            background: "linear-gradient(90deg, transparent, #E11D48, #8B5CF6, transparent)",
          }}
        />

        {/* Tournament header section */}
        {hasHeader && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            {/* Tournament name with optional placement badge */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
              }}
            >
              {tournamentName && (
                <div
                  style={{
                    fontSize: 32,
                    fontWeight: 800,
                    color: "#F0EDE6",
                    letterSpacing: "-0.02em",
                    textAlign: "center",
                    maxWidth: 700,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {tournamentName}
                </div>
              )}
              {placement && placementColors && (
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 800,
                    color: placementColors.color,
                    background: placementColors.bg,
                    border: `1.5px solid ${placementColors.border}`,
                    padding: "5px 16px",
                    borderRadius: 8,
                    letterSpacing: "0.02em",
                  }}
                >
                  {placement}
                </div>
              )}
            </div>

            {/* Creator name */}
            {creatorName && (
              <div
                style={{
                  fontSize: 18,
                  color: "#8A8AA3",
                  marginTop: 8,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <span style={{ color: "#6A6A8A" }}>by</span> {creatorName}
              </div>
            )}
          </div>
        )}

        {/* Pokemon row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: spriteGap,
            marginTop: hasHeader ? 8 : 20,
            padding: "0 40px",
          }}
        >
          {team.map((mon, i) => {
            const slug = toSpriteSlug(mon.species);
            const spriteUrl = `${SPRITE_BASE}/home/${slug}.png`;
            const itemUrl = mon.item
              ? `${SPRITE_BASE}/itemicons/${toItemSlug(mon.item)}.png`
              : null;

            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 8,
                  position: "relative",
                }}
              >
                {/* Sprite container */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: spriteContainerSize,
                    height: spriteContainerSize,
                    borderRadius: 20,
                    background: "linear-gradient(145deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))",
                    border: "1px solid rgba(255,255,255,0.08)",
                    position: "relative",
                    boxShadow: "0 4px 24px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.05)",
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={spriteUrl}
                    alt={mon.species}
                    width={spriteSize}
                    height={spriteSize}
                    style={{ objectFit: "contain" }}
                  />
                  {/* Item icon overlaid bottom-right */}
                  {itemUrl && (
                    <div
                      style={{
                        position: "absolute",
                        bottom: 6,
                        right: 6,
                        width: 32,
                        height: 32,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "rgba(11,11,26,0.9)",
                        borderRadius: 8,
                        border: "1px solid rgba(255,255,255,0.1)",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={itemUrl}
                        alt={mon.item ?? ""}
                        width={24}
                        height={24}
                        style={{ objectFit: "contain" }}
                      />
                    </div>
                  )}
                </div>
                {/* Species name */}
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: "#B0B0CC",
                    textAlign: "center",
                    maxWidth: spriteContainerSize,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {mon.species}
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom branding bar */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 56,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            background: "linear-gradient(0deg, rgba(11,11,26,0.95), rgba(11,11,26,0.6))",
            borderTop: "1px solid rgba(255,255,255,0.04)",
          }}
        >
          {/* Pokeball icon */}
          <div
            style={{
              width: 22,
              height: 22,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #E11D48, #BE123C)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 12px rgba(225,29,72,0.3)",
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "white",
                border: "1.5px solid #BE123C",
              }}
            />
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#8A8AA3", letterSpacing: "0.02em" }}>
            VGC Team Report
          </div>
          <div
            style={{
              width: 4,
              height: 4,
              borderRadius: "50%",
              background: "#3A3A5A",
            }}
          />
          <div style={{ fontSize: 14, color: "#5A5A78" }}>
            pokemonvgcteamreport.com
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
