"use client";
import type { ParsedPokemon, StatSpread } from "@/lib/types/pokemon";
import type { AnalyzedPokemon } from "@/lib/types/analysis";
import type { CalcEntry, CalcCategory } from "@/hooks/useDamageCalcs";
export interface PokemonDetailSlideProps {
  pokemon: AnalyzedPokemon;
  team?: ParsedPokemon[];
  onApplySpread?: (spread: StatSpread, reasoning: string) => void;
  note: string;
  onNoteChange: (text: string) => void;
  calcs: CalcEntry[];
  onAddCalc: (text: string, category: CalcCategory) => void;
  onRemoveCalc: (index: number) => void;
  onEditCalc?: (index: number, updates: Partial<CalcEntry>) => void;
  isReadOnly?: boolean;
  isPresentationMode?: boolean;
  shiny?: boolean;
  animated?: boolean;
  /** Species key for diff highlighting */
  speciesKey?: string;
  /** Pokemon index for diff highlighting */
  pokemonIndex?: number;
  /** Current regulation (e.g. "Reg M-A" for Champions) */
  regulation?: string;
  /** Mega Evolution toggle: undefined auto-detects from mega stone */
  isMega?: boolean;
  /** Flip between base and Mega form. When omitted the toggle is hidden. */
  onToggleMega?: () => void;
}


