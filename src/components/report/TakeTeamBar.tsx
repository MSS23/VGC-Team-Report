"use client";

import { useState } from "react";
import type { AnalyzedPokemon } from "@/lib/types/analysis";
import { teamToShowdown } from "@/lib/utils/export-paste";
import { createPokePaste } from "@/lib/utils/pokepaste";

interface TakeTeamBarProps {
  team: AnalyzedPokemon[];
  teamName?: string;
  creatorName?: string;
}

/**
 * Viewer-facing export bar: lets a public-report visitor pull a shared team
 * back into their own builder without asking the owner. Two paths:
 *   1. Copy the Showdown paste straight to clipboard.
 *   2. Spin up a fresh PokéPaste URL (server round-trip) and open it.
 */
export function TakeTeamBar({ team, teamName, creatorName }: TakeTeamBarProps) {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");
  const [pasteLoading, setPasteLoading] = useState(false);
  const [pasteError, setPasteError] = useState<string | null>(null);

  const handleCopyShowdown = async () => {
    try {
      const paste = teamToShowdown(team.map((p) => p.parsed));
      await navigator.clipboard.writeText(paste);
      setCopyState("copied");
      setTimeout(() => setCopyState("idle"), 2000);
    } catch {
      setCopyState("error");
      setTimeout(() => setCopyState("idle"), 2000);
    }
  };

  const handleOpenPokePaste = async () => {
    if (pasteLoading) return;
    setPasteLoading(true);
    setPasteError(null);
    try {
      const paste = teamToShowdown(team.map((p) => p.parsed));
      const url = await createPokePaste({
        paste,
        title: teamName,
        author: creatorName,
      });
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      setPasteError(err instanceof Error ? err.message : "Failed to create paste");
      setTimeout(() => setPasteError(null), 3000);
    } finally {
      setPasteLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2 mt-3 sm:mt-4">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={handleCopyShowdown}
          aria-label="Copy team as Showdown paste"
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-bold bg-surface border-2 border-border rounded-lg text-text-primary hover:border-accent/40 hover:bg-surface-alt transition-all cursor-pointer active:scale-[0.97]"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
          </svg>
          {copyState === "copied"
            ? "Showdown paste copied"
            : copyState === "error"
              ? "Copy failed"
              : "Copy as Showdown paste"}
        </button>
        <button
          type="button"
          onClick={handleOpenPokePaste}
          disabled={pasteLoading}
          aria-label="Open team in PokePaste"
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-bold bg-accent text-white rounded-lg hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer active:scale-[0.97]"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
          {pasteLoading ? "Creating paste..." : "Open in PokePaste"}
        </button>
      </div>
      {pasteError && (
        <p className="text-[11px] text-red-500 font-semibold" role="alert">
          {pasteError}
        </p>
      )}
    </div>
  );
}
