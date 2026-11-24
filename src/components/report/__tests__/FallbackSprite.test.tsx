// @vitest-environment jsdom
import { act, createElement, useState } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it } from "vitest";
import { FallbackSprite } from "../PokemonSprite";
import { getSpriteUrls } from "@/lib/utils/sprite-slug";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function render(props: Parameters<typeof FallbackSprite>[0]) {
  const container = document.createElement("div");
  const root = createRoot(container);
  act(() => root.render(createElement(FallbackSprite, props)));
  return { img: container.querySelector("img") as HTMLImageElement, root };
}

// Attribute order is irrelevant to the DOM; compare name/value pairs.
const attrs = (el: Element) => [...el.attributes].map((a) => [a.name, a.value]).sort();

// Verbatim copy of DashboardSprite (src/app/dashboard/DashboardContent.tsx) as of the cleanup.
function DashboardSpriteCopy({ species }: { species: string }) {
  const urls = getSpriteUrls(species);
  const [idx, setIdx] = useState(0);
  return (
    <img
      src={urls[Math.min(idx, urls.length - 1)]}
      alt={species}
      width={36}
      height={36}
      className="w-7 h-7 sm:w-9 sm:h-9 object-contain"
      loading="lazy"
      onError={() => setIdx((i) => Math.min(i + 1, urls.length - 1))}
    />
  );
}

describe("FallbackSprite", () => {
  it("renders the same markup as the local DashboardSprite copy, before and after an error", () => {
    const { img, root } = render({ species: "Incineroar", size: 36, className: "w-7 h-7 sm:w-9 sm:h-9 object-contain", loading: "lazy" });
    const container = document.createElement("div");
    const copyRoot = createRoot(container);
    act(() => copyRoot.render(createElement(DashboardSpriteCopy, { species: "Incineroar" })));
    const copy = container.querySelector("img") as HTMLImageElement;
    expect(attrs(img)).toEqual(attrs(copy));
    act(() => img.dispatchEvent(new Event("error")));
    act(() => copy.dispatchEvent(new Event("error")));
    expect(attrs(img)).toEqual(attrs(copy));
    act(() => root.unmount());
    act(() => copyRoot.unmount());
  });

  it("omits attributes that were not passed and walks the chain on error, stopping at the last URL", () => {
    const urls = getSpriteUrls("Amoonguss");
    const { img, root } = render({ species: "Amoonguss", size: 72, className: "c" });
    expect(img.hasAttribute("loading")).toBe(false);
    expect(img.hasAttribute("fetchpriority")).toBe(false);
    expect(img.hasAttribute("crossorigin")).toBe(false);
    for (let i = 1; i < urls.length + 2; i++) {
      act(() => img.dispatchEvent(new Event("error")));
      expect(img.getAttribute("src")).toBe(urls[Math.min(i, urls.length - 1)]);
    }
    act(() => root.unmount());
  });

  it("proxies URLs and passes alt/crossOrigin/fetchPriority through (OTSSheetModal, MegaSprite)", () => {
    const { img, root } = render({ species: "Tapu Fini", size: 72, className: "c", alt: "tapufini", crossOrigin: "anonymous", fetchPriority: "high", loading: "eager", proxied: true });
    expect(img.getAttribute("src")).toBe(`/api/sprite?u=${encodeURIComponent(getSpriteUrls("Tapu Fini")[0])}`);
    expect(img.getAttribute("alt")).toBe("tapufini");
    expect(img.getAttribute("crossorigin")).toBe("anonymous");
    expect(img.getAttribute("fetchpriority")).toBe("high");
    expect(img.getAttribute("loading")).toBe("eager");
    act(() => root.unmount());
  });
});
