"use client";

import type { AnalyzedPokemon } from "@/lib/types/analysis";
import { PokemonSprite } from "./PokemonSprite";
import { useTranslation } from "@/lib/i18n";

interface BringSelectorProps {
  yourPokemon: AnalyzedPokemon[];
  selectedIndices: number[];
  onChange: (indices: number[]) => void;
  isReadOnly: boolean;
}

export function BringSelector({
  yourPokemon,
  selectedIndices,
  onChange,
  isReadOnly,
}: BringSelectorProps) {
  const { t } = useTranslation();
  const toggleIndex = (index: number) => {
    if (isReadOnly) return;
    if (selectedIndices.includes(index)) {
      onChange(selectedIndices.filter((i) => i !== index));
    } else if (selectedIndices.length < 4) {
      onChange([...selectedIndices, index]);
    }
  };

  return (
    <div role="group" aria-label={t.yourBring4}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">
          {t.yourBring4}
        </h3>
        <span className="text-xs text-text-secondary" aria-live="polite">
          {selectedIndices.length}/4 {t.selectedCount}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {yourPokemon.map((mon, index) => {
          const isSelected = selectedIndices.includes(index);
          return (
            <button
              key={index}
              type="button"
              onClick={() => toggleIndex(index)}
              disabled={isReadOnly}
              aria-pressed={isSelected}
              aria-label={`${isSelected ? t.clearSelection : t.select} ${mon.parsed.species}`}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-all ${
                isSelected
                  ? "ring-2 ring-accent bg-accent/10 border-accent"
                  : "bg-surface-alt border-border-subtle opacity-60"
              } ${
                isReadOnly
                  ? "cursor-default"
                  : "cursor-pointer hover:opacity-100"
              }`}
            >
              <PokemonSprite species={mon.parsed.species} size={48} />
              <span className="text-xs font-medium text-text-primary truncate w-full text-center">
                {mon.parsed.species}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
