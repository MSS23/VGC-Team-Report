import { ImageResponse } from "next/og";
import { getDb } from "@/lib/db";
import { extractSpecies } from "@/lib/utils/extract-species";

export const runtime = "nodejs";
export const alt = "VGC Team Report";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Fetch share data — identical query pattern to page.tsx
  let species: string[] = [];
  let tournamentName = "";
  let creatorName = "";
  let placement = "";
  let record = "";

  try {
    const sql = getDb();
    const rows =
      await sql`SELECT data FROM shares WHERE id = ${id} AND deleted_at IS NULL`;
    if (rows.length > 0) {
      const data = rows[0].data as Record<string, unknown>;
      species = extractSpecies((data.paste as string) ?? "");
      tournamentName = (data.tournamentName as string) ?? "";
      creatorName = (data.creatorName as string) ?? "";
      placement = (data.placement as string) ?? "";
      record = (data.record as string) ?? "";
    }
  } catch {
    // Fall through to generic image
  }

  // Build display strings
  const speciesLine = species.length > 0 ? species.join("  ·  ") : "";

  // First line: tournament + placement/record, or just tournament
  let headlineLine = "";
  if (tournamentName && placement) {
    headlineLine = `${tournamentName}  —  ${placement}`;
  } else if (tournamentName && record) {
    headlineLine = `${tournamentName}  —  ${record}`;
  } else if (tournamentName) {
    headlineLine = tournamentName;
  } else if (placement) {
    headlineLine = placement;
  }

  const hasData = speciesLine || headlineLine || creatorName;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0B0B1A 0%, #1C1C38 40%, #0B0B1A 100%)",
          fontFamily: "system-ui, sans-serif",
          position: "relative",
          overflow: "hidden",
          padding: "64px 72px",
        }}
      >
        {/* Subtle dot-grid background */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.04) 1px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />

        {/* Top-right glow orb */}
        <div
          style={{
            position: "absolute",
            top: -100,
            right: -100,
            width: 360,
            height: 360,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(225,29,72,0.18) 0%, transparent 70%)",
          }}
        />

        {/* Bottom-left glow orb */}
        <div
          style={{
            position: "absolute",
            bottom: -80,
            left: -80,
            width: 300,
            height: 300,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(139,92,246,0.14) 0%, transparent 70%)",
          }}
        />

        {/* Left accent bar */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 80,
            bottom: 80,
            width: 6,
            borderRadius: "0 3px 3px 0",
            background: "linear-gradient(180deg, #E11D48, #FB7185, #8B5CF6)",
          }}
        />

        {/* Site label — top */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 36,
          }}
        >
          {/* Mini pokeball decoration */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #E11D48, #BE123C)",
            }}
          >
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: "white",
                border: "2px solid #BE123C",
              }}
            />
          </div>
          <div
            style={{
              fontSize: 16,
              fontWeight: 600,
              color: "#6B6B8A",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            VGC Team Report
          </div>
        </div>

        {/* Headline: tournament / placement */}
        {headlineLine && (
          <div
            style={{
              fontSize: 26,
              fontWeight: 700,
              color: "#FB7185",
              letterSpacing: "0.01em",
              marginBottom: 20,
              maxWidth: 980,
              lineHeight: 1.3,
            }}
          >
            {headlineLine}
          </div>
        )}

        {/* Species list — big and bold */}
        {speciesLine ? (
          <div
            style={{
              fontSize: hasData && headlineLine ? 42 : 48,
              fontWeight: 800,
              color: "#F0EDE6",
              letterSpacing: "-0.01em",
              lineHeight: 1.25,
              maxWidth: 1000,
              marginBottom: 32,
            }}
          >
            {speciesLine}
          </div>
        ) : (
          /* Generic fallback if no pokemon data */
          <div
            style={{
              fontSize: 52,
              fontWeight: 800,
              color: "#F0EDE6",
              letterSpacing: "-0.02em",
              marginBottom: 20,
            }}
          >
            VGC Team Report
          </div>
        )}

        {/* Creator byline */}
        {creatorName ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <div
              style={{
                width: 32,
                height: 2,
                background: "linear-gradient(90deg, #E11D48, #8B5CF6)",
                borderRadius: 1,
              }}
            />
            <div
              style={{
                fontSize: 22,
                fontWeight: 500,
                color: "#9090B0",
              }}
            >
              {creatorName}
            </div>
          </div>
        ) : !hasData ? (
          <div
            style={{
              fontSize: 22,
              color: "#6B6B8A",
              maxWidth: 640,
              lineHeight: 1.5,
            }}
          >
            Build, share, and present professional VGC team reports
          </div>
        ) : null}

        {/* Bottom domain watermark */}
        <div
          style={{
            position: "absolute",
            bottom: 32,
            right: 72,
            fontSize: 15,
            color: "#3A3A58",
            letterSpacing: "0.05em",
          }}
        >
          pokemonvgcteamreport.com
        </div>
      </div>
    ),
    { ...size }
  );
}
