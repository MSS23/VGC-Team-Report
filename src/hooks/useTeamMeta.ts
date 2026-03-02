"use client";

import { useState, useCallback, useEffect, useRef } from "react";

interface TeamMeta {
  roles: Record<string, string>;
  summary: string;
}

function buildTeamKey(speciesKeys: string[]): string {
  const sorted = [...speciesKeys].sort();
  return `vgc-meta-${sorted.join(",")}`;
}

const EMPTY_META: TeamMeta = { roles: {}, summary: "" };

export function useTeamMeta(speciesKeys: string[], persist = true) {
  const teamKey = buildTeamKey(speciesKeys);
  const prevTeamKey = useRef(teamKey);

  const [meta, setMeta] = useState<TeamMeta>(() => {
    if (!persist || speciesKeys.length === 0) return EMPTY_META;
    try {
      const stored = localStorage.getItem(teamKey);
      return stored ? JSON.parse(stored) : EMPTY_META;
    } catch {
      return EMPTY_META;
    }
  });

  // When team changes, load meta for the new team
  useEffect(() => {
    if (teamKey === prevTeamKey.current) return;
    prevTeamKey.current = teamKey;

    if (speciesKeys.length === 0) {
      setMeta(EMPTY_META);
      return;
    }

    if (!persist) return;

    try {
      const stored = localStorage.getItem(teamKey);
      setMeta(stored ? JSON.parse(stored) : EMPTY_META);
    } catch {
      setMeta(EMPTY_META);
    }
  }, [teamKey, speciesKeys.length, persist]);

  // Persist to localStorage on change
  useEffect(() => {
    if (!persist || speciesKeys.length === 0) return;
    try {
      localStorage.setItem(teamKey, JSON.stringify(meta));
    } catch {
      // localStorage quota exceeded or private browsing — works in-memory
    }
  }, [meta, teamKey, speciesKeys.length, persist]);

  const roles = meta.roles;
  const summary = meta.summary;

  const setRole = useCallback((species: string, text: string) => {
    setMeta((prev) => ({ ...prev, roles: { ...prev.roles, [species]: text } }));
  }, []);

  const setSummary = useCallback((text: string) => {
    setMeta((prev) => ({ ...prev, summary: text }));
  }, []);

  const setMetaFull = useCallback((newMeta: TeamMeta) => {
    setMeta(newMeta);
  }, []);

  return { roles, summary, setRole, setSummary, setMetaFull };
}
