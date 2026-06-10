/**
 * Surgical paste-edit helpers — modify a single Pokemon block inside a
 * Showdown paste without forcing the user to re-paste the whole team.
 *
 * The team paste is the source of truth (everything else — analysis,
 * calculatedStats, item boosts, validation — is derived from it). To edit
 * one Pokemon in-line we patch only its block and re-feed the paste through
 * the existing parser, so all downstream consumers stay coherent.
 */

/**
 * Split a paste into (header, blocks). The header is any leading
 * "=== [format] Team Name ===" line; blocks are the Pokemon definitions
 * separated by blank lines. Preserved verbatim so a round-trip
 * (split → join) is a no-op.
 */
function splitPaste(paste: string): { header: string | null; blocks: string[] } {
  const normalized = paste.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = normalized.split("\n");

  // Header is the first non-empty line if it matches "===...==="
  let headerEnd = 0;
  let header: string | null = null;
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (!trimmed) { headerEnd = i + 1; continue; }
    if (/^===.*===$/.test(trimmed)) {
      header = trimmed;
      headerEnd = i + 1;
    }
    break;
  }

  const body = lines.slice(headerEnd).join("\n");
  const blocks = body
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean);

  return { header, blocks };
}

function joinPaste(header: string | null, blocks: string[]): string {
  const body = blocks.join("\n\n");
  return header ? `${header}\n\n${body}` : body;
}

/**
 * Replace the species token on the first line of a block, preserving the
 * nickname (if any), gender suffix, and held item.
 *
 * Showdown first-line formats:
 *   "Species @ Item"
 *   "Species (M) @ Item"
 *   "Nickname (Species) @ Item"
 *   "Nickname (Species) (F) @ Item"
 *   "Species"               (no item)
 */
function replaceSpeciesInBlock(block: string, newSpecies: string): string {
  const lines = block.split("\n");
  if (lines.length === 0) return `${newSpecies}`;

  const firstLine = lines[0];
  const [namePart, ...rest] = firstLine.split(" @ ");
  const itemSuffix = rest.length > 0 ? ` @ ${rest.join(" @ ")}` : "";

  // Strip and remember the trailing gender marker
  const genderMatch = namePart.match(/\s*(\([MF]\))\s*$/);
  const genderSuffix = genderMatch ? ` ${genderMatch[1]}` : "";
  const stripped = namePart.replace(/\s*\([MF]\)\s*$/, "").trim();

  // If the stripped form is "Nickname (Species)", swap inside the parens.
  // Otherwise the whole stripped form IS the species.
  const nicknameMatch = stripped.match(/^(.+?)\s*\((.+)\)\s*$/);
  let newFirstLine: string;
  if (nicknameMatch) {
    newFirstLine = `${nicknameMatch[1].trim()} (${newSpecies})${genderSuffix}${itemSuffix}`;
  } else {
    newFirstLine = `${newSpecies}${genderSuffix}${itemSuffix}`;
  }

  return [newFirstLine, ...lines.slice(1)].join("\n");
}

/**
 * Replace the Nth Pokemon block's species in a full Showdown paste.
 * Returns the modified paste string. Index is 0-based.
 */
export function replacePokemonSpecies(
  paste: string,
  index: number,
  newSpecies: string,
): string {
  const { header, blocks } = splitPaste(paste);
  if (index < 0 || index >= blocks.length) return paste;
  const next = [...blocks];
  next[index] = replaceSpeciesInBlock(blocks[index], newSpecies);
  return joinPaste(header, next);
}
