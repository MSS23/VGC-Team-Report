import { lookupMove } from "@/lib/data/moves";
import { TYPE_COLORS } from "@/lib/utils/type-colors";

/**
 * Returns inline style properties for a move pill, colored by the move's type.
 * Returns null for moves not in the database — caller should fall back to neutral styling.
 */
export function getMoveTypeStyle(moveName: string): React.CSSProperties | null {
  const moveData = lookupMove(moveName);
  if (!moveData) return null;

  const colors = TYPE_COLORS[moveData.type];
  return {
    backgroundColor: `${colors.bg}1A`, // ~10% opacity
    borderColor: `${colors.bg}40`, // ~25% opacity
  };
}
