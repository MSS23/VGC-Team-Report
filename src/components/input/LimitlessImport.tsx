"use client";

import { useState } from "react";
import type { ShareableState } from "@/lib/sharing/url-codec";
import type { LimitlessResult } from "@/lib/import/limitless";

type Preview = LimitlessResult & { state: ShareableState; selectedIndex: number };

export function LimitlessImport({ onImport }: { onImport: (state: ShareableState) => void }) {
  const [url, setUrl] = useState("");
  const [preview, setPreview] = useState<Preview | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function fetchPreview(index = 0) {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/import/limitless?url=${encodeURIComponent(url.trim())}&result=${index}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not import this team.");
      setPreview(data as Preview);
    } catch (error) { setError(error instanceof Error ? error.message : "Could not import this team."); }
    finally { setBusy(false); }
  }
  return (
    <details className="mx-auto my-6 w-full max-w-3xl rounded-xl border border-border bg-surface p-4">
      <summary className="min-h-11 cursor-pointer py-2 text-base font-semibold text-text-primary focus-visible:ring-2 focus-visible:ring-accent">Import a Limitless tournament team</summary>
      <form onSubmit={(event) => { event.preventDefault(); void fetchPreview(); }} className="mt-4 space-y-4">
        <label className="block space-y-2 text-sm text-text-secondary" htmlFor="limitless-url"><span>Limitless team URL</span>
          <input id="limitless-url" type="url" required value={url} disabled={busy} onChange={(e) => { setUrl(e.target.value); setPreview(null); }} placeholder="https://limitlessvgc.com/teams/6859" className="min-h-11 w-full rounded-lg border border-border bg-surface px-3 text-base text-text-primary focus-visible:ring-2 focus-visible:ring-accent" />
        </label>
        <button type="submit" disabled={busy} className="min-h-11 rounded-lg border border-border px-4 font-semibold cursor-pointer hover:bg-surface-alt disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-accent">{busy ? "Loading team…" : "Preview import"}</button>
        {error && <p role="alert" className="border-l-2 border-danger pl-3 text-sm text-text-primary">{error}</p>}
      </form>
      {preview && <div className="mt-4 space-y-4" aria-live="polite">
        {preview.results.length > 1 && <label htmlFor="limitless-result" className="block space-y-2 text-sm"><span>Tournament result</span><select id="limitless-result" aria-disabled={busy} value={preview.selectedIndex} onChange={(e) => { if (!busy) void fetchPreview(Number(e.target.value)); }} className="block min-h-11 w-full rounded-lg border border-border bg-surface px-3 text-base focus-visible:ring-2 focus-visible:ring-accent">{preview.results.map((result, i) => <option key={i} value={i}>{result.placement} — {result.player} — {result.tournamentName}</option>)}</select></label>}
        <p className="font-semibold">{preview.state.creatorName} · {preview.state.placement} · {preview.state.tournamentName}</p>
        <p className="text-sm text-text-secondary">{[preview.state.tags?.regulation, preview.state.tags?.tournamentDate, preview.state.tags?.tournamentRegion, preview.state.tags?.tournamentPlayers ? `${preview.state.tags.tournamentPlayers} players` : ""].filter(Boolean).join(" · ")}</p>
        <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded-lg bg-surface-alt p-3 text-sm">{preview.paste}</pre>
        <p className="text-sm text-text-secondary">Open team sheets may omit EVs, IVs, or natures. Missing spreads stay uninvested; check those fields before using the stats or calculator. Importing starts a new report.</p>
        <button type="button" disabled={busy || !!error} onClick={() => onImport(preview.state)} className="min-h-11 rounded-lg bg-text-primary px-4 py-2 font-bold text-background cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2">Create report from this team</button>
      </div>}
    </details>
  );
}
