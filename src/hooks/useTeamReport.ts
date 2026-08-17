"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { parseShowdownPaste } from "@/lib/parser/showdown-parser";
import { lookupPokemon } from "@/lib/data/pokemon";
import { teamNeedsDexFallback } from "@/lib/data/dex-fallback-gate";
import { loadDexFallback } from "@/lib/data/pkmn-dex-fallback";
import { calculateAllStats } from "@/lib/analysis/stat-calculator";
import { getItemStatBoost } from "@/lib/analysis/item-boosts";
import type { ParsedTeam } from "@/lib/types/pokemon";
import type { AnalyzedPokemon, TeamAnalysis } from "@/lib/types/analysis";

// v2 namespace — bumped after the localStorage leak incident on 2026-04-10.
// The pre-v2 keys could contain leaked content from someone else's shared
// report under a "user" marker due to a pre-fix race window. Reading from
// the v2 keys guarantees we never see any of that legacy state. Old keys
// are evicted by the legacy-cleanup effect in useHomePage on mount.
const STORAGE_KEY = "vgc-team-paste-v2";
const STORAGE_SOURCE_KEY = "vgc-team-paste-source-v2";

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
      }
    } catch {
      // localStorage quota exceeded — paste works in-memory only
    }
  }, [paste, parsedTeam, persist]);

  // Monotonic token so a slow dex fetch for an earlier paste can never clobber
  // a newer one (paste → edit → paste in quick succession).
  const parseSeq = useRef(0);

  const parseTeam = useCallback((input: string) => {
    const result = parseShowdownPaste(input);
    const seq = ++parseSeq.current;

    // Fast path: every member resolves from the static maps, so commit
    // synchronously — identical timing to before VGC-271, and the dex-subset
    // chunk is never fetched at all.
    if (!teamNeedsDexFallback(result.pokemon)) {
      setParsedTeam(result);
      return;
    }

    // Slow path: this team contains a species/stone only the dex subset knows.
    // Wait for the chunk before committing, so the cards' first render already
    // has names, types and base stats instead of flashing an empty shell.
    void loadDexFallback().then(() => {
      if (parseSeq.current === seq) setParsedTeam(result);
    });
  }, []);

  const analysis = useMemo<TeamAnalysis | null>(() => {
    if (!parsedTeam || parsedTeam.pokemon.length === 0) return null;

    const analyzedPokemon: AnalyzedPokemon[] = parsedTeam.pokemon.map((parsed) => {
      const data = lookupPokemon(parsed.species);
      const calculatedStats = data
        ? calculateAllStats(data.baseStats, parsed.ivs, parsed.evs, parsed.level, parsed.nature)
        : { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };

      const itemBoost = getItemStatBoost(parsed.item, parsed.ability, calculatedStats);

      return { parsed, data, calculatedStats, itemBoost };
    });

    return { pokemon: analyzedPokemon };
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
  // UI mislabels it "this draft only lives on this device". Post-publish
  // edits re-mark the source "user" via the persist effect above, which
  // correctly makes the diverged copy a draft again.
  const markPastePublished = useCallback(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY)) {
        localStorage.setItem(STORAGE_SOURCE_KEY, "published");
      }
    } catch {
      // ignore
    }
  }, []);

  const reset = useCallback(() => {
    setParsedTeam(null);
    setPaste("");
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(STORAGE_SOURCE_KEY);
    } catch {
      // ignore
    }
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
