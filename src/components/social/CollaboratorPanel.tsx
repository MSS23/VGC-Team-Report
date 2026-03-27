"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface Collaborator {
  userId: string;
  name: string;
  addedAt: string;
}

interface SearchResult {
  id: string;
  name: string;
  imageUrl: string;
}

interface CollaboratorPanelProps {
  shareId: string;
}

export function CollaboratorPanel({ shareId }: CollaboratorPanelProps) {
  const [open, setOpen] = useState(false);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchCollaborators = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/share/${shareId}/collaborators`);
      if (res.ok) {
        const data = await res.json();
        setCollaborators(data.collaborators ?? []);
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [shareId]);

  useEffect(() => {
    if (open && collaborators.length === 0 && !loading) fetchCollaborators();
  }, [open, collaborators.length, loading, fetchCollaborators]);

  // Debounced user search
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    searchTimer.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/user/search?q=${encodeURIComponent(query.trim())}`);
        if (res.ok) {
          const data = await res.json();
          // Filter out users who are already collaborators
          const existingIds = new Set(collaborators.map((c) => c.userId));
          setResults((data.users ?? []).filter((u: SearchResult) => !existingIds.has(u.id)));
        }
      } catch { /* silent */ }
      finally { setSearching(false); }
    }, 400);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [query, collaborators]);

  const handleAdd = async (user: SearchResult) => {
    setAdding(user.id);
    try {
      const res = await fetch(`/api/share/${shareId}/collaborators`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });
      if (res.ok) {
        const data = await res.json();
        setCollaborators((prev) => [...prev, {
          userId: data.collaborator.userId,
          name: data.collaborator.name,
          addedAt: new Date().toISOString(),
        }]);
        setResults((prev) => prev.filter((r) => r.id !== user.id));
        setQuery("");
      }
    } catch { /* silent */ }
    finally { setAdding(null); }
  };

  const handleRemove = async (userId: string) => {
    setRemoving(userId);
    try {
      const res = await fetch(`/api/share/${shareId}/collaborators`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (res.ok) {
        setCollaborators((prev) => prev.filter((c) => c.userId !== userId));
      }
    } catch { /* silent */ }
    finally { setRemoving(null); }
  };

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border-2 bg-surface border-border text-text-secondary hover:border-accent/30 hover:text-accent transition-all cursor-pointer"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 00-3-3.87" />
          <path d="M16 3.13a4 4 0 010 7.75" />
        </svg>
        Collaborators
        {collaborators.length > 0 && (
          <span className="ml-1 px-1.5 py-0.5 text-[10px] font-extrabold bg-accent-surface text-accent rounded-full">
            {collaborators.length}
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
          {/* Search input */}
          <div className="p-3 border-b border-border">
            <div className="relative">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search users to invite..."
                className="w-full pl-8 pr-3 py-2 text-xs bg-surface-alt border border-border rounded-lg text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
              />
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-tertiary">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              {searching && (
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 border-[1.5px] border-accent/30 border-t-accent rounded-full animate-spin" />
              )}
            </div>

            {/* Search results */}
            {results.length > 0 && (
              <div className="mt-2 space-y-1">
                {results.map((user) => (
                  <div key={user.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-surface-alt/50">
                    <img
                      src={user.imageUrl}
                      alt=""
                      className="w-6 h-6 rounded-full object-cover"
                    />
                    <span className="text-xs font-bold text-text-primary flex-1 truncate">{user.name}</span>
                    <button
                      type="button"
                      onClick={() => handleAdd(user)}
                      disabled={adding === user.id}
                      className="px-2.5 py-1 text-[10px] font-bold rounded-md bg-accent text-white hover:brightness-110 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {adding === user.id ? "..." : "Add"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Current collaborators */}
          {loading ? (
            <div className="px-4 py-6 text-center">
              <span className="inline-block w-4 h-4 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
            </div>
          ) : collaborators.length === 0 ? (
            <div className="px-4 py-6 text-center text-xs text-text-tertiary">
              No collaborators yet. Search for users above to invite them to edit this report.
            </div>
          ) : (
            <div className="divide-y divide-border">
              {collaborators.map((collab) => (
                <div key={collab.userId} className="flex items-center gap-2 px-4 py-3">
                  <div className="w-7 h-7 rounded-full bg-accent-surface flex items-center justify-center flex-shrink-0">
                    <span className="text-[10px] font-extrabold text-accent">
                      {collab.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-bold text-text-primary truncate block">{collab.name}</span>
                    <span className="text-[10px] text-text-tertiary">
                      Added {new Date(collab.addedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemove(collab.userId)}
                    disabled={removing === collab.userId}
                    className="p-1.5 text-text-tertiary hover:text-red-500 transition-colors cursor-pointer disabled:opacity-50"
                    title="Remove collaborator"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
