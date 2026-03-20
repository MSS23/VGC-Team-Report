import type { ParsedPokemon } from "@/lib/types/pokemon";
import type { StatName } from "@/lib/types/pokemon";

const STAT_LABELS: Record<StatName, string> = {
  hp: "HP", atk: "Atk", def: "Def", spa: "SpA", spd: "SpD", spe: "Spe",
};

const STAT_ORDER: StatName[] = ["hp", "atk", "def", "spa", "spd", "spe"];

function formatStatLine(prefix: string, stats: Record<StatName, number>, defaultVal: number): string | null {
  const parts: string[] = [];
  for (const stat of STAT_ORDER) {
    if (stats[stat] !== defaultVal) {
      parts.push(`${stats[stat]} ${STAT_LABELS[stat]}`);
    }
  }
  return parts.length > 0 ? `${prefix}: ${parts.join(" / ")}` : null;
}

export function pokemonToShowdown(mon: ParsedPokemon): string {
  const lines: string[] = [];

  // Line 1: Species/nickname + gender + item
  let line1 = "";
  if (mon.nickname) {
    line1 = `${mon.nickname} (${mon.species})`;
  } else {
    line1 = mon.species;
  }
  if (mon.gender) {
    line1 += ` (${mon.gender})`;
  }
  if (mon.item) {
    line1 += ` @ ${mon.item}`;
  }
  lines.push(line1);

  // Ability
  if (mon.ability) {
    lines.push(`Ability: ${mon.ability}`);
  }

  // Level (only if not default 50)
  if (mon.level !== 50) {
    lines.push(`Level: ${mon.level}`);
  }

  // Shiny
  if (mon.shiny) {
    lines.push("Shiny: Yes");
  }

  // Tera Type
  if (mon.teraType) {
    lines.push(`Tera Type: ${mon.teraType}`);
  }

  // EVs
  const evLine = formatStatLine("EVs", mon.evs, 0);
  if (evLine) lines.push(evLine);

  // Nature
  lines.push(`${mon.nature} Nature`);

  // IVs (only non-default)
  const ivLine = formatStatLine("IVs", mon.ivs, 31);
  if (ivLine) lines.push(ivLine);

  // Moves
  for (const move of mon.moves) {
    lines.push(`- ${move}`);
  }

  return lines.join("\n");
}

export function teamToShowdown(pokemon: ParsedPokemon[]): string {
  return pokemon.map(pokemonToShowdown).join("\n\n");
}
