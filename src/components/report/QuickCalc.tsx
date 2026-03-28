"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import type { AnalyzedPokemon } from "@/lib/types/analysis";
import type { CalcCategory } from "@/hooks/useDamageCalcs";
import { getMoveTypeStyle } from "@/lib/utils/move-type-style";

// --------------------------------------------------------------------------
// Natures
// --------------------------------------------------------------------------
const NATURES = [
  "Hardy", "Lonely", "Brave", "Adamant", "Naughty",
  "Bold", "Docile", "Relaxed", "Impish", "Lax",
  "Timid", "Hasty", "Serious", "Jolly", "Naive",
  "Modest", "Mild", "Quiet", "Bashful", "Rash",
  "Calm", "Gentle", "Sassy", "Careful", "Quirky",
] as const;

// --------------------------------------------------------------------------
// Defender spread presets
// --------------------------------------------------------------------------
const SPREAD_PRESETS = [
  { id: "default", label: "Default", evs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 }, nature: "Hardy" },
  { id: "phys-bulk", label: "252 HP / 252+ Def", evs: { hp: 252, atk: 0, def: 252, spa: 0, spd: 4, spe: 0 }, nature: "Bold" },
  { id: "spec-bulk", label: "252 HP / 252+ SpD", evs: { hp: 252, atk: 0, def: 4, spa: 0, spd: 252, spe: 0 }, nature: "Calm" },
  { id: "phys-offense", label: "252 Atk / 252 Spe", evs: { hp: 4, atk: 252, def: 0, spa: 0, spd: 0, spe: 252 }, nature: "Adamant" },
  { id: "spec-offense", label: "252 SpA / 252 Spe", evs: { hp: 4, atk: 0, def: 0, spa: 252, spd: 0, spe: 252 }, nature: "Modest" },
  { id: "standard-bulk", label: "252 HP / 4 Def", evs: { hp: 252, atk: 0, def: 4, spa: 0, spd: 0, spe: 0 }, nature: "Hardy" },
] as const;

const STAT_KEYS = ["hp", "atk", "def", "spa", "spd", "spe"] as const;
const STAT_LABELS: Record<string, string> = { hp: "HP", atk: "Atk", def: "Def", spa: "SpA", spd: "SpD", spe: "Spe" };

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------
interface QuickCalcProps {
  pokemon: AnalyzedPokemon;
  onAddCalc: (text: string, category: "offensive" | "defensive" | "speed") => void;
}

interface CalcResult {
  description: string;
  minPercent: number;
  maxPercent: number;
  minDmg: number;
  maxDmg: number;
  defenderHp: number;
  koChance: string;
}

// --------------------------------------------------------------------------
// Helpers
// --------------------------------------------------------------------------

/** Lazily import @smogon/calc and cache the species list */
let cachedSpecies: string[] | null = null;
let calcLibPromise: Promise<typeof import("@smogon/calc")> | null = null;

function getCalcLib() {
  if (!calcLibPromise) {
    calcLibPromise = import("@smogon/calc");
  }
  return calcLibPromise;
}

async function getAllSpecies(): Promise<string[]> {
  if (cachedSpecies) return cachedSpecies;
  const mod = await getCalcLib();
  const gen = mod.Generations.get(9);
  const list: string[] = [];
  for (const species of gen.species) {
    if (species.name) list.push(species.name);
  }
  list.sort((a, b) => a.localeCompare(b));
  cachedSpecies = list;
  return list;
}

function getKoLabel(minPct: number, maxPct: number): string {
  if (minPct >= 100) return "Guaranteed OHKO";
  if (maxPct >= 100) return "Possible OHKO";
  if (minPct >= 50) return "2HKO range";
  if (maxPct >= 50) return "Possible 2HKO";
  if (minPct >= 33.4) return "3HKO range";
  if (maxPct >= 33.4) return "Possible 3HKO";
  return "Low damage";
}

function getDamageColor(pct: number): string {
  if (pct >= 100) return "#dc2626";
  if (pct >= 75) return "#ea580c";
  if (pct >= 50) return "#d97706";
  if (pct >= 25) return "#16a34a";
  return "#6b7280";
}

// --------------------------------------------------------------------------
// Component
// --------------------------------------------------------------------------
export function QuickCalc({ pokemon, onAddCalc }: QuickCalcProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedMove, setSelectedMove] = useState<string | null>(null);
  const [target, setTarget] = useState("");
  const [targetSearch, setTargetSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [result, setResult] = useState<CalcResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showCustomSpread, setShowCustomSpread] = useState(false);

  // Defender config
  const [defenderNature, setDefenderNature] = useState("Hardy");
  const [defenderEvs, setDefenderEvs] = useState<Record<string, number>>({ hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 });
  const [defenderItem, setDefenderItem] = useState("");
  const [spreadPreset, setSpreadPreset] = useState("default");

  // Full species list (loaded lazily)
  const [allSpecies, setAllSpecies] = useState<string[]>([]);
  useEffect(() => {
    if (isOpen && allSpecies.length === 0) {
      getAllSpecies().then(setAllSpecies).catch(() => {});
    }
  }, [isOpen, allSpecies.length]);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { parsed } = pokemon;
  const moves = parsed.moves ?? [];

  // Filter species based on search
  const filteredTargets = useMemo(() => {
    const selfLower = parsed.species.toLowerCase();
    const query = targetSearch.toLowerCase().trim();
    if (!query) return allSpecies.filter((s) => s.toLowerCase() !== selfLower).slice(0, 20);
    return allSpecies
      .filter((s) => {
        if (s.toLowerCase() === selfLower) return false;
        return s.toLowerCase().includes(query);
      })
      .slice(0, 30);
  }, [targetSearch, parsed.species, allSpecies]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Run calculation
  const runCalc = useCallback(
    async (moveName: string, targetName: string) => {
      if (!moveName || !targetName) return;
      setIsCalculating(true);
      setError(null);
      setResult(null);
      setSaved(false);

      try {
        const { calculate, Pokemon, Move, Generations } = await getCalcLib();
        const gen = Generations.get(9);

        const attacker = new Pokemon(gen, parsed.species, {
          level: parsed.level || 50,
          item: parsed.item ?? undefined,
          ability: parsed.ability ?? undefined,
          nature: parsed.nature || "Hardy",
          evs: parsed.evs,
          ivs: parsed.ivs,
        });

        const defender = new Pokemon(gen, targetName, {
          level: 50,
          nature: defenderNature || "Hardy",
          evs: defenderEvs,
          ...(defenderItem ? { item: defenderItem } : {}),
        });
        const move = new Move(gen, moveName);
        const calcResult = calculate(gen, attacker, defender, move);

        const range = calcResult.range();
        const defHp = defender.maxHP();
        const minPct = (range[0] / defHp) * 100;
        const maxPct = (range[1] / defHp) * 100;

        const fullDesc = calcResult.desc();
        const koMatch = fullDesc.match(/--\s*(.+)$/);
        const koChance = koMatch ? koMatch[1].trim() : getKoLabel(minPct, maxPct);

        setResult({
          description: fullDesc,
          minPercent: Math.round(minPct * 10) / 10,
          maxPercent: Math.round(maxPct * 10) / 10,
          minDmg: range[0],
          maxDmg: range[1],
          defenderHp: defHp,
          koChance,
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Calculation failed";
        if (msg.includes("not found")) {
          setError("Pokemon or move not found. Check spelling.");
        } else {
          setError(msg);
        }
      } finally {
        setIsCalculating(false);
      }
    },
    [parsed, defenderNature, defenderEvs, defenderItem]
  );

  const handleMoveSelect = useCallback(
    (moveName: string) => {
      setSelectedMove(moveName);
      setSaved(false);
      if (target) runCalc(moveName, target);
    },
    [target, runCalc]
  );

  const handleTargetSelect = useCallback(
    (targetName: string) => {
      setTarget(targetName);
      setTargetSearch(targetName);
      setShowDropdown(false);
      setSaved(false);
      if (selectedMove) runCalc(selectedMove, targetName);
    },
    [selectedMove, runCalc]
  );

  const handleTargetKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && targetSearch.trim()) {
        e.preventDefault();
        handleTargetSelect(targetSearch.trim());
      }
      if (e.key === "Escape") setShowDropdown(false);
    },
    [targetSearch, handleTargetSelect]
  );

  const handlePresetSelect = useCallback((presetId: string) => {
    const preset = SPREAD_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setSpreadPreset(presetId);
    setDefenderNature(preset.nature);
    setDefenderEvs({ ...preset.evs });
    setShowCustomSpread(false);
    setSaved(false);
  }, []);

  const handleEvChange = useCallback((stat: string, value: number) => {
    setDefenderEvs((prev) => ({ ...prev, [stat]: Math.max(0, Math.min(252, value)) }));
    setSpreadPreset("custom");
    setSaved(false);
  }, []);

  const handleNatureChange = useCallback((nature: string) => {
    setDefenderNature(nature);
    setSpreadPreset("custom");
    setSaved(false);
  }, []);

  // Re-run calc when defender spread changes
  useEffect(() => {
    if (selectedMove && target) runCalc(selectedMove, target);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defenderNature, defenderEvs, defenderItem]);

  const handleSave = useCallback(() => {
    if (!result) return;
    onAddCalc(result.description, "offensive" as CalcCategory);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [result, onAddCalc]);

  const evTotal = Object.values(defenderEvs).reduce((a, b) => a + b, 0);

  // Collapsed
  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-surface-alt border border-border rounded-xl text-sm font-medium text-text-secondary hover:text-text-primary hover:border-accent/40 transition-colors cursor-pointer"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-60">
          <rect x="4" y="2" width="16" height="20" rx="2" /><line x1="8" y1="6" x2="16" y2="6" /><line x1="8" y1="10" x2="16" y2="10" /><line x1="8" y1="14" x2="12" y2="14" />
        </svg>
        Quick Calc
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-40">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
    );
  }

  const barMax = Math.max(result?.maxPercent ?? 0, 100);

  return (
    <div className="border border-border rounded-xl bg-surface animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-surface-alt border-b border-border rounded-t-xl">
        <span className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">Quick Calc</span>
        <button
          type="button"
          onClick={() => { setIsOpen(false); setResult(null); setError(null); setSelectedMove(null); setTarget(""); setTargetSearch(""); }}
          className="text-text-tertiary hover:text-text-secondary transition-colors p-0.5 cursor-pointer"
          aria-label="Close quick calc"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="18 15 12 9 6 15" />
          </svg>
        </button>
      </div>

      <div className="p-4 flex flex-col gap-4">
        {/* Move selector */}
        <div>
          <label className="text-[11px] font-medium text-text-tertiary uppercase tracking-wider mb-2 block">Move</label>
          <div className="grid grid-cols-2 gap-1.5">
            {moves.map((move) => {
              const style = getMoveTypeStyle(move);
              const isActive = selectedMove === move;
              return (
                <button
                  key={move}
                  type="button"
                  onClick={() => handleMoveSelect(move)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all truncate cursor-pointer ${isActive ? "ring-2 ring-accent/50 shadow-sm scale-[1.02]" : "hover:scale-[1.01]"}`}
                  style={style ? {
                    backgroundColor: isActive ? style.backgroundColor : `${String(style.backgroundColor).replace("1A", "0D")}`,
                    borderColor: isActive ? String(style.borderColor) : `${String(style.borderColor).replace("40", "20")}`,
                    color: String(style.color),
                  } : {
                    backgroundColor: isActive ? "var(--surface-alt)" : "var(--surface)",
                    borderColor: isActive ? "var(--border)" : "var(--border-subtle)",
                    color: "var(--text-secondary)",
                  }}
                  title={move}
                >
                  {move}
                </button>
              );
            })}
          </div>
        </div>

        {/* Target selector — full dex search */}
        <div ref={dropdownRef}>
          <label className="text-[11px] font-medium text-text-tertiary uppercase tracking-wider mb-2 block">Target</label>
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={targetSearch}
              onChange={(e) => { setTargetSearch(e.target.value); setTarget(""); setShowDropdown(true); }}
              onFocus={() => setShowDropdown(true)}
              onKeyDown={handleTargetKeyDown}
              placeholder={allSpecies.length > 0 ? "Search any Pokemon..." : "Loading Pokemon list..."}
              className="w-full px-3 py-2.5 bg-surface border border-border rounded-xl text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-shadow"
              autoComplete="off"
            />
            {showDropdown && filteredTargets.length > 0 && (
              <div className="absolute z-30 top-full left-0 right-0 mt-1 bg-surface border border-border rounded-xl shadow-2xl max-h-56 overflow-y-auto scrollbar-none">
                {filteredTargets.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => handleTargetSelect(t)}
                    className={`w-full text-left px-3 py-2 text-sm transition-colors cursor-pointer ${target === t ? "bg-accent/10 text-accent font-medium" : "text-text-primary hover:bg-surface-alt"}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Target spread: presets + custom */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-[11px] font-medium text-text-tertiary uppercase tracking-wider">Target Spread</label>
            <button
              type="button"
              onClick={() => setShowCustomSpread(!showCustomSpread)}
              className="text-[10px] font-bold text-accent hover:underline cursor-pointer"
            >
              {showCustomSpread ? "Hide" : "Custom"}
            </button>
          </div>

          {/* Preset pills */}
          <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-1 -mx-1 px-1">
            {SPREAD_PRESETS.map((preset) => {
              const isActive = spreadPreset === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handlePresetSelect(preset.id)}
                  className={`shrink-0 px-2.5 py-1.5 rounded-full text-[11px] font-medium border transition-all whitespace-nowrap cursor-pointer ${isActive ? "bg-accent/15 text-accent border-accent/40" : "bg-surface-alt text-text-secondary border-border hover:border-accent/30"}`}
                >
                  {preset.label}
                </button>
              );
            })}
            {spreadPreset === "custom" && (
              <span className="shrink-0 px-2.5 py-1.5 rounded-full text-[11px] font-medium bg-accent/15 text-accent border border-accent/40">
                Custom
              </span>
            )}
          </div>

          {/* Custom spread editor */}
          {showCustomSpread && (
            <div className="mt-3 p-3 bg-surface-alt rounded-xl border border-border space-y-3 animate-fade-in">
              {/* Nature dropdown */}
              <div className="flex items-center gap-2">
                <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider w-12 shrink-0">Nature</label>
                <select
                  value={defenderNature}
                  onChange={(e) => handleNatureChange(e.target.value)}
                  className="flex-1 px-2 py-1.5 bg-surface border border-border rounded-lg text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/40 cursor-pointer"
                >
                  {NATURES.map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>

              {/* EV inputs */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">EVs</label>
                  <span className={`text-[10px] font-bold tabular-nums ${evTotal > 510 ? "text-red-500" : "text-text-tertiary"}`}>
                    {evTotal} / 510
                  </span>
                </div>
                <div className="grid grid-cols-6 gap-1">
                  {STAT_KEYS.map((stat) => (
                    <div key={stat} className="flex flex-col items-center gap-0.5">
                      <label className="text-[9px] font-bold text-text-tertiary uppercase">{STAT_LABELS[stat]}</label>
                      <input
                        type="number"
                        min={0}
                        max={252}
                        step={4}
                        value={defenderEvs[stat] ?? 0}
                        onChange={(e) => handleEvChange(stat, parseInt(e.target.value) || 0)}
                        className="w-full px-1 py-1 bg-surface border border-border rounded-md text-xs text-center text-text-primary focus:outline-none focus:ring-1 focus:ring-accent/40 tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Item input */}
          <input
            type="text"
            value={defenderItem}
            onChange={(e) => { setDefenderItem(e.target.value); setSaved(false); }}
            placeholder="Item (optional, e.g. Assault Vest)"
            className="w-full mt-2 px-3 py-2 bg-surface border border-border rounded-xl text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-shadow"
            autoComplete="off"
          />
        </div>

        {/* Loading */}
        {isCalculating && (
          <div className="flex items-center justify-center py-4 text-text-tertiary text-sm gap-2">
            <div className="w-4 h-4 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
            Calculating...
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="px-3 py-2.5 bg-red-500/10 border border-red-400/20 rounded-xl text-xs text-red-500">
            {error}
          </div>
        )}

        {/* Result */}
        {result && !isCalculating && (
          <div className="flex flex-col gap-3 animate-fade-in">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-baseline justify-between">
                <span className="text-lg font-bold text-text-primary tabular-nums">
                  {result.minPercent}% &ndash; {result.maxPercent}%
                </span>
                <span
                  className="text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: `${getDamageColor(result.maxPercent)}18`, color: getDamageColor(result.maxPercent) }}
                >
                  {result.koChance}
                </span>
              </div>

              <div className="relative h-3 bg-surface-alt rounded-full overflow-hidden border border-border-subtle">
                <div className="absolute inset-y-0 left-0 rounded-full transition-all duration-500 ease-out" style={{ width: `${Math.min((result.minPercent / barMax) * 100, 100)}%`, backgroundColor: getDamageColor(result.maxPercent), opacity: 0.7 }} />
                <div className="absolute inset-y-0 left-0 rounded-full transition-all duration-500 ease-out" style={{ width: `${Math.min((result.maxPercent / barMax) * 100, 100)}%`, backgroundColor: getDamageColor(result.maxPercent), opacity: 0.3 }} />
                {barMax > 100 && <div className="absolute inset-y-0 w-px bg-text-tertiary/50" style={{ left: `${(100 / barMax) * 100}%` }} title="KO threshold" />}
              </div>

              <div className="flex items-center justify-between text-[11px] text-text-tertiary">
                <span>{result.minDmg}&ndash;{result.maxDmg} HP</span>
                <span>/ {result.defenderHp} HP</span>
              </div>
            </div>

            <p className="text-xs text-text-secondary leading-relaxed font-mono bg-surface-alt px-3 py-2 rounded-lg border border-border-subtle break-words">
              {result.description}
            </p>

            <button
              type="button"
              onClick={handleSave}
              disabled={saved}
              className={`self-end flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${saved ? "bg-emerald-500/15 text-emerald-600 border border-emerald-400/30 cursor-default" : "bg-accent text-white hover:bg-accent/90 active:scale-[0.98]"}`}
            >
              {saved ? (
                <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>Added</>
              ) : (
                <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>Add to calcs</>
              )}
            </button>
          </div>
        )}

        {!selectedMove && !target && !result && !error && !isCalculating && (
          <p className="text-xs text-text-tertiary text-center py-2">
            Select a move and a target to calculate damage.
          </p>
        )}
      </div>
    </div>
  );
}
