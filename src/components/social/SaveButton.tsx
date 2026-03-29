"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { track } from "@vercel/analytics";

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

  if (!user) return null;

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
      } else {
        await fetch("/api/user/saved", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ shareId }),
        });
        setSaved(true);
        track("report_saved", { shareId });
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
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border-2 transition-all cursor-pointer ${
        saved
          ? "bg-accent-surface border-accent/40 text-accent"
          : "bg-surface border-border text-text-secondary hover:border-accent/30 hover:text-accent"
      }`}
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill={saved ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
      </svg>
      {saved ? "Saved" : "Save"}
    </button>
  );
}
