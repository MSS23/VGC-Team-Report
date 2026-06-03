"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { parseShowdownPaste } from "@/lib/parser/showdown-parser";
import { lookupPokemon } from "@/lib/data/pokemon";
import {
  calculateAllStats,
  calculateChampionsStat,
  convertToChampionsSp,
  CHAMPIONS_MAX_SP_PER_STAT,
  CHAMPIONS_TOTAL_SP,
} from "@/lib/analysis/stat-calculator";
import { getItemStatBoost } from "@/lib/analysis/item-boosts";
import { getDefensiveProfile } from "@/lib/data/type-chart";
import { PokemonSprite } from "@/components/report/PokemonSprite";
import { TypeBadge } from "@/components/report/TypeBadge";
import { PageFooter } from "@/components/layout/PageFooter";
import { isPokePasteUrl, fetchPokePaste } from "@/lib/utils/pokepaste";
import { detectMegaFromItem, isMegaForm } from "@/lib/utils/mega-detect";
import type { AnalyzedPokemon } from "@/lib/types/analysis";
import type { PokemonType } from "@/lib/types/pokemon";

interface UserReport {
  id: string;
  species: string[];
  tournamentName?: string;
  creatorName?: string;
  placement?: string;
  teamSummary?: string;
}

function useMyReports() {
  const { isSignedIn } = useAuth();
  const [reports, setReports] = useState<UserReport[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isSignedIn) { setReports([]); return; }
    setLoading(true);
    fetch("/api/user/reports")
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((d) => setReports(d.reports ?? []))
      .catch(() => setReports([]))
      .finally(() => setLoading(false));
  }, [isSignedIn]);

  return { reports, loading, isSignedIn };
}

function getReportLabel(r: UserReport): string {
  const parts: string[] = [];
  if (r.tournamentName) parts.push(r.tournamentName);
  if (r.creatorName) parts.push(r.creatorName);
  if (r.placement) parts.push(r.placement);
  if (parts.length === 0 && r.species.length > 0) {
    parts.push(r.species.slice(0, 3).join(" / "));
  }
  if (parts.length === 0) parts.push(r.id);
  return parts.join(" — ");
}

function ReportDropdown({
  reports,
  loading,
  onSelect,
  variant,
  disabledId,
}: {
  reports: UserReport[];
  loading: boolean;
  onSelect: (shareId: string) => void;
  variant: "blue" | "orange";
  disabledId?: string | null;
}) {
  const focusClasses = variant === "blue"
    ? "focus:ring-blue-500/40 focus:border-blue-500"
    : "focus:ring-orange-500/40 focus:border-orange-500";

  return (
    <div className="mb-2">
      <select
        className={`w-full px-3 py-2 bg-surface border-2 border-border rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 ${focusClasses} cursor-pointer`}
        defaultValue=""
        aria-label="Select team report to compare"
        onChange={(e) => {
          if (e.target.value) onSelect(e.target.value);
          e.target.value = "";
        }}
        disabled={loading || reports.length === 0}
      >
        <option value="" disabled>
          {loading ? "Loading reports..." : reports.length === 0 ? "No reports yet" : "Select from my reports..."}
        </option>
        {reports.map((r) => (
          <option key={r.id} value={r.id} disabled={r.id === disabledId}>
            {getReportLabel(r)}{r.id === disabledId ? " (already selected)" : ""}
          </option>
        ))}
      </select>
    </div>
  );
}

const ALL_TYPES: PokemonType[] = [
  "Normal", "Fire", "Water", "Electric", "Grass", "Ice",
  "Fighting", "Poison", "Ground", "Flying", "Psychic", "Bug",
  "Rock", "Ghost", "Dragon", "Dark", "Steel", "Fairy",
];

interface CompareAnalyzedPokemon extends AnalyzedPokemon {
  /** Resolved display name (mega name if applicable) */
  displaySpecies: string;
  /** Resolved types (mega types if applicable) */
  displayTypes: string[];
  /** Sprite key (mega data key if applicable) */
  spriteSpecies: string;
}

/**
 * Champions-format detection for a parsed team.
 *
 * The Compare page receives raw pastes without regulation metadata, so we
 * infer the format from the spread shape. Champions (Reg M-A) pastes carry
 * SP values in the EV line — total ≤ 66, no stat > 32 — which is
 * unambiguous vs. Reg G (total up to 508). Applied team-wide so every
 * Pokemon in the same paste is read consistently.
 */
function looksLikeChampionsTeam(pokemon: { evs: import("@/lib/types/pokemon").StatSpread }[]): boolean {
  if (pokemon.length === 0) return false;
  for (const p of pokemon) {
    const stats = ["hp", "atk", "def", "spa", "spd", "spe"] as const;
    const total = stats.reduce((sum, s) => sum + p.evs[s], 0);
    if (total === 0) continue; // uninvested — inconclusive
    if (total > CHAMPIONS_TOTAL_SP) return false;
    if (stats.some((s) => p.evs[s] > CHAMPIONS_MAX_SP_PER_STAT)) return false;
  }
  return true;
}

function analyzePaste(paste: string): CompareAnalyzedPokemon[] | null {
  if (!paste.trim()) return null;
  const parsed = parseShowdownPaste(paste);
  if (parsed.pokemon.length === 0) return null;
  const isChampions = looksLikeChampionsTeam(parsed.pokemon);
  return parsed.pokemon.map((p) => {
    let data = lookupPokemon(p.species);
    let displaySpecies = p.species;
    let spriteSpecies = p.species;
    let displayTypes: string[] = data?.types ?? [];

    // Resolve mega evolution — either already mega or has mega stone
    const alreadyMega = isMegaForm(p.species);
    if (!alreadyMega) {
      const megaEntry = detectMegaFromItem(p.item, p.species);
      if (megaEntry) {
        const megaData = lookupPokemon(megaEntry.dataKey);
        if (megaData) {
          data = megaData;
          displaySpecies = megaEntry.displayName;
          spriteSpecies = megaEntry.dataKey;
          displayTypes = megaData.types;
        }
      }
    }

    let calculatedStats = data
      ? calculateAllStats(data.baseStats, p.ivs, p.evs, p.level, p.nature)
      : { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };
    if (isChampions && data) {
      const sp = convertToChampionsSp(p.evs);
      calculatedStats = {
        hp: calculateChampionsStat("hp", data.baseStats.hp, sp.hp, p.nature),
        atk: calculateChampionsStat("atk", data.baseStats.atk, sp.atk, p.nature),
        def: calculateChampionsStat("def", data.baseStats.def, sp.def, p.nature),
        spa: calculateChampionsStat("spa", data.baseStats.spa, sp.spa, p.nature),
        spd: calculateChampionsStat("spd", data.baseStats.spd, sp.spd, p.nature),
        spe: calculateChampionsStat("spe", data.baseStats.spe, sp.spe, p.nature),
      };
    }
    const itemBoost = getItemStatBoost(p.item, p.ability, calculatedStats);
    return { parsed: p, data, calculatedStats, itemBoost, displaySpecies, displayTypes, spriteSpecies };
  });
}

function getTeamWeaknesses(pokemon: CompareAnalyzedPokemon[]) {
  const weakMap: Record<string, number> = {};
  const resistMap: Record<string, number> = {};
  for (const mon of pokemon) {
    const types = mon.displayTypes;
    if (types.length === 0) continue;
    const profile = getDefensiveProfile(types as PokemonType[]);
    for (const [t, mult] of Object.entries(profile)) {
      if (mult >= 2) weakMap[t] = (weakMap[t] ?? 0) + 1;
      if (mult <= 0.5) resistMap[t] = (resistMap[t] ?? 0) + 1;
    }
  }
  return { weakMap, resistMap };
}

function PokemonRow({ pokemon, shared }: { pokemon: CompareAnalyzedPokemon[]; shared: Set<string> }) {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
      {pokemon.map((mon, i) => {
        const isShared = shared.has(mon.parsed.species.toLowerCase());
        return (
          <div key={i} className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 ${isShared ? "border-accent bg-accent/5" : "border-border bg-surface"}`}>
            <PokemonSprite species={mon.spriteSpecies} size={48} shiny={mon.parsed.shiny} />
            <span className="text-[10px] font-bold text-text-primary text-center leading-tight w-full truncate">{mon.displaySpecies}</span>
            <div className="flex gap-0.5">
              {mon.displayTypes.map((t) => (
                <TypeBadge key={t} type={t as PokemonType} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TypeWeaknessGrid({ label, weakMap, resistMap, color }: { label: string; weakMap: Record<string, number>; resistMap: Record<string, number>; color: string }) {
  return (
    <div className="flex-1 min-w-0">
      <h4 className={`text-xs font-bold ${color} mb-2`}>{label}</h4>
      <div className="grid grid-cols-6 gap-1">
        {ALL_TYPES.map((t) => {
          const weak = weakMap[t] ?? 0;
          const resist = resistMap[t] ?? 0;
          return (
            <div key={t} className="flex flex-col items-center gap-0.5">
              <TypeBadge type={t} />
              <div className="flex gap-1 text-[9px] font-bold">
                {weak > 0 && <span className="text-red-500">-{weak}</span>}
                {resist > 0 && <span className="text-emerald-500">+{resist}</span>}
                {weak === 0 && resist === 0 && <span className="text-text-tertiary">0</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SpeedComparison({ teamA, teamB }: { teamA: CompareAnalyzedPokemon[]; teamB: CompareAnalyzedPokemon[] }) {
  const effectiveSpeed = (m: CompareAnalyzedPokemon): number => {
    const base = m.calculatedStats.spe;
    return m.itemBoost?.stat === "spe"
      ? Math.floor(base * m.itemBoost.multiplier)
      : base;
  };
  const allSpeeds = [
    ...teamA.map((m) => ({ species: m.displaySpecies, speed: effectiveSpeed(m), team: "A" as const })),
    ...teamB.map((m) => ({ species: m.displaySpecies, speed: effectiveSpeed(m), team: "B" as const })),
  ].sort((a, b) => b.speed - a.speed);

  const maxSpeed = allSpeeds[0]?.speed ?? 1;

  return (
    <div className="space-y-1.5">
      {allSpeeds.map((entry, i) => (
        <div key={`${entry.species}-${entry.team}-${i}`} className="flex items-center gap-2">
          <span className={`text-[10px] font-bold w-24 text-right truncate ${entry.team === "A" ? "text-blue-500" : "text-orange-500"}`}>
            {entry.species}
          </span>
          <div className="flex-1 h-4 bg-surface-alt rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${entry.team === "A" ? "bg-blue-500/70" : "bg-orange-500/70"}`}
              style={{ width: `${(entry.speed / maxSpeed) * 100}%` }}
            />
          </div>
          <span className="text-[10px] font-bold text-text-secondary w-8">{entry.speed}</span>
        </div>
      ))}
    </div>
  );
}

/** Extract share ID from a VGC Team Report URL like /s/AbCdEfGh or full URL */
function extractShareId(input: string): string | null {
  const trimmed = input.trim();
  const match = trimmed.match(/\/s\/([a-zA-Z0-9]{6,12})/);
  return match?.[1] ?? null;
}

function isUrl(input: string): boolean {
  return isPokePasteUrl(input) || !!extractShareId(input);
}

export function CompareContent() {
  const [pasteA, setPasteA] = useState("");
  const [pasteB, setPasteB] = useState("");
  const [compared, setCompared] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [selectedIdA, setSelectedIdA] = useState<string | null>(null);
  const [selectedIdB, setSelectedIdB] = useState<string | null>(null);
  const { reports, loading: reportsLoading, isSignedIn } = useMyReports();

  const handleSelectReport = useCallback(async (shareId: string, setter: (v: string) => void, setSelectedId: (id: string) => void) => {
    setFetchError(null);
    setFetching(true);
    try {
      const res = await fetch(`/api/share/${shareId}`);
      if (!res.ok) throw new Error("Failed to load report");
      const data = await res.json();
      if (!data.paste) throw new Error("Report has no team data");
      setter(data.paste);
      setSelectedId(shareId);
      setCompared(false);
    } catch (e) {
      setFetchError(e instanceof Error ? e.message : "Failed to load report");
    } finally {
      setFetching(false);
    }
  }, []);

  const teamA = useMemo<CompareAnalyzedPokemon[] | null>(() => compared ? analyzePaste(pasteA) : null, [pasteA, compared]);
  const teamB = useMemo<CompareAnalyzedPokemon[] | null>(() => compared ? analyzePaste(pasteB) : null, [pasteB, compared]);

  const sharedSpecies = useMemo(() => {
    if (!teamA || !teamB) return new Set<string>();
    const speciesA = new Set(teamA.map((m) => m.parsed.species.toLowerCase()));
    return new Set([...speciesA].filter((s) => teamB.some((m) => m.parsed.species.toLowerCase() === s)));
  }, [teamA, teamB]);

  const weakA = useMemo(() => teamA ? getTeamWeaknesses(teamA) : null, [teamA]);
  const weakB = useMemo(() => teamB ? getTeamWeaknesses(teamB) : null, [teamB]);

  /** Resolve a paste input — if it's a PokePaste or share URL, fetch it; otherwise return as-is */
  async function resolvePaste(input: string): Promise<string> {
    const trimmed = input.trim();

    // PokePaste URL
    if (isPokePasteUrl(trimmed)) {
      const result = await fetchPokePaste(trimmed);
      return result.paste;
    }

    // Share URL (/s/ID)
    const shareId = extractShareId(trimmed);
    if (shareId) {
      const res = await fetch(`/api/share/${shareId}`);
      if (!res.ok) throw new Error("Failed to load shared report");
      const data = await res.json();
      if (!data.paste) throw new Error("Shared report has no team data");
      return data.paste;
    }

    return trimmed;
  }

  const handleCompare = async () => {
    setFetchError(null);
    const needsFetchA = isUrl(pasteA);
    const needsFetchB = isUrl(pasteB);

    if (!needsFetchA && !needsFetchB) {
      if (pasteA.trim() && pasteB.trim()) setCompared(true);
      return;
    }

    setFetching(true);
    try {
      const [resolvedA, resolvedB] = await Promise.all([
        resolvePaste(pasteA),
        resolvePaste(pasteB),
      ]);
      setPasteA(resolvedA);
      setPasteB(resolvedB);
      // Set compared in next tick so useMemo picks up the new paste values
      setTimeout(() => setCompared(true), 0);
    } catch (e) {
      setFetchError(e instanceof Error ? e.message : "Failed to fetch team data");
    } finally {
      setFetching(false);
    }
  };

  const handleReset = () => {
    setCompared(false);
    setFetchError(null);
    setPasteA("");
    setPasteB("");
    setSelectedIdA(null);
    setSelectedIdB(null);
  };

  return (
    <div className="min-h-screen bg-background text-text-primary">
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 pb-24 sm:pb-12">
        {/* Hero */}
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Compare <span className="text-accent">Teams</span>
          </h1>
          <p className="text-sm text-text-secondary mt-2">Paste two teams, PokePaste URLs, or share links to compare type coverage, speed tiers, and shared Pokemon.</p>
        </div>

        {!compared || !teamA || !teamB ? (
          /* Input mode */
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-blue-500 uppercase tracking-widest mb-2 block">Team A</label>
                {isSignedIn && (
                  <ReportDropdown
                    reports={reports}
                    loading={reportsLoading}
                    onSelect={(id) => handleSelectReport(id, setPasteA, setSelectedIdA)}
                    variant="blue"
                    disabledId={selectedIdB}
                  />
                )}
                <textarea
                  value={pasteA}
                  onChange={(e) => { setPasteA(e.target.value); setSelectedIdA(null); setCompared(false); }}
                  placeholder={"Incineroar @ Sitrus Berry\nAbility: Intimidate\nEVs: 252 HP / 4 Atk / 252 Spe\n- Fake Out\n...\n\nOr paste a URL:\nhttps://pokepast.es/abc123"}
                  className="w-full h-48 p-4 bg-surface border-2 border-border rounded-xl text-sm text-text-primary placeholder:text-text-tertiary/40 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 resize-y font-[family-name:var(--font-mono)]"
                  spellCheck={false}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-2 block">Team B</label>
                {isSignedIn && (
                  <ReportDropdown
                    reports={reports}
                    loading={reportsLoading}
                    onSelect={(id) => handleSelectReport(id, setPasteB, setSelectedIdB)}
                    variant="orange"
                    disabledId={selectedIdA}
                  />
                )}
                <textarea
                  value={pasteB}
                  onChange={(e) => { setPasteB(e.target.value); setSelectedIdB(null); setCompared(false); }}
                  placeholder={"Flutter Mane @ Choice Specs\nAbility: Protosynthesis\nEVs: 252 SpA / 252 Spe\n- Moonblast\n...\n\nOr paste a URL:\nhttps://pokepast.es/xyz789"}
                  className="w-full h-48 p-4 bg-surface border-2 border-border rounded-xl text-sm text-text-primary placeholder:text-text-tertiary/40 focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 resize-y font-[family-name:var(--font-mono)]"
                  spellCheck={false}
                />
              </div>
            </div>
            {fetchError && (
              <p className="text-sm text-red-500 font-semibold text-center">{fetchError}</p>
            )}
            <div className="flex justify-center">
              <button
                onClick={handleCompare}
                disabled={!pasteA.trim() || !pasteB.trim() || fetching}
                className="px-8 py-3 bg-accent text-white rounded-xl text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 shadow-md shadow-accent/30 transition-all cursor-pointer tracking-wide"
              >
                {fetching ? (
                  <span className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Fetching...
                  </span>
                ) : (
                  "Compare Teams"
                )}
              </button>
            </div>
            <p className="text-[10px] text-text-tertiary text-center">
              Supports Showdown pastes, pokepast.es URLs, and VGC Team Report share links (/s/...)
            </p>
          </div>
        ) : (
          /* Results */
          <div className="space-y-8 animate-fade-in">
            <div className="flex justify-end">
              <button
                onClick={handleReset}
                className="text-xs font-bold text-text-secondary hover:text-accent border border-border rounded-lg px-3 py-1.5 hover:border-accent/30 transition-all cursor-pointer"
              >
                New Comparison
              </button>
            </div>

            {/* Pokemon grids */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-xs font-bold text-blue-500 uppercase tracking-widest mb-3">Team A</h3>
                <PokemonRow pokemon={teamA} shared={sharedSpecies} />
              </div>
              <div>
                <h3 className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-3">Team B</h3>
                <PokemonRow pokemon={teamB} shared={sharedSpecies} />
              </div>
            </div>

            {/* Shared Pokemon */}
            {sharedSpecies.size > 0 && (
              <div className="bg-accent/5 border border-accent/20 rounded-xl p-4">
                <h3 className="text-xs font-bold text-accent uppercase tracking-widest mb-2">
                  Shared Pokemon ({sharedSpecies.size})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {[...sharedSpecies].map((s) => (
                    <span key={s} className="text-xs font-semibold text-accent bg-accent/10 px-2.5 py-1 rounded-lg capitalize">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Type coverage comparison */}
            <div>
              <h3 className="text-xs font-bold text-text-tertiary uppercase tracking-widest mb-4">Defensive Type Coverage</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {weakA && <TypeWeaknessGrid label="Team A" weakMap={weakA.weakMap} resistMap={weakA.resistMap} color="text-blue-500" />}
                {weakB && <TypeWeaknessGrid label="Team B" weakMap={weakB.weakMap} resistMap={weakB.resistMap} color="text-orange-500" />}
              </div>
            </div>

            {/* Speed tiers */}
            <div>
              <h3 className="text-xs font-bold text-text-tertiary uppercase tracking-widest mb-4">Speed Tiers</h3>
              <div className="bg-surface border border-border rounded-xl p-4 sm:p-6">
                <div className="flex items-center gap-4 mb-4">
                  <span className="flex items-center gap-1.5 text-[10px] font-bold">
                    <span className="w-3 h-3 rounded-sm bg-blue-500/70" /> Team A
                  </span>
                  <span className="flex items-center gap-1.5 text-[10px] font-bold">
                    <span className="w-3 h-3 rounded-sm bg-orange-500/70" /> Team B
                  </span>
                </div>
                <SpeedComparison teamA={teamA} teamB={teamB} />
              </div>
            </div>
          </div>
        )}
      </main>

      <PageFooter />
    </div>
  );
}
