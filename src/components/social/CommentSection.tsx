"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSessionId } from "@/hooks/useSessionId";
import { relativeTime } from "@/lib/utils/relative-time";

interface Comment {
  id: number;
  displayName: string;
  body: string;
  isOwn: boolean;
  createdAt: string;
}

interface CommentSectionProps {
  shareId: string;
  canModerate?: boolean;
}

const DISPLAY_NAME_KEY = "vgc-display-name";

export function CommentSection({ shareId, canModerate = false }: CommentSectionProps) {
  const sessionId = useSessionId();
  const [comments, setComments] = useState<Comment[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [total, setTotal] = useState(0);

  const [displayName, setDisplayName] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [postSuccess, setPostSuccess] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);
  const nameRef = useRef(false);

  useEffect(() => {
    const saved = localStorage.getItem(DISPLAY_NAME_KEY);
    if (saved) setDisplayName(saved);
    nameRef.current = true;
  }, []);

  useEffect(() => {
    if (!nameRef.current) return;
    if (displayName.trim()) {
      localStorage.setItem(DISPLAY_NAME_KEY, displayName.trim());
    }
  }, [displayName]);

  const fetchComments = useCallback(
    async (cursor?: string) => {
      const params = new URLSearchParams();
      if (cursor) params.set("cursor", cursor);
      if (sessionId) params.set("sessionId", sessionId);
      const res = await fetch(`/api/comments/${shareId}?${params}`);
      if (!res.ok) return null;
      return res.json() as Promise<{ comments: Comment[]; nextCursor: string | null }>;
    },
    [shareId, sessionId],
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
        setPostSuccess(true);
        setPostError(null);
        setTimeout(() => setPostSuccess(false), 3000);
      } else {
        const data = await res.json().catch(() => null);
        setPostError(data?.error ?? "Failed to post comment");
        setTimeout(() => setPostError(null), 4000);
      }
    } catch {
      setPostError("Failed to post comment");
      setTimeout(() => setPostError(null), 4000);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId: number) => {
    try {
      const res = await fetch(`/api/comments/${shareId}/${commentId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
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
    comment.isOwn || canModerate;

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
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-surface-alt/50 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-text-secondary"
            aria-hidden="true"
          >
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
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {expanded && (
        <div className="border-t border-border">
          <div className="px-5 py-4 space-y-3 bg-surface-alt/30">
            <div className="flex gap-2">
              <label htmlFor="comment-display-name" className="sr-only">
                Display name (optional)
              </label>
              <input
                id="comment-display-name"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Display name (optional)"
                maxLength={50}
                className="flex-1 px-3 py-2 bg-surface border border-border rounded-lg text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all"
              />
            </div>
            <div className="relative">
              <label htmlFor="comment-body" className="sr-only">
                Comment
              </label>
              <textarea
                id="comment-body"
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
              className="px-4 py-2 bg-accent text-accent-on text-xs font-bold rounded-lg hover:brightness-110 active:scale-[0.97] shadow-sm shadow-accent/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed tracking-wide"
            >
              {submitting ? "Posting..." : "Post Comment"}
            </button>
            {postSuccess && (
              <span
                role="status"
                aria-live="polite"
                className="text-xs font-bold text-emerald-600 dark:text-emerald-400 animate-fade-in"
              >
                Comment posted!
              </span>
            )}
            {postError && (
              <span
                role="alert"
                className="text-xs font-bold text-danger animate-fade-in"
              >
                {postError}
              </span>
            )}
          </div>

          <div className="divide-y divide-border">
            {loading ? (
              <div className="px-5 py-6 text-center text-xs text-text-tertiary">
                Loading...
              </div>
            ) : comments.length === 0 ? (
              <div className="px-5 py-6 text-center text-xs text-text-tertiary">
                No comments yet. Be the first!
              </div>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="px-5 py-3 group">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-text-primary">
                        {comment.displayName}
                      </span>
                      <span className="text-[10px] text-text-tertiary">
                        {relativeTime(comment.createdAt)}
                      </span>
                    </div>
                    <div
                      className="flex items-center gap-2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-all"
                    >
                      {canDelete(comment) && (
                        <button
                          type="button"
                          onClick={() => handleDelete(comment.id)}
                          aria-label={`Delete comment by ${comment.displayName}`}
                          className="text-[10px] text-text-tertiary hover:text-danger cursor-pointer"
                        >
                          Delete
                        </button>
                      )}
                      {!comment.isOwn && (
                        <button
                          type="button"
                          onClick={() => handleFlag(comment.id)}
                          aria-label={`Flag comment by ${comment.displayName}`}
                          title="Flag this comment"
                          className="text-[10px] text-text-tertiary hover:text-warning cursor-pointer"
                        >
                          Flag
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    {comment.body}
                  </p>
                </div>
              ))
            )}
          </div>

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
