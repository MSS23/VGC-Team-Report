"use client";

import { useState, useMemo } from "react";
import { parseShowdownPaste } from "@/lib/parser/showdown-parser";
import { lookupPokemon } from "@/lib/data/pokemon";
import { calculateAllStats } from "@/lib/analysis/stat-calculator";
import { getItemStatBoost } from "@/lib/analysis/item-boosts";
import { getDefensiveProfile } from "@/lib/data/type-chart";
import { PokemonSprite } from "@/components/report/PokemonSprite";
import { TypeBadge } from "@/components/report/TypeBadge";
import { useDarkMode } from "@/hooks/useDarkMode";
import { PageNavbar } from "@/components/layout/PageNavbar";
import { isPokePasteUrl, fetchPokePaste } from "@/lib/utils/pokepaste";
import type { AnalyzedPokemon } from "@/lib/types/analysis";
import type { PokemonType } from "@/lib/types/pokemon";

const ALL_TYPES: PokemonType[] = [
  "Normal", "Fire", "Water", "Electric", "Grass", "Ice",
  "Fighting", "Poison", "Ground", "Flying", "Psychic", "Bug",
  "Rock", "Ghost", "Dragon", "Dark", "Steel", "Fairy",
];

function analyzePaste(paste: string): AnalyzedPokemon[] | null {
  if (!paste.trim()) return null;
  const parsed = parseShowdownPaste(paste);
  if (parsed.pokemon.length === 0) return null;
  return parsed.pokemon.map((p) => {
    const data = lookupPokemon(p.species);
    const calculatedStats = data
      ? calculateAllStats(data.baseStats, p.ivs, p.evs, p.level, p.nature)
      : { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };
    const itemBoost = getItemStatBoost(p.item, p.ability, calculatedStats);
    return { parsed: p, data, calculatedStats, itemBoost };
  });
}

function getTeamWeaknesses(pokemon: AnalyzedPokemon[]) {
  const weakMap: Record<string, number> = {};
  const resistMap: Record<string, number> = {};
  for (const mon of pokemon) {
    const types = mon.data?.types ?? [];
    if (types.length === 0) continue;
    const profile = getDefensiveProfile(types as PokemonType[]);
    for (const [t, mult] of Object.entries(profile)) {
      if (mult >= 2) weakMap[t] = (weakMap[t] ?? 0) + 1;
      if (mult <= 0.5) resistMap[t] = (resistMap[t] ?? 0) + 1;
    }
  }
  return { weakMap, resistMap };
}

function PokemonRow({ pokemon, shared }: { pokemon: AnalyzedPokemon[]; shared: Set<string> }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {pokemon.map((mon, i) => {
        const isShared = shared.has(mon.parsed.species.toLowerCase());
        return (
          <div key={i} className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 ${isShared ? "border-accent bg-accent/5" : "border-border bg-surface"}`}>
            <PokemonSprite species={mon.parsed.species} size={48} shiny={mon.parsed.shiny} />
            <span className="text-[10px] font-bold text-text-primary text-center leading-tight max-w-[60px] truncate">{mon.parsed.species}</span>
            <div className="flex gap-0.5">
              {(mon.data?.types ?? []).map((t) => (
                <TypeBadge key={t} type={t} />
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

function SpeedComparison({ teamA, teamB }: { teamA: AnalyzedPokemon[]; teamB: AnalyzedPokemon[] }) {
  const allSpeeds = [
    ...teamA.map((m) => ({
      species: m.parsed.species,
      speed: m.itemBoost?.stat === "spe" ? m.itemBoost.boostedValue : m.calculatedStats.spe,
      team: "A" as const,
    })),
    ...teamB.map((m) => ({
      species: m.parsed.species,
      speed: m.itemBoost?.stat === "spe" ? m.itemBoost.boostedValue : m.calculatedStats.spe,
      team: "B" as const,
    })),
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
  const { darkMode, setDarkMode } = useDarkMode();
  const [pasteA, setPasteA] = useState("");
  const [pasteB, setPasteB] = useState("");
  const [compared, setCompared] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const teamA = useMemo(() => compared ? analyzePaste(pasteA) : null, [pasteA, compared]);
  const teamB = useMemo(() => compared ? analyzePaste(pasteB) : null, [pasteB, compared]);

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
  };

  return (
    <div className="min-h-screen bg-background text-text-primary">
      <PageNavbar darkMode={darkMode} onToggleDarkMode={() => setDarkMode(!darkMode)} maxWidth="max-w-7xl" activePage="compare" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 pb-24 sm:pb-12">
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
                <textarea
                  value={pasteA}
                  onChange={(e) => { setPasteA(e.target.value); setCompared(false); }}
                  placeholder={"Incineroar @ Sitrus Berry\nAbility: Intimidate\nEVs: 252 HP / 4 Atk / 252 Spe\n- Fake Out\n...\n\nOr paste a URL:\nhttps://pokepast.es/abc123"}
                  className="w-full h-48 p-4 bg-surface border-2 border-border rounded-xl text-sm text-text-primary placeholder:text-text-tertiary/40 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 resize-y font-[family-name:var(--font-mono)]"
                  spellCheck={false}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-2 block">Team B</label>
                <textarea
                  value={pasteB}
                  onChange={(e) => { setPasteB(e.target.value); setCompared(false); }}
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

      <footer className="border-t border-border py-8">
        <p className="text-center text-xs text-text-tertiary font-medium">
          <a href="/" className="text-text-tertiary hover:text-text-primary transition-colors">Build Your Own Report</a>
          <span className="mx-1.5 text-border">&middot;</span>
          <a href="/explore" className="text-text-tertiary hover:text-text-primary transition-colors">Explore</a>
        </p>
      </footer>
    </div>
  );
}
