/**
 * Parse a Pokemon Showdown replay URL to extract battle metadata.
 * Works with replay.pokemonshowdown.com URLs.
 */

export interface ReplayData {
  player1: string;
  player2: string;
  winner: string | null;
  format: string;
  /** Which player index (1 or 2) used the team we're tracking, or null if unknown */
  teamPlayerIndex: 1 | 2 | null;
  /** Lead Pokemon species for player 1 */
  p1Leads: string[];
  /** Lead Pokemon species for player 2 */
  p2Leads: string[];
  /** Tera type used by each player (first Tera detected) */
  p1Tera: string | null;
  p2Tera: string | null;
}

export function isShowdownReplayUrl(url: string): boolean {
  return /^https?:\/\/replay\.pokemonshowdown\.com\//.test(url.trim());
}

/**
 * Fetch and parse a Showdown replay log.
 * Returns structured data about the battle.
 */
export async function parseReplay(replayUrl: string): Promise<ReplayData> {
  // Normalize URL — add .log to get raw text
  const logUrl = replayUrl.replace(/\/$/, "") + ".log";

  const res = await fetch(`/api/replay-proxy?url=${encodeURIComponent(logUrl)}`);
  if (!res.ok) throw new Error("Failed to fetch replay");
  const log = await res.text();

  const lines = log.split("\n");

  let player1 = "";
  let player2 = "";
  let winner: string | null = null;
  let format = "";
  const p1Leads: string[] = [];
  const p2Leads: string[] = [];
  let p1Tera: string | null = null;
  let p2Tera: string | null = null;
  let turnCount = 0;

  for (const line of lines) {
    // |player|p1|Name|...
    if (line.startsWith("|player|p1|")) {
      player1 = line.split("|")[3] ?? "";
    }
    if (line.startsWith("|player|p2|")) {
      player2 = line.split("|")[3] ?? "";
    }

    // |gametype|doubles
    // |tier|[Gen 9] VGC 2024 Reg G
    if (line.startsWith("|tier|")) {
      format = line.split("|")[2] ?? "";
    }

    // |switch|p1a: Incineroar|Incineroar, L50, M|...
    // Only track leads (before turn 1)
    if (turnCount === 0 && line.startsWith("|switch|")) {
      const parts = line.split("|");
      const slot = parts[2] ?? "";
      const speciesRaw = parts[3] ?? "";
      const species = speciesRaw.split(",")[0].trim();

      if (slot.startsWith("p1") && p1Leads.length < 2) {
        p1Leads.push(species);
      } else if (slot.startsWith("p2") && p2Leads.length < 2) {
        p2Leads.push(species);
      }
    }

    // |turn|1
    if (line.startsWith("|turn|")) {
      turnCount = parseInt(line.split("|")[2] ?? "0", 10);
    }

    // |-terastallize|p1a: Incineroar|Ghost
    if (line.startsWith("|-terastallize|")) {
      const parts = line.split("|");
      const slot = parts[2] ?? "";
      const teraType = parts[3] ?? "";
      if (slot.startsWith("p1") && !p1Tera) p1Tera = teraType;
      if (slot.startsWith("p2") && !p2Tera) p2Tera = teraType;
    }

    // |win|PlayerName
    if (line.startsWith("|win|")) {
      winner = line.split("|")[2] ?? null;
    }
  }

  return {
    player1,
    player2,
    winner,
    format,
    teamPlayerIndex: null, // caller should determine based on team comparison
    p1Leads,
    p2Leads,
    p1Tera,
    p2Tera,
  };
}
