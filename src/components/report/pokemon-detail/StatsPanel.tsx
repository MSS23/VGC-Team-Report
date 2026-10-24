"use client";
import { useTranslation } from "@/lib/i18n";
import { isChampionsFormat } from "@/lib/data/tags";
import { convertToChampionsSp, CHAMPIONS_TOTAL_SP, CHAMPIONS_MAX_SP_PER_STAT } from "@/lib/analysis/stat-calculator";
import { StatColorNote } from "../StatColorNote";
import type { PokemonDetailModel } from "./usePokemonDetailModel";
const STAT_COLORS: Record<string, string> = {
  hp: "var(--stat-hp)",
  atk: "var(--stat-atk)",
  def: "var(--stat-def)",
  spa: "var(--stat-spa)",
  spd: "var(--stat-spd)",
  spe: "var(--stat-spe)",
};

export function StatsPanel({ model, regulation }: { model: PokemonDetailModel; regulation?: string }) {
const { t } = useTranslation();
const { parsed, displayData, relevantStats, displayStats, itemBoost, natureData, statLabels, showMega, baseStatsForComparison, championsStats, megaStats } = model;

    if (!displayData) return null;
    const isChampions = isChampionsFormat(regulation);
    const totalEvs = Object.values(parsed.evs).reduce((a, b) => a + b, 0);
    const spSpread = convertToChampionsSp(parsed.evs);
    const totalSp = (["hp", "atk", "def", "spa", "spd", "spe"] as const).reduce((sum, s) => sum + spSpread[s], 0);

    return (
    <div>
      <div className="flex items-center gap-2 sm:gap-3 mb-2.5 sm:mb-3 flex-wrap">
        <h3 className="text-xs font-extrabold uppercase tracking-widest text-text-tertiary">
          {t.stats} <span className="normal-case tracking-normal font-medium text-text-tertiary/70">({parsed.nature})</span>
        </h3>

        {isChampions ? (() => {
          // Reg M-A is an SP-only format. EV totals are misleading here
          // (66 SP ≠ 66 EVs — the conversion curve is non-linear), so the
          // budget badge stays SP-native instead of offering an EV toggle
          // that would mix two unit systems.
          const spOver = totalSp > CHAMPIONS_TOTAL_SP;
          const spUnder = totalSp < CHAMPIONS_TOTAL_SP && totalSp > 0;
          const spDot = spOver ? "bg-danger" : spUnder ? "bg-amber-500" : "bg-emerald-500";
          return (
            <div
              className="inline-flex h-8 sm:h-9 items-center rounded-lg bg-surface-alt border border-border px-2.5 sm:px-3 gap-1.5 ml-auto"
              aria-label={`Stat Points: ${totalSp} of ${CHAMPIONS_TOTAL_SP}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${spDot}`} aria-hidden />
              <span className="text-[11px] sm:text-xs font-semibold tracking-wide tabular-nums text-text-secondary">SP</span>
              <span className="text-[11px] sm:text-xs font-semibold tabular-nums text-text-tertiary">
                {totalSp}/{CHAMPIONS_TOTAL_SP}
              </span>
            </div>
          );
        })() : totalEvs > 0 ? (
          /* Traditional VGC cap: 508 is the usable maximum. The game allows
             510 total but the last 2 EVs in a 252 slot provide no stat gain,
             so 508 is the correctly optimized target (e.g. 252/252/4 = 508). */
          <span className={`text-xs sm:text-sm font-bold ml-auto tabular-nums ${
            totalEvs > 508 ? "text-danger" : totalEvs < 508 ? "text-amber-500" : "text-text-tertiary/50"
          }`}>
            {totalEvs}/508{totalEvs < 508 && ` · ${508 - totalEvs} left`}
          </span>
        ) : null}
      </div>

      <div className="space-y-1 sm:space-y-1.5 stagger-stats">
        {(["hp", "atk", "def", "spa", "spd", "spe"] as const).filter((stat) => relevantStats.has(stat)).map(
          (stat) => {
            const value = displayStats[stat];
            const ev = parsed.evs[stat];
            const sp = spSpread[stat];
            const iv = parsed.ivs[stat];
            const isBoosted = itemBoost?.stat === stat;
            // Recompute from displayStats so Champions SP recalcs and Mega
            // form swaps feed the multiplier the correct base — itemBoost
            // carries the multiplier (and picks the boosted stat for
            // Booster Energy) but its baked-in boostedValue was computed
            // against the standard-EV calculatedStats and goes stale.
            const displayValue = isBoosted && itemBoost
              ? Math.floor(value * itemBoost.multiplier)
              : value;
            const maxStat = stat === "hp" ? 300 : 250;
            const percentage = Math.min((displayValue / maxStat) * 100, 100);
            const hasNonDefaultIv = iv !== 31;

            // Reg M-A: SP only. Other regs: EVs.
            const showSp = isChampions;
            const investLabel = showSp ? sp : ev;
            const investUnit = showSp ? "SP" : "";
            const isOverMax = isChampions && sp > CHAMPIONS_MAX_SP_PER_STAT;

            const natureUp = natureData?.plus === stat;
            const natureDown = natureData?.minus === stat;
            const hasBuff = natureUp || isBoosted;
            const hasNerf = natureDown;

            return (
              <div key={stat} className="flex items-center gap-2" aria-label={`${statLabels[stat]}: ${displayValue}${natureUp ? ", boosted by nature" : ""}${natureDown ? ", reduced by nature" : ""}${isBoosted ? ", boosted by item" : ""}`}>
                <span className="text-xs font-bold w-11 text-right uppercase text-text-tertiary flex items-center justify-end gap-0.5 flex-shrink-0">
                  {natureUp && <span className="text-[12px] text-emerald-500 dark:text-emerald-400 leading-none" aria-label="boosted by nature">{"\u25B2"}</span>}
                  {natureDown && <span className="text-[12px] text-rose-500 dark:text-rose-400 leading-none" aria-label="reduced by nature">{"\u25BC"}</span>}
                  {statLabels[stat]}
                </span>
                <div className="flex-1 h-3 sm:h-3.5 bg-surface-alt rounded-full overflow-hidden shadow-inner">
                  <div
                    className="h-full rounded-full animate-bar-fill"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: isBoosted ? "#f59e0b" : STAT_COLORS[stat],
                    }}
                  />
                </div>
                {/* Number value — color coded for nature/item modifiers.
                    The up/down arrows live exclusively on the left next
                    to the stat label so each affected stat shows exactly
                    one arrow (not two). */}
                <span className={`text-xs sm:text-sm font-[family-name:var(--font-mono)] font-bold w-8 text-right tabular-nums ${
                  isBoosted ? "text-amber-500" : hasBuff ? "text-emerald-600 dark:text-emerald-400" : hasNerf ? "text-rose-600 dark:text-rose-400" : "text-text-secondary"
                }`}>
                  {displayValue}
                </span>
                <div className="flex items-center gap-1 w-16">
                  {investLabel > 0 ? (
                    <span className={`text-xs font-bold ${isOverMax && showSp ? "text-amber-500" : "text-accent"}`}>
                      +{investLabel}{investUnit && <span className="text-[10px] ml-px">{investUnit}</span>}
                    </span>
                  ) : null}
                  {hasNonDefaultIv && (
                    <span className="text-xs text-text-tertiary font-semibold" title={`${iv} IV`}>
                      {iv}iv
                    </span>
                  )}
                </div>
              </div>
            );
          }
        )}
      </div>
      {/* Clarify that bar colors are a fixed per-stat palette (which stat),
          not a percentile/quality ranking — a common point of confusion.
          Dismissible; hides everywhere once the user gets it. */}
      <StatColorNote />

      {/* Mega stat delta strip — shows base → mega changes when Mega is active.
          Uses championsStats in Reg M-A (SP-based) and megaStats otherwise so
          the delta always matches what the stat bars above actually display. */}
      {showMega && baseStatsForComparison && (() => {
        const megaForDelta = championsStats ?? megaStats;
        if (!megaForDelta) return null;
        const STAT_ORDER = ["hp", "atk", "def", "spa", "spd", "spe"] as const;
        const changed = STAT_ORDER.filter(
          (stat) => megaForDelta[stat] !== baseStatsForComparison[stat]
        );
        if (changed.length === 0) return null;
        return (
          <div className="mt-3 pt-3 border-t border-border-subtle" aria-label="Mega stat changes">
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-purple-400/70 mb-2 presenting:text-xs">
              Mega boosts
            </p>
            <div className="flex flex-wrap gap-1.5">
              {changed.map((stat) => {
                const delta = megaForDelta[stat] - baseStatsForComparison[stat];
                const positive = delta > 0;
                return (
                  <span
                    key={stat}
                    className={`inline-flex items-center gap-1 text-[11px] sm:text-xs font-bold px-2 py-1 rounded-md presenting:text-sm ${
                      positive
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                    }`}
                    aria-label={`${statLabels[stat as keyof typeof statLabels]}: ${baseStatsForComparison[stat]} to ${megaForDelta[stat]}, ${positive ? "+" : ""}${delta}`}
                  >
                    <span className="uppercase text-text-tertiary font-extrabold tracking-widest text-[10px]">
                      {statLabels[stat as keyof typeof statLabels]}
                    </span>
                    <span className="font-[family-name:var(--font-mono)] tabular-nums">
                      {baseStatsForComparison[stat]}
                    </span>
                    <span className="text-text-tertiary opacity-60">{"→"}</span>
                    <span className="font-[family-name:var(--font-mono)] tabular-nums">
                      {megaForDelta[stat]}
                    </span>
                    <span className="opacity-80">({positive ? "+" : ""}{delta})</span>
                  </span>
                );
              })}
            </div>
          </div>
        );
      })()}
    </div>
    );
  
}
