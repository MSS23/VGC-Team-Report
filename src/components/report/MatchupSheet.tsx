"use client";

import { useState } from "react";
import type { MatchupPlan } from "@/hooks/useMatchupPlans";
import type { AnalyzedPokemon } from "@/lib/types/analysis";
import { MatchupSheetRow } from "./MatchupSheetRow";
import { AddOpponentInput } from "./AddOpponentInput";

const DRAG_TYPE = "application/x-matchup-plan";

interface MatchupSheetProps {
  plans: MatchupPlan[];
  yourPokemon: AnalyzedPokemon[];
  isReadOnly: boolean;
  onReorderPlans: (fromIndex: number, toIndex: number) => void;
  onRemovePlan: (id: string) => void;
  onAddPlan: (paste: string, label: string) => void;
}

export function MatchupSheet({
  plans,
  yourPokemon,
  isReadOnly,
  onReorderPlans,
  onRemovePlan,
  onAddPlan,
}: MatchupSheetProps) {
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData(DRAG_TYPE, String(index));
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    if (!e.dataTransfer.types.includes(DRAG_TYPE)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, toIndex: number) => {
    if (!e.dataTransfer.types.includes(DRAG_TYPE)) return;
    e.preventDefault();
    setDragOverIndex(null);
    const fromIndex = parseInt(e.dataTransfer.getData(DRAG_TYPE), 10);
    if (!isNaN(fromIndex) && fromIndex !== toIndex) {
      onReorderPlans(fromIndex, toIndex);
    }
  };

  const handleDragEnd = () => {
    setDragOverIndex(null);
  };

  return (
    <div className="space-y-6 animate-fade-in" data-walkthrough="matchup-sheet">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">Matchup Sheet</h2>
        {plans.length > 0 && (
          <span className="text-xs font-medium text-text-tertiary px-2.5 py-1 bg-surface-alt rounded-full">
            {plans.length} matchup{plans.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {plans.length === 0 ? (
        <div className="text-center py-16 text-text-tertiary bg-surface border border-border rounded-2xl shadow-sm">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-3 text-text-tertiary/50">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14,2 14,8 20,8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
          </svg>
          <p className="text-base font-medium">No matchup plans yet</p>
          <p className="text-sm text-text-tertiary mt-1">Add an opponent team below to get started.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {plans.map((plan, index) => (
            <div
              key={plan.id}
              draggable={!isReadOnly}
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              className={`transition-all ${
                !isReadOnly ? "cursor-grab active:cursor-grabbing" : ""
              } ${
                dragOverIndex === index ? "ring-2 ring-accent/50 rounded-2xl" : ""
              }`}
            >
              <MatchupSheetRow
                plan={plan}
                rowNumber={index + 1}
                yourPokemon={yourPokemon}
                isReadOnly={isReadOnly}
                onRemove={() => onRemovePlan(plan.id)}
              />
            </div>
          ))}
        </div>
      )}

      {!isReadOnly && <AddOpponentInput onAdd={onAddPlan} />}
    </div>
  );
}
