"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import type { AnalyzedPokemon } from "@/lib/types/analysis";
import type { CalcCategory } from "@/hooks/useDamageCalcs";
import { getMoveTypeStyle } from "@/lib/utils/move-type-style";

// --------------------------------------------------------------------------
// Meta targets — common VGC Pokemon for quick selection
// --------------------------------------------------------------------------
const META_TARGETS = [
  "Incineroar",
  "Rillaboom",
  "Flutter Mane",
  "Urshifu",
  "Tornadus",
  "Amoonguss",
  "Landorus-Therian",
  "Calyrex-Shadow",
  "Ogerpon-Wellspring",
  "Iron Hands",
  "Kingambit",
  "Gholdengo",
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

/** Lazily import @smogon/calc to avoid SSR issues and keep the bundle lean */
async function getCalcLib() {
  const mod = await import("@smogon/calc");
  return mod;
}

/** Derive a KO-chance label from damage percentages */
function getKoLabel(minPct: number, maxPct: number): string {
  if (minPct >= 100) return "Guaranteed OHKO";
  if (maxPct >= 100) return `Possible OHKO`;
  if (minPct >= 50) return "2HKO range";
  if (maxPct >= 50) return "Possible 2HKO";
  if (minPct >= 33.4) return "3HKO range";
  if (maxPct >= 33.4) return "Possible 3HKO";
  return "Low damage";
}

/** Color for the damage bar based on percentage */
function getDamageColor(pct: number): string {
  if (pct >= 100) return "#dc2626"; // red — KO
  if (pct >= 75) return "#ea580c"; // orange
  if (pct >= 50) return "#d97706"; // amber
  if (pct >= 25) return "#16a34a"; // green
  return "#6b7280"; // gray — chip
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

  // Defender spread configuration
  const [defenderNature, setDefenderNature] = useState("Hardy");
  const [defenderEvs, setDefenderEvs] = useState<Record<string, number>>({ hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 });
  const [defenderItem, setDefenderItem] = useState("");
  const [spreadPreset, setSpreadPreset] = useState("default");

  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { parsed } = pokemon;
  const moves = parsed.moves ?? [];

  // Filter meta targets based on search, excluding self
  const filteredTargets = useMemo(() => {
    const selfLower = parsed.species.toLowerCase();
    const query = targetSearch.toLowerCase().trim();
    return META_TARGETS.filter((t) => {
      if (t.toLowerCase() === selfLower) return false;
      if (!query) return true;
      return t.toLowerCase().includes(query);
    });
  }, [targetSearch, parsed.species]);

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

  // Run calculation when move + target are set
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

        // Try to extract KO chance from desc, fall back to our own label
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
        // Clean up common smogon/calc errors
        if (msg.includes("not found")) {
          setError(`Pokemon or move not found in the calculator database. Check spelling.`);
        } else {
          setError(msg);
        }
      } finally {
        setIsCalculating(false);
      }
    },
    [parsed, defenderNature, defenderEvs, defenderItem]
  );

  // Selecting a move triggers calc if target is set
  const handleMoveSelect = useCallback(
    (moveName: string) => {
      setSelectedMove(moveName);
      setSaved(false);
      if (target) {
        runCalc(moveName, target);
      }
    },
    [target, runCalc]
  );

  // Selecting a target triggers calc if move is set
  const handleTargetSelect = useCallback(
    (targetName: string) => {
      setTarget(targetName);
      setTargetSearch(targetName);
      setShowDropdown(false);
      setSaved(false);
      if (selectedMove) {
        runCalc(selectedMove, targetName);
      }
    },
    [selectedMove, runCalc]
  );

  // Custom target via Enter key
  const handleTargetKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && targetSearch.trim()) {
        e.preventDefault();
        handleTargetSelect(targetSearch.trim());
      }
      if (e.key === "Escape") {
        setShowDropdown(false);
      }
    },
    [targetSearch, handleTargetSelect]
  );

  // Apply a spread preset and re-run the calc
  const handlePresetSelect = useCallback(
    (presetId: string) => {
      const preset = SPREAD_PRESETS.find((p) => p.id === presetId);
      if (!preset) return;
      setSpreadPreset(presetId);
      setDefenderNature(preset.nature);
      setDefenderEvs({ ...preset.evs });
      setSaved(false);
    },
    []
  );

  // Re-run calc when defender spread changes (if move + target already set)
  useEffect(() => {
    if (selectedMove && target) {
      runCalc(selectedMove, target);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defenderNature, defenderEvs, defenderItem]);

  // Save result as calc entry
  const handleSave = useCallback(() => {
    if (!result) return;
    onAddCalc(result.description, "offensive" as CalcCategory);
    setSaved(true);
    // Reset saved indicator after 2s
    setTimeout(() => setSaved(false), 2000);
  }, [result, onAddCalc]);

  // Collapsed state — toggle button
  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-surface-alt border border-border rounded-xl text-sm font-medium text-text-secondary hover:text-text-primary hover:border-accent/40 transition-colors"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="opacity-60"
        >
          <rect x="4" y="2" width="16" height="20" rx="2" />
          <line x1="8" y1="6" x2="16" y2="6" />
          <line x1="8" y1="10" x2="16" y2="10" />
          <line x1="8" y1="14" x2="12" y2="14" />
        </svg>
        Quick Calc
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="opacity-40"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
    );
  }

  const barMax = Math.max(result?.maxPercent ?? 0, 100);

  return (
    <div className="border border-border rounded-xl bg-surface overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-surface-alt border-b border-border">
        <span className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">
          Quick Calc
        </span>
        <button
          type="button"
          onClick={() => {
            setIsOpen(false);
            setResult(null);
            setError(null);
            setSelectedMove(null);
            setTarget("");
            setTargetSearch("");
          }}
          className="text-text-tertiary hover:text-text-secondary transition-colors p-0.5"
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
          <label className="text-[11px] font-medium text-text-tertiary uppercase tracking-wider mb-2 block">
            Move
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            {moves.map((move) => {
              const style = getMoveTypeStyle(move);
              const isActive = selectedMove === move;
              return (
                <button
                  key={move}
                  type="button"
                  onClick={() => handleMoveSelect(move)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all truncate ${
                    isActive
                      ? "ring-2 ring-accent/50 shadow-sm scale-[1.02]"
                      : "hover:scale-[1.01]"
                  }`}
                  style={
                    style
                      ? {
                          backgroundColor: isActive ? style.backgroundColor : `${String(style.backgroundColor).replace("1A", "0D")}`,
                          borderColor: isActive ? String(style.borderColor) : `${String(style.borderColor).replace("40", "20")}`,
                          color: String(style.color),
                        }
                      : {
                          backgroundColor: isActive ? "var(--surface-alt)" : "var(--surface)",
                          borderColor: isActive ? "var(--border)" : "var(--border-subtle)",
                          color: "var(--text-secondary)",
                        }
                  }
                  title={move}
                >
                  {move}
                </button>
              );
            })}
          </div>
        </div>

        {/* Target selector */}
        <div ref={dropdownRef}>
          <label className="text-[11px] font-medium text-text-tertiary uppercase tracking-wider mb-2 block">
            Target
          </label>
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={targetSearch}
              onChange={(e) => {
                setTargetSearch(e.target.value);
                setTarget("");
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              onKeyDown={handleTargetKeyDown}
              placeholder="Search or type a Pokemon..."
              className="w-full px-3 py-2.5 bg-surface border border-border rounded-xl text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-shadow"
              autoComplete="off"
            />
            {/* Dropdown */}
            {showDropdown && filteredTargets.length > 0 && (
              <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-surface border border-border rounded-xl shadow-lg max-h-48 overflow-y-auto scrollbar-none">
                {filteredTargets.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => handleTargetSelect(t)}
                    className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                      target === t
                        ? "bg-accent/10 text-accent font-medium"
                        : "text-text-primary hover:bg-surface-alt"
                    }`}
                  >
                    {t}
                  </button>
                ))}
                {targetSearch.trim() &&
                  !filteredTargets.some(
                    (t) => t.toLowerCase() === targetSearch.toLowerCase()
                  ) && (
                    <button
                      type="button"
                      onClick={() => handleTargetSelect(targetSearch.trim())}
                      className="w-full text-left px-3 py-2 text-sm text-accent hover:bg-surface-alt border-t border-border-subtle"
                    >
                      Use &ldquo;{targetSearch.trim()}&rdquo;
                    </button>
                  )}
              </div>
            )}
          </div>
        </div>

        {/* Target spread presets */}
        <div>
          <label className="text-[11px] font-medium text-text-tertiary uppercase tracking-wider mb-2 block">
            Target Spread
          </label>
          <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-1 -mx-1 px-1">
            {SPREAD_PRESETS.map((preset) => {
              const isActive = spreadPreset === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handlePresetSelect(preset.id)}
                  className={`shrink-0 px-2.5 py-1.5 rounded-full text-[11px] font-medium border transition-all whitespace-nowrap ${
                    isActive
                      ? "bg-accent/15 text-accent border-accent/40"
                      : "bg-surface-alt text-text-secondary border-border hover:border-accent/30"
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
          <input
            type="text"
            value={defenderItem}
            onChange={(e) => {
              setDefenderItem(e.target.value);
              setSaved(false);
            }}
            placeholder="Item (optional, e.g. Assault Vest)"
            className="w-full mt-2 px-3 py-2 bg-surface border border-border rounded-xl text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-shadow"
            autoComplete="off"
          />
        </div>

        {/* Loading state */}
        {isCalculating && (
          <div className="flex items-center justify-center py-4 text-text-tertiary text-sm gap-2">
            <div className="w-4 h-4 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
            Calculating...
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="px-3 py-2.5 bg-red-500/10 border border-red-400/20 rounded-xl text-xs text-red-500">
            {error}
          </div>
        )}

        {/* Result */}
        {result && !isCalculating && (
          <div className="flex flex-col gap-3 animate-fade-in">
            {/* Damage bar */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-baseline justify-between">
                <span className="text-lg font-bold text-text-primary tabular-nums">
                  {result.minPercent}% &ndash; {result.maxPercent}%
                </span>
                <span
                  className="text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: `${getDamageColor(result.maxPercent)}18`,
                    color: getDamageColor(result.maxPercent),
                  }}
                >
                  {result.koChance}
                </span>
              </div>

              {/* Visual bar */}
              <div className="relative h-3 bg-surface-alt rounded-full overflow-hidden border border-border-subtle">
                {/* Min range */}
                <div
                  className="absolute inset-y-0 left-0 rounded-full transition-all duration-500 ease-out"
                  style={{
                    width: `${Math.min((result.minPercent / barMax) * 100, 100)}%`,
                    backgroundColor: getDamageColor(result.maxPercent),
                    opacity: 0.7,
                  }}
                />
                {/* Max range (lighter overlay) */}
                <div
                  className="absolute inset-y-0 left-0 rounded-full transition-all duration-500 ease-out"
                  style={{
                    width: `${Math.min((result.maxPercent / barMax) * 100, 100)}%`,
                    backgroundColor: getDamageColor(result.maxPercent),
                    opacity: 0.3,
                  }}
                />
                {/* 100% KO line */}
                {barMax > 100 && (
                  <div
                    className="absolute inset-y-0 w-px bg-text-tertiary/50"
                    style={{ left: `${(100 / barMax) * 100}%` }}
                    title="KO threshold"
                  />
                )}
              </div>

              {/* Raw damage numbers */}
              <div className="flex items-center justify-between text-[11px] text-text-tertiary">
                <span>
                  {result.minDmg}&ndash;{result.maxDmg} HP
                </span>
                <span>/ {result.defenderHp} HP</span>
              </div>
            </div>

            {/* Full description */}
            <p className="text-xs text-text-secondary leading-relaxed font-mono bg-surface-alt px-3 py-2 rounded-lg border border-border-subtle break-words">
              {result.description}
            </p>

            {/* Save button */}
            <button
              type="button"
              onClick={handleSave}
              disabled={saved}
              className={`self-end flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                saved
                  ? "bg-emerald-500/15 text-emerald-600 border border-emerald-400/30 cursor-default"
                  : "bg-accent text-white hover:bg-accent/90 active:scale-[0.98]"
              }`}
            >
              {saved ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Added
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Add to calcs
                </>
              )}
            </button>
          </div>
        )}

        {/* Hint when neither move nor target selected */}
        {!selectedMove && !target && !result && !error && !isCalculating && (
          <p className="text-xs text-text-tertiary text-center py-2">
            Select a move and a target to calculate damage.
          </p>
        )}
      </div>
    </div>
  );
}
