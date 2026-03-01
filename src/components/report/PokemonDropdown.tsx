"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { AnalyzedPokemon } from "@/lib/types/analysis";
import { PokemonSprite } from "./PokemonSprite";

interface PokemonDropdownProps {
  yourPokemon: AnalyzedPokemon[];
  selectedIndex: number | null;
  onChange: (index: number | null) => void;
  isReadOnly: boolean;
  /** Indices already selected in other bring slots (to prevent duplicates) */
  takenIndices?: (number | null)[];
}

export function PokemonDropdown({
  yourPokemon,
  selectedIndex,
  onChange,
  isReadOnly,
  takenIndices = [],
}: PokemonDropdownProps) {
  const [open, setOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Decide open direction based on available space
  const handleToggle = useCallback(() => {
    if (!open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const dropdownHeight = Math.min(yourPokemon.length * 40 + 16, 300);
      setOpenUpward(spaceBelow < dropdownHeight && rect.top > dropdownHeight);
    }
    setOpen((prev) => !prev);
  }, [open, yourPokemon.length]);

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
    <div ref={ref} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        className="flex flex-col items-center gap-0.5 w-[72px] sm:w-[80px] min-h-[56px] sm:min-h-[60px] justify-center rounded-xl border border-border-subtle hover:border-accent/50 transition-all cursor-pointer bg-surface p-1 hover:shadow-sm"
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
          className={`absolute left-1/2 -translate-x-1/2 z-[100] bg-surface border border-border rounded-xl shadow-xl min-w-[160px] py-1 overflow-y-auto max-h-[300px] ${
            openUpward ? "bottom-full mb-1" : "top-full mt-1"
          }`}
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
            return (
              <button
                key={index}
                type="button"
                disabled={isTaken}
                onClick={() => {
                  onChange(index);
                  setOpen(false);
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors ${
                  isTaken
                    ? "opacity-30 cursor-not-allowed"
                    : index === selectedIndex
                      ? "bg-accent/10"
                      : "hover:bg-surface-alt"
                }`}
              >
                <PokemonSprite species={mon.parsed.species} size={28} />
                <span className="text-xs text-text-primary truncate">
                  {mon.parsed.species}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
