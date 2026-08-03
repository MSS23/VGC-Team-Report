/**
 * Top-cut results for the 2026 Indianapolis Regional Championships (May 29-31, 2026) —
 * the first Champions-format (Regulation M-A) Regional.
 *
 * STATUS: intentionally empty.
 *
 * This file previously shipped placeholder rows (every player named "TBD" plus invented
 * archetype teams). That is worse than showing nothing: competitive players recognise real
 * top-cut names, and fake-but-plausible results damage trust in the whole site. The
 * placeholders have been removed and the `/champions` section now renders an honest
 * "not yet imported" state pointing at the official sources instead.
 *
 * TO POPULATE: pull the real top cut from one of the sources in `INDY_RESULT_SOURCES`
 * below and add one entry per player, each carrying the `sourceUrl` it was transcribed
 * from. Never fill this in from memory, from a search-engine summary, or with
 * "representative" teams — only from a page that was actually read. An empty table is a
 * correct table; an invented one is not.
 */

export interface IndyTopCutEntry {
  placement: string;
  player: string;
  country: string;
  species: [string, string, string, string, string, string];
  /** Direct link to the standings/teamlist page this row was transcribed from. */
  sourceUrl?: string;
}

/**
 * Empty until real, citable results are transcribed. Read the file header before adding rows.
 */
export const INDY_TOP_CUT: IndyTopCutEntry[] = [];

/** Official / community sources that publish the full bracket and team lists. */
export const INDY_RESULT_SOURCES: ReadonlyArray<{ label: string; url: string }> = [
  { label: "Limitless VGC", url: "https://limitlessvgc.com/tournaments/434" },
  { label: "Victory Road", url: "https://victoryroad.pro/2026-indianapolis/" },
  { label: "RK9 Labs", url: "https://rk9.gg/tournament/IN02wbUMQOt2eNv12cgC" },
];
