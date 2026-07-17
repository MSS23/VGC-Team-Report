"use client";

import { useState } from "react";
import type { AnalyzedPokemon } from "@/lib/types/analysis";
import type { PokemonType } from "@/lib/types/pokemon";
import { getEffectiveness } from "@/lib/data/type-chart";
import { lookupMove } from "@/lib/data/moves";
import { TYPE_COLORS } from "@/lib/utils/type-colors";
import { hapticLight } from "@/lib/utils/haptics";
import { useTranslation } from "@/lib/i18n";
import { translateMove } from "@/lib/utils/translate-move";

const ALL_TYPES: PokemonType[] = [
  "Normal", "Fire", "Water", "Electric", "Grass", "Ice",
  "Fighting", "Poison", "Ground", "Flying", "Psychic", "Bug",
  "Rock", "Ghost", "Dragon", "Dark", "Steel", "Fairy",
];

/** Abilities that change Normal-type moves to another type (-ate family). */
const ATE_ABILITIES: Record<string, PokemonType> = {
  "pixilate": "Fairy",
  "aerilate": "Flying",
  "refrigerate": "Ice",
  "galvanize": "Electric",
};

/** Liquid Voice: sound-based moves become Water-type. */
const SOUND_MOVE_SLUGS = new Set([
  "hyper-voice", "boomburst", "disarming-voice", "sparkling-aria",
  "overdrive", "round", "bug-buzz", "clangorous-soul", "echoed-voice", "uproar",
  "noble-roar", "snore", "chatter",
]);

interface OffensiveCoverageChartProps {
  pokemon: AnalyzedPokemon[];
}

interface MoveCoverageResult {
  mult: number;
  move: string | null;
  /** Non-null when an ability changed the effective move type; e.g. "Normal→Fairy via Pixilate" */
  typeConversion: string | null;
}

/**
 * Apply type-changing abilities to a single damaging move.
 * Returns the effective type and a description of the conversion (if any).
 */
function applyTypeChangingAbility(
  moveSlug: string,
  printedType: PokemonType,
  abilityKey: string,
): { effectiveType: PokemonType; conversion: string | null } {
  // Normalize ability: ability
  if (abilityKey === "normalize" && printedType !== "Normal") {
    return { effectiveType: "Normal", conversion: `${printedType}→Normal via Normalize` };
  }
  if (abilityKey === "liquid-voice" && SOUND_MOVE_SLUGS.has(moveSlug)) {
    return { effectiveType: "Water", conversion: `${printedType}→Water via Liquid Voice` };
  }
  const ateTarget = ATE_ABILITIES[abilityKey];
  if (ateTarget && printedType === "Normal") {
    const abilityName = abilityKey.charAt(0).toUpperCase() + abilityKey.slice(1);
    return { effectiveType: ateTarget, conversion: `Normal→${ateTarget} via ${abilityName}` };
  }
  return { effectiveType: printedType, conversion: null };
}

/** For a single Pokemon, get its best offensive multiplier against each defender type. */
function getOffensiveProfile(mon: AnalyzedPokemon): Record<PokemonType, MoveCoverageResult> {
  const profile = {} as Record<PokemonType, MoveCoverageResult>;
  const abilityKey = (mon.parsed.ability ?? "").toLowerCase().replace(/[\s-]+/g, "-");

  // Get the Pokemon's damaging moves with effective types applied
  const moveTypes: { effectiveType: PokemonType; name: string; slug: string; conversion: string | null }[] = [];
  for (const moveName of mon.parsed.moves) {
    const slug = moveName.toLowerCase().replace(/\s+/g, "-");
    const moveData = lookupMove(moveName);
    if (moveData && moveData.category !== "Status" && moveData.power && moveData.power > 0) {
      const { effectiveType, conversion } = applyTypeChangingAbility(slug, moveData.type, abilityKey);
      moveTypes.push({ effectiveType, name: moveData.name, slug, conversion });
    }
  }

  // Also include STAB types (in case a move isn't in the DB but the Pokemon has STAB)
  const pokemonTypes = mon.data?.types ?? [];

  for (const defType of ALL_TYPES) {
    let bestMult = 0;
    let bestMove: string | null = null;
    let bestConversion: string | null = null;

    for (const { effectiveType, name, conversion } of moveTypes) {
      const mult = getEffectiveness(effectiveType, [defType]);
      if (mult > bestMult) {
        bestMult = mult;
        bestMove = name;
        bestConversion = conversion;
      }
    }

    // If no damaging moves found, check STAB types at least
    if (moveTypes.length === 0) {
      for (const stabType of pokemonTypes) {
        const mult = getEffectiveness(stabType, [defType]);
        if (mult > bestMult) {
          bestMult = mult;
          bestMove = null;
          bestConversion = null;
        }
      }
    }

    profile[defType] = { mult: bestMult, move: bestMove, typeConversion: bestConversion };
  }

  return profile;
}

function offensiveCell(mult: number): { bg: string; text: string; ring?: string; style?: React.CSSProperties } {
  // Use inline styles for dual-mode readability since dark mode uses [data-dark-mode] not Tailwind dark:
  if (mult === 0) return { bg: "", text: "", style: { backgroundColor: "var(--cell-immune)", color: "var(--cell-immune-text)" } };
  if (mult < 1) return { bg: "", text: "", style: { backgroundColor: "var(--cell-nve)", color: "var(--cell-nve-text)" } };
  if (mult === 1) return { bg: "", text: "text-text-tertiary", style: { opacity: 0.45 } };
  if (mult === 2) return { bg: "", text: "", style: { backgroundColor: "var(--cell-se)", color: "var(--cell-se-text)" } };
  if (mult >= 4) return { bg: "", text: "", ring: "ring-2 ring-cyan-400/80", style: { backgroundColor: "var(--cell-dse)", color: "var(--cell-dse-text)" } };
  return { bg: "", text: "" };
}

function offensiveLabel(mult: number): string {
  if (mult === 0) return "0";
  if (mult === 0.5) return "\u00BDx";
  if (mult === 1) return "\u2022";
  if (mult === 2) return "2\u00D7";
  if (mult === 4) return "4\u00D7";
  return `${mult}x`;
}

export function OffensiveCoverageChart({ pokemon }: OffensiveCoverageChartProps) {
  const { language } = useTranslation();
  const [highlightedType, setHighlightedType] = useState<PokemonType | null>(null);

  const profiles = pokemon.map((mon) => ({
    species: mon.parsed.species,
    profile: getOffensiveProfile(mon),
    hasTypeChangingAbility: !!(mon.parsed.ability && (
      ATE_ABILITIES[(mon.parsed.ability.toLowerCase().replace(/[\s-]+/g, "-"))] ||
      mon.parsed.ability.toLowerCase() === "normalize" ||
      mon.parsed.ability.toLowerCase() === "liquid voice"
    )),
  }));

  // Team-wide coverage summary: how many Pokemon hit each type SE
  const teamSummary = ALL_TYPES.map((defType) => {
    let seCount = 0; // super-effective coverage count
    for (const p of profiles) {
      if (p.profile[defType].mult >= 2) seCount++;
    }
    return { type: defType, seCount };
  });

  const gaps = teamSummary.filter((s) => s.seCount === 0);
  const strong = teamSummary.filter((s) => s.seCount >= 4);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-widest text-text-tertiary mb-1">
          Offensive Profile
        </h3>
        <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
          Best coverage each Pok&eacute;mon has against every type based on their moves.
          <span className="inline-flex items-center mx-1 px-1.5 py-0.5 rounded-md text-[10px] font-extrabold" style={{ backgroundColor: "var(--cell-se)", color: "var(--cell-se-text)" }}>2&times;</span>
          = super effective,
          <span className="inline-flex items-center mx-1 px-1.5 py-0.5 rounded-md text-[10px] font-black ring-2 ring-cyan-400/80" style={{ backgroundColor: "var(--cell-dse)", color: "var(--cell-dse-text)" }}>4&times;</span>
          = double SE.
        </p>
      </div>

      {/* Callout badges */}
      {(gaps.length > 0 || strong.length > 0) && (
        <div className="flex flex-wrap gap-2">
          {gaps.map(({ type }) => {
            const tc = TYPE_COLORS[type];
            return (
              <span
                key={`gap-${type}`}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-red-500/10 border border-red-500/25 text-xs font-bold text-red-400"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
                  <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
                </svg>
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: tc.bg }} />
                {type}
                <span className="text-red-400/70">&mdash; no SE coverage</span>
              </span>
            );
          })}
          {strong.map(({ type, seCount }) => {
            const tc = TYPE_COLORS[type];
            return (
              <span
                key={`strong-${type}`}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-xs font-bold text-emerald-400"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: tc.bg }} />
                {type}
                <span className="text-emerald-400/70">&mdash; {seCount} hit SE</span>
              </span>
            );
          })}
        </div>
      )}

      {/* Heatmap grid */}
      <div className="overflow-x-auto -mx-2 px-2 scrollbar-none" style={{ touchAction: "pan-x" }}>
        <table className="w-full table-fixed sm:table-auto border-collapse text-center min-w-0 sm:min-w-[40rem]">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-background px-1.5 sm:px-2 py-2 text-left text-[9px] sm:text-xs font-bold text-text-tertiary uppercase tracking-wider w-14 sm:w-32">
                Pok&eacute;mon
              </th>
              {ALL_TYPES.map((type) => {
                const tc = TYPE_COLORS[type];
                return (
                  <th
                    key={type}
                    className="px-0.5 py-2 cursor-pointer select-none"
                    onClick={() => {
                      hapticLight();
                      setHighlightedType((prev) => (prev === type ? null : type));
                    }}
                  >
                    <span
                      className={`inline-block w-full px-0.5 sm:px-1 py-1 text-[8px] sm:text-[11px] font-bold uppercase rounded-md leading-tight transition-opacity ${highlightedType && highlightedType !== type ? "opacity-50" : ""}`}
                      style={{ backgroundColor: tc.bg, color: tc.text }}
                      title={type}
                    >
                      {type.slice(0, 3)}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {profiles.map((p) => (
              <tr key={p.species} className="border-t border-border/30 hover:bg-surface-alt/40 transition-colors">
                <td className="sticky left-0 z-10 bg-background px-1.5 sm:px-2 py-2 text-left text-[10px] sm:text-sm font-bold text-text-primary truncate max-w-[3.5rem] sm:max-w-[8rem]">
                  {p.species}
                </td>
                {ALL_TYPES.map((defType) => {
                  const { mult, move, typeConversion } = p.profile[defType];
                  const label = offensiveLabel(mult);
                  const cell = offensiveCell(mult);
                  const isHighlighted = highlightedType === defType;
                  const isDimmed = highlightedType !== null && !isHighlighted;
                  const localizedMove = move ? translateMove(move, language) : null;
                  const tooltipMove = localizedMove
                    ? typeConversion
                      ? `${localizedMove} (${typeConversion}) → ${defType}: ${mult}x`
                      : `${localizedMove} → ${defType}: ${mult}x`
                    : `vs ${defType}: ${mult}x`;
                  return (
                    <td key={defType} className={`px-0.5 py-1 transition-opacity ${isDimmed ? "opacity-50" : ""}`}>
                      <span
                        className={`inline-flex items-center justify-center w-full h-8 rounded-lg text-[10px] sm:text-xs tabular-nums ${cell.bg} ${cell.text} ${cell.ring ?? ""} ${
                          mult >= 4 ? "font-black text-[11px] sm:text-sm" : mult >= 2 ? "font-extrabold" : "font-bold"
                        } ${isHighlighted ? "ring-2 ring-accent/40" : ""}`}
                        style={cell.style}
                        title={tooltipMove}
                      >
                        {label}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
            {/* Team coverage summary row */}
            <tr className="border-t-2 border-border/60">
              <td className="sticky left-0 z-10 bg-background px-1.5 sm:px-2 py-2 text-left text-[9px] sm:text-xs font-extrabold text-text-tertiary uppercase tracking-tight sm:tracking-wider">
                Team SE
              </td>
              {teamSummary.map(({ type, seCount }) => {
                const isHighlighted = highlightedType === type;
                const isDimmed = highlightedType !== null && !isHighlighted;
                return (
                  <td key={type} className={`px-0.5 py-1 transition-opacity ${isDimmed ? "opacity-50" : ""}`}>
                    <span className={`inline-flex items-center justify-center w-full h-8 rounded-md text-[10px] sm:text-xs font-extrabold tabular-nums ${
                      seCount === 0
                        ? "bg-red-500/30 text-red-300 ring-1 ring-red-500/40"
                        : seCount === 1
                          ? "bg-amber-500/20 text-amber-400"
                          : seCount >= 4
                            ? "bg-emerald-500/25 text-emerald-300"
                            : "text-text-secondary"
                    } ${isHighlighted ? "ring-2 ring-accent/40" : ""}`}>
                      {seCount > 0 ? seCount : "\u2013"}
                    </span>
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-semibold text-text-secondary">
        <span className="flex items-center gap-1.5">
          <span className="w-7 h-6 rounded-lg ring-2 ring-cyan-400/80 inline-flex items-center justify-center text-[11px] font-black" style={{ backgroundColor: "var(--cell-dse)", color: "var(--cell-dse-text)" }}>4&times;</span>
          Double SE
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-7 h-6 rounded-lg inline-flex items-center justify-center text-[11px] font-extrabold" style={{ backgroundColor: "var(--cell-se)", color: "var(--cell-se-text)" }}>2&times;</span>
          Super effective
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-7 h-6 rounded-lg inline-flex items-center justify-center text-text-tertiary text-[11px] font-bold" style={{ opacity: 0.45 }}>&bull;</span>
          Neutral
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-7 h-6 rounded-lg inline-flex items-center justify-center text-[11px] font-bold" style={{ backgroundColor: "var(--cell-nve)", color: "var(--cell-nve-text)" }}>&frac12;</span>
          Not very effective
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-7 h-6 rounded-lg inline-flex items-center justify-center text-[11px] font-bold" style={{ backgroundColor: "var(--cell-immune)", color: "var(--cell-immune-text)" }}>0</span>
          No effect
        </span>
      </div>
    </div>
  );
}
