import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Pokemon Champions VGC Team Reports — Build and share competitive team reports with Mega Evolution support";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
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

        {/* Glow orbs */}
        <div
          style={{
            position: "absolute",
            top: -80,
            right: -80,
            width: 350,
            height: 350,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(225,29,72,0.2) 0%, transparent 70%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -60,
            left: -60,
            width: 300,
            height: 300,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)",
          }}
        />

        {/* Mega Evolution icon */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 88,
            height: 88,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #8B5CF6, #6D28D9)",
            marginBottom: 32,
            boxShadow: "0 0 80px rgba(139, 92, 246, 0.4), 0 4px 24px rgba(0,0,0,0.3)",
          }}
        >
          <div
            style={{
              fontSize: 44,
              fontWeight: 900,
              color: "white",
              lineHeight: 1,
            }}
          >
            M
          </div>
        </div>

        <div
          style={{
            fontSize: 52,
            fontWeight: 800,
            color: "#F0EDE6",
            letterSpacing: "-0.02em",
            marginBottom: 8,
          }}
        >
          Pokemon Champions
        </div>

        <div
          style={{
            fontSize: 32,
            fontWeight: 700,
            color: "#E11D48",
            marginBottom: 20,
          }}
        >
          VGC Team Reports
        </div>

        <div
          style={{
            fontSize: 22,
            color: "#8A8AA3",
            maxWidth: 640,
            textAlign: "center",
            lineHeight: 1.5,
          }}
        >
          Mega Evolution support, matchup plans, damage calcs, and one-click sharing
        </div>

        {/* Accent bar */}
        <div
          style={{
            marginTop: 36,
            width: 140,
            height: 4,
            borderRadius: 2,
            background: "linear-gradient(90deg, #8B5CF6, #E11D48, #FB7185)",
          }}
        />

        {/* Bottom tagline */}
        <div
          style={{
            position: "absolute",
            bottom: 32,
            display: "flex",
            alignItems: "center",
            gap: 12,
            fontSize: 15,
            color: "#4A4A68",
            letterSpacing: "0.05em",
          }}
        >
          <span>pokemonvgcteamreport.com/champions</span>
          <span style={{ color: "#E11D48" }}>|</span>
          <span>Regulation M-A</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
