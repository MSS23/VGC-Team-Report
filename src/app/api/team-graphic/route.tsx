import { ImageResponse } from "next/og";
import { getDb } from "@/lib/db";
import { apiGuard } from "@/lib/security/api-guard";
import { NextResponse } from "next/server";
import { resolveSlug as toSpriteSlug } from "@/lib/utils/sprite-slug";
import { POKEMON_DATA } from "@/lib/data/pokemon";

export const runtime = "edge";

interface OGPokemon {
  species: string;
  item: string | null;
  ability: string | null;
  teraType: string | null;
  types: string[];
}

function parseTeamForGraphic(paste: string): OGPokemon[] {
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
      if (/^Ability:\s*/i.test(line)) ability = line.replace(/^Ability:\s*/i, "").trim();
      else if (/^Tera Type:\s*/i.test(line)) teraType = line.replace(/^Tera Type:\s*/i, "").trim();
    }

    const slug = species.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
    const data = POKEMON_DATA[slug];
    const types: string[] = data ? [...data.types] : [];

    if (species) team.push({ species, item, ability, teraType, types });
  }

  return team.slice(0, 6);
}

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
    return { bg: "rgba(250,204,21,0.12)", border: "rgba(250,204,21,0.45)", text: "#FCD34D" };
  }
  if (p === "2nd" || p === "2" || p === "finalist" || p === "runner-up") {
    return { bg: "rgba(203,213,225,0.10)", border: "rgba(203,213,225,0.35)", text: "#E2E8F0" };
  }
  if (p === "3rd" || p === "3") {
    return { bg: "rgba(251,146,60,0.10)", border: "rgba(251,146,60,0.35)", text: "#FDBA74" };
  }
  return { bg: "rgba(244,63,94,0.08)", border: "rgba(244,63,94,0.25)", text: "#FDA4AF" };
}

/**
 * GET /api/team-graphic?id=SHARE_ID&style=compact|wide
 * Generates a downloadable team graphic PNG for content creators.
 */
export async function GET(request: Request) {
  const guard = await apiGuard(request, { rateLimit: { key: "graphic", max: 10 } });
  if (guard) return guard;

  const url = new URL(request.url);
  const shareId = url.searchParams.get("id");
  const style = url.searchParams.get("style") ?? "wide";

  if (!shareId) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const sql = getDb();
  const rows = await sql`SELECT data FROM shares WHERE id = ${shareId} AND deleted_at IS NULL`;
  if (rows.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const data = rows[0].data as Record<string, unknown>;
  const paste = (data.paste as string) ?? "";
  const tournamentName = (data.tournamentName as string) ?? "";
  const placement = (data.placement as string) ?? "";
  const creatorName = (data.creatorName as string) ?? "";
  const record = (data.record as string) ?? "";
  const tags = (data.tags as { archetype?: string[]; regulation?: string; eventType?: string }) ?? {};
  const team = parseTeamForGraphic(paste);

  const isWide = style === "wide";
  const sz = isWide ? { width: 1200, height: 400 } : { width: 800, height: 600 };
  const SPRITE_BASE = "https://play.pokemonshowdown.com/sprites";
  const placementColors = placement ? getPlacementStyle(placement) : null;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%", height: "100%", display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          background: "linear-gradient(165deg, #080812 0%, #0B0B1E 30%, #0F0D25 55%, #080810 100%)",
          fontFamily: "system-ui, sans-serif", padding: isWide ? "28px 40px" : "32px 40px",
          position: "relative", overflow: "hidden",
          gap: isWide ? 16 : 24,
        }}
      >
        {/* Top accent */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 3, display: "flex",
          background: "linear-gradient(90deg, transparent 5%, rgba(225,29,72,0.6) 28%, rgba(139,92,246,0.5) 50%, rgba(99,102,241,0.4) 72%, transparent 95%)",
        }} />

        {/* Header */}
        {(tournamentName || creatorName) && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {tournamentName && (
                <div style={{ fontSize: isWide ? 22 : 26, fontWeight: 800, color: "#F0EEF8", letterSpacing: "-0.02em" }}>
                  {tournamentName}
                </div>
              )}
              {placement && placementColors && (
                <div style={{
                  fontSize: isWide ? 14 : 16, fontWeight: 800, color: placementColors.text,
                  background: placementColors.bg, border: `1.5px solid ${placementColors.border}`,
                  padding: "3px 12px", borderRadius: 7,
                }}>
                  {placement}
                </div>
              )}
              {record && (
                <div style={{
                  fontSize: isWide ? 13 : 15, fontWeight: 700, color: "#A0A0C0",
                  background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)",
                  padding: "3px 10px", borderRadius: 6,
                }}>
                  {record}
                </div>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {creatorName && (
                <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: isWide ? 13 : 15 }}>
                  <span style={{ color: "#505068" }}>by</span>
                  <span style={{ color: "#9898BE", fontWeight: 600 }}>{creatorName}</span>
                </div>
              )}
              {tags.regulation && (
                <div style={{
                  fontSize: 11, fontWeight: 700, color: "#8B8BBA",
                  background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.18)",
                  padding: "2px 8px", borderRadius: 4,
                }}>
                  {tags.regulation}
                </div>
              )}
              {tags.archetype && tags.archetype.slice(0, 2).map((arch, i) => (
                <div key={i} style={{
                  fontSize: 11, fontWeight: 700, color: "#8A8AAA",
                  background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
                  padding: "2px 8px", borderRadius: 4,
                }}>
                  {arch}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pokemon row */}
        <div style={{
          display: "flex", alignItems: "flex-start", justifyContent: "center",
          gap: isWide ? 10 : 14, flexWrap: "wrap",
        }}>
          {team.map((mon, i) => {
            const spriteUrl = `${SPRITE_BASE}/home/${toSpriteSlug(mon.species)}.png`;
            const spriteSize = isWide ? 68 : 84;
            const cardW = isWide ? 110 : 130;

            return (
              <div key={i} style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
              }}>
                <div style={{
                  display: "flex", flexDirection: "column", alignItems: "center",
                  width: cardW, borderRadius: 14, paddingBottom: 10, paddingTop: 4,
                  background: "linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)",
                  border: "1px solid rgba(255,255,255,0.055)",
                  boxShadow: "0 6px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)",
                }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={spriteUrl} alt={mon.species} width={spriteSize} height={spriteSize} style={{ objectFit: "contain" }} />
                  {/* Type badges */}
                  {mon.types.length > 0 && (
                    <div style={{ display: "flex", gap: 3, marginBottom: 4 }}>
                      {mon.types.map((t, ti) => (
                        <div key={ti} style={{
                          fontSize: 8, fontWeight: 800, color: TYPE_TEXT[t] ?? "#FFF",
                          background: TYPE_BG[t] ?? "#666", padding: "1px 5px", borderRadius: 3,
                          textTransform: "uppercase", letterSpacing: "0.04em",
                        }}>
                          {t}
                        </div>
                      ))}
                    </div>
                  )}
                  <div style={{
                    fontSize: isWide ? 11 : 13, fontWeight: 700, color: "#D0CEE0",
                    textAlign: "center", maxWidth: cardW - 10,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {mon.species}
                  </div>
                  {mon.item && (
                    <div style={{ fontSize: isWide ? 9 : 10, color: "#6A6A88", textAlign: "center", marginTop: 2 }}>
                      {mon.item}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Branding */}
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          position: "absolute", bottom: 12, right: 24,
        }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#3A3A58" }}>
            pokemonvgcteamreport.com
          </div>
        </div>
      </div>
    ),
    { ...sz },
  );
}
