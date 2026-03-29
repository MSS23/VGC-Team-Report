"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { track } from "@vercel/analytics";

interface FollowButtonProps {
  creatorName: string;
}

export function FollowButton({ creatorName }: FollowButtonProps) {
  const { user } = useUser();
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetch("/api/user/follow")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.following?.some((n: string) => n.toLowerCase() === creatorName.toLowerCase())) {
          setFollowing(true);
        }
        setChecked(true);
      })
      .catch(() => setChecked(true));
  }, [user, creatorName]);

  if (!user || !checked) return null;

  const toggle = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await fetch("/api/user/follow", {
        method: following ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ creatorName }),
      });
      setFollowing(!following);
      track(following ? "creator_unfollowed" : "creator_followed", { creatorName });
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={loading}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border-2 transition-all cursor-pointer disabled:opacity-40 ${
        following
          ? "bg-accent-surface border-accent/30 text-accent"
          : "bg-surface border-border text-text-secondary hover:border-accent/30 hover:text-accent"
      }`}
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill={following ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {following ? (
          <>
            <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
            <circle cx="8.5" cy="7" r="4" />
            <polyline points="17 11 19 13 23 9" />
          </>
        ) : (
          <>
            <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
            <circle cx="8.5" cy="7" r="4" />
            <line x1="20" y1="8" x2="20" y2="14" />
            <line x1="23" y1="11" x2="17" y2="11" />
          </>
        )}
      </svg>
      {following ? "Following" : "Follow"}
    </button>
  );
}
