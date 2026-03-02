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
    accent: "#8b5cf6",        // Mewtwo purple
    accentLight: "#c4b5fd",
    accentSurface: "#f5f3ff",
    accentSurfaceDark: "#4c1d95",
    accentDark: "#c4b5fd",
    badge: "#8b5cf6",
  },
  gen2: {
    label: "Gold / Silver / Crystal",
    accent: "#d97706",        // Ho-Oh golden amber
    accentLight: "#fcd34d",
    accentSurface: "#fffbeb",
    accentSurfaceDark: "#78350f",
    accentDark: "#fcd34d",
    badge: "#d97706",
  },
  gen3: {
    label: "Ruby / Sapphire / Emerald",
    accent: "#16a34a",        // Rayquaza green
    accentLight: "#86efac",
    accentSurface: "#f0fdf4",
    accentSurfaceDark: "#14532d",
    accentDark: "#86efac",
    badge: "#16a34a",
  },
  gen4: {
    label: "Diamond / Pearl / Platinum",
    accent: "#3b82f6",        // Dialga steel blue
    accentLight: "#93c5fd",
    accentSurface: "#eff6ff",
    accentSurfaceDark: "#1e3a5f",
    accentDark: "#93c5fd",
    badge: "#3b82f6",
  },
  gen5: {
    label: "Black / White",
    accent: "#0ea5e9",        // Zekrom electric blue
    accentLight: "#7dd3fc",
    accentSurface: "#f0f9ff",
    accentSurfaceDark: "#0c4a6e",
    accentDark: "#7dd3fc",
    badge: "#0ea5e9",
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
    accent: "#ea580c",        // Solgaleo fiery orange
    accentLight: "#fdba74",
    accentSurface: "#fff7ed",
    accentSurfaceDark: "#7c2d12",
    accentDark: "#fdba74",
    badge: "#ea580c",
  },
  gen8: {
    label: "Sword / Shield",
    accent: "#0891b2",        // Zacian cyan
    accentLight: "#67e8f9",
    accentSurface: "#ecfeff",
    accentSurfaceDark: "#164e63",
    accentDark: "#67e8f9",
    badge: "#0891b2",
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
  { id: "gen1", abbr: "RBY",  label: "Red / Blue / Yellow",        badge: "#8b5cf6", legendary: "mewtwo" },
  { id: "gen2", abbr: "GSC",  label: "Gold / Silver / Crystal",    badge: "#d97706", legendary: "hooh" },
  { id: "gen3", abbr: "RSE",  label: "Ruby / Sapphire / Emerald",  badge: "#16a34a", legendary: "rayquaza" },
  { id: "gen4", abbr: "DPPt", label: "Diamond / Pearl / Platinum", badge: "#3b82f6", legendary: "dialga" },
  { id: "gen5", abbr: "BW",   label: "Black / White",              badge: "#0ea5e9", legendary: "zekrom" },
  { id: "gen6", abbr: "XY",   label: "X / Y",                      badge: "#dc2626", legendary: "yveltal" },
  { id: "gen7", abbr: "SM",   label: "Sun / Moon",                 badge: "#ea580c", legendary: "solgaleo" },
  { id: "gen8", abbr: "SwSh", label: "Sword / Shield",             badge: "#0891b2", legendary: "zacian" },
  { id: "gen9", abbr: "SV",   label: "Scarlet / Violet",           badge: "#e11d48", legendary: "koraidon" },
];

// ─── Shared external store so ALL useTheme() callers share state ────

const STORAGE_KEY = "vgc-gen-theme";
const listeners = new Set<() => void>();

let currentTheme: GenTheme = "gen9";

// Load from localStorage on module init (client only)
if (typeof window !== "undefined") {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && stored in GEN_PRESETS) currentTheme = stored as GenTheme;
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

function applyTheme(themeId: GenTheme) {
  const preset = GEN_PRESETS[themeId];
  const root = document.documentElement;
  const isDark = root.hasAttribute("data-dark-mode");
  root.style.setProperty("--accent", isDark ? preset.accentDark : preset.accent);
  root.style.setProperty("--accent-light", preset.accentLight);
  root.style.setProperty("--accent-surface", isDark ? preset.accentSurfaceDark : preset.accentSurface);
}

function setTheme(theme: GenTheme) {
  if (theme === currentTheme) return;
  currentTheme = theme;
  try { localStorage.setItem(STORAGE_KEY, theme); } catch {}
  if (typeof document !== "undefined") applyTheme(theme);
  listeners.forEach((fn) => fn());
}

// Apply theme on first load & watch dark mode changes
if (typeof window !== "undefined") {
  // Initial apply after DOM ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => applyTheme(currentTheme), { once: true });
  } else {
    applyTheme(currentTheme);
  }
  // Re-apply when dark mode toggles
  const observer = new MutationObserver(() => applyTheme(currentTheme));
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-dark-mode"] });
}

export function useTheme() {
  const genTheme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const setGenTheme = useCallback((theme: GenTheme) => setTheme(theme), []);
  return { genTheme, setGenTheme };
}
