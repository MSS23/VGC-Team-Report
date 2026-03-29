"use client";

import { useState } from "react";
import type { AnalyzedPokemon } from "@/lib/types/analysis";
import type { TeamAnalysis } from "@/lib/types/analysis";
import type { SpriteConfig } from "@/lib/types/sprites";
import { PokemonSprite } from "./PokemonSprite";
import { getMoveTypeStyle } from "@/lib/utils/move-type-style";
import { TYPE_COLORS } from "@/lib/utils/type-colors";
import { NATURES } from "@/lib/data/natures";
import { useTranslation } from "@/lib/i18n";
import { translateMove } from "@/lib/utils/translate-move";
import type { PokemonType } from "@/lib/types/pokemon";

export type StatView = "evs" | "base";

interface TournamentModeProps {
  analysis: TeamAnalysis;
  speciesKeys: string[];
  getSpriteConfig?: (key: string) => SpriteConfig;
}

/** Small colored circle for a Pokemon type */
function TypeDot({ type }: { type: PokemonType }) {
  const colors = TYPE_COLORS[type];
  return (
    <span
      className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[7px] font-extrabold uppercase leading-none flex-shrink-0 shadow-sm"
      style={{ backgroundColor: colors.bg, color: colors.text }}
      title={type}
    >
      {type.slice(0, 2)}
    </span>
  );
}

/** Stat label with value and nature highlight */
function StatCell({ label, value, boosted, reduced, isBase }: { label: string; value: number; boosted: boolean; reduced: boolean; isBase?: boolean }) {
  return (
    <div className="flex flex-col items-center">
      <span className={`text-[9px] font-extrabold uppercase tracking-wider leading-none ${
        boosted ? "text-red-500 bg-red-500/15 px-1 rounded" :
        reduced ? "text-blue-500 bg-blue-500/15 px-1 rounded" :
        "text-text-tertiary"
      }`}>
        {label}{boosted ? "\u2191" : reduced ? "\u2193" : ""}
      </span>
      <span className={`text-sm font-extrabold tabular-nums leading-tight mt-0.5 ${
        isBase ? "text-text-primary" : value > 0 ? "text-text-primary" : "text-text-tertiary/40"
      }`}>
        {value}
      </span>
    </div>
  );
}

function CompactCard({
  pokemon,
  speciesKey,
  getSpriteConfig,
  statView,
}: {
  pokemon: AnalyzedPokemon;
  speciesKey: string;
  getSpriteConfig?: (key: string) => SpriteConfig;
  statView: StatView;
}) {
  const { language } = useTranslation();
  const { parsed, data, calculatedStats } = pokemon;
  const types = data?.types ?? [];
  const sc = getSpriteConfig?.(speciesKey);
  const natureData = NATURES[parsed.nature];
  const evs = parsed.evs;
  const baseStats = data?.baseStats;

  const statKeys = ["hp", "atk", "def", "spa", "spd", "spe"] as const;
  const statLabels = { hp: "HP", atk: "Atk", def: "Def", spa: "SpA", spd: "SpD", spe: "Spe" };

  const stats = statKeys.map((key) => ({
    label: statLabels[key],
    value: statView === "base" ? (baseStats?.[key] ?? 0) : evs[key],
    key,
  }));

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden hover:border-amber-500/30 transition-colors group">
      {/* Top section: info left, sprite right */}
      <div className="flex">
        {/* Left: name, types, ability, moves */}
        <div className="flex-1 min-w-0 p-2.5 sm:p-3 flex flex-col gap-1.5">
          {/* Species name */}
          <h3 className="text-sm sm:text-base font-extrabold text-text-primary tracking-tight truncate leading-tight">
            {parsed.species}
          </h3>

          {/* Types + Tera */}
          <div className="flex items-center gap-1">
            {types.map((type) => (
              <TypeDot key={type} type={type} />
            ))}
            {parsed.teraType && (
              <>
                <span className="text-text-tertiary/30 mx-0.5 text-[10px]">{"\u2192"}</span>
                <span
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border"
                  style={{
                    backgroundColor: `${TYPE_COLORS[parsed.teraType].bg}20`,
                    borderColor: `${TYPE_COLORS[parsed.teraType].bg}40`,
                  }}
                >
                  <span className="text-[7px] font-extrabold uppercase tracking-wider" style={{ color: TYPE_COLORS[parsed.teraType].bg }}>
                    Tera
                  </span>
                  <TypeDot type={parsed.teraType} />
                </span>
              </>
            )}
          </div>

          {/* Ability */}
          {parsed.ability && (
            <p className="text-[11px] font-bold text-text-secondary leading-tight truncate">
              {parsed.ability}
            </p>
          )}

          {/* Moves */}
          <div className="flex flex-col gap-0.5 mt-0.5">
            {parsed.moves.map((move, i) => {
              const style = getMoveTypeStyle(move);
              const translatedMove = translateMove(move, language);
              const bgColor = style?.color ?? "var(--color-text-tertiary)";
              return (
                <div
                  key={i}
                  className="flex items-center gap-1.5 text-[11px] font-bold leading-tight truncate"
                >
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: typeof bgColor === "string" ? bgColor : undefined, opacity: 0.8 }}
                  />
                  <span className="truncate" style={{ color: style?.color ?? "var(--color-text-secondary)" }}>
                    {translatedMove}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: sprite + item */}
        <div className="relative flex items-center justify-center w-24 sm:w-28 flex-shrink-0 bg-surface-alt/30">
          <PokemonSprite
            species={parsed.species}
            size={80}
            animated={sc?.animated ?? true}
            shiny={sc?.shiny}
          />
          {parsed.item && (
            <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 text-[8px] font-extrabold bg-surface/90 border border-border rounded-md text-text-secondary truncate max-w-[90px] backdrop-blur-sm">
              {parsed.item}
            </span>
          )}
        </div>
      </div>

      {/* Bottom: EV spread bar */}
      <div className="flex items-center justify-between px-2.5 sm:px-3 py-1.5 border-t border-border bg-surface-alt/20">
        {stats.map((s) => (
          <StatCell
            key={s.key}
            label={s.label}
            value={s.value}
            boosted={natureData?.plus === s.key}
            reduced={natureData?.minus === s.key}
            isBase={statView === "base"}
          />
        ))}
      </div>
    </div>
  );
}

export function TournamentMode({ analysis, speciesKeys, getSpriteConfig }: TournamentModeProps) {
  const [statView, setStatView] = useState<StatView>("evs");
  const pokemon = analysis.pokemon;

  // Sort by speed for the speed tier section
  const speedTiers = [...pokemon]
    .map((mon, i) => ({ mon, key: speciesKeys[i], speed: mon.calculatedStats.spe }))
    .sort((a, b) => b.speed - a.speed);

  return (
    <div className="flex flex-col gap-3 sm:gap-4 animate-fade-in">
      {/* Tournament mode header */}
      <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/30 rounded-xl">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500 flex-shrink-0">
          <path d="M6 9H4.5a2.5 2.5 0 010-5H6" />
          <path d="M18 9h1.5a2.5 2.5 0 000-5H18" />
          <path d="M4 22h16" />
          <path d="M10 22V2h4v20" />
        </svg>
        <span className="text-xs sm:text-sm font-extrabold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
          Tournament Mode
        </span>

        {/* EVs / Base Stats toggle */}
        <div className="ml-auto flex items-center bg-surface border border-border rounded-lg overflow-hidden">
          <button
            onClick={() => setStatView("evs")}
            className={`px-2.5 py-1 text-[10px] sm:text-xs font-bold transition-colors ${
              statView === "evs"
                ? "bg-amber-500/20 text-amber-500"
                : "text-text-tertiary hover:text-text-secondary"
            }`}
          >
            EVs
          </button>
          <button
            onClick={() => setStatView("base")}
            className={`px-2.5 py-1 text-[10px] sm:text-xs font-bold transition-colors ${
              statView === "base"
                ? "bg-amber-500/20 text-amber-500"
                : "text-text-tertiary hover:text-text-secondary"
            }`}
          >
            Base
          </button>
        </div>
      </div>

      {/* Pokemon cards — 2-column grid always */}
      <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
        {pokemon.map((mon, i) => (
          <CompactCard
            key={`${mon.parsed.species}-${i}`}
            pokemon={mon}
            speciesKey={speciesKeys[i]}
            getSpriteConfig={getSpriteConfig}
            statView={statView}
          />
        ))}
      </div>

      {/* Speed tier quick reference */}
      <div className="bg-surface border border-border rounded-xl px-3 py-2.5">
        <h3 className="text-[10px] font-extrabold uppercase tracking-widest text-text-tertiary mb-2">
          Speed Tiers
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-0.5">
          {speedTiers.map(({ mon, key, speed }, i) => {
            const sc = getSpriteConfig?.(key);
            const natureData = NATURES[mon.parsed.nature];
            const isBoosted = natureData?.plus === "spe";
            const isReduced = natureData?.minus === "spe";
            return (
              <div
                key={key + i}
                className="flex items-center gap-1.5 py-0.5"
              >
                <PokemonSprite
                  species={mon.parsed.species}
                  size={20}
                  animated={sc?.animated ?? true}
                  shiny={sc?.shiny}
                />
                <span className="text-xs font-bold text-text-primary flex-1 truncate">
                  {mon.parsed.species}
                </span>
                <span className={`text-xs font-extrabold tabular-nums ${
                  isBoosted ? "text-red-500" : isReduced ? "text-blue-500" : "text-text-primary"
                }`}>
                  {speed}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Printable version for PDF export                                   */
/* ------------------------------------------------------------------ */

export function PrintableTournamentMode({
  analysis,
  speciesKeys,
  getSpriteConfig,
  statView,
}: TournamentModeProps & { statView: StatView }) {
  const pokemon = analysis.pokemon;

  const speedTiers = [...pokemon]
    .map((mon, i) => ({ mon, key: speciesKeys[i], speed: mon.calculatedStats.spe }))
    .sort((a, b) => b.speed - a.speed);

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/30 rounded-xl">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500 flex-shrink-0">
          <path d="M6 9H4.5a2.5 2.5 0 010-5H6" />
          <path d="M18 9h1.5a2.5 2.5 0 000-5H18" />
          <path d="M4 22h16" />
          <path d="M10 22V2h4v20" />
        </svg>
        <span className="text-xs font-extrabold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
          Tournament Mode
        </span>
        <span className="ml-auto text-[10px] font-bold text-amber-500/60 uppercase tracking-wider">
          {statView === "base" ? "Base Stats" : "EVs"}
        </span>
      </div>

      {/* Pokemon cards — 2-column grid */}
      <div className="grid grid-cols-2 gap-2">
        {pokemon.map((mon, i) => (
          <CompactCard
            key={`${mon.parsed.species}-${i}`}
            pokemon={mon}
            speciesKey={speciesKeys[i]}
            getSpriteConfig={getSpriteConfig}
            statView={statView}
          />
        ))}
      </div>

      {/* Speed tiers */}
      <div className="bg-surface border border-border rounded-xl px-3 py-2.5">
        <h3 className="text-[10px] font-extrabold uppercase tracking-widest text-text-tertiary mb-2">
          Speed Tiers
        </h3>
        <div className="grid grid-cols-3 gap-x-4 gap-y-0.5">
          {speedTiers.map(({ mon, key, speed }, i) => {
            const sc = getSpriteConfig?.(key);
            const natureData = NATURES[mon.parsed.nature];
            const isBoosted = natureData?.plus === "spe";
            const isReduced = natureData?.minus === "spe";
            return (
              <div key={key + i} className="flex items-center gap-1.5 py-0.5">
                <PokemonSprite
                  species={mon.parsed.species}
                  size={20}
                  animated={sc?.animated ?? true}
                  shiny={sc?.shiny}
                />
                <span className="text-xs font-bold text-text-primary flex-1 truncate">
                  {mon.parsed.species}
                </span>
                <span className={`text-xs font-extrabold tabular-nums ${
                  isBoosted ? "text-red-500" : isReduced ? "text-blue-500" : "text-text-primary"
                }`}>
                  {speed}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
