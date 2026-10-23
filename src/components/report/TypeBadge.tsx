import type { PokemonType } from "@/lib/types/pokemon";
import { TYPE_COLORS } from "@/lib/utils/type-colors";

interface TypeBadgeProps {
  type: PokemonType;
  className?: string;
}

export function TypeBadge({ type, className = "" }: TypeBadgeProps) {
  const colors = TYPE_COLORS[type];

  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 text-[11px] sm:px-2.5 sm:py-1 sm:text-[11px] font-bold rounded-md leading-none shadow-sm ${className}`}
      style={{ backgroundColor: colors.bg, color: colors.text }}
    >
      {type}
    </span>
  );
}
