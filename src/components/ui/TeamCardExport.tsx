"use client";

import { useRef, useState } from "react";

interface TeamCardExportProps {
  teamName: string;
  playerName?: string;
  tournamentName?: string;
  teamSpecies: string[]; // max 6
  format?: string;
  onExported?: () => void;
}

export function TeamCardExport({
  teamName,
  playerName,
  tournamentName,
  teamSpecies,
  format,
  onExported,
}: TeamCardExportProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    if (!cardRef.current || exporting) return;
    setExportError(null);
    setExporting(true);
    try {
      const { default: html2canvas } = await import("html2canvas-pro");
      const canvas = await html2canvas(cardRef.current, {
        useCORS: true,
        scale: 2,
        backgroundColor: null,
      });
      const link = document.createElement("a");
      link.download = `${teamName.toLowerCase().replace(/\s+/g, "-")}-team-card.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      onExported?.();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Export failed";
      setExportError(
        msg.toLowerCase().includes("image") || msg.toLowerCase().includes("cors")
          ? "Some sprites failed to load. Try again in a moment."
          : "Export failed. Please try again."
      );
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      {/* Hidden card positioned off-screen for capture */}
      <div
        ref={cardRef}
        className="absolute -left-[9999px] top-0 w-[600px] h-[338px] rounded-2xl overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
        }}
        aria-hidden="true"
      >
        {/* Header */}
        <div className="px-8 pt-6 pb-3">
          <div
            style={{
              color: "rgba(255,255,255,0.5)",
              fontSize: "10px",
              textTransform: "uppercase",
              letterSpacing: "0.2em",
              fontWeight: 700,
            }}
          >
            VGC Team Report
          </div>
          {playerName && (
            <div
              style={{
                color: "#fff",
                fontSize: "20px",
                fontWeight: 800,
                marginTop: "2px",
              }}
            >
              {playerName}
            </div>
          )}
          {tournamentName && (
            <div
              style={{
                color: "rgba(255,255,255,0.7)",
                fontSize: "14px",
                marginTop: "2px",
              }}
            >
              {tournamentName}
            </div>
          )}
          {format && (
            <div
              style={{
                display: "inline-block",
                marginTop: "6px",
                padding: "2px 8px",
                borderRadius: "9999px",
                background: "rgba(255,255,255,0.1)",
                color: "rgba(255,255,255,0.8)",
                fontSize: "10px",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
              }}
            >
              {format}
            </div>
          )}
        </div>

        {/* Pokémon sprites */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            padding: "8px 24px",
          }}
        >
          {teamSpecies.slice(0, 6).map((species, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "4px",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/sprite?species=${encodeURIComponent(species)}`}
                alt={species}
                width={88}
                height={88}
                style={{ imageRendering: "pixelated" }}
              />
              <span
                style={{
                  color: "rgba(255,255,255,0.7)",
                  fontSize: "9px",
                  fontWeight: 700,
                  textTransform: "capitalize",
                  textAlign: "center",
                  lineHeight: 1.2,
                  maxWidth: "80px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {species.replace(/-/g, " ")}
              </span>
            </div>
          ))}
        </div>

        {/* Footer watermark */}
        <div
          style={{
            position: "absolute",
            bottom: "12px",
            right: "20px",
            color: "rgba(255,255,255,0.3)",
            fontSize: "9px",
            fontWeight: 500,
          }}
        >
          pokemonvgcteamreport.com
        </div>
      </div>

      {/* Error message */}
      {exportError && (
        <p role="alert" className="text-xs text-red-500 mb-2 px-1">{exportError}</p>
      )}

      {/* Export button — rendered in-flow */}
      <button
        type="button"
        onClick={handleExport}
        disabled={exporting}
        aria-busy={exporting}
        className="flex items-center gap-3 px-4 py-3 rounded-xl bg-surface-alt border border-border hover:bg-surface-alt/80 hover:border-accent/40 transition-all text-left w-full group cursor-pointer disabled:opacity-60 disabled:cursor-wait"
      >
        <div className="w-9 h-9 rounded-lg bg-surface border border-border flex items-center justify-center flex-shrink-0">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-accent group-hover:scale-110 transition-transform"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M3 9h18M9 21V9" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold text-text-primary group-hover:text-accent transition-colors">
            {exporting ? "Generating…" : "Download Team Card"}
          </div>
          <div className="text-[11px] text-text-tertiary">
            {exporting ? "Please wait" : "Save as PNG image"}
          </div>
        </div>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-text-tertiary group-hover:text-accent transition-colors flex-shrink-0"
        >
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
      </button>
    </>
  );
}
