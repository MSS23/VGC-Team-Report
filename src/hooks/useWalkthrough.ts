"use client";

import { useState, useEffect, useCallback, useMemo } from "react";

export interface WalkthroughStep {
  target: string | null; // data-walkthrough value, or null for centered (no spotlight)
  title: string;
  description: string;
  placement: "above" | "below" | "center";
  mobileSkip?: boolean;
}

export const WALKTHROUGH_STEPS: WalkthroughStep[] = [
  {
    target: null,
    title: "Welcome to VGC Team Report!",
    description:
      "Let\u2019s take a quick tour of the key features so you can build and share your team analysis.",
    placement: "center",
  },
  {
    target: null,
    title: "How It Works",
    description:
      "Your report is a slide deck: Team Overview, one slide per Pok\u00e9mon, a Speed Tier chart, matchup plans for each opponent, and a Matchup Sheet. Navigate slides and fill in your notes, calcs, and game plans.",
    placement: "center",
  },
  {
    target: "slide-nav",
    title: "Slide Navigation",
    description:
      "Use these controls or the left/right arrow keys to move between slides. Click any dot to jump directly to that slide.",
    placement: "above",
  },
  {
    target: "creator-toggle",
    title: "Lock / Unlock Editing",
    description:
      "Editing is unlocked by default. Click the lock button to switch to a clean read-only view. Unlock it again anytime to make changes.",
    placement: "below",
    mobileSkip: true,
  },
  {
    target: "share-button",
    title: "Share Your Report",
    description:
      "Once you\u2019ve added a team summary and notes for each Pok\u00e9mon, hit Share to copy a URL. Anyone with the link gets a read-only view with a QR code.",
    placement: "below",
  },
  {
    target: "present-button",
    title: "Present Your Team",
    description:
      "Enter fullscreen presentation mode \u2014 perfect for team calls or streams. Use arrow keys to navigate, press D for dark mode, F for fullscreen, or ? for all shortcuts.",
    placement: "below",
  },
  {
    target: null,
    title: "You\u2019re all set!",
    description:
      "Start by filling in each Pok\u00e9mon\u2019s notes and calcs, then add matchup plans on the Matchup Sheet slide. Click the ? in the header to replay this guide anytime.",
    placement: "center",
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
}

export function useWalkthrough({ enabled }: UseWalkthroughOptions) {
  const [isActive, setIsActive] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [hasAutoTriggered, setHasAutoTriggered] = useState(false);

  const filteredSteps = useMemo(() => {
    if (isMobile()) {
      return WALKTHROUGH_STEPS.filter((s) => !s.mobileSkip);
    }
    return WALKTHROUGH_STEPS;
  }, []);

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
    }
  }, [currentStepIndex, filteredSteps.length]);

  const skip = useCallback(() => {
    setIsActive(false);
    setSeenFlag();
  }, []);

  const start = useCallback(() => {
    setCurrentStepIndex(0);
    setIsActive(true);
  }, []);

  return {
    isActive: isActive && enabled,
    currentStep: filteredSteps[currentStepIndex] ?? null,
    currentStepIndex,
    totalSteps: filteredSteps.length,
    next,
    skip,
    start,
  };
}
