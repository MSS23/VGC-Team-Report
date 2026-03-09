"use client";

import { useState, useCallback, useEffect, useRef } from "react";

interface TeamMeta {
  roles: Record<string, string>;
  summary: string;
  tournamentName?: string;
  placement?: string;
  record?: string;
  mvpIndex?: number | null;
  rentalCode?: string;
  creatorName?: string;
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
  const tournamentName = meta.tournamentName;
  const placement = meta.placement;
  const record = meta.record;
  const mvpIndex = meta.mvpIndex ?? null;
  const rentalCode = meta.rentalCode;
  const creatorName = meta.creatorName;

  const setRole = useCallback((species: string, text: string) => {
    setMeta((prev) => ({ ...prev, roles: { ...prev.roles, [species]: text } }));
  }, []);

  const setSummary = useCallback((text: string) => {
    setMeta((prev) => ({ ...prev, summary: text }));
  }, []);

  const setTournamentName = useCallback((text: string) => {
    setMeta((prev) => ({ ...prev, tournamentName: text }));
  }, []);

  const setPlacement = useCallback((text: string) => {
    setMeta((prev) => ({ ...prev, placement: text }));
  }, []);

  const setRecord = useCallback((text: string) => {
    setMeta((prev) => ({ ...prev, record: text }));
  }, []);

  const setMvpIndex = useCallback((index: number | null) => {
    setMeta((prev) => ({ ...prev, mvpIndex: index }));
  }, []);

  const setRentalCode = useCallback((text: string) => {
    setMeta((prev) => ({ ...prev, rentalCode: text }));
  }, []);

  const setCreatorName = useCallback((text: string) => {
    setMeta((prev) => ({ ...prev, creatorName: text }));
  }, []);

  const setMetaFull = useCallback((newMeta: TeamMeta) => {
    setMeta(newMeta);
  }, []);

  return {
    roles, summary, tournamentName, placement, record, mvpIndex, rentalCode, creatorName,
    setRole, setSummary, setTournamentName, setPlacement, setRecord, setMvpIndex, setRentalCode, setCreatorName, setMetaFull,
  };
}
