"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { parseShowdownPaste } from "@/lib/parser/showdown-parser";
import { lookupPokemon } from "@/lib/data/pokemon";
import { calculateAllStats } from "@/lib/analysis/stat-calculator";
import { getItemStatBoost } from "@/lib/analysis/item-boosts";
import type { ParsedTeam } from "@/lib/types/pokemon";
import type { AnalyzedPokemon, TeamAnalysis } from "@/lib/types/analysis";

const STORAGE_KEY = "vgc-team-paste";

export type ViewMode = "simple" | "advanced";

/** Check if the current URL indicates a share link (skip localStorage load). */
function isShareUrl(): boolean {
  if (typeof window === "undefined") return false;
  const url = new URL(window.location.href);
  if (url.searchParams.has("s")) return true;
  const hash = window.location.hash;
  return hash.startsWith("#id=") || hash.startsWith("#data=");
}

function loadSavedPaste(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

export function useTeamReport() {
  const [paste, setPaste] = useState("");
  const [parsedTeam, setParsedTeam] = useState<ParsedTeam | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("simple");
  const hasAutoLoaded = useRef(false);

  // Auto-load saved paste on mount (skip if opening a share URL)
  useEffect(() => {
    if (hasAutoLoaded.current) return;
    hasAutoLoaded.current = true;

    if (isShareUrl()) return;

    const saved = loadSavedPaste();
    if (saved) {
      setPaste(saved);
      const result = parseShowdownPaste(saved);
      if (result.pokemon.length > 0) {
        setParsedTeam(result);
      }
    }
  }, []);

  // Auto-save paste to localStorage whenever it changes (and analysis exists)
  useEffect(() => {
    try {
      if (parsedTeam && parsedTeam.pokemon.length > 0) {
        localStorage.setItem(STORAGE_KEY, paste);
      }
    } catch {
      // localStorage quota exceeded — paste works in-memory only
    }
  }, [paste, parsedTeam]);

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

  const reset = useCallback(() => {
    setParsedTeam(null);
    setPaste("");
    try {
      localStorage.removeItem(STORAGE_KEY);
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
    reset,
    warnings: parsedTeam?.warnings ?? [],
  };
}
