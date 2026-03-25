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
      <div className="relative">
        {/* Spotlight badge */}
        <div className="absolute top-3 left-3 z-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-extrabold rounded-full bg-accent text-white shadow-md shadow-accent/30 uppercase tracking-widest">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            Spotlight
          </span>
        </div>

        {/* Sprites — larger, centered */}
        <div className="px-6 pt-12 pb-4">
          <div className="flex items-center justify-center gap-2 sm:gap-3">
            {report.species.map((species, i) => (
              <img
                key={i}
                src={`${BASE_URL}/home/${spriteSlug(species)}.png`}
                alt={species}
                width={56}
                height={56}
                className="object-contain sm:w-16 sm:h-16"
                loading="lazy"
                onError={(e) => {
                  const img = e.currentTarget;
                  if (!img.dataset.fallback) {
                    img.dataset.fallback = "1";
                    img.src = `${BASE_URL}/gen5/${spriteSlug(species)}.png`;
                  }
                }}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="px-6 pb-6 space-y-3">
          {/* Title + Placement */}
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-lg sm:text-xl font-extrabold text-text-primary leading-tight group-hover:text-accent transition-colors">
              {report.tournamentName || report.species.join(" / ")}
            </h3>
            {report.placement && (
              <span className="flex-shrink-0 inline-flex items-center px-2.5 py-1 text-xs font-extrabold rounded-lg tracking-wide bg-accent-surface text-accent">
                {report.placement}
              </span>
            )}
          </div>

          {/* Creator */}
          {report.creatorName && (
            <p className="text-sm text-text-secondary flex items-center gap-1.5">
              <span>{t.byCreator}</span>
              <span className="font-bold inline-flex items-center gap-1">
                {report.creatorName}
                {report.isVerified && (
                  <span title="Verified creator">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-blue-500">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                      <circle cx="12" cy="12" r="11" fill="none" stroke="currentColor" strokeWidth="2" />
                    </svg>
                  </span>
                )}
              </span>
            </p>
          )}

          {/* Summary */}
          {report.teamSummary && (
            <p className="text-sm text-text-tertiary leading-relaxed line-clamp-3">
              {report.teamSummary}
            </p>
          )}

          {/* Social stats */}
          <div className="flex items-center gap-4 pt-1">
            {topReactions.length > 0 && (
              <span className="inline-flex items-center gap-1 text-xs">
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
            <span className="text-[10px] text-text-tertiary font-medium uppercase tracking-wider ml-auto">
              {relativeTime(report.createdAt)}
            </span>
          </div>
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
      <SpotlightCard report={report} />
    </div>
  );
}
