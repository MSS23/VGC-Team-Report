"use client";

import { useState, useMemo } from "react";
import type { AnalyzedPokemon } from "@/lib/types/analysis";
import { PokemonSprite } from "./PokemonSprite";
import type { SpriteConfig } from "@/lib/types/sprites";
import { useTranslation } from "@/lib/i18n";
import { POKEMON_DATA } from "@/lib/data/pokemon";
import { CHAMPIONS_DEX } from "@/lib/data/champions-dex";
import { calculateChampionsStat, convertToChampionsSp } from "@/lib/analysis/stat-calculator";

interface SpeedTierChartProps {
  pokemon: AnalyzedPokemon[];
  speciesKeys: string[];
  getSpriteConfig?: (key: string) => SpriteConfig;
  isPresentationMode?: boolean;
  regulation?: string;
}

/** Common meta threats — standard VGC formats (Reg G/H etc.) */
const META_THREATS_DEFAULT = [
  "flutter-mane", "iron-bundle", "raging-bolt", "calyrex-shadow",
  "urshifu", "urshifu-rapid-strike", "tornadus", "landorus",
  "incineroar", "rillaboom", "amoonguss", "iron-hands",
  "chien-pao", "ogerpon", "kingambit", "archaludon",
  "pelipper", "torkoal", "porygon2", "dusclops",
] as const;

/** Champions meta threats — only Pokemon legal in Reg M-A */
const META_THREATS_CHAMPIONS = [
  // Key Megas
  "kangaskhan-mega", "salamence-mega", "metagross-mega",
  "charizard-mega-y", "gengar-mega", "mawile-mega",
  "gardevoir-mega", "lucario-mega", "aerodactyl-mega",
  "alakazam-mega", "lopunny-mega", "tyranitar-mega",
  "garchomp-mega", "scizor-mega", "venusaur-mega",
  // Top base forms
  "incineroar", "kingambit", "archaludon", "dragonite",
  "tyranitar", "garchomp", "excadrill", "whimsicott",
  "torkoal", "pelipper", "milotic", "conkeldurr",
  "hydreigon", "volcarona", "snorlax", "clefable",
  "arcanine", "gyarados", "ninetales-alola", "rotom",
] as const;

type SpeedModifier = "tailwind" | "paralysis" | "icywind";
type ModifierSide = "yours" | "opponent";

const MODIFIER_CONFIG: Record<SpeedModifier, { label: string; icon: string; description: string }> = {
  tailwind: { label: "Tailwind", icon: "\u{1F4A8}", description: "\u00D72 speed" },
  paralysis: { label: "Paralysis", icon: "\u{26A1}", description: "\u00D70.5 speed" },
  icywind: { label: "Icy Wind", icon: "\u{2744}\u{FE0F}", description: "-1 stage" },
};

/**
 * Calculate speed after battle modifiers using correct Pokemon rounding.
 * Order matches the game engine:
 *  1. Stat stage modifiers (Icy Wind -1) — applied to base stat
 *  2. Ability/item boost (Quark Drive, Choice Scarf) — reapplied after stages
 *  3. Paralysis (×0.5, Gen 7+)
 *  4. Tailwind (×2)
 */
function calcSpeed(baseSpe: number, boostMultiplier: number, mod: Set<SpeedModifier>): number {
  let speed = baseSpe;
  if (mod.has("icywind")) speed = Math.floor(speed * 2 / 3);
  if (boostMultiplier !== 1) speed = Math.floor(speed * boostMultiplier);
  if (mod.has("paralysis")) speed = Math.floor(speed * 0.5);
  if (mod.has("tailwind")) speed = speed * 2;
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

/** Champions max speed: 31 IV always, 32 SP, +nature */
function championsMaxSpeed(baseSpe: number): number {
  return Math.floor((Math.floor((2 * baseSpe + 31) * 50 / 100) + 5 + 32) * 1.1);
}

/** Champions min speed: 31 IV always, 0 SP, -nature */
function championsMinSpeed(baseSpe: number): number {
  return Math.floor((Math.floor((2 * baseSpe + 31) * 50 / 100) + 5) * 0.9);
}

/** Modifier toggle pill for a specific side */
function SideModifierToggle({
  side,
  label,
  color,
  modifiers,
  onToggle,
}: {
  side: ModifierSide;
  label: string;
  color: string;
  modifiers: Set<SpeedModifier>;
  onToggle: (side: ModifierSide, mod: SpeedModifier) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5">
        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
        <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-text-tertiary">{label}</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {(Object.entries(MODIFIER_CONFIG) as [SpeedModifier, typeof MODIFIER_CONFIG[SpeedModifier]][]).map(([key, cfg]) => {
          const active = modifiers.has(key);
          return (
            <button
              key={key}
              type="button"
              onClick={() => onToggle(side, key)}
              className={`inline-flex items-center gap-1 px-2 sm:px-2.5 py-1 sm:py-1.5 text-[10px] sm:text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                active
                  ? "bg-accent text-white border-accent shadow-sm shadow-accent/20"
                  : "bg-surface-alt/50 text-text-secondary border-border hover:border-accent/30 hover:text-accent"
              }`}
              title={`${cfg.label} on ${label}: ${cfg.description}`}
            >
              <span className="text-xs sm:text-sm">{cfg.icon}</span>
              <span className="hidden sm:inline">{cfg.label}</span>
              <span className="sm:hidden">{cfg.label.slice(0, 2)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function SpeedTierChart({ pokemon, speciesKeys, getSpriteConfig, isPresentationMode, regulation }: SpeedTierChartProps) {
  const META_THREATS = regulation === "Reg M-A"
    ? META_THREATS_CHAMPIONS.filter(k => POKEMON_DATA[k] && CHAMPIONS_DEX.has(k))
    : META_THREATS_DEFAULT;
  const { t } = useTranslation();
  const [yourModifiers, setYourModifiers] = useState<Set<SpeedModifier>>(new Set());
  const [opponentModifiers, setOpponentModifiers] = useState<Set<SpeedModifier>>(new Set());
  const [showMetaThreats, setShowMetaThreats] = useState(false);

  const hasAnyModifiers = yourModifiers.size > 0 || opponentModifiers.size > 0;

  const toggleModifier = (side: ModifierSide, mod: SpeedModifier) => {
    const setter = side === "yours" ? setYourModifiers : setOpponentModifiers;
    setter(prev => {
      const next = new Set(prev);
      if (next.has(mod)) next.delete(mod); else next.add(mod);
      return next;
    });
  };

  // Build your team entries
  const isChampions = regulation === "Reg M-A";
  const teamEntries = useMemo(() => pokemon.map((mon, i) => {
    // In Champions (Reg M-A), recompute Speed from the SP budget so the
    // tier matches the card display. calculatedStats uses the standard
    // EV formula and diverges from the SP formula when the paste carries
    // SP values in the EV line (sum 66, per-stat <=32).
    let baseSpe = mon.calculatedStats.spe;
    if (isChampions && mon.data) {
      const sp = convertToChampionsSp(mon.parsed.evs);
      baseSpe = calculateChampionsStat("spe", mon.data.baseStats.spe, sp.spe, mon.parsed.nature);
    }
    const hasSpeedBoost = mon.itemBoost?.stat === "spe";
    const boostMultiplier = hasSpeedBoost ? mon.itemBoost!.multiplier : 1;

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
      boostMultiplier,
      hasSpeedBoost,
      speedBoostLabel,
      isYours: true as const,
    };
  }), [pokemon, speciesKeys, isChampions]);

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
        const isMA = regulation === "Reg M-A";
        return {
          species: data.name,
          speciesKey: key,
          baseSpe: isMA ? championsMaxSpeed(base) : maxSpeed(base),
          minSpe: isMA ? championsMinSpeed(base) : minSpeed(base),
          boostMultiplier: 1,
          hasSpeedBoost: false,
          speedBoostLabel: "",
          isYours: false as const,
        };
      })
      .filter(Boolean) as Array<{
        species: string; speciesKey: string; baseSpe: number; minSpe: number;
        boostMultiplier: number; hasSpeedBoost: boolean; speedBoostLabel: string; isYours: false;
      }>;
  }, [showMetaThreats, pokemon, regulation, META_THREATS]);

  // Combine and apply per-side modifiers
  const allEntries = useMemo(() => {
    const combined = [
      ...teamEntries.map(e => {
        const baseSpeed = calcSpeed(e.baseSpe, e.boostMultiplier, yourModifiers);
        // Also compute unmodified speed for delta display
        const unmodifiedSpeed = calcSpeed(e.baseSpe, e.boostMultiplier, new Set());
        return {
          ...e,
          displaySpeed: baseSpeed,
          unmodifiedSpeed,
          delta: baseSpeed - unmodifiedSpeed,
        };
      }),
      ...metaEntries.map(e => {
        const baseSpeed = calcSpeed(e.baseSpe, 1, opponentModifiers);
        const unmodifiedSpeed = calcSpeed(e.baseSpe, 1, new Set());
        return {
          ...e,
          displaySpeed: baseSpeed,
          unmodifiedSpeed,
          delta: baseSpeed - unmodifiedSpeed,
          minSpe: e.minSpe,
        };
      }),
    ];
    return combined.sort((a, b) => b.displaySpeed - a.displaySpeed);
  }, [teamEntries, metaEntries, yourModifiers, opponentModifiers]);

  const maxDisplaySpeed = allEntries[0]?.displaySpeed ?? 200;

  // Compute position changes when modifiers are active
  const positionChanges = useMemo(() => {
    if (!hasAnyModifiers) return new Map<string, number>();

    // Build unmodified order
    const unmodified = [
      ...teamEntries.map(e => ({
        key: `${e.speciesKey}-yours`,
        speed: calcSpeed(e.baseSpe, e.boostMultiplier, new Set()),
      })),
      ...metaEntries.map(e => ({
        key: `${e.speciesKey}-opponent`,
        speed: calcSpeed(e.baseSpe, 1, new Set()),
      })),
    ].sort((a, b) => b.speed - a.speed);

    // Build modified order
    const modified = allEntries.map(e => ({
      key: `${e.speciesKey}-${e.isYours ? "yours" : "opponent"}`,
    }));

    const changes = new Map<string, number>();
    unmodified.forEach((entry, oldIdx) => {
      const newIdx = modified.findIndex(m => m.key === entry.key);
      if (newIdx !== -1 && newIdx !== oldIdx) {
        changes.set(entry.key, oldIdx - newIdx); // positive = moved up, negative = moved down
      }
    });
    return changes;
  }, [hasAnyModifiers, teamEntries, metaEntries, allEntries]);

  // Build active modifier summary for each side
  const yourModSummary = Array.from(yourModifiers).map(m => MODIFIER_CONFIG[m].label).join(" + ");
  const oppModSummary = Array.from(opponentModifiers).map(m => MODIFIER_CONFIG[m].label).join(" + ");

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

        {/* Per-side modifier controls */}
        <div className="bg-surface border border-border rounded-xl p-3 sm:p-4 flex flex-col gap-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <SideModifierToggle
              side="yours"
              label="Your team"
              color="var(--stat-spe)"
              modifiers={yourModifiers}
              onToggle={toggleModifier}
            />
            {showMetaThreats && (
              <SideModifierToggle
                side="opponent"
                label="Opponent"
                color="#64748b"
                modifiers={opponentModifiers}
                onToggle={toggleModifier}
              />
            )}
          </div>

          {/* Meta threats toggle — always visible */}
          <div className="flex items-center gap-2 pt-1 border-t border-border-subtle">
            <button
              type="button"
              onClick={() => {
                setShowMetaThreats(!showMetaThreats);
                if (showMetaThreats) setOpponentModifiers(new Set());
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                showMetaThreats
                  ? "bg-blue-500/15 text-blue-500 border-blue-500/30"
                  : "bg-surface-alt/50 text-text-secondary border-border hover:border-blue-500/30 hover:text-blue-500"
              }`}
            >
              <span>{"\u{1F30D}"}</span>
              Meta Threats
            </button>
            {hasAnyModifiers && (
              <span className="text-[10px] sm:text-xs text-accent font-medium ml-auto">
                {yourModSummary && `You: ${yourModSummary}`}
                {yourModSummary && oppModSummary && " \u00B7 "}
                {oppModSummary && `Opp: ${oppModSummary}`}
              </span>
            )}
          </div>
        </div>

        {/* Speed bars */}
        <div className="flex flex-col gap-2">
          {allEntries.map((entry, i) => {
            const sc = entry.isYours ? getSpriteConfig?.(entry.speciesKey) : undefined;
            const percent = Math.max(Math.min((entry.displaySpeed / maxDisplaySpeed) * 100, 100), 6);

            // Check for speed tie with adjacent entry
            const prevSpeed = i > 0 ? allEntries[i - 1].displaySpeed : -1;
            const isTie = entry.displaySpeed === prevSpeed;

            const entryKey = `${entry.speciesKey}-${entry.isYours ? "yours" : "opponent"}`;
            const posChange = positionChanges.get(entryKey) ?? 0;

            return (
              <div
                key={entryKey}
                className={`flex items-center gap-1.5 sm:gap-3 transition-all duration-300 ${!entry.isYours ? "opacity-70" : ""}`}
              >
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

                  {/* Speed value + delta + position change */}
                  <div className="w-20 sm:w-32 lg:w-36 flex-shrink-0 flex items-center justify-end gap-1 sm:gap-1.5">
                    <span className={`text-xs sm:text-sm lg:text-base font-[family-name:var(--font-mono)] font-extrabold tabular-nums ${
                      entry.isYours
                        ? entry.hasSpeedBoost ? "text-amber-500" : "text-text-primary"
                        : "text-text-tertiary"
                    }`}>
                      {entry.displaySpeed}
                    </span>
                    {entry.isYours && entry.hasSpeedBoost && entry.speedBoostLabel && (
                      <span className="text-[10px] text-amber-500/60 font-semibold hidden sm:inline">
                        {entry.speedBoostLabel}
                      </span>
                    )}
                    {/* Delta from modifier */}
                    {entry.delta !== 0 && (
                      <span className={`text-[10px] sm:text-xs font-bold tabular-nums ${
                        entry.delta > 0 ? "text-emerald-500" : "text-red-400"
                      }`}>
                        {entry.delta > 0 ? "+" : ""}{entry.delta}
                      </span>
                    )}
                    {/* Position change indicator */}
                    {posChange !== 0 && (
                      <span className={`text-[9px] sm:text-[10px] font-bold flex items-center gap-px ${
                        posChange > 0 ? "text-emerald-500" : "text-red-400"
                      }`} title={`Moved ${Math.abs(posChange)} position${Math.abs(posChange) > 1 ? "s" : ""} ${posChange > 0 ? "up" : "down"}`}>
                        {posChange > 0 ? (
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15" /></svg>
                        ) : (
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
                        )}
                        <span className="hidden sm:inline">{Math.abs(posChange)}</span>
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
        </div>
      </div>

    </div>
  );
}
