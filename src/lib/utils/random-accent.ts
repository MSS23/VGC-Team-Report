/** Under the Coral system the page has one accent set: the ink board for the primary, coral as the signal.
 *  The list is kept so the per-page call sites and the dataset marker keep working; it holds the one Coral set. */
const PALETTES = [
  { name: "coral", accent: "oklch(22% 0.011 40)", signal: "oklch(45% 0.16 29)", light: "oklch(74% 0.125 30)", surface: "oklch(95.5% 0.025 40)", darkAccent: "oklch(90% 0.012 70)", darkSignal: "oklch(78% 0.12 30)", darkSurface: "oklch(26% 0.04 35)" },
] as const;

/** Apply a random accent palette to the document root. */
export function applyRandomAccent(): void {
  if (typeof document === "undefined") return;
  const palette = PALETTES[Math.floor(Math.random() * PALETTES.length)];
  const root = document.documentElement;
  // Inline custom properties outrank the [data-dark-mode] rule, so the dark variant is chosen here
  const isDark = root.hasAttribute("data-dark-mode");
  root.style.setProperty("--accent", isDark ? palette.darkAccent : palette.accent);
  root.style.setProperty("--accent-light", palette.light);
  root.style.setProperty("--accent-surface", isDark ? palette.darkSurface : palette.surface);
  root.style.setProperty("--accent-dark", palette.darkAccent);
  root.style.setProperty("--accent-surface-dark", palette.darkSurface);
  root.style.setProperty("--signal", isDark ? palette.darkSignal : palette.signal);
  root.style.setProperty("--signal-dark", palette.darkSignal);
  root.dataset.randomAccent = palette.name;
}

/** Remove random accent — restore CSS defaults for the report author's theme. */
export function clearRandomAccent(): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.style.removeProperty("--accent");
  root.style.removeProperty("--accent-light");
  root.style.removeProperty("--accent-surface");
  root.style.removeProperty("--accent-dark");
  root.style.removeProperty("--accent-surface-dark");
  root.style.removeProperty("--signal");
  root.style.removeProperty("--signal-dark");
  delete root.dataset.randomAccent;
}
