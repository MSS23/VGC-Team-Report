"use client";

import { useCallback, useRef, useState } from "react";
import { ReactionBar } from "@/components/social/ReactionBar";
import { SaveButton } from "@/components/social/SaveButton";
import { useScrollHide } from "@/hooks/useScrollHide";
import { useTouchIdleHide } from "@/hooks/useTouchIdleHide";

interface FloatingReactionDockProps {
  shareId: string;
  isOwner: boolean;
  /**
   * When the editor toolbar is unlocked we push the dock up less, since
   * the bottom of the viewport is mostly occupied by editing chrome
   * rather than the slide-nav + read-only CTAs.
   */
  isEditingUnlocked: boolean;
}

/**
 * Bottom-anchored floating pill containing the like / save controls
 * for shared report viewers. Hides on scroll-down and reveals on
 * scroll-up so it never permanently obscures slide content, but
 * stays visible near the bottom of the page (where viewers have
 * finished reading and the CTAs are most useful).
 *
 * On mobile/PWA the dock also auto-hides after a few seconds of touch
 * inactivity to keep the presentation experience sleek. A small peek
 * tab brings it back, and a chevron inside the dock lets viewers
 * manually collapse it.
 *
 * Respects `prefers-reduced-motion`: those users get a static,
 * always-visible dock instead of a scroll-driven transform.
 *
 * Designed to be rendered only on shared, non-presentation views —
 * the caller is responsible for those gates.
 */
export function FloatingReactionDock({
  shareId,
  isOwner,
  isEditingUnlocked,
}: FloatingReactionDockProps) {
  const dockRef = useRef<HTMLDivElement>(null);
  const scrollHidden = useScrollHide({ containerRef: dockRef });
  const idleHidden = useTouchIdleHide({ containerRef: dockRef });
  const [userCollapsed, setUserCollapsed] = useState(false);
  const hidden = userCollapsed || scrollHidden || idleHidden;

  const expand = useCallback(() => {
    setUserCollapsed(false);
  }, []);

  const bottomClass = isEditingUnlocked ? "bottom-14 sm:bottom-12" : "bottom-28 sm:bottom-24";

  return (
    <>
      {/* Peek tab — only rendered on mobile when the dock is hidden so
          viewers can summon the heart/save controls without scrolling. */}
      <button
        type="button"
        onClick={expand}
        aria-label="Show reactions"
        aria-expanded={!hidden}
        className={`fixed left-1/2 -translate-x-1/2 z-50 safe-bottom sm:hidden flex items-center gap-1 px-3 py-1 rounded-full bg-surface/90 backdrop-blur-md border border-border shadow-md text-[10px] font-extrabold uppercase tracking-wider text-text-tertiary transition-opacity duration-200 motion-reduce:transition-none cursor-pointer ${bottomClass} ${
          hidden ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
        </svg>
        React
      </button>

      <div
        ref={dockRef}
        className={`fixed left-1/2 -translate-x-1/2 z-50 safe-bottom transition-transform duration-300 motion-reduce:transition-none ${bottomClass} ${
          hidden ? "translate-y-[200%]" : "translate-y-0"
        }`}
      >
        <div className="flex items-center gap-0.5 pl-3 pr-1 py-1 rounded-full bg-surface/90 backdrop-blur-md border border-border shadow-lg">
          <ReactionBar shareId={shareId} isOwner={isOwner} />
          {!isOwner && (
            <>
              <div className="w-px h-5 bg-border/50" />
              <SaveButton shareId={shareId} />
            </>
          )}
          {/* Mobile-only collapse handle */}
          <button
            type="button"
            onClick={() => setUserCollapsed(true)}
            aria-label="Hide reactions"
            className="sm:hidden ml-1 w-8 h-8 flex items-center justify-center rounded-full text-text-tertiary hover:text-text-primary hover:bg-surface-alt active:scale-95 transition-all cursor-pointer"
            title="Hide"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
        </div>
      </div>
    </>
  );
}
