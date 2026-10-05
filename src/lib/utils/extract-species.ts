/**
 * Extract species names from a Showdown paste string.
 *
 * Headers are stripped **before** the paste is split into blocks, mirroring
 * `showdown-parser.ts`. The old per-block `startsWith("===") → continue`
 * filter only worked when the "=== [format] Name ===" header stood in a block
 * of its own; a header followed immediately by the first Pokemon (Showdown
 * exports it with no blank line in some flows) made that header the block's
 * first line, so the whole block was skipped and the first team member went
 * missing — `['Rillaboom']` for a team whose first mon is Incineroar. Since
 * this list feeds `isDifferentTeam`, a species list missing its first entry
 * could declare an edit of the current team to be a brand-new team and
 * silently drop the user's draft, which is the exact loss this file exists to
 * prevent.
 */
export function extractSpecies(paste: string): string[] {
  const blocks = paste
    // CRLF first, so `[ \t]*$` below is not defeated by a trailing \r.
    .replace(/\r\n?/g, "\n")
    .replace(/^===.*===[ \t]*$/gm, "")
    .trim()
    .split(/\n\s*\n/);
  const species: string[] = [];
  for (const block of blocks) {
    const firstLine = block.trim().split("\n")[0]?.trim();
    if (!firstLine) continue;
    // Defensive: a malformed header the strip above did not match.
    if (firstLine.startsWith("===") && firstLine.endsWith("===")) continue;
    let namePart = firstLine.split(" @ ")[0].trim();
    namePart = namePart.replace(/\s*\([MF]\)\s*$/, "");
    const nicknameMatch = namePart.match(/^.+\((.+)\)$/);
    species.push(nicknameMatch ? nicknameMatch[1].trim() : namePart);
  }
  return species.slice(0, 6);
}

/**
 * True when the new paste shares no species with the previous team — i.e. the
 * user is starting a different team, not editing the current one. Used to
 * decide whether the auto-draft should keep updating the active draft or
 * start a fresh one (overwriting the old draft would be silent data loss).
 */
export function isDifferentTeam(prevSpecies: string[], nextPaste: string): boolean {
  if (prevSpecies.length === 0) return false;
  const next = extractSpecies(nextPaste);
  if (next.length === 0) return false;
  const prev = new Set(prevSpecies);
  return !next.some((s) => prev.has(s));
}
