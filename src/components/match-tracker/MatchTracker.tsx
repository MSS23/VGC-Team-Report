"use client";

import { useState, useEffect, useCallback } from "react";

const COMMON_ARCHETYPES = [
  "Flutter Mane + Iron Hands",
  "Calyrex-Ice + Incineroar",
  "Calyrex-Shadow + Incineroar",
  "Koraidon + Incineroar",
  "Miraidon + Iron Hands",
  "Zacian + Incineroar",
  "Kyogre + Groudon",
  "Xerneas + Incineroar",
  "Solgaleo + Incineroar",
  "Landorus + Tornadus",
  "Chien-Pao + Incineroar",
  "Kingambit + Incineroar",
  "Terapagos + Incineroar",
  "Miraidon + Rillaboom",
  "Urshifu + Incineroar",
];

interface MatchLog {
  id: string;
  opponentArchetype: string;
  result: "win" | "loss" | "tie";
  gameCount: number;
  notes: string | null;
  tournamentName: string | null;
  shareId: string | null;
  loggedAt: string;
}

interface ArchetypeStat {
  archetype: string;
  wins: number;
  losses: number;
  ties: number;
  total: number;
  winRate: number;
}

interface Summary {
  totalWins: number;
  totalLosses: number;
  totalTies: number;
  totalGames: number;
  overallWinRate: number;
}

export function MatchTracker() {
  const [archetype, setArchetype] = useState("");
  const [result, setResult] = useState<"win" | "loss" | "tie" | null>(null);
  const [gameCount, setGameCount] = useState(2);
  const [notes, setNotes] = useState("");
  const [tournamentName, setTournamentName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [logs, setLogs] = useState<MatchLog[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [archetypeStats, setArchetypeStats] = useState<ArchetypeStat[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const filteredSuggestions = archetype.length > 0
    ? COMMON_ARCHETYPES.filter((a) =>
        a.toLowerCase().includes(archetype.toLowerCase())
      ).slice(0, 6)
    : [];

  const fetchStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const res = await fetch("/api/match-log");
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs ?? []);
        setSummary(data.summary ?? null);
        setArchetypeStats(data.archetypeStats ?? []);
        setFetchError(null);
      } else {
        setFetchError("Failed to load match history. Tap to retry.");
      }
    } catch {
      setFetchError("Failed to load match history. Tap to retry.");
    } finally {
      setLoadingStats(false);
    }
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    if (!window.confirm("Delete this match entry?")) return;
    try {
      const res = await fetch(`/api/match-log?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      if (res.ok) {
        await fetchStats();
      }
    } catch {
      // best-effort — user can refresh manually
    }
  }, [fetchStats]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!archetype.trim() || !result) return;
    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    try {
      const res = await fetch("/api/match-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          opponentArchetype: archetype.trim(),
          result,
          gameCount,
          notes: notes.trim() || undefined,
          tournamentName: tournamentName.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setSubmitError(data.error ?? "Failed to log match");
        return;
      }

      setSubmitSuccess(true);
      setArchetype("");
      setResult(null);
      setGameCount(2);
      setNotes("");
      // Refresh stats
      await fetchStats();
      // Auto-hide success after 2 seconds
      setTimeout(() => setSubmitSuccess(false), 2000);
    } catch {
      setSubmitError("Failed to log match. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const resultColor = (r: "win" | "loss" | "tie") => {
    if (r === "win") return "text-emerald-600 dark:text-emerald-400";
    if (r === "loss") return "text-red-500 dark:text-red-400";
    return "text-amber-500 dark:text-amber-400";
  };

  const resultBg = (r: "win" | "loss" | "tie") => {
    if (r === "win") return "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400";
    if (r === "loss") return "bg-red-500/10 border-red-500/30 text-red-500 dark:text-red-400";
    return "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400";
  };

  const winRateColor = (rate: number) => {
    if (rate >= 60) return "text-emerald-600 dark:text-emerald-400";
    if (rate >= 40) return "text-amber-500 dark:text-amber-400";
    return "text-red-500 dark:text-red-400";
  };

  return (
    <div className="bg-surface border border-border rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3 sm:py-4 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
              <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22" />
            </svg>
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-extrabold text-text-primary">Match Tracker</h2>
            <p className="text-[10px] text-text-tertiary">Log results &amp; track your record</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold rounded-lg bg-accent text-white hover:brightness-110 active:scale-[0.97] shadow-sm shadow-accent/30 transition-all cursor-pointer"
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Log Match
        </button>
      </div>

      {/* Log match form */}
      {showForm && (
        <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-border bg-surface-alt/30">
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Opponent archetype input */}
            <div className="relative">
              <label className="block text-[10px] font-bold text-text-tertiary uppercase tracking-wider mb-1">
                Opponent Archetype
              </label>
              <input
                type="text"
                value={archetype}
                onChange={(e) => { setArchetype(e.target.value); setShowSuggestions(true); }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                placeholder="e.g. Calyrex-Ice + Incineroar"
                maxLength={100}
                required
                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/40"
              />
              {showSuggestions && filteredSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-10 mt-0.5 bg-surface border border-border rounded-lg shadow-lg py-1 max-h-40 overflow-y-auto">
                  {filteredSuggestions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onMouseDown={() => { setArchetype(s); setShowSuggestions(false); }}
                      className="w-full text-left px-3 py-1.5 text-xs text-text-primary hover:bg-surface-alt transition-colors cursor-pointer"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Result toggle */}
            <div>
              <label className="block text-[10px] font-bold text-text-tertiary uppercase tracking-wider mb-1.5">
                Result
              </label>
              <div className="flex gap-2">
                {(["win", "loss", "tie"] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setResult(r)}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg border capitalize transition-all cursor-pointer ${
                      result === r ? resultBg(r) : "bg-surface border-border text-text-tertiary hover:text-text-primary"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Game count */}
            <div>
              <label className="block text-[10px] font-bold text-text-tertiary uppercase tracking-wider mb-1.5">
                Games Played
              </label>
              <div className="flex gap-2">
                {[1, 2, 3].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setGameCount(n)}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                      gameCount === n
                        ? "bg-accent/10 border-accent/30 text-accent"
                        : "bg-surface border-border text-text-tertiary hover:text-text-primary"
                    }`}
                  >
                    Game {n}
                  </button>
                ))}
              </div>
            </div>

            {/* Optional fields in a row on larger screens */}
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1">
                <label className="block text-[10px] font-bold text-text-tertiary uppercase tracking-wider mb-1">
                  Tournament (optional)
                </label>
                <input
                  type="text"
                  value={tournamentName}
                  onChange={(e) => setTournamentName(e.target.value)}
                  placeholder="e.g. Dallas Regionals 2025"
                  maxLength={200}
                  className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/40"
                />
              </div>
              <div className="flex-1">
                <label className="block text-[10px] font-bold text-text-tertiary uppercase tracking-wider mb-1">
                  Notes (optional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Quick note about the match..."
                  maxLength={500}
                  className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/40"
                />
              </div>
            </div>

            {submitError && (
              <p className="text-xs text-red-500 font-medium">{submitError}</p>
            )}
            {submitSuccess && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">Match logged!</p>
            )}

            <div className="flex gap-2 pt-0.5">
              <button
                type="submit"
                disabled={!archetype.trim() || !result || submitting}
                className="flex-1 py-2 text-sm font-bold rounded-lg bg-accent text-white hover:brightness-110 active:scale-[0.97] shadow-sm shadow-accent/30 transition-all disabled:opacity-40 cursor-pointer"
              >
                {submitting ? "Saving..." : "Log Result"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm font-bold rounded-lg bg-surface-alt border border-border text-text-tertiary hover:text-text-primary transition-all cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Stats section */}
      <div className="px-4 sm:px-5 py-3 sm:py-4">
        {loadingStats ? (
          <div className="flex justify-center py-6">
            <svg className="animate-spin h-5 w-5 text-text-tertiary" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : fetchError ? (
          <div className="flex flex-col items-center py-6 gap-2">
            <p className="text-xs text-amber-500 dark:text-amber-400 font-medium text-center">{fetchError}</p>
            <button
              type="button"
              onClick={fetchStats}
              className="text-xs font-bold text-accent hover:underline cursor-pointer"
            >
              Retry
            </button>
          </div>
        ) : !summary || summary.totalGames === 0 ? (
          <div className="text-center py-6">
            <p className="text-sm text-text-secondary">No matches logged yet.</p>
            <p className="text-xs text-text-tertiary mt-1">Log your first result to start tracking your win rate.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Overall record */}
            <div>
              <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider mb-2">My Record</p>
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">{summary.totalWins}</span>
                  <span className="text-xs font-bold text-text-tertiary">W</span>
                  <span className="text-text-tertiary mx-0.5">/</span>
                  <span className="text-2xl font-extrabold text-red-500 dark:text-red-400">{summary.totalLosses}</span>
                  <span className="text-xs font-bold text-text-tertiary">L</span>
                  {summary.totalTies > 0 && (
                    <>
                      <span className="text-text-tertiary mx-0.5">/</span>
                      <span className="text-2xl font-extrabold text-amber-500 dark:text-amber-400">{summary.totalTies}</span>
                      <span className="text-xs font-bold text-text-tertiary">T</span>
                    </>
                  )}
                </div>
                <div className={`text-lg font-extrabold ${winRateColor(summary.overallWinRate)}`}>
                  {summary.overallWinRate}%
                </div>
                <span className="text-xs text-text-tertiary">{summary.totalGames} game{summary.totalGames !== 1 ? "s" : ""}</span>
              </div>
            </div>

            {/* Archetype breakdown — top 5 */}
            {archetypeStats.length > 0 && (
              <div>
                <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider mb-2">Top Matchups</p>
                <div className="space-y-1.5">
                  {archetypeStats.map((stat) => (
                    <div key={stat.archetype} className="flex items-center gap-2 sm:gap-3 px-2.5 sm:px-3 py-2 rounded-lg bg-surface-alt/50 hover:bg-surface-alt transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-text-primary truncate">{stat.archetype}</p>
                        <p className="text-[10px] text-text-tertiary mt-0.5">
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">{stat.wins}W</span>
                          {" / "}
                          <span className="text-red-500 dark:text-red-400 font-bold">{stat.losses}L</span>
                          {stat.ties > 0 && (
                            <> / <span className="text-amber-500 dark:text-amber-400 font-bold">{stat.ties}T</span></>
                          )}
                          <span className="ml-1">({stat.total} game{stat.total !== 1 ? "s" : ""})</span>
                        </p>
                      </div>
                      <span className={`text-sm font-extrabold flex-shrink-0 ${winRateColor(stat.winRate)}`}>
                        {stat.winRate}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent logs — last 5 */}
            {logs.length > 0 && (
              <div>
                <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider mb-2">Recent Matches</p>
                <div className="space-y-1">
                  {logs.slice(0, 5).map((log) => (
                    <div key={log.id} className="group flex items-center gap-2 sm:gap-3 px-2.5 sm:px-3 py-1.5 rounded-lg hover:bg-surface-alt/50 transition-colors">
                      <span className={`text-[10px] font-extrabold uppercase tracking-wider w-6 flex-shrink-0 ${resultColor(log.result)}`}>
                        {log.result === "win" ? "W" : log.result === "loss" ? "L" : "T"}
                      </span>
                      <span className="flex-1 min-w-0 text-xs text-text-primary truncate">{log.opponentArchetype}</span>
                      <span className="text-[10px] text-text-tertiary flex-shrink-0">
                        {new Date(log.loggedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDelete(log.id)}
                        aria-label="Delete match entry"
                        className="opacity-0 group-hover:opacity-100 focus:opacity-100 flex-shrink-0 p-1 rounded text-text-tertiary hover:text-red-500 transition-all cursor-pointer"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                          <path d="M10 11v6M14 11v6" />
                          <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
