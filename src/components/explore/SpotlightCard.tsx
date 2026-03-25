"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { useTranslation } from "@/lib/i18n";
import { relativeTime } from "@/lib/utils/relative-time";
import type { ExploreReport } from "./ReportCard";

const BASE_URL = "https://play.pokemonshowdown.com/sprites";

function spriteSlug(species: string): string {
  return species
    .toLowerCase()
    .replace(/♂/g, "m")
    .replace(/♀/g, "f")
    .replace(/[éè]/g, "e")
    .replace(/[''.:\u2019]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

const REACTION_EMOJIS: Record<string, string> = {
  fire: "\uD83D\uDD25",
  heart: "\u2764\uFE0F",
  brain: "\uD83E\uDDE0",
  battle: "\u2694\uFE0F",
  clap: "\uD83D\uDC4F",
};

export function SpotlightCard({ report }: { report: ExploreReport }) {
  const { t } = useTranslation();

  const topReactions = report.reactionCounts
    ? Object.entries(report.reactionCounts)
        .filter(([, count]) => count > 0)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
    : [];
  const totalReactions = topReactions.reduce((sum, [, c]) => sum + c, 0);

  return (
    <motion.a
      href={`/s/${report.id}`}
      className="block bg-surface rounded-2xl border-2 border-accent/20 shadow-lg shadow-accent/5 hover:shadow-xl hover:border-accent/40 transition-all duration-300 overflow-hidden group"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Top bar: badge + author + placement */}
      <div className="px-5 sm:px-6 pt-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-extrabold rounded-full bg-accent text-white shadow-sm shadow-accent/30 uppercase tracking-widest">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            Spotlight
          </span>
          {report.creatorName && (
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-full bg-accent-surface flex items-center justify-center flex-shrink-0">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <span className="text-sm font-bold text-text-primary">{report.creatorName}</span>
              {report.isVerified && (
                <span title="Verified creator" className="flex-shrink-0">
                  <svg width="14" height="14" viewBox="0 0 24 24" className="text-blue-500">
                    <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.15" />
                    <path d="M9 12l2 2 4-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
                  </svg>
                </span>
              )}
            </div>
          )}
        </div>
        {report.placement && (
          <span className="inline-flex items-center px-2.5 py-1 text-xs font-extrabold rounded-lg tracking-wide bg-accent-surface text-accent">
            {report.placement}
          </span>
        )}
      </div>

      {/* Team sprites with species names */}
      <div className="px-5 sm:px-6 pt-4 pb-3">
        <div className="flex items-end justify-center gap-3 sm:gap-4">
          {report.species.map((species, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <img
                src={`${BASE_URL}/home/${spriteSlug(species)}.png`}
                alt={species}
                width={48}
                height={48}
                className="object-contain sm:w-14 sm:h-14"
                loading="lazy"
                onError={(e) => {
                  const img = e.currentTarget;
                  if (!img.dataset.fallback) {
                    img.dataset.fallback = "1";
                    img.src = `${BASE_URL}/gen5/${spriteSlug(species)}.png`;
                  }
                }}
              />
              <span className="text-[9px] sm:text-[10px] font-semibold text-text-tertiary text-center leading-tight max-w-[60px] truncate">
                {species}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Title + Summary */}
      <div className="px-5 sm:px-6 pb-5 space-y-2">
        {(report.tournamentName || report.teamSummary) && (
          <div className="border-t border-border/50 pt-3 space-y-1.5">
            {report.tournamentName && (
              <h3 className="text-base sm:text-lg font-extrabold text-text-primary leading-tight group-hover:text-accent transition-colors">
                {report.tournamentName}
              </h3>
            )}
            {report.teamSummary && (
              <p className="text-xs sm:text-sm text-text-secondary leading-relaxed line-clamp-2">
                {report.teamSummary}
              </p>
            )}
          </div>
        )}

        {/* Footer: social stats + CTA */}
        <div className="flex items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-3">
            {topReactions.length > 0 && (
              <span className="inline-flex items-center gap-0.5 text-xs">
                {topReactions.map(([type]) => (
                  <span key={type}>{REACTION_EMOJIS[type]}</span>
                ))}
                <span className="font-bold text-text-secondary ml-0.5">{totalReactions}</span>
              </span>
            )}
            {(report.commentCount ?? 0) > 0 && (
              <span className="inline-flex items-center gap-1 text-text-tertiary text-xs">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                </svg>
                <span className="font-bold">{report.commentCount}</span>
              </span>
            )}
            {(report.viewCount ?? 0) > 0 && (
              <span className="inline-flex items-center gap-1 text-text-tertiary text-xs">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                <span className="font-bold">{report.viewCount}</span>
              </span>
            )}
            <span className="text-[10px] text-text-tertiary font-medium">
              {relativeTime(report.createdAt)}
            </span>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-accent group-hover:underline">
            View Report
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </span>
        </div>
      </div>
    </motion.a>
  );
}

/** Fetches and renders the spotlight card. Returns null if no spotlight available. */
export function SpotlightSection() {
  const [report, setReport] = useState<ExploreReport | null>(null);

  useEffect(() => {
    fetch("/api/spotlight")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.spotlight) setReport(data.spotlight);
      })
      .catch(() => {});
  }, []);

  if (!report) return null;

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-3">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-accent">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
        <h2 className="text-xs font-extrabold text-text-secondary uppercase tracking-widest">Featured Team Report</h2>
      </div>
      <SpotlightCard report={report} />
    </div>
  );
}
