"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import type { AnalyzedPokemon } from "@/lib/types/analysis";
import { PokemonSprite } from "./PokemonSprite";
import type { SpriteConfig } from "@/lib/types/sprites";
import { useTranslation } from "@/lib/i18n";
import { POKEMON_DATA } from "@/lib/data/pokemon";

const OffensiveCoverageChart = dynamic(() => import("./OffensiveCoverageChart").then(m => ({ default: m.OffensiveCoverageChart })), {
  loading: () => <div className="animate-pulse bg-surface-alt rounded-xl h-48" />,
});
const DefensiveCoverageChart = dynamic(() => import("./DefensiveCoverageChart").then(m => ({ default: m.DefensiveCoverageChart })), {
  loading: () => <div className="animate-pulse bg-surface-alt rounded-xl h-48" />,
});

interface SpeedTierChartProps {
  pokemon: AnalyzedPokemon[];
  speciesKeys: string[];
  getSpriteConfig?: (key: string) => SpriteConfig;
  isPresentationMode?: boolean;
}

/** Common meta threats to show alongside your team for speed context */
const META_THREATS = [
  "flutter-mane", "iron-bundle", "raging-bolt", "calyrex-shadow",
  "urshifu", "urshifu-rapid-strike", "tornadus", "landorus",
  "incineroar", "rillaboom", "amoonguss", "iron-hands",
  "chien-pao", "ogerpon", "kingambit", "archaludon",
  "pelipper", "torkoal", "porygon2", "dusclops",
] as const;

type SpeedModifier = "tailwind" | "paralysis" | "icywind";

const MODIFIER_CONFIG: Record<SpeedModifier, { label: string; icon: string; factor: number; description: string }> = {
  tailwind: { label: "Tailwind", icon: "\u{1F4A8}", factor: 2, description: "\u00D72 speed" },
  paralysis: { label: "Paralysis", icon: "\u{26A1}", factor: 0.5, description: "\u00D70.5 speed" },
  icywind: { label: "Icy Wind", icon: "\u{2744}\u{FE0F}", factor: 0.67, description: "-1 stage" },
};

function calcSpeed(baseSpe: number, mod: Set<SpeedModifier>): number {
  let speed = baseSpe;
  if (mod.has("icywind")) speed = Math.floor(speed * 0.67);
  if (mod.has("paralysis")) speed = Math.floor(speed * 0.5);
  if (mod.has("tailwind")) speed = Math.floor(speed * 2);
  return speed;
}

/** Calculate max speed at level 50 for a given base stat (31 IV, 252 EV, +nature) */
function maxSpeed(baseSpe: number): number {
  return Math.floor(((Math.floor(((2 * baseSpe + 31 + Math.floor(252 / 4)) * 50) / 100) + 5) * 1.1));
}

/** Calculate min speed at level 50 (0 IV, 0 EV, -nature) */
function minSpeed(baseSpe: number): number {
  return Math.floor(((Math.floor(((2 * baseSpe + 0) * 50) / 100) + 5) * 0.9));
}

export function SpeedTierChart({ pokemon, speciesKeys, getSpriteConfig, isPresentationMode }: SpeedTierChartProps) {
  const { t } = useTranslation();
  const [activeModifiers, setActiveModifiers] = useState<Set<SpeedModifier>>(new Set());
  const [showMetaThreats, setShowMetaThreats] = useState(false);

  const toggleModifier = (mod: SpeedModifier) => {
    setActiveModifiers(prev => {
      const next = new Set(prev);
      if (next.has(mod)) next.delete(mod); else next.add(mod);
      return next;
    });
  };

  // Build your team entries
  const teamEntries = useMemo(() => pokemon.map((mon, i) => {
    const baseSpe = mon.calculatedStats.spe;
    const hasSpeedBoost = mon.itemBoost?.stat === "spe";
    const boostedSpe = hasSpeedBoost ? mon.itemBoost!.boostedValue : baseSpe;

    let speedBoostLabel = "";
    if (hasSpeedBoost && mon.parsed.item) {
      const item = mon.parsed.item.toLowerCase();
      if (item === "choice scarf") speedBoostLabel = "Scarf";
      else if (item === "booster energy") speedBoostLabel = "Booster";
      else speedBoostLabel = mon.parsed.item;
    }

    return {
      species: mon.parsed.species,
      speciesKey: speciesKeys[i],
      baseSpe,
      boostedSpe,
      hasSpeedBoost,
      speedBoostLabel,
      isYours: true as const,
    };
  }), [pokemon, speciesKeys]);

  // Build meta threat entries (filter out Pokemon already on your team)
  const metaEntries = useMemo(() => {
    if (!showMetaThreats) return [];
    const teamSpecies = new Set(pokemon.map(p => p.parsed.species.toLowerCase().replace(/\s+/g, "-")));
    return META_THREATS
      .filter(key => !teamSpecies.has(key))
      .map(key => {
        const data = POKEMON_DATA[key];
        if (!data) return null;
        const base = data.baseStats.spe;
        return {
          species: data.name,
          speciesKey: key,
          baseSpe: maxSpeed(base),
          minSpe: minSpeed(base),
          boostedSpe: maxSpeed(base),
          hasSpeedBoost: false,
          speedBoostLabel: "",
          isYours: false as const,
        };
      })
      .filter(Boolean) as Array<{
        species: string; speciesKey: string; baseSpe: number; minSpe: number;
        boostedSpe: number; hasSpeedBoost: boolean; speedBoostLabel: string; isYours: false;
      }>;
  }, [showMetaThreats, pokemon]);

  // Combine and apply modifiers
  const allEntries = useMemo(() => {
    const combined = [
      ...teamEntries.map(e => ({
        ...e,
        displaySpeed: calcSpeed(e.boostedSpe, activeModifiers),
      })),
      ...metaEntries.map(e => ({
        ...e,
        displaySpeed: calcSpeed(e.boostedSpe, activeModifiers),
        minSpe: e.minSpe,
      })),
    ];
    return combined.sort((a, b) => b.displaySpeed - a.displaySpeed);
  }, [teamEntries, metaEntries, activeModifiers]);

  const maxDisplaySpeed = allEntries[0]?.displaySpeed ?? 200;

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
      <div className="flex flex-col gap-3" data-walkthrough="speed-tiers">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-extrabold uppercase tracking-widest text-text-tertiary">
            {t.speedTiers}
          </h3>
        </div>

        {/* Modifier toggles */}
        <div className="flex flex-wrap items-center gap-2">
          {(Object.entries(MODIFIER_CONFIG) as [SpeedModifier, typeof MODIFIER_CONFIG[SpeedModifier]][]).map(([key, cfg]) => {
            const active = activeModifiers.has(key);
            return (
              <button
                key={key}
                type="button"
                onClick={() => toggleModifier(key)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                  active
                    ? "bg-accent text-white border-accent shadow-sm shadow-accent/20"
                    : "bg-surface-alt/50 text-text-secondary border-border hover:border-accent/30 hover:text-accent"
                }`}
                title={cfg.description}
              >
                <span>{cfg.icon}</span>
                {cfg.label}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setShowMetaThreats(!showMetaThreats)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
              showMetaThreats
                ? "bg-blue-500/15 text-blue-500 border-blue-500/30"
                : "bg-surface-alt/50 text-text-secondary border-border hover:border-blue-500/30 hover:text-blue-500"
            }`}
          >
            <span>{"\u{1F30D}"}</span>
            Meta Threats
          </button>
        </div>

        {/* Speed bars */}
        <div className="flex flex-col gap-2">
          {allEntries.map((entry, i) => {
            const sc = entry.isYours ? getSpriteConfig?.(entry.speciesKey) : undefined;
            const percent = Math.max(Math.min((entry.displaySpeed / maxDisplaySpeed) * 100, 100), 6);

            // Check for speed tie with adjacent entry
            const prevSpeed = i > 0 ? allEntries[i - 1].displaySpeed : -1;
            const isTie = entry.displaySpeed === prevSpeed;

            return (
              <div key={`${entry.speciesKey}-${entry.isYours}`} className={`flex items-center gap-1.5 sm:gap-3 ${!entry.isYours ? "opacity-70" : ""}`}>
                {/* Name column */}
                <div className="flex items-center gap-1.5 sm:gap-2 w-[6.5rem] sm:w-40 lg:w-48 flex-shrink-0 min-w-0">
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
                  <span className={`text-xs sm:text-sm lg:text-base font-bold truncate ${
                    entry.isYours ? "text-text-primary" : "text-text-tertiary"
                  }`}>
                    {entry.species}
                  </span>
                </div>

                {/* Bar column */}
                <div className="flex-1 flex items-center gap-2 min-w-0">
                  <div className="flex-1 h-7 sm:h-8 lg:h-10 bg-surface-alt rounded-lg overflow-hidden relative">
                    <div
                      className={`absolute inset-y-0 left-0 rounded-lg transition-all duration-300 ${
                        entry.hasSpeedBoost ? "bar-speed-boosted" : ""
                      }`}
                      style={{
                        width: `${percent}%`,
                        backgroundColor: entry.isYours
                          ? entry.hasSpeedBoost ? "#f59e0b" : "var(--stat-spe)"
                          : "#64748b",
                        opacity: entry.isYours ? (entry.hasSpeedBoost ? 0.8 : 0.7) : 0.4,
                      }}
                    />
                    {/* Speed tie indicator */}
                    {isTie && (
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-bold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded">
                        TIE
                      </div>
                    )}
                  </div>

                  {/* Speed value */}
                  <div className="w-14 sm:w-24 lg:w-28 flex-shrink-0 text-right">
                    <span className={`text-xs sm:text-sm lg:text-base font-[family-name:var(--font-mono)] font-extrabold tabular-nums ${
                      entry.isYours
                        ? entry.hasSpeedBoost ? "text-amber-500" : "text-text-primary"
                        : "text-text-tertiary"
                    }`}>
                      {entry.displaySpeed}
                    </span>
                    {entry.isYours && entry.hasSpeedBoost && entry.speedBoostLabel && (
                      <span className="text-[10px] text-amber-500/60 font-semibold ml-0.5 hidden sm:inline">
                        {entry.speedBoostLabel}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs font-semibold text-text-tertiary">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded" style={{ backgroundColor: "var(--stat-spe)", opacity: 0.7 }} />
            Your team
          </span>
          {teamEntries.some(e => e.hasSpeedBoost) && (
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-amber-500/70 bar-speed-boosted" />
              {t.itemBoosted}
            </span>
          )}
          {showMetaThreats && (
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-slate-500/40" />
              Meta (max speed)
            </span>
          )}
          {activeModifiers.size > 0 && (
            <span className="ml-auto text-accent font-medium">
              {Array.from(activeModifiers).map(m => MODIFIER_CONFIG[m].label).join(" + ")} applied
            </span>
          )}
        </div>
      </div>

      <hr className="border-border" />

      {/* Offensive Coverage Heatmap */}
      <OffensiveCoverageChart pokemon={pokemon} />

      <hr className="border-border" />

      {/* Defensive Coverage Heatmap */}
      <DefensiveCoverageChart pokemon={pokemon} />
    </div>
  );
}
