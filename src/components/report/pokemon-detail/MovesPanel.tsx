"use client";
import type { ParsedPokemon } from "@/lib/types/pokemon";
import { useTranslation } from "@/lib/i18n";
import { getMoveTypeStyle } from "@/lib/utils/move-type-style";
import { translateMove } from "@/lib/utils/translate-move";
export function MovesPanel({ parsed }: { parsed: ParsedPokemon }) {
const { t, language } = useTranslation();
  return (
    <div>
      <h3 className="text-xs font-extrabold uppercase tracking-widest text-text-tertiary mb-2 sm:mb-3" data-walkthrough="pokemon-moves">
        {t.moves}
      </h3>
      <div className="grid grid-cols-2 gap-2 stagger-moves">
        {parsed.moves.map((move) => {
          const typeStyle = getMoveTypeStyle(move);
          return (
            <div
              key={move}
              className={`px-3.5 sm:px-5 py-3 sm:py-3.5 border rounded-xl text-xs sm:text-sm font-bold text-center transition-all hover:scale-[1.02] hover:shadow-sm ${
                typeStyle ? "shadow-sm" : "text-text-primary bg-surface border-border"
              }`}
              style={typeStyle ?? undefined}
            >
              {translateMove(move, language)}
            </div>
          );
        })}
      </div>
    </div>
  );


}
