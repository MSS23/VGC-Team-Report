import { ImageResponse } from "next/og";
import { getDb } from "@/lib/db";
import { resolveSlug as toSpriteSlug } from "@/lib/utils/sprite-slug";
import { POKEMON_TYPES_MAP } from "@/lib/data/pokemon-types-map";

export const runtime = "edge";
export const alt = "VGC Team Report";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
// Cache the generated image for 1 hour — OG crawlers (Discord, Twitter, Slack)
// unfurl repeatedly, and regenerating on every request was causing timeouts.
export const revalidate = 3600;

// 2x the OG standard (2400x1260) for crisp rendering on Discord and other
// hi-DPI displays. Discord accepts images up to 8MB and scales them down; at
// 1200x630 native, text and sprites looked soft on retina screens.
//
// A previous attempt at 2x broke because the render was dominated by expensive
// background effects (dot grid, multiple radial glows, layered gradients).
// This version keeps the 2x resolution but strips the render cost — the dot
// grid is gone, the ambient glow is gone, and the content layout is rendered
// inside a scale(2) root transform so we keep the existing 1x pixel values
// without having to multiply every number by 2.
const SCALE = 2;
const BASE_W = 1200;
const BASE_H = 630;
const W = BASE_W * SCALE;
const H = BASE_H * SCALE;

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

  // Prefetch all sprites in parallel with a tight timeout, then inline as data URIs.
  // Satori fetches <img src> remotes serially during render, so a single slow sprite
  // can time the whole OG route out. Doing it up front in parallel is ~6x faster
  // and bounds the worst case to SPRITE_TIMEOUT_MS.
  const SPRITE_BASE = "https://play.pokemonshowdown.com/sprites";
  const SPRITE_TIMEOUT_MS = 2500;

  async function fetchSprite(slug: string): Promise<string | null> {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), SPRITE_TIMEOUT_MS);
      const res = await fetch(`${SPRITE_BASE}/home/${slug}.png`, {
        signal: controller.signal,
        // Route-level `revalidate = 3600` caches the whole ImageResponse,
        // so this inner fetch only runs on cache miss.
        cache: "force-cache",
      });
      clearTimeout(timer);
      if (!res.ok) return null;
      const buf = await res.arrayBuffer();
      // Base64 encode for data URI — Satori handles data URIs without network.
      let binary = "";
      const bytes = new Uint8Array(buf);
      for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
      const b64 = btoa(binary);
      return `data:image/png;base64,${b64}`;
    } catch {
      return null;
    }
  }

  const spriteDataUris: (string | null)[] = team.length > 0
    ? await Promise.all(team.map((mon) => fetchSprite(toSpriteSlug(mon.species))))
    : [];

  if (team.length === 0) {
    return new ImageResponse(
      (
        <div
          style={{
            width: W, height: H, display: "flex",
            background: "#08080F", fontFamily: "system-ui, sans-serif",
          }}
        >
          <div
            style={{
              width: BASE_W, height: BASE_H, display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              transform: `scale(${SCALE})`, transformOrigin: "top left",
            }}
          >
            <div style={{ fontSize: 96, fontWeight: 800, color: "#F0EDE6" }}>VGC Team Report</div>
            <div style={{ fontSize: 36, color: "#64648A", marginTop: 28 }}>Team not found</div>
          </div>
        </div>
      ),
      { width: W, height: H },
    );
  }

  const placementColors = placement ? getPlacementStyle(placement) : null;
  const hasMetadata = !!record || !!tags.regulation || (tags.archetype && tags.archetype.length > 0) || !!tags.eventType;

  return new ImageResponse(
    (
      <div
        style={{
          width: W, height: H, display: "flex",
          background: "linear-gradient(165deg, #080812 0%, #0B0B1E 50%, #080810 100%)",
          fontFamily: "system-ui, sans-serif",
        }}
      >
      <div
        style={{
          width: BASE_W, height: BASE_H, display: "flex", flexDirection: "column",
          fontFamily: "system-ui, sans-serif",
          position: "relative", overflow: "hidden",
          transform: `scale(${SCALE})`, transformOrigin: "top left",
        }}
      >
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

        {/* ── POKEMON GRID ──
            6 cards fit cleanly in the 1200px canvas:
            padding 32 each side = 1136 available
            6 × 176 card width + 5 × 16 gap = 1136 ✓                          */}
        <div style={{
          display: "flex", flex: 1, alignItems: "center", justifyContent: "center",
          padding: "0 32px", position: "relative",
        }}>
          <div style={{
            display: "flex", alignItems: "flex-start", justifyContent: "center", gap: 16,
          }}>
            {team.map((mon, i) => {
              const spriteUrl = spriteDataUris[i];

              return (
                <div key={i} style={{
                  display: "flex", flexDirection: "column", alignItems: "center",
                  width: 176, flexShrink: 0,
                }}>
                  {/* Card — simplified shadow keeps render cost manageable at 2x */}
                  <div style={{
                    display: "flex", flexDirection: "column", alignItems: "center",
                    width: 176, borderRadius: 20,
                    background: "rgba(255,255,255,0.03)",
                    border: "2px solid rgba(255,255,255,0.08)",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.28)",
                    position: "relative", overflow: "hidden", paddingBottom: 16,
                  }}>
                    {/* Sprite area */}
                    <div style={{
                      display: "flex", alignItems: "center", justifyContent: "center",
                      width: "100%", height: 156, position: "relative",
                    }}>
                      {spriteUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={spriteUrl} alt={mon.species}
                          width={148} height={148}
                          style={{ objectFit: "contain", position: "relative" }}
                        />
                      ) : (
                        /* Fallback if sprite fetch failed — keeps layout stable */
                        <div style={{
                          display: "flex", alignItems: "center", justifyContent: "center",
                          width: 120, height: 120, borderRadius: "50%",
                          background: "rgba(255,255,255,0.04)",
                          border: "2px solid rgba(255,255,255,0.08)",
                          fontSize: 52, color: "#4A4A6A", position: "relative",
                        }}>
                          ?
                        </div>
                      )}
                    </div>

                    {/* Type badges row */}
                    {mon.types.length > 0 && (
                      <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
                        {mon.types.map((t, ti) => (
                          <div key={ti} style={{
                            fontSize: 11, fontWeight: 800, letterSpacing: "0.04em",
                            color: TYPE_TEXT[t] ?? "#FFFFFF",
                            background: TYPE_BG[t] ?? "#666",
                            padding: "3px 8px", borderRadius: 5,
                            textTransform: "uppercase",
                          }}>
                            {t}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Species name */}
                    <div style={{
                      fontSize: 16, fontWeight: 700, color: "#E0DEF0",
                      textAlign: "center", maxWidth: 160,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      padding: "0 8px",
                    }}>
                      {mon.species}
                    </div>

                    {/* Item badge */}
                    {mon.item && (
                      <div style={{
                        display: "flex", alignItems: "center", justifyContent: "center",
                        marginTop: 6, padding: "2px 10px", borderRadius: 6,
                        background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)",
                        maxWidth: 160,
                      }}>
                        <span style={{
                          fontSize: 12, fontWeight: 600, color: "#9A98BE",
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        }}>
                          {mon.item}
                        </span>
                      </div>
                    )}

                    {/* Tera type indicator */}
                    {mon.teraType && (
                      <div style={{
                        display: "flex", alignItems: "center", gap: 5, marginTop: 6,
                      }}>
                        <div style={{
                          width: 10, height: 10, borderRadius: 2, transform: "rotate(45deg)",
                          background: TYPE_BG[mon.teraType] ?? "#888",
                          display: "flex",
                        }} />
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#7876A0" }}>
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
      </div>
    ),
    { width: W, height: H },
  );
}
