"use client";

import { useState, useRef, useEffect } from "react";
import type { AnalyzedPokemon } from "@/lib/types/analysis";
import { PokemonSprite } from "./PokemonSprite";

interface PokemonDropdownProps {
  yourPokemon: AnalyzedPokemon[];
  selectedIndex: number | null;
  onChange: (index: number | null) => void;
  isReadOnly: boolean;
  /** Indices already selected in other bring slots (to prevent duplicates) */
  takenIndices?: (number | null)[];
  /** Whether this dropdown slot is draggable */
  draggable?: boolean;
  /** Drag start handler passed from parent */
  onDragStart?: (e: React.DragEvent) => void;
}

export function PokemonDropdown({
  yourPokemon,
  selectedIndex,
  onChange,
  isReadOnly,
  takenIndices = [],
  draggable = false,
  onDragStart,
}: PokemonDropdownProps) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (!wrapperRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const selected = selectedIndex !== null ? yourPokemon[selectedIndex] : null;

  if (isReadOnly) {
    return (
      <div className="flex flex-col items-center gap-0.5 w-[72px] sm:w-[80px] min-h-[56px] sm:min-h-[60px] justify-center">
        {selected ? (
          <>
            <PokemonSprite species={selected.parsed.species} size={36} />
            <span className="text-[9px] sm:text-[10px] text-text-secondary truncate w-full text-center leading-tight">
              {selected.parsed.species}
            </span>
          </>
        ) : (
          <div className="w-9 h-9 rounded-lg bg-surface-alt border border-border-subtle" />
        )}
      </div>
    );
  }

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        draggable={draggable}
        onDragStart={onDragStart}
        className={`flex flex-col items-center gap-0.5 w-[72px] sm:w-[80px] min-h-[56px] sm:min-h-[60px] justify-center rounded-xl border border-border-subtle hover:border-accent/50 transition-all bg-surface p-1 hover:shadow-sm ${
          draggable ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"
        }`}
      >
        {selected ? (
          <>
            <PokemonSprite species={selected.parsed.species} size={36} />
            <span className="text-[9px] sm:text-[10px] text-text-secondary truncate w-full text-center leading-tight">
              {selected.parsed.species}
            </span>
          </>
        ) : (
          <>
            <div className="w-9 h-9 rounded-lg bg-surface-alt border border-dashed border-border flex items-center justify-center">
              <span className="text-text-tertiary text-lg leading-none">+</span>
            </div>
            <span className="text-[9px] sm:text-[10px] text-text-tertiary">Select</span>
          </>
        )}
      </button>

      {open && (
        <div
          className="absolute z-50 left-1/2 -translate-x-1/2 top-full mt-1 bg-surface border border-border rounded-xl shadow-xl min-w-[160px] py-1 overflow-y-auto max-h-[320px]"
        >
          {selected !== null && (
            <button
              type="button"
              onClick={() => {
                onChange(null);
                setOpen(false);
              }}
              className="w-full px-3 py-2 text-left text-xs text-red-400 hover:bg-surface-alt transition-colors border-b border-border"
            >
              Clear selection
            </button>
          )}
          {yourPokemon.map((mon, index) => {
            const isTaken = index !== selectedIndex && takenIndices.includes(index);
            const isSelected = index === selectedIndex;
            const isDisabled = isTaken || isSelected;
            return (
              <button
                key={index}
                type="button"
                disabled={isDisabled}
                onClick={() => {
                  onChange(index);
                  setOpen(false);
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors ${
                  isSelected
                    ? "bg-accent/10 cursor-default"
                    : isTaken
                      ? "opacity-30 cursor-not-allowed"
                      : "hover:bg-surface-alt cursor-pointer"
                }`}
              >
                <PokemonSprite species={mon.parsed.species} size={28} />
                <span className={`text-xs truncate flex-1 ${
                  isSelected ? "text-accent font-semibold" : "text-text-primary"
                }`}>
                  {mon.parsed.species}
                </span>
                {isSelected && (
                  <span className="text-accent text-xs flex-shrink-0">&#10003;</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
