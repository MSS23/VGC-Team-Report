/** Accent color themes unlockable via view milestones */

export interface AccentTheme {
  id: string;
  name: string;
  accent: string;
  accentLight: string;
  accentSurface: string;
  darkAccent: string;
  darkSurface: string;
}

export const ACCENT_THEMES: AccentTheme[] = [
  { id: "rose",    name: "Rose",       accent: "#DF1D47", accentLight: "#FDA4AF", accentSurface: "#FFF1F2", darkAccent: "#FB7185", darkSurface: "#3B1525" },
  { id: "ocean",   name: "Ocean Blue", accent: "#2563EB", accentLight: "#93C5FD", accentSurface: "#EFF6FF", darkAccent: "#60A5FA", darkSurface: "#172554" },
  { id: "emerald", name: "Emerald",    accent: "#04835C", accentLight: "#6EE7B7", accentSurface: "#ECFDF5", darkAccent: "#34D399", darkSurface: "#064E3B" },
  { id: "amber",   name: "Amber",      accent: "#AD5F05", accentLight: "#FCD34D", accentSurface: "#FFFBEB", darkAccent: "#FBBF24", darkSurface: "#451A03" },
  { id: "violet",  name: "Violet",     accent: "#7C3AED", accentLight: "#C4B5FD", accentSurface: "#F5F3FF", darkAccent: "#A78BFA", darkSurface: "#2E1065" },
  { id: "sunset",  name: "Sunset",     accent: "#C64B0A", accentLight: "#FDBA74", accentSurface: "#FFF7ED", darkAccent: "#FB923C", darkSurface: "#431407" },
];

/** View tiers — each tier unlocks one additional theme */
export const VIEW_TIERS = [
  { views: 0,    unlocks: 1 },  // Rose is always available
  { views: 100,  unlocks: 2 },
  { views: 500,  unlocks: 3 },
  { views: 1000, unlocks: 4 },
  { views: 5000, unlocks: 6 },  // All themes
] as const;

/** How many themes are unlocked for a given total view count */
export function getUnlockedCount(totalViews: number): number {
  let unlocked = 1;
  for (const tier of VIEW_TIERS) {
    if (totalViews >= tier.views) unlocked = tier.unlocks;
  }
  return unlocked;
}

/** Get the next tier milestone the user hasn't reached yet, or null if all unlocked */
export function getNextTier(totalViews: number): { views: number; unlocks: number } | null {
  for (const tier of VIEW_TIERS) {
    if (totalViews < tier.views) return tier;
  }
  return null;
}

/**
 * Apply a specific accent theme to the document root.
 *
 * KNOWN BUG (pre-existing, not VGC-315): this writes the LIGHT `--accent`
 * inline in both modes, and writes `--accent-dark` / `--accent-surface-dark`,
 * which nothing in `globals.css` reads. So a theme picked here shows its light
 * accent even in dark mode, and is lost entirely on the next dark-mode toggle
 * (`useTheme`'s observer rewrites `--accent` from the gen preset). This is the
 * same shape as the c4938de regression that `random-accent.ts` documents and
 * solves via the `--random-accent-*` data properties plus the
 * `:root[data-dark-mode][data-random-accent]` mapping; this path was never
 * migrated. Worth its own ticket — the fix is to route through that mechanism
 * rather than pinning tokens inline.
 */
export function applyAccentTheme(theme: AccentTheme): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.style.setProperty("--accent", theme.accent);
  root.style.setProperty("--accent-light", theme.accentLight);
  root.style.setProperty("--accent-surface", theme.accentSurface);
  // These are INLINE, so they outrank the [data-dark-mode] block: this path
  // pins the LIGHT accent in both modes (see the note below). The ink has to
  // be pinned with it, or dark mode would pair its #0B0B1A
  // --accent-foreground with this light accent — 3.42 : 1 on violet. White on
  // every theme.accent here is >= 4.75 : 1. (VGC-315)
  root.style.setProperty("--accent-foreground", "#FFFFFF");
  root.style.setProperty("--accent-dark", theme.darkAccent);
  root.style.setProperty("--accent-surface-dark", theme.darkSurface);
}
