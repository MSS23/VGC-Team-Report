"use client";

import { useState } from "react";
import { DashboardSprite } from "./DashboardSprite";
import type { DashboardReport } from "./dashboard-types";

/** Card for deleted reports in the Trash tab with restore and days-remaining info */
export function TrashReportCard({
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
