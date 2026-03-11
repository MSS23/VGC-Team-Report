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

function toSpriteSlug(species: string): string {
  const slug = species
    .toLowerCase()
    .replace(/♂/g, "m")
    .replace(/♀/g, "f")
    .replace(/[éè]/g, "e")
    .replace(/[''.:\u2019]/g, "")
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  const overrides: Record<string, string> = {
    "ho-oh": "hooh", "type-null": "typenull", "mr-mime": "mrmime",
    "mr-rime": "mrrime", "mime-jr": "mimejr", "tapu-koko": "tapukoko",
    "tapu-lele": "tapulele", "tapu-bulu": "tapubulu", "tapu-fini": "tapufini",
    "jangmo-o": "jangmoo", "hakamo-o": "hakamoo", "kommo-o": "kommoo",
    "urshifu-rapid-strike": "urshifu-rapidstrike",
    "necrozma-dusk-mane": "necrozma-duskmane",
    "necrozma-dawn-wings": "necrozma-dawnwings",
    "flutter-mane": "fluttermane", "iron-hands": "ironhands",
    "iron-bundle": "ironbundle", "iron-valiant": "ironvaliant",
    "iron-moth": "ironmoth", "iron-thorns": "ironthorns",
    "iron-jugulis": "ironjugulis", "iron-leaves": "ironleaves",
    "iron-boulder": "ironboulder", "iron-crown": "ironcrown",
    "great-tusk": "greattusk", "brute-bonnet": "brutebonnet",
    "scream-tail": "screamtail", "sandy-shocks": "sandyshocks",
    "slither-wing": "slitherwing", "roaring-moon": "roaringmoon",
    "walking-wake": "walkingwake", "gouging-fire": "gougingfire",
    "raging-bolt": "ragingbolt", "chien-pao": "chienpao",
    "chi-yu": "chiyu", "ting-lu": "tinglu", "wo-chien": "wochien",
    "bloodmoon-ursaluna": "ursaluna-bloodmoon",
    "oricorio-pom-pom": "oricorio-pompom",
    "mr-mime-galar": "mrmime-galar",
  };

  return overrides[slug] ?? slug;
}

function toItemSlug(item: string): string {
  return item
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+/g, "-");
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
    const rows = await sql`SELECT data FROM shares WHERE id = ${id}`;
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
          background: "linear-gradient(135deg, #0B0B1A 0%, #141428 40%, #0B0B1A 100%)",
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

        {/* Glow behind team */}
        <div
          style={{
            position: "absolute",
            top: "40%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 600,
            height: 300,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(225,29,72,0.08) 0%, transparent 70%)",
          }}
        />

        {/* Tournament header */}
        {hasHeader && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              marginBottom: 8,
            }}
          >
            {tournamentName && (
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 800,
                  color: "#F0EDE6",
                  letterSpacing: "-0.01em",
                }}
              >
                {tournamentName}
              </div>
            )}
            {placement && (
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  color: "#E11D48",
                  background: "rgba(225,29,72,0.12)",
                  border: "1px solid rgba(225,29,72,0.25)",
                  padding: "4px 14px",
                  borderRadius: 6,
                }}
              >
                {placement}
              </div>
            )}
          </div>
        )}
        {creatorName && (
          <div
            style={{
              fontSize: 17,
              color: "#8A8AA3",
              marginBottom: 24,
            }}
          >
            by {creatorName}
          </div>
        )}
        {hasHeader && !creatorName && <div style={{ marginBottom: 24 }} />}

        {/* Pokemon row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 24,
            marginTop: hasHeader ? 0 : 20,
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
                {/* Sprite container with subtle glow */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 140,
                    height: 140,
                    borderRadius: 20,
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    position: "relative",
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={spriteUrl}
                    alt={mon.species}
                    width={100}
                    height={100}
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
                        background: "rgba(20,20,40,0.85)",
                        borderRadius: 8,
                        border: "1px solid rgba(255,255,255,0.1)",
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
                    color: "#C0C0D8",
                    textAlign: "center",
                    maxWidth: 140,
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

        {/* Bottom branding */}
        <div
          style={{
            position: "absolute",
            bottom: 28,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          {/* Mini pokeball */}
          <div
            style={{
              width: 20,
              height: 20,
              borderRadius: "50%",
              background: "#E11D48",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: "white",
                border: "1.5px solid #BE123C",
              }}
            />
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#4A4A68" }}>
            VGC Team Report
          </div>
          <div
            style={{
              width: 4,
              height: 4,
              borderRadius: "50%",
              background: "#2A2A52",
            }}
          />
          <div style={{ fontSize: 14, color: "#4A4A68" }}>
            vgc-team-report.vercel.app
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
