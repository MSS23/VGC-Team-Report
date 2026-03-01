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

interface DropdownPosition {
  top?: number;
  bottom?: number;
  left: number;
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
  const [position, setPosition] = useState<DropdownPosition>({ left: 0 });
  const wrapperRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click (check both wrapper and menu since menu is fixed/portalled)
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      const target = e.target as Node;
      const inWrapper = wrapperRef.current?.contains(target);
      const inMenu = menuRef.current?.contains(target);
      if (!inWrapper && !inMenu) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Close on scroll (fixed position would drift from anchor)
  useEffect(() => {
    if (!open) return;
    const handleScroll = () => setOpen(false);
    window.addEventListener("scroll", handleScroll, true);
    return () => window.removeEventListener("scroll", handleScroll, true);
  }, [open]);

  // Calculate fixed position from button's viewport rect
  const handleToggle = useCallback(() => {
    if (!open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const dropdownH = Math.min(yourPokemon.length * 44 + 16, 320);

      if (spaceBelow >= dropdownH) {
        setPosition({ top: rect.bottom + 4, left: rect.left + rect.width / 2 });
        setOpenUpward(false);
      } else {
        setPosition({ bottom: window.innerHeight - rect.top + 4, left: rect.left + rect.width / 2 });
        setOpenUpward(true);
      }
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
    <div ref={wrapperRef} className="relative">
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
          ref={menuRef}
          className="fixed z-[9999] -translate-x-1/2 bg-surface border border-border rounded-xl shadow-xl min-w-[160px] py-1 overflow-y-auto max-h-[320px]"
          style={
            openUpward
              ? { bottom: position.bottom, left: position.left }
              : { top: position.top, left: position.left }
          }
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
