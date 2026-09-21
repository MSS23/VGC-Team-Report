"use client";

import { useId, useMemo, useState } from "react";
import type { ParsedPokemon } from "@/lib/types/pokemon";
import type { CalcCategory } from "@/hooks/useDamageCalcs";
import { parseShowdownPaste } from "@/lib/parser/showdown-parser";
import { isChampionsFormat } from "@/lib/data/tags";
import { calculateReportDamage, type DamageOptions } from "@/lib/analysis/damage-calculator";

const PRESETS = [
  "Incineroar @ Sitrus Berry\nAbility: Intimidate\nEVs: 252 HP / 4 Atk / 252 SpD\nCareful Nature\n- Flare Blitz\n- Knock Off\n- Fake Out",
  "Rillaboom @ Assault Vest\nAbility: Grassy Surge\nEVs: 252 HP / 252 Atk / 4 SpD\nAdamant Nature\n- Wood Hammer\n- Grassy Glide",
  "Amoonguss @ Sitrus Berry\nAbility: Regenerator\nEVs: 252 HP / 156 Def / 100 SpD\nBold Nature\n- Pollen Puff\n- Sludge Bomb",
  "Flutter Mane @ Choice Specs\nAbility: Protosynthesis\nEVs: 4 HP / 252 SpA / 252 Spe\nTimid Nature\n- Moonblast\n- Shadow Ball",
].map((paste) => parseShowdownPaste(paste).pokemon[0]);

const control = "w-full min-h-11 rounded-lg border border-border bg-surface px-3 py-2 text-base text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent";

interface Props {
  pokemon: ParsedPokemon;
  team: ParsedPokemon[];
  regulation?: string;
  onAddCalc: (text: string, category: CalcCategory) => void;
}

export default function InlineDamageCalculator({ pokemon, team, regulation, onAddCalc }: Props) {
  const id = useId();
  const [opponentKey, setOpponentKey] = useState("preset:0");
  const [paste, setPaste] = useState("");
  const [direction, setDirection] = useState<"offensive" | "defensive">("offensive");
  const [move, setMove] = useState("");
  const [ownTera, setOwnTera] = useState(false);
  const [opponentTera, setOpponentTera] = useState(false);
  const [weather, setWeather] = useState("");
  const [terrain, setTerrain] = useState("");
  const [screen, setScreen] = useState(false);
  const [savedDescription, setSavedDescription] = useState("");
  const imported = useMemo(() => parseShowdownPaste(paste), [paste]);
  const [source, index] = opponentKey.split(":");
  const opponent = source === "paste" ? imported.pokemon[0] : source === "team" ? team[Number(index)] : PRESETS[Number(index)];
  const attacker = direction === "offensive" ? pokemon : opponent;
  const defender = direction === "offensive" ? opponent : pokemon;
  const selectedMove = attacker?.moves.includes(move) ? move : attacker?.moves[0] ?? "";
  const champions = isChampionsFormat(regulation);
  const outcome = useMemo(() => {
    if (!attacker || !defender) return { error: "Paste one opponent's Showdown set to calculate damage." };
    if (source === "paste" && imported.pokemon.length !== 1) return { error: "Paste exactly one opponent's set." };
    try {
      return { result: calculateReportDamage(attacker, defender, selectedMove, {
        regulation,
        attackerTera: direction === "offensive" ? ownTera : opponentTera,
        defenderTera: direction === "offensive" ? opponentTera : ownTera,
        field: {
          weather: (weather || undefined) as NonNullable<DamageOptions["field"]>["weather"],
          terrain: (terrain || undefined) as NonNullable<DamageOptions["field"]>["terrain"],
          defenderSide: { isReflect: screen, isLightScreen: screen },
        },
      }) };
    } catch (error) {
      return { error: error instanceof Error ? error.message : "Could not calculate this matchup." };
    }
  }, [attacker, defender, selectedMove, regulation, direction, ownTera, opponentTera, weather, terrain, screen, source, imported.pokemon.length]);
  const result = outcome.result;
  const isSaved = result?.description === savedDescription;

  return (
    <section aria-label="Inline damage calculator" className="space-y-4 rounded-xl border border-border bg-surface-alt p-4">
      <h4 className="text-base font-bold">Damage calculator</h4>
      <p className="text-sm text-text-secondary">Level 50 doubles. Your current set and displayed form are loaded automatically.</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <label htmlFor={`${id}-direction`} className="space-y-1 text-sm text-text-secondary">
          <span>Calculation</span>
          <select id={`${id}-direction`} className={control} value={direction} onChange={(e) => { setDirection(e.target.value as typeof direction); setMove(""); }}>
            <option value="offensive">{pokemon.species} attacks</option>
            <option value="defensive">{pokemon.species} defends</option>
          </select>
        </label>
        <label htmlFor={`${id}-opponent`} className="space-y-1 text-sm text-text-secondary">
          <span>Opponent set</span>
          <select id={`${id}-opponent`} className={control} value={opponentKey} onChange={(e) => setOpponentKey(e.target.value)}>
            <optgroup label="Example benchmarks">
              {PRESETS.map((p, i) => <option key={i} value={`preset:${i}`}>{p.species} (example spread)</option>)}
            </optgroup>
            <optgroup label="From this report">
              {team.map((p, i) => <option key={i} value={`team:${i}`}>{p.species} (slot {i + 1})</option>)}
            </optgroup>
            <option value="paste:0">Paste an opponent set</option>
          </select>
        </label>
      </div>
      {source === "paste" && <label htmlFor={`${id}-paste`} className="block space-y-1 text-sm text-text-secondary">
        <span>Opponent Showdown set</span>
        <textarea id={`${id}-paste`} className={`${control} min-h-32 font-mono`} value={paste} onChange={(e) => setPaste(e.target.value)} />
      </label>}
      {opponent && <p className="text-sm text-text-secondary">Opponent: {opponent.nature}, {opponent.item ?? "no item"}, {opponent.ability ?? "default ability"}. Investment: {Object.entries(opponent.evs).filter(([, value]) => value > 0).map(([stat, value]) => `${value} ${stat.toUpperCase()}`).join(" / ") || "none"}{champions ? " (converted to Champions SP)" : " EVs"}.</p>}
      <label htmlFor={`${id}-move`} className="block space-y-1 text-sm text-text-secondary">
        <span>Attacking move</span>
        <select id={`${id}-move`} className={control} value={selectedMove} onChange={(e) => setMove(e.target.value)}>
          {attacker?.moves.map((name) => <option key={name}>{name}</option>)}
        </select>
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label htmlFor={`${id}-weather`} className="space-y-1 text-sm text-text-secondary">
          <span>Weather</span>
          <select id={`${id}-weather`} className={control} value={weather} onChange={(e) => setWeather(e.target.value)}>
            <option value="">None</option>{["Sun", "Rain", "Sand", "Snow"].map((value) => <option key={value}>{value}</option>)}
          </select>
        </label>
        <label htmlFor={`${id}-terrain`} className="space-y-1 text-sm text-text-secondary">
          <span>Terrain</span>
          <select id={`${id}-terrain`} className={control} value={terrain} onChange={(e) => setTerrain(e.target.value)}>
            <option value="">None</option>{["Electric", "Grassy", "Psychic", "Misty"].map((value) => <option key={value}>{value}</option>)}
          </select>
        </label>
      </div>
      <div className="flex flex-wrap gap-4 text-sm">
        {!champions && <>
          <label className="flex min-h-11 cursor-pointer items-center gap-2"><input type="checkbox" checked={ownTera} disabled={!pokemon.teraType} onChange={(e) => setOwnTera(e.target.checked)} className="accent-accent focus-visible:ring-2 focus-visible:ring-accent" />Your Tera ({pokemon.teraType ?? "not set"})</label>
          <label className="flex min-h-11 cursor-pointer items-center gap-2"><input type="checkbox" checked={opponentTera} disabled={!opponent?.teraType} onChange={(e) => setOpponentTera(e.target.checked)} className="accent-accent focus-visible:ring-2 focus-visible:ring-accent" />Opponent Tera ({opponent?.teraType ?? "not set"})</label>
        </>}
        <label className="flex min-h-11 cursor-pointer items-center gap-2"><input type="checkbox" checked={screen} onChange={(e) => setScreen(e.target.checked)} className="accent-accent focus-visible:ring-2 focus-visible:ring-accent" />Defender has screens</label>
      </div>
      <p className="text-sm text-text-secondary">Full HP, no stat boosts or status conditions. Set weather and terrain for the battle you want to check.</p>
      <div aria-live="polite" className="space-y-2">
        {outcome.error && <p role="alert" className="border-l-2 border-danger pl-3 text-sm text-text-primary">{outcome.error}</p>}
        {result && <>
          <p className="text-lg font-bold tabular-nums">{result.min}–{result.max} HP ({result.minPercent}–{result.maxPercent}%)</p>
          <p className="text-sm font-semibold">{result.survival}</p>
          <p className="text-sm text-text-secondary">{result.description}</p>
        </>}
      </div>
      <button type="button" disabled={!result || isSaved} onClick={() => { if (result) { onAddCalc(result.description, direction); setSavedDescription(result.description); } }} className="min-h-11 rounded-lg bg-text-primary px-4 py-2 font-bold text-background cursor-pointer hover:brightness-110 active:brightness-90 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2">
        {isSaved ? "Saved to report" : "Save this calculation"}
      </button>
      <a href="https://github.com/smogon/damage-calc" target="_blank" rel="noreferrer" className="flex min-h-11 items-center text-sm text-text-secondary underline focus-visible:ring-2 focus-visible:ring-accent">Powered by the Smogon damage calculator</a>
    </section>
  );
}
