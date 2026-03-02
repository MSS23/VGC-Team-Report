"use client";

import { useState, useCallback, useEffect, useRef } from "react";

export interface GamePlan {
  id: string;
  bring: [number | null, number | null, number | null, number | null];
  notes: string;
}

export interface MatchupPlan {
  id: string;
  opponentPaste: string;
  opponentLabel: string;
  gamePlans: GamePlan[];
}

// Legacy types for migration from old format
export interface GamePlanSlots {
  lead: [number | null, number | null];
  back: [number | null, number | null];
}

interface LegacyPlan {
  id: string;
  opponentPaste: string;
  opponentLabel: string;
  notes?: string;
  selectedIndices?: number[];
  planA?: GamePlanSlots;
  planB?: GamePlanSlots;
  gamePlans?: GamePlan[];
}

function createGamePlan(): GamePlan {
  return {
    id: crypto.randomUUID(),
    bring: [null, null, null, null],
    notes: "",
  };
}

function migratePlan(plan: LegacyPlan): MatchupPlan {
  // Already in new format
  if (plan.gamePlans && plan.gamePlans.length > 0) {
    return {
      id: plan.id,
      opponentPaste: plan.opponentPaste,
      opponentLabel: plan.opponentLabel,
      gamePlans: plan.gamePlans,
    };
  }

  // Migrate from planA/planB format
  const bring: GamePlan["bring"] = plan.planA
    ? [plan.planA.lead[0], plan.planA.lead[1], plan.planA.back[0], plan.planA.back[1]]
    : plan.selectedIndices
      ? [
          plan.selectedIndices[0] ?? null,
          plan.selectedIndices[1] ?? null,
          plan.selectedIndices[2] ?? null,
          plan.selectedIndices[3] ?? null,
        ]
      : [null, null, null, null];

  return {
    id: plan.id,
    opponentPaste: plan.opponentPaste,
    opponentLabel: plan.opponentLabel,
    gamePlans: [
      {
        id: crypto.randomUUID(),
        bring,
        notes: plan.notes ?? "",
      },
    ],
  };
}

export { migratePlan };

function buildPlanKey(speciesKeys: string[]): string {
  const sorted = [...speciesKeys].sort();
  return `vgc-matchup-plans-${sorted.join(",")}`;
}

/** Remove duplicate Pokemon within a single game plan's bring-4 */
function deduplicateBring(bring: GamePlan["bring"]): GamePlan["bring"] {
  const seen = new Set<number>();
  return bring.map((idx) => {
    if (idx === null) return null;
    if (seen.has(idx)) return null; // clear duplicate
    seen.add(idx);
    return idx;
  }) as GamePlan["bring"];
}

/** Decode HTML entities that may have been stored from PokéPaste titles */
function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function loadAndMigrate(raw: string): MatchupPlan[] {
  const parsed: LegacyPlan[] = JSON.parse(raw);
  return parsed.map(migratePlan).map((plan) => ({
    ...plan,
    opponentLabel: decodeHtmlEntities(plan.opponentLabel),
    gamePlans: plan.gamePlans.map((gp) => ({
      ...gp,
      bring: deduplicateBring(gp.bring),
    })),
  }));
}

export function useMatchupPlans(speciesKeys: string[], persist = true) {
  const planKey = buildPlanKey(speciesKeys);
  const prevPlanKey = useRef(planKey);

  const [plans, setPlans] = useState<MatchupPlan[]>(() => {
    if (!persist || speciesKeys.length === 0) return [];
    try {
      const stored = localStorage.getItem(planKey);
      return stored ? loadAndMigrate(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (planKey === prevPlanKey.current) return;
    prevPlanKey.current = planKey;
    if (speciesKeys.length === 0) { setPlans([]); return; }
    if (!persist) return;
    try {
      const stored = localStorage.getItem(planKey);
      setPlans(stored ? loadAndMigrate(stored) : []);
    } catch {
      setPlans([]);
    }
  }, [planKey, speciesKeys.length, persist]);

  useEffect(() => {
    if (!persist || speciesKeys.length === 0) return;
    try {
      localStorage.setItem(planKey, JSON.stringify(plans));
    } catch { /* quota exceeded */ }
  }, [plans, planKey, speciesKeys.length, persist]);

  const addPlan = useCallback((opponentPaste: string, opponentLabel: string) => {
    const newPlan: MatchupPlan = {
      id: crypto.randomUUID(),
      opponentPaste,
      opponentLabel,
      gamePlans: [createGamePlan()],
    };
    setPlans((prev) => [...prev, newPlan]);
  }, []);

  const removePlan = useCallback((id: string) => {
    setPlans((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const addGamePlan = useCallback((matchupId: string) => {
    setPlans((prev) =>
      prev.map((p) => {
        if (p.id !== matchupId || p.gamePlans.length >= 3) return p;
        return { ...p, gamePlans: [...p.gamePlans, createGamePlan()] };
      })
    );
  }, []);

  const removeGamePlan = useCallback((matchupId: string, gamePlanId: string) => {
    setPlans((prev) =>
      prev.map((p) => {
        if (p.id !== matchupId || p.gamePlans.length <= 1) return p;
        return { ...p, gamePlans: p.gamePlans.filter((gp) => gp.id !== gamePlanId) };
      })
    );
  }, []);

  const updateGamePlanNotes = useCallback(
    (matchupId: string, gamePlanId: string, notes: string) => {
      setPlans((prev) =>
        prev.map((p) => {
          if (p.id !== matchupId) return p;
          return {
            ...p,
            gamePlans: p.gamePlans.map((gp) =>
              gp.id === gamePlanId ? { ...gp, notes } : gp
            ),
          };
        })
      );
    },
    []
  );

  const updateGamePlanBring = useCallback(
    (matchupId: string, gamePlanId: string, bringIndex: 0 | 1 | 2 | 3, pokemonIndex: number | null) => {
      setPlans((prev) =>
        prev.map((p) => {
          if (p.id !== matchupId) return p;
          return {
            ...p,
            gamePlans: p.gamePlans.map((gp) => {
              if (gp.id !== gamePlanId) return gp;
              // Reject if this Pokemon is already in another slot
              if (pokemonIndex !== null) {
                const alreadyTaken = gp.bring.some(
                  (val, i) => i !== bringIndex && val === pokemonIndex
                );
                if (alreadyTaken) return gp;
              }
              const bring: GamePlan["bring"] = [...gp.bring];
              bring[bringIndex] = pokemonIndex;
              return { ...gp, bring };
            }),
          };
        })
      );
    },
    []
  );

  const reorderGamePlanBring = useCallback(
    (matchupId: string, gamePlanId: string, fromIndex: 0 | 1 | 2 | 3, toIndex: 0 | 1 | 2 | 3) => {
      if (fromIndex === toIndex) return;
      setPlans((prev) =>
        prev.map((p) => {
          if (p.id !== matchupId) return p;
          return {
            ...p,
            gamePlans: p.gamePlans.map((gp) => {
              if (gp.id !== gamePlanId) return gp;
              const bring: GamePlan["bring"] = [...gp.bring];
              const temp = bring[fromIndex];
              bring[fromIndex] = bring[toIndex];
              bring[toIndex] = temp;
              return { ...gp, bring };
            }),
          };
        })
      );
    },
    []
  );

  const setPlansFull = useCallback((newPlans: LegacyPlan[]) => {
    setPlans(newPlans.map(migratePlan));
  }, []);

  return {
    plans,
    addPlan,
    removePlan,
    addGamePlan,
    removeGamePlan,
    updateGamePlanNotes,
    updateGamePlanBring,
    reorderGamePlanBring,
    setPlansFull,
  };
}
