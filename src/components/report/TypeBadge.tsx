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
      className={`inline-flex items-center px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-widest rounded-md leading-none shadow-sm ${className}`}
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
