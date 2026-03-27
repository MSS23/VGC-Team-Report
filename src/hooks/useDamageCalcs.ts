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

/** Migrate old calc entries that may be plain strings to CalcEntry objects */
function migrateCalcs(raw: unknown): DamageCalcsMap {
  if (!raw || typeof raw !== "object") return {};
  const result: DamageCalcsMap = {};
  for (const [key, entries] of Object.entries(raw as Record<string, unknown>)) {
    if (!Array.isArray(entries)) continue;
    result[key] = entries.map((entry: unknown) => {
      if (typeof entry === "string") {
        return { text: entry, category: "offensive" as CalcCategory };
      }
      if (entry && typeof entry === "object" && "text" in entry) {
        const e = entry as Record<string, unknown>;
        return {
          text: String(e.text ?? ""),
          category: (["offensive", "defensive", "speed"].includes(e.category as string) ? e.category : "offensive") as CalcCategory,
        };
      }
      return { text: String(entry), category: "offensive" as CalcCategory };
    });
  }
  return result;
}

export function useDamageCalcs(speciesKeys: string[], persist = true) {
  const teamKey = buildCalcsKey(speciesKeys);
  const prevTeamKey = useRef(teamKey);

  const [calcs, setCalcs] = useState<DamageCalcsMap>(() => {
    if (!persist || speciesKeys.length === 0) return {};
    try {
      const stored = localStorage.getItem(teamKey);
      return stored ? migrateCalcs(JSON.parse(stored)) : {};
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
      setCalcs(stored ? migrateCalcs(JSON.parse(stored)) : {});
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

  const editCalc = useCallback((species: string, index: number, updates: Partial<CalcEntry>) => {
    setCalcs((prev) => {
      const list = prev[species] ?? [];
      if (index < 0 || index >= list.length) return prev;
      const updated = [...list];
      updated[index] = { ...updated[index], ...updates };
      return { ...prev, [species]: updated };
    });
  }, []);

  const setCalcsFull = useCallback((newCalcs: DamageCalcsMap | Record<string, unknown>) => {
    setCalcs(migrateCalcs(newCalcs));
  }, []);

  const getCalcs = useCallback(
    (species: string): CalcEntry[] => calcs[species] ?? [],
    [calcs]
  );

  return { calcs, addCalc, removeCalc, editCalc, setCalcsFull, getCalcs };
}
