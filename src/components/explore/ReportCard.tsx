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
}

const BASE_URL = "https://play.pokemonshowdown.com/sprites";

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
  const hasMetadata = report.tournamentName || report.creatorName;

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
                // Try gen5 fallback
                if (!img.dataset.fallback) {
                  img.dataset.fallback = "1";
                  img.src = `${BASE_URL}/gen5/${spriteSlug(species)}.png`;
                }
              }}
            />
          ))}
          {/* Fill empty slots with muted placeholders */}
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
          <p className="text-xs text-text-secondary">
            {t.byCreator} <span className="font-semibold">{report.creatorName}</span>
          </p>
        )}

        {/* Summary */}
        {report.teamSummary && (
          <p className="text-xs text-text-tertiary leading-relaxed line-clamp-2">
            {report.teamSummary}
          </p>
        )}

        {/* Timestamp */}
        <p className="text-[10px] text-text-tertiary font-medium uppercase tracking-wider pt-1">
          {relativeTime(report.createdAt)}
        </p>
      </div>
    </motion.a>
  );
}
