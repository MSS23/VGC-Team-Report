"use client";

import { useId, useMemo, useState } from "react";
import { parseShowdownPaste } from "@/lib/parser/showdown-parser";
import { buildThreatMatrix, defensiveWeaknesses, findCoverageGaps } from "@/lib/analysis/threat-matrix";
import type { ParsedPokemon } from "@/lib/types/pokemon";

const EXAMPLES = `Incineroar @ Sitrus Berry
Ability: Intimidate
EVs: 252 HP / 4 Atk / 252 SpD
Careful Nature
- Flare Blitz
- Knock Off

Rillaboom
Ability: Grassy Surge
EVs: 252 HP / 252 Atk / 4 SpD
Adamant Nature
- Wood Hammer
- Grassy Glide

Gengar @ Sitrus Berry
Ability: Cursed Body
EVs: 4 HP / 252 SpA / 252 Spe
Timid Nature
- Shadow Ball
- Sludge Bomb

Garchomp
Ability: Rough Skin
EVs: 4 HP / 252 Atk / 252 Spe
Jolly Nature
- Earthquake
- Dragon Claw

Tyranitar
Ability: Sand Stream
EVs: 252 HP / 252 Atk / 4 SpD
Adamant Nature
- Rock Slide
- Crunch

Rotom-Wash @ Sitrus Berry
Ability: Levitate
EVs: 252 HP / 252 SpA / 4 SpD
Modest Nature
- Hydro Pump
- Thunderbolt`;

export default function ThreatMatrix({ team, regulation }: { team: ParsedPokemon[]; regulation?: string }) {
  const id = useId();
  const [paste, setPaste] = useState(EXAMPLES);
  const [direction, setDirection] = useState<"offense" | "defense">("offense");
  const [selected, setSelected] = useState("");
  const [exportError, setExportError] = useState("");
  const opponents = useMemo(() => parseShowdownPaste(paste), [paste]);
  const valid = opponents.pokemon.length > 0 && opponents.pokemon.length <= 6;
  const offense = useMemo(() => valid ? buildThreatMatrix(team, opponents.pokemon, regulation) : [], [team, opponents, regulation, valid]);
  const defense = useMemo(() => valid ? buildThreatMatrix(opponents.pokemon, team, regulation) : [], [team, opponents, regulation, valid]);
  const gaps = useMemo(() => valid ? findCoverageGaps(offense, opponents.pokemon) : [], [offense, opponents, valid]);
  const weaknesses = useMemo(() => defensiveWeaknesses(team), [team]);
  const attacking = direction === "offense" ? team : opponents.pokemon;
  const defending = direction === "offense" ? opponents.pokemon : team;
  const matrix = direction === "offense" ? offense : defense;

  function exportImage() {
    try {
      setExportError("");
      const canvas = document.createElement("canvas");
      canvas.width = 1500;
      canvas.height = 240 + attacking.length * 90;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Image export is unavailable in this browser.");
      ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#111827"; ctx.font = "bold 28px sans-serif";
      ctx.fillText(`VGC Team Report — ${direction === "offense" ? "Your attacks" : "Opponent attacks"}`, 24, 40);
      ctx.font = "18px sans-serif";
      ctx.fillText("Best move's damage range (% HP). Level 50 doubles, no Tera / boosts / weather / terrain / screens.", 24, 78);
      defending.forEach((p, j) => ctx.fillText(p.species, 235 + j * 207, 123, 195));
      attacking.forEach((p, i) => {
        const y = 145 + i * 90;
        ctx.fillStyle = "#111827"; ctx.font = "bold 18px sans-serif"; ctx.fillText(p.species, 24, y + 35, 195);
        matrix[i].forEach((cell, j) => {
          const x = 230 + j * 207;
          ctx.fillStyle = cell.damage && cell.damage.maxPercent >= 50 ? direction === "offense" ? "#dcfce7" : "#fee2e2" : "#f3f4f6";
          ctx.fillRect(x, y, 200, 80); ctx.fillStyle = "#111827"; ctx.font = "18px sans-serif";
          ctx.fillText(cell.damage ? `${cell.damage.minPercent}–${cell.damage.maxPercent}%${cell.errors.length ? "*" : ""}` : "N/A", x + 8, y + 28);
          ctx.font = "14px sans-serif"; ctx.fillText(cell.move || "No calculation", x + 8, y + 58, 184);
        });
      });
      ctx.fillStyle = "#111827"; ctx.font = "16px sans-serif";
      ctx.fillText("Example or pasted spreads; * some moves unsupported. Full HP. Damage does not account for turn order.", 24, canvas.height - 25);
      canvas.toBlob((blob) => {
        if (!blob) { setExportError("Image export failed."); return; }
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.download = `vgc-${direction}-matrix.png`; link.href = url;
        document.body.appendChild(link); link.click(); link.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
      }, "image/png");
    } catch (error) { setExportError(error instanceof Error ? error.message : "Image export failed."); }
  }

  return <section aria-label="Six versus six threat matrix" className="mx-auto mt-6 max-w-5xl space-y-4 rounded-xl border border-border bg-surface p-4 sm:p-6">
    <h3 className="text-lg font-bold">Six versus six threat analysis</h3>
    <p className="text-sm text-text-secondary">Compare your team against these example threats or paste an opponent team. Each cell uses the strongest move by maximum damage. Green marks your attacks reaching 50% HP; red marks theirs. Percentages and move names also identify the threat.</p>
    <details><summary className="min-h-11 cursor-pointer py-2 font-semibold focus-visible:ring-2 focus-visible:ring-accent">Opponent sets and spreads</summary>
      <label htmlFor={`${id}-paste`} className="block text-sm">Opponent Showdown paste (1–6 Pokémon)</label>
      <textarea id={`${id}-paste`} value={paste} onChange={(e) => { setPaste(e.target.value); setSelected(""); }} rows={8} className="mt-2 w-full rounded-lg border border-border bg-surface-alt p-3 text-base focus-visible:ring-2 focus-visible:ring-accent" />
    </details>
    <p className="text-sm text-text-secondary">Level 50 doubles, full HP, no Tera, boosts, weather, terrain, or screens. Uses the forms in each paste. Missing spreads are uninvested. Examples are illustrative, not format legality recommendations.</p>
    {opponents.warnings.length > 0 && <p role="status" className="text-sm">{opponents.warnings.join(" ")}</p>}
    {!valid ? <p role="alert">Paste between one and six Pokémon.</p> : <>
      <div className="flex flex-wrap items-end gap-4">
        <label htmlFor={`${id}-direction`} className="space-y-1 text-sm"><span className="block">Attacking side</span><select id={`${id}-direction`} value={direction} onChange={(e) => { setDirection(e.target.value as typeof direction); setSelected(""); }} className="min-h-11 rounded-lg border border-border bg-surface px-3 text-base focus-visible:ring-2 focus-visible:ring-accent"><option value="offense">Your team attacks</option><option value="defense">Opponent attacks</option></select></label>
        <button onClick={exportImage} className="min-h-11 cursor-pointer rounded-lg border border-border px-4 font-semibold hover:bg-surface-alt focus-visible:ring-2 focus-visible:ring-accent">Export matrix image</button>
      </div>
      {exportError && <p role="alert">{exportError}</p>}
      <div className="overflow-x-auto rounded-lg border border-border" role="region" aria-label="Damage matrix, scroll horizontally for all opponents" tabIndex={0}>
        <table className="w-full text-sm"><caption className="sr-only">Rows attack columns. Select a cell for its calculation. Asterisk means a move could not be calculated.</caption><thead><tr><th scope="col" className="p-3 text-left">Attacker / Defender</th>{defending.map((p, i) => <th scope="col" key={i} className="min-w-32 p-3">{p.species}</th>)}</tr></thead><tbody>{attacking.map((p, i) => <tr key={i}><th scope="row" className="p-3 text-left">{p.species}</th>{matrix[i].map((cell, j) => <td key={j} className={`border border-border ${cell.damage && cell.damage.maxPercent >= 50 ? direction === "offense" ? "bg-success/15" : "bg-danger/15" : "bg-surface-alt"}`}><button className="min-h-16 w-full cursor-pointer p-2 text-text-primary focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent" onClick={() => setSelected([cell.damage?.description ?? "No direct damage calculated.", ...cell.errors].join(" "))} aria-label={`${p.species} attacking ${defending[j].species}: ${cell.damage ? `${cell.move}, ${cell.damage.minPercent} to ${cell.damage.maxPercent} percent` : "unavailable"}`}><span className="block font-bold">{cell.damage ? `${cell.damage.minPercent}–${cell.damage.maxPercent}%` : "N/A"}{cell.errors.length ? "*" : ""}</span><span className="text-xs">{cell.move || "No damage move"}</span></button></td>)}</tr>)}</tbody></table>
      </div>
      <p role="status" className="min-h-6 text-sm">{selected || "Select a cell to see its calculation. * Some moves could not be calculated."}</p>
      <div className="grid gap-4 sm:grid-cols-2"><div><h4 className="font-semibold">Coverage gaps</h4>{gaps.length ? <ul className="mt-2 space-y-2 text-sm">{gaps.map((gap, i) => <li key={i}>{gap.species}: every calculated hit is below 50%. {gap.types.length ? `Consider ${gap.types.join(" / ")} coverage, then test its damage.` : "Consider stronger neutral damage or support."}</li>)}</ul> : <p className="mt-2 text-sm text-text-secondary">No confirmed gaps below 50% among the calculated targets. Unsupported moves are excluded from gap conclusions.</p>}</div>
        <div><h4 className="font-semibold">Shared type weaknesses</h4>{weaknesses.length ? <ul className="mt-2 space-y-2 text-sm">{weaknesses.map((w) => <li key={w.type}>{w.type}: {w.members.join(", ")}. Consider a resistance or immunity when choosing your fourth Pokémon.</li>)}</ul> : <p className="mt-2 text-sm text-text-secondary">No attacking type is super-effective against two team members.</p>}<p className="mt-2 text-xs text-text-secondary">Base typing and ability immunities; damage-modifying abilities and Tera can change the result.</p></div></div>
    </>}
  </section>;
}
