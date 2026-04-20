"use client";

import { useState, useEffect } from "react";
import { I18nProvider } from "@/lib/i18n";

import { applyRandomAccent } from "@/lib/utils/random-accent";
import { UserButton, Show, SignInButton, useUser } from "@clerk/nextjs";

import { PageFooter } from "@/components/layout/PageFooter";
import { ReportCard, type ExploreReport } from "@/components/explore/ReportCard";
import { getSpriteUrls } from "@/lib/utils/sprite-slug";

interface DashboardReport extends ExploreReport {
  isPublic?: boolean;
  editToken?: string;
  deletedAt?: string;
  isCollab?: boolean;
}

interface CollabReport extends ExploreReport {
  collabStatus?: string;
}

export function DashboardContent() {
  return (
    <I18nProvider>
      <DashboardInner />
    </I18nProvider>
  );
}

function DashboardInner() {
  const { user, isLoaded } = useUser();
  useEffect(() => { applyRandomAccent(); }, []);

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
    setLoading(true);

    if (tab === "analytics") {
      fetch("/api/user/analytics")
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => { if (data) setAnalytics(data); setLoading(false); })
        .catch(() => setLoading(false));
      return;
    }

    if (tab === "collections") {
      fetch("/api/user/collections")
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => { if (data?.collections) setCollections(data.collections); setLoading(false); })
        .catch(() => setLoading(false));
      return;
    }

    // Load collections in background for the "add to collection" dropdown
    if (tab === "my") {
      fetch("/api/user/collections").then((r) => r.ok ? r.json() : null).then((data) => { if (data?.collections) setCollections(data.collections); }).catch(() => {});
    }

    if (tab === "drafts") {
      fetch("/api/user/drafts")
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => { if (data?.drafts) setDraftReports(data.drafts); setLoading(false); })
        .catch(() => setLoading(false));
      return;
    }

    const endpoint = tab === "my" ? "/api/user/reports" : tab === "trash" ? "/api/user/reports?trash=1" : tab === "feed" ? "/api/user/feed" : tab === "collab" ? "/api/user/collaborations" : "/api/user/saved";
    fetch(endpoint)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.reports) {
          if (tab === "my") setMyReports(data.reports);
          else if (tab === "trash") setTrashReports(data.reports);
          else if (tab === "feed") setFeedReports(data.reports);
          else if (tab === "collab") setCollabReports(data.reports);
          else setSavedReports(data.reports);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [user, tab]);

  return (
    <div className="min-h-screen bg-background text-text-primary">
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 pb-24 sm:pb-12">
        <Show when="signed-out">
          <div className="text-center py-20">
            <h1 className="text-2xl font-extrabold mb-3">Sign in to access your dashboard</h1>
            <p className="text-sm text-text-secondary mb-6">Manage your team reports, save favorites, and track your analytics.</p>
            <SignInButton mode="modal">
              <button className="px-6 py-3 bg-accent text-white text-sm font-bold rounded-xl hover:brightness-110 active:scale-[0.97] shadow-md shadow-accent/30 transition-all tracking-wide cursor-pointer">
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
              <a href="/dashboard/profile" className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-accent bg-accent-surface/50 rounded-lg hover:bg-accent-surface transition-all">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                <span className="hidden sm:inline">Edit Profile</span>
                <span className="sm:hidden">Profile</span>
              </a>
              <a href="/dashboard/privacy" className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-text-tertiary bg-surface-alt/50 rounded-lg hover:bg-surface-alt transition-all">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                <span className="hidden sm:inline">Privacy</span>
                <span className="sm:hidden">Data</span>
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
                        <span className="ml-1 inline-flex items-center justify-center min-w-[16px] h-4 px-1 text-[9px] font-bold bg-amber-500 text-white rounded-full">
                          {draftReports.length}
                        </span>
                      )}
                      {t === "collab" && (() => {
                        const pendingCount = collabReports.filter(r => r.collabStatus === "pending").length;
                        return pendingCount > 0 ? (
                          <span className="ml-1 inline-flex items-center justify-center w-4 h-4 text-[9px] font-bold bg-purple-500 text-white rounded-full">
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
                      await fetch(`/api/user/reports/${r.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isPublic: true }) });
                    }
                    setMyReports((prev) => prev.map((r) => r.isCollab ? r : { ...r, isPublic: true }));
                  }}
                  className="px-2 py-1 text-[10px] font-bold rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 cursor-pointer hover:bg-emerald-500/20 transition-all"
                >
                  All Public
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    for (const r of myReports.filter((r) => r.isPublic && !r.isCollab)) {
                      await fetch(`/api/user/reports/${r.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isPublic: false }) });
                    }
                    setMyReports((prev) => prev.map((r) => r.isCollab ? r : { ...r, isPublic: false }));
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
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  <span className="text-sm font-medium">Loading...</span>
                </div>
              </div>
            ) : (
              <>
                {tab === "drafts" && draftReports.length === 0 && (
                  <div className="text-center py-10 sm:py-16">
                    <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500">
                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </div>
                    <p className="text-sm text-text-secondary mb-1">No drafts yet.</p>
                    <p className="text-xs text-text-tertiary mb-4">Start building a team report and it will auto-save here.</p>
                    <a href="/" className="px-5 py-2.5 bg-accent text-white text-sm font-bold rounded-xl hover:brightness-110 active:scale-[0.97] shadow-md shadow-accent/30 transition-all tracking-wide">
                      Create Report
                    </a>
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
                    <a href="/" className="px-5 py-2.5 bg-accent text-white text-sm font-bold rounded-xl hover:brightness-110 active:scale-[0.97] shadow-md shadow-accent/30 transition-all tracking-wide">
                      Create Report
                    </a>
                  </div>
                )}
                {tab === "saved" && savedReports.length === 0 && (
                  <div className="text-center py-10 sm:py-16">
                    <p className="text-sm text-text-secondary mb-4">No saved reports yet. Browse the Explore page and save teams you like.</p>
                    <a href="/explore" className="px-5 py-2.5 bg-accent text-white text-sm font-bold rounded-xl hover:brightness-110 active:scale-[0.97] shadow-md shadow-accent/30 transition-all tracking-wide">
                      Explore Teams
                    </a>
                  </div>
                )}
                {tab === "feed" && feedReports.length === 0 && (
                  <div className="text-center py-10 sm:py-16">
                    <p className="text-sm text-text-secondary mb-2">Your feed is empty.</p>
                    <p className="text-xs text-text-tertiary mb-4 max-w-sm mx-auto">Follow creators from the Explore page to see their new reports here.</p>
                    <a href="/explore" className="px-5 py-2.5 bg-accent text-white text-sm font-bold rounded-xl hover:brightness-110 active:scale-[0.97] shadow-md shadow-accent/30 transition-all tracking-wide">
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
        </Show>
      </main>
      <PageFooter />
    </div>
  );
}

function DashboardSprite({ species }: { species: string }) {
  const urls = getSpriteUrls(species);
  const [idx, setIdx] = useState(0);
  return (
    <img
      src={urls[Math.min(idx, urls.length - 1)]}
      alt={species}
      width={36}
      height={36}
      className="w-7 h-7 sm:w-9 sm:h-9 object-contain"
      loading="lazy"
      onError={() => setIdx((i) => Math.min(i + 1, urls.length - 1))}
    />
  );
}

/** Draft card with resume and delete actions */
function DraftReportCard({ draft, onDelete }: { draft: DashboardReport; onDelete: (id: string) => void }) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (deleting) return;
    setDeleting(true);
    try {
      const res = await fetch("/api/user/drafts", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draftId: draft.id }),
      });
      if (res.ok) onDelete(draft.id);
    } catch { /* silent */ }
    finally { setDeleting(false); }
  };

  const timeAgo = getTimeAgo(draft.updatedAt ?? draft.createdAt);

  return (
    <div className="group relative bg-surface border border-amber-500/20 rounded-xl overflow-hidden hover:border-amber-500/40 hover:shadow-lg hover:shadow-amber-500/5 transition-all">
      {/* Draft badge */}
      <div className="absolute top-2 right-2 z-10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-600 dark:text-amber-400 rounded-md border border-amber-500/20">
        Draft
      </div>

      {/* Species sprites */}
      <div className="px-3 pt-3 pb-1">
        <div className="flex flex-wrap gap-0.5 min-h-[36px]">
          {(draft.species ?? []).slice(0, 6).map((sp, i) => (
            <DashboardSprite key={`${sp}-${i}`} species={sp} />
          ))}
          {(!draft.species || draft.species.length === 0) && (
            <span className="text-xs text-text-tertiary italic">No team data</span>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="px-3 pb-2">
        {draft.tournamentName && (
          <p className="text-[11px] sm:text-xs font-bold text-text-primary truncate">{draft.tournamentName}</p>
        )}
        {draft.teamSummary && (
          <p className="text-[10px] text-text-tertiary truncate mt-0.5">{draft.teamSummary}</p>
        )}
        <p className="text-[10px] text-text-tertiary mt-1">{timeAgo}</p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 px-3 pb-3">
        <a
          href={`/?draft=${draft.id}`}
          className="flex-1 px-3 py-1.5 text-[11px] font-bold text-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-all"
        >
          Resume
        </a>
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="px-2.5 py-1.5 text-[11px] font-bold rounded-lg bg-surface-alt text-text-tertiary border border-border hover:text-danger hover:border-danger/30 transition-all disabled:opacity-40 cursor-pointer"
        >
          {deleting ? "..." : "Delete"}
        </button>
      </div>
    </div>
  );
}

function getTimeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

/** Report card with edit/visibility/delete controls for owned reports */
function ManagedReportCard({
  report,
  onUpdate,
  onDelete,
  collections,
}: {
  report: DashboardReport;
  onUpdate: (id: string, updates: Partial<DashboardReport>) => void;
  onDelete: (id: string) => void;
  collections?: CollectionData[];
}) {
  const [toggling, setToggling] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showCollectionMenu, setShowCollectionMenu] = useState(false);
  const [addingTo, setAddingTo] = useState<string | null>(null);
  // 0 = idle, 1 = first confirm (Confirm/Cancel), 2 = second confirm (Are you sure?)
  const [deleteStep, setDeleteStep] = useState<0 | 1 | 2>(0);

  const addToCollection = async (collectionId: string) => {
    setAddingTo(collectionId);
    try {
      await fetch("/api/user/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "add-item", collectionId, shareId: report.id }),
      });
    } catch { /* silent */ }
    finally { setAddingTo(null); setShowCollectionMenu(false); }
  };

  const toggleVisibility = async () => {
    if (toggling) return;
    setToggling(true);
    try {
      const res = await fetch(`/api/user/reports/${report.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublic: !report.isPublic }),
      });
      if (res.ok) {
        onUpdate(report.id, { isPublic: !report.isPublic });
      }
    } catch { /* silent */ }
    finally { setToggling(false); }
  };

  const handleDelete = async () => {
    if (deleting) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/user/reports/${report.id}`, { method: "DELETE" });
      if (res.ok) onDelete(report.id);
    } catch { /* silent */ }
    finally { setDeleting(false); setDeleteStep(0); }
  };

  const editUrl = report.editToken
    ? `/s/${report.id}?key=${report.editToken}`
    : `/s/${report.id}`;

  return (
    <div className="bg-surface rounded-xl border border-border shadow-sm overflow-hidden">
      <a href={`/s/${report.id}`} className="block hover:bg-surface-alt/30 transition-colors">
        <div className="px-3 sm:px-4 pt-3 sm:pt-4 pb-1.5">
          <div className="flex items-center justify-center gap-0.5">
            {report.species.map((species, i) => (
              <DashboardSprite key={i} species={species} />
            ))}
          </div>
        </div>
        <div className="px-3 sm:px-4 pb-2">
          <h3 className="text-xs sm:text-sm font-bold text-text-primary leading-tight line-clamp-1">
            {report.tournamentName || report.species.join(" / ")}
          </h3>
          {report.placement && (
            <span className="inline-flex items-center px-1.5 py-0.5 text-[9px] sm:text-[10px] font-extrabold rounded-md tracking-wide bg-accent-surface text-accent mt-1">
              {report.placement}
            </span>
          )}
        </div>
      </a>

      {/* Management controls */}
      <div className="px-2.5 sm:px-4 py-2 sm:py-3 border-t border-border bg-surface-alt/30">
        <div className="flex items-center justify-between gap-1.5">
          <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
            {report.isCollab ? (
              <span className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-bold rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                Collab
              </span>
            ) : (
              <button
                type="button"
                onClick={toggleVisibility}
                disabled={toggling}
                className={`inline-flex items-center gap-1 px-2 py-1 text-[10px] font-bold rounded-md border transition-all cursor-pointer ${
                  report.isPublic
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                    : "bg-surface-alt text-text-tertiary border-border"
                }`}
              >
                {report.isPublic ? "Public" : "Private"}
              </button>
            )}
            <a
              href={editUrl}
              className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-bold rounded-md bg-surface border border-border text-text-secondary hover:text-accent hover:border-accent/30 transition-all"
            >
              Edit
            </a>
            {collections && collections.length > 0 && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowCollectionMenu(!showCollectionMenu)}
                  className="inline-flex items-center px-1.5 sm:px-2 py-1 text-[10px] font-bold rounded-md bg-purple-500/10 text-purple-500 border border-purple-500/20 hover:bg-purple-500/20 transition-all cursor-pointer"
                  title="Add to collection"
                >
                  <span className="hidden sm:inline">+ Collection</span>
                  <svg className="sm:hidden w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" /></svg>
                </button>
                {showCollectionMenu && (
                  <div className="absolute left-0 bottom-full mb-1 sm:bottom-auto sm:top-full sm:mt-1 z-10 bg-surface border border-border rounded-lg shadow-lg py-1 min-w-[160px]">
                    {collections.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => addToCollection(c.id)}
                        disabled={addingTo === c.id}
                        className="w-full text-left px-3 py-2 text-xs font-medium text-text-primary hover:bg-surface-alt transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {addingTo === c.id ? "Adding..." : c.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          {!report.isCollab && (
            deleteStep === 2 ? (
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-bold text-red-500 mr-0.5 hidden sm:inline">Sure?</span>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-2 py-1 text-[10px] font-bold rounded-md bg-red-500 text-white cursor-pointer"
                >
                  {deleting ? "..." : "Delete"}
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteStep(0)}
                  className="px-1.5 py-1 text-[10px] font-bold rounded-md text-text-tertiary cursor-pointer"
                >
                  No
                </button>
              </div>
            ) : deleteStep === 1 ? (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setDeleteStep(2)}
                  className="px-2 py-1 text-[10px] font-bold rounded-md bg-red-500/10 text-red-500 border border-red-500/20 cursor-pointer"
                >
                  Confirm
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteStep(0)}
                  className="px-1.5 py-1 text-[10px] font-bold rounded-md text-text-tertiary cursor-pointer"
                >
                  No
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setDeleteStep(1)}
                className="p-1.5 text-text-tertiary hover:text-red-500 transition-colors cursor-pointer flex-shrink-0"
                title="Delete report"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                </svg>
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}

/** Card for deleted reports in the Trash tab with restore and days-remaining info */
function TrashReportCard({
  report,
  onRestore,
}: {
  report: DashboardReport;
  onRestore: (id: string) => void;
}) {
  const [restoring, setRestoring] = useState(false);

  const daysRemaining = report.deletedAt
    ? Math.max(0, 30 - Math.floor((Date.now() - new Date(report.deletedAt).getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  const handleRestore = async () => {
    if (restoring) return;
    setRestoring(true);
    try {
      const res = await fetch(`/api/user/reports/${report.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ restore: true }),
      });
      if (res.ok) onRestore(report.id);
    } catch { /* silent */ }
    finally { setRestoring(false); }
  };

  return (
    <div className="bg-surface rounded-xl border border-red-500/20 shadow-sm overflow-hidden opacity-75 hover:opacity-100 transition-opacity">
      <div className="px-3 sm:px-4 pt-3 sm:pt-4 pb-1.5">
        <div className="flex items-center justify-center gap-0.5">
          {report.species.map((species, i) => (
            <DashboardSprite key={i} species={species} />
          ))}
        </div>
      </div>
      <div className="px-3 sm:px-4 pb-2">
        <h3 className="text-xs sm:text-sm font-bold text-text-primary leading-tight line-clamp-1">
          {report.tournamentName || report.species.join(" / ")}
        </h3>
        <p className="text-[10px] text-red-500 dark:text-red-400 font-semibold mt-1">
          {daysRemaining > 0 ? `Permanently deleted in ${daysRemaining} day${daysRemaining !== 1 ? "s" : ""}` : "Will be permanently deleted soon"}
        </p>
      </div>
      <div className="px-2.5 sm:px-4 py-2 sm:py-3 border-t border-red-500/10 bg-surface-alt/30 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={handleRestore}
          disabled={restoring}
          className="px-3 py-1.5 text-[10px] font-bold rounded-md bg-accent/10 text-accent border border-accent/20 cursor-pointer hover:bg-accent/20 transition-all active:scale-[0.97]"
        >
          {restoring ? "Restoring..." : "Restore"}
        </button>
      </div>
    </div>
  );
}

/** Card for collaboration invites with accept/decline controls */
function CollabReportCard({
  report,
  onAccept,
  onDecline,
}: {
  report: CollabReport;
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
}) {
  const [acting, setActing] = useState<"accept" | "decline" | null>(null);
  const isPending = report.collabStatus === "pending";

  const handleAction = async (action: "accept" | "decline") => {
    setActing(action);
    try {
      const res = await fetch("/api/user/collaborations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shareId: report.id, action }),
      });
      if (res.ok) {
        if (action === "accept") onAccept(report.id);
        else onDecline(report.id);
      }
    } catch { /* silent */ }
    finally { setActing(null); }
  };

  return (
    <div className={`bg-surface rounded-xl border shadow-sm overflow-hidden ${isPending ? "border-purple-500/30" : "border-border"}`}>
      <a href={isPending ? undefined : `/s/${report.id}`} className={`block ${isPending ? "" : "hover:bg-surface-alt/30"} transition-colors`}>
        <div className="px-3 sm:px-4 pt-3 sm:pt-4 pb-1.5">
          <div className="flex items-center justify-center gap-0.5">
            {report.species.map((species, i) => (
              <DashboardSprite key={i} species={species} />
            ))}
          </div>
        </div>
        <div className="px-3 sm:px-4 pb-2">
          <h3 className="text-xs sm:text-sm font-bold text-text-primary leading-tight line-clamp-1">
            {report.tournamentName || report.species.join(" / ")}
          </h3>
          {report.creatorName && (
            <p className="text-[10px] text-text-secondary mt-0.5">by {report.creatorName}</p>
          )}
        </div>
      </a>

      <div className="px-2.5 sm:px-4 py-2 sm:py-3 border-t border-border bg-surface-alt/30">
        {isPending ? (
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">Pending invite</span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleAction("accept")}
                disabled={acting !== null}
                className="px-2.5 py-1 text-[10px] font-bold rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 cursor-pointer hover:bg-emerald-500/20 transition-all disabled:opacity-40"
              >
                {acting === "accept" ? "..." : "Accept"}
              </button>
              <button
                type="button"
                onClick={() => handleAction("decline")}
                disabled={acting !== null}
                className="px-2.5 py-1 text-[10px] font-bold rounded-md text-text-tertiary border border-border cursor-pointer hover:text-red-500 hover:border-red-500/20 transition-all disabled:opacity-40"
              >
                {acting === "decline" ? "..." : "Decline"}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Collaborator
            </span>
            <a href={`/s/${report.id}`} className="text-[10px] font-bold text-accent hover:underline">
              View
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

/** Analytics data shape from /api/user/analytics */
interface AnalyticsData {
  overview: {
    totalReports: number;
    totalViews: number;
    publicReports: number;
    privateReports: number;
    totalReactions: number;
    totalComments: number;
    totalSaves: number;
    followers: number;
  };
  topByViews: { id: string; species: string[]; tournamentName?: string; viewCount: number; isPublic: boolean; createdAt: string }[];
  recentReports: { id: string; species: string[]; tournamentName?: string; viewCount: number; createdAt: string }[];
  monthlyActivity: { month: string; count: number }[];
  topReactions: { type: string; count: number }[];
  engagement: { reportsWithReactions: number; reportsWithComments: number; reportsSaved: number };
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-surface border border-border rounded-xl px-3 sm:px-4 py-2.5 sm:py-3">
      <p className="text-[9px] sm:text-[10px] font-bold text-text-tertiary uppercase tracking-wider">{label}</p>
      <p className="text-lg sm:text-2xl font-extrabold text-text-primary mt-0.5 sm:mt-1">{value}</p>
      {sub && <p className="text-[9px] sm:text-[10px] text-text-secondary mt-0.5 leading-tight">{sub}</p>}
    </div>
  );
}

function AnalyticsPanel({ data }: { data: AnalyticsData }) {
  const { overview, topByViews, monthlyActivity, topReactions, engagement } = data;
  const maxMonthCount = Math.max(...monthlyActivity.map((m) => m.count), 1);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Overview stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        <StatCard label="Total Views" value={overview.totalViews.toLocaleString()} />
        <StatCard label="Reports" value={overview.totalReports} sub={`${overview.publicReports} public / ${overview.privateReports} private`} />
        <StatCard label="Reactions" value={overview.totalReactions} sub={`on ${engagement.reportsWithReactions} report${engagement.reportsWithReactions !== 1 ? "s" : ""}`} />
        <StatCard label="Comments" value={overview.totalComments} sub={`on ${engagement.reportsWithComments} report${engagement.reportsWithComments !== 1 ? "s" : ""}`} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        <StatCard label="Saves" value={overview.totalSaves} sub={`${engagement.reportsSaved} report${engagement.reportsSaved !== 1 ? "s" : ""} saved`} />
        <StatCard label="Followers" value={overview.followers} />
      </div>

      {/* Monthly activity chart */}
      {monthlyActivity.length > 0 && (
        <div className="bg-surface border border-border rounded-xl px-3 sm:px-4 py-3 sm:py-4">
          <p className="text-[9px] sm:text-[10px] font-bold text-text-tertiary uppercase tracking-wider mb-2 sm:mb-3">Reports Created (Last 6 Months)</p>
          <div className="flex items-end gap-2 h-24">
            {monthlyActivity.map((m) => (
              <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full bg-accent/20 rounded-t-md relative"
                  style={{ height: `${Math.max((m.count / maxMonthCount) * 100, 4)}%` }}
                >
                  <div
                    className="absolute inset-0 bg-accent rounded-t-md"
                    style={{ height: `${(m.count / maxMonthCount) * 100}%` }}
                  />
                </div>
                <span className="text-[9px] text-text-tertiary font-bold">
                  {new Date(m.month + "-01").toLocaleDateString("en-GB", { month: "short" })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top reports by views */}
      {topByViews.length > 0 && (
        <div className="bg-surface border border-border rounded-xl px-3 sm:px-4 py-3 sm:py-4">
          <p className="text-[9px] sm:text-[10px] font-bold text-text-tertiary uppercase tracking-wider mb-2 sm:mb-3">Top Reports by Views</p>
          <div className="space-y-1 sm:space-y-2">
            {topByViews.map((report, i) => (
              <a
                key={report.id}
                href={`/s/${report.id}`}
                className="flex items-center justify-between gap-2 sm:gap-3 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg hover:bg-surface-alt/50 transition-colors"
              >
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <span className="text-[10px] sm:text-xs font-extrabold text-text-tertiary w-4 sm:w-5 flex-shrink-0">{i + 1}</span>
                  <div className="hidden sm:flex items-center gap-0.5">
                    {report.species.slice(0, 3).map((s, j) => (
                      <DashboardSprite key={j} species={s} />
                    ))}
                    {report.species.length > 3 && <span className="text-[10px] text-text-tertiary ml-1">+{report.species.length - 3}</span>}
                  </div>
                  <span className="text-[11px] sm:text-xs font-bold text-text-primary truncate">
                    {report.tournamentName || report.species.join(" / ")}
                  </span>
                </div>
                <span className="text-[10px] sm:text-xs font-extrabold text-text-secondary whitespace-nowrap flex-shrink-0">
                  {report.viewCount.toLocaleString()}
                </span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Top reactions */}
      {topReactions.length > 0 && (
        <div className="bg-surface border border-border rounded-xl px-3 sm:px-4 py-3 sm:py-4">
          <p className="text-[9px] sm:text-[10px] font-bold text-text-tertiary uppercase tracking-wider mb-2 sm:mb-3">Top Reactions</p>
          <div className="flex flex-wrap gap-3">
            {topReactions.map((r) => (
              <div key={r.type} className="flex items-center gap-1.5 bg-surface-alt/50 px-3 py-1.5 rounded-lg">
                <span className="text-base">{r.type}</span>
                <span className="text-xs font-extrabold text-text-secondary">{r.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/** Collection data from /api/user/collections */
interface CollectionData {
  id: string;
  name: string;
  description?: string;
  regulation?: string;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
}

function CollectionsPanel({ collections, onUpdate }: { collections: CollectionData[]; onUpdate: () => void }) {
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newReg, setNewReg] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [expandedItems, setExpandedItems] = useState<ExploreReport[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);

  const handleCreate = async () => {
    if (!newName.trim() || creating) return;
    setCreating(true);
    try {
      const res = await fetch("/api/user/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create", name: newName.trim(), description: newDesc.trim() || undefined, regulation: newReg.trim() || undefined }),
      });
      if (res.ok) {
        setNewName("");
        setNewDesc("");
        setNewReg("");
        onUpdate();
      }
    } catch { /* silent */ }
    finally { setCreating(false); }
  };

  const handleDelete = async (id: string) => {
    await fetch("/api/user/collections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", collectionId: id }),
    });
    if (expanded === id) { setExpanded(null); setExpandedItems([]); }
    onUpdate();
  };

  const handleExpand = async (id: string) => {
    if (expanded === id) { setExpanded(null); setExpandedItems([]); return; }
    setExpanded(id);
    setLoadingItems(true);
    try {
      const res = await fetch(`/api/user/collections/${id}`);
      if (res.ok) {
        const data = await res.json();
        setExpandedItems(data.items ?? []);
      }
    } catch { /* silent */ }
    finally { setLoadingItems(false); }
  };

  const handleRemoveItem = async (collectionId: string, shareId: string) => {
    await fetch("/api/user/collections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "remove-item", collectionId, shareId }),
    });
    setExpandedItems((prev) => prev.filter((i) => i.id !== shareId));
    onUpdate();
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Create new collection */}
      <div className="bg-surface border border-border rounded-xl px-3 sm:px-4 py-3 sm:py-4">
        <p className="text-[9px] sm:text-[10px] font-bold text-text-tertiary uppercase tracking-wider mb-2 sm:mb-3">New Collection</p>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Collection name"
            className="flex-1 px-2.5 sm:px-3 py-1.5 sm:py-2 bg-surface-alt border border-border rounded-lg text-xs sm:text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/40"
          />
          <input
            type="text"
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            placeholder="Description (optional)"
            className="flex-1 px-2.5 sm:px-3 py-1.5 sm:py-2 bg-surface-alt border border-border rounded-lg text-xs sm:text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/40"
          />
          <select
            value={newReg}
            onChange={(e) => setNewReg(e.target.value)}
            className="px-2.5 sm:px-3 py-1.5 sm:py-2 bg-surface-alt border border-border rounded-lg text-xs sm:text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/40"
          >
            <option value="">Regulation</option>
            <option value="Reg H">Reg H</option>
            <option value="Reg G">Reg G</option>
            <option value="Reg F">Reg F</option>
            <option value="Champions">Champions</option>
          </select>
          <button
            onClick={handleCreate}
            disabled={!newName.trim() || creating}
            className="px-4 py-2 bg-accent text-white text-sm font-bold rounded-lg hover:brightness-110 active:scale-[0.97] shadow-sm shadow-accent/30 transition-all disabled:opacity-40 tracking-wide flex-shrink-0"
          >
            {creating ? "Creating..." : "Create"}
          </button>
        </div>
      </div>

      {/* Existing collections */}
      {collections.length === 0 && (
        <div className="text-center py-12">
          <p className="text-sm text-text-secondary mb-2">No collections yet.</p>
          <p className="text-xs text-text-tertiary">Create a collection to organize your team reports — like playlists for teams.</p>
        </div>
      )}

      {collections.map((c) => (
        <div key={c.id} className="bg-surface border border-border rounded-xl overflow-hidden">
          <button
            type="button"
            onClick={() => handleExpand(c.id)}
            className="w-full px-4 py-3 flex items-center justify-between gap-3 hover:bg-surface-alt/30 transition-colors cursor-pointer"
          >
            <div className="text-left min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-text-primary truncate">{c.name}</h3>
                {c.regulation && (
                  <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-md bg-accent-surface text-accent tracking-wide flex-shrink-0">
                    {c.regulation}
                  </span>
                )}
              </div>
              {c.description && <p className="text-xs text-text-secondary mt-0.5 truncate">{c.description}</p>}
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <span className="text-xs font-bold text-text-tertiary">
                {c.itemCount} {c.itemCount === 1 ? "team" : "teams"}
              </span>
              <svg
                width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                className={`text-text-tertiary transition-transform ${expanded === c.id ? "rotate-180" : ""}`}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
          </button>

          {expanded === c.id && (
            <div className="border-t border-border px-4 py-3">
              {loadingItems ? (
                <div className="flex justify-center py-4">
                  <svg className="animate-spin h-4 w-4 text-text-tertiary" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                </div>
              ) : expandedItems.length === 0 ? (
                <p className="text-xs text-text-tertiary text-center py-4">
                  No teams in this collection yet. Add teams from your reports using the menu on each report card.
                </p>
              ) : (
                <div className="space-y-2">
                  {expandedItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg hover:bg-surface-alt/50 transition-colors">
                      <a href={`/s/${item.id}`} className="flex items-center gap-3 min-w-0">
                        <div className="flex items-center gap-0.5 flex-shrink-0">
                          {item.species.slice(0, 3).map((s, j) => (
                            <DashboardSprite key={j} species={s} />
                          ))}
                        </div>
                        <span className="text-xs font-bold text-text-primary truncate">
                          {item.tournamentName || item.species.join(" / ")}
                        </span>
                      </a>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(c.id, item.id)}
                        className="p-1 text-text-tertiary hover:text-red-500 transition-colors cursor-pointer flex-shrink-0"
                        title="Remove from collection"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-end mt-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => handleDelete(c.id)}
                  className="px-3 py-1 text-[10px] font-bold rounded-md text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                >
                  Delete Collection
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
