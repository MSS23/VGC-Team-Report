"use client";

import { useState, useCallback, useEffect, useRef } from "react";

function buildTeamKey(speciesKeys: string[]): string {
  const sorted = [...speciesKeys].sort();
  return `vgc-notes-${sorted.join(",")}`;
}

export function usePokemonNotes(speciesKeys: string[], persist = true) {
  const teamKey = buildTeamKey(speciesKeys);
  const prevTeamKey = useRef(teamKey);

  const [notes, setNotes] = useState<Record<string, string>>(() => {
    if (!persist || speciesKeys.length === 0) return {};
    try {
      const stored = localStorage.getItem(teamKey);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  // When team changes, load notes for the new team
  useEffect(() => {
    if (teamKey === prevTeamKey.current) return;
    prevTeamKey.current = teamKey;

    if (speciesKeys.length === 0) {
      setNotes({});
      return;
    }

    if (!persist) return;

    try {
      const stored = localStorage.getItem(teamKey);
      setNotes(stored ? JSON.parse(stored) : {});
    } catch {
      setNotes({});
    }
  }, [teamKey, speciesKeys.length, persist]);

  // Persist to localStorage on change
  useEffect(() => {
    if (!persist || speciesKeys.length === 0) return;
    try {
      localStorage.setItem(teamKey, JSON.stringify(notes));
    } catch {
      // localStorage quota exceeded or private browsing — notes work in-memory
    }
  }, [notes, teamKey, speciesKeys.length, persist]);

  const setNote = useCallback((species: string, text: string) => {
    setNotes((prev) => ({ ...prev, [species]: text }));
  }, []);

  const setNotesFull = useCallback((newNotes: Record<string, string>) => {
    setNotes(newNotes);
  }, []);

  const getNote = useCallback(
    (species: string): string => notes[species] ?? "",
    [notes]
  );

  const clearAllNotes = useCallback(() => {
    setNotes({});
  }, []);

  return { notes, setNote, setNotesFull, getNote, clearAllNotes };
}
