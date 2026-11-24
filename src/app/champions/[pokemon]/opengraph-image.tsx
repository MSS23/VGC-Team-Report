import { ImageResponse } from "next/og";
import { megaGuideSpriteUrl } from "./og-sprite";

// Node, not edge: fetches to play.pokemonshowdown.com from edge functions time out in production.
export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Convert a URL slug like "kangaskhan-mega" to a display name like "Kangaskhan-Mega". */
function slugToDisplayName(slug: string): string {
  return slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("-");
}

export default async function Image({
  params,
}: {
  params: Promise<{ pokemon: string }>;
}) {
  const { pokemon } = await params;
  const displayName = slugToDisplayName(pokemon);
  const spriteUrl = megaGuideSpriteUrl(pokemon);

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
          background: "linear-gradient(135deg, #0B0B1A 0%, #1A1035 40%, #0B0B1A 100%)",
          fontFamily: "system-ui, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Grid pattern */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.04) 1px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />

        {/* Top accent bar */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background:
              "linear-gradient(90deg, transparent 5%, rgba(225,29,72,0.7) 30%, rgba(139,92,246,0.6) 55%, rgba(99,102,241,0.5) 75%, transparent 95%)",
          }}
        />

        {/* Glow orb top-right */}
        <div
          style={{
            position: "absolute",
            top: -80,
            right: -80,
            width: 350,
            height: 350,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(225,29,72,0.18) 0%, transparent 70%)",
          }}
        />

        {/* Glow orb bottom-left */}
        <div
          style={{
            position: "absolute",
            bottom: -60,
            left: -60,
            width: 300,
            height: 300,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(139,92,246,0.14) 0%, transparent 70%)",
          }}
        />

        {/* Pokemon sprite */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 200,
            height: 200,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.01) 60%, transparent 80%)",
            marginBottom: 24,
            position: "relative",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={spriteUrl}
            alt={displayName}
            width={180}
            height={180}
            style={{ objectFit: "contain", filter: "drop-shadow(0 8px 24px rgba(225,29,72,0.3))" }}
          />
        </div>

        {/* Pokemon name */}
        <div
          style={{
            fontSize: 54,
            fontWeight: 800,
            color: "#F0EDE6",
            letterSpacing: "-0.02em",
            marginBottom: 10,
            textAlign: "center",
          }}
        >
          {displayName}
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: 22,
            fontWeight: 600,
            color: "#E11D48",
            marginBottom: 20,
            textAlign: "center",
          }}
        >
          VGC Team Report — Regulation M-A
        </div>

        {/* Accent bar */}
        <div
          style={{
            width: 120,
            height: 4,
            borderRadius: 2,
            background: "linear-gradient(90deg, #8B5CF6, #E11D48, #FB7185)",
          }}
        />

        {/* Brand footer */}
        <div
          style={{
            position: "absolute",
            bottom: 28,
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
    { ...size }
  );
}
