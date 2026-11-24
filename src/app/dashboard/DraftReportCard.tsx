"use client";

import { useState } from "react";
import { relativeTime } from "@/lib/utils/relative-time";
import { DashboardSprite } from "./DashboardSprite";
import type { DashboardReport } from "./dashboard-types";

/** Draft card with resume and delete actions */
export function DraftReportCard({ draft, onDelete }: { draft: DashboardReport; onDelete: (id: string) => void }) {
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

  const timeAgo = relativeTime(draft.updatedAt ?? draft.createdAt, { formatOlder: (d) => d.toLocaleDateString() });

  return (
    <div className="group relative bg-surface border border-amber-500/20 rounded-xl overflow-hidden hover:border-amber-500/40 hover:shadow-lg hover:shadow-amber-500/5 transition-all">
      {/* Draft badge */}
      <div className="absolute top-2 right-2 z-10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-600 dark:text-amber-400 rounded-md border border-amber-500/20">
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
