import { ImageResponse } from "next/og";
import { getDb } from "@/lib/db";
import { isRateLimited } from "@/lib/rate-limit";
import { NextResponse } from "next/server";

export const runtime = "edge";

function extractTeamFromPaste(paste: string): { species: string; item: string | null }[] {
  const blocks = paste.trim().split(/\n\s*\n/);
  const team: { species: string; item: string | null }[] = [];
  for (const block of blocks) {
    const firstLine = block.trim().split("\n")[0]?.trim();
    if (!firstLine) continue;
    let item: string | null = null;
    const [before, ...rest] = firstLine.split(" @ ");
    if (rest.length > 0) item = rest.join(" @ ").trim();
    let namePart = before.trim().replace(/\s*\([MF]\)\s*$/, "");
    const nicknameMatch = namePart.match(/^.+\((.+)\)$/);
    const species = nicknameMatch ? nicknameMatch[1].trim() : namePart;
    if (species) team.push({ species, item });
  }
  return team.slice(0, 6);
}

function toSpriteSlug(species: string): string {
  const slug = species.toLowerCase()
    .replace(/♂/g, "m").replace(/♀/g, "f").replace(/[éè]/g, "e")
    .replace(/[''.:\u2019]/g, "").replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-").replace(/^-|-$/g, "");
  const overrides: Record<string, string> = {
    "ho-oh": "hooh", "type-null": "typenull", "mr-mime": "mrmime",
    "mr-rime": "mrrime", "mime-jr": "mimejr", "tapu-koko": "tapukoko",
    "tapu-lele": "tapulele", "tapu-bulu": "tapubulu", "tapu-fini": "tapufini",
    "flutter-mane": "fluttermane", "iron-hands": "ironhands",
    "iron-bundle": "ironbundle", "iron-valiant": "ironvaliant",
    "iron-moth": "ironmoth", "iron-thorns": "ironthorns",
    "great-tusk": "greattusk", "brute-bonnet": "brutebonnet",
    "scream-tail": "screamtail", "sandy-shocks": "sandyshocks",
    "slither-wing": "slitherwing", "roaring-moon": "roaringmoon",
    "walking-wake": "walkingwake", "gouging-fire": "gougingfire",
    "raging-bolt": "ragingbolt", "chien-pao": "chienpao",
    "chi-yu": "chiyu", "ting-lu": "tinglu", "wo-chien": "wochien",
    "urshifu-rapid-strike": "urshifu-rapidstrike",
  };
  return overrides[slug] ?? slug;
}

/**
 * GET /api/team-graphic?id=SHARE_ID&style=compact|wide
 * Generates a downloadable team graphic PNG for content creators.
 */
export async function GET(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (isRateLimited(`graphic:${ip}`, 10, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

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
  const team = extractTeamFromPaste(paste);

  const isWide = style === "wide";
  const size = isWide ? { width: 1200, height: 400 } : { width: 800, height: 600 };
  const SPRITE_BASE = "https://play.pokemonshowdown.com/sprites";

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
          background: "linear-gradient(135deg, #0B0B1A 0%, #141428 50%, #0B0B1A 100%)",
          fontFamily: "system-ui, sans-serif",
          padding: 40,
          gap: isWide ? 20 : 30,
        }}
      >
        {/* Header */}
        {(tournamentName || creatorName) && (
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {tournamentName && (
              <div style={{ fontSize: isWide ? 24 : 28, fontWeight: 800, color: "#F0EDE6" }}>
                {tournamentName}
              </div>
            )}
            {placement && (
              <div style={{
                fontSize: isWide ? 16 : 18, fontWeight: 800, color: "#E11D48",
                background: "rgba(225,29,72,0.12)", border: "1px solid rgba(225,29,72,0.25)",
                padding: "4px 12px", borderRadius: 6,
              }}>
                {placement}
              </div>
            )}
            {creatorName && (
              <div style={{ fontSize: isWide ? 14 : 16, color: "#8A8AA3" }}>
                by {creatorName}
              </div>
            )}
          </div>
        )}

        {/* Pokemon row */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          gap: isWide ? 16 : 20, flexWrap: "wrap",
        }}>
          {team.map((mon, i) => {
            const spriteUrl = `${SPRITE_BASE}/home/${toSpriteSlug(mon.species)}.png`;
            return (
              <div key={i} style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
              }}>
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  width: isWide ? 100 : 120, height: isWide ? 100 : 120,
                  borderRadius: 16, background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={spriteUrl} alt={mon.species} width={isWide ? 72 : 88} height={isWide ? 72 : 88} style={{ objectFit: "contain" }} />
                </div>
                <div style={{
                  fontSize: isWide ? 12 : 14, fontWeight: 700, color: "#C0C0D8",
                  textAlign: "center", maxWidth: isWide ? 100 : 120,
                }}>
                  {mon.species}
                </div>
                {mon.item && (
                  <div style={{ fontSize: isWide ? 10 : 11, color: "#6A6A88", textAlign: "center" }}>
                    {mon.item}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Branding */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, position: "absolute", bottom: 16, right: 24 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#3A3A58" }}>
            pokemonvgcteamreport.com
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
