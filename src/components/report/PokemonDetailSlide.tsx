"use client";

import { memo, useState } from "react";
import type { PokemonDetailSlideProps } from "./pokemon-detail/types";
import { usePokemonDetailModel } from "./pokemon-detail/usePokemonDetailModel";
import { PokemonDetailLayout } from "./pokemon-detail/PokemonDetailLayout";
import { PokemonSlideHeader } from "./pokemon-detail/PokemonSlideHeader";
import { MovesPanel } from "./pokemon-detail/MovesPanel";
import { StatsPanel } from "./pokemon-detail/StatsPanel";
import { NotesPanel } from "./pokemon-detail/NotesPanel";
import { CalcsPanel } from "./pokemon-detail/CalcsPanel";

function PokemonDetailSlideBase(props: PokemonDetailSlideProps) {
  const model = usePokemonDetailModel(props);
  const [showCalculator, setShowCalculator] = useState(false);
  const [showSpreadBuilder, setShowSpreadBuilder] = useState(false);
  return (
    <PokemonDetailLayout
      pokemonIndex={props.pokemonIndex}
      header={<PokemonSlideHeader model={model} isPresentationMode={props.isPresentationMode} animated={props.animated} shiny={props.shiny} onToggleMega={props.onToggleMega} />}
      moves={<MovesPanel parsed={model.parsed} />}
      stats={<StatsPanel model={model} regulation={props.regulation} />}
      notes={<NotesPanel pokemon={props.pokemon} speciesKey={props.speciesKey} note={props.note} onNoteChange={props.onNoteChange} isReadOnly={props.isReadOnly} isPresentationMode={props.isPresentationMode} />}
      calcs={<CalcsPanel showCalculator={showCalculator} setShowCalculator={setShowCalculator} showSpreadBuilder={showSpreadBuilder} setShowSpreadBuilder={setShowSpreadBuilder} model={model} team={props.team} regulation={props.regulation} onApplySpread={props.onApplySpread} speciesKey={props.speciesKey} calcs={props.calcs} onAddCalc={props.onAddCalc} onRemoveCalc={props.onRemoveCalc} onEditCalc={props.onEditCalc} isReadOnly={props.isReadOnly} isPresentationMode={props.isPresentationMode} />}
    />
  );
}

// Stable callbacks from TeamReport keep unrelated slides from re-rendering.
export const PokemonDetailSlide = memo(PokemonDetailSlideBase);
