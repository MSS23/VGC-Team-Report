/** Extract species names from a Showdown paste string. */
export function extractSpecies(paste: string): string[] {
  const blocks = paste.trim().split(/\n\s*\n/);
  const species: string[] = [];
  for (const block of blocks) {
    const firstLine = block.trim().split("\n")[0]?.trim();
    if (!firstLine) continue;
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
