"use client";

/**
 * Lazy boundary for `motion/react` (VGC-268).
 *
 * `motion` is ~38 kB gzipped and was eagerly imported by ~7 routes purely for
 * decorative entrance animations, so it sat in the initial client bundle of
 * every one of them. This module keeps it out of the eager graph the same way
 * `PostHogProvider` keeps `posthog-js` out: a module-level singleton plus thin
 * shims, resolved by a dynamic `import()` after mount.
 *
 * Degradation contract (animation is decorative — content is not):
 * - Before the chunk resolves each shim renders the plain DOM element with the
 *   motion-only props stripped, so markup, classes, layout, text and keyboard
 *   behaviour are identical and fully visible. No blank space, no layout shift,
 *   no flash of missing content — the static fallback IS the final visual state.
 * - If the chunk lands after that first paint, the real motion element mounts
 *   with `initial={false}`: motion adopts the animated (final) values instead of
 *   replaying the entrance from an invisible state, which would flash. Nothing
 *   about the authored values, durations or easings is modified.
 * - When the module is already cached — soft navigations, and anything that
 *   mounts on interaction such as modals or expanding panels — the animation
 *   plays exactly as authored.
 *
 * Call sites keep their `initial`/`animate`/`variants` props verbatim; only the
 * import and the element name change (`motion.div` -> `MotionDiv`).
 */

import {
  createElement,
  useEffect,
  useLayoutEffect,
  useState,
  useSyncExternalStore,
  type ComponentType,
  type ReactNode,
} from "react";
import type { AnimatePresenceProps, HTMLMotionProps } from "motion/react";

type MotionModule = typeof import("motion/react");

let motionModule: MotionModule | null = null;
let motionPromise: Promise<MotionModule> | null = null;

function loadMotion(): Promise<MotionModule> {
  motionPromise ??= import("motion/react").then((mod) => {
    motionModule = mod;
    return mod;
  });
  return motionPromise;
}

// useLayoutEffect would warn during SSR; the swap only matters in the browser.
const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

interface MotionState {
  mod: MotionModule | null;
  /**
   * True when the module was already resolved on this instance's first render,
   * i.e. nothing has been painted yet in the un-animated state, so the entrance
   * animation is safe to play.
   */
  canAnimate: boolean;
}

function useMotionModule(): MotionState {
  // Always start from the fallback so the client's first render matches the
  // server HTML; the swap happens in a layout effect (before paint).
  const [mod, setMod] = useState<MotionModule | null>(null);
  const [canAnimate] = useState(() => motionModule !== null);

  useIsomorphicLayoutEffect(() => {
    if (mod) return;
    if (motionModule) {
      setMod(motionModule);
      return;
    }
    let active = true;
    void loadMotion().then((resolved) => {
      if (active) setMod(resolved);
    });
    return () => {
      active = false;
    };
  }, [mod]);

  return { mod, canAnimate };
}

/** Props that only mean something to motion and must not reach the DOM. */
const MOTION_ONLY_PROPS = new Set([
  "initial",
  "animate",
  "exit",
  "transition",
  "variants",
  "custom",
  "inherit",
  "layout",
  "layoutId",
  "layoutDependency",
  "layoutScroll",
  "layoutRoot",
  "drag",
  "dragConstraints",
  "dragElastic",
  "dragMomentum",
  "whileHover",
  "whileTap",
  "whilePress",
  "whileFocus",
  "whileDrag",
  "whileInView",
  "viewport",
  "transformTemplate",
  "onAnimationStart",
  "onAnimationComplete",
  "onUpdate",
  "onLayoutAnimationStart",
  "onLayoutAnimationComplete",
  "onViewportEnter",
  "onViewportLeave",
]);

function stripMotionProps(props: Record<string, unknown>): Record<string, unknown> {
  const domProps: Record<string, unknown> = {};
  for (const key of Object.keys(props)) {
    if (!MOTION_ONLY_PROPS.has(key)) domProps[key] = props[key];
  }
  return domProps;
}

function createLazyMotion<T extends keyof HTMLElementTagNameMap>(tag: T) {
  type Props = HTMLMotionProps<T>;

  function LazyMotionElement(props: Props) {
    const { mod, canAnimate } = useMotionModule();

    if (!mod) {
      return createElement(tag, stripMotionProps(props as Record<string, unknown>));
    }

    const Motion = mod.motion[tag] as unknown as ComponentType<Props>;
    // Late arrival: the element is already painted in its final state, so start
    // there rather than replaying the entrance (which would flash).
    return <Motion {...props} initial={canAnimate ? props.initial : false} />;
  }

  LazyMotionElement.displayName = `LazyMotion.${tag}`;
  return LazyMotionElement;
}

export const MotionDiv = createLazyMotion("div");
export const MotionA = createLazyMotion("a");
export const MotionP = createLazyMotion("p");
export const MotionForm = createLazyMotion("form");
export const MotionButton = createLazyMotion("button");
export const MotionSection = createLazyMotion("section");

/**
 * Drop-in for motion's `AnimatePresence`. Until the chunk resolves children are
 * rendered as-is (they simply mount/unmount without an exit animation); mounting
 * this shim is also what kicks off the load for trees whose animated children
 * only appear after a user interaction.
 */
export function AnimatePresence({
  children,
  ...rest
}: AnimatePresenceProps & { children?: ReactNode }) {
  const { mod } = useMotionModule();

  if (!mod) return <>{children}</>;

  const Presence = mod.AnimatePresence;
  return <Presence {...rest}>{children}</Presence>;
}

/**
 * Local `prefers-reduced-motion` hook with the same semantics as motion's
 * `useReducedMotion` (false during SSR / first render, then the live value), so
 * reduced-motion branches keep working without pulling motion into the bundle.
 */
let reducedMotionQuery: MediaQueryList | null = null;

function getReducedMotionQuery(): MediaQueryList {
  reducedMotionQuery ??= window.matchMedia("(prefers-reduced-motion: reduce)");
  return reducedMotionQuery;
}

function subscribeReducedMotion(onChange: () => void): () => void {
  const query = getReducedMotionQuery();
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

export function useReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => getReducedMotionQuery().matches,
    () => false,
  );
}
