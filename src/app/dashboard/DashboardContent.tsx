"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { I18nProvider } from "@/lib/i18n";

import { useRandomAccent } from "@/hooks/useRandomAccent";
import { Show, SignInButton, useUser } from "@clerk/nextjs";

import { PageFooter } from "@/components/layout/PageFooter";
import { MatchTracker } from "@/components/match-tracker/MatchTracker";
import { ReportCard, type ExploreReport } from "@/components/explore/ReportCard";
import { SpinnerIcon, UserIcon, ShieldIcon, BellIcon, PencilIcon } from "@/components/ui/icons";
import type { AnalyticsData, CollabReport, CollectionData, DashboardReport } from "./dashboard-types";
import { DraftReportCard } from "./DraftReportCard";
import { ManagedReportCard } from "./ManagedReportCard";
import { TrashReportCard } from "./TrashReportCard";
import { CollabReportCard } from "./CollabReportCard";
import { AnalyticsPanel } from "./AnalyticsPanel";
import { CollectionsPanel } from "./CollectionsPanel";

export function DashboardContent() {
  return (
    <I18nProvider>
      <DashboardInner />
    </I18nProvider>
  );
}

function DashboardInner() {
  const { user, isLoaded } = useUser();
  useRandomAccent();

  const [tab, setTab] = useState<"drafts" | "my" | "saved" | "feed" | "collab" | "collections" | "analytics" | "trash">("drafts");
  const [draftReports, setDraftReports] = useState<DashboardReport[]>([]);
  const [myReports, setMyReports] = useState<DashboardReport[]>([]);
  const [savedReports, setSavedReports] = useState<ExploreReport[]>([]);
  const [feedReports, setFeedReports] = useState<ExploreReport[]>([]);
  const [collabReports, setCollabReports] = useState<CollabReport[]>([]);
  const [trashReports, setTrashReports] = useState<DashboardReport[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [collections, setCollections] = useState<CollectionData[]>([]);
  const [loading, setLoading] = useState(true);

  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "views" | "name">("newest");


  // Eagerly load draft count on mount so the badge shows on all tabs
  useEffect(() => {
    if (!user) return;
    fetch("/api/user/drafts")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (data?.drafts) setDraftReports(data.drafts); })
      .catch(() => {});
  }, [user]);

  useEffect(() => {
    if (!user) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- loading flag for the fetch this effect starts
    setLoading(true);

    // Guard against a tab-switch race: a slow response from a previously
    // selected tab could otherwise resolve after the user moved on and both
    // populate the wrong tab AND clear the new tab's loading spinner
    // (Finding 4.5). `cancelled` blocks stale state writes; the AbortController
    // cancels the in-flight request on cleanup.
    let cancelled = false;
    const ac = new AbortController();
    const json = (r: Response) => (r.ok ? r.json() : null);
    const stopLoading = () => { if (!cancelled) setLoading(false); };

    if (tab === "analytics") {
      fetch("/api/user/analytics", { signal: ac.signal })
        .then(json)
        .then((data) => { if (cancelled) return; if (data) setAnalytics(data); setLoading(false); })
        .catch(stopLoading);
    } else if (tab === "collections") {
      fetch("/api/user/collections", { signal: ac.signal })
        .then(json)
        .then((data) => { if (cancelled) return; if (data?.collections) setCollections(data.collections); setLoading(false); })
        .catch(stopLoading);
    } else if (tab === "drafts") {
      fetch("/api/user/drafts", { signal: ac.signal })
        .then(json)
        .then((data) => { if (cancelled) return; if (data?.drafts) setDraftReports(data.drafts); setLoading(false); })
        .catch(stopLoading);
    } else {
      // Load collections in background for the "add to collection" dropdown
      if (tab === "my") {
        fetch("/api/user/collections", { signal: ac.signal }).then(json).then((data) => { if (!cancelled && data?.collections) setCollections(data.collections); }).catch(() => {});
      }

      const endpoint = tab === "my" ? "/api/user/reports" : tab === "trash" ? "/api/user/reports?trash=1" : tab === "feed" ? "/api/user/feed" : tab === "collab" ? "/api/user/collaborations" : "/api/user/saved";
      fetch(endpoint, { signal: ac.signal })
        .then(json)
        .then((data) => {
          if (cancelled) return;
          if (data?.reports) {
            if (tab === "my") setMyReports(data.reports);
            else if (tab === "trash") setTrashReports(data.reports);
            else if (tab === "feed") setFeedReports(data.reports);
            else if (tab === "collab") setCollabReports(data.reports);
            else setSavedReports(data.reports);
          }
          setLoading(false);
        })
        .catch(stopLoading);
    }

    return () => { cancelled = true; ac.abort(); };
  }, [user, tab]);

  return (
    <div className="min-h-screen bg-background text-text-primary">
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 pb-24 sm:pb-12">
        <Show when="signed-out">
          <div className="text-center py-20">
            <h1 className="text-2xl font-extrabold mb-3">Sign in to access your dashboard</h1>
            <p className="text-sm text-text-secondary mb-6">Manage your team reports, save favorites, and track your analytics.</p>
            <SignInButton mode="modal">
              <button className="px-6 py-3 bg-accent text-accent-foreground text-sm font-bold rounded-xl hover:brightness-110 active:scale-[0.97] shadow-md shadow-accent/30 transition-all tracking-wide cursor-pointer">
                Sign In
              </button>
            </SignInButton>
          </div>
        </Show>

        <Show when="signed-in">
          <div className="animate-fade-in">
            {/* Header */}
            <div className="mb-4 sm:mb-8 flex items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  {isLoaded && user ? `${user.firstName || user.username || "Trainer"}'s Dashboard` : "Dashboard"}
                </h1>
                <p className="text-xs sm:text-sm text-text-secondary mt-0.5">
                  Manage your reports and favorites.
                </p>
              </div>
              <a href="/dashboard/profile" aria-label="Edit Profile" className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-accent bg-accent-surface/50 rounded-lg hover:bg-accent-surface transition-all">
                <UserIcon width="12" height="12" />
                <span className="hidden sm:inline">Edit Profile</span>
                <span className="sm:hidden">Profile</span>
              </a>
              <a href="/dashboard/privacy" aria-label="Privacy" className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-text-tertiary bg-surface-alt/50 rounded-lg hover:bg-surface-alt transition-all">
                <ShieldIcon width="12" height="12" />
                <span className="hidden sm:inline">Privacy</span>
                <span className="sm:hidden">Data</span>
              </a>
              <a href="/dashboard/notifications" aria-label="Notifications" className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-text-tertiary bg-surface-alt/50 rounded-lg hover:bg-surface-alt transition-all">
                <BellIcon width="12" height="12" />
                <span className="hidden sm:inline">Notifications</span>
                <span className="sm:hidden">Alerts</span>
              </a>
            </div>

            {/* Tabs */}
            <div className="mb-3 sm:mb-6 -mx-3 sm:mx-0">
              <div className="flex items-center gap-1 px-3 sm:px-1 py-1 bg-surface-alt/50 sm:rounded-xl overflow-x-auto scrollbar-none snap-x snap-mandatory">
                {(["drafts", "my", "saved", "feed", "collab", "collections", "analytics", "trash"] as const).map((t) => {
                  const label = t === "drafts" ? "Drafts" : t === "my" ? "Reports" : t === "feed" ? "Feed" : t === "collab" ? "Shared" : t === "collections" ? "Collections" : t === "analytics" ? "Analytics" : t === "trash" ? "Trash" : "Saved";
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTab(t)}
                      className={`px-3 sm:px-4 py-1.5 sm:py-2 text-[11px] sm:text-sm font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap flex-shrink-0 snap-start ${
                        tab === t
                          ? t === "trash" ? "bg-red-500/10 text-red-500 shadow-sm"
                            : t === "analytics" ? "bg-blue-500/10 text-blue-500 shadow-sm"
                            : t === "collections" ? "bg-purple-500/10 text-purple-500 shadow-sm"
                            : t === "drafts" ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 shadow-sm"
                            : "bg-surface text-text-primary shadow-sm"
                          : "text-text-tertiary hover:text-text-primary active:scale-[0.97]"
                      }`}
                    >
                      {label}
                      {t === "drafts" && draftReports.length > 0 && (
                        <span className="ml-1 inline-flex items-center justify-center min-w-[16px] h-4 px-1 text-[10px] font-bold bg-amber-500 text-white rounded-full">
                          {draftReports.length}
                        </span>
                      )}
                      {t === "collab" && (() => {
                        const pendingCount = collabReports.filter(r => r.collabStatus === "pending").length;
                        return pendingCount > 0 ? (
                          <span className="ml-1 inline-flex items-center justify-center w-4 h-4 text-[10px] font-bold bg-purple-500 text-white rounded-full">
                            {pendingCount}
                          </span>
                        ) : null;
                      })()}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sort (separate row on mobile) */}
            {tab === "my" && myReports.length > 1 && (
              <div className="flex items-center justify-between gap-2 mb-3 sm:mb-4">
                <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">{myReports.length} reports</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as "newest" | "oldest" | "views" | "name")}
                  className="px-2.5 py-1.5 bg-surface border border-border rounded-lg text-[11px] sm:text-xs font-semibold text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/40 cursor-pointer"
                >
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                  <option value="views">Most Views</option>
                  <option value="name">Name</option>
                </select>
              </div>
            )}

            {/* Bulk actions */}
            {tab === "my" && myReports.length > 1 && (
              <div className="flex items-center gap-1.5 mb-3">
                <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">Bulk:</span>
                <button
                  type="button"
                  onClick={async () => {
                    for (const r of myReports.filter((r) => !r.isPublic && !r.isCollab)) {
                      await fetch(`/api/user/reports/${r.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isPublic: true, isUnlisted: false }) });
                    }
                    setMyReports((prev) => prev.map((r) => r.isCollab ? r : { ...r, isPublic: true, isUnlisted: false }));
                  }}
                  className="px-2 py-1 text-[10px] font-bold rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 cursor-pointer hover:bg-emerald-500/20 transition-all"
                >
                  All Public
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    // Include Unlisted reports (isPublic === false) — they were
                    // previously skipped, so "All Private" left them Unlisted.
                    for (const r of myReports.filter((r) => (r.isPublic || r.isUnlisted) && !r.isCollab)) {
                      await fetch(`/api/user/reports/${r.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isPublic: false, isUnlisted: false }) });
                    }
                    setMyReports((prev) => prev.map((r) => r.isCollab ? r : { ...r, isPublic: false, isUnlisted: false }));
                  }}
                  className="px-2 py-1 text-[10px] font-bold rounded-md bg-surface-alt text-text-tertiary border border-border cursor-pointer hover:bg-surface transition-all"
                >
                  All Private
                </button>
              </div>
            )}

            {/* Content — reserve viewport height during loading so the
                final content arriving doesn't reflow the page (CLS fix). */}
            {loading ? (
              <div className="flex justify-center items-start pt-16 min-h-[60vh]">
                <div className="flex items-center gap-3 text-text-secondary">
                  <SpinnerIcon className="animate-spin h-5 w-5" />
                  <span className="text-sm font-medium">Loading...</span>
                </div>
              </div>
            ) : (
              <>
                {tab === "drafts" && draftReports.length === 0 && (
                  <div className="text-center py-10 sm:py-16">
                    <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                      <PencilIcon width="24" height="24" className="text-amber-500" />
                    </div>
                    <p className="text-sm text-text-secondary mb-1">No drafts yet.</p>
                    <p className="text-xs text-text-tertiary mb-4">Start building a team report and it will auto-save here.</p>
                    <Link href="/" className="inline-flex min-h-11 items-center px-5 py-2.5 bg-accent text-accent-foreground text-sm font-bold rounded-xl hover:brightness-110 active:scale-[0.97] shadow-md shadow-accent/30 transition-all tracking-wide">
                      Create Report
                    </Link>
                  </div>
                )}
                {tab === "drafts" && draftReports.length > 0 && (
                  <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl px-4 py-3 mb-4">
                    <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold">
                      Drafts are auto-saved while you build. Resume editing or share when ready.
                    </p>
                  </div>
                )}
                {tab === "my" && myReports.length === 0 && (
                  <div className="text-center py-10 sm:py-16">
                    <p className="text-sm text-text-secondary mb-4">No reports yet. Create a team report to get started.</p>
                    <Link href="/" className="inline-flex min-h-11 items-center px-5 py-2.5 bg-accent text-accent-foreground text-sm font-bold rounded-xl hover:brightness-110 active:scale-[0.97] shadow-md shadow-accent/30 transition-all tracking-wide">
                      Create Report
                    </Link>
                  </div>
                )}
                {tab === "saved" && savedReports.length === 0 && (
                  <div className="text-center py-10 sm:py-16">
                    <p className="text-sm text-text-secondary mb-4">No saved reports yet. Browse the Explore page and save teams you like.</p>
                    <a href="/explore" className="px-5 py-2.5 bg-accent text-accent-foreground text-sm font-bold rounded-xl hover:brightness-110 active:scale-[0.97] shadow-md shadow-accent/30 transition-all tracking-wide">
                      Explore Teams
                    </a>
                  </div>
                )}
                {tab === "feed" && feedReports.length === 0 && (
                  <div className="text-center py-10 sm:py-16">
                    <p className="text-sm text-text-secondary mb-2">Your feed is empty.</p>
                    <p className="text-xs text-text-tertiary mb-4 max-w-sm mx-auto">Follow creators from the Explore page to see their new reports here.</p>
                    <a href="/explore" className="px-5 py-2.5 bg-accent text-accent-foreground text-sm font-bold rounded-xl hover:brightness-110 active:scale-[0.97] shadow-md shadow-accent/30 transition-all tracking-wide">
                      Find Creators
                    </a>
                  </div>
                )}
                {tab === "collab" && collabReports.length === 0 && (
                  <div className="text-center py-10 sm:py-16">
                    <p className="text-sm text-text-secondary mb-2">No collaboration invites yet.</p>
                    <p className="text-xs text-text-tertiary max-w-sm mx-auto">When someone invites you to collaborate on a team report, it will appear here for you to accept or decline.</p>
                  </div>
                )}
                {tab === "collab" && collabReports.some((r) => r.collabStatus === "pending") && (
                  <div className="bg-purple-500/5 border border-purple-500/20 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 mb-4">
                    <p className="text-xs font-bold text-purple-600 dark:text-purple-400">
                      You have pending collaboration invites. Accept to get co-creator credit and edit access.
                    </p>
                  </div>
                )}
                {tab === "trash" && trashReports.length === 0 && (
                  <div className="text-center py-10 sm:py-16">
                    <p className="text-sm text-text-secondary mb-2">Trash is empty.</p>
                    <p className="text-xs text-text-tertiary">Deleted reports appear here for 30 days before being permanently removed.</p>
                  </div>
                )}
                {tab === "collections" && (
                  <CollectionsPanel
                    collections={collections}
                    onUpdate={() => {
                      fetch("/api/user/collections").then((r) => r.ok ? r.json() : null).then((data) => { if (data?.collections) setCollections(data.collections); });
                    }}
                  />
                )}
                {tab === "analytics" && analytics && (
                  <AnalyticsPanel data={analytics} />
                )}
                {tab === "analytics" && !analytics && !loading && (
                  <div className="text-center py-10 sm:py-16">
                    <p className="text-sm text-text-secondary">No analytics data available yet. Create some reports first!</p>
                  </div>
                )}
                {tab === "trash" && trashReports.length > 0 && (
                  <div className="bg-red-500/5 border border-red-500/20 rounded-xl px-4 py-3 mb-4">
                    <p className="text-xs text-red-500 dark:text-red-400 font-semibold">
                      Deleted reports are automatically permanently removed after 30 days.
                    </p>
                  </div>
                )}
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-4">
                  {tab === "drafts"
                    ? draftReports.map((draft) => (
                        <DraftReportCard
                          key={draft.id}
                          draft={draft}
                          onDelete={(id) => {
                            setDraftReports((prev) => prev.filter((d) => d.id !== id));
                          }}
                        />
                      ))
                    : tab === "my"
                    ? [...myReports].sort((a, b) => {
                        if (sortBy === "oldest") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                        if (sortBy === "views") return (b.viewCount ?? 0) - (a.viewCount ?? 0);
                        if (sortBy === "name") return (a.tournamentName ?? "").localeCompare(b.tournamentName ?? "");
                        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                      }).map((report) => (
                        <ManagedReportCard
                          key={report.id}
                          report={report}
                          collections={collections}
                          onUpdate={(id, updates) => {
                            setMyReports((prev) => prev.map((r) => r.id === id ? { ...r, ...updates } : r));
                          }}
                          onDelete={(id) => {
                            setMyReports((prev) => prev.filter((r) => r.id !== id));
                          }}
                        />
                      ))
                    : tab === "trash"
                    ? trashReports.map((report) => (
                        <TrashReportCard
                          key={report.id}
                          report={report}
                          onRestore={(id) => {
                            setTrashReports((prev) => prev.filter((r) => r.id !== id));
                          }}
                        />
                      ))
                    : tab === "saved"
                    ? savedReports.map((report) => (
                        <ReportCard key={report.id} report={report} />
                      ))
                    : tab === "feed"
                    ? feedReports.map((report) => (
                        <ReportCard key={report.id} report={report} />
                      ))
                    : tab === "collab"
                    ? collabReports.map((report) => (
                        <CollabReportCard
                          key={report.id}
                          report={report}
                          onAccept={(id) => {
                            setCollabReports((prev) => prev.map((r) => r.id === id ? { ...r, collabStatus: "accepted" } : r));
                          }}
                          onDecline={(id) => {
                            setCollabReports((prev) => prev.filter((r) => r.id !== id));
                          }}
                        />
                      ))
                    : null
                  }
                </div>
              </>
            )}
          </div>

          {/* Match Tracker section */}
          <div className="mt-6 sm:mt-8">
            <MatchTracker />
          </div>
        </Show>
      </main>
      <PageFooter />
    </div>
  );
}
