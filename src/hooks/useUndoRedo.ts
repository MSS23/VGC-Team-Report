"use client";

import { useCallback, useRef } from "react";
import type { CalcEntry } from "@/hooks/useDamageCalcs";
import type { MatchupPlan } from "@/hooks/useMatchupPlans";

interface UndoRedoSnapshot {
  notes: Record<string, string>;
  calcs: Record<string, CalcEntry[]>;
  roles: Record<string, string>;
  summary: string;
  plans: MatchupPlan[];
}

const MAX_HISTORY = 50;

export function useUndoRedo() {
  const historyRef = useRef<UndoRedoSnapshot[]>([]);
  const indexRef = useRef(-1);
  const isRestoringRef = useRef(false);

  // Take a snapshot of current state (call this after meaningful edits)
  const pushSnapshot = useCallback((snapshot: UndoRedoSnapshot) => {
    if (isRestoringRef.current) return; // Don't record state changes caused by undo/redo

    // Trim any redo history after current index
    historyRef.current = historyRef.current.slice(0, indexRef.current + 1);
    historyRef.current.push(snapshot);

    // Enforce max history
    if (historyRef.current.length > MAX_HISTORY) {
      historyRef.current = historyRef.current.slice(-MAX_HISTORY);
    }
    indexRef.current = historyRef.current.length - 1;
  }, []);

  const canUndo = useCallback(() => indexRef.current > 0, []);
  const canRedo = useCallback(
    () => indexRef.current < historyRef.current.length - 1,
    []
  );

  const undo = useCallback((): UndoRedoSnapshot | null => {
    if (indexRef.current <= 0) return null;
    indexRef.current--;
    isRestoringRef.current = true;
    return historyRef.current[indexRef.current];
  }, []);

  const redo = useCallback((): UndoRedoSnapshot | null => {
    if (indexRef.current >= historyRef.current.length - 1) return null;
    indexRef.current++;
    isRestoringRef.current = true;
    return historyRef.current[indexRef.current];
  }, []);

  const doneRestoring = useCallback(() => {
    isRestoringRef.current = false;
  }, []);

  const isRestoring = useCallback(() => isRestoringRef.current, []);

  return {
    pushSnapshot,
    undo,
    redo,
    canUndo,
    canRedo,
    doneRestoring,
    isRestoring,
  };
}
