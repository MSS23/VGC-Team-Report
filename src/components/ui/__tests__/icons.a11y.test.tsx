import { createElement, type FunctionComponent, type SVGProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import * as icons from "@/components/ui/icons";

/**
 * Regression guard (A11Y-ICONS): every shared icon is decorative.
 *
 * Decorative SVGs without `aria-hidden="true"` are announced by screen readers
 * as meaningless "graphic" nodes and can pick up keyboard focus in some
 * browsers — a WCAG 1.1.1 failure. The defaults are baked into each root
 * `<svg>` BEFORE `{...props}`, so a deliberate call-site override still wins;
 * this test locks in the default for every export, including newly added ones.
 */

type IconComponent = FunctionComponent<SVGProps<SVGSVGElement>>;

const entries = Object.entries(icons as Record<string, IconComponent>).filter(
  ([, value]) => typeof value === "function",
);

describe("shared icon set accessibility", () => {
  it("exports at least the known icon set", () => {
    expect(entries.length).toBeGreaterThanOrEqual(31);
  });

  it.each(entries)("%s renders a decorative root <svg>", (_name, Icon) => {
    const html = renderToStaticMarkup(createElement(Icon, {}));

    expect(html.startsWith("<svg")).toBe(true);

    const rootTag = html.slice(0, html.indexOf(">") + 1);
    expect(rootTag).toContain('aria-hidden="true"');
    expect(rootTag).toContain('focusable="false"');
  });

  it.each(entries)("%s lets the call site override aria-hidden", (_name, Icon) => {
    const html = renderToStaticMarkup(
      createElement(Icon, { "aria-hidden": false, role: "img", "aria-label": "labelled" }),
    );

    const rootTag = html.slice(0, html.indexOf(">") + 1);
    expect(rootTag).not.toContain('aria-hidden="true"');
    expect(rootTag).toContain('aria-label="labelled"');
  });
});
