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
