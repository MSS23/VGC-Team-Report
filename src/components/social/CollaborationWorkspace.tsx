"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { EditingPresence } from "@/lib/sharing/collaboration";

interface ThreadComment { id: number; name: string; body: string; parentId: number | null; createdAt: string }
export function CollaborationWorkspace({ shareId, activeSection, sections }: {
  shareId: string; activeSection: string; sections: { key: string; label: string }[];
}) {
  const [section, setSection] = useState(activeSection);
  const [presence, setPresence] = useState<EditingPresence[]>([]);
  const [comments, setComments] = useState<ThreadComment[]>([]);
  const [body, setBody] = useState("");
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const activeRef = useRef(activeSection); activeRef.current = activeSection;
  const requestRef = useRef(0);
  const lastCommentId = useRef(0);
  const refresh = useCallback(async () => {
    const requestId = ++requestRef.current;
    try {
      const response = await fetch(`/api/collaboration/${shareId}?section=${encodeURIComponent(section)}&after=${lastCommentId.current}`, { cache: "no-store" });
      const data = await response.json();
      if (requestId !== requestRef.current) return;
      if (!response.ok) throw new Error(data.error ?? "Could not load collaboration.");
      setPresence(data.presence);
      setComments((previous) => [...previous, ...data.comments.filter((item: ThreadComment) => !previous.some((old) => old.id === item.id))]);
      lastCommentId.current = Math.max(lastCommentId.current, ...data.comments.map((item: ThreadComment) => item.id));
      setError("");
    } catch (reason) { if (requestId === requestRef.current) setError(reason instanceof Error ? reason.message : "Could not load collaboration."); }
  }, [shareId, section]);
  useEffect(() => {
    setComments([]); setReplyTo(null); lastCommentId.current = 0;
    void refresh();
    const timer = setInterval(() => { if (!document.hidden) void refresh(); }, 5000);
    return () => { clearInterval(timer); requestRef.current++; };
  }, [refresh]);
  useEffect(() => {
    let lastSent = 0;
    let inFlight = false;
    async function heartbeat() {
      if (document.hidden || inFlight || Date.now() - lastSent < 5000) return;
      lastSent = Date.now(); inFlight = true;
      const focused = document.activeElement;
      const editable = focused instanceof HTMLInputElement || focused instanceof HTMLTextAreaElement;
      try {
        await fetch(`/api/collaboration/${shareId}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
          kind: "presence", section: activeRef.current,
          field: editable ? (focused.getAttribute("aria-label") || focused.getAttribute("placeholder") || "Text field").slice(0, 100) : "Viewing",
          caret: editable ? focused.selectionStart : null,
        }) });
      } catch { /* Polling surfaces service availability; no keystroke data is sent. */ }
      finally { inFlight = false; }
    }
    void heartbeat();
    const timer = setInterval(() => void heartbeat(), 15000);
    const activity = () => void heartbeat();
    document.addEventListener("selectionchange", activity);
    document.addEventListener("focusin", activity);
    return () => { clearInterval(timer); document.removeEventListener("selectionchange", activity); document.removeEventListener("focusin", activity); };
  }, [shareId]);
  async function submit() {
    if (!body.trim() || busy) return;
    setBusy(true); setError("");
    try {
      const response = await fetch(`/api/collaboration/${shareId}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: "comment", section, body, parentId: replyTo }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not post comment.");
      setBody(""); setReplyTo(null); await refresh();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not post comment."); }
    finally { setBusy(false); }
  }
  const label = (key: string) => sections.find((item) => item.key === key)?.label ?? key;
  function comment(item: ThreadComment) {
    return <article key={item.id} className="rounded-lg border border-border p-3"><p className="text-xs text-text-secondary"><strong>{item.name}</strong> · <time dateTime={item.createdAt}>{new Date(item.createdAt).toLocaleString()}</time></p><p className="mt-2 whitespace-pre-wrap break-words text-sm">{item.body}</p>{!item.parentId && <button type="button" onClick={() => setReplyTo(item.id)} className="min-h-11 px-2 text-sm font-semibold text-accent focus-visible:ring-2 focus-visible:ring-accent">Reply to {item.name}</button>}</article>;
  }
  return <section className="mx-auto my-3 max-w-5xl rounded-xl border border-border bg-surface p-3 sm:p-4" aria-label="Team collaboration">
    <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-semibold">Team collaboration</p><button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="min-h-11 rounded-lg border border-border px-3 text-sm font-semibold hover:bg-surface-alt focus-visible:ring-2 focus-visible:ring-accent">{open ? "Close section comments" : "Section comments"}</button></div>
    <div aria-live="polite" className="flex flex-wrap gap-2 text-xs text-text-secondary">{presence.length ? presence.map((person) => <span key={person.userId} className="rounded-md bg-accent-surface p-2"><svg aria-hidden="true" className="mr-1 inline h-3 w-3 text-accent" viewBox="0 0 12 12" fill="currentColor"><path d="M2 1v10l3-3 2 3 2-1-2-3h4z" /></svg><strong>{person.name}</strong> · {label(person.section)} · {person.field}{person.caret !== null ? ` (cursor ${person.caret})` : ""}</span>) : <span>No other editors active in the last 45 seconds.</span>}</div>
    {error && <p role="alert" className="mt-2 border-l-2 border-danger pl-3 text-sm text-text-primary">{error} <button type="button" onClick={() => void refresh()} className="min-h-11 px-2 font-semibold underline focus-visible:ring-2 focus-visible:ring-accent">Retry</button></p>}
    {open && <div className="mt-4 space-y-3"><p className="text-xs text-text-secondary">Private to the report owner and accepted collaborators. Choose a Pokémon or matchup to keep its discussion together.</p><label className="block text-sm font-semibold">Discussion section<select value={section} disabled={busy} onChange={(event) => { setSection(event.target.value); setReplyTo(null); }} className="mt-1 block min-h-11 w-full rounded-lg border border-border bg-surface px-3 focus-visible:ring-2 focus-visible:ring-accent">{sections.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}</select></label>
      <div className="max-h-80 space-y-3 overflow-y-auto">{comments.filter((item) => !item.parentId).map((root) => <div key={root.id}>{comment(root)}<div className="ml-4 mt-2 space-y-2 border-l-2 border-border pl-3">{comments.filter((item) => item.parentId === root.id).map(comment)}</div></div>)}{!comments.length && <p className="text-sm text-text-secondary">No comments in this section yet.</p>}</div>
      {replyTo && <p className="text-sm">Replying in thread #{replyTo}<button type="button" onClick={() => setReplyTo(null)} className="ml-2 min-h-11 px-2 underline focus-visible:ring-2 focus-visible:ring-accent">Cancel reply</button></p>}
      <label className="block text-sm font-semibold">Your comment<textarea value={body} maxLength={2000} disabled={busy} onChange={(event) => setBody(event.target.value)} className="mt-1 block min-h-24 w-full rounded-lg border border-border bg-surface p-3 font-normal focus-visible:ring-2 focus-visible:ring-accent" /></label><button type="button" onClick={() => void submit()} disabled={busy || !body.trim()} className="min-h-11 rounded-lg bg-text-primary px-4 font-semibold text-background disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2">{busy ? "Posting..." : replyTo ? "Post reply" : "Post comment"}</button>
    </div>}
  </section>;
}
