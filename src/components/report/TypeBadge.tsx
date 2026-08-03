import type { PokemonType } from "@/lib/types/pokemon";
import { TYPE_COLORS } from "@/lib/utils/type-colors";

interface TypeBadgeProps {
  type: PokemonType;
  className?: string;
}

/**
 * Neutral styling for a type that isn't one of the 18 real ones. The dex data
 * is validated upstream, but a bad type must never be able to throw here and
 * white-screen the whole report — same defensive shape as getMoveTypeStyle.
 */
const FALLBACK_COLORS = { bg: "#6B7280", text: "#FFFFFF", border: "#5B6270" };

export function TypeBadge({ type, className = "" }: TypeBadgeProps) {
  const colors = TYPE_COLORS[type] ?? FALLBACK_COLORS;

  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 text-[9px] sm:px-2.5 sm:py-1 sm:text-[11px] font-extrabold uppercase tracking-widest rounded-md leading-none shadow-sm ${className}`}
      style={{
        backgroundColor: colors.bg,
        color: colors.text,
        textShadow: colors.text === "#FFFFFF" ? "0 1px 2px rgba(0,0,0,0.2)" : "none",
      }}
    >
      {type}
    </span>
  );
}
