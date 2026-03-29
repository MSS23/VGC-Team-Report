"use client";

import { useState, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import type { TeamAnalysis } from "@/lib/types/analysis";
import type { MatchupPlan } from "@/hooks/useMatchupPlans";
import type { CalcEntry } from "@/hooks/useDamageCalcs";
import type { SpriteConfig } from "@/lib/types/sprites";
import type { ReportTags } from "@/lib/data/tags";
import { TeamOverview } from "@/components/report/TeamOverview";
import { PokemonDetailSlide } from "@/components/report/PokemonDetailSlide";
import { SpeedTierChart } from "@/components/report/SpeedTierChart";
import { MatchupPlanSlide } from "@/components/report/MatchupPlanSlide";
import { MatchupSheet } from "@/components/report/MatchupSheet";

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

export interface PdfExportProps {
  analysis: TeamAnalysis;
  notes: Record<string, string>;
  calcs: Record<string, CalcEntry[]>;
  roles: Record<string, string>;
  spreadNotes: Record<string, string>;
  speciesKeys: string[];
  teamSummary: string;
  tournamentName?: string;
  placement?: string;
  record?: string;
  rentalCode?: string;
  creatorName?: string;
  mvpIndex?: number | null;
  tags?: ReportTags;
  plans: MatchupPlan[];
  getSpriteConfig?: (key: string) => SpriteConfig;
}

/* ------------------------------------------------------------------ */
/*  Download / PDF icon                                                */
/* ------------------------------------------------------------------ */

function DownloadIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  PrintableReport – renders every slide in sequence                  */
/* ------------------------------------------------------------------ */

export function PrintableReport({
  analysis,
  notes,
  calcs,
  roles,
  spreadNotes,
  speciesKeys,
  teamSummary,
  tournamentName,
  placement,
  record,
  rentalCode,
  creatorName,
  mvpIndex,
  tags,
  plans,
  getSpriteConfig,
}: PdfExportProps) {
  const noop = () => {};

  return (
    <>
      {/* Slide 1: Team Overview */}
      <div className="print-slide">
        <TeamOverview
          pokemon={analysis.pokemon}
          creatorMode={false}
          speciesKeys={speciesKeys}
          roles={roles}
          onRoleChange={noop}
          summary={teamSummary}
          onSummaryChange={noop}
          tournamentName={tournamentName}
          placement={placement}
          record={record}
          rentalCode={rentalCode}
          creatorName={creatorName}
          mvpIndex={mvpIndex ?? null}
          tags={tags}
          isReadOnly={true}
          getSpriteConfig={getSpriteConfig}
        />
      </div>

      {/* Slides 2..N: Pokemon details */}
      {analysis.pokemon.map((pokemon, i) => {
        const key = speciesKeys[i];
        return (
          <div className="print-slide" key={`pokemon-${key}`}>
            <PokemonDetailSlide
              pokemon={pokemon}
              note={notes[key] ?? ""}
              onNoteChange={noop}
              spreadNote={spreadNotes[key] ?? ""}
              calcs={calcs[key] ?? []}
              onAddCalc={noop}
              onRemoveCalc={noop}
              isReadOnly={true}
              isPresentationMode={true}
              shiny={getSpriteConfig?.(key)?.shiny}
              animated={getSpriteConfig?.(key)?.animated}
              speciesKey={key}
              pokemonIndex={i}
            />
          </div>
        );
      })}

      {/* Speed Tier Chart */}
      <div className="print-slide">
        <SpeedTierChart
          pokemon={analysis.pokemon}
          speciesKeys={speciesKeys}
          getSpriteConfig={getSpriteConfig}
          isPresentationMode={true}
        />
      </div>

      {/* Matchup Plan Slides */}
      {plans.map((plan) => (
        <div className="print-slide" key={`plan-${plan.id}`}>
          <MatchupPlanSlide
            plan={plan}
            yourPokemon={analysis.pokemon}
            isReadOnly={true}
            onGamePlanNotesChange={noop}
            onGamePlanReplaysChange={noop}
            onGamePlanBringChange={noop}
            onReorderGamePlanBring={noop}
            onGamePlanResultChange={noop}
            onAddGamePlan={noop}
            onRemoveGamePlan={noop}
            onRemove={noop}
          />
        </div>
      ))}

      {/* Matchup Sheet */}
      {plans.length > 0 && (
        <div className="print-slide">
          <MatchupSheet
            plans={plans}
            yourPokemon={analysis.pokemon}
            isReadOnly={true}
            onReorderPlans={noop}
            onRemovePlan={noop}
            onAddPlan={noop}
          />
        </div>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  PdfExportButton – the trigger button + hidden print container      */
/* ------------------------------------------------------------------ */

export function PdfExportButton(props: PdfExportProps) {
  const [isPrinting, setIsPrinting] = useState(false);

  const handlePrint = useCallback(() => {
    setIsPrinting(true);
  }, []);

  // Once the print container has rendered, trigger window.print()
  useEffect(() => {
    if (!isPrinting) return;

    // Give React a frame to paint the print container
    const raf = requestAnimationFrame(() => {
      window.print();
      // Reset after the print dialog closes (sync call)
      setIsPrinting(false);
    });

    return () => cancelAnimationFrame(raf);
  }, [isPrinting]);

  return (
    <>
      <button
        type="button"
        onClick={handlePrint}
        className="w-9 h-9 flex items-center justify-center rounded-lg text-text-tertiary hover:text-accent hover:bg-surface-alt transition-colors cursor-pointer"
        title="Export PDF"
        aria-label="Export report as PDF"
      >
        <DownloadIcon />
      </button>

      {/* Portal print container to body so CSS selector body > *:not(#print-container) works */}
      {isPrinting && createPortal(
        <div
          id="print-container"
          className="hidden print:block"
          aria-hidden="true"
        >
          <PrintableReport {...props} />
        </div>,
        document.body
      )}
    </>
  );
}
