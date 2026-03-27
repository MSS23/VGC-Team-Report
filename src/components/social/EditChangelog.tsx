"use client";

import { useState, useEffect, useCallback } from "react";

interface ChangelogEntry {
  version: number;
  editorName: string;
  sections: string[];
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
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border-2 bg-surface border-border text-text-secondary hover:border-accent/30 hover:text-accent transition-all cursor-pointer"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Edit History
        {entries.length > 0 && (
          <span className="ml-1 px-1.5 py-0.5 text-[10px] font-extrabold bg-accent-surface text-accent rounded-full">
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
        <div className="mt-3 border border-border rounded-xl bg-surface overflow-hidden animate-fade-in">
          {loading ? (
            <div className="px-4 py-6 text-center">
              <span className="inline-block w-4 h-4 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
            </div>
          ) : entries.length === 0 ? (
            <div className="px-4 py-6 text-center text-xs text-text-tertiary">
              No edit history yet. Changes are tracked when signed-in users edit this report.
            </div>
          ) : (
            <div className="divide-y divide-border max-h-80 overflow-y-auto">
              {entries.map((entry) => (
                <div key={entry.version} className="px-4 py-3">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-6 h-6 rounded-full bg-accent-surface flex items-center justify-center flex-shrink-0">
                      <span className="text-[10px] font-extrabold text-accent">
                        {entry.editorName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-text-primary truncate">
                      {entry.editorName}
                    </span>
                    <span className="text-[10px] text-text-tertiary ml-auto flex-shrink-0">
                      {formatTime(entry.createdAt)}
                    </span>
                    <span className="text-[10px] text-text-tertiary bg-surface-alt px-1.5 py-0.5 rounded font-mono flex-shrink-0">
                      v{entry.version}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1 ml-8">
                    {entry.sections.map((section) => (
                      <span
                        key={section}
                        className="text-[10px] font-semibold text-text-secondary bg-surface-alt px-2 py-0.5 rounded-full"
                      >
                        {section}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
