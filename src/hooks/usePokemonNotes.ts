"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { readStorageJSON, writeStorageJSON, STORAGE_KEY_BUILDERS } from "@/lib/utils/safe-storage";
import { isSharePath } from "@/hooks/share-path";

export function usePokemonNotes(speciesKeys: string[], persist = true) {
  // v2 namespace — bumped after the localStorage leak incident on 2026-04-10.
  // Reading from the v2 keys guarantees we never see legacy state that could
  // have been written by a pre-fix code path.
  const teamKey = STORAGE_KEY_BUILDERS.notes(speciesKeys);
  const prevTeamKey = useRef(teamKey);

  const [notes, setNotes] = useState<Record<string, string>>(() => {
    if (!persist || speciesKeys.length === 0) return {};
    return readStorageJSON<Record<string, string>>(teamKey, {});
  });

  // When team changes, load notes for the new team
  useEffect(() => {
    if (teamKey === prevTeamKey.current) return;
    prevTeamKey.current = teamKey;

    if (speciesKeys.length === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reload per-team state from storage when the team key changes
      setNotes({});
      return;
    }

    if (!persist) return;

    setNotes(readStorageJSON<Record<string, string>>(teamKey, {}));
  }, [teamKey, speciesKeys.length, persist]);

  // Persist to localStorage on change.
  // Belt-and-suspenders: also block writes when the URL is /s/{id}, in case
  // persist somehow flipped true during a shared-report view.
  useEffect(() => {
    if (!persist || speciesKeys.length === 0) return;
    if (isSharePath()) return;
    // localStorage quota exceeded or private browsing — notes work in-memory
    writeStorageJSON(teamKey, notes);
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
