// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useSwipeNavigation } from "@/hooks/useSwipeNavigation";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function touchEvent(type: string, x?: number, y?: number) {
  const event = new Event(type, { bubbles: true, cancelable: true });
  if (x !== undefined && y !== undefined) {
    Object.defineProperty(event, "targetTouches", {
      value: [{ clientX: x, clientY: y }],
    });
  }
  return event;
}

function renderGestures(callbacks: {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onDoubleTap?: () => void;
}) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);

  function Harness() {
    const ref = useSwipeNavigation({
      onSwipeLeft: callbacks.onSwipeLeft ?? vi.fn(),
      onSwipeRight: callbacks.onSwipeRight ?? vi.fn(),
      onDoubleTap: callbacks.onDoubleTap,
    });
    return createElement(
      "div",
      { ref, "data-testid": "surface" },
      createElement("div", { "data-testid": "blank" }),
      createElement("button", { type: "button", "data-testid": "button" }, "Action"),
    );
  }

  act(() => root.render(createElement(Harness)));
  return {
    blank: container.querySelector('[data-testid="blank"]') as HTMLElement,
    button: container.querySelector('[data-testid="button"]') as HTMLElement,
    cleanup: () => {
      act(() => root.unmount());
      container.remove();
    },
  };
}

afterEach(() => {
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

describe("useSwipeNavigation", () => {
  it("advances on a deliberate double-tap of non-interactive report space", () => {
    const onDoubleTap = vi.fn();
    const view = renderGestures({ onDoubleTap });

    view.blank.dispatchEvent(touchEvent("touchstart", 150, 200));
    view.blank.dispatchEvent(touchEvent("touchend"));
    view.blank.dispatchEvent(touchEvent("touchstart", 152, 201));
    view.blank.dispatchEvent(touchEvent("touchend"));

    expect(onDoubleTap).toHaveBeenCalledTimes(1);
    view.cleanup();
  });

  it("does not turn a double-tap on a button into slide navigation", () => {
    const onDoubleTap = vi.fn();
    const view = renderGestures({ onDoubleTap });

    view.button.dispatchEvent(touchEvent("touchstart", 150, 200));
    view.button.dispatchEvent(touchEvent("touchend"));
    view.button.dispatchEvent(touchEvent("touchstart", 150, 200));
    view.button.dispatchEvent(touchEvent("touchend"));

    expect(onDoubleTap).not.toHaveBeenCalled();
    view.cleanup();
  });

  it("keeps horizontal swipe navigation working", () => {
    const onSwipeLeft = vi.fn();
    const view = renderGestures({ onSwipeLeft });

    view.blank.dispatchEvent(touchEvent("touchstart", 220, 200));
    view.blank.dispatchEvent(touchEvent("touchmove", 120, 202));
    view.blank.dispatchEvent(touchEvent("touchend"));

    expect(onSwipeLeft).toHaveBeenCalledTimes(1);
    view.cleanup();
  });
});
