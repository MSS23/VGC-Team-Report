"use client";
import { useState } from "react";
import { SignInButton, useAuth } from "@clerk/nextjs";

export function ClaimQuickShare({ id, canClaim }: { id: string; canClaim: boolean }) {
  const { isSignedIn, isLoaded } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function claim() {
    setBusy(true); setError("");
    try {
      const response = await fetch(`/api/quick-share/${id}/claim`, { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not save the report.");
      window.location.assign(data.url);
    } catch (error) { setError(error instanceof Error ? error.message : "Could not save the report."); setBusy(false); }
  }
  if (!canClaim) return <p className="text-sm text-text-secondary">The creator can save this report from the browser that made this link.</p>;
  const style = "min-h-11 cursor-pointer rounded-xl bg-text-primary px-4 py-2 font-bold text-background disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2";
  return <section className="space-y-3 rounded-xl border border-border bg-surface p-4" aria-label="Save guest report"><h2 className="font-semibold">Keep this report and make it your own</h2><p className="text-sm text-text-secondary">Save this report to add notes and damage calcs. Saving removes its 30-day expiry; it stays accessible to anyone with the link.</p>{isSignedIn ? <button onClick={() => void claim()} disabled={busy} className={style}>{busy ? "Saving report…" : "Save report to my account"}</button> : <SignInButton mode="modal"><button disabled={!isLoaded} className={style}>Sign in to save this report</button></SignInButton>}{error && <p role="alert">{error}</p>}</section>;
}
