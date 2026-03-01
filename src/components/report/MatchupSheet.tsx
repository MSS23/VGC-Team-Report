"use client";

import type { MatchupPlan } from "@/hooks/useMatchupPlans";
import type { AnalyzedPokemon } from "@/lib/types/analysis";
import { MatchupSheetRow } from "./MatchupSheetRow";
import { AddOpponentInput } from "./AddOpponentInput";

interface MatchupSheetProps {
  plans: MatchupPlan[];
  yourPokemon: AnalyzedPokemon[];
  isReadOnly: boolean;
  onGamePlanNotesChange: (matchupId: string, gamePlanId: string, notes: string) => void;
  onGamePlanBringChange: (
    matchupId: string,
    gamePlanId: string,
    bringIndex: 0 | 1 | 2 | 3,
    pokemonIndex: number | null
  ) => void;
  onAddGamePlan: (matchupId: string) => void;
  onRemoveGamePlan: (matchupId: string, gamePlanId: string) => void;
  onRemovePlan: (id: string) => void;
  onAddPlan: (paste: string, label: string) => void;
}

export function MatchupSheet({
  plans,
  yourPokemon,
  isReadOnly,
  onGamePlanNotesChange,
  onGamePlanBringChange,
  onAddGamePlan,
  onRemoveGamePlan,
  onRemovePlan,
  onAddPlan,
}: MatchupSheetProps) {
  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-xl sm:text-2xl font-bold text-text-primary">Matchup Sheet</h2>

      {plans.length === 0 ? (
        <div className="text-center py-16 text-text-tertiary bg-surface border border-border rounded-2xl shadow-sm">
          <p className="text-sm">No matchup plans yet.</p>
          <p className="text-xs text-text-tertiary mt-1">Add an opponent team below to get started.</p>
        </div>
      ) : (
        <div className="overflow-x-auto overflow-y-visible rounded-2xl border border-border bg-surface shadow-sm">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-surface-alt border-b border-border">
                <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wider text-text-tertiary text-center w-12">
                  #
                </th>
                <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wider text-text-tertiary text-left">
                  Opponent
                </th>
                <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wider text-text-tertiary text-center">
                  Team
                </th>
                <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wider text-accent text-center border-l border-border">
                  Game Plans
                </th>
                {!isReadOnly && (
                  <th className="w-10" />
                )}
              </tr>
            </thead>
            <tbody>
              {plans.map((plan, index) => (
                <MatchupSheetRow
                  key={plan.id}
                  plan={plan}
                  rowNumber={index + 1}
                  yourPokemon={yourPokemon}
                  isReadOnly={isReadOnly}
                  onRemove={() => onRemovePlan(plan.id)}
                  onGamePlanNotesChange={(gamePlanId, notes) =>
                    onGamePlanNotesChange(plan.id, gamePlanId, notes)
                  }
                  onGamePlanBringChange={(gamePlanId, bringIdx, pokIdx) =>
                    onGamePlanBringChange(plan.id, gamePlanId, bringIdx, pokIdx)
                  }
                  onAddGamePlan={() => onAddGamePlan(plan.id)}
                  onRemoveGamePlan={(gamePlanId) => onRemoveGamePlan(plan.id, gamePlanId)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!isReadOnly && <AddOpponentInput onAdd={onAddPlan} />}
    </div>
  );
}
