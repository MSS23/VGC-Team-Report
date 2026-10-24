"use client";
import { useTranslation } from "@/lib/i18n";
import { FieldDiffHighlight } from "../TeamReport";
import { encodeSectionKey } from "@/lib/utils/version-diff";
import type { PokemonDetailSlideProps } from "./types";
export function NotesPanel({ pokemon: { parsed }, speciesKey, note, onNoteChange, isReadOnly = false, isPresentationMode = false }: Pick<PokemonDetailSlideProps, "pokemon" | "speciesKey" | "note" | "onNoteChange" | "isReadOnly" | "isPresentationMode">) {
const { t } = useTranslation();
  return (
    <FieldDiffHighlight field={speciesKey ? [encodeSectionKey({ kind: "notes", speciesKey })] : []} label="Notes changed">
    <div className="flex flex-col gap-2">
      <h3 className="text-xs font-extrabold uppercase tracking-widest text-text-tertiary presenting:text-sm" data-walkthrough="pokemon-notes">
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
          className="w-full min-h-[4rem] sm:min-h-[10rem] p-3 sm:p-6 bg-surface border-2 border-border rounded-xl text-sm sm:text-base text-text-primary placeholder:text-text-tertiary resize-y focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent leading-relaxed transition-shadow"
          spellCheck={false}
        />
      )}
    </div>
    </FieldDiffHighlight>
  );


}
