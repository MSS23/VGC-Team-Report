"use client";

import { useCallback, useSyncExternalStore } from "react";

export type GenTheme = "gen1" | "gen2" | "gen3" | "gen4" | "gen5" | "gen6" | "gen7" | "gen8" | "gen9";

interface ThemePreset {
  label: string;
  accent: string;
  accentLight: string;
  accentSurface: string;
  accentSurfaceDark: string;
  accentDark: string;
  badge: string;
}

const GEN_PRESETS: Record<GenTheme, ThemePreset> = {
  gen1: {
    label: "Red / Blue / Yellow",
    accent: "#6d28d9",        // Mewtwo purple
    accentLight: "#c4b5fd",
    accentSurface: "#f5f3ff",
    accentSurfaceDark: "#4c1d95",
    accentDark: "#c4b5fd",
    badge: "#6d28d9",
  },
  gen2: {
    label: "Gold / Silver / Crystal",
    accent: "#b45309",        // Ho-Oh golden amber
    accentLight: "#fcd34d",
    accentSurface: "#fffbeb",
    accentSurfaceDark: "#78350f",
    accentDark: "#fcd34d",
    badge: "#b45309",
  },
  gen3: {
    label: "Ruby / Sapphire / Emerald",
    accent: "#15803d",        // Rayquaza green
    accentLight: "#86efac",
    accentSurface: "#f0fdf4",
    accentSurfaceDark: "#14532d",
    accentDark: "#86efac",
    badge: "#15803d",
  },
  gen4: {
    label: "Diamond / Pearl / Platinum",
    accent: "#1d4ed8",        // Dialga steel blue
    accentLight: "#93c5fd",
    accentSurface: "#eff6ff",
    accentSurfaceDark: "#1e3a5f",
    accentDark: "#93c5fd",
    badge: "#1d4ed8",
  },
  gen5: {
    label: "Black / White",
    accent: "#0369a1",        // Zekrom electric blue
    accentLight: "#7dd3fc",
    accentSurface: "#f0f9ff",
    accentSurfaceDark: "#0c4a6e",
    accentDark: "#7dd3fc",
    badge: "#0369a1",
  },
  gen6: {
    label: "X / Y",
    accent: "#dc2626",        // Yveltal crimson red
    accentLight: "#fca5a5",
    accentSurface: "#fef2f2",
    accentSurfaceDark: "#7f1d1d",
    accentDark: "#fca5a5",
    badge: "#dc2626",
  },
  gen7: {
    label: "Sun / Moon",
    accent: "#c2410c",        // Solgaleo fiery orange
    accentLight: "#fdba74",
    accentSurface: "#fff7ed",
    accentSurfaceDark: "#7c2d12",
    accentDark: "#fdba74",
    badge: "#c2410c",
  },
  gen8: {
    label: "Sword / Shield",
    accent: "#0e7490",        // Zacian cyan
    accentLight: "#67e8f9",
    accentSurface: "#ecfeff",
    accentSurfaceDark: "#164e63",
    accentDark: "#67e8f9",
    badge: "#0e7490",
  },
  gen9: {
    label: "Scarlet / Violet",
    accent: "#e11d48",        // Koraidon scarlet
    accentLight: "#fda4af",
    accentSurface: "#fff1f2",
    accentSurfaceDark: "#881337",
    accentDark: "#fda4af",
    badge: "#e11d48",
  },
};

export const GEN_THEMES: { id: GenTheme; abbr: string; label: string; badge: string; legendary: string }[] = [
  { id: "gen1", abbr: "RBY",  label: "Red / Blue / Yellow",        badge: "#6d28d9", legendary: "mewtwo" },
  { id: "gen2", abbr: "GSC",  label: "Gold / Silver / Crystal",    badge: "#b45309", legendary: "hooh" },
  { id: "gen3", abbr: "RSE",  label: "Ruby / Sapphire / Emerald",  badge: "#15803d", legendary: "rayquaza" },
  { id: "gen4", abbr: "DPPt", label: "Diamond / Pearl / Platinum", badge: "#1d4ed8", legendary: "dialga" },
  { id: "gen5", abbr: "BW",   label: "Black / White",              badge: "#0369a1", legendary: "zekrom" },
  { id: "gen6", abbr: "XY",   label: "X / Y",                      badge: "#dc2626", legendary: "yveltal" },
  { id: "gen7", abbr: "SM",   label: "Sun / Moon",                 badge: "#c2410c", legendary: "solgaleo" },
  { id: "gen8", abbr: "SwSh", label: "Sword / Shield",             badge: "#0e7490", legendary: "zacian" },
  { id: "gen9", abbr: "SV",   label: "Scarlet / Violet",           badge: "#e11d48", legendary: "koraidon" },
];

// ─── Shared external store so ALL useTheme() callers share state ────

const STORAGE_KEY = "vgc-gen-theme";
const listeners = new Set<() => void>();

let currentTheme: GenTheme = "gen9";
// The stylesheet opens in Coral. A gen palette is applied only once the visitor has picked one (stored), or a shared view pins one.
let hasStoredTheme = false;

// View override: when set (e.g. on a shared report view), this theme is
// applied to the DOM regardless of the viewer's own `currentTheme`. This
// lets shared reports pin viewers to the creator's chosen appearance
// without overwriting the viewer's stored preference. Null on own view.
let viewOverrideTheme: GenTheme | null = null;

// Load from localStorage on module init (client only)
if (typeof window !== "undefined") {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && stored in GEN_PRESETS) { currentTheme = stored as GenTheme; hasStoredTheme = true; }
  } catch {}
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): GenTheme {
  return currentTheme;
}

function getServerSnapshot(): GenTheme {
  return "gen9";
}

// Whether the visitor has picked a generation. Until they do, the page sits in the stylesheet's default and no generation is "active".
function getStoredSnapshot(): boolean {
  return hasStoredTheme;
}

function getStoredServerSnapshot(): boolean {
  return false;
}

function applyTheme(themeId: GenTheme) {
  // View override takes precedence, so shared reports stay on the creator's
  // theme even when the MutationObserver re-fires on dark-mode toggles.
  const effective = viewOverrideTheme ?? (hasStoredTheme ? themeId : null);
  const root = document.documentElement;
  if (!effective) {
    for (const prop of ["--accent", "--accent-light", "--accent-surface", "--signal"]) root.style.removeProperty(prop);
    return;
  }
  const preset = GEN_PRESETS[effective];
  const isDark = root.hasAttribute("data-dark-mode");
  root.style.setProperty("--accent", isDark ? preset.accentDark : preset.accent);
  root.style.setProperty("--accent-light", preset.accentLight);
  root.style.setProperty("--accent-surface", isDark ? preset.accentSurfaceDark : preset.accentSurface);
  root.style.setProperty("--signal", isDark ? preset.accentDark : preset.accent);
}

/**
 * Pin the DOM to a specific theme for the current view (e.g. a shared
 * report). Pass null to release the override. Doesn't touch localStorage,
 * so the viewer's own preference is preserved.
 */
export function setViewOverrideTheme(themeId: GenTheme | null) {
  viewOverrideTheme = themeId && themeId in GEN_PRESETS ? themeId : null;
  if (typeof document !== "undefined") applyTheme(currentTheme);
}

/**
 * Re-apply the current effective theme to the DOM. Used after utilities
 * like clearRandomAccent() wipe the accent custom properties, so that the
 * user's (or pinned shared-view) theme is restored instead of falling
 * through to raw CSS defaults.
 */
export function reapplyCurrentTheme() {
  if (typeof document !== "undefined") applyTheme(currentTheme);
}

function setTheme(theme: GenTheme) {
  if (theme === currentTheme) return;
  currentTheme = theme;
  hasStoredTheme = true;
  try { localStorage.setItem(STORAGE_KEY, theme); } catch {}
  if (typeof document !== "undefined") applyTheme(theme);
  listeners.forEach((fn) => fn());
}

// Theme accent colors are already applied by the blocking script in layout.tsx <head>.
// We only need to watch for dark-mode toggles to re-apply the correct light/dark variant.
if (typeof window !== "undefined") {
  const observer = new MutationObserver(() => applyTheme(currentTheme));
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-dark-mode"] });
}

export function useTheme() {
  const genTheme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const hasGenTheme = useSyncExternalStore(subscribe, getStoredSnapshot, getStoredServerSnapshot);
  const setGenTheme = useCallback((theme: GenTheme) => setTheme(theme), []);
  return { genTheme, hasGenTheme, setGenTheme };
}
