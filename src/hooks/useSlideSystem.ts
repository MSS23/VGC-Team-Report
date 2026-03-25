"use client";

import { useMemo, useCallback, useLayoutEffect, useRef } from "react";
import { useSlideNavigation } from "@/hooks/useSlideNavigation";
import type { TeamAnalysis } from "@/lib/types/analysis";
import type { MatchupPlan } from "@/hooks/useMatchupPlans";

interface SlideSystemOptions {
  analysis: TeamAnalysis | null;
  speciesKeys: string[];
  plans: MatchupPlan[];
  hiddenSlides: Set<string>;
  isHidden: (key: string) => boolean;
  toggleSlide: (key: string) => void;
  togglePlanSlide: (planId: string) => void;
  creatorMode: boolean;
  presentationMode: boolean;
  paste: string;
  darkMode: boolean;
  setDarkMode: (v: boolean) => void;
  setPresentationMode: (v: boolean) => void;
  setShowShortcutHint: (fn: (v: boolean) => boolean) => void;
  handleUndo: () => void;
  handleRedo: () => void;
  t: Record<string, string>;
}

export function useSlideSystem(opts: SlideSystemOptions) {
  const {
    analysis, speciesKeys, plans, hiddenSlides,
    isHidden, toggleSlide, togglePlanSlide,
    creatorMode, presentationMode, paste,
    darkMode, setDarkMode, setPresentationMode, setShowShortcutHint,
    handleUndo, handleRedo, t,
  } = opts;

  // Build ALL slide keys and labels
  const { allSlideKeys, allSlideLabels } = useMemo(() => {
    if (!analysis) return { allSlideKeys: [] as string[], allSlideLabels: [] as string[] };
    const keys: string[] = [
      "overview",
      ...speciesKeys,
      "speed-tiers",
      ...plans.map((p) => `matchup-${p.id}`),
      "matchup-sheet",
    ];
    const labels: string[] = [
      t.overview,
      ...analysis.pokemon.map((mon) => mon.parsed.species),
      t.teamAnalysisLabel,
      ...plans.map((p) => `vs. ${p.opponentLabel}`),
      t.matchupsLabel,
    ];
    return { allSlideKeys: keys, allSlideLabels: labels };
  }, [analysis, speciesKeys, plans, t]);

  const isSlideHiddenAt = useCallback((physicalIndex: number) => {
    const key = allSlideKeys[physicalIndex];
    if (!key) return false;
    if (key.startsWith("matchup-") && key !== "matchup-sheet") {
      const planId = key.slice("matchup-".length);
      const plan = plans.find((p) => p.id === planId);
      return plan?.showSlide === false;
    }
    return isHidden(key);
  }, [allSlideKeys, plans, isHidden]);

  const visibleIndices = useMemo(() => {
    const all = allSlideKeys.map((_, i) => i);
    if (creatorMode && !presentationMode) return all;
    return all.filter((i) => !isSlideHiddenAt(i));
  }, [allSlideKeys, creatorMode, presentationMode, isSlideHiddenAt]);

  const totalSlides = visibleIndices.length;

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen();
    }
  }, []);

  const {
    currentSlide, goToSlide, nextSlide, prevSlide, isFirst, isLast,
  } = useSlideNavigation({
    totalSlides,
    enabled: !!analysis,
    resetKey: paste,
    bypassFocusGuard: presentationMode,
    onEscape: presentationMode ? () => setPresentationMode(false) : undefined,
    onToggleDarkMode: () => setDarkMode(!darkMode),
    onToggleFullscreen: toggleFullscreen,
    onShowHelp: () => setShowShortcutHint((v: boolean) => !v),
    onTogglePresentation: () => setPresentationMode(!presentationMode),
    onUndo: handleUndo,
    onRedo: handleRedo,
  });

  const physicalSlide = visibleIndices[currentSlide] ?? 0;

  // Preserve physical slide position when visibleIndices changes
  const prevVisibleRef = useRef(visibleIndices);
  useLayoutEffect(() => {
    const prevVisible = prevVisibleRef.current;
    prevVisibleRef.current = visibleIndices;
    if (prevVisible === visibleIndices) return;
    const oldPhysical = prevVisible[currentSlide] ?? 0;
    const newVirtual = visibleIndices.indexOf(oldPhysical);
    if (newVirtual >= 0 && newVirtual !== currentSlide) {
      goToSlide(newVirtual);
    } else if (newVirtual < 0) {
      let closest = 0;
      let minDist = Infinity;
      for (let i = 0; i < visibleIndices.length; i++) {
        const dist = Math.abs(visibleIndices[i] - oldPhysical);
        if (dist < minDist) { minDist = dist; closest = i; }
      }
      goToSlide(closest);
    }
  }, [visibleIndices, currentSlide, goToSlide]);

  const slideLabels = useMemo(
    () => visibleIndices.map((i) => allSlideLabels[i]),
    [visibleIndices, allSlideLabels],
  );

  const slideHiddenStates = useMemo(
    () => visibleIndices.map((i) => isSlideHiddenAt(i)),
    [visibleIndices, isSlideHiddenAt],
  );

  const handleToggleCurrentSlide = useCallback(() => {
    const physIdx = visibleIndices[currentSlide];
    if (physIdx === undefined) return;
    const key = allSlideKeys[physIdx];
    if (!key) return;
    if (key.startsWith("matchup-") && key !== "matchup-sheet") {
      togglePlanSlide(key.slice("matchup-".length));
    } else {
      toggleSlide(key);
    }
  }, [currentSlide, visibleIndices, allSlideKeys, togglePlanSlide, toggleSlide]);

  return {
    currentSlide, goToSlide, nextSlide, prevSlide, isFirst, isLast,
    totalSlides, physicalSlide, slideLabels, slideHiddenStates,
    isSlideHiddenAt, handleToggleCurrentSlide, visibleIndices,
    allSlideKeys,
  };
}
