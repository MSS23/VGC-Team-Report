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
      "Let\u2019s take a quick tour of the key features so you can get the most out of your team analysis.",
    placement: "center",
  },
  {
    target: "slide-nav",
    title: "Slide Navigation",
    description:
      "Use these controls to move between slides. You can also press the left/right arrow keys or click the dots to jump to a specific slide.",
    placement: "above",
  },
  {
    target: "share-button",
    title: "Share Your Report",
    description:
      "Copy a shareable URL that includes your full team report \u2014 notes, matchup plans, and all. Anyone with the link can view it.",
    placement: "below",
  },
  {
    target: "creator-toggle",
    title: "Creator Mode",
    description:
      "Toggle Creator Mode to unlock editing features like matchup plans, game notes, and team roles. Turn it off for a cleaner presentation view.",
    placement: "below",
    mobileSkip: true,
  },
  {
    target: "present-button",
    title: "Present Your Team",
    description:
      "Enter fullscreen presentation mode \u2014 perfect for sharing your team in a call or stream. Press Escape or click Exit to return.",
    placement: "below",
  },
  {
    target: null,
    title: "You\u2019re all set!",
    description:
      "That\u2019s everything you need to know. Click the \u24D8 button in the header anytime to replay this walkthrough.",
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
