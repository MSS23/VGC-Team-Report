/** Extract species names from a Showdown paste string. */
export function extractSpecies(paste: string): string[] {
  // Showdown's backup format wraps teams in "=== [format] Name ===" headers.
  // Strip them BEFORE splitting into blocks, exactly as the parser does: the
  // old per-block skip only caught a header that stood alone as its own block,
  // so a header glued to the first Pokemon (no blank line after it) became that
  // block's first line and was counted as the species — silently eating the
  // real first mon everywhere species are listed.
  const withoutHeaders = paste
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/^===.*===[ \t]*$/gm, "");
  const blocks = withoutHeaders.trim().split(/\n\s*\n/);
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
