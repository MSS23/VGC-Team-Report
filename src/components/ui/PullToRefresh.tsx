"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { hapticLight, hapticSuccess } from "@/lib/utils/haptics";

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  enabled: boolean;
}

/**
 * Custom pull-to-refresh for PWA standalone mode where native pull-to-refresh
 * is disabled by overscroll-behavior: none.
 */
export function PullToRefresh({ onRefresh, enabled }: PullToRefreshProps) {
  const [pulling, setPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const active = useRef(false);
  const threshold = 80;

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!enabled || window.scrollY > 5) return;
    startY.current = e.touches[0].clientY;
    active.current = true;
  }, [enabled]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!active.current || refreshing) return;
    const dy = e.touches[0].clientY - startY.current;
    if (dy < 0) { active.current = false; return; }
    // Only activate once we're clearly pulling down, not scrolling sideways
    if (dy > 10) {
      setPulling(true);
      const dampened = Math.min(dy * 0.4, 120);
      setPullDistance(dampened);
      if (dampened >= threshold) hapticLight();
    }
  }, [refreshing]);

  const handleTouchEnd = useCallback(async () => {
    if (!pulling) { active.current = false; return; }
    active.current = false;

    if (pullDistance >= threshold) {
      setRefreshing(true);
      hapticSuccess();
      try {
        await onRefresh();
      } catch {
        // ignore
      }
      setRefreshing(false);
    }
    setPulling(false);
    setPullDistance(0);
  }, [pulling, pullDistance, onRefresh]);

  useEffect(() => {
    if (!enabled) return;
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchend", handleTouchEnd);
    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [enabled, handleTouchStart, handleTouchMove, handleTouchEnd]);

  if (!pulling && !refreshing) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[60] flex items-center justify-center pointer-events-none transition-transform duration-200"
      style={{ transform: `translateY(${refreshing ? 48 : pullDistance - 20}px)` }}
    >
      <div className={`w-8 h-8 rounded-full bg-surface border border-border shadow-lg flex items-center justify-center transition-transform ${
        refreshing ? "animate-spin" : pullDistance >= threshold ? "scale-110" : ""
      }`}>
        {refreshing ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
            <path d="M21 12a9 9 0 11-6.219-8.56" />
          </svg>
        ) : (
          <svg
            width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            className={`text-text-secondary transition-transform ${pullDistance >= threshold ? "text-accent" : ""}`}
            style={{ transform: `rotate(${Math.min(pullDistance / threshold * 180, 180)}deg)` }}
          >
            <polyline points="7,13 12,18 17,13" />
            <line x1="12" y1="6" x2="12" y2="18" />
          </svg>
        )}
      </div>
    </div>
  );
}
