"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { I18nProvider } from "@/lib/i18n";
import { useDarkMode } from "@/hooks/useDarkMode";
import { applyRandomAccent } from "@/lib/utils/random-accent";
import { UserButton, Show, SignInButton, useUser } from "@clerk/nextjs";
import { ReportCard, type ExploreReport } from "@/components/explore/ReportCard";

interface DashboardReport extends ExploreReport {
  isPublic?: boolean;
  editToken?: string;
}

export function DashboardContent() {
  return (
    <I18nProvider>
      <DashboardInner />
    </I18nProvider>
  );
}

function DashboardInner() {
  const { darkMode, setDarkMode } = useDarkMode();
  const { user, isLoaded } = useUser();
  useEffect(() => { applyRandomAccent(); }, []);

  const [tab, setTab] = useState<"my" | "saved">("my");
  const [myReports, setMyReports] = useState<DashboardReport[]>([]);
  const [savedReports, setSavedReports] = useState<ExploreReport[]>([]);
  const [loading, setLoading] = useState(true);

  // Claim input
  const [claimUrl, setClaimUrl] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "views" | "name">("newest");
  const [claiming, setClaiming] = useState(false);
  const [claimResult, setClaimResult] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const endpoint = tab === "my" ? "/api/user/reports" : "/api/user/saved";
    fetch(endpoint)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.reports) {
          if (tab === "my") setMyReports(data.reports);
          else setSavedReports(data.reports);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [user, tab]);

  // Auto-detect unclaimed reports from localStorage
  const [localToken, setLocalToken] = useState<{ shareId: string; editToken: string } | null>(null);
  useEffect(() => {
    if (!user) return;
    try {
      const stored = localStorage.getItem("vgc-share-tokens");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.shareId && parsed.editToken) {
          // Check if already claimed
          const alreadyOwned = myReports.some((r) => r.id === parsed.shareId);
          if (!alreadyOwned) {
            setLocalToken(parsed);
          }
        }
      }
    } catch { /* ignore */ }
  }, [user, myReports]);

  const handleAutoClaimLocal = async () => {
    if (!localToken) return;
    setClaiming(true);
    try {
      const res = await fetch("/api/user/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(localToken),
      });
      if (res.ok) {
        setClaimResult("Report claimed from this browser!");
        setLocalToken(null);
        fetch("/api/user/reports")
          .then((r) => (r.ok ? r.json() : null))
          .then((data) => { if (data?.reports) setMyReports(data.reports); });
      }
    } catch { /* silent */ }
    finally { setClaiming(false); }
  };

  const handleClaim = async () => {
    if (!claimUrl.trim() || claiming) return;
    setClaiming(true);
    setClaimResult(null);

    // Extract shareId and key from various URL formats
    // Full URL: https://pokemonvgcteamreport.com/s/ABC123?key=xxx
    // Path: /s/ABC123?key=xxx
    // Just params: ABC123?key=xxx
    const input = claimUrl.replace(/\s+/g, "").trim();
    const match = input.match(/(?:\/s\/)?([A-Za-z0-9]{6,12})\?key=([A-Fa-f0-9]+)/);
    if (!match) {
      setClaimResult("Invalid edit link. Paste your edit link — it looks like: .../s/ABC123?key=...");
      setClaiming(false);
      return;
    }

    try {
      const res = await fetch("/api/user/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shareId: match[1], editToken: match[2] }),
      });
      if (res.ok) {
        setClaimResult("Report claimed! It now appears in My Reports.");
        setClaimUrl("");
        // Refresh my reports
        fetch("/api/user/reports")
          .then((r) => (r.ok ? r.json() : null))
          .then((data) => { if (data?.reports) setMyReports(data.reports); });
      } else {
        const data = await res.json().catch(() => null);
        setClaimResult(data?.error ?? "Failed to claim report");
      }
    } catch {
      setClaimResult("Network error");
    } finally {
      setClaiming(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-text-primary">
      {/* Navbar */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-surface/90 border-b border-border shadow-[0_1px_8px_rgba(0,0,0,0.06)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2 font-bold text-sm hover:opacity-80 transition-opacity">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent"><polyline points="15 18 9 12 15 6" /></svg>
            <span className="text-text-primary">VGC Team</span>
            <span className="text-accent">Report</span>
          </a>
          <div className="flex items-center gap-3">
            <a href="/explore" className="text-xs font-bold text-text-secondary hover:text-accent transition-colors">Explore</a>
            <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-alt transition-all" aria-label="Toggle dark mode">
              {darkMode ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" /></svg>
              )}
            </button>
            <Show when="signed-in">
              <UserButton appearance={{ elements: { avatarBox: "w-8 h-8" } }} />
            </Show>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <Show when="signed-out">
          <div className="text-center py-20">
            <h1 className="text-2xl font-extrabold mb-3">Sign in to access your dashboard</h1>
            <p className="text-sm text-text-secondary mb-6">Manage your team reports, save favorites, and claim existing reports.</p>
            <SignInButton mode="modal">
              <button className="px-6 py-3 bg-accent text-white text-sm font-bold rounded-xl hover:brightness-110 active:scale-[0.97] shadow-md shadow-accent/30 transition-all tracking-wide cursor-pointer">
                Sign In
              </button>
            </SignInButton>
          </div>
        </Show>

        <Show when="signed-in">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                {isLoaded && user ? `Welcome, ${user.firstName || user.username || "Trainer"}` : "Dashboard"}
              </h1>
              <p className="text-sm text-text-secondary mt-1">
                Manage your team reports and saved favorites.
              </p>
              <a href="/dashboard/profile" className="inline-flex items-center gap-1.5 mt-2 text-xs font-bold text-accent hover:underline">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                Edit Creator Profile
              </a>
            </div>

            {/* Tabs + Sort */}
            <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
            <div className="flex items-center gap-1 p-1 bg-surface-alt/50 rounded-xl w-fit">
              {(["my", "saved"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className={`px-4 py-2 text-sm font-bold rounded-lg transition-all cursor-pointer ${
                    tab === t
                      ? "bg-surface text-text-primary shadow-sm"
                      : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  {t === "my" ? "My Reports" : "Saved"}
                </button>
              ))}
            </div>
            {tab === "my" && myReports.length > 1 && (
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "newest" | "oldest" | "views" | "name")}
                className="px-3 py-2 bg-surface border border-border rounded-lg text-xs font-semibold text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/40 cursor-pointer"
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="views">Most views</option>
                <option value="name">By name</option>
              </select>
            )}
            </div>

            {/* Bulk actions */}
            {tab === "my" && myReports.length > 1 && (
              <div className="flex items-center gap-2 mb-4">
                <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">Bulk:</span>
                <button
                  type="button"
                  onClick={async () => {
                    for (const r of myReports.filter((r) => !r.isPublic)) {
                      await fetch(`/api/user/reports/${r.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isPublic: true }) });
                    }
                    setMyReports((prev) => prev.map((r) => ({ ...r, isPublic: true })));
                  }}
                  className="px-2 py-1 text-[10px] font-bold rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 cursor-pointer hover:bg-emerald-500/20 transition-all"
                >
                  All Public
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    for (const r of myReports.filter((r) => r.isPublic)) {
                      await fetch(`/api/user/reports/${r.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isPublic: false }) });
                    }
                    setMyReports((prev) => prev.map((r) => ({ ...r, isPublic: false })));
                  }}
                  className="px-2 py-1 text-[10px] font-bold rounded-md bg-surface-alt text-text-tertiary border border-border cursor-pointer hover:bg-surface transition-all"
                >
                  All Private
                </button>
              </div>
            )}

            {/* Claim report section */}
            {tab === "my" && (
              <>
              {/* Auto-detected report from this browser */}
              {localToken && (
                <div className="bg-accent-surface/50 border-2 border-accent/20 rounded-xl px-4 py-3 mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-text-primary">Report found in this browser</p>
                    <p className="text-xs text-text-secondary mt-0.5">
                      We detected report <span className="font-mono font-bold">{localToken.shareId}</span> from your localStorage. Claim it to link it to your account.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAutoClaimLocal}
                    disabled={claiming}
                    className="px-4 py-2 bg-accent text-white text-xs font-bold rounded-lg hover:brightness-110 active:scale-[0.97] shadow-sm shadow-accent/30 transition-all disabled:opacity-40 tracking-wide flex-shrink-0"
                  >
                    {claiming ? "Claiming..." : "Claim"}
                  </button>
                </div>
              )}

              <div className="bg-surface border border-border rounded-xl px-4 py-3 mb-6">
                <p className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">
                  Claim an existing report
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={claimUrl}
                    onChange={(e) => setClaimUrl(e.target.value)}
                    placeholder="Paste your edit link (e.g., https://pokemonvgcteamreport.com/s/ABC123?key=...)"
                    className="flex-1 px-3 py-2 bg-surface-alt border border-border rounded-lg text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all"
                  />
                  <button
                    type="button"
                    onClick={handleClaim}
                    disabled={!claimUrl.trim() || claiming}
                    className="px-4 py-2 bg-accent text-white text-xs font-bold rounded-lg hover:brightness-110 active:scale-[0.97] shadow-sm shadow-accent/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed tracking-wide flex-shrink-0"
                  >
                    {claiming ? "Claiming..." : "Claim"}
                  </button>
                </div>
                {claimResult && (
                  <p className={`text-xs font-bold mt-2 ${claimResult.includes("claimed") ? "text-emerald-600 dark:text-emerald-400" : "text-danger"}`}>
                    {claimResult}
                  </p>
                )}
              </div>
              </>
            )}

            {/* Content */}
            {loading ? (
              <div className="flex justify-center py-16">
                <div className="flex items-center gap-3 text-text-secondary">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  <span className="text-sm font-medium">Loading...</span>
                </div>
              </div>
            ) : (
              <>
                {tab === "my" && myReports.length === 0 && (
                  <div className="text-center py-16">
                    <p className="text-sm text-text-secondary mb-4">No reports yet. Create a team report or claim an existing one.</p>
                    <a href="/" className="px-5 py-2.5 bg-accent text-white text-sm font-bold rounded-xl hover:brightness-110 active:scale-[0.97] shadow-md shadow-accent/30 transition-all tracking-wide">
                      Create Report
                    </a>
                  </div>
                )}
                {tab === "saved" && savedReports.length === 0 && (
                  <div className="text-center py-16">
                    <p className="text-sm text-text-secondary mb-4">No saved reports yet. Browse the Explore page and save teams you like.</p>
                    <a href="/explore" className="px-5 py-2.5 bg-accent text-white text-sm font-bold rounded-xl hover:brightness-110 active:scale-[0.97] shadow-md shadow-accent/30 transition-all tracking-wide">
                      Explore Teams
                    </a>
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {tab === "my"
                    ? [...myReports].sort((a, b) => {
                        if (sortBy === "oldest") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                        if (sortBy === "views") return (b.viewCount ?? 0) - (a.viewCount ?? 0);
                        if (sortBy === "name") return (a.tournamentName ?? "").localeCompare(b.tournamentName ?? "");
                        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                      }).map((report) => (
                        <ManagedReportCard
                          key={report.id}
                          report={report}
                          onUpdate={(id, updates) => {
                            setMyReports((prev) => prev.map((r) => r.id === id ? { ...r, ...updates } : r));
                          }}
                          onDelete={(id) => {
                            setMyReports((prev) => prev.filter((r) => r.id !== id));
                          }}
                        />
                      ))
                    : savedReports.map((report) => (
                        <ReportCard key={report.id} report={report} />
                      ))
                  }
                </div>
              </>
            )}
          </motion.div>
        </Show>
      </main>
    </div>
  );
}

/** Report card with edit/visibility/delete controls for owned reports */
function ManagedReportCard({
  report,
  onUpdate,
  onDelete,
}: {
  report: DashboardReport;
  onUpdate: (id: string, updates: Partial<DashboardReport>) => void;
  onDelete: (id: string) => void;
}) {
  const [toggling, setToggling] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

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
    finally { setDeleting(false); setConfirmDelete(false); }
  };

  const editUrl = report.editToken
    ? `/s/${report.id}?key=${report.editToken}`
    : `/s/${report.id}`;

  return (
    <div className="bg-surface rounded-xl border border-border shadow-sm overflow-hidden">
      <a href={`/s/${report.id}`} className="block hover:bg-surface-alt/30 transition-colors">
        <div className="px-4 pt-4 pb-2">
          <div className="flex items-center justify-center gap-1">
            {report.species.map((species, i) => (
              <img
                key={i}
                src={`https://play.pokemonshowdown.com/sprites/ani/${species.toLowerCase().replace(/[^a-z0-9]/g, "")}.gif`}
                alt={species}
                width={36}
                height={36}
                className="object-contain"
                loading="lazy"
              />
            ))}
          </div>
        </div>
        <div className="px-4 pb-2">
          <h3 className="text-sm font-bold text-text-primary leading-tight line-clamp-1">
            {report.tournamentName || report.species.join(" / ")}
          </h3>
          {report.placement && (
            <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-extrabold rounded-md tracking-wide bg-accent-surface text-accent mt-1">
              {report.placement}
            </span>
          )}
        </div>
      </a>

      {/* Management controls */}
      <div className="px-4 py-3 border-t border-border bg-surface-alt/30 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
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
          <a
            href={editUrl}
            className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-bold rounded-md bg-surface border border-border text-text-secondary hover:text-accent hover:border-accent/30 transition-all"
          >
            Edit
          </a>
        </div>
        {confirmDelete ? (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="px-2 py-1 text-[10px] font-bold rounded-md bg-red-500/10 text-red-500 border border-red-500/20 cursor-pointer"
            >
              {deleting ? "..." : "Confirm"}
            </button>
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              className="px-2 py-1 text-[10px] font-bold rounded-md text-text-tertiary cursor-pointer"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="p-1 text-text-tertiary hover:text-red-500 transition-colors cursor-pointer"
            title="Delete report"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
