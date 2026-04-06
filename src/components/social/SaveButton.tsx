"use client";

import { useState, useEffect } from "react";
import { useUser, SignInButton } from "@clerk/nextjs";
import { track } from "@vercel/analytics";
import posthog from "posthog-js";

interface SaveButtonProps {
  shareId: string;
}

export function SaveButton({ shareId }: SaveButtonProps) {
  const { user } = useUser();
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

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

  // Guest: show save button with sign-in prompt
  if (!user) {
    return (
      <SignInButton mode="modal">
        <button
          type="button"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold bg-surface border-2 border-border text-text-secondary hover:border-accent/30 hover:text-accent transition-all cursor-pointer active:scale-95"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
          </svg>
          Save
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
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all duration-200 cursor-pointer active:scale-95 ${
        saved
          ? "bg-accent-surface border-2 border-accent/40 text-accent shadow-sm shadow-accent/10"
          : "bg-surface border-2 border-border text-text-secondary hover:border-accent/30 hover:text-accent"
      }`}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill={saved ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
      </svg>
      <span>{saved ? "Saved" : "Save"}</span>
    </button>
  );
}
