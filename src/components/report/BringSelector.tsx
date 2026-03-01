"use client";

import type { AnalyzedPokemon } from "@/lib/types/analysis";
import { PokemonSprite } from "./PokemonSprite";

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
  const toggleIndex = (index: number) => {
    if (isReadOnly) return;
    if (selectedIndices.includes(index)) {
      onChange(selectedIndices.filter((i) => i !== index));
    } else if (selectedIndices.length < 4) {
      onChange([...selectedIndices, index]);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">
          Your Bring-4
        </h3>
        <span className="text-xs text-text-secondary">
          {selectedIndices.length}/4 selected
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
