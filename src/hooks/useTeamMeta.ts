"use client";

import { useState, useCallback, useEffect, useRef } from "react";

export interface ReportTags {
  archetype?: string[];
  regulation?: string;
  eventType?: string;
  /**
   * True when the regulation tag was set by the auto-detector, false or
   * omitted when the user picked it manually. Must stay in sync with the
   * canonical ReportTags in src/lib/data/tags.ts.
   */
  regulationAutoDetected?: boolean;
}

interface TeamMeta {
  roles: Record<string, string>;
  summary: string;
  teamName?: string;
  tournamentName?: string;
  placement?: string;
  record?: string;
  mvpIndex?: number | null;
  rentalCode?: string;
  creatorName?: string;
  tags?: ReportTags;
  templateId?: string;
  /**
   * Per-Pokemon Mega override map. Keyed by the stable speciesKey (e.g.
   * "Kangaskhan", or "Charizard-Mega-Y", or "Charizard-2" for dupes) so
   * toggles follow the Pokemon across reorder / swap operations rather
   * than sticking to a slot index.
   *  - undefined → no explicit choice, fall back to globalMegaDefault
   *  - true / false → explicit choice for this Pokemon
   *
   * Historical note: before 2026-04-10 this map was keyed by team index
   * (0–5). Legacy numeric keys in localStorage are harmless — they just
   * never resolve against a real speciesKey and are ignored at read time.
   */
  megaStates?: Record<string, boolean>;
  /**
   * Team-wide Mega default for cards that don't have an explicit override.
   *  - undefined / null → "auto" (treat as true: show Mega when stone present)
   *  - true → all Mega-capable cards default to Mega form
   *  - false → all Mega-capable cards default to base form
   * Per-card megaStates entries always win over this.
   */
  globalMegaDefault?: boolean | null;
}

// v2 namespace — bumped after the localStorage leak incident on 2026-04-10.
function buildTeamKey(speciesKeys: string[]): string {
  const sorted = [...speciesKeys].sort();
  return `vgc-meta-v2-${sorted.join(",")}`;
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

  // Persist to localStorage on change.
  // Belt-and-suspenders: also block writes when the URL is /s/{id}.
  useEffect(() => {
    if (!persist || speciesKeys.length === 0) return;
    if (typeof window !== "undefined" && window.location.pathname.startsWith("/s/")) return;
    try {
      localStorage.setItem(teamKey, JSON.stringify(meta));
    } catch {
      // localStorage quota exceeded or private browsing — works in-memory
    }
  }, [meta, teamKey, speciesKeys.length, persist]);

  const roles = meta.roles;
  const summary = meta.summary;
  const teamName = meta.teamName;
  const tournamentName = meta.tournamentName;
  const placement = meta.placement;
  const record = meta.record;
  const mvpIndex = meta.mvpIndex ?? null;
  const rentalCode = meta.rentalCode;
  const creatorName = meta.creatorName;
  const tags = meta.tags;
  const templateId = meta.templateId;
  const megaStates = meta.megaStates;
  const globalMegaDefault = meta.globalMegaDefault ?? null;

  const setRole = useCallback((species: string, text: string) => {
    setMeta((prev) => ({ ...prev, roles: { ...prev.roles, [species]: text } }));
  }, []);

  const setSummary = useCallback((text: string) => {
    setMeta((prev) => ({ ...prev, summary: text }));
  }, []);

  const setTeamName = useCallback((text: string) => {
    setMeta((prev) => ({ ...prev, teamName: text }));
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

  const setTags = useCallback((newTags: ReportTags) => {
    setMeta((prev) => ({ ...prev, tags: newTags }));
  }, []);

  const setTemplateId = useCallback((id: string | undefined) => {
    setMeta((prev) => ({ ...prev, templateId: id }));
  }, []);

  const toggleMega = useCallback((index: number) => {
    // Resolve the slot index to a stable speciesKey at toggle time so
    // the override follows the Pokemon across reorder / swap operations.
    // If the index is out of range (should never happen at the UI layer)
    // we no-op rather than write a junk key.
    const key = speciesKeys[index];
    if (!key) return;
    setMeta((prev) => {
      // Effective current = explicit override OR global default OR auto-true.
      // Toggling computes the effective value and writes its inverse as an
      // explicit override, so the user always sees the form they expect to
      // see after the tap.
      const explicit = prev.megaStates?.[key];
      const effective = explicit ?? prev.globalMegaDefault ?? true;
      const next = !effective;
      return { ...prev, megaStates: { ...prev.megaStates, [key]: next } };
    });
  }, [speciesKeys]);

  /**
   * Set the team-wide Mega default. Does NOT touch existing per-card
   * overrides — cards the user has explicitly tapped keep their explicit
   * value. Use `resetMegaOverrides` afterwards to clear those.
   */
  const setGlobalMegaDefault = useCallback((value: boolean | null) => {
    setMeta((prev) => ({ ...prev, globalMegaDefault: value }));
  }, []);

  /** Wipe all per-card Mega overrides so every card follows the global default. */
  const resetMegaOverrides = useCallback(() => {
    setMeta((prev) => ({ ...prev, megaStates: {} }));
  }, []);

  // Merges partial updates into the existing meta. Callers that want to
  // null out a field must explicitly pass it as undefined.
  //
  // Why merge instead of replace: callsites like handleUndo/handleRedo
  // only restore a subset of fields ({ roles, summary }) because the
  // undo snapshot doesn't capture every meta field. A full replace
  // here used to silently wipe teamName, tournamentName, placement,
  // record, mvpIndex, rentalCode, creatorName, tags, etc. on every
  // undo press — making the team name appear to "not persist" after
  // any edit. Merging preserves untouched fields.
  const setMetaFull = useCallback((newMeta: Partial<TeamMeta>) => {
    setMeta((prev) => ({ ...prev, ...newMeta }));
  }, []);

  return {
    roles, summary, teamName, tournamentName, placement, record, mvpIndex, rentalCode, creatorName, tags, templateId, megaStates, globalMegaDefault,
    setRole, setSummary, setTeamName, setTournamentName, setPlacement, setRecord, setMvpIndex, setRentalCode, setCreatorName, setTags, setTemplateId, setMetaFull, toggleMega, setGlobalMegaDefault, resetMegaOverrides,
  };
}
