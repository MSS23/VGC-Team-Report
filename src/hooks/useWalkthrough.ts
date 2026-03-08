"use client";

import { useState, useEffect, useCallback, useMemo } from "react";

export interface WalkthroughStep {
  target: string | null; // data-walkthrough value, or null for centered (no spotlight)
  title: string;
  description: string; // supports {{pokemon}} placeholder
  placement: "above" | "below" | "center";
  slide?: number | "pokemon" | "speed" | "matchup-sheet"; // which slide to navigate to
  mobileSkip?: boolean;
}

export const WALKTHROUGH_STEPS: WalkthroughStep[] = [
  // --- Welcome ---
  {
    target: null,
    title: "Welcome to VGC Team Report!",
    description:
      "Let\u2019s take a quick tour of all the pages and features. You can skip anytime.",
    placement: "center",
    slide: 0,
  },

  // --- Team Overview page ---
  {
    target: "tournament-info",
    title: "Tournament Info",
    description:
      "Add your event name, placement, record, and rental code. This appears at the top of your report when shared.",
    placement: "below",
    slide: 0,
  },
  {
    target: "team-summary",
    title: "Team Summary",
    description:
      "Write an overview of your team\u2019s strategy, win conditions, and key synergies. This is the first thing viewers read.",
    placement: "below",
    slide: 0,
  },
  {
    target: "pokemon-grid",
    title: "Pokemon Cards",
    description:
      "Your full team at a glance. Click a role label to describe each mon\u2019s job (e.g. \u201cSpread Attacker\u201d). Star your MVP!",
    placement: "above",
    slide: 0,
  },

  // --- Pokemon detail page (random pokemon) ---
  {
    target: null,
    title: "{{pokemon}}\u2019s Detail Slide",
    description:
      "Every Pokemon gets a dedicated slide with its full set, stats, and EV spread shown on the left.",
    placement: "center",
    slide: "pokemon",
  },
  {
    target: "pokemon-notes",
    title: "Your Explanation",
    description:
      "Explain why you chose this spread for {{pokemon}}, its role, and key matchups. This text is shown when you share the report.",
    placement: "below",
    slide: "pokemon",
  },
  {
    target: "notable-calcs",
    title: "Notable Calcs",
    description:
      "Add damage calcs, speed benchmarks, and survival checks. They\u2019re organized into Offensive, Defensive, and Speed categories \u2014 each collapsible.",
    placement: "above",
    slide: "pokemon",
  },

  // --- Speed Tier Chart ---
  {
    target: "speed-tiers",
    title: "Speed Tier Chart",
    description:
      "See how your whole team stacks up in speed. Item boosts (like Choice Scarf) are shown as extended bars.",
    placement: "below",
    slide: "speed",
  },

  // --- Matchup Sheet ---
  {
    target: "matchup-sheet",
    title: "Matchup Sheet",
    description:
      "Paste opponent teams to plan your game strategy. Each matchup gets its own slide where you pick your bring-4, write notes, and log replays.",
    placement: "below",
    slide: "matchup-sheet",
  },

  // --- Navigation ---
  {
    target: "slide-nav",
    title: "Slide Navigation",
    description:
      "Use these controls or arrow keys to move between slides. Click any dot to jump directly. You can hide slides from viewers too.",
    placement: "above",
  },

  // --- Header controls ---
  {
    target: "share-button",
    title: "Share Your Report",
    description:
      "Copies a short permanent link. Set a passcode to let trusted people edit and re-share. Without one, the link is read-only.",
    placement: "below",
    mobileSkip: true,
  },
  {
    target: "creator-toggle",
    title: "Lock / Unlock Editing",
    description:
      "Preview the clean read-only view your viewers will see. Unlock anytime to keep editing.",
    placement: "below",
    mobileSkip: true,
  },
  {
    target: "present-button",
    title: "Presentation Mode",
    description:
      "Full-screen slide deck \u2014 perfect for team calls or streams. Use arrow keys to navigate, Esc to exit. Press D for dark mode.",
    placement: "below",
  },

  // --- Finish ---
  {
    target: null,
    title: "You\u2019re all set!",
    description:
      "Your work saves automatically to your browser. Try the generation theme selector to change the look. Click the tour button anytime to replay this guide.",
    placement: "center",
    slide: 0,
  },
];

const STORAGE_KEY = "vgc-walkthrough-seen";

function isMobile(): boolean {
  return typeof window !== "undefined" && window.innerWidth < 640;
}

function getSeenFlag(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "true";
  } catch {
    return true; // If localStorage unavailable, don't auto-trigger
  }
}

function setSeenFlag(): void {
  try {
    localStorage.setItem(STORAGE_KEY, "true");
  } catch {
    // Silently fail
  }
}

interface UseWalkthroughOptions {
  enabled: boolean;
  pokemonNames?: string[];
  goToSlide?: (index: number) => void;
  pokemonCount?: number;
  totalSlides?: number;
  isSharedView?: boolean;
  /** Maps physical slide index → virtual index (for hidden slide support). If not provided, assumes 1:1 mapping. */
  physicalToVirtual?: (physicalIndex: number) => number | null;
}

export function useWalkthrough({ enabled, pokemonNames, goToSlide, pokemonCount, totalSlides, isSharedView, physicalToVirtual }: UseWalkthroughOptions) {
  const [isActive, setIsActive] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [hasAutoTriggered, setHasAutoTriggered] = useState(false);

  // Pick a random pokemon index (stable per session)
  const [randomPokemonIndex] = useState(() =>
    pokemonNames && pokemonNames.length > 0
      ? Math.floor(Math.random() * pokemonNames.length)
      : 0
  );

  const randomPokemonName = pokemonNames?.[randomPokemonIndex] ?? "your Pokemon";

  // Targets that only exist in creator/owner mode
  const CREATOR_ONLY_TARGETS = ["share-button", "creator-toggle"];

  const filteredSteps = useMemo(() => {
    let steps = WALKTHROUGH_STEPS;
    if (isMobile()) {
      steps = steps.filter((s) => !s.mobileSkip);
    }
    if (isSharedView) {
      steps = steps.filter((s) => !s.target || !CREATOR_ONLY_TARGETS.includes(s.target));
    }
    return steps;
  }, [isSharedView]);

  // Resolve the slide index for the current step
  const resolveSlide = useCallback(
    (step: WalkthroughStep): number | null => {
      if (step.slide === undefined || step.slide === null) return null;
      if (typeof step.slide === "number") return step.slide;
      const count = pokemonCount ?? 0;
      if (step.slide === "pokemon") return 1 + randomPokemonIndex;
      if (step.slide === "speed") return count + 1;
      if (step.slide === "matchup-sheet") {
        // Matchup sheet is always the last slide
        return (totalSlides ?? count + 3) - 1;
      }
      return null;
    },
    [pokemonCount, randomPokemonIndex]
  );

  // Navigate to the correct slide when step changes
  useEffect(() => {
    if (!isActive || !goToSlide) return;
    const step = filteredSteps[currentStepIndex];
    if (!step) return;
    const physicalIdx = resolveSlide(step);
    if (physicalIdx === null) return;
    // Map physical → virtual index if mapping provided
    const virtualIdx = physicalToVirtual ? physicalToVirtual(physicalIdx) : physicalIdx;
    if (virtualIdx !== null) {
      goToSlide(virtualIdx);
    }
  }, [isActive, currentStepIndex, filteredSteps, goToSlide, resolveSlide, physicalToVirtual]);

  // Interpolate {{pokemon}} in the current step
  const currentStep = useMemo(() => {
    const step = filteredSteps[currentStepIndex];
    if (!step) return null;
    return {
      ...step,
      title: step.title.replace(/\{\{pokemon\}\}/g, randomPokemonName),
      description: step.description.replace(/\{\{pokemon\}\}/g, randomPokemonName),
    };
  }, [filteredSteps, currentStepIndex, randomPokemonName]);

  // Auto-trigger on first visit
  useEffect(() => {
    if (!enabled || hasAutoTriggered) return;
    if (getSeenFlag()) {
      setHasAutoTriggered(true);
      return;
    }

    const timer = setTimeout(() => {
      setHasAutoTriggered(true);
      setIsActive(true);
      setCurrentStepIndex(0);
    }, 600);

    return () => clearTimeout(timer);
  }, [enabled, hasAutoTriggered]);

  const next = useCallback(() => {
    if (currentStepIndex < filteredSteps.length - 1) {
      setCurrentStepIndex((i) => i + 1);
    } else {
      // Finished
      setIsActive(false);
      setSeenFlag();
      // Navigate back to overview
      goToSlide?.(0);
    }
  }, [currentStepIndex, filteredSteps.length, goToSlide]);

  const skip = useCallback(() => {
    setIsActive(false);
    setSeenFlag();
    goToSlide?.(0);
  }, [goToSlide]);

  const start = useCallback(() => {
    setCurrentStepIndex(0);
    setIsActive(true);
  }, []);

  return {
    isActive: isActive && enabled,
    currentStep,
    currentStepIndex,
    totalSteps: filteredSteps.length,
    next,
    skip,
    start,
    guidePokemon: randomPokemonName,
  };
}
