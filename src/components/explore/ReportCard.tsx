"use client";

import { motion } from "motion/react";
import { useTranslation } from "@/lib/i18n";
import { relativeTime } from "@/lib/utils/relative-time";

export interface ExploreReport {
  id: string;
  species: string[];
  tournamentName?: string;
  creatorName?: string;
  placement?: string;
  teamSummary?: string;
  createdAt: string;
  updatedAt: string;
  viewCount?: number;
  reactionCounts?: Record<string, number>;
  commentCount?: number;
  isVerified?: boolean;
}

const BASE_URL = "https://play.pokemonshowdown.com/sprites";

const REACTION_EMOJIS: Record<string, string> = {
  fire: "\uD83D\uDD25",
  heart: "\u2764\uFE0F",
  brain: "\uD83E\uDDE0",
  battle: "\u2694\uFE0F",
  clap: "\uD83D\uDC4F",
};

function spriteSlug(species: string): string {
  return species
    .toLowerCase()
    .replace(/♂/g, "m")
    .replace(/♀/g, "f")
    .replace(/[éè]/g, "e")
    .replace(/[''.:\u2019]/g, "")
    .replace(/[^a-z0-9]/g, "")
}

export function ReportCard({ report }: { report: ExploreReport }) {
  const { t } = useTranslation();

  // Top reactions (up to 3)
  const topReactions = report.reactionCounts
    ? Object.entries(report.reactionCounts)
        .filter(([, count]) => count > 0)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
    : [];

  const totalReactions = topReactions.reduce((sum, [, count]) => sum + count, 0);
  const hasSocial = totalReactions > 0 || (report.commentCount ?? 0) > 0 || (report.viewCount ?? 0) > 0;

  return (
    <motion.a
      href={`/s/${report.id}`}
      className="block bg-surface rounded-xl border border-border shadow-sm hover:shadow-md hover:border-accent/30 transition-all duration-300 overflow-hidden group"
      variants={{
        hidden: { opacity: 0, y: 12 },
        visible: { opacity: 1, y: 0 },
      }}
    >
      {/* Sprites row */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-center gap-1">
          {report.species.map((species, i) => (
            <img
              key={i}
              src={`${BASE_URL}/home/${spriteSlug(species)}.png`}
              alt={species}
              width={40}
              height={40}
              className="object-contain"
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
          {Array.from({ length: Math.max(0, 6 - report.species.length) }).map(
            (_, i) => (
              <div
                key={`empty-${i}`}
                className="w-10 h-10 rounded-full bg-surface-alt"
              />
            ),
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-4 space-y-2">
        {/* Tournament + Placement */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-bold text-text-primary leading-tight group-hover:text-accent transition-colors line-clamp-1">
            {report.tournamentName || report.species.join(" / ")}
          </h3>
          {report.placement && (
            <span className="flex-shrink-0 inline-flex items-center px-2 py-0.5 text-[10px] font-extrabold rounded-md tracking-wide bg-accent-surface text-accent">
              {report.placement}
            </span>
          )}
        </div>

        {/* Creator */}
        {report.creatorName && (
          <p className="text-xs text-text-secondary flex items-center gap-1">
            <span>{t.byCreator}</span>
            <span
              className="font-semibold hover:text-accent transition-colors inline-flex items-center gap-1"
              onClick={(e) => {
                e.preventDefault();
                window.location.href = `/creator/${encodeURIComponent(report.creatorName!)}`;
              }}
            >
              {report.creatorName}
              {report.isVerified && (
                <span title="Verified creator">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-blue-500 flex-shrink-0">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                    <circle cx="12" cy="12" r="11" fill="none" stroke="currentColor" strokeWidth="2" />
                  </svg>
                </span>
              )}
            </span>
            {report.placement && !report.isVerified && (
              <span className="text-[9px] text-text-tertiary italic ml-1">(self-reported)</span>
            )}
          </p>
        )}

        {/* Summary */}
        {report.teamSummary && (
          <p className="text-xs text-text-tertiary leading-relaxed line-clamp-2">
            {report.teamSummary}
          </p>
        )}

        {/* Social indicators + timestamp */}
        <div className="flex items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-2.5">
            {/* Reactions */}
            {topReactions.length > 0 && (
              <span className="inline-flex items-center gap-0.5 text-[10px]">
                {topReactions.map(([type]) => (
                  <span key={type}>{REACTION_EMOJIS[type]}</span>
                ))}
                <span className="font-bold text-text-secondary ml-0.5">{totalReactions}</span>
              </span>
            )}
            {/* Comments */}
            {(report.commentCount ?? 0) > 0 && (
              <span className="inline-flex items-center gap-0.5 text-text-tertiary">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                </svg>
                <span className="text-[10px] font-bold">{report.commentCount}</span>
              </span>
            )}
            {/* Views */}
            {(report.viewCount ?? 0) > 0 && (
              <span className="inline-flex items-center gap-0.5 text-text-tertiary">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                <span className="text-[10px] font-bold">
                  {(report.viewCount ?? 0) >= 1000 ? `${((report.viewCount ?? 0) / 1000).toFixed(1)}k` : report.viewCount}
                </span>
              </span>
            )}
          </div>
          <span className="text-[10px] text-text-tertiary font-medium uppercase tracking-wider">
            {relativeTime(report.createdAt)}
          </span>
        </div>
      </div>
    </motion.a>
  );
}
