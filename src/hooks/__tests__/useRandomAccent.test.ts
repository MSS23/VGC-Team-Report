// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useRandomAccent } from "@/hooks/useRandomAccent";

const { applyRandomAccent } = vi.hoisted(() => ({ applyRandomAccent: vi.fn() }));
vi.mock("@/lib/utils/random-accent", () => ({ applyRandomAccent }));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function Probe({ deps }: { deps: unknown[] }) {
  useRandomAccent(...deps);
  return null;
}

function mount(deps: unknown[]) {
  const root = createRoot(document.createElement("div"));
  act(() => root.render(createElement(Probe, { deps })));
  return {
    rerender: (next: unknown[]) => act(() => root.render(createElement(Probe, { deps: next }))),
    unmount: () => act(() => root.unmount()),
  };
}

afterEach(() => applyRandomAccent.mockClear());

describe("useRandomAccent", () => {
  it("applies once after mount and never again without deps", () => {
    const view = mount([]);
    expect(applyRandomAccent).toHaveBeenCalledTimes(1);
    view.rerender([]);
    view.unmount();
    expect(applyRandomAccent).toHaveBeenCalledTimes(1);
  });

  it("re-rolls when a passed value changes, like the [posthog] effects", () => {
    const a = {};
    const view = mount([a]);
    view.rerender([a]);
    expect(applyRandomAccent).toHaveBeenCalledTimes(1);
    view.rerender([{}]);
    expect(applyRandomAccent).toHaveBeenCalledTimes(2);
    view.unmount();
  });
});
