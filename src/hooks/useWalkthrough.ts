"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";

export interface WalkthroughStep {
  target: string | null; // data-walkthrough value, or null for centered (no spotlight)
  title: string;
  description: string; // supports {{pokemon}} placeholder
  placement: "above" | "below" | "center";
  slide?: number | "pokemon" | "speed" | "matchup-sheet"; // which slide to navigate to
  mobileSkip?: boolean;
  /** On mobile, switch to this tab in PokemonDetailSlide before showing the step */
  mobileTab?: "set" | "stats" | "notes" | "calcs";
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
      "Your full team at a glance. Tap a card to see its detail slide. Star your MVP!",
    placement: "above",
    slide: 0,
  },

  // --- Pokemon detail page (random pokemon) ---
  {
    target: null,
    title: "{{pokemon}}\u2019s Detail Slide",
    description:
      "Every Pokemon gets a dedicated slide. On mobile, use the tabs to switch between Set, Stats, Notes, and Calcs.",
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
    mobileTab: "notes",
  },
  {
    target: "notable-calcs",
    title: "Notable Calcs",
    description:
      "Add damage calcs, speed benchmarks, and survival checks. They\u2019re organized into Offensive, Defensive, and Speed categories \u2014 each collapsible.",
    placement: "above",
    slide: "pokemon",
    mobileTab: "calcs",
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
      "Navigate between slides here. On mobile, drag the progress bar or tap to jump. On desktop, use arrow keys or click the dots.",
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

  // --- Finish ---
  {
    target: null,
    title: "You\u2019re all set!",
    description:
      "Your work saves automatically to your browser. Use the settings menu (\u2699\uFE0F) for presentation mode, editing lock, themes, and more. Click \u201CTake a tour\u201D in the menu anytime to replay this guide.",
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
  /** Total number of physical slides (including hidden ones). Used to resolve matchup-sheet index. */
  totalPhysicalSlides?: number;
  isSharedView?: boolean;
  /** Called when walkthrough starts/stops to enable creator mode during the tour */
  onCreatorModeChange?: (enabled: boolean) => void;
  creatorMode?: boolean;
  /** Maps physical slide index → virtual index (for hidden slide support). If not provided, assumes 1:1 mapping. */
  physicalToVirtual?: (physicalIndex: number) => number | null;
}

export function useWalkthrough({ enabled, pokemonNames, goToSlide, pokemonCount, totalPhysicalSlides, isSharedView, onCreatorModeChange, creatorMode, physicalToVirtual }: UseWalkthroughOptions) {
  const [isActive, setIsActive] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [hasAutoTriggered, setHasAutoTriggered] = useState(false);
  const creatorModeBeforeTour = useRef<boolean | null>(null);

  // Pick a random pokemon index (stable per session)
  const [randomPokemonIndex] = useState(() =>
    pokemonNames && pokemonNames.length > 0
      ? Math.floor(Math.random() * pokemonNames.length)
      : 0
  );

  const randomPokemonName = pokemonNames?.[randomPokemonIndex] ?? "your Pokemon";

  // Targets that only exist in creator/owner mode (input fields, not read-only views)
  const CREATOR_ONLY_TARGETS = ["share-button", "tournament-info"];

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

  // Resolve the physical slide index for the current step
  const resolveSlide = useCallback(
    (step: WalkthroughStep): number | null => {
      if (step.slide === undefined || step.slide === null) return null;
      if (typeof step.slide === "number") return step.slide;
      const count = pokemonCount ?? 0;
      if (step.slide === "pokemon") return 1 + randomPokemonIndex;
      if (step.slide === "speed") return count + 1;
      if (step.slide === "matchup-sheet") {
        // Matchup sheet is always the last physical slide
        return (totalPhysicalSlides ?? count + 3) - 1;
      }
      return null;
    },
    [pokemonCount, randomPokemonIndex, totalPhysicalSlides]
  );

  // Check whether a step's target element exists in the DOM.
  // Virtual steps (target === null) are always valid.
  const isStepAvailable = useCallback(
    (step: WalkthroughStep): boolean => {
      if (step.target === null) return true;
      return !!document.querySelector(`[data-walkthrough="${step.target}"]`);
    },
    []
  );

  // Navigate to the correct slide (and mobile tab) when step changes
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
    // Switch mobile tab if step requires it (e.g. notes/calcs tabs on Pokemon detail)
    if (step.mobileTab && isMobile()) {
      window.dispatchEvent(new CustomEvent("walkthrough-tab", { detail: step.mobileTab }));
    }
  }, [isActive, currentStepIndex, filteredSteps, goToSlide, resolveSlide, physicalToVirtual]);

  // Restore creator mode when walkthrough ends
  const endTour = useCallback(() => {
    setIsActive(false);
    setSeenFlag();
    // Restore creator mode to what it was before the tour
    if (creatorModeBeforeTour.current !== null && onCreatorModeChange) {
      onCreatorModeChange(creatorModeBeforeTour.current);
      creatorModeBeforeTour.current = null;
    }
    goToSlide?.(0);
  }, [goToSlide, onCreatorModeChange]);

  // Auto-skip steps whose target element doesn't exist in the DOM.
  // Uses retries because slide navigation + React render can take a few frames.
  useEffect(() => {
    if (!isActive) return;
    const step = filteredSteps[currentStepIndex];
    if (!step || step.target === null) return; // virtual steps always valid

    let cancelled = false;
    let timerId: ReturnType<typeof setTimeout> | null = null;
    let observer: MutationObserver | null = null;

    const onFound = () => {
      // Target found — nothing to skip, clean up
      if (observer) { observer.disconnect(); observer = null; }
      if (timerId !== null) { clearTimeout(timerId); timerId = null; }
    };

    const onGiveUp = () => {
      // Target not found after all retries — skip forward
      let nextIdx = currentStepIndex + 1;
      while (nextIdx < filteredSteps.length) {
        const candidate = filteredSteps[nextIdx];
        if (candidate.target === null) break;
        if (candidate.slide !== step.slide && candidate.slide !== undefined) break;
        if (isStepAvailable(candidate)) break;
        nextIdx++;
      }

      if (nextIdx >= filteredSteps.length) {
        endTour();
      } else {
        setCurrentStepIndex(nextIdx);
      }
    };

    const check = () => {
      if (cancelled) return;
      if (isStepAvailable(step)) {
        onFound();
        return;
      }
      // Not found yet — set up MutationObserver to watch for the element
      observer = new MutationObserver(() => {
        if (cancelled) return;
        if (isStepAvailable(step)) {
          onFound();
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
      // Fallback timeout — give up after 2s if element never appears
      timerId = setTimeout(() => {
        if (cancelled) return;
        if (observer) { observer.disconnect(); observer = null; }
        if (!isStepAvailable(step)) onGiveUp();
      }, 2000);
    };

    // Start first check after a short delay for the slide to render
    timerId = setTimeout(check, 80);

    return () => {
      cancelled = true;
      if (timerId !== null) clearTimeout(timerId);
      if (observer) { observer.disconnect(); observer = null; }
    };
  }, [isActive, currentStepIndex, filteredSteps, isStepAvailable, goToSlide, endTour]);

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

  // Auto-trigger on first visit (including shared views via Discord links)
  useEffect(() => {
    if (!enabled || hasAutoTriggered) return;
    if (getSeenFlag()) {
      setHasAutoTriggered(true);
      return;
    }

    const timer = setTimeout(() => {
      setHasAutoTriggered(true);
      // Enable creator mode for the tour so all targets exist
      if (!isSharedView && onCreatorModeChange) {
        creatorModeBeforeTour.current = creatorMode ?? false;
        onCreatorModeChange(true);
      }
      setIsActive(true);
      setCurrentStepIndex(0);
    }, 400);

    return () => clearTimeout(timer);
  }, [enabled, hasAutoTriggered, isSharedView]);

  const next = useCallback(() => {
    if (currentStepIndex < filteredSteps.length - 1) {
      setCurrentStepIndex((i) => i + 1);
    } else {
      endTour();
    }
  }, [currentStepIndex, filteredSteps.length, endTour]);

  const prev = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((i) => i - 1);
    }
  }, [currentStepIndex]);

  const skip = useCallback(() => {
    endTour();
  }, [endTour]);

  const start = useCallback(() => {
    setCurrentStepIndex(0);
    // Enable creator mode for the tour so all targets exist
    if (!isSharedView && onCreatorModeChange) {
      creatorModeBeforeTour.current = creatorMode ?? false;
      onCreatorModeChange(true);
    }
    setIsActive(true);
  }, [isSharedView, onCreatorModeChange, creatorMode]);

  return {
    isActive: isActive && enabled,
    currentStep,
    currentStepIndex,
    totalSteps: filteredSteps.length,
    next,
    prev,
    skip,
    start,
    guidePokemon: randomPokemonName,
  };
}
