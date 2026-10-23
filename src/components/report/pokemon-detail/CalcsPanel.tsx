"use client";
import type { Dispatch, SetStateAction } from "react";
import dynamic from "next/dynamic";
import { useTranslation } from "@/lib/i18n";
import { FieldDiffHighlight } from "../TeamReport";
import { encodeSectionKey } from "@/lib/utils/version-diff";
import { CalcInput } from "../CalcInput";
import type { CalcEntry, CalcCategory } from "@/hooks/useDamageCalcs";
import type { PokemonDetailSlideProps } from "./types";
import type { PokemonDetailModel } from "./usePokemonDetailModel";
import { CATEGORY_CONFIG, CollapsibleCalcGroup } from "./CalcEntryGroup";
const InlineDamageCalculator = dynamic(() => import("../InlineDamageCalculator"), {
  loading: () => <p role="status" className="p-4 text-sm text-text-secondary">Loading damage calculator…</p>,
});
const SpreadBuilder = dynamic(() => import("../SpreadBuilder"));

export function CalcsPanel({ showCalculator, setShowCalculator, showSpreadBuilder, setShowSpreadBuilder, model, team = [], regulation, onApplySpread, speciesKey, calcs, onAddCalc, onRemoveCalc, onEditCalc, isReadOnly = false, isPresentationMode = false }: Pick<PokemonDetailSlideProps, "team" | "regulation" | "onApplySpread" | "speciesKey" | "calcs" | "onAddCalc" | "onRemoveCalc" | "onEditCalc" | "isReadOnly" | "isPresentationMode"> & { model: PokemonDetailModel; showCalculator: boolean; setShowCalculator: Dispatch<SetStateAction<boolean>>; showSpreadBuilder: boolean; setShowSpreadBuilder: Dispatch<SetStateAction<boolean>> }) {
const { t } = useTranslation();
const { parsed, spriteSpecies, displayAbility } = model;
  const offensiveCalcs = calcs.filter((c) => c.category === "offensive");
  const defensiveCalcs = calcs.filter((c) => c.category === "defensive");
  const speedCalcs = calcs.filter((c) => c.category === "speed");

  const CATEGORIES: CalcCategory[] = ["offensive", "defensive", "speed"];

  const categoryLabelMap: Record<string, string> = {
    "Offensive": t.offensive,
    "Defensive": t.defensive,
    "Speed Tier": t.speedTier,
  };

  const renderCalcGroup = (
    entries: CalcEntry[],
    category: CalcCategory,
    globalCalcs: CalcEntry[]
  ) => {
    if (entries.length === 0) return null;
    const cfg = CATEGORY_CONFIG[category];

    return (
      <CollapsibleCalcGroup
        category={category}
        cfg={cfg}
        entries={entries}
        globalCalcs={globalCalcs}
        isReadOnly={isReadOnly}
        isPresentationMode={isPresentationMode}
        onRemoveCalc={onRemoveCalc}
        onEditCalc={onEditCalc}
        categories={CATEGORIES}
        translatedLabel={categoryLabelMap[cfg.label] ?? cfg.label}
      />
    );
  };

  return (
    <FieldDiffHighlight field={speciesKey ? [encodeSectionKey({ kind: "calcs", speciesKey })] : []} label="Calcs changed">
    <div className="flex flex-col gap-4">
      <h3 className="text-xs font-bold text-text-tertiary presenting:text-sm" data-walkthrough="notable-calcs">
        {t.notableCalcs}
      </h3>
      {calcs.length > 0 ? (
        <div className="flex flex-col gap-5 sm:gap-4">
          {!isReadOnly && (
            <p className="text-[11px] sm:text-xs text-text-tertiary leading-snug flex items-start gap-1.5">
              <span aria-hidden className="mt-px">&#9432;</span>
              <span>
                Auto-detected as offensive / defensive / speed.
                Tap the <span className="text-red-500 dark:text-red-400">&#9876;</span>{" "}
                <span className="text-emerald-800 dark:text-emerald-400">&#128737;</span>{" "}
                <span className="text-amber-800 dark:text-amber-400">&#9889;</span>{" "}
                icons on any calc to move it to a different group.
              </span>
            </p>
          )}
          {renderCalcGroup(offensiveCalcs, "offensive", calcs)}
          {renderCalcGroup(defensiveCalcs, "defensive", calcs)}
          {renderCalcGroup(speedCalcs, "speed", calcs)}
        </div>
      ) : isReadOnly ? (
        <div className="flex items-center justify-center py-6 sm:py-12 text-text-tertiary presenting:py-16 bg-surface-alt/50 rounded-xl border border-border-subtle">
          <p className="text-sm presenting:text-base ">{t.noNotableCalcs}</p>
        </div>
      ) : (
        <p className="text-sm text-text-tertiary italic ">
          {t.addDamageCalcsHint}
        </p>
      )}
      {!isReadOnly && (
        <div className="space-y-4">
          <button type="button" onClick={() => setShowCalculator((value) => !value)} aria-expanded={showCalculator} className="min-h-11 rounded-lg border border-border px-4 py-2 text-sm font-semibold text-text-primary cursor-pointer hover:bg-surface-alt active:bg-surface-alt focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
            {showCalculator ? "Close damage calculator" : "Open damage calculator"}
          </button>
          {showCalculator && <InlineDamageCalculator
            pokemon={{ ...parsed, species: spriteSpecies, ability: displayAbility?.replace(/ \*$/, "") ?? null }}
            team={team}
            regulation={regulation}
            onAddCalc={onAddCalc}
          />}
          {onApplySpread && <>
            <button type="button" onClick={() => setShowSpreadBuilder((value) => !value)} aria-expanded={showSpreadBuilder} className="min-h-11 rounded-lg border border-border px-4 py-2 text-sm font-semibold text-text-primary cursor-pointer hover:bg-surface-alt focus-visible:ring-2 focus-visible:ring-accent">{showSpreadBuilder ? "Close spread builder" : "Open spread builder"}</button>
            {showSpreadBuilder && <SpreadBuilder key={`${speciesKey}-${regulation}`} pokemon={{ ...parsed, species: spriteSpecies, ability: displayAbility?.replace(/ \*$/, "") ?? null }} regulation={regulation} onApply={onApplySpread} />}
          </>}
        <CalcInput
          pokemonSpecies={parsed.species}
          onAddCalc={onAddCalc}
        />
        </div>
      )}
    </div>
    </FieldDiffHighlight>
  );


}
