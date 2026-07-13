"use client";

import { useState, useEffect, useCallback } from "react";

interface ChangelogEntry {
  version: number;
  editorName: string;
  sections: string[];
  isPublished: boolean;
  createdAt: string;
}

interface EditChangelogProps {
  shareId: string;
  editToken?: string;
}

export function EditChangelog({ shareId, editToken }: EditChangelogProps) {
  const [entries, setEntries] = useState<ChangelogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [expandedVersion, setExpandedVersion] = useState<number | null>(null);

  const fetchChangelog = useCallback(async () => {
    try {
      const params = editToken ? `?key=${encodeURIComponent(editToken)}` : "";
      const res = await fetch(`/api/changelog/${shareId}${params}`);
      if (res.ok) {
        const data = await res.json();
        setEntries(data.entries ?? []);
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [shareId, editToken]);

  useEffect(() => {
    if (open && entries.length === 0) fetchChangelog();
  }, [open, entries.length, fetchChangelog]);

  // Auto-refresh when panel is open. The changelog is a reference view of
  // committed history, not a live chat — every 60s is well within perceived
  // freshness and cuts /api/changelog/[shareId] load by 4x per open panel.
  useEffect(() => {
    if (!open) return;
    const interval = setInterval(fetchChangelog, 60_000);
    return () => clearInterval(interval);
  }, [open, fetchChangelog]);

  function formatTime(iso: string) {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60_000);
    if (diffMin < 1) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDays = Math.floor(diffHr / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  }

  const publishedCount = entries.filter((e) => e.isPublished).length;

  return (
    <div className="mt-4">
      {/* Button — prominent with icon and count */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-bold rounded-xl border-2 transition-all cursor-pointer ${
          open
            ? "bg-accent/10 border-accent/30 text-accent"
            : "bg-surface border-border text-text-primary hover:border-accent/30 hover:text-accent"
        }`}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Version History
        {entries.length > 0 && (
          <span className="px-2 py-0.5 text-[10px] font-extrabold bg-accent-surface text-accent rounded-full">
            {entries.length}
          </span>
        )}
        <svg
          width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div className="mt-3 border-2 border-border rounded-xl bg-surface overflow-hidden animate-fade-in">
          {/* Header bar */}
          <div className="px-4 py-3 bg-surface-alt/50 border-b border-border flex items-center justify-between">
            <span className="text-xs font-bold text-text-primary">All Versions</span>
            {publishedCount > 0 && (
              <span className="text-[10px] font-bold text-emerald-500">
                {publishedCount} published
              </span>
            )}
          </div>

          {loading ? (
            <div className="px-4 py-8 text-center">
              <span className="inline-block w-5 h-5 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
              <p className="text-xs text-text-tertiary mt-2">Loading history...</p>
            </div>
          ) : entries.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-text-tertiary mx-auto mb-2">
                <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-xs text-text-tertiary">No version history yet.</p>
              <p className="text-[10px] text-text-tertiary mt-0.5">Changes are tracked when signed-in users edit this report.</p>
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              {entries.map((entry, idx) => {
                const isExpanded = expandedVersion === entry.version;
                const isLatest = idx === 0;
                return (
                  <div
                    key={entry.version}
                    className={`border-b border-border/50 last:border-b-0 transition-colors ${
                      isExpanded ? "bg-surface-alt/30" : "hover:bg-surface-alt/20"
                    }`}
                  >
                    {/* Entry row */}
                    <button
                      type="button"
                      onClick={() => setExpandedVersion(isExpanded ? null : entry.version)}
                      className="w-full px-4 py-3 flex items-center gap-3 text-left cursor-pointer"
                    >
                      {/* Timeline dot */}
                      <div className="flex flex-col items-center flex-shrink-0">
                        <div className={`w-3 h-3 rounded-full ${
                          entry.isPublished
                            ? "bg-emerald-500 ring-2 ring-emerald-500/30"
                            : "bg-border"
                        }`} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Published / WIP badge */}
                          {entry.isPublished ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-extrabold rounded-md bg-emerald-500/15 text-emerald-500 border border-emerald-500/25">
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                              </svg>
                              Published
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-md bg-surface-alt text-text-tertiary border border-border">
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                              </svg>
                              Work in progress
                            </span>
                          )}

                          {/* Editor name */}
                          <span className="text-xs font-bold text-text-primary truncate">
                            {entry.editorName}
                          </span>

                          {isLatest && (
                            <span className="text-[9px] font-extrabold text-accent bg-accent-surface px-1.5 py-0.5 rounded uppercase tracking-wider">
                              Latest
                            </span>
                          )}
                        </div>

                        {/* Timestamp + version */}
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-text-tertiary">
                            {formatTime(entry.createdAt)}
                          </span>
                          <span className="text-[10px] text-text-tertiary font-mono">
                            v{entry.version}
                          </span>
                        </div>
                      </div>

                      {/* Expand arrow */}
                      <svg
                        width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                        className={`text-text-tertiary flex-shrink-0 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </button>

                    {/* Expanded detail — changed sections */}
                    {isExpanded && (
                      <div className="px-4 pb-4 pl-10 animate-fade-in">
                        <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider mb-2">
                          Changes in this version
                        </p>
                        <div className="space-y-1.5">
                          {entry.sections.map((section) => (
                            <div
                              key={section}
                              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-alt/60 border border-border/50"
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-accent flex-shrink-0">
                                <polyline points="9 11 12 14 22 4" />
                                <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
                              </svg>
                              <span className="text-xs font-semibold text-text-primary">{section}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
