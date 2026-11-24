"use client";

import { useState } from "react";
import type { ExploreReport } from "@/components/explore/ReportCard";
import { SpinnerIcon, ChevronDownIcon, CloseIcon } from "@/components/ui/icons";
import { DashboardSprite } from "./DashboardSprite";
import type { CollectionData } from "./dashboard-types";

export function CollectionsPanel({ collections, onUpdate }: { collections: CollectionData[]; onUpdate: () => void }) {
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newReg, setNewReg] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [expandedItems, setExpandedItems] = useState<ExploreReport[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);

  const handleCreate = async () => {
    if (!newName.trim() || creating) return;
    setCreating(true);
    try {
      const res = await fetch("/api/user/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create", name: newName.trim(), description: newDesc.trim() || undefined, regulation: newReg.trim() || undefined }),
      });
      if (res.ok) {
        setNewName("");
        setNewDesc("");
        setNewReg("");
        onUpdate();
      }
    } catch { /* silent */ }
    finally { setCreating(false); }
  };

  const handleDelete = async (id: string) => {
    await fetch("/api/user/collections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", collectionId: id }),
    });
    if (expanded === id) { setExpanded(null); setExpandedItems([]); }
    onUpdate();
  };

  const handleExpand = async (id: string) => {
    if (expanded === id) { setExpanded(null); setExpandedItems([]); return; }
    setExpanded(id);
    setLoadingItems(true);
    try {
      const res = await fetch(`/api/user/collections/${id}`);
      if (res.ok) {
        const data = await res.json();
        setExpandedItems(data.items ?? []);
      }
    } catch { /* silent */ }
    finally { setLoadingItems(false); }
  };

  const handleRemoveItem = async (collectionId: string, shareId: string) => {
    await fetch("/api/user/collections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "remove-item", collectionId, shareId }),
    });
    setExpandedItems((prev) => prev.filter((i) => i.id !== shareId));
    onUpdate();
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Create new collection */}
      <div className="bg-surface border border-border rounded-xl px-3 sm:px-4 py-3 sm:py-4">
        <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider mb-2 sm:mb-3">New Collection</p>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Collection name"
            aria-label="Collection name"
            className="flex-1 px-2.5 sm:px-3 py-1.5 sm:py-2 bg-surface-alt border border-border rounded-lg text-xs sm:text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/40"
          />
          <input
            type="text"
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            placeholder="Description (optional)"
            aria-label="Collection description"
            className="flex-1 px-2.5 sm:px-3 py-1.5 sm:py-2 bg-surface-alt border border-border rounded-lg text-xs sm:text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/40"
          />
          <select
            value={newReg}
            onChange={(e) => setNewReg(e.target.value)}
            aria-label="Collection regulation"
            className="px-2.5 sm:px-3 py-1.5 sm:py-2 bg-surface-alt border border-border rounded-lg text-xs sm:text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/40"
          >
            <option value="">Regulation</option>
            <option value="Reg H">Reg H</option>
            <option value="Reg G">Reg G</option>
            <option value="Reg F">Reg F</option>
            <option value="Champions">Champions</option>
          </select>
          <button
            onClick={handleCreate}
            disabled={!newName.trim() || creating}
            className="px-4 py-2 bg-accent text-accent-foreground text-sm font-bold rounded-lg hover:brightness-110 active:scale-[0.97] shadow-sm shadow-accent/30 transition-all disabled:opacity-40 tracking-wide flex-shrink-0"
          >
            {creating ? "Creating..." : "Create"}
          </button>
        </div>
      </div>

      {/* Existing collections */}
      {collections.length === 0 && (
        <div className="text-center py-12">
          <p className="text-sm text-text-secondary mb-2">No collections yet.</p>
          <p className="text-xs text-text-tertiary">Create a collection to organize your team reports — like playlists for teams.</p>
        </div>
      )}

      {collections.map((c) => (
        <div key={c.id} className="bg-surface border border-border rounded-xl overflow-hidden">
          <button
            type="button"
            onClick={() => handleExpand(c.id)}
            className="w-full px-4 py-3 flex items-center justify-between gap-3 hover:bg-surface-alt/30 transition-colors cursor-pointer"
          >
            <div className="text-left min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-text-primary truncate">{c.name}</h3>
                {c.regulation && (
                  <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-md bg-accent-surface text-accent tracking-wide flex-shrink-0">
                    {c.regulation}
                  </span>
                )}
              </div>
              {c.description && <p className="text-xs text-text-secondary mt-0.5 truncate">{c.description}</p>}
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <span className="text-xs font-bold text-text-tertiary">
                {c.itemCount} {c.itemCount === 1 ? "team" : "teams"}
              </span>
              <ChevronDownIcon
                width="12" height="12"
                className={`text-text-tertiary transition-transform ${expanded === c.id ? "rotate-180" : ""}`}
              />
            </div>
          </button>

          {expanded === c.id && (
            <div className="border-t border-border px-4 py-3">
              {loadingItems ? (
                <div className="flex justify-center py-4">
                  <SpinnerIcon className="animate-spin h-4 w-4 text-text-tertiary" />
                </div>
              ) : expandedItems.length === 0 ? (
                <p className="text-xs text-text-tertiary text-center py-4">
                  No teams in this collection yet. Add teams from your reports using the menu on each report card.
                </p>
              ) : (
                <div className="space-y-2">
                  {expandedItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg hover:bg-surface-alt/50 transition-colors">
                      <a href={`/s/${item.id}`} className="flex items-center gap-3 min-w-0">
                        <div className="flex items-center gap-0.5 flex-shrink-0">
                          {item.species.slice(0, 3).map((s, j) => (
                            <DashboardSprite key={j} species={s} />
                          ))}
                        </div>
                        <span className="text-xs font-bold text-text-primary truncate">
                          {item.tournamentName || item.species.join(" / ")}
                        </span>
                      </a>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(c.id, item.id)}
                        className="p-1 text-text-tertiary hover:text-red-500 transition-colors cursor-pointer flex-shrink-0"
                        title="Remove from collection"
                        aria-label="Remove from collection"
                      >
                        <CloseIcon width="12" height="12" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-end mt-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => handleDelete(c.id)}
                  className="px-3 py-1 text-[10px] font-bold rounded-md text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                >
                  Delete Collection
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
