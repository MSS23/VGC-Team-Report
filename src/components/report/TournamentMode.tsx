"use client";

import type { AnalyzedPokemon } from "@/lib/types/analysis";
import type { TeamAnalysis } from "@/lib/types/analysis";
import type { SpriteConfig } from "@/lib/types/sprites";
import { PokemonSprite } from "./PokemonSprite";
import { TypeBadge } from "./TypeBadge";
import { getMoveTypeStyle } from "@/lib/utils/move-type-style";
import { NATURES } from "@/lib/data/natures";
import { useTranslation } from "@/lib/i18n";
import { translateMove } from "@/lib/utils/translate-move";

interface TournamentModeProps {
  analysis: TeamAnalysis;
  speciesKeys: string[];
  getSpriteConfig?: (key: string) => SpriteConfig;
}

function CompactPokemonCard({
  pokemon,
  speciesKey,
  getSpriteConfig,
}: {
  pokemon: AnalyzedPokemon;
  speciesKey: string;
  getSpriteConfig?: (key: string) => SpriteConfig;
}) {
  const { t, language } = useTranslation();
  const { parsed, data, calculatedStats } = pokemon;
  const types = data?.types ?? [];
  const sc = getSpriteConfig?.(speciesKey);
  const natureData = NATURES[parsed.nature];

  // Determine boosted/reduced stat for nature
  const boostedStat = natureData?.plus;
  const reducedStat = natureData?.minus;

  return (
    <div className="bg-surface border-2 border-border rounded-xl p-3 sm:p-4 flex flex-col gap-2 hover:border-amber-500/40 transition-colors">
      {/* Header: sprite + name + types */}
      <div className="flex items-center gap-2.5">
        <PokemonSprite
          species={parsed.species}
          size={48}
          animated={sc?.animated ?? true}
          shiny={sc?.shiny}
        />
        <div className="flex-1 min-w-0">
          <h3 className="text-base sm:text-lg font-extrabold text-text-primary tracking-tight truncate leading-tight">
            {parsed.species}
          </h3>
          <div className="flex items-center gap-1 mt-0.5 flex-wrap">
            {types.map((type) => (
              <TypeBadge key={type} type={type} />
            ))}
            {parsed.teraType && (
              <span className="flex items-center gap-0.5 ml-1">
                <span className="text-[9px] text-text-tertiary font-semibold">{t.tera}:</span>
                <TypeBadge type={parsed.teraType} />
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Key info row: ability + item */}
      <div className="flex items-center gap-2 text-xs flex-wrap">
        {parsed.ability && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-surface-alt rounded-md font-semibold text-text-secondary border border-border-subtle">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-text-tertiary flex-shrink-0">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4M12 8h.01" />
            </svg>
            {parsed.ability}
          </span>
        )}
        {parsed.item && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-surface-alt rounded-md font-semibold text-text-secondary border border-border-subtle">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-text-tertiary flex-shrink-0">
              <path d="M20 12v10H4V12" /><path d="M2 7h20v5H2z" /><path d="M12 22V7" /><path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z" /><path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z" />
            </svg>
            {parsed.item}
          </span>
        )}
      </div>

      {/* Moves — 2x2 grid */}
      <div className="grid grid-cols-2 gap-1">
        {parsed.moves.map((move, i) => {
          const style = getMoveTypeStyle(move);
          const translatedMove = translateMove(move, language);
          return (
            <div
              key={i}
              className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-bold truncate"
              style={style ?? {
                backgroundColor: "var(--color-surface-alt)",
                borderColor: "var(--color-border)",
                color: "var(--color-text-secondary)",
              }}
            >
              <span className="truncate">{translatedMove}</span>
            </div>
          );
        })}
      </div>

      {/* Speed stat — prominent for tournament play */}
      <div className="flex items-center justify-between text-[11px] text-text-tertiary font-semibold pt-1 border-t border-border-subtle">
        <span>
          SPE: <span className={`font-extrabold text-sm ${
            boostedStat === "spe" ? "text-red-500" : reducedStat === "spe" ? "text-blue-500" : "text-text-primary"
          }`}>{calculatedStats.spe}</span>
        </span>
        <span className="text-text-tertiary">
          {parsed.nature} {natureData ? `(+${natureData.plus}/-${natureData.minus})` : ""}
        </span>
      </div>
    </div>
  );
}

export function TournamentMode({ analysis, speciesKeys, getSpriteConfig }: TournamentModeProps) {
  const { t } = useTranslation();
  const pokemon = analysis.pokemon;

  // Sort by speed for the speed tier section
  const speedTiers = [...pokemon]
    .map((mon, i) => ({ mon, key: speciesKeys[i], speed: mon.calculatedStats.spe }))
    .sort((a, b) => b.speed - a.speed);

  return (
    <div className="flex flex-col gap-4 sm:gap-6 animate-fade-in">
      {/* Tournament mode header */}
      <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/30 rounded-xl">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500 flex-shrink-0">
          <path d="M6 9H4.5a2.5 2.5 0 010-5H6" />
          <path d="M18 9h1.5a2.5 2.5 0 000-5H18" />
          <path d="M4 22h16" />
          <path d="M10 22V2h4v20" />
          <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 19.24 7 20" />
          <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 19.24 17 20" />
        </svg>
        <span className="text-xs sm:text-sm font-extrabold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
          Tournament Mode
        </span>
        <span className="text-[10px] text-amber-500/70 font-medium ml-auto hidden sm:inline">
          Quick battle reference
        </span>
      </div>

      {/* Team sprite row — compact horizontal strip */}
      <div className="flex items-center justify-center gap-1 sm:gap-3 px-2 py-2 bg-surface-alt/50 rounded-xl border border-border-subtle">
        {pokemon.map((mon, i) => {
          const sc = getSpriteConfig?.(speciesKeys[i]);
          return (
            <div key={i} className="flex flex-col items-center gap-0.5">
              <PokemonSprite
                species={mon.parsed.species}
                size={40}
                animated={sc?.animated ?? true}
                shiny={sc?.shiny}
              />
              <span className="text-[9px] font-bold text-text-tertiary truncate max-w-[50px] text-center">
                {mon.parsed.species.length > 8
                  ? mon.parsed.species.slice(0, 7) + "."
                  : mon.parsed.species}
              </span>
            </div>
          );
        })}
      </div>

      {/* Pokemon cards — condensed grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
        {pokemon.map((mon, i) => (
          <CompactPokemonCard
            key={`${mon.parsed.species}-${i}`}
            pokemon={mon}
            speciesKey={speciesKeys[i]}
            getSpriteConfig={getSpriteConfig}
          />
        ))}
      </div>

      {/* Speed tier quick reference */}
      <div className="bg-surface border border-border rounded-xl p-3 sm:p-4">
        <h3 className="text-xs font-extrabold uppercase tracking-widest text-text-tertiary mb-3">
          Speed Tiers
        </h3>
        <div className="flex flex-col gap-1">
          {speedTiers.map(({ mon, key, speed }, i) => {
            const sc = getSpriteConfig?.(key);
            const natureData = NATURES[mon.parsed.nature];
            const isBoosted = natureData?.plus === "spe";
            const isReduced = natureData?.minus === "spe";
            return (
              <div
                key={key + i}
                className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-surface-alt/60 transition-colors"
              >
                <span className="text-xs font-[family-name:var(--font-mono)] font-bold text-text-tertiary w-5 text-right tabular-nums">
                  {i + 1}
                </span>
                <PokemonSprite
                  species={mon.parsed.species}
                  size={24}
                  animated={sc?.animated ?? true}
                  shiny={sc?.shiny}
                />
                <span className="text-sm font-bold text-text-primary flex-1 truncate">
                  {mon.parsed.species}
                </span>
                <span className={`text-sm font-extrabold font-[family-name:var(--font-mono)] tabular-nums ${
                  isBoosted ? "text-red-500" : isReduced ? "text-blue-500" : "text-text-primary"
                }`}>
                  {speed}
                </span>
                {mon.parsed.item && (
                  <span className="text-[10px] text-text-tertiary font-medium hidden sm:inline truncate max-w-[100px]">
                    {mon.parsed.item}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <p className="text-center text-[10px] text-text-tertiary/60 font-medium">
        Press the trophy icon in the navbar to exit tournament mode
      </p>
    </div>
  );
}
