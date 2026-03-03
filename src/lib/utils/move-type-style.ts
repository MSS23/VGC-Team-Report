import { MOVES } from "@/lib/data/moves";
import { TYPE_COLORS } from "@/lib/utils/type-colors";
import type { PokemonType } from "@/lib/types/pokemon";

/** Normalise a move name to the hyphenated-lowercase key used in MOVES. */
function lookupMoveType(name: string): PokemonType | null {
  const key = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return MOVES[key]?.type ?? null;
}

/** Darken a hex color by mixing towards black. factor 0 = unchanged, 1 = black. */
function darken(hex: string, factor: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const f = 1 - factor;
  return `rgb(${Math.round(r * f)}, ${Math.round(g * f)}, ${Math.round(b * f)})`;
}

// Types whose bg color is too light for readable text — darken them
const LIGHT_TYPES = new Set<PokemonType>(["Electric", "Ice", "Ground", "Steel", "Normal"]);

/**
 * Returns inline style properties for a move pill, colored by the move's type.
 * Returns null for moves not in the database — caller should fall back to neutral styling.
 */
export function getMoveTypeStyle(moveName: string): React.CSSProperties | null {
  const type = lookupMoveType(moveName);
  if (!type) return null;

  const colors = TYPE_COLORS[type];
  if (!colors) return null;

  const textColor = LIGHT_TYPES.has(type) ? darken(colors.bg, 0.35) : colors.bg;

  return {
    backgroundColor: `${colors.bg}1A`, // ~10% opacity
    borderColor: `${colors.bg}40`, // ~25% opacity
    color: textColor,
  };
}
