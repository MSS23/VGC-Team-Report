"use client";

import { useState, useEffect, useCallback } from "react";
import { useSessionId } from "@/hooks/useSessionId";

const REACTIONS = [
  { type: "fire", emoji: "\uD83D\uDD25", label: "Fire" },
  { type: "heart", emoji: "\u2764\uFE0F", label: "Love" },
  { type: "brain", emoji: "\uD83E\uDDE0", label: "Clever" },
  { type: "battle", emoji: "\u2694\uFE0F", label: "Battle-Ready" },
  { type: "clap", emoji: "\uD83D\uDC4F", label: "Great" },
] as const;

interface ReactionBarProps {
  shareId: string;
  compact?: boolean;
}

export function ReactionBar({ shareId, compact = false }: ReactionBarProps) {
  const sessionId = useSessionId();
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [userReactions, setUserReactions] = useState<Set<string>>(new Set());
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!shareId) return;
    const qs = sessionId ? `?sessionId=${encodeURIComponent(sessionId)}` : "";
    fetch(`/api/reactions/${shareId}${qs}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          setCounts(data.counts ?? {});
          setUserReactions(new Set(data.userReactions ?? []));
        }
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [shareId, sessionId]);

  const toggle = useCallback(
    async (type: string) => {
      if (!sessionId || compact) return;

      // Optimistic update
      const wasActive = userReactions.has(type);
      setUserReactions((prev) => {
        const next = new Set(prev);
        if (wasActive) next.delete(type);
        else next.add(type);
        return next;
      });
      setCounts((prev) => ({
        ...prev,
        [type]: Math.max(0, (prev[type] ?? 0) + (wasActive ? -1 : 1)),
      }));

      try {
        await fetch(`/api/reactions/${shareId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reactionType: type, sessionId }),
        });
      } catch {
        // Revert on failure
        setUserReactions((prev) => {
          const next = new Set(prev);
          if (wasActive) next.add(type);
          else next.delete(type);
          return next;
        });
        setCounts((prev) => ({
          ...prev,
          [type]: Math.max(0, (prev[type] ?? 0) + (wasActive ? 1 : -1)),
        }));
      }
    },
    [shareId, sessionId, userReactions, compact],
  );

  if (!loaded) return null;

  const visibleReactions = compact
    ? REACTIONS.filter((r) => (counts[r.type] ?? 0) > 0)
    : REACTIONS;

  if (compact && visibleReactions.length === 0) return null;

  return (
    <div className={`flex items-center ${compact ? "gap-1.5" : "gap-2"} flex-wrap`}>
      {visibleReactions.map((r) => {
        const count = counts[r.type] ?? 0;
        const active = userReactions.has(r.type);
        return (
          <button
            key={r.type}
            type="button"
            onClick={() => toggle(r.type)}
            disabled={compact}
            title={r.label}
            className={`inline-flex items-center gap-1 rounded-full transition-all duration-200 ${
              compact
                ? "px-1.5 py-0.5 text-[10px] cursor-default"
                : `px-3 py-1.5 text-xs cursor-pointer active:scale-95 ${
                    active
                      ? "bg-accent-surface border-2 border-accent/40 shadow-sm shadow-accent/10"
                      : "bg-surface border-2 border-border hover:border-accent/30 hover:bg-accent-surface/50"
                  }`
            }`}
          >
            <span className={compact ? "text-xs" : "text-sm"}>{r.emoji}</span>
            {count > 0 && (
              <span className={`font-bold ${active ? "text-accent" : "text-text-secondary"}`}>
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
