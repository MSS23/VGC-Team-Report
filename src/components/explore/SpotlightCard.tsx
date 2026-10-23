"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "@/lib/i18n";
import { relativeTime } from "@/lib/utils/relative-time";
import { getSpriteUrls } from "@/lib/utils/sprite-slug";
import type { ExploreReport } from "./ReportCard";

// (reaction emojis removed, using unified like system)

function AnimatedSprite({ species, size = 56 }: { species: string; size?: number }) {
  const urls = getSpriteUrls(species);
  const [srcIdx, setSrcIdx] = useState(0);
  return (
    <img
      src={urls[Math.min(srcIdx, urls.length - 1)]}
      alt={species}
      width={size}
      height={size}
      className="object-contain"
      onError={() => setSrcIdx((i) => Math.min(i + 1, urls.length - 1))}
    />
  );
}

export function SpotlightCard({ report }: { report: ExploreReport }) {
  const { t } = useTranslation();

  const likeCount = report.likeCount ?? (report.reactionCounts
    ? Object.values(report.reactionCounts).reduce((sum, c) => sum + c, 0)
    : 0);

  return (
    <a
      href={`/s/${report.id}`}
      className="group block overflow-hidden rounded-card border border-border bg-surface transition-[border-color] duration-(--dur-short) hover:border-accent"



    >
      {/* Top bar: badge + author + placement */}
      <div className="px-5 sm:px-6 pt-5 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5">
          {report.creatorName && (
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-full bg-accent-surface flex items-center justify-center flex-shrink-0">
                <svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <span className="text-sm font-bold text-text-primary">{report.creatorName}</span>
              {report.isVerified && (
                <span title="Verified creator" className="flex-shrink-0">
                  <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" className="text-blue-800">
                    <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.15" />
                    <path d="M9 12l2 2 4-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
                  </svg>
                </span>
              )}
              {report.collaborators && report.collaborators.length > 0 && (
                <span className="text-xs text-text-tertiary flex items-center gap-1 flex-wrap">
                  <span>collabed with</span>
                  {report.collaborators.slice(0, 2).map((name, i) => (
                    <span key={name}>
                      {i > 0 && <span>, </span>}
                      <span className="font-semibold text-text-secondary">{name}</span>
                    </span>
                  ))}
                  {report.collaborators.length > 2 && (
                    <span>+{report.collaborators.length - 2}</span>
                  )}
                </span>
              )}
            </div>
          )}
        </div>
        {report.placement && (
          <span className="inline-flex items-center rounded-md bg-accent px-2.5 py-1 text-xs font-semibold text-accent-ink">
            {report.placement}
          </span>
        )}
      </div>

      {/* Animated team sprites with species names */}
      <div className="px-4 sm:px-6 pt-5 pb-3">
        <div className="flex items-end justify-between gap-2 overflow-hidden sm:justify-around sm:gap-5">
          {report.species.map((species, i) => (
            <div
              key={i}
              className="flex flex-col items-center gap-1"



            >
              <AnimatedSprite species={species} size={52} />
              <span className="text-xs sm:text-xs font-semibold text-text-tertiary text-center leading-tight max-w-[56px] sm:max-w-[72px] truncate">
                {species}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Title + View Report */}
      <div className="px-5 sm:px-6 pb-5 space-y-2">
        {report.tournamentName && (
          <div className="border-t border-border/50 pt-3">
            <h3 className="text-base sm:text-lg font-bold text-text-primary leading-tight group-hover:text-accent transition-colors">
              {report.tournamentName}
            </h3>
          </div>
        )}

        {/* Footer: social stats + CTA */}
        <div className="flex items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-3 flex-wrap">
            {likeCount > 0 && (
              <span className="inline-flex items-center gap-1 text-xs">
                <svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="currentColor" stroke="none" className="text-red-500">
                  <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                </svg>
                <span className="font-bold text-text-secondary">{likeCount}</span>
              </span>
            )}
            {(report.commentCount ?? 0) > 0 && (
              <span className="inline-flex items-center gap-1 text-text-tertiary text-xs">
                <svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                </svg>
                <span className="font-bold">{report.commentCount}</span>
              </span>
            )}
            {(report.viewCount ?? 0) > 0 && (
              <span className="inline-flex items-center gap-1 text-text-tertiary text-xs">
                <svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                <span className="font-bold">{report.viewCount}</span>
              </span>
            )}
            <span className="text-xs text-text-tertiary ">
              {relativeTime(report.createdAt)}
            </span>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-accent group-hover:underline flex-shrink-0">
            View Report
            <svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </span>
        </div>
      </div>
    </a>
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
    <div className="mb-(--section-gap-s)">
      <div className="mb-10">
        <h2 className="font-display text-section font-bold tracking-display text-text-primary">Featured team report</h2>
      </div>
      <SpotlightCard report={report} />
    </div>
  );
}
