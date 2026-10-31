"use client";
import { PokemonSprite } from "../PokemonSprite";
import { TypeBadge } from "../TypeBadge";
import { useTranslation } from "@/lib/i18n";
import type { PokemonDetailModel } from "./usePokemonDetailModel";
import type { PokemonDetailSlideProps } from "./types";
export function PokemonSlideHeader({ model, isPresentationMode = false, animated = true, shiny = false, onToggleMega }: Pick<PokemonDetailSlideProps, "isPresentationMode" | "animated" | "shiny" | "onToggleMega"> & { model: PokemonDetailModel }) {
const { t } = useTranslation();
const { parsed, spriteSpecies, displaySpecies, showMegaToggle, showMega, types, isRegMA, displayAbility, nonDefaultIvs, statLabels } = model;
  return (
    <div className="flex items-start gap-3 sm:gap-6">
      <div className="flex-shrink-0 flex flex-col items-center gap-1.5">
        <PokemonSprite
          species={spriteSpecies}
          size={isPresentationMode ? 140 : 80}
          className="sm:hidden"
          animated={animated}
          shiny={shiny}
        />
        {/* Smaller on tablet so the name column isn't squeezed to ~120px. */}
        <PokemonSprite
          species={spriteSpecies}
          size={112}
          className="hidden sm:block lg:hidden"
          animated={animated}
          shiny={shiny}
        />
        <PokemonSprite
          species={spriteSpecies}
          size={160}
          className="hidden lg:block"
          animated={animated}
          shiny={shiny}
        />
      </div>
      <div className="flex flex-col gap-1.5 sm:gap-2 pt-0.5 sm:pt-2 min-w-0">
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <h2 className="text-2xl lg:text-3xl font-extrabold text-text-primary presenting:text-4xl line-clamp-2 break-words min-w-0 tracking-tight" title={displaySpecies}>
            {displaySpecies}
          </h2>
          {/* Mega toggle — same control covers base+stone AND already-Mega
              pastes now that the detail slide resolves megaEntry from
              either the item or the species key. */}
          {showMegaToggle && (
            <button
              type="button"
              onClick={onToggleMega}
              className={`inline-flex items-center justify-center min-w-[44px] min-h-[44px] rounded-md text-sm font-extrabold transition-all duration-200 ${
                showMega
                  ? "bg-gradient-to-br from-pink-500 to-purple-600 text-white shadow-sm shadow-purple-500/30"
                  : "bg-surface-alt text-text-tertiary hover:text-purple-500 hover:bg-purple-500/10 border border-border-subtle"
              }`}
              title={showMega ? "Show base form" : "Show Mega Evolution"}
              aria-label={showMega ? "Show base form" : "Show Mega Evolution"}
              aria-pressed={showMega}
            >
              M
            </button>
          )}
          {parsed.gender && (
            <span
              className={`text-lg sm:text-xl font-bold ${
                parsed.gender === "M" ? "text-blue-500" : "text-pink-500"
              }`}
            >
              {parsed.gender === "M" ? "\u2642" : "\u2640"}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {types.map((type) => (
            <TypeBadge key={type} type={type} />
          ))}
          {parsed.teraType && !isRegMA && (
            <span className="flex items-center gap-1 ml-1 sm:ml-2">
              <span className="text-xs text-text-tertiary font-semibold">{t.tera}:</span>
              <TypeBadge type={parsed.teraType} />
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-x-3 sm:gap-x-4 text-sm sm:text-base text-text-secondary presenting:text-lg">
          {displayAbility && <span className="font-medium">{displayAbility}</span>}
          {parsed.item && (
            <span className="text-text-primary font-bold">
              @ {parsed.item}
            </span>
          )}
        </div>
        {nonDefaultIvs.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <span className="text-xs font-extrabold uppercase tracking-widest text-text-tertiary presenting:text-sm">{t.ivs}:</span>
            {nonDefaultIvs.map((stat) => (
              <span
                key={stat}
                className="text-xs font-[family-name:var(--font-mono)] font-semibold text-text-tertiary bg-surface-alt px-2 py-0.5 rounded presenting:text-sm presenting:px-2.5 presenting:py-1"
              >
                {parsed.ivs[stat]} {statLabels[stat]}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
