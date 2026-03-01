"use client";

import { useState, useCallback, useEffect, useRef } from "react";

export type CalcCategory = "offensive" | "defensive" | "speed";

export interface CalcEntry {
  text: string;
  category: CalcCategory;
}

function buildCalcsKey(speciesKeys: string[]): string {
  const sorted = [...speciesKeys].sort();
  return `vgc-calcs-${sorted.join(",")}`;
}

/** Per-Pokémon array of notable calc entries. */
export type DamageCalcsMap = Record<string, CalcEntry[]>;

export function useDamageCalcs(speciesKeys: string[], persist = true) {
  const teamKey = buildCalcsKey(speciesKeys);
  const prevTeamKey = useRef(teamKey);

  const [calcs, setCalcs] = useState<DamageCalcsMap>(() => {
    if (!persist || speciesKeys.length === 0) return {};
    try {
      const stored = localStorage.getItem(teamKey);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  // When team changes, load calcs for the new team
  useEffect(() => {
    if (teamKey === prevTeamKey.current) return;
    prevTeamKey.current = teamKey;

    if (speciesKeys.length === 0) {
      setCalcs({});
      return;
    }

    if (!persist) return;

    try {
      const stored = localStorage.getItem(teamKey);
      setCalcs(stored ? JSON.parse(stored) : {});
    } catch {
      setCalcs({});
    }
  }, [teamKey, speciesKeys.length, persist]);

  // Persist to localStorage on change
  useEffect(() => {
    if (!persist || speciesKeys.length === 0) return;
    try {
      localStorage.setItem(teamKey, JSON.stringify(calcs));
    } catch {
      // localStorage quota exceeded — calcs work in-memory
    }
  }, [calcs, teamKey, speciesKeys.length, persist]);

  const addCalc = useCallback((species: string, text: string, category: CalcCategory) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setCalcs((prev) => ({
      ...prev,
      [species]: [...(prev[species] ?? []), { text: trimmed, category }],
    }));
  }, []);

  const removeCalc = useCallback((species: string, index: number) => {
    setCalcs((prev) => {
      const list = prev[species] ?? [];
      return { ...prev, [species]: list.filter((_, i) => i !== index) };
    });
  }, []);

  const setCalcsFull = useCallback((newCalcs: DamageCalcsMap) => {
    setCalcs(newCalcs);
  }, []);

  const getCalcs = useCallback(
    (species: string): CalcEntry[] => calcs[species] ?? [],
    [calcs]
  );

  return { calcs, addCalc, removeCalc, setCalcsFull, getCalcs };
}
