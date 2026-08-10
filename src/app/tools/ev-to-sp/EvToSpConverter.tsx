"use client";

import { useMemo, useState, useId } from "react";
import type { StatName } from "@/lib/types/pokemon";
import {
  evToChampionsSp,
  championsSpToEv,
  CHAMPIONS_TOTAL_SP,
  CHAMPIONS_MAX_SP_PER_STAT,
  MAX_EV_PER_STAT,
} from "@/lib/analysis/stat-calculator";

const STATS: { key: StatName; label: string; short: string }[] = [
  { key: "hp", label: "HP", short: "HP" },
  { key: "atk", label: "Attack", short: "Atk" },
  { key: "def", label: "Defense", short: "Def" },
  { key: "spa", label: "Special Attack", short: "SpA" },
  { key: "spd", label: "Special Defense", short: "SpD" },
  { key: "spe", label: "Speed", short: "Spe" },
];

/** Highest SP the input accepts — above the 32 cap so the warning can fire. */
const SP_INPUT_MAX = 99;
/** Total EVs a Pokemon may spend across all six stats. */
const TOTAL_EV_BUDGET = 508;

type Row = { ev: number; sp: number };
type Rows = Record<StatName, Row>;

const EMPTY_ROWS: Rows = {
  hp: { ev: 0, sp: 0 },
  atk: { ev: 0, sp: 0 },
  def: { ev: 0, sp: 0 },
  spa: { ev: 0, sp: 0 },
  spd: { ev: 0, sp: 0 },
  spe: { ev: 0, sp: 0 },
};

function rowsFromEvs(evs: Partial<Record<StatName, number>>): Rows {
  const next = {} as Rows;
  for (const { key } of STATS) {
    const ev = evs[key] ?? 0;
    next[key] = { ev, sp: evToChampionsSp(ev) };
  }
  return next;
}

const PRESETS: { id: string; label: string; evs: Partial<Record<StatName, number>> }[] = [
  { id: "attacker", label: "Fast attacker (252 Atk / 252 Spe / 4 HP)", evs: { atk: 252, spe: 252, hp: 4 } },
  { id: "bulky", label: "Bulky (252 HP / 252 SpD / 4 Def)", evs: { hp: 252, spd: 252, def: 4 } },
  { id: "spread", label: "Trimmed spread (236 HP / 4 Def / 156 SpA / 4 SpD / 108 Spe)", evs: { hp: 236, def: 4, spa: 156, spd: 4, spe: 108 } },
];

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, Math.round(value)));
}

export function EvToSpConverter() {
  const [rows, setRows] = useState<Rows>(EMPTY_ROWS);
  const headingId = useId();

  function setEv(stat: StatName, raw: string) {
    const ev = clamp(Number(raw), 0, MAX_EV_PER_STAT);
    setRows((prev) => ({ ...prev, [stat]: { ev, sp: evToChampionsSp(ev) } }));
  }

  function setSp(stat: StatName, raw: string) {
    const sp = clamp(Number(raw), 0, SP_INPUT_MAX);
    setRows((prev) => ({ ...prev, [stat]: { ev: championsSpToEv(sp), sp } }));
  }

  const totals = useMemo(() => {
    const totalEv = STATS.reduce((sum, s) => sum + rows[s.key].ev, 0);
    const totalSp = STATS.reduce((sum, s) => sum + rows[s.key].sp, 0);
    const overCapStats = STATS.filter((s) => rows[s.key].sp > CHAMPIONS_MAX_SP_PER_STAT);
    return {
      totalEv,
      totalSp,
      overCapStats,
      spOverBudget: totalSp > CHAMPIONS_TOTAL_SP,
      evOverBudget: totalEv > TOTAL_EV_BUDGET,
      remaining: CHAMPIONS_TOTAL_SP - totalSp,
    };
  }, [rows]);

  const statusMessage = totals.overCapStats.length
    ? `Illegal spread: ${totals.overCapStats.map((s) => s.label).join(", ")} exceeds the ${CHAMPIONS_MAX_SP_PER_STAT} SP per-stat cap.`
    : totals.spOverBudget
      ? `Over budget: ${totals.totalSp} SP used of ${CHAMPIONS_TOTAL_SP} available — remove ${totals.totalSp - CHAMPIONS_TOTAL_SP} SP.`
      : `${totals.totalSp} SP used of ${CHAMPIONS_TOTAL_SP}. ${totals.remaining} SP left to spend.`;

  const hasError = totals.spOverBudget || totals.overCapStats.length > 0;

  return (
    <section
      aria-labelledby={headingId}
      className="rounded-2xl border border-border bg-surface p-4 sm:p-6"
    >
      <h2 id={headingId} className="text-lg sm:text-xl font-extrabold text-text-primary tracking-tight mb-1">
        EV to SP Calculator
      </h2>
      <p className="text-sm text-text-secondary mb-5 leading-relaxed">
        Type EVs to see what they cost in Stat Points, or type SP to see the EV
        investment it matches. Both columns stay in sync.
      </p>

      {/* Presets */}
      <div className="flex flex-wrap gap-2 mb-5">
        {PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => setRows(rowsFromEvs(preset.evs))}
            className="inline-flex min-h-11 items-center px-3 py-2 rounded-xl bg-surface-alt border border-border text-xs font-semibold text-text-primary hover:border-accent/40 focus:outline-none focus:ring-2 focus:ring-accent/40 active:scale-[0.97] transition-all"
          >
            {preset.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setRows(EMPTY_ROWS)}
          className="inline-flex min-h-11 items-center gap-1.5 px-3 py-2 rounded-xl bg-surface-alt border border-border text-xs font-semibold text-text-secondary hover:text-text-primary hover:border-accent/40 focus:outline-none focus:ring-2 focus:ring-accent/40 active:scale-[0.97] transition-all"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
            <path d="M3 3v5h5" />
          </svg>
          Reset
        </button>
      </div>

      {/* Stat rows */}
      <div className="space-y-2">
        <div className="hidden sm:grid grid-cols-[7rem_1fr_1fr_auto] gap-3 px-1 pb-1">
          <span className="text-[11px] font-bold uppercase tracking-wide text-text-tertiary">Stat</span>
          <span className="text-[11px] font-bold uppercase tracking-wide text-text-tertiary">EVs (0&ndash;{MAX_EV_PER_STAT})</span>
          <span className="text-[11px] font-bold uppercase tracking-wide text-text-tertiary">SP (0&ndash;{CHAMPIONS_MAX_SP_PER_STAT})</span>
          <span className="text-[11px] font-bold uppercase tracking-wide text-text-tertiary">Status</span>
        </div>

        {STATS.map(({ key, label, short }) => {
          const row = rows[key];
          const overCap = row.sp > CHAMPIONS_MAX_SP_PER_STAT;
          return (
            <div
              key={key}
              className="grid grid-cols-1 sm:grid-cols-[7rem_1fr_1fr_auto] items-center gap-2 sm:gap-3 p-3 sm:p-2 rounded-xl bg-surface-alt border border-border"
            >
              <span className="text-sm font-bold text-text-primary sm:px-1">{label}</span>

              <div className="flex items-center gap-2">
                <label htmlFor={`ev-${key}`} className="sm:sr-only text-xs font-semibold text-text-secondary w-10 shrink-0">
                  EVs
                </label>
                <input
                  id={`ev-${key}`}
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={MAX_EV_PER_STAT}
                  step={4}
                  value={row.ev}
                  onChange={(e) => setEv(key, e.target.value)}
                  aria-label={`${label} EVs`}
                  aria-describedby="ev-sp-budget-status"
                  className="w-full min-h-11 px-3 py-2 bg-surface border border-border rounded-xl text-sm font-semibold text-text-primary tabular-nums focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
                />
              </div>

              <div className="flex items-center gap-2">
                <label htmlFor={`sp-${key}`} className="sm:sr-only text-xs font-semibold text-text-secondary w-10 shrink-0">
                  SP
                </label>
                <input
                  id={`sp-${key}`}
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={SP_INPUT_MAX}
                  step={1}
                  value={row.sp}
                  onChange={(e) => setSp(key, e.target.value)}
                  aria-label={`${label} Stat Points`}
                  aria-invalid={overCap || undefined}
                  aria-describedby="ev-sp-budget-status"
                  className={`w-full min-h-11 px-3 py-2 bg-surface border rounded-xl text-sm font-semibold tabular-nums focus:outline-none focus:ring-2 focus:ring-accent/40 ${
                    overCap
                      ? "border-danger text-danger focus:border-danger"
                      : "border-border text-text-primary focus:border-accent"
                  }`}
                />
              </div>

              <span
                className={`text-xs font-semibold sm:w-32 sm:text-right ${overCap ? "text-danger" : "text-text-tertiary"}`}
              >
                {overCap
                  ? `Max ${CHAMPIONS_MAX_SP_PER_STAT} SP per stat`
                  : row.ev === 0
                    ? "Uninvested"
                    : `${row.ev} EVs = ${row.sp} SP`}
                <span className="sr-only"> in {short}</span>
              </span>
            </div>
          );
        })}
      </div>

      {/* Budget summary */}
      <div
        id="ev-sp-budget-status"
        role="status"
        aria-live="polite"
        className={`mt-5 p-4 rounded-xl border ${
          hasError ? "border-danger bg-danger/10" : "border-border bg-surface-alt"
        }`}
      >
        <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
          <p className="text-sm font-bold text-text-primary tabular-nums">
            Stat Points used:{" "}
            <span className={hasError ? "text-danger" : "text-accent"}>
              {totals.totalSp}
            </span>{" "}
            / {CHAMPIONS_TOTAL_SP}
          </p>
          <p className="text-sm font-semibold text-text-secondary tabular-nums">
            EVs used: {totals.totalEv} / {TOTAL_EV_BUDGET}
          </p>
        </div>

        {/* Budget bar */}
        <div
          className="mt-3 h-2 rounded-full bg-border overflow-hidden"
          role="progressbar"
          aria-valuenow={Math.min(totals.totalSp, CHAMPIONS_TOTAL_SP)}
          aria-valuemin={0}
          aria-valuemax={CHAMPIONS_TOTAL_SP}
          aria-label="Stat Point budget used"
        >
          <div
            className={`h-full rounded-full transition-all duration-200 ${hasError ? "bg-danger" : "bg-accent"}`}
            style={{ width: `${Math.min(100, (totals.totalSp / CHAMPIONS_TOTAL_SP) * 100)}%` }}
          />
        </div>

        <p className={`mt-3 text-sm leading-relaxed ${hasError ? "text-danger font-semibold" : "text-text-secondary"}`}>
          {hasError && (
            <svg
              width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
              strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
              className="inline-block mr-1.5 -mt-0.5"
            >
              <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          )}
          {statusMessage}
        </p>

        {totals.evOverBudget && (
          <p className="mt-2 text-xs text-text-tertiary leading-relaxed">
            Note: {totals.totalEv} EVs is above the {TOTAL_EV_BUDGET} EV limit of the
            classic games, so this spread is only meaningful as a Champions SP spread.
          </p>
        )}
      </div>
    </section>
  );
}
