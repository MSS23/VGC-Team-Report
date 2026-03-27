"use client";

import { useState, useEffect, useCallback } from "react";

interface VersionEntry {
  version: number;
  editorName: string | null;
  sections: string[];
  createdAt: string;
}

interface VersionHistoryProps {
  shareId: string;
  onRevert?: () => void;
}

export function VersionHistory({ shareId, onRevert }: VersionHistoryProps) {
  const [versions, setVersions] = useState<VersionEntry[]>([]);
  const [currentVersion, setCurrentVersion] = useState(0);
  const [loading, setLoading] = useState(true);
  const [reverting, setReverting] = useState<number | null>(null);
  const [expanded, setExpanded] = useState(false);

  const fetchVersions = useCallback(async () => {
    try {
      const res = await fetch(`/api/share/${shareId}/versions`);
      if (!res.ok) return;
      const data = await res.json();
      setCurrentVersion(data.currentVersion ?? 0);
      setVersions(data.versions ?? []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [shareId]);

  useEffect(() => {
    if (expanded) fetchVersions();
  }, [expanded, fetchVersions]);

  const handleRevert = async (version: number) => {
    if (reverting) return;
    setReverting(version);
    try {
      const res = await fetch(`/api/share/${shareId}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ version }),
      });
      if (res.ok) {
        await fetchVersions();
        onRevert?.();
        // Navigate to the share URL so reverted data loads correctly
        // (works from both /s/{id} and the home page)
        window.location.href = `/s/${shareId}`;
      }
    } catch {
      // ignore
    } finally {
      setReverting(null);
    }
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHrs = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMin < 1) return "just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHrs < 24) return `${diffHrs}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-text-secondary hover:text-accent hover:bg-surface-alt/50 transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        Version History
      </button>
    );
  }

  return (
    <div className="flex flex-col">
      <button
        type="button"
        onClick={() => setExpanded(false)}
        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-accent hover:bg-surface-alt/50 transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        Version History
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="ml-auto">
          <polyline points="18 15 12 9 6 15" />
        </svg>
      </button>

      <div className="max-h-64 overflow-y-auto px-2 pb-2">
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <span className="w-4 h-4 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
          </div>
        ) : versions.length === 0 ? (
          <p className="text-xs text-text-tertiary text-center py-4 px-4">
            No previous versions yet. Versions are saved automatically when changes are made.
          </p>
        ) : (
          <div className="flex flex-col gap-1 pt-1">
            {/* Current version indicator */}
            <div className="flex items-center gap-2 px-2 py-2 rounded-lg bg-accent/5 border border-accent/10">
              <span className="w-2 h-2 rounded-full bg-accent flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-xs font-bold text-accent">v{currentVersion} — Current</span>
              </div>
            </div>

            {versions.map((v) => (
              <div
                key={v.version}
                className="group flex items-start gap-2 px-2 py-2 rounded-lg hover:bg-surface-alt/60 transition-colors"
              >
                <span className="w-2 h-2 rounded-full bg-text-tertiary/30 flex-shrink-0 mt-1.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-text-primary">v{v.version}</span>
                    <span className="text-[10px] text-text-tertiary">{formatTime(v.createdAt)}</span>
                  </div>
                  {v.editorName && (
                    <span className="text-[10px] text-text-tertiary">by {v.editorName}</span>
                  )}
                  {v.sections.length > 0 && (
                    <p className="text-[10px] text-text-tertiary/80 mt-0.5 truncate">
                      {v.sections.join(", ")}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handleRevert(v.version)}
                  disabled={reverting !== null}
                  className="sm:opacity-0 sm:group-hover:opacity-100 flex-shrink-0 px-2.5 py-1.5 text-[10px] font-bold text-accent bg-accent/10 rounded-lg hover:bg-accent/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                >
                  {reverting === v.version ? "..." : "Revert"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
