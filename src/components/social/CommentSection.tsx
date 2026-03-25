"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSessionId } from "@/hooks/useSessionId";
import { relativeTime } from "@/lib/utils/relative-time";

interface Comment {
  id: number;
  displayName: string;
  body: string;
  sessionId: string;
  createdAt: string;
}

interface CommentSectionProps {
  shareId: string;
  editToken?: string;
}

const DISPLAY_NAME_KEY = "vgc-display-name";

export function CommentSection({ shareId, editToken }: CommentSectionProps) {
  const sessionId = useSessionId();
  const [comments, setComments] = useState<Comment[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [total, setTotal] = useState(0);

  // Input state
  const [displayName, setDisplayName] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const nameRef = useRef(false);

  // Load saved display name
  useEffect(() => {
    const saved = localStorage.getItem(DISPLAY_NAME_KEY);
    if (saved) setDisplayName(saved);
    nameRef.current = true;
  }, []);

  // Save display name on change
  useEffect(() => {
    if (!nameRef.current) return;
    if (displayName.trim()) {
      localStorage.setItem(DISPLAY_NAME_KEY, displayName.trim());
    }
  }, [displayName]);

  // Fetch comments
  const fetchComments = useCallback(
    async (cursor?: string) => {
      const params = new URLSearchParams();
      if (cursor) params.set("cursor", cursor);
      const res = await fetch(`/api/comments/${shareId}?${params}`);
      if (!res.ok) return null;
      return res.json() as Promise<{ comments: Comment[]; nextCursor: string | null }>;
    },
    [shareId],
  );

  useEffect(() => {
    if (!shareId) return;
    fetchComments().then((data) => {
      if (data) {
        setComments(data.comments);
        setNextCursor(data.nextCursor);
        setTotal(data.comments.length + (data.nextCursor ? 1 : 0));
      }
      setLoading(false);
    });
  }, [shareId, fetchComments]);

  const loadMore = async () => {
    if (!nextCursor) return;
    const data = await fetchComments(nextCursor);
    if (data) {
      setComments((prev) => [...prev, ...data.comments]);
      setNextCursor(data.nextCursor);
    }
  };

  const handleSubmit = async () => {
    if (!body.trim() || !sessionId || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/comments/${shareId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: displayName.trim() || undefined,
          body: body.trim(),
          sessionId,
        }),
      });
      if (res.ok) {
        const { comment } = await res.json();
        setComments((prev) => [comment, ...prev]);
        setTotal((prev) => prev + 1);
        setBody("");
        setExpanded(true);
      }
    } catch {
      // silent
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId: number) => {
    try {
      const res = await fetch(`/api/comments/${shareId}/${commentId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, editToken }),
      });
      if (res.ok) {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
        setTotal((prev) => Math.max(0, prev - 1));
      }
    } catch {
      // silent
    }
  };

  const canDelete = (comment: Comment) =>
    comment.sessionId === sessionId || !!editToken;

  const handleFlag = async (commentId: number) => {
    if (!sessionId) return;
    try {
      const res = await fetch("/api/comments/flag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commentId, sessionId }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.autoRemoved) {
          // Comment was auto-removed due to flags
          setComments((prev) => prev.filter((c) => c.id !== commentId));
          setTotal((prev) => Math.max(0, prev - 1));
        }
      }
    } catch {
      // silent
    }
  };

  return (
    <div className="bg-surface border border-border rounded-2xl overflow-hidden">
      {/* Header */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-surface-alt/50 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-secondary">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
          </svg>
          <span className="text-sm font-bold text-text-primary">Comments</span>
          {total > 0 && (
            <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-extrabold rounded-full bg-accent-surface text-accent">
              {total}
            </span>
          )}
        </div>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`text-text-tertiary transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {expanded && (
        <div className="border-t border-border">
          {/* Input form */}
          <div className="px-5 py-4 space-y-3 bg-surface-alt/30">
            <div className="flex gap-2">
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Display name (optional)"
                maxLength={50}
                className="flex-1 px-3 py-2 bg-surface border border-border rounded-lg text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all"
              />
            </div>
            <div className="relative">
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value.slice(0, 500))}
                placeholder="Share your thoughts on this team..."
                rows={2}
                maxLength={500}
                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all resize-none"
              />
              <span className="absolute bottom-2 right-3 text-[10px] text-text-tertiary">
                {500 - body.length}
              </span>
            </div>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!body.trim() || submitting}
              className="px-4 py-2 bg-accent text-white text-xs font-bold rounded-lg hover:brightness-110 active:scale-[0.97] shadow-sm shadow-accent/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed tracking-wide"
            >
              {submitting ? "Posting..." : "Post Comment"}
            </button>
          </div>

          {/* Comment list */}
          <div className="divide-y divide-border">
            {loading ? (
              <div className="px-5 py-6 text-center text-xs text-text-tertiary">Loading...</div>
            ) : comments.length === 0 ? (
              <div className="px-5 py-6 text-center text-xs text-text-tertiary">
                No comments yet. Be the first!
              </div>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="px-5 py-3 group">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-text-primary">{comment.displayName}</span>
                      <span className="text-[10px] text-text-tertiary">{relativeTime(comment.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                      {canDelete(comment) && (
                        <button
                          type="button"
                          onClick={() => handleDelete(comment.id)}
                          className="text-[10px] text-text-tertiary hover:text-danger cursor-pointer"
                        >
                          Delete
                        </button>
                      )}
                      {comment.sessionId !== sessionId && (
                        <button
                          type="button"
                          onClick={() => handleFlag(comment.id)}
                          className="text-[10px] text-text-tertiary hover:text-warning cursor-pointer"
                          title="Report this comment"
                        >
                          Flag
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-text-secondary leading-relaxed">{comment.body}</p>
                </div>
              ))
            )}
          </div>

          {/* Load more */}
          {nextCursor && (
            <div className="px-5 py-3 border-t border-border">
              <button
                type="button"
                onClick={loadMore}
                className="text-xs font-bold text-accent hover:text-accent/80 transition-colors cursor-pointer"
              >
                Load more comments
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
