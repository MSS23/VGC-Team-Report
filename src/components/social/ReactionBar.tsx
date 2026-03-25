"use client";

import { useState, useEffect, useCallback } from "react";
import { useSessionId } from "@/hooks/useSessionId";

interface ReactionBarProps {
  shareId: string;
  compact?: boolean;
}

export function ReactionBar({ shareId, compact = false }: ReactionBarProps) {
  const sessionId = useSessionId();
  const [likeCount, setLikeCount] = useState(0);
  const [liked, setLiked] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!shareId) return;
    const qs = sessionId ? `?sessionId=${encodeURIComponent(sessionId)}` : "";
    fetch(`/api/reactions/${shareId}${qs}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          // Sum all existing reactions as "likes" for backward compat
          const total = Object.values(data.counts ?? {}).reduce(
            (sum: number, c) => sum + (c as number),
            0,
          );
          setLikeCount(total);
          setLiked((data.userReactions ?? []).length > 0);
        }
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [shareId, sessionId]);

  const toggleLike = useCallback(async () => {
    if (!sessionId || compact) return;

    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikeCount((c) => Math.max(0, c + (wasLiked ? -1 : 1)));

    try {
      await fetch(`/api/reactions/${shareId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reactionType: "heart", sessionId }),
      });
    } catch {
      setLiked(wasLiked);
      setLikeCount((c) => Math.max(0, c + (wasLiked ? 1 : -1)));
    }
  }, [shareId, sessionId, liked, compact]);

  if (!loaded) return null;

  if (compact) {
    if (likeCount === 0) return null;
    return (
      <span className="inline-flex items-center gap-1 text-[10px]">
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill={liked ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-red-500"
        >
          <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
        </svg>
        <span className="font-bold text-text-secondary">{likeCount}</span>
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleLike}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all duration-200 cursor-pointer active:scale-95 ${
        liked
          ? "bg-red-500/10 border-2 border-red-500/30 text-red-500 shadow-sm shadow-red-500/10"
          : "bg-surface border-2 border-border text-text-secondary hover:border-red-500/30 hover:bg-red-500/5 hover:text-red-500"
      }`}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill={liked ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
      </svg>
      <span>{liked ? "Liked" : "Like"}</span>
      {likeCount > 0 && <span className="opacity-70">{likeCount}</span>}
    </button>
  );
}
