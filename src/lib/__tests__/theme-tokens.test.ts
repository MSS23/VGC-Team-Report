import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

const GLOBALS = fs.readFileSync(
  path.resolve(__dirname, "../../app/globals.css"),
  "utf8",
);

/**
 * Regression guards for theme-token wiring in globals.css.
 *
 * Both failures these cover are SILENT — nothing throws, the build succeeds and
 * the wrong colour is simply painted — so they can only be caught by asserting
 * on the stylesheet itself.
 */
describe("globals.css theme wiring", () => {
  it("binds Tailwind's dark: variant to [data-dark-mode], not the OS media query", () => {
    // Tailwind v4 silently defaults `dark:` to @media (prefers-color-scheme: dark).
    // The app toggles the `data-dark-mode` attribute instead (useDarkMode.ts), so
    // without this declaration every `dark:` utility follows the OS rather than the
    // in-app theme — measured as low as 1.29:1 when the two disagree.
    expect(GLOBALS).toMatch(/@custom-variant\s+dark\b/);
    const decl = GLOBALS.match(/@custom-variant\s+dark\s*\(([^)]*\)?[^;]*)\);/);
    expect(decl).not.toBeNull();
    expect(decl![1]).toContain("data-dark-mode");
    expect(decl![1]).not.toContain("prefers-color-scheme");
  });

  it("does not reintroduce a prefers-color-scheme dark variant alongside it", () => {
    // useDarkMode already seeds data-dark-mode from the media query on first load.
    // A second media-query-based dark variant would make both apply at once.
    expect(GLOBALS).not.toMatch(
      /@custom-variant\s+dark\s*\([^)]*prefers-color-scheme/,
    );
  });

  it("uses [data-dark-mode] for plain dark-mode selectors, never a .dark class", () => {
    // Nothing in the codebase ever adds a `dark` class, so `.dark …` rules are dead.
    expect(GLOBALS).not.toMatch(/(^|[\s,])\.dark[\s.[:]/m);
    expect(GLOBALS).not.toMatch(/:is\(\s*\.dark\s*\)/);
  });

  it("defines --accent-on in :root, [data-dark-mode] and both export themes", () => {
    // `bg-accent text-white` measured 1.40–1.90:1 in dark mode across all nine gen
    // themes. --accent-on is the on-accent foreground that replaced it.
    expect(GLOBALS).toMatch(/--accent-on:\s*#FFFFFF;/);
    expect(GLOBALS).toMatch(/--accent-on:\s*#0B0B1A;/);
    expect(GLOBALS).toMatch(/--accent-on:\s*#FFFFFF\s*!important;/);
    expect(GLOBALS).toMatch(/--accent-on:\s*#0B0B1A\s*!important;/);
    // exposed to Tailwind as the `accent-on` colour utility namespace
    expect(GLOBALS).toMatch(/--color-accent-on:\s*var\(--accent-on\);/);
  });

  it("derives --accent-on from --accent so it tracks runtime accent overrides", () => {
    // --accent is written as an inline style on <html> by three independent code
    // paths that disagree about the dark-mode value, so a static pair alone would
    // drift out of sync with the accent actually painted.
    const computed = GLOBALS.match(
      /--accent-on:\s*oklch\(from var\(--accent\)[^;]*;/,
    );
    expect(computed).not.toBeNull();
    // The static fallbacks must be declared BEFORE the computed rule, so browsers
    // without relative colour syntax fall back instead of losing the token.
    expect(GLOBALS.indexOf("--accent-on: #0B0B1A;")).toBeLessThan(
      GLOBALS.indexOf(computed![0]),
    );
  });
});
