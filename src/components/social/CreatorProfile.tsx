"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { I18nProvider, useTranslation } from "@/lib/i18n";
import { useDarkMode } from "@/hooks/useDarkMode";
import { LanguageSelector } from "@/components/ui/LanguageSelector";
import { ReportCard, type ExploreReport } from "@/components/explore/ReportCard";

interface CreatorData {
  creator: string;
  totalReports: number;
  totalReactions: number;
  reports: ExploreReport[];
}

export function CreatorProfileWrapper({ name }: { name: string }) {
  return (
    <I18nProvider>
      <CreatorProfileInner name={name} />
    </I18nProvider>
  );
}

function CreatorProfileInner({ name }: { name: string }) {
  const { t } = useTranslation();
  const { darkMode, setDarkMode } = useDarkMode();
  const [data, setData] = useState<CreatorData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/creator/${encodeURIComponent(name)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [name]);

  return (
    <div className="min-h-screen bg-background text-text-primary">
      {/* Navbar */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-surface/90 border-b border-border shadow-[0_1px_8px_rgba(0,0,0,0.06)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2 font-bold text-sm hover:opacity-80 transition-opacity">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            <span className="text-text-primary">VGC Team</span>
            <span className="text-accent">Report</span>
          </a>
          <div className="flex items-center gap-3">
            <a href="/explore" className="text-xs font-bold text-text-secondary hover:text-accent transition-colors">
              {t.explore}
            </a>
            <LanguageSelector />
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-alt transition-all"
              aria-label="Toggle dark mode"
            >
              {darkMode ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" /></svg>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="flex items-center gap-3 text-text-secondary">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
              <span className="text-sm font-medium">{t.loading}</span>
            </div>
          </div>
        ) : !data ? (
          <div className="text-center py-20">
            <h2 className="text-lg font-bold text-text-primary mb-2">Creator not found</h2>
            <a href="/explore" className="text-sm text-accent hover:underline">{t.explore}</a>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            {/* Profile header */}
            <div className="mb-10">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-full bg-accent-surface flex items-center justify-center flex-shrink-0">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{data.creator}</h1>
                  <p className="text-sm text-text-secondary mt-0.5">{t.creatorProfile}</p>
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <span className="text-xl font-extrabold text-text-primary">{data.totalReports}</span>
                  <span className="text-xs text-text-secondary font-semibold uppercase tracking-wider">{t.publicReports}</span>
                </div>
                <div className="w-px h-6 bg-border" />
                <div className="flex items-center gap-2">
                  <span className="text-xl font-extrabold text-text-primary">{data.totalReactions}</span>
                  <span className="text-xs text-text-secondary font-semibold uppercase tracking-wider">{t.totalReactions}</span>
                </div>
              </div>
            </div>

            {/* Reports grid */}
            {data.reports.length === 0 ? (
              <p className="text-sm text-text-secondary">{t.noCreatorReports}</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                {data.reports.map((report) => (
                  <ReportCard key={report.id} report={report} />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </main>
    </div>
  );
}
