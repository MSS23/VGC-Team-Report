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
    title: "Your Report is a Slide Deck",
    description:
      "It starts with a Team Overview, then one slide per Pok\u00e9mon, a Speed Tier chart, individual matchup plans, and a Matchup Sheet. Everything is editable and saveable.",
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
    target: null,
    title: "Team Overview Slide",
    description:
      "The first slide is your team\u2019s home page. Add a tournament name, placement, record, team summary, rental code, and pick your MVP. This is the first thing viewers see.",
    placement: "center",
  },
  {
    target: null,
    title: "Pok\u00e9mon Slides",
    description:
      "Each Pok\u00e9mon gets its own slide. Write notes explaining its role, add notable damage calcs, and assign a short role label (e.g. \u201cSpread Attacker\u201d). Click any calc to edit it inline.",
    placement: "center",
  },
  {
    target: null,
    title: "Matchup Plans",
    description:
      "On the Matchup Sheet slide, paste an opponent\u2019s team to add them. Each matchup gets its own slide where you can create game plans, pick your bring-4, write notes, and log replays and results.",
    placement: "center",
  },
  {
    target: null,
    title: "Hide Slides",
    description:
      "Any slide can be hidden from viewers and presentations. Use the visibility toggle in the bottom nav bar \u2014 hidden slides stay visible to you in editing mode with a banner.",
    placement: "center",
  },
  {
    target: "creator-toggle",
    title: "Lock / Unlock Editing",
    description:
      "Editing is unlocked by default. Click the lock button to preview the clean read-only view your viewers will see. Unlock it again anytime to keep editing.",
    placement: "below",
    mobileSkip: true,
  },
  {
    target: "share-button",
    title: "Share Your Report",
    description:
      "Hit Share to copy a URL. You can set an optional passcode \u2014 anyone with it can unlock editing and re-share with updates. Without a passcode, the link is read-only.",
    placement: "below",
  },
  {
    target: "present-button",
    title: "Present Your Team",
    description:
      "Enter fullscreen presentation mode \u2014 perfect for team calls or streams. Use arrow keys to navigate, D for dark mode, F for fullscreen, or ? for all shortcuts.",
    placement: "below",
  },
  {
    target: null,
    title: "You\u2019re all set!",
    description:
      "Try the generation theme selector in the header to change the look. Your work saves automatically. Click the ? button anytime to replay this guide.",
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
