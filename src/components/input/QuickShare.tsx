"use client";
import { useState } from "react";

export function QuickShare({ paste }: { paste: string }) {
  const [busy, setBusy] = useState(false);
  const [url, setUrl] = useState("");
  const [submittedPaste, setSubmittedPaste] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  async function create() {
    setBusy(true); setError(""); setUrl(""); setCopied(false);
    try {
      const response = await fetch("/api/quick-share", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ paste }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not create a guest link.");
      setUrl(new URL(data.url, window.location.origin).href);
      setSubmittedPaste(paste);
    } catch (error) { setError(error instanceof Error ? error.message : "Could not create a guest link."); }
    finally { setBusy(false); }
  }
  return <section aria-label="Guest quick share" className="mt-4 space-y-3 rounded-xl border border-border bg-surface p-4 text-left">
    <button type="button" onClick={() => void create()} disabled={busy || !paste.trim() || /^https?:/i.test(paste.trim())} className="min-h-11 cursor-pointer rounded-lg border border-border px-4 font-semibold text-text-primary hover:bg-surface-alt disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-accent">{busy ? "Creating guest link…" : "Quick share without signing in"}</button>
    <p className="text-sm text-text-secondary">Share the Showdown paste above with sprites. Anyone with the link can view the full paste. Guest links expire after 30 days unless you save them to an account from this browser.</p>
    {error && <p role="alert">{error}</p>}
    {url && submittedPaste === paste && <div className="space-y-2" aria-live="polite"><p className="text-sm font-semibold">Your guest link is ready.</p><a href={url} className="inline-flex min-h-11 items-center break-all text-sm underline underline-offset-4 focus-visible:ring-2 focus-visible:ring-accent">{url}</a><div className="flex flex-wrap items-center gap-3"><button onClick={async () => { try { await navigator.clipboard.writeText(url); setCopied(true); } catch { setError("Could not copy automatically. Select the link above to copy it."); } }} className="min-h-11 cursor-pointer rounded-lg border border-border px-4 focus-visible:ring-2 focus-visible:ring-accent">{copied ? "Copied" : "Copy link"}</button><a href={url} className="inline-flex min-h-11 items-center font-semibold underline focus-visible:ring-2 focus-visible:ring-accent">Open report and save to your account</a></div></div>}
  </section>;
}
