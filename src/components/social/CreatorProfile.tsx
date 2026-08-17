"use client";

import { useState, useEffect } from "react";
import { MotionDiv } from "@/components/ui/LazyMotion";
import { usePostHog } from "@/components/providers/PostHogProvider";
import { I18nProvider, useTranslation } from "@/lib/i18n";


import { PageFooter } from "@/components/layout/PageFooter";
import { ReportCard, type ExploreReport } from "@/components/explore/ReportCard";
import { applyRandomAccent } from "@/lib/utils/random-accent";
import { FollowButton } from "@/components/social/FollowButton";
import { SpinnerIcon, UserIcon, EyeIcon, UsersIcon } from "@/components/ui/icons";

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
  const posthog = usePostHog();
  useEffect(() => { applyRandomAccent(); posthog?.capture("creator_profile_visited", { creator_name: name }); }, [name, posthog]);
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
      <main className="pb-24 sm:pb-12">
        {loading ? (
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="flex flex-col items-center justify-center py-32 gap-4">
              <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                <SpinnerIcon className="animate-spin h-5 w-5 text-accent" />
              </div>
              <p className="text-sm font-medium text-text-secondary">{t.loading}</p>
            </div>
          </div>
        ) : !data ? (
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="flex flex-col items-center justify-center py-32 gap-5 text-center">
              <div className="w-20 h-20 rounded-2xl bg-surface border border-border flex items-center justify-center">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-text-tertiary">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                  <path d="M8 11h6" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-bold text-text-primary mb-1">Creator not found</h2>
                <p className="text-sm text-text-secondary mb-4">
                  We couldn&apos;t find a creator with that name. They may not have published any reports yet.
                </p>
              </div>
              <a
                href="/explore"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent text-white text-sm font-bold rounded-xl hover:brightness-110 active:scale-[0.97] shadow-md shadow-accent/20 transition-all"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
                {t.explore}
              </a>
            </div>
          </div>
        ) : (
          <MotionDiv initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <div className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-accent/15 via-accent/5 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
              <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)", backgroundSize: "24px 24px" }} />

              <div className="relative max-w-5xl mx-auto px-4 sm:px-6 pt-8 sm:pt-12 pb-6">
                <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5 sm:gap-6">
                  <div className="relative flex-shrink-0">
                    <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-accent/40 to-accent/10 blur-sm" />
                    {data.profile?.avatarUrl ? (
                      <img
                        src={data.profile.avatarUrl}
                        alt={data.creator}
                        className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover ring-4 ring-background shadow-lg"
                      />
                    ) : (
                      <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-accent-surface ring-4 ring-background shadow-lg flex items-center justify-center">
                        <UserIcon width="36" height="36" strokeWidth="1.5" className="text-accent" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 text-center sm:text-left pb-1">
                    <div className="flex flex-col sm:flex-row items-center sm:items-center gap-2 sm:gap-3 mb-1.5">
                      <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-text-primary">
                        {data.creator}
                      </h1>
                      {data.isVerified && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-bold rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20" title="Verified creator">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" /></svg>
                          Verified
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-text-secondary mb-3">{t.creatorProfile}</p>
                    <div className="flex items-center justify-center sm:justify-start gap-3">
                      <FollowButton creatorName={data.creator} />

                      {data.profile?.twitter && (
                        <a
                          href={`https://twitter.com/${data.profile.twitter}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group inline-flex items-center justify-center w-9 h-9 rounded-lg bg-surface border border-border hover:bg-[#1da1f2]/10 hover:border-[#1da1f2]/30 hover:text-[#1da1f2] transition-all text-text-tertiary"
                          aria-label={`Follow ${data.creator} on X/Twitter`}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                        </a>
                      )}
                      {data.profile?.youtube && (
                        <a
                          href={`https://youtube.com/@${data.profile.youtube}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group inline-flex items-center justify-center w-9 h-9 rounded-lg bg-surface border border-border hover:bg-[#ff0000]/10 hover:border-[#ff0000]/30 hover:text-[#ff0000] transition-all text-text-tertiary"
                          aria-label={`Watch ${data.creator} on YouTube`}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
                        </a>
                      )}
                      {data.profile?.discord && (
                        <span
                          className="group inline-flex items-center justify-center w-9 h-9 rounded-lg bg-surface border border-border hover:bg-[#5865f2]/10 hover:border-[#5865f2]/30 hover:text-[#5865f2] transition-all text-text-tertiary cursor-default"
                          title={data.profile.discord}
                          aria-label={`Discord: ${data.profile.discord}`}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 18" fill="currentColor"><path d="M20.317 1.492a19.7 19.7 0 0 0-4.885-1.516.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.7 19.7 0 0 0 3.677 1.492.07.07 0 0 0 3.642 1.52C.533 6.093-.319 10.555.099 14.961a.08.08 0 0 0 .031.055 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.227-1.994a.076.076 0 0 0-.041-.106 13.1 13.1 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 0 1 .078-.01c3.927 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .079.009c.12.099.245.198.372.292a.077.077 0 0 1-.006.127 12.3 12.3 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.84 19.84 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.06.06 0 0 0-.031-.02z" /></svg>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 sm:px-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 -mt-1 mb-8">
                {[
                  {
                    label: t.publicReports,
                    value: data.totalReports,
                    icon: (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                      </svg>
                    ),
                  },
                  {
                    label: "Views",
                    value: data.totalViews.toLocaleString(),
                    icon: (
                      <EyeIcon width="18" height="18" />
                    ),
                  },
                  {
                    label: t.totalReactions,
                    value: data.totalReactions,
                    icon: (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                      </svg>
                    ),
                  },
                  {
                    label: "Followers",
                    value: data.followerCount,
                    icon: (
                      <UsersIcon width="18" height="18" />
                    ),
                  },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="relative overflow-hidden rounded-xl bg-surface border border-border p-4 sm:p-5 group hover:border-accent/20 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-text-tertiary group-hover:text-accent/70 transition-colors">
                        {stat.icon}
                      </span>
                    </div>
                    <p className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
                      {stat.value}
                    </p>
                    <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mt-0.5">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>

              {data.profile?.bio && (
                <div className="relative mb-8 rounded-xl bg-surface border border-border p-5 sm:p-6">
                  <div className="absolute top-4 left-5 text-accent/20" aria-hidden="true">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10H14.017zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10H0z" />
                    </svg>
                  </div>
                  <p className="text-sm sm:text-base text-text-secondary leading-relaxed pl-0 sm:pl-8 italic">
                    {data.profile.bio}
                  </p>
                </div>
              )}

              {data.profile && (data.profile.twitter || data.profile.discord || data.profile.youtube) && (
                <div className="flex flex-wrap items-center gap-2.5 mb-8">
                  {data.profile.twitter && (
                    <a
                      href={`https://twitter.com/${data.profile.twitter}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-lg bg-surface border border-border hover:bg-[#1da1f2]/10 hover:border-[#1da1f2]/30 hover:text-[#1da1f2] transition-all text-text-secondary"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                      @{data.profile.twitter}
                    </a>
                  )}
                  {data.profile.youtube && (
                    <a
                      href={`https://youtube.com/@${data.profile.youtube}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-lg bg-surface border border-border hover:bg-[#ff0000]/10 hover:border-[#ff0000]/30 hover:text-[#ff0000] transition-all text-text-secondary"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
                      YouTube
                    </a>
                  )}
                  {data.profile.discord && (
                    <span className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-lg bg-surface border border-border hover:bg-[#5865f2]/10 hover:border-[#5865f2]/30 hover:text-[#5865f2] transition-all text-text-secondary cursor-default">
                      <svg width="13" height="13" viewBox="0 0 24 18" fill="currentColor"><path d="M20.317 1.492a19.7 19.7 0 0 0-4.885-1.516.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.7 19.7 0 0 0 3.677 1.492.07.07 0 0 0 3.642 1.52C.533 6.093-.319 10.555.099 14.961a.08.08 0 0 0 .031.055 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.227-1.994a.076.076 0 0 0-.041-.106 13.1 13.1 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 0 1 .078-.01c3.927 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .079.009c.12.099.245.198.372.292a.077.077 0 0 1-.006.127 12.3 12.3 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.84 19.84 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.06.06 0 0 0-.031-.02z" /></svg>
                      {data.profile.discord}
                    </span>
                  )}
                </div>
              )}

              {data.reports.length === 0 ? (
                <div className="text-center py-16 rounded-xl bg-surface border border-border">
                  <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-accent-surface/50 flex items-center justify-center">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-accent/60">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-text-secondary mb-1">{t.noCreatorReports}</p>
                  <p className="text-xs text-text-tertiary">Check back later for new team reports.</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                      <h2 className="text-base sm:text-lg font-extrabold text-text-primary tracking-tight">
                        Reports
                      </h2>
                      <span className="inline-flex items-center justify-center min-w-[1.75rem] h-6 px-2 text-xs font-bold rounded-full bg-accent/10 text-accent">
                        {data.reports.length}
                      </span>
                    </div>
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
            </div>
          </MotionDiv>
        )}
      </main>
      <PageFooter />
    </div>
  );
}
