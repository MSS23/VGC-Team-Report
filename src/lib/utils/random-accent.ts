/** Accent color palettes — each has light and dark mode variants */
const PALETTES = [
  { name: "rose",    accent: "#E11D48", light: "#FDA4AF", surface: "#FFF1F2", darkAccent: "#FB7185", darkSurface: "#3B1525" },
  { name: "violet",  accent: "#7C3AED", light: "#C4B5FD", surface: "#F5F3FF", darkAccent: "#A78BFA", darkSurface: "#2E1065" },
  { name: "blue",    accent: "#2563EB", light: "#93C5FD", surface: "#EFF6FF", darkAccent: "#60A5FA", darkSurface: "#172554" },
  { name: "emerald", accent: "#059669", light: "#6EE7B7", surface: "#ECFDF5", darkAccent: "#34D399", darkSurface: "#064E3B" },
  { name: "amber",   accent: "#D97706", light: "#FCD34D", surface: "#FFFBEB", darkAccent: "#FBBF24", darkSurface: "#451A03" },
  { name: "pink",    accent: "#DB2777", light: "#F9A8D4", surface: "#FDF2F8", darkAccent: "#F472B6", darkSurface: "#500724" },
  { name: "cyan",    accent: "#0891B2", light: "#67E8F9", surface: "#ECFEFF", darkAccent: "#22D3EE", darkSurface: "#083344" },
  { name: "orange",  accent: "#EA580C", light: "#FDBA74", surface: "#FFF7ED", darkAccent: "#FB923C", darkSurface: "#431407" },
] as const;

/**
 * Palette DATA properties written inline on <html>. Nothing in the stylesheet
 * themes these names directly, so writing them inline can never shadow a
 * theme rule: `globals.css` maps the `-light-*` half under
 * `:root[data-random-accent]` and the `-dark-*` half under
 * `:root[data-dark-mode][data-random-accent]`, which keeps the theme
 * SELECTOR — not the inline style — in charge of which half is live.
 *
 * `-light-`/`-dark-` names the MODE the half is for; `-tint` is the
 * `--accent-light` token (the pale tint), not the light mode.
 */
const DATA_PROPS = [
  "--random-accent-light",
  "--random-accent-light-tint",
  "--random-accent-light-surface",
  "--random-accent-dark",
  "--random-accent-dark-tint",
  "--random-accent-dark-surface",
] as const;

/**
 * Theme tokens that must never be set inline while a random accent is live.
 * An inline declaration outranks EVERY selector, `[data-dark-mode]` included,
 * so an inline `--accent` pins the accent to one mode's value and the
 * dark-mode mapping can never apply. That is the regression c4938de shipped:
 * the light palette written straight onto `--accent`/`--accent-surface`, so
 * dark mode rendered a near-white accent surface on the #0B0B1A background.
 *
 * The gen-theme code writes these inline too (the blocking script in
 * `layout.tsx` and `useTheme.applyTheme`, which re-fires on every dark-mode
 * toggle), so the random accent has to clear them to take effect at all.
 */
const THEME_PROPS = ["--accent", "--accent-light", "--accent-surface"] as const;

let inlineAccentGuard: MutationObserver | null = null;

function stripInlineThemeAccents(root: HTMLElement): void {
  for (const prop of THEME_PROPS) {
    // Removing an absent property is a no-op and mutates nothing, which is
    // what stops the guard below from re-triggering itself forever.
    if (root.style.getPropertyValue(prop)) root.style.removeProperty(prop);
  }
}

/**
 * While the random accent is live, keep the stylesheet authoritative across
 * dark-mode toggles: `useTheme`'s own observer re-writes an inline `--accent`
 * on every toggle, which would take the accent back and pin it again.
 *
 * Only `data-dark-mode` is watched, deliberately. Watching `style` would also
 * swallow a deliberate accent change (`applyAccentTheme` from the theme
 * picker on /dashboard/profile, which applies a random accent on mount), so a
 * user picking a color would see nothing happen. Observers flush as
 * microtasks in registration order, and `useTheme` registers at module
 * evaluation while this runs from an effect, so this callback lands after the
 * theme's. Worst case — if it ever landed first — the accent falls back to the
 * gen theme's own dark value, which is still a dark-mode color, never the
 * light palette the regression showed.
 */
function installInlineAccentGuard(root: HTMLElement): void {
  if (inlineAccentGuard || typeof MutationObserver === "undefined") return;
  inlineAccentGuard = new MutationObserver(() => {
    if (root.dataset.randomAccent) stripInlineThemeAccents(root);
  });
  inlineAccentGuard.observe(root, {
    attributes: true,
    attributeFilter: ["data-dark-mode"],
  });
}

/** Apply a random accent palette to the document root. */
export function applyRandomAccent(): void {
  if (typeof document === "undefined") return;
  const palette = PALETTES[Math.floor(Math.random() * PALETTES.length)];
  const root = document.documentElement;
  // Light-mode half.
  root.style.setProperty("--random-accent-light", palette.accent);
  root.style.setProperty("--random-accent-light-tint", palette.light);
  root.style.setProperty("--random-accent-light-surface", palette.surface);
  // Dark-mode half. The pale tint reads well on both backgrounds (every
  // palette tint clears 10:1 on #0B0B1A), so it is shared by both halves.
  root.style.setProperty("--random-accent-dark", palette.darkAccent);
  root.style.setProperty("--random-accent-dark-tint", palette.light);
  root.style.setProperty("--random-accent-dark-surface", palette.darkSurface);
  root.dataset.randomAccent = palette.name;
  stripInlineThemeAccents(root);
  installInlineAccentGuard(root);
}

/** Remove random accent — restore CSS defaults for the report author's theme. */
export function clearRandomAccent(): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  inlineAccentGuard?.disconnect();
  inlineAccentGuard = null;
  for (const prop of DATA_PROPS) root.style.removeProperty(prop);
  // Legacy names from the shadowed implementation, in case a stale inline
  // style survives a soft navigation.
  root.style.removeProperty("--accent-dark");
  root.style.removeProperty("--accent-surface-dark");
  for (const prop of THEME_PROPS) root.style.removeProperty(prop);
  delete root.dataset.randomAccent;
}
