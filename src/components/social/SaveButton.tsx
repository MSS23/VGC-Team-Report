"use client";

import { useState, useEffect } from "react";
import { useUser, SignInButton } from "@clerk/nextjs";
import { track } from "@vercel/analytics";
import posthog from "posthog-js";

interface SaveButtonProps {
  shareId: string;
}

const BookmarkIcon = ({ filled = false }: { filled?: boolean }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill={filled ? "currentColor" : "none"}
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
  </svg>
);

export function SaveButton({ shareId }: SaveButtonProps) {
  const { user } = useUser();
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [animating, setAnimating] = useState(false);

  // Check if already saved
  useEffect(() => {
    if (!user) return;
    fetch("/api/user/saved")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.reports?.some((r: { id: string }) => r.id === shareId)) {
          setSaved(true);
        }
      })
      .catch(() => {});
  }, [user, shareId]);

  // Guest: bookmark icon that opens sign-in modal
  if (!user) {
    return (
      <SignInButton mode="modal">
        <button
          type="button"
          aria-label="Save report"
          className="inline-flex items-center justify-center w-10 h-10 rounded-full text-text-secondary hover:text-accent transition-all cursor-pointer active:scale-90"
        >
          <BookmarkIcon />
        </button>
      </SignInButton>
    );
  }

  const toggle = async () => {
    if (loading) return;
    setLoading(true);
    try {
      if (saved) {
        await fetch("/api/user/saved", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ shareId }),
        });
        setSaved(false);
        track("report_unsaved", { shareId });
        posthog.capture("report_unsaved", { share_id: shareId });
      } else {
        await fetch("/api/user/saved", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ shareId }),
        });
        setSaved(true);
        setAnimating(true);
        setTimeout(() => setAnimating(false), 300);
        track("report_saved", { shareId });
        posthog.capture("report_saved", { share_id: shareId });
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={loading}
      aria-label={saved ? "Unsave report" : "Save report"}
      className={`inline-flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200 cursor-pointer active:scale-90 ${
        saved
          ? "text-accent"
          : "text-text-secondary hover:text-accent"
      }`}
    >
      <span className={animating ? "animate-like-pop" : "transition-transform"}>
        <BookmarkIcon filled={saved} />
      </span>
    </button>
  );
}
