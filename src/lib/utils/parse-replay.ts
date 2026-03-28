/**
 * Parse a Pokemon Showdown replay URL to extract battle metadata and team data.
 * Works with replay.pokemonshowdown.com URLs.
 */

export interface ReplayPokemon {
  species: string;
  moves: string[];
  ability: string | null;
  item: string | null;
  teraType: string | null;
}

export interface ReplayTeam {
  playerName: string;
  pokemon: ReplayPokemon[];
}

export interface ReplayData {
  player1: string;
  player2: string;
  winner: string | null;
  format: string;
  team1: ReplayTeam;
  team2: ReplayTeam;
}

export function isShowdownReplayUrl(url: string): boolean {
  return /^https?:\/\/replay\.pokemonshowdown\.com\//.test(url.trim());
}

/**
 * Fetch and parse a Showdown replay log.
 * Extracts both teams with species, moves used, abilities, items, and tera types.
 */
export async function parseReplay(replayUrl: string): Promise<ReplayData> {
  const logUrl = replayUrl.replace(/\/$/, "") + ".log";

  const res = await fetch(`/api/replay-proxy?url=${encodeURIComponent(logUrl)}`);
  if (!res.ok) throw new Error("Failed to fetch replay");
  const log = await res.text();

  const lines = log.split("\n");

  let player1 = "";
  let player2 = "";
  let winner: string | null = null;
  let format = "";

  // Team preview Pokemon: |poke|p1|Species, L50, M|item
  const p1Species: string[] = [];
  const p2Species: string[] = [];

  // Track revealed data per Pokemon (keyed by species)
  const p1Data: Map<string, ReplayPokemon> = new Map();
  const p2Data: Map<string, ReplayPokemon> = new Map();

  // Map slot nicknames to species: "p1a: Incin" -> "Incineroar"
  const slotToSpecies: Map<string, string> = new Map();

  for (const line of lines) {
    // |player|p1|Name|...
    if (line.startsWith("|player|p1|")) player1 = line.split("|")[3] ?? "";
    if (line.startsWith("|player|p2|")) player2 = line.split("|")[3] ?? "";

    // |tier|[Gen 9] VGC 2024 Reg G
    if (line.startsWith("|tier|")) format = line.split("|")[2] ?? "";

    // Team preview: |poke|p1|Incineroar, L50, M|
    if (line.startsWith("|poke|")) {
      const parts = line.split("|");
      const player = parts[2]; // "p1" or "p2"
      const speciesRaw = parts[3] ?? "";
      const species = speciesRaw.split(",")[0].trim();
      if (!species) continue;

      if (player === "p1") {
        p1Species.push(species);
        if (!p1Data.has(species)) {
          p1Data.set(species, { species, moves: [], ability: null, item: null, teraType: null });
        }
      } else if (player === "p2") {
        p2Species.push(species);
        if (!p2Data.has(species)) {
          p2Data.set(species, { species, moves: [], ability: null, item: null, teraType: null });
        }
      }
    }

    // |switch|p1a: Incineroar|Incineroar, L50, M|100/100
    // |drag|p1a: Incineroar|Incineroar, L50, M|100/100
    if (line.startsWith("|switch|") || line.startsWith("|drag|")) {
      const parts = line.split("|");
      const slot = parts[2] ?? ""; // "p1a: Incineroar"
      const speciesRaw = parts[3] ?? "";
      const species = speciesRaw.split(",")[0].trim();
      if (slot && species) slotToSpecies.set(slot, species);
    }

    // |move|p1a: Incineroar|Fake Out|p2a: Rillaboom
    if (line.startsWith("|move|")) {
      const parts = line.split("|");
      const slot = parts[2] ?? "";
      const move = parts[3] ?? "";
      const species = resolveSpecies(slot, slotToSpecies);
      if (species && move) {
        const data = getDataMap(slot, p1Data, p2Data);
        const entry = data?.get(species);
        if (entry && !entry.moves.includes(move)) entry.moves.push(move);
      }
    }

    // |-ability|p1a: Incineroar|Intimidate|boost
    if (line.startsWith("|-ability|")) {
      const parts = line.split("|");
      const slot = parts[2] ?? "";
      const ability = parts[3] ?? "";
      const species = resolveSpecies(slot, slotToSpecies);
      if (species && ability) {
        const data = getDataMap(slot, p1Data, p2Data);
        const entry = data?.get(species);
        if (entry) entry.ability = ability;
      }
    }

    // |-item|p1a: Incineroar|Sitrus Berry
    // |-enditem|p1a: Incineroar|Sitrus Berry
    if (line.startsWith("|-item|") || line.startsWith("|-enditem|")) {
      const parts = line.split("|");
      const slot = parts[2] ?? "";
      const item = parts[3] ?? "";
      const species = resolveSpecies(slot, slotToSpecies);
      if (species && item) {
        const data = getDataMap(slot, p1Data, p2Data);
        const entry = data?.get(species);
        if (entry && !entry.item) entry.item = item;
      }
    }

    // |-terastallize|p1a: Incineroar|Ghost
    if (line.startsWith("|-terastallize|")) {
      const parts = line.split("|");
      const slot = parts[2] ?? "";
      const teraType = parts[3] ?? "";
      const species = resolveSpecies(slot, slotToSpecies);
      if (species && teraType) {
        const data = getDataMap(slot, p1Data, p2Data);
        const entry = data?.get(species);
        if (entry) entry.teraType = teraType;
      }
    }

    // |win|PlayerName
    if (line.startsWith("|win|")) winner = line.split("|")[2] ?? null;
  }

  // Build ordered teams from team preview species
  const buildTeam = (species: string[], dataMap: Map<string, ReplayPokemon>, playerName: string): ReplayTeam => ({
    playerName,
    pokemon: species.map((s) => dataMap.get(s) ?? { species: s, moves: [], ability: null, item: null, teraType: null }),
  });

  return {
    player1,
    player2,
    winner,
    format,
    team1: buildTeam(p1Species, p1Data, player1),
    team2: buildTeam(p2Species, p2Data, player2),
  };
}

/**
 * Convert a ReplayTeam to Showdown paste format.
 * Only includes data that was revealed during the battle.
 */
export function replayTeamToPaste(team: ReplayTeam): string {
  return team.pokemon.map((mon) => {
    const lines: string[] = [];

    // Species @ Item
    if (mon.item) {
      lines.push(`${mon.species} @ ${mon.item}`);
    } else {
      lines.push(mon.species);
    }

    // Ability
    if (mon.ability) lines.push(`Ability: ${mon.ability}`);

    // Tera Type
    if (mon.teraType) lines.push(`Tera Type: ${mon.teraType}`);

    lines.push("Level: 50");

    // Moves
    for (const move of mon.moves) {
      lines.push(`- ${move}`);
    }

    // If no moves were revealed, add empty move slots
    if (mon.moves.length === 0) {
      lines.push("- ");
    }

    return lines.join("\n");
  }).join("\n\n");
}

/** Resolve a slot label like "p1a: Incineroar" to the species name */
function resolveSpecies(slot: string, slotMap: Map<string, string>): string | null {
  return slotMap.get(slot) ?? null;
}

/** Get the correct data map (p1 or p2) based on slot prefix */
function getDataMap(
  slot: string,
  p1Data: Map<string, ReplayPokemon>,
  p2Data: Map<string, ReplayPokemon>
): Map<string, ReplayPokemon> | null {
  if (slot.startsWith("p1")) return p1Data;
  if (slot.startsWith("p2")) return p2Data;
  return null;
}
