"use client";

import { useState } from "react";
import { FolderIcon, TrashIcon } from "@/components/ui/icons";
import { DashboardSprite } from "./DashboardSprite";
import type { CollectionData, DashboardReport } from "./dashboard-types";

/** Report card with edit/visibility/delete controls for owned reports */
export function ManagedReportCard({
  report,
  onUpdate,
  onDelete,
  collections,
}: {
  report: DashboardReport;
  onUpdate: (id: string, updates: Partial<DashboardReport>) => void;
  onDelete: (id: string) => void;
  collections?: CollectionData[];
}) {
  const [toggling, setToggling] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showCollectionMenu, setShowCollectionMenu] = useState(false);
  const [addingTo, setAddingTo] = useState<string | null>(null);
  // 0 = idle, 1 = first confirm (Confirm/Cancel), 2 = second confirm (Are you sure?)
  const [deleteStep, setDeleteStep] = useState<0 | 1 | 2>(0);

  const addToCollection = async (collectionId: string) => {
    setAddingTo(collectionId);
    try {
      await fetch("/api/user/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "add-item", collectionId, shareId: report.id }),
      });
    } catch { /* silent */ }
    finally { setAddingTo(null); setShowCollectionMenu(false); }
  };

  const toggleVisibility = async () => {
    if (toggling) return;
    setToggling(true);
    // Cycle: private → unlisted → public → private
    let nextIsPublic: boolean;
    let nextIsUnlisted: boolean;
    if (!report.isPublic && !report.isUnlisted) {
      // private → unlisted
      nextIsPublic = false;
      nextIsUnlisted = true;
    } else if (report.isUnlisted) {
      // unlisted → public
      nextIsPublic = true;
      nextIsUnlisted = false;
    } else {
      // public → private
      nextIsPublic = false;
      nextIsUnlisted = false;
    }
    try {
      const res = await fetch(`/api/user/reports/${report.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublic: nextIsPublic, isUnlisted: nextIsUnlisted }),
      });
      if (res.ok) {
        onUpdate(report.id, { isPublic: nextIsPublic, isUnlisted: nextIsUnlisted });
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
    finally { setDeleting(false); setDeleteStep(0); }
  };

  // Editing is authorized by the signed-in account, never by URL tokens.
  const editUrl = `/s/${report.id}`;

  return (
    <div className="bg-surface rounded-xl border border-border shadow-sm overflow-hidden">
      <a href={`/s/${report.id}`} className="block hover:bg-surface-alt/30 transition-colors">
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
          {report.placement && (
            <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-extrabold rounded-md tracking-wide bg-accent-surface text-accent mt-1">
              {report.placement}
            </span>
          )}
        </div>
      </a>

      {/* Management controls */}
      <div className="px-2.5 sm:px-4 py-2 sm:py-3 border-t border-border bg-surface-alt/30">
        <div className="flex items-center justify-between gap-1.5">
          <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
            {report.isCollab ? (
              <span className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-bold rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                Collab
              </span>
            ) : (
              <button
                type="button"
                onClick={toggleVisibility}
                disabled={toggling}
                title="Click to cycle: Private → Unlisted → Public"
                className={`inline-flex items-center gap-1 px-2 py-1 text-[10px] font-bold rounded-md border transition-all cursor-pointer ${
                  report.isPublic
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                    : report.isUnlisted
                    ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                    : "bg-surface-alt text-text-tertiary border-border"
                }`}
              >
                {report.isPublic ? "Public" : report.isUnlisted ? "Unlisted" : "Private"}
              </button>
            )}
            <a
              href={editUrl}
              className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-bold rounded-md bg-surface border border-border text-text-secondary hover:text-accent hover:border-accent/30 transition-all"
            >
              Edit
            </a>
            {collections && collections.length > 0 && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowCollectionMenu(!showCollectionMenu)}
                  className="inline-flex items-center px-1.5 sm:px-2 py-1 text-[10px] font-bold rounded-md bg-purple-500/10 text-purple-500 border border-purple-500/20 hover:bg-purple-500/20 transition-all cursor-pointer"
                  title="Add to collection"
                  aria-label="Add to collection"
                >
                  <span className="hidden sm:inline">+ Collection</span>
                  <FolderIcon className="sm:hidden w-3 h-3" />
                </button>
                {showCollectionMenu && (
                  <div className="absolute left-0 bottom-full mb-1 sm:bottom-auto sm:top-full sm:mt-1 z-10 bg-surface border border-border rounded-lg shadow-lg py-1 min-w-[160px]">
                    {collections.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => addToCollection(c.id)}
                        disabled={addingTo === c.id}
                        className="w-full text-left px-3 py-2 text-xs font-medium text-text-primary hover:bg-surface-alt transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {addingTo === c.id ? "Adding..." : c.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          {!report.isCollab && (
            deleteStep === 2 ? (
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-bold text-red-500 mr-0.5 hidden sm:inline">Sure?</span>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-2 py-1 text-[10px] font-bold rounded-md bg-red-500 text-white cursor-pointer"
                >
                  {deleting ? "..." : "Delete"}
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteStep(0)}
                  className="px-1.5 py-1 text-[10px] font-bold rounded-md text-text-tertiary cursor-pointer"
                >
                  No
                </button>
              </div>
            ) : deleteStep === 1 ? (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setDeleteStep(2)}
                  className="px-2 py-1 text-[10px] font-bold rounded-md bg-red-500/10 text-red-500 border border-red-500/20 cursor-pointer"
                >
                  Confirm
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteStep(0)}
                  className="px-1.5 py-1 text-[10px] font-bold rounded-md text-text-tertiary cursor-pointer"
                >
                  No
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setDeleteStep(1)}
                className="p-1.5 text-text-tertiary hover:text-red-500 transition-colors cursor-pointer flex-shrink-0"
                title="Delete report"
                aria-label="Delete report"
              >
                <TrashIcon width="12" height="12" />
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}
