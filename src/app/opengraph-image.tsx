import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "VGC Team Report — Build, share, and present professional VGC team reports";
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
          background: "linear-gradient(135deg, #0B0B1A 0%, #1C1C38 40%, #0B0B1A 100%)",
          fontFamily: "system-ui, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Subtle grid pattern */}
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
            width: 300,
            height: 300,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(225,29,72,0.15) 0%, transparent 70%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -60,
            left: -60,
            width: 250,
            height: 250,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)",
          }}
        />

        {/* Pokeball icon */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 88,
            height: 88,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #E11D48, #BE123C)",
            marginBottom: 36,
            boxShadow: "0 0 80px rgba(225, 29, 72, 0.35), 0 4px 24px rgba(0,0,0,0.3)",
          }}
        >
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: "50%",
              background: "white",
              border: "3px solid #BE123C",
            }}
          />
        </div>

        <div
          style={{
            fontSize: 60,
            fontWeight: 800,
            color: "#F0EDE6",
            letterSpacing: "-0.02em",
            marginBottom: 16,
          }}
        >
          VGC Team Report
        </div>

        <div
          style={{
            fontSize: 24,
            color: "#8A8AA3",
            maxWidth: 640,
            textAlign: "center",
            lineHeight: 1.5,
          }}
        >
          Build, share, and present professional VGC team reports
        </div>

        {/* Accent bar */}
        <div
          style={{
            marginTop: 40,
            width: 140,
            height: 4,
            borderRadius: 2,
            background: "linear-gradient(90deg, #E11D48, #FB7185, #8B5CF6)",
          }}
        />

        {/* Bottom tagline */}
        <div
          style={{
            position: "absolute",
            bottom: 32,
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 15,
            color: "#4A4A68",
            letterSpacing: "0.05em",
          }}
        >
          vgc-team-report.vercel.app
        </div>
      </div>
    ),
    { ...size }
  );
}
