import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "VGC Team Report";
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
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Pokeball icon */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 80,
            height: 80,
            borderRadius: "50%",
            background: "#6366f1",
            marginBottom: 32,
            boxShadow: "0 0 60px rgba(99, 102, 241, 0.4)",
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: "white",
              border: "3px solid #4f46e5",
            }}
          />
        </div>

        <div
          style={{
            fontSize: 56,
            fontWeight: 800,
            color: "#f8fafc",
            letterSpacing: "-0.02em",
            marginBottom: 16,
          }}
        >
          VGC Team Report
        </div>

        <div
          style={{
            fontSize: 24,
            color: "#94a3b8",
            maxWidth: 600,
            textAlign: "center",
            lineHeight: 1.4,
          }}
        >
          Build, share, and present professional VGC team reports
        </div>

        {/* Accent bar */}
        <div
          style={{
            marginTop: 40,
            width: 120,
            height: 4,
            borderRadius: 2,
            background: "linear-gradient(90deg, #6366f1, #a5b4fc)",
          }}
        />
      </div>
    ),
    { ...size }
  );
}
