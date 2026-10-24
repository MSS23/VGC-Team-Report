"use client";

import { useEffect, useState } from "react";

interface MetaEntry {
  name: string;
  count: number;
  percentage: number;
}

interface ChampionsMetaResult {
  entries: MetaEntry[];
  totalReports: number;
  hasEnoughData: boolean;
}

function SkeletonBar() {
  return (
    <div className="flex items-center gap-3 py-1.5">
      <div className="w-28 h-3.5 bg-surface-alt rounded animate-pulse" />
      <div className="flex-1 h-3 bg-surface-alt rounded-full animate-pulse" />
      <div className="w-8 h-3 bg-surface-alt rounded animate-pulse" />
    </div>
  );
}

export function MetaSnapshot() {
  const [data, setData] = useState<ChampionsMetaResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/champions/meta");
        if (!res.ok) throw new Error("Failed");
        const json = await res.json() as ChampionsMetaResult;
        if (!cancelled) setData(json);
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, []);

  // The top 10 for the bar chart
  const top10 = data?.entries.slice(0, 10) ?? [];
  const maxPct = top10.length > 0 ? top10[0].percentage : 100;

  return (
    <section className="max-w-5xl mx-auto px-4 py-12">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 mb-5">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-text-primary tracking-tight">
            Champions Meta Snapshot
          </h2>
          {!loading && data && (
            <p className="text-xs text-text-tertiary mt-1">
              Based on{" "}
              <span className="font-bold text-text-secondary">{data.totalReports}</span>{" "}
              public Champions team report{data.totalReports !== 1 ? "s" : ""}
            </p>
          )}
        </div>
        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-accent uppercase tracking-widest bg-accent-surface px-3 py-1 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-accent" />
          Live Data
        </span>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-2" aria-busy="true" aria-label="Loading Champions meta data">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonBar key={i} />
            ))}
          </div>
        )}

        {/* Error state */}
        {!loading && error && (
          <p className="text-sm text-text-tertiary text-center py-6">
            Could not load meta data. Please try again later.
          </p>
        )}

        {/* Not enough data */}
        {!loading && !error && data && !data.hasEnoughData && (
          <div className="text-center py-8 px-4">
            <div className="w-12 h-12 rounded-full bg-accent-surface flex items-center justify-center mx-auto mb-3">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-accent"
                aria-hidden="true"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <p className="text-sm font-bold text-text-primary mb-1">Not enough data yet</p>
            <p className="text-xs text-text-secondary max-w-xs mx-auto">
              Be the first to publish your Champions team! Once there are enough public reports,
              the meta snapshot will appear here.
            </p>
          </div>
        )}

        {/* Usage bar chart */}
        {!loading && !error && data && data.hasEnoughData && top10.length > 0 && (
          <div role="list" aria-label="Top 10 most-used Pokémon in Champions format">
            <div className="space-y-2.5">
              {top10.map((entry, i) => {
                const barWidth = maxPct > 0 ? (entry.percentage / maxPct) * 100 : 0;
                return (
                  <div
                    key={entry.name}
                    role="listitem"
                    className="flex items-center gap-3 group"
                  >
                    {/* Rank */}
                    <span
                      className="text-[11px] font-bold text-text-tertiary w-5 text-right shrink-0"
                      aria-label={`Rank ${i + 1}`}
                    >
                      {i + 1}
                    </span>

                    {/* Name */}
                    <span
                      className="text-xs font-bold text-text-primary w-28 shrink-0 truncate capitalize"
                      title={entry.name}
                    >
                      {entry.name.replace(/-/g, " ")}
                    </span>

                    {/* Bar */}
                    <div
                      className="flex-1 h-3 bg-surface-alt rounded-full overflow-hidden"
                      aria-hidden="true"
                    >
                      <div
                        className="h-full bg-accent/70 rounded-full transition-all duration-500"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>

                    {/* Percentage */}
                    <span
                      className="text-[11px] font-bold text-text-secondary w-10 text-right shrink-0 tabular-nums"
                      aria-label={`${entry.percentage}% usage`}
                    >
                      {entry.percentage}%
                    </span>

                    {/* Count */}
                    <span
                      className="text-[10px] text-text-tertiary w-10 shrink-0 tabular-nums hidden sm:block"
                      aria-label={`${entry.count} teams`}
                    >
                      {entry.count}×
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Footer note */}
            <p className="mt-4 text-[10px] text-text-tertiary text-right">
              Showing top 10 of {data.entries.length} Pokémon · updates every 5 min
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
