// @vitest-environment jsdom
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { applyRandomAccent, clearRandomAccent } from "@/lib/utils/random-accent";

const GLOBALS_CSS = readFileSync(resolve(process.cwd(), "src/app/globals.css"), "utf-8");

/** The six palette-data properties applyRandomAccent() is allowed to write. */
const DATA_PROPS = [
  "--random-accent-light",
  "--random-accent-light-tint",
  "--random-accent-light-surface",
  "--random-accent-dark",
  "--random-accent-dark-tint",
  "--random-accent-dark-surface",
];

/**
 * Theme tokens the stylesheet owns. An inline declaration on <html> outranks
 * every selector, so any of these written inline makes the [data-dark-mode]
 * rule unreachable — the c4938de regression.
 */
const THEME_PROPS = ["--accent", "--accent-light", "--accent-surface"];

/** Rose is PALETTES[0], so Math.random() === 0 pins the expected values. */
const ROSE = {
  name: "rose",
  accent: "#E11D48",
  tint: "#FDA4AF",
  surface: "#FFF1F2",
  darkAccent: "#FB7185",
  darkSurface: "#3B1525",
};

function root() {
  return document.documentElement;
}

function inline(prop: string) {
  return root().style.getPropertyValue(prop);
}

/** Let the MutationObserver microtask flush. */
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

beforeEach(() => {
  vi.spyOn(Math, "random").mockReturnValue(0);
  root().removeAttribute("style");
  root().removeAttribute("data-dark-mode");
  delete root().dataset.randomAccent;
});

afterEach(() => {
  clearRandomAccent();
  root().removeAttribute("style");
  root().removeAttribute("data-dark-mode");
  vi.restoreAllMocks();
});

describe("applyRandomAccent", () => {
  it("writes both halves of the chosen palette plus the selector hook", () => {
    applyRandomAccent();

    expect(root().dataset.randomAccent).toBe(ROSE.name);
    expect(inline("--random-accent-light")).toBe(ROSE.accent);
    expect(inline("--random-accent-light-tint")).toBe(ROSE.tint);
    expect(inline("--random-accent-light-surface")).toBe(ROSE.surface);
    expect(inline("--random-accent-dark")).toBe(ROSE.darkAccent);
    expect(inline("--random-accent-dark-tint")).toBe(ROSE.tint);
    expect(inline("--random-accent-dark-surface")).toBe(ROSE.darkSurface);
  });

  // REGRESSION (c4938de "revert: restore the pre-Hallmark layout and theme"):
  // the light palette was written straight onto --accent / --accent-surface as
  // inline styles, which outrank [data-dark-mode]. Dark mode then rendered
  // #E11D48 text and a near-white #FFF1F2 accent surface on the #0B0B1A
  // background, and the --accent-dark / --accent-surface-dark properties the
  // dark rule read were never consumable.
  it("never sets a theme token inline, so [data-dark-mode] stays authoritative", () => {
    applyRandomAccent();

    for (const prop of THEME_PROPS) expect(inline(prop)).toBe("");
    expect(root().getAttribute("style")).not.toMatch(/(^|;)\s*--accent\s*:/);
  });

  it("clears an inline theme accent written earlier (layout.tsx gen-theme script)", () => {
    root().setAttribute("data-dark-mode", "");
    root().style.setProperty("--accent", "#fda4af");
    root().style.setProperty("--accent-surface", "#881337");

    applyRandomAccent();

    for (const prop of THEME_PROPS) expect(inline(prop)).toBe("");
    expect(inline("--random-accent-dark")).toBe(ROSE.darkAccent);
  });

  it("keeps the stylesheet authoritative when the gen theme re-applies on a dark toggle", async () => {
    applyRandomAccent();

    // useTheme.ts observes data-dark-mode and re-writes inline --accent.
    root().setAttribute("data-dark-mode", "");
    root().style.setProperty("--accent", "#fda4af");
    root().style.setProperty("--accent-surface", "#881337");
    await flush();

    for (const prop of THEME_PROPS) expect(inline(prop)).toBe("");
    expect(root().dataset.randomAccent).toBe(ROSE.name);
  });

  it("leaves a deliberate accent change alone (the theme picker)", async () => {
    applyRandomAccent();

    // applyAccentTheme() from ThemePicker — a user choice, no dark toggle.
    root().style.setProperty("--accent", "#0891B2");
    await flush();

    expect(inline("--accent")).toBe("#0891B2");
  });

  it("writes no property the stylesheet does not consume", () => {
    applyRandomAccent();

    const written = (root().getAttribute("style") ?? "")
      .split(";")
      .map((decl) => decl.split(":")[0].trim())
      .filter((prop) => prop.startsWith("--"));

    expect(written.sort()).toEqual([...DATA_PROPS].sort());
    for (const prop of written) {
      expect(GLOBALS_CSS, `${prop} is written inline but nothing reads it`).toContain(
        `var(${prop})`,
      );
    }
  });
});

describe("globals.css accent mapping", () => {
  it("maps the light half on :root and the dark half under [data-dark-mode]", () => {
    const lightRule = GLOBALS_CSS.match(/:root\[data-random-accent\]\s*\{([^}]*)\}/);
    const darkRule = GLOBALS_CSS.match(
      /:root\[data-dark-mode\]\[data-random-accent\]\s*\{([^}]*)\}/,
    );

    expect(lightRule?.[1]).toContain("--accent: var(--random-accent-light)");
    expect(lightRule?.[1]).toContain("--accent-surface: var(--random-accent-light-surface)");
    expect(darkRule?.[1]).toContain("--accent: var(--random-accent-dark)");
    expect(darkRule?.[1]).toContain("--accent-surface: var(--random-accent-dark-surface)");
    // The dark mapping must be at least as specific as the light one AND also
    // match [data-dark-mode], otherwise the light half would win in dark mode.
    expect(GLOBALS_CSS.indexOf(darkRule?.[0] ?? "")).toBeGreaterThan(
      GLOBALS_CSS.indexOf(lightRule?.[0] ?? ""),
    );
  });

  it("no longer reads the dead --accent-dark hook that the inline styles shadowed", () => {
    expect(GLOBALS_CSS).not.toContain("var(--accent-dark");
    expect(GLOBALS_CSS).not.toContain("var(--accent-surface-dark");
  });

  it("gives --danger, --success and --warning dark-mode values", () => {
    const darkBlock = GLOBALS_CSS.match(/\n\[data-dark-mode\]\s*\{([\s\S]*?)\n\}/);

    expect(darkBlock?.[1]).toContain("--danger: #F87171");
    expect(darkBlock?.[1]).toContain("--success: #4ADE80");
    expect(darkBlock?.[1]).toContain("--warning: #FBBF24");
  });
});

describe("clearRandomAccent", () => {
  it("removes every palette property, the legacy names and the hook", () => {
    applyRandomAccent();
    clearRandomAccent();

    for (const prop of [...DATA_PROPS, ...THEME_PROPS, "--accent-dark", "--accent-surface-dark"]) {
      expect(inline(prop)).toBe("");
    }
    expect(root().dataset.randomAccent).toBeUndefined();
    expect(root().hasAttribute("data-random-accent")).toBe(false);
  });

  it("restores the CSS defaults in dark mode too", () => {
    root().setAttribute("data-dark-mode", "");
    applyRandomAccent();
    clearRandomAccent();

    expect(root().getAttribute("style") || "").toBe("");
    expect(root().hasAttribute("data-random-accent")).toBe(false);
  });

  it("stops guarding, so the theme can own the accent again", async () => {
    applyRandomAccent();
    clearRandomAccent();

    // reapplyCurrentTheme() in HomePageClient runs right after the clear.
    root().style.setProperty("--accent", "#e11d48");
    await flush();

    expect(inline("--accent")).toBe("#e11d48");
  });
});
