// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PokemonSprite, nextSpriteFallbackState } from "../PokemonSprite";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const BASE = "https://play.pokemonshowdown.com/sprites";

/**
 * Records every background preload the progressive loader starts, so a test
 * can assert how many sprite requests a call site actually costs.
 */
class FakeImage {
  static created: FakeImage[] = [];
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  decoding = "";
  fetchPriority = "";
  src = "";
  constructor() {
    FakeImage.created.push(this);
  }
}

interface Mounted {
  img: HTMLImageElement;
  cleanup: () => void;
}

function mount(props: { species: string; animated?: boolean }): Mounted {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => root.render(createElement(PokemonSprite, props)));
  const img = container.querySelector("img") as HTMLImageElement;
  return {
    img,
    cleanup: () => {
      act(() => root.unmount());
      container.remove();
    },
  };
}

/** The progressive loader only starts the GIF once the preview is on screen. */
function loadPreview(img: HTMLImageElement) {
  act(() => {
    img.dispatchEvent(new Event("load"));
  });
}

function failImage(img: HTMLImageElement) {
  act(() => {
    img.dispatchEvent(new Event("error"));
  });
}

beforeEach(() => {
  FakeImage.created = [];
  vi.stubGlobal("Image", FakeImage);
});

afterEach(() => {
  vi.unstubAllGlobals();
  document.body.innerHTML = "";
});

describe("PokemonSprite animated default", () => {
  it("is opt-in: a default sprite fetches the static preview only, never the GIF", () => {
    const { img, cleanup } = mount({ species: "Incineroar" });

    expect(img.getAttribute("src")).toBe(`${BASE}/home/incineroar.png`);
    loadPreview(img);

    // Progressive loading would otherwise cost a second, much larger request
    // per sprite — 30 of 32 call sites (row icons, pickers) relied on this.
    expect(FakeImage.created).toHaveLength(0);
    expect(img.getAttribute("src")).toBe(`${BASE}/home/incineroar.png`);
    cleanup();
  });

  it("still animates when a call site opts in, preview first then GIF swap", () => {
    const { img, cleanup } = mount({ species: "Incineroar", animated: true });

    expect(img.getAttribute("src")).toBe(`${BASE}/home/incineroar.png`);
    loadPreview(img);

    expect(FakeImage.created).toHaveLength(1);
    const preload = FakeImage.created[0];
    expect(preload.src).toBe(`${BASE}/ani/incineroar.gif`);

    act(() => preload.onload?.());
    expect(img.getAttribute("src")).toBe(`${BASE}/ani/incineroar.gif`);
    cleanup();
  });
});

describe("PokemonSprite fallback chain", () => {
  it("advances one step per error and settles on the substitute sprite", () => {
    const { img, cleanup } = mount({ species: "Incineroar" });

    const seen = [img.getAttribute("src")];
    for (let i = 0; i < 5; i++) {
      failImage(img);
      seen.push(img.getAttribute("src"));
    }

    // One step per error, no repeats until the chain is exhausted.
    expect(seen[0]).toBe(`${BASE}/home/incineroar.png`);
    expect(seen[1]).toBe(`${BASE}/gen5/incineroar.png`);
    expect(new Set(seen).size).toBeLessThan(seen.length);
    expect(seen[seen.length - 1]).toBe(`${BASE}/gen5/substitute.png`);
    cleanup();
  });

  it("a failing GIF falls back to the preview without consuming a chain step", () => {
    const { img, cleanup } = mount({ species: "Incineroar", animated: true });
    loadPreview(img);
    act(() => FakeImage.created[0].onload?.());
    expect(img.getAttribute("src")).toBe(`${BASE}/ani/incineroar.gif`);

    failImage(img);
    // Back to the preview that already loaded, still at index 0.
    expect(img.getAttribute("src")).toBe(`${BASE}/home/incineroar.png`);

    failImage(img);
    expect(img.getAttribute("src")).toBe(`${BASE}/gen5/incineroar.png`);
    cleanup();
  });
});

describe("nextSpriteFallbackState", () => {
  it("keeps the preview index when the animated sprite on screen fails", () => {
    expect(
      nextSpriteFallbackState({
        urlIndex: 1,
        urlCount: 4,
        animatedSrc: `${BASE}/ani/incineroar.gif`,
        showingAnimated: true,
      }),
    ).toEqual({ urlIndex: 1, animatedSrc: null });
  });

  it("advances the chain when the preview on screen fails", () => {
    expect(
      nextSpriteFallbackState({
        urlIndex: 0,
        urlCount: 4,
        animatedSrc: null,
        showingAnimated: false,
      }),
    ).toEqual({ urlIndex: 1, animatedSrc: null });
  });

  it("regression: a stale animated src must not swallow the preview's error", () => {
    // The old guard read the animatedSrc state instead of the URL actually
    // rendered. A value left over from the previous species/theme is not on
    // screen, so its error was consumed, urlIndex never moved, and no further
    // error fired for the unchanged src — a permanently broken image.
    expect(
      nextSpriteFallbackState({
        urlIndex: 0,
        urlCount: 4,
        animatedSrc: `${BASE}/ani/koraidon.gif`,
        showingAnimated: false,
      }),
    ).toEqual({ urlIndex: 1, animatedSrc: null });
  });

  it("clamps at the last URL so the substitute sprite stays put", () => {
    expect(
      nextSpriteFallbackState({
        urlIndex: 3,
        urlCount: 4,
        animatedSrc: null,
        showingAnimated: false,
      }),
    ).toEqual({ urlIndex: 3, animatedSrc: null });
    expect(
      nextSpriteFallbackState({
        urlIndex: 0,
        urlCount: 0,
        animatedSrc: null,
        showingAnimated: false,
      }),
    ).toEqual({ urlIndex: 0, animatedSrc: null });
  });
});
