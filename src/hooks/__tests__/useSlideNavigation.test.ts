// @vitest-environment jsdom
import { act } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useSlideNavigation } from "@/hooks/useSlideNavigation";
import { setShortcutsEnabled } from "@/lib/utils/keyboard-shortcuts";
import { renderHook } from "./render-hook";

function press(key: string, target?: Element) {
  const event = new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true });
  act(() => {
    (target ?? document.body).dispatchEvent(event);
  });
  return event;
}

/** A stand-in for the slide region in `src/app/page.tsx`. */
function mountSlideRegion({ scrollable }: { scrollable: boolean }) {
  const region = document.createElement("div");
  region.setAttribute("data-slide-scroll", "");
  region.setAttribute("data-slide-shortcut-scope", "");
  region.tabIndex = 0;
  // jsdom has no layout, so fake the scroll metrics.
  Object.defineProperty(region, "scrollHeight", { value: scrollable ? 1000 : 400, configurable: true });
  Object.defineProperty(region, "clientHeight", { value: 400, configurable: true });
  region.scrollTop = 0;
  document.body.appendChild(region);
  return region;
}

describe("useSlideNavigation", () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = "";
  });

  afterEach(() => {
    localStorage.clear();
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  it("moves between slides with the arrow keys", () => {
    const hook = renderHook(() => useSlideNavigation({ totalSlides: 5, enabled: true }));

    press("ArrowRight");
    expect(hook.current.currentSlide).toBe(1);
    press("ArrowLeft");
    expect(hook.current.currentSlide).toBe(0);

    hook.unmount();
  });

  describe("N-3: the scrolling slide region stays keyboard-scrollable", () => {
    it("leaves ArrowDown to the region while it still has room to scroll", () => {
      const region = mountSlideRegion({ scrollable: true });
      const hook = renderHook(() => useSlideNavigation({ totalSlides: 5, enabled: true }));

      const event = press("ArrowDown", region);
      expect(event.defaultPrevented).toBe(false);
      expect(hook.current.currentSlide).toBe(0);

      hook.unmount();
    });

    it("changes slide once the region is scrolled to the end", () => {
      const region = mountSlideRegion({ scrollable: true });
      region.scrollTop = 600; // scrollHeight - clientHeight
      const hook = renderHook(() => useSlideNavigation({ totalSlides: 5, enabled: true }));

      press("ArrowDown", region);
      expect(hook.current.currentSlide).toBe(1);

      hook.unmount();
    });

    it("changes slide immediately when the region does not overflow", () => {
      const region = mountSlideRegion({ scrollable: false });
      const hook = renderHook(() => useSlideNavigation({ totalSlides: 5, enabled: true }));

      press("ArrowDown", region);
      expect(hook.current.currentSlide).toBe(1);

      hook.unmount();
    });

    it("never diverts left/right, which do not scroll the region", () => {
      const region = mountSlideRegion({ scrollable: true });
      const hook = renderHook(() => useSlideNavigation({ totalSlides: 5, enabled: true }));

      press("ArrowRight", region);
      expect(hook.current.currentSlide).toBe(1);

      hook.unmount();
    });
  });

  describe("N-1: single-character shortcuts (WCAG 2.1.4)", () => {
    it("fires when nothing is focused", () => {
      const onToggleDarkMode = vi.fn();
      const hook = renderHook(() => useSlideNavigation({ totalSlides: 3, enabled: true, onToggleDarkMode }));

      press("d");
      expect(onToggleDarkMode).toHaveBeenCalledTimes(1);

      hook.unmount();
    });

    it("fires while focus is inside the report shell", () => {
      const region = mountSlideRegion({ scrollable: false });
      region.focus();
      const onToggleDarkMode = vi.fn();
      const hook = renderHook(() => useSlideNavigation({ totalSlides: 3, enabled: true, onToggleDarkMode }));

      press("d", region);
      expect(onToggleDarkMode).toHaveBeenCalledTimes(1);

      hook.unmount();
    });

    it("stays silent while focus sits outside the report shell", () => {
      const outside = document.createElement("button");
      document.body.appendChild(outside);
      outside.focus();
      const onToggleCreatorMode = vi.fn();
      const hook = renderHook(() => useSlideNavigation({ totalSlides: 3, enabled: true, onToggleCreatorMode }));

      press("e", outside);
      expect(onToggleCreatorMode).not.toHaveBeenCalled();

      hook.unmount();
    });

    it("stays silent once the user switches the shortcuts off", () => {
      const onToggleDarkMode = vi.fn();
      const onMoveSlideUp = vi.fn();
      const hook = renderHook(() =>
        useSlideNavigation({ totalSlides: 3, enabled: true, onToggleDarkMode, onMoveSlideUp })
      );

      act(() => setShortcutsEnabled(false));
      press("d");
      press("[");
      press("2");
      expect(onToggleDarkMode).not.toHaveBeenCalled();
      expect(onMoveSlideUp).not.toHaveBeenCalled();
      expect(hook.current.currentSlide).toBe(0);

      // Arrow keys are navigation keys, not character keys — they keep working.
      press("ArrowRight");
      expect(hook.current.currentSlide).toBe(1);

      act(() => setShortcutsEnabled(true));
      press("d");
      expect(onToggleDarkMode).toHaveBeenCalledTimes(1);

      hook.unmount();
    });

    it("never steals keys typed into a text field", () => {
      const input = document.createElement("input");
      document.body.appendChild(input);
      input.focus();
      const onToggleDarkMode = vi.fn();
      const hook = renderHook(() => useSlideNavigation({ totalSlides: 3, enabled: true, onToggleDarkMode }));

      press("d", input);
      expect(onToggleDarkMode).not.toHaveBeenCalled();

      hook.unmount();
    });
  });
});
