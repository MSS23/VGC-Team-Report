/**
 * Detect and handle team import from multiple sources:
 * - PokePaste URLs (pokepast.es)
 * - Raw Showdown format text
 */

export type ImportSource = "pokepaste" | "showdown" | "unknown";

export function detectImportSource(input: string): ImportSource {
  const trimmed = input.trim();

  if (/^https?:\/\/(www\.)?pokepast\.es\//i.test(trimmed)) {
    return "pokepaste";
  }

  // Check if it looks like a Showdown paste (has Ability: and moves)
  const hasAbility = /\bAbility:/i.test(trimmed);
  const hasMove = /^- .+/m.test(trimmed);
  if (hasAbility && hasMove) {
    return "showdown";
  }

  return "unknown";
}
