"use client";

import type { AnalyzedPokemon } from "@/lib/types/analysis";
import { PokemonSprite } from "./PokemonSprite";
import { TypeCoverageMatrix } from "./TypeCoverageMatrix";
import type { SpriteConfig } from "@/lib/types/sprites";
import { useTranslation } from "@/lib/i18n";

interface SpeedTierChartProps {
  pokemon: AnalyzedPokemon[];
  speciesKeys: string[];
  getSpriteConfig?: (key: string) => SpriteConfig;
  isPresentationMode?: boolean;
}

const SPEED_BENCHMARKS = [
  { value: 222, label: "150 base max+" },
  { value: 203, label: "130 base max+" },
  { value: 184, label: "110 base max+" },
  { value: 150, label: "100 base max" },
  { value: 127, label: "80 base max" },
  { value: 97,  label: "50 base max" },
];

export function SpeedTierChart({ pokemon, speciesKeys, getSpriteConfig, isPresentationMode }: SpeedTierChartProps) {
  const { t } = useTranslation();
  const entries = pokemon.map((mon, i) => {
    const baseSpe = mon.calculatedStats.spe;
    const hasSpeedBoost = mon.itemBoost?.stat === "spe";
    const boostedSpe = hasSpeedBoost ? mon.itemBoost!.boostedValue : baseSpe;
    const tailwindSpe = baseSpe * 2;

    // Determine the label for the speed boost source
    let speedBoostLabel = "";
    if (hasSpeedBoost && mon.parsed.item) {
      const item = mon.parsed.item.toLowerCase();
      if (item === "choice scarf") speedBoostLabel = "scarf";
      else if (item === "booster energy") speedBoostLabel = "booster";
      else speedBoostLabel = mon.parsed.item;
    }

    return {
      species: mon.parsed.species,
      speciesKey: speciesKeys[i],
      baseSpe,
      boostedSpe,
      tailwindSpe,
      hasSpeedBoost,
      speedBoostLabel,
    };
  }).sort((a, b) => b.boostedSpe - a.boostedSpe);

  // Scale to max boosted speed only (not tailwind) so bars are readable
  const maxSpeed = Math.max(...entries.map(e => e.boostedSpe), 200);

  const minTeamSpeed = Math.min(...entries.map(e => e.baseSpe));
  const maxTeamBoosted = Math.max(...entries.map(e => e.boostedSpe));
  const relevantBenchmarks = SPEED_BENCHMARKS.filter(
    b => b.value >= minTeamSpeed * 0.8 && b.value <= maxTeamBoosted * 1.05
  );

  return (
    <div className="flex flex-col gap-6 sm:gap-8 animate-fade-in">
      <div>
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-text-primary presenting:text-3xl tracking-tight">
          {t.teamAnalysis}
        </h2>
        <p className="text-sm sm:text-base text-text-secondary mt-1 font-medium">
          {t.speedTiersAndCoverage}
        </p>
      </div>

      {/* Speed Tiers Section */}
      <div className="flex flex-col gap-2" data-walkthrough="speed-tiers">
        <h3 className="text-xs font-extrabold uppercase tracking-widest text-text-tertiary">
          {t.speedTiers}
        </h3>

        <div className="flex flex-col gap-3">
          {entries.map((entry) => {
            const sc = getSpriteConfig?.(entry.speciesKey);
            const percent = Math.min((entry.boostedSpe / maxSpeed) * 100, 100);
            const basePercent = Math.min((entry.baseSpe / maxSpeed) * 100, 100);

            return (
              <div key={entry.speciesKey} className="flex items-center gap-1.5 sm:gap-3">
                {/* Name column -- fixed width */}
                <div className="flex items-center gap-1.5 sm:gap-2 w-[5.5rem] sm:w-40 lg:w-48 flex-shrink-0 min-w-0">
                  <PokemonSprite
                    species={entry.species}
                    size={isPresentationMode ? 36 : 24}
                    className="sm:hidden flex-shrink-0"
                    animated={sc?.animated}
                    shiny={sc?.shiny}
                  />
                  <PokemonSprite
                    species={entry.species}
                    size={isPresentationMode ? 36 : 28}
                    className="hidden sm:block flex-shrink-0"
                    animated={sc?.animated}
                    shiny={sc?.shiny}
                  />
                  <span className="text-xs sm:text-sm lg:text-base font-bold text-text-primary truncate">
                    {entry.species}
                  </span>
                </div>

                {/* Bar column */}
                <div className="flex-1 flex items-center gap-2 min-w-0">
                  <div className="flex-1 h-7 sm:h-8 lg:h-10 bg-surface-alt rounded-lg overflow-hidden relative">
                    {/* Base bar */}
                    <div
                      className={`absolute inset-y-0 left-0 rounded-lg transition-all ${
                        entry.hasSpeedBoost ? "bg-amber-500/70" : ""
                      }`}
                      style={{
                        width: `${entry.hasSpeedBoost ? percent : basePercent}%`,
                        backgroundColor: entry.hasSpeedBoost ? undefined : "var(--stat-spe)",
                        opacity: entry.hasSpeedBoost ? undefined : 0.7,
                      }}
                    />
                    {/* Benchmark lines inside the bar */}
                    {relevantBenchmarks.map((b) => {
                      const bp = (b.value / maxSpeed) * 100;
                      if (bp > 98) return null;
                      return (
                        <div
                          key={b.value}
                          className="absolute top-0 bottom-0 w-px bg-text-tertiary/20"
                          style={{ left: `${bp}%` }}
                          title={`${b.value} — ${b.label}`}
                        />
                      );
                    })}
                  </div>

                  {/* Speed value -- fixed width to prevent overlap */}
                  <div className="w-14 sm:w-24 lg:w-28 flex-shrink-0 text-right">
                    <span className={`text-xs sm:text-sm lg:text-base font-[family-name:var(--font-mono)] font-extrabold tabular-nums ${
                      entry.hasSpeedBoost ? "text-amber-500" : "text-text-primary"
                    }`}>
                      {entry.hasSpeedBoost ? entry.boostedSpe : entry.baseSpe}
                    </span>
                    {entry.hasSpeedBoost && entry.speedBoostLabel && (
                      <span className="text-xs text-amber-500/60 font-semibold ml-0.5">
                        {entry.speedBoostLabel}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Tailwind note + Legend */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs font-semibold text-text-tertiary">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded" style={{ backgroundColor: "var(--stat-spe)", opacity: 0.7 }} />
            {t.base}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-amber-500/70" />
            {t.itemBoosted}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-px h-3.5 bg-text-tertiary/30" />
            {t.benchmarks}
          </span>
          <span className="ml-auto text-text-tertiary/60 font-medium">
            {t.tailwindDoublesBase}
          </span>
        </div>
      </div>

      <hr className="border-border" />

      {/* Type Coverage */}
      <TypeCoverageMatrix pokemon={pokemon} />
    </div>
  );
}
