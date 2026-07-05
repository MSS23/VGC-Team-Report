import { createElement, act } from "react";
import { createRoot, type Root } from "react-dom/client";

// react's act() requires this flag to be set in a test environment.
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/**
 * Minimal `renderHook` with no @testing-library dependency.
 *
 * Renders `useHook` inside a real React tree (under the jsdom environment) so
 * that hooks, refs, state, and effects all behave exactly as they do in the
 * app. `current` always reflects the latest render's return value.
 */
export function renderHook<T>(useHook: () => T): { current: T; unmount: () => void } {
  const container = document.createElement("div");
  let value!: T;
  let root!: Root;
  function Probe() {
    value = useHook();
    return null;
  }
  act(() => {
    root = createRoot(container);
    root.render(createElement(Probe));
  });
  return {
    get current() {
      return value;
    },
    unmount() {
      act(() => root.unmount());
    },
  };
}
