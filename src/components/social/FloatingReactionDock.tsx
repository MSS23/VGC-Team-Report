"use client";

import { useRef } from "react";
import { ReactionBar } from "@/components/social/ReactionBar";
import { SaveButton } from "@/components/social/SaveButton";
import { useScrollHide } from "@/hooks/useScrollHide";

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
  const hidden = useScrollHide({ containerRef: dockRef });

  return (
    <div
      ref={dockRef}
      className={`fixed left-1/2 -translate-x-1/2 z-50 safe-bottom transition-transform duration-300 motion-reduce:transition-none ${
        isEditingUnlocked ? "bottom-14 sm:bottom-12" : "bottom-28 sm:bottom-24"
      } ${hidden ? "translate-y-[200%]" : "translate-y-0"}`}
    >
      <div className="flex items-center gap-0.5 pl-3 pr-1 py-1 rounded-full bg-surface/90 backdrop-blur-md border border-border shadow-lg">
        <ReactionBar shareId={shareId} isOwner={isOwner} />
        {!isOwner && (
          <>
            <div className="w-px h-5 bg-border/50" />
            <SaveButton shareId={shareId} />
          </>
        )}
      </div>
    </div>
  );
}
