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
  onClose: () => void;
}

function SpriteImg({ species }: { species: string }) {
  const slug = resolveSlug(species);
  // Route through the sprite proxy for CORS compatibility with html2canvas
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

export function OTSSheetModal({ pokemon, shareUrl, tournamentName, teamName, onClose }: OTSSheetModalProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const titleId = "ots-sheet-modal-title";
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // Generate QR code for the share URL
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
    setDownloading(true);
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

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  }, [onClose]);

  // Focus trap + Escape handler + focus restore
  useEffect(() => {
    const modal = modalRef.current;
    if (!modal) return;

    // Remember the element that had focus before the modal opened so we can restore it on close
    const previouslyFocused = document.activeElement as HTMLElement | null;

    const focusableSelectors =
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

    // Focus first focusable element on mount
    const firstFocusable = modal.querySelector<HTMLElement>(focusableSelectors);
    firstFocusable?.focus();

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab") return;

      const focusable = Array.from(modal.querySelectorAll<HTMLElement>(focusableSelectors));
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("keydown", handleKey);
      // Restore focus to the element that triggered the modal
      previouslyFocused?.focus();
    };
  }, [onClose]);

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-sm safe-x"
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] flex flex-col bg-background rounded-2xl shadow-2xl overflow-hidden border border-border"
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-2 px-4 sm:px-5 py-3 sm:py-4 border-b border-border flex-shrink-0">
          <div className="min-w-0">
            <h2 id={titleId} className="text-base font-bold text-text-primary">Open Team Sheet</h2>
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

        {/* Sheet (captured by html2canvas) */}
        <div className="overflow-y-auto overflow-x-hidden flex-1">
          <div ref={sheetRef} className="p-4 sm:p-5 bg-background">
            {/* Title row */}
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

            {/* Pokemon grid */}
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

        {/* Action bar — stacks on mobile so buttons don't get squeezed */}
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-2 px-4 sm:px-5 py-3 border-t border-border flex-shrink-0 bg-surface safe-bottom">
          <button
            type="button"
            onClick={handleDownloadPng}
            disabled={downloading}
            className="flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 min-h-[44px] rounded-xl bg-accent text-white text-sm font-bold hover:brightness-110 transition-all disabled:opacity-60 disabled:cursor-wait"
          >
            {downloading ? (
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            )}
            {downloading ? "Saving…" : "Save as PNG"}
          </button>
          <button
            type="button"
            onClick={handleCopyText}
            className="flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 min-h-[44px] rounded-xl border border-border bg-surface-alt text-sm font-semibold text-text-secondary hover:text-accent hover:border-accent/40 transition-all"
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
