import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { ACCENT_THEMES } from "@/lib/accent-themes";

/**
 * Contrast guard for the accent system (VGC-315 / VGC-316).
 *
 * Both tickets were regressions of the same shape: a colour pair that nobody
 * had ever multiplied out. `bg-accent text-white` measured 1.40–2.72 : 1 in
 * dark mode across all 17 possible accents, and light mode failed for 7 of
 * the 9 gen themes. Separately, the `dark:` variant was never declared, so
 * Tailwind v4's built-in fallback pointed 142 `dark:` utilities at
 * `prefers-color-scheme` while the app themes off a `data-dark-mode`
 * attribute — the two desync the moment anyone uses the theme toggle.
 *
 * The accent values live in four places that must agree (globals.css, the
 * blocking bootstrap in layout.tsx, GEN_PRESETS in useTheme.ts and PALETTES
 * in random-accent.ts), none of which is importable as data. So this reads
 * them as text — the same approach random-accent.test.ts already uses for
 * globals.css — and does the WCAG arithmetic.
 */

const read = (p: string) => readFileSync(resolve(process.cwd(), p), "utf-8");
const GLOBALS_CSS = read("src/app/globals.css");
const USE_THEME = read("src/hooks/useTheme.ts");
const LAYOUT = read("src/app/layout.tsx");
const RANDOM_ACCENT = read("src/lib/utils/random-accent.ts");

// ── WCAG 2.1 relative luminance / contrast ratio ────────────────────

function channel(c: number): number {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

function luminance(hex: string): number {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  expect(full, `not a 6-digit hex: ${hex}`).toMatch(/^[0-9a-fA-F]{6}$/);
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16));
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrast(a: string, b: string): number {
  const [la, lb] = [luminance(a), luminance(b)];
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

const AA_NORMAL = 4.5;

/** Page backgrounds the accent is used as TEXT on, in light mode. */
const LIGHT_BACKGROUND = "#FAF9F6";

// ── token extraction ────────────────────────────────────────────────

/** Read a custom property out of a specific selector block in globals.css. */
function cssToken(selector: string, prop: string): string {
  const block = GLOBALS_CSS.split(selector)[1];
  expect(block, `selector not found in globals.css: ${selector}`).toBeTruthy();
  const m = block.slice(0, block.indexOf("}")).match(
    new RegExp(`${prop}:\\s*(#[0-9a-fA-F]{3,8})`)
  );
  expect(m, `${prop} not found in ${selector}`).toBeTruthy();
  return m![1];
}

const FG_LIGHT = cssToken(":root {", "--accent-foreground");
const FG_DARK = cssToken("[data-dark-mode] {", "--accent-foreground");

/** GEN_PRESETS in useTheme.ts: nine `accent` / `accentDark` pairs. */
function genPresets(): Record<string, { light: string; dark: string }> {
  const out: Record<string, { light: string; dark: string }> = {};
  for (const m of USE_THEME.matchAll(
    /(gen[1-9]): \{[\s\S]*?accent: "(#[0-9a-fA-F]{6})"[\s\S]*?accentDark: "(#[0-9a-fA-F]{6})"/g
  )) {
    out[m[1]] = { light: m[2], dark: m[3] };
  }
  return out;
}

/** PALETTES in random-accent.ts: eight `accent` / `darkAccent` pairs. */
function randomPalettes(): Record<string, { light: string; dark: string }> {
  const out: Record<string, { light: string; dark: string }> = {};
  for (const m of RANDOM_ACCENT.matchAll(
    /name: "(\w+)",\s*accent: "(#[0-9a-fA-F]{6})",[^}]*?darkAccent: "(#[0-9a-fA-F]{6})"/g
  )) {
    out[m[1]] = { light: m[2], dark: m[3] };
  }
  return out;
}

const GENS = genPresets();
const PALETTES = randomPalettes();

// ── VGC-316: the dark variant must be wired to the attribute ────────

describe("dark-mode variant wiring (VGC-316)", () => {
  // REGRESSION: globals.css declared only the `creator` and `presenting`
  // custom variants, so Tailwind v4 fell back to its built-in
  // `@media (prefers-color-scheme: dark)` for `dark:`. The app sets a
  // `data-dark-mode` attribute instead, with localStorage beating the OS, so
  // toggling the theme desynced the two signals: app-dark/OS-light left 40 of
  // 122 `dark:text-*` pairs showing their light colour on #141428 (worst
  // 1.87 : 1) and app-light/OS-dark put all 122 pale colours on #FAF9F6
  // (worst 1.25 : 1).
  it("declares @custom-variant dark against [data-dark-mode]", () => {
    const m = GLOBALS_CSS.match(/@custom-variant\s+dark\s+\(([^)]*)\)/);
    expect(m, "globals.css must declare `@custom-variant dark`").toBeTruthy();
    expect(m![1]).toContain("[data-dark-mode]");
    expect(m![1]).not.toContain("prefers-color-scheme");
  });

  // Nothing in the app ever adds a `dark` CLASS — useDarkMode.ts toggles the
  // attribute — so any `.dark` selector is dead code that silently drops its
  // dark-mode treatment.
  it("has no `.dark` class selectors left in globals.css", () => {
    const dead = GLOBALS_CSS.match(/(?:^|[\s(:])\.dark[\s.,:)[]/gm);
    expect(dead ?? [], `dead \`.dark\` selectors: ${dead?.join(", ")}`).toHaveLength(0);
  });

  it("detects dark mode from the attribute, not a class, when exporting", () => {
    // Strip comments: the fix documents the old call by name, so a raw
    // substring search would match its own changelog.
    const src = read("src/lib/utils/export-report.ts")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/\/\/.*$/gm, "");
    expect(src).toContain('hasAttribute("data-dark-mode")');
    expect(src).not.toContain('classList.contains("dark")');
  });
});

// ── VGC-315: every accent must be legible under --accent-foreground ─

describe("accent foreground contrast (VGC-315)", () => {
  it("defines --accent-foreground in both modes and exposes it to Tailwind", () => {
    expect(FG_LIGHT).toBeTruthy();
    expect(FG_DARK).toBeTruthy();
    // Without the @theme mapping there is no `text-accent-foreground` utility.
    expect(GLOBALS_CSS).toContain("--color-accent-foreground: var(--accent-foreground)");
  });

  it("found all nine gen presets and all eight random palettes", () => {
    expect(Object.keys(GENS)).toHaveLength(9);
    expect(Object.keys(PALETTES)).toHaveLength(8);
  });

  const all = () => [
    ...Object.entries(GENS).map(([k, v]) => [`gen:${k}`, v] as const),
    ...Object.entries(PALETTES).map(([k, v]) => [`random:${k}`, v] as const),
  ];

  // REGRESSION: `bg-accent text-white` measured 1.40 : 1 (gen3, white on the
  // #86efac pastel) through 2.72 : 1 in dark mode — the primary CTA on every
  // page was effectively invisible. Dark mode now inks with #0B0B1A.
  it.each(all())("%s: dark accent clears AA under --accent-foreground", (_name, v) => {
    expect(contrast(FG_DARK, v.dark)).toBeGreaterThanOrEqual(AA_NORMAL);
  });

  // REGRESSION: light mode failed too, for 7 of the 9 gen themes (gen5 was
  // 2.77 : 1) and 4 of the 8 random palettes. White ink cannot be made to
  // work on a mid-tone accent, so the light accents were darkened instead.
  it.each(all())("%s: light accent clears AA under --accent-foreground", (_name, v) => {
    expect(contrast(FG_LIGHT, v.light)).toBeGreaterThanOrEqual(AA_NORMAL);
  });

  // `text-accent` body copy and links, which sit ON the page background. This
  // is the stricter of the two constraints and is what sets how dark the
  // light accents have to be.
  it.each(all())("%s: light accent is legible as text on the page", (_name, v) => {
    expect(contrast(v.light, LIGHT_BACKGROUND)).toBeGreaterThanOrEqual(AA_NORMAL);
  });

  it("dark accents stay legible as text on the dark background", () => {
    for (const [name, v] of all()) {
      expect(contrast(v.dark, "#0B0B1A"), name).toBeGreaterThanOrEqual(AA_NORMAL);
    }
  });
});

// ── ACCENT_THEMES: the /dashboard/profile unlockable picker ─────────

describe("ACCENT_THEMES contrast (VGC-315)", () => {
  // `applyAccentTheme` pins `--accent` INLINE with the LIGHT value in both
  // modes (a pre-existing bug documented on the function), and now pins
  // `--accent-foreground: #FFFFFF` with it. So white-on-light-accent is the
  // ratio that governs this path in BOTH modes.
  it.each(ACCENT_THEMES.map((t) => [t.id, t] as const))(
    "%s: white is legible on the pinned light accent",
    (_id, theme) => {
      expect(contrast("#FFFFFF", theme.accent)).toBeGreaterThanOrEqual(AA_NORMAL);
    }
  );

  it("pins --accent-foreground so dark mode's ink cannot pair with a light accent", () => {
    const src = read("src/lib/accent-themes.ts");
    expect(src).toContain('setProperty("--accent-foreground", "#FFFFFF")');
  });

  // Should this path ever be migrated to the --random-accent-* mechanism, the
  // dark halves become live and must clear AA against #0B0B1A.
  it.each(ACCENT_THEMES.map((t) => [t.id, t] as const))(
    "%s: dark accent would clear AA under the dark ink",
    (_id, theme) => {
      expect(contrast(FG_DARK, theme.darkAccent)).toBeGreaterThanOrEqual(AA_NORMAL);
    }
  );

  it("is stripped by random-accent so a pinned ink cannot outlive its accent", () => {
    expect(read("src/lib/utils/random-accent.ts")).toMatch(
      /THEME_PROPS[\s\S]*?"--accent-foreground"[\s\S]*?\] as const/
    );
  });
});

// ── the sources of accent truth must not drift apart ────────────────

describe("accent values stay in sync across their four sources", () => {
  /** The blocking bootstrap in layout.tsx mirrors GEN_PRESETS inline. */
  function bootstrapPresets(): Record<string, { light: string; dark: string }> {
    const out: Record<string, { light: string; dark: string }> = {};
    for (const m of LAYOUT.matchAll(
      /"(gen[1-9])":\{a:"(#[0-9a-fA-F]{6})",l:"#[0-9a-fA-F]{6}",s:"#[0-9a-fA-F]{6}",ad:"(#[0-9a-fA-F]{6})"/g
    )) {
      out[m[1]] = { light: m[2], dark: m[3] };
    }
    return out;
  }

  // The bootstrap paints before hydration; if it disagrees with GEN_PRESETS
  // the accent visibly jumps when useTheme's observer re-applies it.
  it("layout.tsx's bootstrap script matches GEN_PRESETS exactly", () => {
    const boot = bootstrapPresets();
    expect(Object.keys(boot)).toHaveLength(9);
    for (const [gen, v] of Object.entries(GENS)) {
      expect(boot[gen]?.light.toLowerCase(), `${gen} light`).toBe(v.light.toLowerCase());
      expect(boot[gen]?.dark.toLowerCase(), `${gen} dark`).toBe(v.dark.toLowerCase());
    }
  });

  // The stylesheet's own --accent is the value that renders before any inline
  // accent is written (and inside the export/print containers). It tracks the
  // `rose` palette, not gen9: the light halves coincide at #DF1D47 but the
  // dark halves differ (rose-400 #FB7185 vs gen9's rose-300 #fda4af), so
  // asserting against gen9 would be wrong.
  it("globals.css's --accent fallbacks match the rose palette", () => {
    expect(cssToken(":root {", "--accent").toLowerCase()).toBe(
      PALETTES.rose.light.toLowerCase()
    );
    expect(cssToken("[data-dark-mode] {", "--accent").toLowerCase()).toBe(
      PALETTES.rose.dark.toLowerCase()
    );
  });
});
