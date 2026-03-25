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
    const input = claimUrl.trim();
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
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 p-1 bg-surface-alt/50 rounded-xl mb-6 w-fit">
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
                  {(tab === "my" ? myReports : savedReports).map((report) => (
                    <ReportCard key={report.id} report={report} />
                  ))}
                </div>
              </>
            )}
          </motion.div>
        </Show>
      </main>
    </div>
  );
}
