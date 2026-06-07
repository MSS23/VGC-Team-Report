"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { allSpecies } from "@/lib/data/dex-subset";
import { PokemonSprite } from "./PokemonSprite";

interface InlinePokemonEditorProps {
  /** Currently displayed species (used to seed the search and show context). */
  currentSpecies: string;
  /** Called with the canonical Showdown species name when the user picks. */
  onReplace: (newSpecies: string) => void;
  onClose: () => void;
}

interface SpeciesSuggestion {
  name: string;
  types: string[];
  baseStatTotal: number;
}

// Build the searchable index once per module load from the pre-extracted dex
// subset (see scripts/build-dex-subset.mjs). 1500+ entries — fine to iterate
// per keystroke since we filter down to a tiny prefix list, but caching the
// full list avoids the rebuild cost on every search.
let SPECIES_INDEX: SpeciesSuggestion[] | null = null;
function getSpeciesIndex(): SpeciesSuggestion[] {
  if (SPECIES_INDEX) return SPECIES_INDEX;
  const out: SpeciesSuggestion[] = [];
  for (const entry of allSpecies()) {
    // The subset generator already filters non-existent / zero-stat entries.
    // We still apply the "Past"-only nonstandard filter here so CAP/Future
    // species don't appear in the picker.
    if (entry.isNonstandard && entry.isNonstandard !== "Past") continue;
    const stats = entry.baseStats;
    out.push({
      name: entry.name,
      types: entry.types,
      baseStatTotal: stats.hp + stats.atk + stats.def + stats.spa + stats.spd + stats.spe,
    });
  }
  SPECIES_INDEX = out;
  return out;
}

function searchSpecies(query: string, currentName: string): SpeciesSuggestion[] {
  const q = query.trim().toLowerCase();
  if (!q) {
    // Empty query → show the current species first as context
    const current = getSpeciesIndex().find((s) => s.name.toLowerCase() === currentName.toLowerCase());
    return current ? [current] : [];
  }
  const DISPLAY_LIMIT = 8;
  const index = getSpeciesIndex();
  const prefix: SpeciesSuggestion[] = [];
  const contains: SpeciesSuggestion[] = [];
  for (const s of index) {
    const lower = s.name.toLowerCase();
    if (lower.startsWith(q)) {
      prefix.push(s);
    } else if (lower.includes(q)) {
      contains.push(s);
    }
    // Stop only once we have enough of both buckets to fill the display limit
    if (prefix.length >= DISPLAY_LIMIT && contains.length >= DISPLAY_LIMIT) break;
  }
  // Prefer prefix matches; fill remaining slots with contains matches so that
  // partial-word results (e.g. "nite" -> Nidoking) always appear when prefix
  // results don't fill the display limit.
  const prefixSlice = prefix.slice(0, DISPLAY_LIMIT);
  const remaining = DISPLAY_LIMIT - prefixSlice.length;
  return remaining > 0 ? [...prefixSlice, ...contains.slice(0, remaining)] : prefixSlice;
}

const TYPE_BG: Record<string, string> = {
  Normal: "#A8A77A", Fire: "#EE8130", Water: "#6390F0", Electric: "#F7D02C",
  Grass: "#7AC74C", Ice: "#96D9D6", Fighting: "#C22E28", Poison: "#A33EA1",
  Ground: "#E2BF65", Flying: "#A98FF0", Psychic: "#F95587", Bug: "#A6B91A",
  Rock: "#B6A136", Ghost: "#735797", Dragon: "#6F35FC", Dark: "#705746",
  Steel: "#B7B7CE", Fairy: "#D685AD",
};

export function InlinePokemonEditor({
  currentSpecies,
  onReplace,
  onClose,
}: InlinePokemonEditorProps) {
  const [query, setQuery] = useState("");
  const [highlighted, setHighlighted] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    // Autofocus once mounted so the user can start typing immediately
    inputRef.current?.focus();
  }, []);

  // ESC closes; arrow keys + Enter navigate the list
  const results = useMemo(() => searchSpecies(query, currentSpecies), [query, currentSpecies]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); onClose(); }
      else if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlighted((h) => Math.min(h + 1, Math.max(0, results.length - 1)));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlighted((h) => Math.max(h - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const pick = results[highlighted];
        if (pick) onReplace(pick.name);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [results, highlighted, onClose, onReplace]);

  // Keep highlight in range as results change
  useEffect(() => {
    if (highlighted >= results.length) setHighlighted(0);
  }, [results.length, highlighted]);

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-start sm:items-center justify-center bg-black/50 backdrop-blur-sm pt-16 sm:pt-0"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label="Replace Pokemon"
    >
      <div className="bg-surface border border-border rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-fade-in">
        <div className="px-5 pt-5 pb-3 border-b border-border-subtle">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-extrabold text-text-primary tracking-tight">
              Replace Pokemon
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-alt transition-colors cursor-pointer"
              aria-label="Close"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          <p className="text-xs text-text-tertiary mb-3">
            Currently <span className="font-bold text-text-secondary">{currentSpecies}</span> — search for a replacement. Item, ability, moves, EVs and IVs are preserved (you can fix any mismatches after).
          </p>
          <div className="relative">
            <svg
              width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none"
            >
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search any Pokemon (e.g. Iron Hands, Mega Manectric...)"
              className="w-full pl-9 pr-3 py-2.5 bg-surface-alt border border-border rounded-xl text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
              autoComplete="off"
              spellCheck={false}
            />
          </div>
        </div>

        <ul className="max-h-[60vh] sm:max-h-[400px] overflow-y-auto" role="listbox">
          {results.length === 0 && query.trim() && (
            <li className="px-5 py-6 text-center text-sm text-text-tertiary">
              No Pokemon matches &ldquo;{query}&rdquo;.
            </li>
          )}
          {results.length === 0 && !query.trim() && (
            <li className="px-5 py-6 text-center text-sm text-text-tertiary">
              Start typing a Pokemon name…
            </li>
          )}
          {results.map((s, i) => (
            <li key={s.name} role="option" aria-selected={i === highlighted}>
              <button
                type="button"
                onClick={() => onReplace(s.name)}
                onMouseEnter={() => setHighlighted(i)}
                className={`w-full flex items-center gap-3 px-5 py-2.5 text-left transition-colors cursor-pointer ${
                  i === highlighted ? "bg-accent-surface/40" : "hover:bg-surface-alt"
                }`}
              >
                <PokemonSprite species={s.name} size={36} animated={false} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-text-primary truncate">{s.name}</div>
                  <div className="flex items-center gap-1 mt-0.5">
                    {s.types.map((t) => (
                      <span
                        key={t}
                        className="text-[9px] font-extrabold uppercase tracking-wider px-1.5 py-px rounded text-white"
                        style={{ backgroundColor: TYPE_BG[t] ?? "#666" }}
                      >
                        {t}
                      </span>
                    ))}
                    <span className="text-[10px] text-text-tertiary ml-1 tabular-nums">BST {s.baseStatTotal}</span>
                  </div>
                </div>
                <svg
                  width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                  className={`flex-shrink-0 transition-opacity ${i === highlighted ? "text-accent opacity-100" : "opacity-0"}`}
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </li>
          ))}
        </ul>

        <div className="px-5 py-3 bg-surface-alt/40 border-t border-border-subtle flex items-center justify-between text-[11px] text-text-tertiary">
          <span><kbd className="px-1.5 py-0.5 rounded bg-surface border border-border text-[10px] font-mono">↑↓</kbd> navigate · <kbd className="px-1.5 py-0.5 rounded bg-surface border border-border text-[10px] font-mono">Enter</kbd> pick · <kbd className="px-1.5 py-0.5 rounded bg-surface border border-border text-[10px] font-mono">Esc</kbd> close</span>
        </div>
      </div>
    </div>,
    document.body
  );
}
