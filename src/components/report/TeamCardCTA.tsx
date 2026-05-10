"use client";

import { useState } from "react";
import { track } from "@vercel/analytics";
import { usePostHog } from "posthog-js/react";

/**
 * End-of-report CTA: download a Spotify-Wrapped style PNG of the team
 * (1080×1920) for Twitter / Instagram / Discord sharing. Backed by
 * `/api/team-graphic?id=...&style=wrapped`. (VGC-141)
 */
export function TeamCardCTA({
  shareId,
  hasTournament,
}: {
  shareId: string;
  /** Surface a placement-aware nudge ("Show off your X-Y record!") when set. */
  hasTournament: boolean;
}) {
  const posthog = usePostHog();
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (downloading) return;
    setDownloading(true);
    track("team_card_download_clicked", { share_id: shareId });
    posthog?.capture("team_card_download_clicked", { share_id: shareId });
    try {
      const url = `/api/team-graphic?id=${encodeURIComponent(shareId)}&style=wrapped`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to generate card");
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = `vgc-team-${shareId}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objectUrl);
    } catch {
      // Surface failure inline rather than silently — the user clicked
      // expecting a file.
      alert("Couldn't generate the team card. Please try again in a moment.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-gradient-to-br from-accent/10 via-accent-surface/15 to-transparent p-4 sm:p-5 flex flex-col sm:flex-row items-center gap-4">
      <div className="w-12 h-12 rounded-xl bg-accent/15 border border-accent/30 flex items-center justify-center flex-shrink-0">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
      </div>
      <div className="flex-1 min-w-0 text-center sm:text-left">
        <p className="text-sm sm:text-base font-extrabold text-text-primary">
          {hasTournament ? "Brag about it." : "Show off this team."}
        </p>
        <p className="text-xs sm:text-sm text-text-secondary mt-0.5 leading-relaxed">
          Download a poster-style team card built for Twitter, Instagram, and Discord. 1080 × 1920 PNG.
        </p>
      </div>
      <button
        type="button"
        onClick={handleDownload}
        disabled={downloading}
        className="w-full sm:w-auto px-5 py-2.5 bg-accent text-white text-sm font-bold rounded-xl hover:brightness-110 active:scale-[0.97] transition-all shadow-md shadow-accent/30 cursor-pointer disabled:opacity-60 disabled:cursor-wait"
      >
        {downloading ? "Generating…" : "Download card"}
      </button>
    </div>
  );
}
