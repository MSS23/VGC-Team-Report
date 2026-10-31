import type { TeraType } from "@/lib/types/pokemon";
import { TYPE_COLORS } from "@/lib/utils/type-colors";

interface TypeBadgeProps {
  // Accepts Stellar so Tera badges render it; chart/defensive callers pass a
  // plain PokemonType, which is a subset of TeraType.
  type: TeraType;
  className?: string;
}

// Defence in depth: `type` is typed as TeraType, but badges render strings that
// originate in generated data (`dex-subset.json` ships MissingNo. as "Bird").
// An unknown key makes `TYPE_COLORS[type]` `undefined`, and reading `.bg` off
// it used to throw and take the whole report render down. Degrade to a neutral
// badge instead. White on #4B5563 is ~7:1, well clear of the 4.5:1 floor.
const NEUTRAL_TYPE_COLORS = { bg: "#4B5563", text: "#FFFFFF", border: "#3F4753" };

export function TypeBadge({ type, className = "" }: TypeBadgeProps) {
  const colors = TYPE_COLORS[type] ?? NEUTRAL_TYPE_COLORS;

  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 text-[10px] sm:px-2.5 sm:py-1 sm:text-[11px] font-extrabold uppercase tracking-widest rounded-md leading-none shadow-sm ${className}`}
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
