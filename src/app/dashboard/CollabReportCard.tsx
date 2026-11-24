"use client";

import { useState } from "react";
import { CheckIcon } from "@/components/ui/icons";
import { DashboardSprite } from "./DashboardSprite";
import type { CollabReport } from "./dashboard-types";

/** Card for collaboration invites with accept/decline controls */
export function CollabReportCard({
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
              <CheckIcon width="10" height="10" />
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
