"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { parseShowdownPaste } from "@/lib/parser/showdown-parser";
import { lookupPokemon } from "@/lib/data/pokemon";
import { calculateAllStats } from "@/lib/analysis/stat-calculator";
import { getItemStatBoost } from "@/lib/analysis/item-boosts";
import type { ParsedTeam } from "@/lib/types/pokemon";
import type { AnalyzedPokemon, TeamAnalysis } from "@/lib/types/analysis";

const STORAGE_KEY = "vgc-team-paste";
// Marker written alongside STORAGE_KEY whenever the paste is persisted from
// a user-owned editing session. The restore effect in useHomePage refuses to
// restore any paste that doesn't have a matching marker, so any legacy data
// written by the pre-fix code (which incorrectly persisted shared reports
// into the viewer's own localStorage) gets ignored rather than loaded as a
// "welcome-back" draft. See SECURITY comment in useHomePage.ts.
const STORAGE_SOURCE_KEY = "vgc-team-paste-source";

export type ViewMode = "simple" | "advanced";

export function useTeamReport(persist = true) {
  const [paste, setPaste] = useState("");
  const [parsedTeam, setParsedTeam] = useState<ParsedTeam | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("simple");

  // Auto-save paste to localStorage whenever it changes (and analysis exists).
  // Skipped when persist=false. Persist is disabled for sample teams and,
  // critically, for any shared-report view — see the SECURITY comment in
  // useHomePage.ts isInShareContext. The STORAGE_SOURCE_KEY marker is
  // written alongside the paste so the restore path can distinguish a
  // genuine user-owned draft from legacy leaked data.
  useEffect(() => {
    if (!persist) return;
    try {
      if (parsedTeam && parsedTeam.pokemon.length > 0) {
        localStorage.setItem(STORAGE_KEY, paste);
        localStorage.setItem(STORAGE_SOURCE_KEY, "user");
      }
    } catch {
      // localStorage quota exceeded — paste works in-memory only
    }
  }, [paste, parsedTeam, persist]);

  const parseTeam = useCallback((input: string) => {
    const result = parseShowdownPaste(input);
    setParsedTeam(result);
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
    reset,
    warnings: parsedTeam?.warnings ?? [],
  };
}
