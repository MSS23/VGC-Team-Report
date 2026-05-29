"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import type { ParsedPokemon } from "@/lib/types/pokemon";
import { teamToOpenSheet } from "@/lib/utils/export-paste";
import { resolveSlug, getSpriteUrls } from "@/lib/utils/sprite-slug";

interface OTSSheetModalProps {
  pokemon: ParsedPokemon[];
  shareUrl?: string;
  tournamentName?: string;
  teamName?: string;
  regulation?: string;
  eventType?: string;
  onClose: () => void;
}

/** Generate a regulation-layout OTS PDF using jspdf vector text (not screenshot). */
async function generateOtsPdf(
  pokemon: ParsedPokemon[],
  opts: { teamName?: string; tournamentName?: string; regulation?: string; eventType?: string },
): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const ML = 10;  // margin left
  const MT = 10;  // margin top
  const PW = 190; // printable width (210 - 2*10)

  // Truncate text to fit within maxW mm at the current font/size
  const trunc = (text: string | null | undefined, maxW: number): string => {
    const t = text || "—";
    if (pdf.getTextWidth(t) <= maxW) return t;
    let s = t;
    while (s.length > 1 && pdf.getTextWidth(s + "…") > maxW) s = s.slice(0, -1);
    return s + "…";
  };

  // ── TITLE HEADER ──────────────────────────────────────────────────────────
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(13);
  pdf.text("VGC OPEN TEAM SHEET", ML + PW / 2, MT + 6, { align: "center" });

  let y = MT + 11;
  pdf.setLineWidth(0.3);
  pdf.line(ML, y, ML + PW, y);

  // ── PLAYER INFO ───────────────────────────────────────────────────────────
  y += 7;
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8.5);
  pdf.text("Player Name:", ML, y);
  pdf.setLineWidth(0.2);
  pdf.line(ML + 27, y, ML + 93, y);
  pdf.text("Trainer ID:", ML + 100, y);
  pdf.line(ML + 120, y, ML + PW, y);

  // ── TABLE ─────────────────────────────────────────────────────────────────
  y += 6;
  const TABLE_TOP = y;
  const COL_H = 8;   // header row height
  const ROW_H = 11;  // data row height
  const NUM_ROWS = 6;

  // Column definitions [label, widthMm] — total must equal PW (190mm)
  // 7+32+9+27+26+17+18+18+18+18 = 190
  const COLS: [string, number][] = [
    ["#",          7],
    ["Pokemon",   32],
    ["Sex",        9],
    ["Held Item", 27],
    ["Ability",   26],
    ["Tera Type", 17],
    ["Move 1",    18],
    ["Move 2",    18],
    ["Move 3",    18],
    ["Move 4",    18],
  ];

  const TABLE_H = COL_H + NUM_ROWS * ROW_H;

  // Outer border
  pdf.setLineWidth(0.5);
  pdf.rect(ML, TABLE_TOP, PW, TABLE_H, "S");

  // Header fill
  pdf.setFillColor(220, 220, 220);
  pdf.rect(ML, TABLE_TOP, PW, COL_H, "F");

  // Vertical column separators
  let cx = ML;
  pdf.setLineWidth(0.3);
  for (let c = 0; c < COLS.length - 1; c++) {
    cx += COLS[c][1];
    pdf.line(cx, TABLE_TOP, cx, TABLE_TOP + TABLE_H);
  }

  // Horizontal row separators (between data rows only)
  for (let r = 1; r < NUM_ROWS; r++) {
    const lineY = TABLE_TOP + COL_H + r * ROW_H;
    pdf.line(ML, lineY, ML + PW, lineY);
  }

  // Header labels
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(6.5);
  cx = ML;
  for (const [label, w] of COLS) {
    pdf.text(label, cx + w / 2, TABLE_TOP + COL_H / 2 + 1.5, { align: "center" });
    cx += w;
  }

  // Data rows
  pdf.setFont("helvetica", "normal");
  for (let r = 0; r < NUM_ROWS; r++) {
    const mon = pokemon[r];
    const rowY = TABLE_TOP + COL_H + r * ROW_H;
    const midY = rowY + ROW_H / 2 + 1.5;

    cx = ML;

    // Row number
    pdf.setFontSize(8);
    pdf.setFont("helvetica", "bold");
    pdf.text(String(r + 1), cx + COLS[0][1] / 2, midY, { align: "center" });
    pdf.setFont("helvetica", "normal");
    cx += COLS[0][1];

    if (!mon) { continue; }

    // Species
    pdf.setFontSize(7);
    pdf.text(trunc(mon.species, COLS[1][1] - 2), cx + 1, midY);
    cx += COLS[1][1];

    // Gender
    const sex = mon.gender === "M" ? "M" : mon.gender === "F" ? "F" : "-";
    pdf.setFontSize(7.5);
    pdf.text(sex, cx + COLS[2][1] / 2, midY, { align: "center" });
    cx += COLS[2][1];

    // Held Item / Ability / Tera Type
    pdf.setFontSize(6.5);
    pdf.text(trunc(mon.item, COLS[3][1] - 2), cx + 1, midY);
    cx += COLS[3][1];
    pdf.text(trunc(mon.ability, COLS[4][1] - 2), cx + 1, midY);
    cx += COLS[4][1];
    pdf.text(trunc(mon.teraType, COLS[5][1] - 2), cx + 1, midY);
    cx += COLS[5][1];

    // Moves 1-4
    for (let m = 0; m < 4; m++) {
      const mw = COLS[6 + m][1];
      pdf.text(trunc(mon.moves[m], mw - 2), cx + 1, midY);
      cx += mw;
    }
  }

  // ── FOOTER ────────────────────────────────────────────────────────────────
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(7);
  pdf.setTextColor(130, 130, 130);
  const footerParts: string[] = [];
  if (opts.regulation) footerParts.push(opts.regulation);
  if (opts.eventType) footerParts.push(opts.eventType);
  footerParts.push(new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }));
  pdf.text(footerParts.join("  ·  "), ML + PW / 2, 285, { align: "center" });
  pdf.text("pokemonvgcteamreport.com", ML + PW / 2, 289, { align: "center" });

  const safeName = ((opts.teamName || opts.tournamentName || "team")
    .replace(/[^a-z0-9]+/gi, "-").toLowerCase());
  pdf.save(`${safeName}-ots.pdf`);
}

function SpriteImg({ species }: { species: string }) {
  const slug = resolveSlug(species);
  const urls = getSpriteUrls(species).map(
    (u) => `/api/sprite?u=${encodeURIComponent(u)}`,
  );
  const [idx, setIdx] = useState(0);
  const src = urls[Math.min(idx, urls.length - 1)];
  return (
    <img
      src={src}
      alt={slug}
      width={72}
      height={72}
      crossOrigin="anonymous"
      className="w-16 h-16 sm:w-[72px] sm:h-[72px] object-contain drop-shadow-sm"
      onError={() => setIdx((i) => Math.min(i + 1, urls.length - 1))}
    />
  );
}

function PokemonCard({ mon }: { mon: ParsedPokemon }) {
  const displayName = mon.nickname ? `${mon.nickname} (${mon.species})` : mon.species;
  return (
    <div className="flex gap-3 p-3 bg-surface border border-border rounded-xl">
      <div className="flex-shrink-0 flex items-center justify-center w-[72px]">
        <SpriteImg species={mon.species} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 mb-1">
          <span className="text-sm font-bold text-text-primary leading-tight truncate">{displayName}</span>
          {mon.item && (
            <span className="text-xs text-text-tertiary font-medium">@ {mon.item}</span>
          )}
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 mb-1.5">
          {mon.ability && (
            <span className="text-[11px] text-text-secondary">
              <span className="text-text-tertiary">Ability: </span>{mon.ability}
            </span>
          )}
          {mon.teraType && (
            <span className="text-[11px] text-text-secondary">
              <span className="text-text-tertiary">Tera: </span>{mon.teraType}
            </span>
          )}
        </div>
        <ul className="grid grid-cols-2 gap-x-3 gap-y-0">
          {mon.moves.map((move, i) => (
            <li key={i} className="text-[11px] text-text-secondary truncate">
              <span className="text-text-tertiary">— </span>{move}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function OTSSheetModal({
  pokemon,
  shareUrl,
  tournamentName,
  teamName,
  regulation,
  eventType,
  onClose,
}: OTSSheetModalProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState<"png" | "pdf" | false>(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!shareUrl) return;
    import("qrcode").then((QRCode) =>
      QRCode.default.toDataURL(shareUrl, {
        width: 128,
        margin: 1,
        color: { dark: "#000000", light: "#ffffff" },
      }).then(setQrDataUrl),
    );
  }, [shareUrl]);

  const handleCopyText = useCallback(() => {
    const text = teamToOpenSheet(pokemon);
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [pokemon]);

  const handleDownloadPng = useCallback(async () => {
    if (!sheetRef.current) return;
    setDownloading("png");
    try {
      const { default: html2canvas } = await import("html2canvas-pro");
      const canvas = await html2canvas(sheetRef.current, {
        useCORS: true,
        allowTaint: false,
        scale: 2,
        backgroundColor: null,
      });
      const link = document.createElement("a");
      link.download = `ots-sheet${teamName ? `-${teamName.replace(/\s+/g, "-").toLowerCase()}` : ""}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } finally {
      setDownloading(false);
    }
  }, [teamName]);

  const handleDownloadPdf = useCallback(async () => {
    setDownloading("pdf");
    try {
      await generateOtsPdf(pokemon, { teamName, tournamentName, regulation, eventType });
    } finally {
      setDownloading(false);
    }
  }, [pokemon, teamName, tournamentName, regulation, eventType]);

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  }, [onClose]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-sm safe-x"
      onClick={handleBackdropClick}
    >
      <div className="relative w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] flex flex-col bg-background rounded-2xl shadow-2xl overflow-hidden border border-border">
        {/* Header */}
        <div className="flex items-center justify-between gap-2 px-4 sm:px-5 py-3 sm:py-4 border-b border-border flex-shrink-0">
          <div className="min-w-0">
            <h2 className="text-base font-bold text-text-primary">Open Team Sheet</h2>
            {(tournamentName || teamName) && (
              <p className="text-xs text-text-tertiary mt-0.5 truncate">{teamName || tournamentName}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex-shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-surface-alt transition-colors text-text-tertiary hover:text-text-primary"
            aria-label="Close"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Sheet (captured by html2canvas for PNG export) */}
        <div className="overflow-y-auto overflow-x-hidden flex-1">
          <div ref={sheetRef} className="p-4 sm:p-5 bg-background">
            <div className="flex items-start justify-between gap-3 sm:gap-4 mb-4">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-extrabold text-text-tertiary uppercase tracking-widest mb-0.5">Open Team Sheet</p>
                {(teamName || tournamentName) && (
                  <p className="text-sm font-bold text-text-primary break-words">{teamName || tournamentName}</p>
                )}
                <p className="text-[11px] text-text-tertiary mt-0.5">Species · Item · Ability · Tera · Moves</p>
              </div>
              {qrDataUrl && shareUrl && (
                <div className="flex-shrink-0 flex flex-col items-center gap-1">
                  <img
                    src={qrDataUrl}
                    alt="QR code for this team report"
                    width={96}
                    height={96}
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg border border-border"
                    crossOrigin="anonymous"
                  />
                  <p className="text-[9px] text-text-tertiary text-center max-w-[96px] leading-tight">Scan for full report</p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {pokemon.map((mon, i) => (
                <PokemonCard key={i} mon={mon} />
              ))}
            </div>

            {shareUrl && (
              <p className="text-[10px] text-text-tertiary text-center mt-3 font-mono break-all">{shareUrl}</p>
            )}
          </div>
        </div>

        {/* Action bar */}
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-2 px-4 sm:px-5 py-3 border-t border-border flex-shrink-0 bg-surface safe-bottom">
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={!!downloading}
            className="flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 min-h-[44px] rounded-xl bg-accent text-white text-sm font-bold hover:brightness-110 transition-all disabled:opacity-60 disabled:cursor-wait"
          >
            {downloading === "pdf" ? (
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="12" y1="18" x2="12" y2="12" /><polyline points="9 15 12 18 15 15" />
              </svg>
            )}
            {downloading === "pdf" ? "Saving…" : "Download OTS PDF"}
          </button>
          <button
            type="button"
            onClick={handleDownloadPng}
            disabled={!!downloading}
            className="flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 min-h-[44px] rounded-xl border border-border bg-surface-alt text-sm font-semibold text-text-secondary hover:text-accent hover:border-accent/40 transition-all disabled:opacity-60 disabled:cursor-wait"
          >
            {downloading === "png" ? (
              <span className="w-3.5 h-3.5 border-2 border-current/30 border-t-current rounded-full animate-spin" />
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            )}
            {downloading === "png" ? "Saving…" : "Save as PNG"}
          </button>
          <button
            type="button"
            onClick={handleCopyText}
            disabled={!!downloading}
            className="flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 min-h-[44px] rounded-xl border border-border bg-surface-alt text-sm font-semibold text-text-secondary hover:text-accent hover:border-accent/40 transition-all disabled:opacity-60"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
            </svg>
            {copied ? "Copied!" : "Copy text OTS"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
