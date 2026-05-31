"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getSessionId } from "@/lib/utils/session-id";
import { usePostHog } from "@/components/providers/PostHogProvider";

interface DoubleTapLikeOverlayProps {
  shareId: string;
  /** Don't fire the like for owners — they can't like their own report.
   *  Hide the gesture handler entirely when true. */
  isOwner: boolean;
  /** When false (no analysis / not a shared view), render nothing.
   *  Avoids the gesture catching events on the landing page. */
  enabled: boolean;
}

interface Heart {
  id: number;
  x: number;
  y: number;
}

/** Window between two pointerdowns (ms) to count as a double-tap. */
const DOUBLE_TAP_WINDOW_MS = 300;
/** Maximum distance between two pointerdowns (px) to count as a double-tap. */
const DOUBLE_TAP_DISTANCE_PX = 30;
/** Duration of the heart-burst animation (ms). Must match the keyframe below. */
const HEART_ANIM_MS = 700;
/** Reduced-motion fallback flash duration (ms). */
const HEART_REDUCED_MS = 250;

/** Selectors for interactive elements that should swallow the double-tap so we
 *  don't fire likes when viewers double-click a Pokemon sprite link, an input,
 *  or any other actionable control. */
const INTERACTIVE_SELECTOR = [
  "button",
  "a",
  "input",
  "textarea",
  "select",
  '[role="button"]',
  '[role="link"]',
  '[role="menuitem"]',
  "[contenteditable]",
  "[contenteditable='true']",
].join(",");

/** Big red SVG heart used for the burst. Filled, ~80px, no stroke. */
function HeartBurstIcon() {
  return (
    <svg
      width="80"
      height="80"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      style={{
        // Drop shadow gives the heart a soft glow on any background.
        filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.35))",
      }}
    >
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
    </svg>
  );
}

/**
 * Instagram-style double-tap-to-like overlay for shared report views.
 *
 * - Listens at the window level for `pointerdown` events and detects a
 *   double-tap (two presses within 300 ms and 30 px of each other).
 * - Ignores presses inside interactive controls (buttons, links, inputs)
 *   and inside the Share / Reactions floating docks, so existing UI keeps
 *   working as expected.
 * - On double-tap, bursts a large red heart at the pointer location with
 *   a scale-and-fade animation, vibrates the device briefly, and fires
 *   the like API once per session.
 * - The API is session-idempotent and TOGGLES — so before posting we
 *   GET the current reactions once on mount, and skip the POST if the
 *   viewer has already liked. The heart-burst still plays for visual
 *   feedback, but we never accidentally un-like.
 * - Respects `prefers-reduced-motion`: instead of the animated burst,
 *   we flash a static heart for a quarter-second.
 *
 * The overlay never blocks pointer events (`pointer-events: none`) so
 * the report stays fully interactive underneath it.
 */
export function DoubleTapLikeOverlay({
  shareId,
  isOwner,
  enabled,
}: DoubleTapLikeOverlayProps): React.JSX.Element | null {
  const posthog = usePostHog();
  const [hearts, setHearts] = useState<Heart[]>([]);

  // Refs that don't need to trigger re-renders.
  const lastTapRef = useRef<{ t: number; x: number; y: number } | null>(null);
  const heartIdRef = useRef(0);
  const alreadyLikedRef = useRef(false);
  // Track pending despawn timers so an unmount mid-animation doesn't fire
  // setHearts on a torn-down component.
  const pendingTimersRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());
  // Guard so concurrent double-taps don't fire multiple POSTs while the
  // first one is still inflight.
  const likeInflightRef = useRef(false);
  // Cached prefers-reduced-motion result so we don't query the media query
  // on every double-tap.
  const reducedMotionRef = useRef(false);

  // One-time fetch of the "already liked?" state, so subsequent double-taps
  // can skip the POST (which would otherwise toggle the like off).
  useEffect(() => {
    if (!enabled || isOwner || !shareId) return;
    const sessionId = getSessionId();
    if (!sessionId) return;

    let cancelled = false;
    fetch(
      `/api/reactions/${shareId}?sessionId=${encodeURIComponent(sessionId)}`,
      { method: "GET" },
    )
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        const userReactions: string[] = data.userReactions ?? [];
        if (userReactions.length > 0) {
          alreadyLikedRef.current = true;
        }
      })
      .catch(() => {
        // Non-fatal — worst case we POST once and toggle. Keep silent.
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, isOwner, shareId]);

  // Cache prefers-reduced-motion. We read it lazily so SSR doesn't blow up.
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    reducedMotionRef.current = mq.matches;
    const onChange = (e: MediaQueryListEvent) => {
      reducedMotionRef.current = e.matches;
    };
    // Older Safari uses addListener
    if (typeof mq.addEventListener === "function") {
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    }
    mq.addListener(onChange);
    return () => mq.removeListener(onChange);
  }, []);

  /** Fire-and-forget POST. Skipped if the viewer has already liked, so we
   *  never accidentally un-like via double-tap. */
  const sendLike = useCallback(() => {
    if (alreadyLikedRef.current || likeInflightRef.current) return;
    const sessionId = getSessionId();
    if (!sessionId) return;

    likeInflightRef.current = true;
    fetch(`/api/reactions/${shareId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reactionType: "heart", sessionId }),
    })
      .then((res) => {
        if (res.ok) {
          alreadyLikedRef.current = true;
        }
      })
      .catch(() => {
        // Swallow — visual feedback already happened. The user can
        // still tap the heart button in the dock if it matters.
      })
      .finally(() => {
        likeInflightRef.current = false;
      });

    posthog?.capture("report_double_tap_liked", { share_id: shareId });
  }, [shareId, posthog]);

  const spawnHeart = useCallback((x: number, y: number) => {
    const id = ++heartIdRef.current;
    setHearts((prev) => [...prev, { id, x, y }]);
    const ttl = reducedMotionRef.current ? HEART_REDUCED_MS : HEART_ANIM_MS;
    const timer = setTimeout(() => {
      pendingTimersRef.current.delete(timer);
      setHearts((prev) => prev.filter((h) => h.id !== id));
    }, ttl + 40 /* small buffer past the animation end */);
    pendingTimersRef.current.add(timer);
  }, []);

  // Cancel every pending despawn timer on unmount.
  useEffect(() => {
    const timers = pendingTimersRef.current;
    return () => {
      for (const t of timers) clearTimeout(t);
      timers.clear();
    };
  }, []);

  // The actual gesture listener. Mounted on window so we get every press
  // regardless of where the orchestrator inserts the overlay in the tree.
  useEffect(() => {
    if (!enabled || isOwner) return;
    if (typeof window === "undefined") return;

    const onPointerDown = (e: PointerEvent) => {
      // Only handle primary button on mouse / direct touch. Ignore right-click,
      // middle-click, pen barrel buttons, etc.
      if (e.button !== undefined && e.button !== 0) return;

      const target = e.target as Element | null;
      if (target && typeof target.closest === "function") {
        if (target.closest(INTERACTIVE_SELECTOR)) return;
      }

      const now = e.timeStamp || Date.now();
      const x = e.clientX;
      const y = e.clientY;
      const last = lastTapRef.current;

      if (
        last &&
        now - last.t < DOUBLE_TAP_WINDOW_MS &&
        Math.hypot(x - last.x, y - last.y) < DOUBLE_TAP_DISTANCE_PX
      ) {
        // Double-tap detected. Clear the ref so a third tap doesn't chain.
        lastTapRef.current = null;
        spawnHeart(x, y);
        // Tiny haptic on supported devices. Optional chaining is intentional —
        // not all browsers expose vibrate(), and iOS Safari ignores it.
        try {
          const nav = navigator as Navigator & {
            vibrate?: (pattern: number | number[]) => boolean;
          };
          nav.vibrate?.(12);
        } catch {
          // Some browsers throw on vibrate inside non-user gestures.
        }
        sendLike();
        return;
      }

      lastTapRef.current = { t: now, x, y };
    };

    // `passive: true` keeps scrolling silky-smooth — we never call
    // preventDefault from this listener.
    window.addEventListener("pointerdown", onPointerDown, { passive: true });
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
    };
  }, [enabled, isOwner, sendLike, spawnHeart]);

  if (!enabled || isOwner) return null;

  return (
    <div
      aria-hidden="true"
      // The overlay never intercepts events — it's purely a visual canvas.
      // We fix it to the viewport so hearts sit on top of slide content
      // without disturbing layout.
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 30,
        pointerEvents: "none",
        // Composite hint: hearts only mutate transform + opacity.
        contain: "layout paint",
      }}
    >
      {/* Inline keyframes for the burst — scoped to this overlay so we don't
          need a Tailwind config change or a separate CSS file. The reduced-
          motion branch uses a simpler fade-only keyframe. */}
      <style>{`
        @keyframes vgc-double-tap-heart {
          0%   { transform: translate(-50%, -50%) scale(0);   opacity: 0; }
          15%  { transform: translate(-50%, -50%) scale(1.2); opacity: 1; }
          40%  { transform: translate(-50%, -50%) scale(1);   opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(1.5); opacity: 0; }
        }
        @keyframes vgc-double-tap-heart-reduced {
          0%   { transform: translate(-50%, -50%) scale(1); opacity: 0.9; }
          100% { transform: translate(-50%, -50%) scale(1); opacity: 0;   }
        }
      `}</style>

      {hearts.map((h) => {
        const reduced = reducedMotionRef.current;
        return (
          <span
            key={h.id}
            className="text-red-500"
            style={{
              position: "fixed",
              left: h.x,
              top: h.y,
              // We translate(-50%, -50%) inside the keyframe so the heart is
              // centred on the tap point regardless of its rendered size.
              transform: "translate(-50%, -50%)",
              willChange: "transform, opacity",
              animation: reduced
                ? `vgc-double-tap-heart-reduced ${HEART_REDUCED_MS}ms ease-out forwards`
                : `vgc-double-tap-heart ${HEART_ANIM_MS}ms cubic-bezier(0.22, 1, 0.36, 1) forwards`,
              pointerEvents: "none",
            }}
          >
            <HeartBurstIcon />
          </span>
        );
      })}
    </div>
  );
}
