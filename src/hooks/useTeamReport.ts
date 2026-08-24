"use client";

import { useState, useCallback, useEffect } from "react";
import type { ParsedTeam } from "@/lib/types/pokemon";
import type { TeamAnalysis } from "@/lib/types/analysis";

// v2 namespace — bumped after the localStorage leak incident on 2026-04-10.
// The pre-v2 keys could contain leaked content from someone else's shared
// report under a "user" marker due to a pre-fix race window. Reading from
// the v2 keys guarantees we never see any of that legacy state. Old keys
// are evicted by the legacy-cleanup effect in useHomePage on mount.
const STORAGE_KEY = "vgc-team-paste-v2";
const STORAGE_SOURCE_KEY = "vgc-team-paste-source-v2";
// Exact copy of the paste as of the last publish from this device. Restore
// compares against it: a stored paste identical to the published copy is not
// a draft (the canonical version lives on the server) and must not resurface
// as "this draft only lives on this device" — even if a later persist-effect
// run re-marked the source "user".
const STORAGE_PUBLISHED_KEY = "vgc-team-paste-published-v2";
// When the draft was last saved. Doubles as a generation marker: entries
// written before this key existed can't prove they were never published
// (pre-2026-08 publishes didn't flip the source marker), so restore treats
// a missing timestamp as not restorable.
const STORAGE_SAVED_AT_KEY = "vgc-team-paste-saved-at-v2";
// ponytail: 30-day draft TTL — a publish from another device/browser can't
// flip this device's marker, so age is the only bound on how long such a
// team keeps resurfacing as a "draft". Server-side check if this ever hurts.
const DRAFT_TTL_MS = 30 * 24 * 60 * 60 * 1000;

/** Remove every stored-draft key (paste, markers, timestamps). */
export function evictStoredDraft() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_SOURCE_KEY);
    localStorage.removeItem(STORAGE_PUBLISHED_KEY);
    localStorage.removeItem(STORAGE_SAVED_AT_KEY);
  } catch {
    // ignore
  }
}

/**
 * Return the locally stored paste if it is a genuine, restorable draft;
 * otherwise evict the stored state and return null.
 *
 * Restorable means all of:
 *  - source marker is "user" (not flipped by a publish on this device)
 *  - the paste differs from the last-published copy (identical ⇒ the server
 *    already holds it; restoring would mislabel a published team a draft)
 *  - it carries a save timestamp within the TTL (no timestamp ⇒ written
 *    before publish tracking was reliable ⇒ can't be trusted as unpublished)
 */
export function readRestorableDraft(now = Date.now()): string | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored || !stored.trim()) return null;
    const source = localStorage.getItem(STORAGE_SOURCE_KEY);
    const published = localStorage.getItem(STORAGE_PUBLISHED_KEY);
    const savedAt = Number(localStorage.getItem(STORAGE_SAVED_AT_KEY));
    const isRestorable =
      source === "user" &&
      stored !== published &&
      Number.isFinite(savedAt) &&
      savedAt > 0 &&
      now - savedAt < DRAFT_TTL_MS;
    if (isRestorable) return stored;
    evictStoredDraft();
    return null;
  } catch {
    return null;
  }
}

export type ViewMode = "simple" | "advanced";

export function useTeamReport(persist = true) {
  const [paste, setPaste] = useState("");
  const [parsedTeam, setParsedTeam] = useState<ParsedTeam | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("simple");

  // Auto-save paste to localStorage whenever it changes (and analysis exists).
  // Skipped when persist=false. Persist is disabled for sample teams and,
  // critically, for any shared-report view — see the SECURITY comment in
  // useHomePage.ts isInShareContext.
  //
  // BELT-AND-SUSPENDERS: in addition to the persist param, we also re-check
  // window.location.pathname directly inside the effect. If we somehow get
  // here while the URL is /s/{id} (a hook-ordering bug, a stale persist
  // closure, a router-state desync — anything), this guard blocks the
  // write at the very last possible moment so the leak can't reopen.
  useEffect(() => {
    if (!persist) return;
    if (typeof window !== "undefined" && window.location.pathname.startsWith("/s/")) return;
    try {
      if (parsedTeam && parsedTeam.pokemon.length > 0) {
        localStorage.setItem(STORAGE_KEY, paste);
        localStorage.setItem(STORAGE_SOURCE_KEY, "user");
        localStorage.setItem(STORAGE_SAVED_AT_KEY, String(Date.now()));
      }
    } catch {
      // localStorage quota exceeded — paste works in-memory only
    }
  }, [paste, parsedTeam, persist]);

  // The parser + Pokémon data tables (~330KB raw) live in the lazily-loaded
  // analyze-team chunk so the paste screen doesn't pay for them on first
  // paint. Both loads hit the same module, so the chunk downloads once;
  // after that these resolve in a microtask. Callers already treat
  // parsedTeam/analysis as async state, so the extra tick changes nothing.
  const parseTeam = useCallback((input: string) => {
    void import("@/lib/analysis/analyze-team").then(({ parseShowdownPaste }) => {
      setParsedTeam(parseShowdownPaste(input));
    });
  }, []);

  const [analysis, setAnalysis] = useState<TeamAnalysis | null>(null);
  useEffect(() => {
    if (!parsedTeam || parsedTeam.pokemon.length === 0) {
      setAnalysis(null);
      return;
    }
    let cancelled = false;
    void import("@/lib/analysis/analyze-team").then(({ analyzeTeam }) => {
      if (!cancelled) setAnalysis(analyzeTeam(parsedTeam));
    });
    return () => {
      cancelled = true;
    };
  }, [parsedTeam]);

  /** Reorder Pokemon by swapping positions. Preserves all parsed data. */
  const reorderPokemon = useCallback((fromIndex: number, toIndex: number) => {
    setParsedTeam((prev) => {
      if (!prev) return prev;
      const pokemon = [...prev.pokemon];
      const [moved] = pokemon.splice(fromIndex, 1);
      pokemon.splice(toIndex, 0, moved);
      return { ...prev, pokemon };
    });
  }, []);

  // After a successful publish the canonical copy lives on the server, so the
  // stored paste must stop counting as a local draft — otherwise a later
  // (possibly signed-out) visit restores the already-published team and the
  // UI mislabels it "this draft only lives on this device". Besides flipping
  // the source marker, snapshot the published paste itself: post-publish
  // edits re-mark the source "user" via the persist effect above, and the
  // snapshot lets readRestorableDraft tell a genuinely diverged draft (paste
  // differs — restore it) from a marker clobbered without a real content
  // change (paste identical — evict it).
  const markPastePublished = useCallback(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        localStorage.setItem(STORAGE_SOURCE_KEY, "published");
        localStorage.setItem(STORAGE_PUBLISHED_KEY, stored);
      }
    } catch {
      // ignore
    }
  }, []);

  const reset = useCallback(() => {
    setParsedTeam(null);
    setPaste("");
    evictStoredDraft();
  }, []);

  return {
    paste,
    setPaste,
    parsedTeam,
    analysis,
    viewMode,
    setViewMode,
    parseTeam,
    reorderPokemon,
    markPastePublished,
    reset,
    warnings: parsedTeam?.warnings ?? [],
  };
}
