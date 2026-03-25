"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "motion/react";
import { I18nProvider, useTranslation } from "@/lib/i18n";
import { useDarkMode } from "@/hooks/useDarkMode";
import { LanguageSelector } from "@/components/ui/LanguageSelector";
import { ExploreHero } from "./ExploreHero";
import { ExploreFilters } from "./ExploreFilters";
import { ReportCard, type ExploreReport } from "./ReportCard";
import { ExploreEmpty } from "./ExploreEmpty";

export function ExploreContent() {
  return (
    <I18nProvider>
      <ExploreInner />
    </I18nProvider>
  );
}

function ExploreInner() {
  const { t } = useTranslation();
  const { darkMode, setDarkMode } = useDarkMode();

  const [reports, setReports] = useState<ExploreReport[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"newest" | "updated" | "popular">("newest");
  const initialLoad = useRef(true);

  const fetchReports = useCallback(
    async (cursor?: string) => {
      const params = new URLSearchParams();
      if (cursor) params.set("cursor", cursor);
      if (query) params.set("q", query);
      if (sort !== "newest") params.set("sort", sort);

      const res = await fetch(`/api/explore?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json() as Promise<{
        reports: ExploreReport[];
        nextCursor: string | null;
      }>;
    },
    [query, sort],
  );

  // Initial + filter/sort change fetch
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const data = await fetchReports();
        if (!cancelled) {
          setReports(data.reports);
          setNextCursor(data.nextCursor);
        }
      } catch {
        if (!cancelled) setReports([]);
      } finally {
        if (!cancelled) {
          setLoading(false);
          initialLoad.current = false;
        }
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [fetchReports]);

  const loadMore = async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const data = await fetchReports(nextCursor);
      setReports((prev) => [...prev, ...data.reports]);
      setNextCursor(data.nextCursor);
    } catch {
      // silently fail
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-text-primary">
      {/* Navbar */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-surface/90 border-b border-border shadow-[0_1px_8px_rgba(0,0,0,0.06)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <a
            href="/"
            className="flex items-center gap-2 font-bold text-sm hover:opacity-80 transition-opacity"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-accent"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
            <span className="text-text-primary">VGC Team</span>
            <span className="text-accent">Report</span>
          </a>
          <div className="flex items-center gap-3">
            <LanguageSelector />
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-alt transition-all"
              aria-label="Toggle dark mode"
            >
              {darkMode ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pb-20">
        <ExploreHero />

        <ExploreFilters
          query={query}
          onQueryChange={setQuery}
          sort={sort}
          onSortChange={setSort}
        />

        {/* Results */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex items-center gap-3 text-text-secondary">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span className="text-sm font-medium">{t.loading}</span>
            </div>
          </div>
        ) : reports.length === 0 ? (
          <ExploreEmpty hasSearch={!!query} />
        ) : (
          <>
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5"
              initial="hidden"
              animate="visible"
              variants={{
                hidden: {},
                visible: { transition: { staggerChildren: 0.05 } },
              }}
            >
              {reports.map((report) => (
                <ReportCard key={report.id} report={report} />
              ))}
            </motion.div>

            {nextCursor && (
              <div className="flex justify-center mt-10">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="px-6 py-2.5 rounded-lg text-sm font-bold bg-surface border-2 border-border text-text-primary hover:border-accent/40 hover:bg-accent-surface active:scale-[0.97] transition-all disabled:opacity-40 disabled:cursor-not-allowed tracking-wide"
                >
                  {loadingMore ? t.loading : t.loadMore}
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <p className="text-center text-xs text-text-tertiary font-medium">
          {t.builtBy}{" "}
          <a
            href="https://x.com/Manny64Official"
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold text-text-primary hover:text-accent transition-colors"
          >
            Manraj Sidhu
          </a>
          <span className="mx-1.5 text-border">&middot;</span>
          <a
            href="/"
            className="text-text-tertiary hover:text-text-primary transition-colors"
          >
            {t.buildYourOwn}
          </a>
        </p>
      </footer>
    </div>
  );
}
