"use client";
import { useId } from "react";
import { useTranslation } from "@/lib/i18n";
import { FieldDiffHighlight } from "../TeamReport";
import { encodeSectionKey } from "@/lib/utils/version-diff";
import type { PokemonDetailSlideProps } from "./types";
export function NotesPanel({ pokemon: { parsed }, speciesKey, note, onNoteChange, isReadOnly = false, isPresentationMode = false }: Pick<PokemonDetailSlideProps, "pokemon" | "speciesKey" | "note" | "onNoteChange" | "isReadOnly" | "isPresentationMode">) {
const { t } = useTranslation();
  // The textarea had only a `placeholder`, which is not an accessible name: it
  // disappears on the first keystroke. Point it at the visible heading instead,
  // so label and heading stay one source of truth.
  const headingId = useId();
  return (
    <FieldDiffHighlight field={speciesKey ? [encodeSectionKey({ kind: "notes", speciesKey })] : []} label="Notes changed">
    <div className="flex flex-col gap-2">
      <h3 id={headingId} className="text-xs font-extrabold uppercase tracking-widest text-text-tertiary presenting:text-sm" data-walkthrough="pokemon-notes">
        {isPresentationMode ? t.notes : isReadOnly ? t.aboutThisPokemon : t.yourExplanation}
      </h3>
      {isReadOnly ? (
        <div className={`w-full bg-surface border border-border rounded-xl text-sm sm:text-base text-text-primary whitespace-pre-wrap leading-relaxed presenting:bg-surface-alt presenting:border-border-subtle ${isPresentationMode ? "p-3 sm:p-4" : "min-h-[4rem] sm:min-h-[10rem] p-3 sm:p-6"}`}>
          {note || t.noNotesYet}
        </div>
      ) : (
        <textarea
          value={note}
          onChange={(e) => onNoteChange(e.target.value)}
          placeholder={t.notesPlaceholder.replace("{species}", parsed.species)}
          aria-labelledby={headingId}
          className="w-full min-h-[4rem] sm:min-h-[10rem] p-3 sm:p-6 bg-surface border-2 border-border rounded-xl text-sm sm:text-base text-text-primary placeholder:text-text-tertiary resize-y focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface focus:border-accent leading-relaxed transition-shadow"
          spellCheck={false}
        />
      )}
    </div>
    </FieldDiffHighlight>
  );


}
