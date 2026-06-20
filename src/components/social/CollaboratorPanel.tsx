"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@clerk/nextjs";

interface Collaborator {
  userId: string;
  name: string;
  addedAt: string;
  status?: string;
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
  const { userId } = useAuth();
  const [open, setOpen] = useState(false);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);
  const [revoking, setRevoking] = useState(false);
  const [revokeConfirm, setRevokeConfirm] = useState(false);
  const [revokeSuccess, setRevokeSuccess] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fetchedRef = useRef(false);
  const collaboratorsRef = useRef<Collaborator[]>(collaborators);

  const isOriginalOwner = userId === ownerId;

  // Keep a ref to the latest collaborators so the search effect can read it
  // without depending on the array (a new reference every fetch/add/remove
  // would otherwise retrigger the debounce and churn the UI).
  useEffect(() => {
    collaboratorsRef.current = collaborators;
  }, [collaborators]);

  const fetchCollaborators = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/share/${shareId}/collaborators`);
      if (res.ok) {
        const data = await res.json();
        setCollaborators(data.collaborators ?? []);
        if (data.ownerId) setOwnerId(data.ownerId);
      }
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, [shareId]);

  // Fetch exactly once per open. Guarding on collaborators.length caused a
  // re-fetch loop for shares with zero collaborators (the GET legitimately
  // returns []), which flipped `loading` repeatedly and flashed the
  // spinner ↔ content swap. A ref tracks whether we've already fetched.
  useEffect(() => {
    if (open && !fetchedRef.current) {
      fetchedRef.current = true;
      fetchCollaborators();
    }
    if (!open) fetchedRef.current = false; // allow a fresh fetch on reopen
  }, [open, fetchCollaborators]);

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
        const res = await fetch(
          `/api/user/search?q=${encodeURIComponent(query.trim())}`,
        );
        if (res.ok) {
          const data = await res.json();
          const existingIds = new Set(
            collaboratorsRef.current.map((c) => c.userId),
          );
          setResults(
            (data.users ?? []).filter(
              (u: SearchResult) => !existingIds.has(u.id),
            ),
          );
        }
      } catch {
        /* silent */
      } finally {
        setSearching(false);
      }
    }, 400);
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [query]);

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
        setCollaborators((prev) => [
          ...prev,
          {
            userId: data.collaborator.userId,
            name: data.collaborator.name,
            addedAt: new Date().toISOString(),
          },
        ]);
        setResults((prev) => prev.filter((r) => r.id !== user.id));
        setQuery("");
      }
    } catch {
      /* silent */
    } finally {
      setAdding(null);
    }
  };

  const handleRemove = async (targetUserId: string) => {
    setRemoving(targetUserId);
    try {
      const res = await fetch(`/api/share/${shareId}/collaborators`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: targetUserId }),
      });
      if (res.ok) {
        setCollaborators((prev) =>
          prev.filter((c) => c.userId !== targetUserId),
        );
      }
    } catch {
      /* silent */
    } finally {
      setRemoving(null);
    }
  };

  const handleRevokeLink = async () => {
    setRevoking(true);
    try {
      const res = await fetch(`/api/share/${shareId}/collaborators`, {
        method: "PATCH",
      });
      if (res.ok) {
        setRevokeSuccess(true);
        setRevokeConfirm(false);
        setTimeout(() => setRevokeSuccess(false), 3000);
      }
    } catch {
      /* silent */
    } finally {
      setRevoking(false);
    }
  };

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border-2 bg-surface border-border text-text-secondary hover:border-accent/30 hover:text-accent transition-all cursor-pointer"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 00-3-3.87" />
          <path d="M16 3.13a4 4 0 010 7.75" />
        </svg>
        Manage Access
        {collaborators.length > 0 && (
          <span className="ml-1 px-1.5 py-0.5 text-[10px] font-extrabold bg-accent-surface text-accent rounded-full">
            {collaborators.length}
          </span>
        )}
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div className="mt-3 border border-border rounded-xl bg-surface overflow-hidden animate-fade-in">
          {/* Search input (owner only) */}
          {isOriginalOwner && (
            <div className="p-3 border-b border-border">
              <div className="relative">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search users to invite..."
                  className="w-full pl-8 pr-3 py-2 text-xs bg-surface-alt border border-border rounded-lg text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
                />
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-tertiary"
                  aria-hidden="true"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                {searching && (
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 border-[1.5px] border-accent/30 border-t-accent rounded-full animate-spin" />
                )}
              </div>

              {results.length > 0 && (
                <div className="mt-2 space-y-1">
                  {results.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-surface-alt/50"
                    >
                      <img
                        src={user.imageUrl}
                        alt=""
                        className="w-6 h-6 rounded-full object-cover"
                      />
                      <span className="text-xs font-bold text-text-primary flex-1 truncate">
                        {user.name}
                      </span>
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
          )}

          {/* People with access */}
          {loading ? (
            <div className="px-4 py-6 text-center">
              <span className="inline-block w-4 h-4 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="divide-y divide-border">
              {/* Owner row (always shown) */}
              <div className="flex items-center gap-2 px-4 py-3">
                <div className="w-7 h-7 rounded-full bg-accent/15 flex items-center justify-center flex-shrink-0">
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-accent"
                    aria-hidden="true"
                  >
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-bold text-text-primary block">
                    You
                  </span>
                  <span className="text-[10px] text-accent font-semibold">
                    Owner
                  </span>
                </div>
              </div>

              {/* Collaborators */}
              {collaborators.map((collab) => (
                <div
                  key={collab.userId}
                  className="flex items-center gap-2 px-4 py-3"
                >
                  {/* Initials avatar — decorative since the name is shown in the adjacent span */}
                  <div
                    className="w-7 h-7 rounded-full bg-surface-alt flex items-center justify-center flex-shrink-0"
                    aria-hidden="true"
                  >
                    <span className="text-[10px] font-extrabold text-text-secondary">
                      {collab.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-bold text-text-primary truncate block">
                      {collab.name}
                      {collab.status === "pending" && (
                        <span className="ml-1.5 px-1.5 py-0.5 text-[8px] font-extrabold uppercase tracking-wider rounded bg-amber-500/10 text-amber-600 dark:text-amber-400">
                          Pending
                        </span>
                      )}
                    </span>
                    <span className="text-[10px] text-text-tertiary">
                      {collab.status === "pending" ? "Invite sent" : "Can edit"}{" "}
                      &middot; Added{" "}
                      {new Date(collab.addedAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                  {isOriginalOwner && (
                    <button
                      type="button"
                      onClick={() => handleRemove(collab.userId)}
                      disabled={removing === collab.userId}
                      aria-label={`Remove ${collab.name}`}
                      className="px-2 py-1 text-[10px] font-bold text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-md transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {removing === collab.userId ? "..." : "Remove"}
                    </button>
                  )}
                </div>
              ))}

              {collaborators.length === 0 && (
                <div className="px-4 py-4 text-center text-xs text-text-tertiary">
                  No collaborators yet.
                  {isOriginalOwner ? " Search above to invite people." : ""}
                </div>
              )}
            </div>
          )}

          {/* Revoke link section (owner only) */}
          {isOriginalOwner && (
            <div className="border-t border-border px-4 py-3">
              {revokeSuccess ? (
                <p className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Link revoked. Old collab links no longer work.
                </p>
              ) : revokeConfirm ? (
                <div className="flex items-center gap-2">
                  <p className="text-[10px] text-red-400 font-semibold flex-1">
                    This will invalidate all existing collab links. Collaborators
                    already added will keep access.
                  </p>
                  <button
                    type="button"
                    onClick={handleRevokeLink}
                    disabled={revoking}
                    className="px-2.5 py-1 text-[10px] font-bold text-white bg-red-500 rounded-md hover:bg-red-600 transition-colors cursor-pointer disabled:opacity-50 flex-shrink-0"
                  >
                    {revoking ? "..." : "Confirm"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setRevokeConfirm(false)}
                    className="px-2.5 py-1 text-[10px] font-bold text-text-tertiary hover:text-text-primary transition-colors cursor-pointer flex-shrink-0"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setRevokeConfirm(true)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-text-tertiary hover:text-red-400 transition-colors cursor-pointer"
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0110 0v4" />
                  </svg>
                  Revoke collab link
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
