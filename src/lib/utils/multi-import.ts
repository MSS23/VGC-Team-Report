/**
 * Detect and handle team import from multiple sources:
 * - PokePaste URLs (pokepast.es)
 * - Pikalytics team builder URLs
 * - Raw Showdown format text
 */

export type ImportSource = "pokepaste" | "pikalytics" | "showdown" | "unknown";

export function detectImportSource(input: string): ImportSource {
  const trimmed = input.trim();

  if (/^https?:\/\/(www\.)?pokepast\.es\//i.test(trimmed)) {
    return "pokepaste";
  }

  if (/^https?:\/\/(www\.)?pikalytics\.com\/team/i.test(trimmed)) {
    return "pikalytics";
  }

  // Check if it looks like a Showdown paste (has Ability: and moves)
  const hasAbility = /\bAbility:/i.test(trimmed);
  const hasMove = /^- .+/m.test(trimmed);
  if (hasAbility && hasMove) {
    return "showdown";
  }

  return "unknown";
}

/**
 * Parse a Pikalytics team builder URL to extract Pokemon data.
 * Pikalytics URLs encode team data in the URL path/hash.
 * Format: https://pikalytics.com/team/gen9vgc/{pokemon1}/{pokemon2}/...
 * Each Pokemon segment contains species and potentially set info.
 */
export function parsePikalyticsUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    const pathParts = parsed.pathname.split("/").filter(Boolean);

    // Expected: ["team", "gen9vgc", "pokemon1", "pokemon2", ...]
    if (pathParts.length < 3 || pathParts[0] !== "team") return null;

    // Extract Pokemon names from path segments
    const pokemonSegments = pathParts.slice(2);
    if (pokemonSegments.length === 0) return null;

    // Convert to a minimal Showdown paste format
    // Pikalytics URLs typically just have species names
    const paste = pokemonSegments.map((segment) => {
      // Capitalize species name
      const species = segment
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join("-");

      return `${species}\nAbility: \nLevel: 50\nEVs: \n- \n- \n- \n- `;
    }).join("\n\n");

    return paste;
  } catch {
    return null;
  }
}

/**
 * Attempt to import team data from any supported source.
 * Returns the Showdown-format paste text, or null if parsing fails.
 */
export async function importTeam(
  input: string,
  fetchPokePaste: (url: string) => Promise<{ paste: string }>
): Promise<{ paste: string; source: ImportSource } | null> {
  const source = detectImportSource(input);

  switch (source) {
    case "pokepaste": {
      try {
        const result = await fetchPokePaste(input);
        return { paste: result.paste, source };
      } catch {
        return null;
      }
    }

    case "pikalytics": {
      const paste = parsePikalyticsUrl(input);
      if (paste) return { paste, source };
      return null;
    }

    case "showdown": {
      return { paste: input, source };
    }

    default:
      return null;
  }
}
