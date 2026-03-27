"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface VersionEntry {
  version: number;
  editorName: string | null;
  sections: string[];
  createdAt: string;
}

interface VersionHistoryPanelProps {
  shareId: string;
  open: boolean;
  onClose: () => void;
  /** Currently-compared version number (null if not comparing) */
  comparingVersion?: number | null;
  /** Called when user clicks a version to compare */
  onCompare?: (version: number) => void;
  /** Called when user clears the comparison */
  onClearCompare?: () => void;
  /** Whether a comparison is being loaded */
  compareLoading?: boolean;
}

export function VersionHistoryPanel({
  shareId,
  open,
  onClose,
  comparingVersion = null,
  onCompare,
  onClearCompare,
  compareLoading = false,
}: VersionHistoryPanelProps) {
  const [versions, setVersions] = useState<VersionEntry[]>([]);
  const [currentVersion, setCurrentVersion] = useState(0);
  const [loading, setLoading] = useState(true);
  const [reverting, setReverting] = useState<number | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const fetchVersions = useCallback(async () => {
    setLoading(true);
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
    if (open) fetchVersions();
  }, [open, fetchVersions]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Close on click outside panel
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    // Delay to avoid closing on the same click that opened it
    const timer = setTimeout(() => {
      window.addEventListener("mousedown", handler);
    }, 100);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("mousedown", handler);
    };
  }, [open, onClose]);

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
        // Navigate to the share URL so reverted data loads correctly
        window.location.href = `/s/${shareId}`;
      }
    } catch {
      // ignore
    } finally {
      setReverting(null);
    }
  };

  const handleCompareClick = (version: number) => {
    if (!onCompare) return;
    if (comparingVersion === version) {
      // Toggle off if clicking same version
      onClearCompare?.();
    } else {
      onCompare(version);
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

  const formatFullDate = (iso: string) => {
    return new Date(iso).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  if (!open) return null;

  const isComparing = comparingVersion !== null;

  return (
    <>
      {/* Scrim */}
      <div className="fixed inset-0 z-[70] bg-black/20 backdrop-blur-[1px] sm:bg-transparent sm:backdrop-blur-none" onClick={onClose} />

      {/* Panel */}
      <div
        ref={panelRef}
        className="fixed top-0 right-0 z-[71] h-full w-full sm:w-[340px] bg-surface border-l border-border shadow-[-8px_0_32px_rgba(0,0,0,0.1)] flex flex-col animate-slide-in-right"
        role="dialog"
        aria-label="Version history"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-bold text-text-primary">Version history</h2>
              <p className="text-[10px] text-text-tertiary">
                {isComparing
                  ? `Comparing with v${comparingVersion}`
                  : `${versions.length} version${versions.length !== 1 ? "s" : ""} saved`
                }
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-alt transition-colors cursor-pointer"
            aria-label="Close version history"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Compare mode hint */}
        {onCompare && !isComparing && !loading && versions.length > 0 && (
          <div className="px-5 py-2.5 bg-surface-alt/40 border-b border-border/40">
            <p className="text-[11px] text-text-tertiary flex items-center gap-1.5">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 text-text-tertiary">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
              </svg>
              Click a version number to highlight what changed
            </p>
          </div>
        )}

        {/* Active comparison banner */}
        {isComparing && (
          <div className="px-4 py-2.5 bg-blue-50 dark:bg-blue-950/50 border-b border-blue-300 dark:border-blue-500/40 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse flex-shrink-0" />
              <span className="text-[11px] font-bold text-blue-800 dark:text-blue-200">
                Showing changes since v{comparingVersion}
              </span>
            </div>
            <button
              type="button"
              onClick={onClearCompare}
              className="flex-shrink-0 px-2.5 py-1 text-[10px] font-bold text-white bg-blue-500 rounded-md hover:bg-blue-600 transition-colors cursor-pointer"
            >
              Clear
            </button>
          </div>
        )}

        {/* Version list */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <span className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
              <span className="text-xs text-text-tertiary">Loading versions...</span>
            </div>
          ) : versions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
              <div className="w-12 h-12 rounded-xl bg-surface-alt flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-text-tertiary">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-text-secondary">No versions yet</p>
                <p className="text-xs text-text-tertiary mt-1 max-w-[200px]">
                  Versions are saved automatically when you edit and save your report.
                </p>
              </div>
            </div>
          ) : (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-[11px] top-6 bottom-4 w-px bg-border" />

              {/* Current version */}
              <div className="relative flex items-start gap-3 pb-4">
                <div className="relative z-10 w-[22px] h-[22px] rounded-full bg-accent flex items-center justify-center flex-shrink-0 shadow-sm shadow-accent/30">
                  <div className="w-2 h-2 rounded-full bg-white" />
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-accent">v{currentVersion}</span>
                    <span className="text-[10px] font-bold text-accent bg-accent/10 px-1.5 py-0.5 rounded">Current</span>
                  </div>
                  <p className="text-[11px] text-text-tertiary mt-0.5">Latest version</p>
                </div>
              </div>

              {/* Previous versions */}
              {versions.map((v) => {
                const isSelected = comparingVersion === v.version;
                const isLoadingThis = compareLoading && isSelected;

                return (
                  <div key={v.version} className={`relative group flex items-start gap-3 pb-4 ${isSelected ? "version-diff-active" : ""}`}>
                    {/* Timeline dot */}
                    <div className="relative z-10 w-[22px] flex items-center justify-center flex-shrink-0 pt-1">
                      <div className={`w-2.5 h-2.5 rounded-full transition-colors ${
                        isSelected
                          ? "bg-blue-500 ring-2 ring-blue-500/30"
                          : "bg-border group-hover:bg-text-tertiary"
                      }`} />
                    </div>

                    {/* Version content */}
                    <div className={`flex-1 min-w-0 rounded-xl p-3 -ml-1 transition-colors ${
                      isSelected
                        ? "bg-blue-50 dark:bg-blue-950/40 ring-2 ring-blue-400/40 dark:ring-blue-500/30"
                        : "group-hover:bg-surface-alt/60"
                    }`}>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          {/* Clickable version number for comparison */}
                          <button
                            type="button"
                            onClick={() => handleCompareClick(v.version)}
                            disabled={compareLoading}
                            className={`text-sm font-bold transition-colors cursor-pointer hover:underline disabled:opacity-50 ${
                              isSelected
                                ? "text-blue-700 dark:text-blue-300"
                                : "text-text-primary hover:text-accent"
                            }`}
                            title={isSelected ? "Click to stop comparing" : `Compare current with v${v.version}`}
                          >
                            v{v.version}
                            {isLoadingThis && (
                              <span className="inline-block w-2.5 h-2.5 border-[1.5px] border-blue-500/30 border-t-blue-500 rounded-full animate-spin ml-1 align-middle" />
                            )}
                          </button>
                          <span className="text-[10px] text-text-tertiary flex-shrink-0">{formatTime(v.createdAt)}</span>
                          {isSelected && (
                            <span className="text-[9px] font-bold text-white bg-blue-500 px-1.5 py-0.5 rounded shadow-sm">
                              Comparing
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRevert(v.version)}
                          disabled={reverting !== null}
                          className="flex-shrink-0 px-3 py-1.5 text-[11px] font-bold text-accent bg-accent/10 rounded-lg hover:bg-accent/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50 sm:opacity-0 sm:group-hover:opacity-100"
                        >
                          {reverting === v.version ? (
                            <span className="flex items-center gap-1">
                              <span className="w-3 h-3 border-[1.5px] border-accent/30 border-t-accent rounded-full animate-spin" />
                              Reverting
                            </span>
                          ) : "Restore"}
                        </button>
                      </div>

                      {v.editorName && (
                        <p className="text-[11px] text-text-secondary mt-1 flex items-center gap-1">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
                            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
                          </svg>
                          {v.editorName}
                        </p>
                      )}

                      {v.sections.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {v.sections.map((section, j) => (
                            <span
                              key={j}
                              className="text-[10px] text-text-tertiary bg-surface-alt px-1.5 py-0.5 rounded-md"
                            >
                              {section}
                            </span>
                          ))}
                        </div>
                      )}

                      <p className="text-[10px] text-text-tertiary/60 mt-1">{formatFullDate(v.createdAt)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-in-right {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.25s cubic-bezier(0.32, 0.72, 0, 1) both;
        }
      `}</style>
    </>
  );
}
