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

/** Apply a random accent palette to the document root. */
export function applyRandomAccent(): void {
  if (typeof document === "undefined") return;
  const palette = PALETTES[Math.floor(Math.random() * PALETTES.length)];
  const root = document.documentElement;
  root.style.setProperty("--accent", palette.accent);
  root.style.setProperty("--accent-light", palette.light);
  root.style.setProperty("--accent-surface", palette.surface);
  // Store dark variants as custom props for the dark mode selector to pick up
  root.style.setProperty("--accent-dark", palette.darkAccent);
  root.style.setProperty("--accent-surface-dark", palette.darkSurface);
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
  delete root.dataset.randomAccent;
}
