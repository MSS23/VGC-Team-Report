import { ImageResponse } from "next/og";
import { getDb } from "@/lib/db";

export const runtime = "edge";
export const alt = "VGC Team Report";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

function extractTeamFromPaste(paste: string): { species: string; item: string | null }[] {
  const blocks = paste.trim().split(/\n\s*\n/);
  const team: { species: string; item: string | null }[] = [];

  for (const block of blocks) {
    const firstLine = block.trim().split("\n")[0]?.trim();
    if (!firstLine) continue;

    let species: string;
    let item: string | null = null;

    const [before, ...rest] = firstLine.split(" @ ");
    if (rest.length > 0) item = rest.join(" @ ").trim();

    let namePart = before.trim();
    namePart = namePart.replace(/\s*\([MF]\)\s*$/, "");

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

import { resolveSlug as toSpriteSlug } from "@/lib/utils/sprite-slug";

function getPlacementStyle(placement: string) {
  const p = placement.toLowerCase().trim();
  if (p === "1st" || p === "1" || p === "winner" || p === "champion") {
    return { bg: "rgba(250,204,21,0.10)", border: "rgba(250,204,21,0.40)", text: "#FCD34D" };
  }
  if (p === "2nd" || p === "2" || p === "finalist" || p === "runner-up") {
    return { bg: "rgba(203,213,225,0.08)", border: "rgba(203,213,225,0.30)", text: "#E2E8F0" };
  }
  if (p === "3rd" || p === "3") {
    return { bg: "rgba(251,146,60,0.08)", border: "rgba(251,146,60,0.30)", text: "#FDBA74" };
  }
  return { bg: "rgba(244,63,94,0.07)", border: "rgba(244,63,94,0.22)", text: "#FDA4AF" };
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
            background: "#08080F",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          <div style={{ fontSize: 48, fontWeight: 800, color: "#F0EDE6" }}>
            VGC Team Report
          </div>
          <div style={{ fontSize: 18, color: "#64648A", marginTop: 14 }}>
            Team not found
          </div>
        </div>
      ),
      { ...size }
    );
  }

  const SPRITE_BASE = "https://play.pokemonshowdown.com/sprites";
  const placementColors = placement ? getPlacementStyle(placement) : null;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#07070E",
          fontFamily: "system-ui, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* ── BG: base gradient ── */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(165deg, #080812 0%, #0B0B1E 30%, #0F0D25 55%, #080810 100%)",
            display: "flex",
          }}
        />

        {/* BG: fine dot grid */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.015) 1px, transparent 0)",
            backgroundSize: "28px 28px",
          }}
        />

        {/* BG: center ambient */}
        <div
          style={{
            position: "absolute",
            top: "40%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 1000,
            height: 550,
            borderRadius: "50%",
            background: "radial-gradient(ellipse, rgba(110,70,200,0.035) 0%, rgba(180,40,80,0.015) 45%, transparent 72%)",
            display: "flex",
          }}
        />

        {/* Top accent */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 2,
            background: "linear-gradient(90deg, transparent 8%, rgba(225,29,72,0.55) 32%, rgba(139,92,246,0.45) 50%, rgba(99,102,241,0.35) 68%, transparent 92%)",
            display: "flex",
          }}
        />

        {/* ── HEADER ── */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            paddingTop: 46,
            position: "relative",
          }}
        >
          {tournamentName ? (
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div
                style={{
                  fontSize: 36,
                  fontWeight: 800,
                  color: "#F0EEF8",
                  letterSpacing: "-0.03em",
                  lineHeight: 1,
                }}
              >
                {tournamentName}
              </div>
              {placement && placementColors && (
                <div
                  style={{
                    fontSize: 17,
                    fontWeight: 800,
                    color: placementColors.text,
                    background: placementColors.bg,
                    border: `1.5px solid ${placementColors.border}`,
                    padding: "6px 16px",
                    borderRadius: 9,
                    letterSpacing: "0.02em",
                  }}
                >
                  {placement}
                </div>
              )}
            </div>
          ) : (
            <div style={{ fontSize: 32, fontWeight: 800, color: "#E0DEF0", display: "flex" }}>
              Team Report
            </div>
          )}

          {creatorName && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                marginTop: 12,
                fontSize: 17,
              }}
            >
              <span style={{ color: "#505068" }}>by</span>
              <span style={{ color: "#9898BE", fontWeight: 600 }}>{creatorName}</span>
            </div>
          )}
        </div>

        {/* ── POKEMON ROW ── */}
        <div
          style={{
            display: "flex",
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            padding: "0 40px",
            position: "relative",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "center",
              gap: 14,
            }}
          >
            {team.map((mon, i) => {
              const slug = toSpriteSlug(mon.species);
              const spriteUrl = `${SPRITE_BASE}/home/${slug}.png`;

              return (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    width: 172,
                  }}
                >
                  {/* Card */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      width: 164,
                      borderRadius: 18,
                      background: "linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.012) 100%)",
                      border: "1px solid rgba(255,255,255,0.055)",
                      boxShadow: "0 10px 36px rgba(0,0,0,0.35), 0 2px 6px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.045)",
                      position: "relative",
                      overflow: "hidden",
                      paddingBottom: 16,
                    }}
                  >
                    {/* Sprite area */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "100%",
                        height: 140,
                        position: "relative",
                      }}
                    >
                      {/* Floor reflection */}
                      <div
                        style={{
                          position: "absolute",
                          bottom: 2,
                          left: "50%",
                          transform: "translateX(-50%)",
                          width: 70,
                          height: 18,
                          borderRadius: "50%",
                          background: "radial-gradient(ellipse, rgba(130,90,230,0.07) 0%, transparent 70%)",
                          display: "flex",
                        }}
                      />
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={spriteUrl}
                        alt={mon.species}
                        width={116}
                        height={116}
                        style={{ objectFit: "contain", position: "relative" }}
                      />
                    </div>

                    {/* Species name */}
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: "#D0CEE0",
                        textAlign: "center",
                        maxWidth: 150,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        letterSpacing: "0.005em",
                      }}
                    >
                      {mon.species}
                    </div>

                    {/* Item label */}
                    {mon.item && (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          marginTop: 6,
                          padding: "3px 10px",
                          borderRadius: 6,
                          background: "rgba(255,255,255,0.03)",
                          border: "1px solid rgba(255,255,255,0.04)",
                        }}
                      >
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            color: "#8886A6",
                            letterSpacing: "0.01em",
                          }}
                        >
                          {mon.item}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── BOTTOM BAR ── */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 50,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 44px",
            background: "linear-gradient(0deg, rgba(7,7,14,0.98) 0%, rgba(7,7,14,0.75) 55%, transparent 100%)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* Pokeball */}
            <div
              style={{
                width: 18,
                height: 18,
                borderRadius: "50%",
                background: "linear-gradient(145deg, #E11D48, #BE123C)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 0 10px rgba(225,29,72,0.22)",
              }}
            >
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "#FFF",
                  border: "1.5px solid rgba(190,18,60,0.6)",
                }}
              />
            </div>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#68688A", letterSpacing: "0.03em" }}>
              VGC Team Report
            </span>
          </div>
          <span style={{ fontSize: 12, color: "#404058", fontWeight: 500 }}>
            pokemonvgcteamreport.com
          </span>
        </div>
      </div>
    ),
    { ...size }
  );
}
