import { ImageResponse } from "next/og";
import { getDb } from "@/lib/db";
import { resolveSlug as toSpriteSlug } from "@/lib/utils/sprite-slug";
import { POKEMON_TYPES_MAP } from "@/lib/data/pokemon-types-map";

export const runtime = "edge";
export const alt = "VGC Team Report";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Render at 2x for Retina/HiDPI sharpness (Discord, Twitter, etc.)
const SCALE = 2;
const W = 1200 * SCALE;
const H = 630 * SCALE;

// ── Inline paste parser (edge-compatible, no heavy deps) ───────
interface OGPokemon {
  species: string;
  item: string | null;
  ability: string | null;
  teraType: string | null;
  types: string[];
}

function parseTeamForOG(paste: string): OGPokemon[] {
  const blocks = paste.trim().split(/\n\s*\n/);
  const team: OGPokemon[] = [];

  for (const block of blocks) {
    const lines = block.trim().split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) continue;

    const firstLine = lines[0];
    let item: string | null = null;
    const [before, ...rest] = firstLine.split(" @ ");
    if (rest.length > 0) item = rest.join(" @ ").trim();

    let namePart = before.trim().replace(/\s*\([MF]\)\s*$/, "");
    const nicknameMatch = namePart.match(/^.+\((.+)\)$/);
    const species = nicknameMatch ? nicknameMatch[1].trim() : namePart;

    let ability: string | null = null;
    let teraType: string | null = null;

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].replace(/[\u00a0]/g, " ");
      if (/^Ability:\s*/i.test(line)) {
        ability = line.replace(/^Ability:\s*/i, "").trim();
      } else if (/^Tera Type:\s*/i.test(line)) {
        teraType = line.replace(/^Tera Type:\s*/i, "").trim();
      }
    }

    // Look up types from lightweight map
    const slug = species.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
    const types: string[] = POKEMON_TYPES_MAP[slug] ?? [];

    if (species) team.push({ species, item, ability, teraType, types });
  }

  return team.slice(0, 6);
}

// ── Type colors for badges ─────────────────────────────────────
const TYPE_BG: Record<string, string> = {
  Normal: "#A8A77A", Fire: "#EE8130", Water: "#6390F0", Electric: "#F7D02C",
  Grass: "#7AC74C", Ice: "#96D9D6", Fighting: "#C22E28", Poison: "#A33EA1",
  Ground: "#E2BF65", Flying: "#A98FF0", Psychic: "#F95587", Bug: "#A6B91A",
  Rock: "#B6A136", Ghost: "#735797", Dragon: "#6F35FC", Dark: "#705746",
  Steel: "#B7B7CE", Fairy: "#D685AD",
};

const TYPE_TEXT: Record<string, string> = {
  Electric: "#1A1A2E", Ice: "#1A1A2E", Ground: "#1A1A2E", Steel: "#1A1A2E",
};

function getPlacementStyle(placement: string) {
  const p = placement.toLowerCase().trim();
  if (p === "1st" || p === "1" || p === "winner" || p === "champion") {
    return { bg: "rgba(250,204,21,0.12)", border: "rgba(250,204,21,0.45)", text: "#FCD34D", glow: "rgba(250,204,21,0.08)" };
  }
  if (p === "2nd" || p === "2" || p === "finalist" || p === "runner-up") {
    return { bg: "rgba(203,213,225,0.10)", border: "rgba(203,213,225,0.35)", text: "#E2E8F0", glow: "rgba(203,213,225,0.05)" };
  }
  if (p === "3rd" || p === "3") {
    return { bg: "rgba(251,146,60,0.10)", border: "rgba(251,146,60,0.35)", text: "#FDBA74", glow: "rgba(251,146,60,0.05)" };
  }
  return { bg: "rgba(244,63,94,0.08)", border: "rgba(244,63,94,0.25)", text: "#FDA4AF", glow: "rgba(244,63,94,0.04)" };
}

// ── Main component ─────────────────────────────────────────────

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
  let record = "";
  let tags: { archetype?: string[]; regulation?: string; eventType?: string } = {};

  try {
    const sql = getDb();
    const rows = await sql`SELECT data FROM shares WHERE id = ${id} AND deleted_at IS NULL`;
    if (rows.length > 0) {
      const data = rows[0].data as Record<string, unknown>;
      paste = (data.paste as string) ?? "";
      tournamentName = (data.tournamentName as string) ?? "";
      placement = (data.placement as string) ?? "";
      creatorName = (data.creatorName as string) ?? "";
      record = (data.record as string) ?? "";
      tags = (data.tags as typeof tags) ?? {};
    }
  } catch {
    // Fall through to generic image
  }

  const team = parseTeamForOG(paste);

  if (team.length === 0) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%", height: "100%", display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            background: "#08080F", fontFamily: "system-ui, sans-serif",
          }}
        >
          <div style={{ fontSize: 96, fontWeight: 800, color: "#F0EDE6" }}>VGC Team Report</div>
          <div style={{ fontSize: 36, color: "#64648A", marginTop: 28 }}>Team not found</div>
        </div>
      ),
      { width: W, height: H },
    );
  }

  const SPRITE_BASE = "https://play.pokemonshowdown.com/sprites";
  const placementColors = placement ? getPlacementStyle(placement) : null;
  const hasMetadata = !!record || !!tags.regulation || (tags.archetype && tags.archetype.length > 0) || !!tags.eventType;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%", height: "100%", display: "flex", flexDirection: "column",
          background: "#07070E", fontFamily: "system-ui, sans-serif",
          position: "relative", overflow: "hidden",
        }}
      >
        {/* BG: base gradient */}
        <div style={{
          position: "absolute", inset: 0, display: "flex",
          background: "linear-gradient(165deg, #080812 0%, #0B0B1E 30%, #0F0D25 55%, #080810 100%)",
        }} />

        {/* BG: dot grid */}
        <div style={{
          position: "absolute", inset: 0, display: "flex",
          backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.015) 1px, transparent 0)",
          backgroundSize: "56px 56px",
        }} />

        {/* BG: center ambient glow */}
        <div style={{
          position: "absolute", top: "35%", left: "50%", transform: "translate(-50%, -50%)",
          width: 2000, height: 1000, borderRadius: "50%",
          background: "radial-gradient(ellipse, rgba(110,70,200,0.04) 0%, rgba(180,40,80,0.018) 45%, transparent 72%)",
          display: "flex",
        }} />

        {/* Top accent line */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 6, display: "flex",
          background: "linear-gradient(90deg, transparent 5%, rgba(225,29,72,0.6) 28%, rgba(139,92,246,0.5) 50%, rgba(99,102,241,0.4) 72%, transparent 95%)",
        }} />

        {/* ── HEADER ── */}
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          paddingTop: 72, position: "relative", gap: 20,
        }}>
          {/* Tournament name + placement + record row */}
          <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
            {tournamentName ? (
              <div style={{
                fontSize: 68, fontWeight: 800, color: "#F0EEF8",
                letterSpacing: "-0.03em", lineHeight: 1,
              }}>
                {tournamentName}
              </div>
            ) : (
              <div style={{ fontSize: 60, fontWeight: 800, color: "#E0DEF0", display: "flex" }}>
                Team Report
              </div>
            )}
            {placement && placementColors && (
              <div style={{
                fontSize: 32, fontWeight: 800, color: placementColors.text,
                background: placementColors.bg, border: `3px solid ${placementColors.border}`,
                padding: "10px 28px", borderRadius: 16, letterSpacing: "0.02em",
                boxShadow: `0 0 40px ${placementColors.glow}`,
              }}>
                {placement}
              </div>
            )}
            {record && (
              <div style={{
                fontSize: 30, fontWeight: 700, color: "#A0A0C0",
                background: "rgba(255,255,255,0.04)", border: "2px solid rgba(255,255,255,0.06)",
                padding: "8px 24px", borderRadius: 14,
              }}>
                {record}
              </div>
            )}
          </div>

          {/* Creator + metadata tags row */}
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            {creatorName && (
              <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 32 }}>
                <span style={{ color: "#505068" }}>by</span>
                <span style={{ color: "#9898BE", fontWeight: 600 }}>{creatorName}</span>
              </div>
            )}
            {creatorName && hasMetadata && (
              <div style={{ width: 2, height: 32, background: "rgba(255,255,255,0.08)", display: "flex" }} />
            )}
            {tags.regulation && (
              <div style={{
                fontSize: 24, fontWeight: 700, color: "#8B8BBA",
                background: "rgba(139,92,246,0.08)", border: "2px solid rgba(139,92,246,0.18)",
                padding: "6px 20px", borderRadius: 10, letterSpacing: "0.03em",
              }}>
                {tags.regulation}
              </div>
            )}
            {tags.eventType && (
              <div style={{
                fontSize: 24, fontWeight: 700, color: "#7A8AAA",
                background: "rgba(99,102,241,0.06)", border: "2px solid rgba(99,102,241,0.14)",
                padding: "6px 20px", borderRadius: 10,
              }}>
                {tags.eventType}
              </div>
            )}
            {tags.archetype && tags.archetype.slice(0, 2).map((arch, i) => (
              <div key={i} style={{
                fontSize: 24, fontWeight: 700, color: "#8A8AAA",
                background: "rgba(255,255,255,0.03)", border: "2px solid rgba(255,255,255,0.06)",
                padding: "6px 20px", borderRadius: 10,
              }}>
                {arch}
              </div>
            ))}
          </div>
        </div>

        {/* ── POKEMON GRID ── */}
        <div style={{
          display: "flex", flex: 1, alignItems: "center", justifyContent: "center",
          padding: "0 72px", position: "relative",
        }}>
          <div style={{
            display: "flex", alignItems: "flex-start", justifyContent: "center", gap: 20,
          }}>
            {team.map((mon, i) => {
              const slug = toSpriteSlug(mon.species);
              const spriteUrl = `${SPRITE_BASE}/home/${slug}.png`;

              return (
                <div key={i} style={{
                  display: "flex", flexDirection: "column", alignItems: "center", width: 352,
                }}>
                  {/* Card */}
                  <div style={{
                    display: "flex", flexDirection: "column", alignItems: "center",
                    width: 336, borderRadius: 32,
                    background: "linear-gradient(180deg, rgba(255,255,255,0.045) 0%, rgba(255,255,255,0.012) 100%)",
                    border: "2px solid rgba(255,255,255,0.06)",
                    boxShadow: "0 16px 64px rgba(0,0,0,0.35), 0 4px 12px rgba(0,0,0,0.2), inset 0 2px 0 rgba(255,255,255,0.05)",
                    position: "relative", overflow: "hidden", paddingBottom: 28,
                  }}>
                    {/* Sprite area */}
                    <div style={{
                      display: "flex", alignItems: "center", justifyContent: "center",
                      width: "100%", height: 240, position: "relative",
                    }}>
                      {/* Floor reflection */}
                      <div style={{
                        position: "absolute", bottom: 0, left: "50%", transform: "translateX(-50%)",
                        width: 120, height: 32, borderRadius: "50%",
                        background: "radial-gradient(ellipse, rgba(130,90,230,0.08) 0%, transparent 70%)",
                        display: "flex",
                      }} />
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={spriteUrl} alt={mon.species}
                        width={200} height={200}
                        style={{ objectFit: "contain", position: "relative" }}
                      />
                    </div>

                    {/* Type badges row */}
                    {mon.types.length > 0 && (
                      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                        {mon.types.map((t, ti) => (
                          <div key={ti} style={{
                            fontSize: 18, fontWeight: 800, letterSpacing: "0.05em",
                            color: TYPE_TEXT[t] ?? "#FFFFFF",
                            background: TYPE_BG[t] ?? "#666",
                            padding: "4px 14px", borderRadius: 8,
                            textTransform: "uppercase",
                          }}>
                            {t}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Species name */}
                    <div style={{
                      fontSize: 26, fontWeight: 700, color: "#D0CEE0",
                      textAlign: "center", maxWidth: 310,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      letterSpacing: "0.005em",
                    }}>
                      {mon.species}
                    </div>

                    {/* Ability */}
                    {mon.ability && (
                      <div style={{
                        fontSize: 20, fontWeight: 600, color: "#7878A0",
                        textAlign: "center", marginTop: 6,
                      }}>
                        {mon.ability}
                      </div>
                    )}

                    {/* Item badge */}
                    {mon.item && (
                      <div style={{
                        display: "flex", alignItems: "center", justifyContent: "center",
                        marginTop: 10, padding: "4px 16px", borderRadius: 10,
                        background: "rgba(255,255,255,0.03)", border: "2px solid rgba(255,255,255,0.05)",
                      }}>
                        <span style={{
                          fontSize: 20, fontWeight: 600, color: "#8886A6", letterSpacing: "0.01em",
                        }}>
                          {mon.item}
                        </span>
                      </div>
                    )}

                    {/* Tera type indicator */}
                    {mon.teraType && (
                      <div style={{
                        display: "flex", alignItems: "center", gap: 8, marginTop: 8,
                      }}>
                        <div style={{
                          width: 16, height: 16, borderRadius: 4, transform: "rotate(45deg)",
                          background: TYPE_BG[mon.teraType] ?? "#888",
                          boxShadow: `0 0 12px ${TYPE_BG[mon.teraType] ?? "#888"}44`,
                          display: "flex",
                        }} />
                        <span style={{ fontSize: 18, fontWeight: 700, color: "#6868A0" }}>
                          Tera {mon.teraType}
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
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0, height: 92,
          display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 80px",
          background: "linear-gradient(0deg, rgba(7,7,14,0.98) 0%, rgba(7,7,14,0.8) 50%, transparent 100%)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            {/* Pokeball icon */}
            <div style={{
              width: 36, height: 36, borderRadius: "50%",
              background: "linear-gradient(145deg, #E11D48, #BE123C)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 0 20px rgba(225,29,72,0.22)",
            }}>
              <div style={{
                width: 12, height: 12, borderRadius: "50%",
                background: "#FFF", border: "3px solid rgba(190,18,60,0.6)",
              }} />
            </div>
            <span style={{ fontSize: 26, fontWeight: 700, color: "#68688A", letterSpacing: "0.03em" }}>
              VGC Team Report
            </span>
          </div>
          <span style={{ fontSize: 22, color: "#404058", fontWeight: 500 }}>
            pokemonvgcteamreport.com
          </span>
        </div>
      </div>
    ),
    { width: W, height: H },
  );
}
