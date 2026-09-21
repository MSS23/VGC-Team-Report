"use client";

import { useId, useMemo, useState } from "react";
import type { ParsedPokemon, StatSpread } from "@/lib/types/pokemon";
import { parseShowdownPaste } from "@/lib/parser/showdown-parser";
import { evaluateSpread, initialSpread, SPREAD_STATS, spreadRules, spreadStats, spreadTotal, suggestSpread, wastedInvestment } from "@/lib/analysis/spread-builder";

const control = "min-h-11 w-full rounded-lg border border-border bg-surface px-3 py-2 text-base focus-visible:ring-2 focus-visible:ring-accent";
export default function SpreadBuilder({ pokemon, regulation, onApply }: { pokemon: ParsedPokemon; regulation?: string; onApply: (spread: StatSpread, reasoning: string) => void }) {
  const id = useId();
  const rules = spreadRules(regulation);
  const baseline = useMemo(() => initialSpread(pokemon, regulation), [pokemon, regulation]);
  const [spread, setSpread] = useState(baseline);
  const [paste, setPaste] = useState("Arcanine\nAbility: Intimidate\nEVs: 252 Atk / 252 Spe / 4 HP\nJolly Nature\n- Extreme Speed\n- Flare Blitz");
  const [move, setMove] = useState("Extreme Speed");
  const [survive, setSurvive] = useState(true);
  const [outspeed, setOutspeed] = useState(true);
  const [speedBoost, setSpeedBoost] = useState(1);
  const [message, setMessage] = useState("");
  const [reason, setReason] = useState("");
  const parsed = useMemo(() => parseShowdownPaste(paste), [paste]);
  const opponent = parsed.pokemon[0];
  const selectedMove = opponent?.moves.includes(move) ? move : opponent?.moves[0] ?? "";
  const total = spreadTotal(spread);
  const legal = total <= rules.total && SPREAD_STATS.every((stat) => spread[stat] >= 0 && spread[stat] <= rules.max);
  const outcome = useMemo(() => {
    try {
      if (!legal) throw new Error(`Keep the spread within ${rules.total} ${rules.unit}.`);
      if (parsed.pokemon.length !== 1) throw new Error("Paste exactly one opponent set for the benchmarks.");
      const result = evaluateSpread(pokemon, spread, { opponent, move: selectedMove, survive, outspeed, speedBoost }, regulation);
      return { result, stats: spreadStats(pokemon, spread, regulation), before: spreadStats(pokemon, baseline, regulation), wasted: wastedInvestment(pokemon, spread, regulation) };
    } catch (error) { return { error: error instanceof Error ? error.message : "Cannot calculate this spread." }; }
  }, [pokemon, spread, baseline, opponent, parsed.pokemon.length, selectedMove, survive, outspeed, speedBoost, regulation, legal, rules.total, rules.unit]);
  const benchmarkReason = outcome.result ? [
    `${rules.unit}: ${SPREAD_STATS.map((s) => `${spread[s]} ${s.toUpperCase()}`).join(" / ")} (${pokemon.nature}).`,
    survive && outcome.result.damage ? `${outcome.result.damage.description} ${outcome.result.survives ? "Survives every roll at full HP." : "Survival is not guaranteed."}` : "",
    outspeed ? `Speed at ${speedBoost >= 0 ? "+" : ""}${speedBoost}: ${outcome.result.speed} vs ${opponent.species} ${outcome.result.opponentSpeed}; ${outcome.result.outspeeds ? "outspeeds" : "does not outspeed"}.` : "",
    "Level 50, no weather, terrain, Tera, screens, or speed abilities. Opponent at +0.", reason.trim(),
  ].filter(Boolean).join(" ") : "";
  function suggest() {
    try {
      if (!opponent || parsed.pokemon.length !== 1) throw new Error("Paste one opponent set first.");
      const result = suggestSpread(pokemon, spread, { opponent, move: selectedMove, survive, outspeed, speedBoost }, regulation);
      if (!result) throw new Error("No spread meets these targets within the budget. Try a different nature, boost, or benchmark.");
      setSpread(result); setMessage("Suggested minimum investment for these targets. Review the comparison before saving.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "No suggestion available."); }
  }
  return <section aria-label="Spread builder" className="space-y-4 rounded-xl border border-border bg-surface-alt p-4">
    <h4 className="font-bold">{rules.unit} spread builder</h4>
    <p className="text-sm text-text-secondary">Adjust your spread and compare it with the current report. Nature, IVs, item, and form stay fixed. {total}/{rules.total} {rules.unit} used.</p>
    <div className="space-y-2">{SPREAD_STATS.map((stat) => <div key={stat} className="grid grid-cols-[3rem_1fr_3rem] items-center gap-3"><label htmlFor={`${id}-${stat}`} className="text-sm font-semibold uppercase">{stat}</label><input id={`${id}-${stat}`} aria-valuetext={`${spread[stat]} ${rules.unit}`} type="range" min={0} max={rules.max} step={rules.step} value={spread[stat]} onChange={(e) => { const others = total - spread[stat]; const value = Math.min(Number(e.target.value), Math.max(0, rules.total - others)); setSpread({ ...spread, [stat]: Math.floor(value / rules.step) * rules.step }); setMessage(""); }} className="h-11 w-full accent-accent focus-visible:ring-2 focus-visible:ring-accent" /><output htmlFor={`${id}-${stat}`} className="text-right text-sm tabular-nums">{spread[stat]}</output></div>)}</div>
    {outcome.stats && <div className="overflow-x-auto"><table className="w-full text-sm"><caption className="mb-2 text-left font-semibold">Stats: current report → proposed spread</caption><thead><tr>{SPREAD_STATS.map((s) => <th key={s} scope="col" className="p-1 uppercase">{s}</th>)}</tr></thead><tbody><tr>{SPREAD_STATS.map((s) => <td key={s} className="p-1 text-center">{outcome.before![s]} → {outcome.stats![s]}<span className="block">({outcome.stats![s] - outcome.before![s] >= 0 ? "+" : ""}{outcome.stats![s] - outcome.before![s]})</span></td>)}</tr></tbody></table></div>}
    {outcome.wasted && spreadTotal(outcome.wasted) > 0 && <p className="text-sm">Same stats with less investment: {SPREAD_STATS.filter((s) => outcome.wasted![s]).map((s) => `${outcome.wasted![s]} ${rules.unit} in ${s.toUpperCase()}`).join(", ")} can be removed.</p>}
    <label htmlFor={`${id}-opponent`} className="block space-y-2 text-sm"><span>Benchmark opponent (Showdown set)</span><textarea id={`${id}-opponent`} value={paste} onChange={(e) => setPaste(e.target.value)} rows={5} className={control} /></label>
    <label className="flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" checked={survive} onChange={(e) => setSurvive(e.target.checked)} className="h-5 w-5 focus-visible:ring-2 focus-visible:ring-accent" />Survive every damage roll from full HP</label>
    {survive && <label htmlFor={`${id}-move`} className="block space-y-2 text-sm"><span>Incoming move</span><select id={`${id}-move`} value={selectedMove} onChange={(e) => setMove(e.target.value)} className={control}>{opponent?.moves.map((m) => <option key={m}>{m}</option>)}</select></label>}
    <label className="flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" checked={outspeed} onChange={(e) => setOutspeed(e.target.checked)} className="h-5 w-5 focus-visible:ring-2 focus-visible:ring-accent" />Outspeed this opponent</label>
    {outspeed && <label htmlFor={`${id}-boost`} className="block space-y-2 text-sm"><span>Your Speed stage (opponent +0)</span><select id={`${id}-boost`} value={speedBoost} onChange={(e) => setSpeedBoost(Number(e.target.value))} className={control}>{[0, 1, 2].map((n) => <option key={n} value={n}>+{n}</option>)}</select></label>}
    <p className="text-sm text-text-secondary">Level 50 doubles, no weather, terrain, Tera, screens, or Speed abilities. Choice Scarf is included. Suggestion minimizes HP, the incoming move&apos;s defensive stat, and Speed; other allocations and nature are fixed.</p>
    {outcome.error ? <p role="alert">{outcome.error}</p> : <p className="text-sm">{survive && outcome.result?.damage ? `${outcome.result.damage.minPercent}–${outcome.result.damage.maxPercent}% damage. ${outcome.result.survives ? "Survival target met." : "Survival target not met."} ` : ""}{outspeed ? `Speed ${outcome.result?.speed} vs ${outcome.result?.opponentSpeed}: ${outcome.result?.outspeeds ? "target met" : "target not met"}.` : ""}</p>}
    <div className="flex flex-wrap gap-3"><button type="button" onClick={suggest} className="min-h-11 cursor-pointer rounded-lg border border-border px-3 font-semibold focus-visible:ring-2 focus-visible:ring-accent hover:bg-surface">Suggest allocation</button><button type="button" onClick={() => { setSpread(baseline); setMessage(""); }} className="min-h-11 cursor-pointer rounded-lg border border-border px-3 focus-visible:ring-2 focus-visible:ring-accent hover:bg-surface">Reset spread</button></div>
    <label htmlFor={`${id}-reason`} className="block space-y-2 text-sm"><span>Additional reasoning (optional)</span><textarea id={`${id}-reason`} value={reason} onChange={(e) => setReason(e.target.value)} rows={2} className={control} /></label>
    <button type="button" disabled={!outcome.result || !legal} onClick={() => { onApply(spread, benchmarkReason); setMessage("Spread and benchmark reasoning saved to this report."); }} className="min-h-11 cursor-pointer rounded-lg bg-text-primary px-4 font-bold text-background disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2">Apply spread and save reasoning</button>
    <p role="status" className="text-sm">{message}</p>
  </section>;
}
