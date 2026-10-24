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
  { id: "rose",    name: "Rose",       accent: "#E11D48", accentLight: "#FDA4AF", accentSurface: "#FFF1F2", darkAccent: "#FB7185", darkSurface: "#3B1525" },
  { id: "ocean",   name: "Ocean Blue", accent: "#2563EB", accentLight: "#93C5FD", accentSurface: "#EFF6FF", darkAccent: "#60A5FA", darkSurface: "#172554" },
  { id: "emerald", name: "Emerald",    accent: "#059669", accentLight: "#6EE7B7", accentSurface: "#ECFDF5", darkAccent: "#34D399", darkSurface: "#064E3B" },
  { id: "amber",   name: "Amber",      accent: "#D97706", accentLight: "#FCD34D", accentSurface: "#FFFBEB", darkAccent: "#FBBF24", darkSurface: "#451A03" },
  { id: "violet",  name: "Violet",     accent: "#7C3AED", accentLight: "#C4B5FD", accentSurface: "#F5F3FF", darkAccent: "#A78BFA", darkSurface: "#2E1065" },
  { id: "sunset",  name: "Sunset",     accent: "#EA580C", accentLight: "#FDBA74", accentSurface: "#FFF7ED", darkAccent: "#FB923C", darkSurface: "#431407" },
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

/** Apply a specific accent theme to the document root */
export function applyAccentTheme(theme: AccentTheme): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.style.setProperty("--accent", theme.accent);
  root.style.setProperty("--accent-light", theme.accentLight);
  root.style.setProperty("--accent-surface", theme.accentSurface);
  root.style.setProperty("--accent-dark", theme.darkAccent);
  root.style.setProperty("--accent-surface-dark", theme.darkSurface);
}
