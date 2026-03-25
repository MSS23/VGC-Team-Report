"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";

interface ClaimButtonProps {
  shareId: string;
  editToken: string;
}

export function ClaimButton({ shareId, editToken }: ClaimButtonProps) {
  const { user } = useUser();
  const [claimed, setClaimed] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!user || claimed) return null;

  const handleClaim = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/user/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shareId, editToken }),
      });
      if (res.ok) setClaimed(true);
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  return (
    <button
      type="button"
      onClick={handleClaim}
      disabled={loading}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border-2 bg-surface border-border text-text-secondary hover:border-accent/30 hover:text-accent transition-all cursor-pointer disabled:opacity-40"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="8.5" cy="7" r="4" />
        <line x1="20" y1="8" x2="20" y2="14" />
        <line x1="23" y1="11" x2="17" y2="11" />
      </svg>
      {loading ? "Claiming..." : "Claim as mine"}
    </button>
  );
}
