"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { track } from "@vercel/analytics";
import posthog from "posthog-js";
import { I18nProvider, useTranslation } from "@/lib/i18n";
import { useDarkMode } from "@/hooks/useDarkMode";
import { PageNavbar } from "@/components/layout/PageNavbar";
import { PageFooter } from "@/components/layout/PageFooter";
import { ReportCard, type ExploreReport } from "@/components/explore/ReportCard";
import { applyRandomAccent } from "@/lib/utils/random-accent";
import { FollowButton } from "@/components/social/FollowButton";

interface CreatorProfile {
  bio?: string;
  twitter?: string;
  discord?: string;
  youtube?: string;
  avatarUrl?: string;
}

interface CreatorData {
  creator: string;
  isVerified: boolean;
  profile?: CreatorProfile;
  followerCount: number;
  totalReports: number;
  totalReactions: number;
  totalViews: number;
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

  // Random accent color on creator profile page
  useEffect(() => { applyRandomAccent(); track("creator_profile_visited", { creator: name }); posthog.capture("creator_profile_visited", { creator_name: name }); }, [name]);
  const [data, setData] = useState<CreatorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"newest" | "views">("newest");

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
      <PageNavbar darkMode={darkMode} onToggleDarkMode={() => setDarkMode(!darkMode)} activePage="creator" />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 pb-24 sm:pb-12">
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
                {data.profile?.avatarUrl ? (
                  <img
                    src={data.profile.avatarUrl}
                    alt={data.creator}
                    className="w-14 h-14 rounded-full object-cover flex-shrink-0 border-2 border-accent/20"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-accent-surface flex items-center justify-center flex-shrink-0">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
                      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                )}
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-2">
                    {data.creator}
                    {data.isVerified && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-bold rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20" title="Verified creator">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" /></svg>
                        Verified
                      </span>
                    )}
                  </h1>
                  <div className="flex items-center gap-3 mt-1.5">
                    <p className="text-sm text-text-secondary">{t.creatorProfile}</p>
                    <FollowButton creatorName={data.creator} />
                  </div>
                </div>
              </div>

              {/* Bio */}
              {data.profile?.bio && (
                <p className="text-sm text-text-secondary leading-relaxed mb-4 max-w-xl">
                  {data.profile.bio}
                </p>
              )}

              {/* Social links */}
              {data.profile && (data.profile.twitter || data.profile.discord || data.profile.youtube) && (
                <div className="flex items-center gap-3 mb-4">
                  {data.profile.twitter && (
                    <a
                      href={`https://twitter.com/${data.profile.twitter}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-surface border border-border hover:border-accent/30 hover:bg-accent-surface/30 transition-all text-text-secondary hover:text-text-primary"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                      @{data.profile.twitter}
                    </a>
                  )}
                  {data.profile.youtube && (
                    <a
                      href={`https://youtube.com/@${data.profile.youtube}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-surface border border-border hover:border-accent/30 hover:bg-accent-surface/30 transition-all text-text-secondary hover:text-text-primary"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
                      YouTube
                    </a>
                  )}
                  {data.profile.discord && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-surface border border-border text-text-secondary">
                      <svg width="12" height="12" viewBox="0 0 24 18" fill="currentColor"><path d="M20.317 1.492a19.7 19.7 0 0 0-4.885-1.516.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.7 19.7 0 0 0 3.677 1.492.07.07 0 0 0 3.642 1.52C.533 6.093-.319 10.555.099 14.961a.08.08 0 0 0 .031.055 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.227-1.994a.076.076 0 0 0-.041-.106 13.1 13.1 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 0 1 .078-.01c3.927 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .079.009c.12.099.245.198.372.292a.077.077 0 0 1-.006.127 12.3 12.3 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.84 19.84 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.06.06 0 0 0-.031-.02z" /></svg>
                      {data.profile.discord}
                    </span>
                  )}
                </div>
              )}

              {/* Stats */}
              <div className="flex items-center gap-5 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <span className="text-xl font-extrabold text-text-primary">{data.totalReports}</span>
                  <span className="text-xs text-text-secondary font-semibold uppercase tracking-wider">{t.publicReports}</span>
                </div>
                <div className="w-px h-6 bg-border" />
                <div className="flex items-center gap-1.5">
                  <span className="text-xl font-extrabold text-text-primary">{data.totalViews.toLocaleString()}</span>
                  <span className="text-xs text-text-secondary font-semibold uppercase tracking-wider">Views</span>
                </div>
                <div className="w-px h-6 bg-border" />
                <div className="flex items-center gap-1.5">
                  <span className="text-xl font-extrabold text-text-primary">{data.totalReactions}</span>
                  <span className="text-xs text-text-secondary font-semibold uppercase tracking-wider">{t.totalReactions}</span>
                </div>
                <div className="w-px h-6 bg-border" />
                <div className="flex items-center gap-1.5">
                  <span className="text-xl font-extrabold text-text-primary">{data.followerCount}</span>
                  <span className="text-xs text-text-secondary font-semibold uppercase tracking-wider">Followers</span>
                </div>
              </div>
            </div>

            {/* Reports section */}
            {data.reports.length === 0 ? (
              <p className="text-sm text-text-secondary">{t.noCreatorReports}</p>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-bold text-text-secondary uppercase tracking-wider">
                    Reports ({data.reports.length})
                  </h2>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as "newest" | "views")}
                    className="px-3 py-1.5 bg-surface border border-border rounded-lg text-xs font-semibold text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/40 cursor-pointer"
                  >
                    <option value="newest">Newest first</option>
                    <option value="views">Most viewed</option>
                  </select>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                  {[...data.reports]
                    .sort((a, b) =>
                      sortBy === "views"
                        ? (b.viewCount ?? 0) - (a.viewCount ?? 0)
                        : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                    )
                    .map((report) => (
                      <ReportCard key={report.id} report={report} />
                    ))}
                </div>
              </>
            )}
          </motion.div>
        )}
      </main>
      <PageFooter />
    </div>
  );
}
