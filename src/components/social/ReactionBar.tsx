"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth, SignInButton } from "@clerk/nextjs";
import { useSessionId } from "@/hooks/useSessionId";
import { track } from "@vercel/analytics";
import { usePostHog } from "posthog-js/react";

interface ReactionBarProps {
  shareId: string;
  compact?: boolean;
  isOwner?: boolean;
}

const HeartIcon = ({ size = 18, filled = false }: { size?: number; filled?: boolean }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={filled ? "currentColor" : "none"}
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
  </svg>
);

export function ReactionBar({ shareId, compact = false, isOwner = false }: ReactionBarProps) {
  const sessionId = useSessionId();
  const { isSignedIn } = useAuth();
  const posthog = usePostHog();
  const [likeCount, setLikeCount] = useState(0);
  const [liked, setLiked] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (!shareId) return;
    const qs = sessionId ? `?sessionId=${encodeURIComponent(sessionId)}` : "";
    fetch(`/api/reactions/${shareId}${qs}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
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
    if (!sessionId || compact || !isSignedIn || isOwner) return;

    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikeCount((c) => Math.max(0, c + (wasLiked ? -1 : 1)));
    if (!wasLiked) {
      setAnimating(true);
      setTimeout(() => setAnimating(false), 300);
    }
    track("report_reacted", { shareId, action: wasLiked ? "removed" : "added" });
    posthog?.capture("report_reacted", { share_id: shareId, action: wasLiked ? "removed" : "added" });

    try {
      const res = await fetch(`/api/reactions/${shareId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reactionType: "heart", sessionId }),
      });
      if (!res.ok) {
        // API rejected — roll back optimistic update
        setLiked(wasLiked);
        setLikeCount((c) => Math.max(0, c + (wasLiked ? 1 : -1)));
      }
    } catch {
      setLiked(wasLiked);
      setLikeCount((c) => Math.max(0, c + (wasLiked ? 1 : -1)));
    }
  }, [shareId, sessionId, liked, compact, isSignedIn, isOwner, posthog]);

  if (!loaded) return null;

  // Compact: just show count (used in report cards)
  if (compact) {
    if (likeCount === 0) return null;
    return (
      <span className="inline-flex items-center gap-1 text-[10px]">
        <span className="text-red-500"><HeartIcon size={12} filled={liked} /></span>
        <span className="font-bold text-text-secondary">{likeCount}</span>
      </span>
    );
  }

  // Owner: show count, no interaction
  if (isOwner) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-bold text-text-tertiary">
        <span className="text-red-400"><HeartIcon filled={false} /></span>
        <span>{likeCount}</span>
      </span>
    );
  }

  // Guest: heart icon that opens sign-in modal
  if (!isSignedIn) {
    return (
      <SignInButton mode="modal">
        <button
          type="button"
          aria-label="Like report"
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-bold text-text-secondary hover:text-red-500 transition-all cursor-pointer active:scale-95"
        >
          <HeartIcon filled={false} />
          <span className="opacity-70">{likeCount}</span>
        </button>
      </SignInButton>
    );
  }

  // Signed in: interactive like button
  return (
    <button
      type="button"
      onClick={toggleLike}
      className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-bold transition-all duration-200 cursor-pointer active:scale-95 ${
        liked
          ? "text-red-500"
          : "text-text-secondary hover:text-red-500"
      }`}
    >
      <span className={animating ? "animate-like-pop" : "transition-transform"}>
        <HeartIcon filled={liked} />
      </span>
      <span className={liked ? "text-red-500" : "opacity-70"}>{likeCount}</span>
    </button>
  );
}
