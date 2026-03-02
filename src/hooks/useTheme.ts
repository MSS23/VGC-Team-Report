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
    accent: "#dc2626",
    accentLight: "#fca5a5",
    accentSurface: "#fef2f2",
    accentSurfaceDark: "#7f1d1d",
    accentDark: "#fca5a5",
    badge: "#dc2626",
  },
  gen2: {
    label: "Gold / Silver / Crystal",
    accent: "#c0a030",
    accentLight: "#fde68a",
    accentSurface: "#fefce8",
    accentSurfaceDark: "#713f12",
    accentDark: "#fde68a",
    badge: "#ca8a04",
  },
  gen3: {
    label: "Ruby / Sapphire / Emerald",
    accent: "#059669",
    accentLight: "#6ee7b7",
    accentSurface: "#ecfdf5",
    accentSurfaceDark: "#064e3b",
    accentDark: "#6ee7b7",
    badge: "#059669",
  },
  gen4: {
    label: "Diamond / Pearl / Platinum",
    accent: "#2563eb",
    accentLight: "#93c5fd",
    accentSurface: "#eff6ff",
    accentSurfaceDark: "#1e3a5f",
    accentDark: "#93c5fd",
    badge: "#2563eb",
  },
  gen5: {
    label: "Black / White",
    accent: "#475569",
    accentLight: "#cbd5e1",
    accentSurface: "#f8fafc",
    accentSurfaceDark: "#1e293b",
    accentDark: "#cbd5e1",
    badge: "#475569",
  },
  gen6: {
    label: "X / Y",
    accent: "#7c3aed",
    accentLight: "#c4b5fd",
    accentSurface: "#f5f3ff",
    accentSurfaceDark: "#4c1d95",
    accentDark: "#c4b5fd",
    badge: "#7c3aed",
  },
  gen7: {
    label: "Sun / Moon",
    accent: "#ea580c",
    accentLight: "#fdba74",
    accentSurface: "#fff7ed",
    accentSurfaceDark: "#7c2d12",
    accentDark: "#fdba74",
    badge: "#ea580c",
  },
  gen8: {
    label: "Sword / Shield",
    accent: "#e11d48",
    accentLight: "#fda4af",
    accentSurface: "#fff1f2",
    accentSurfaceDark: "#881337",
    accentDark: "#fda4af",
    badge: "#e11d48",
  },
  gen9: {
    label: "Scarlet / Violet",
    accent: "#6366f1",
    accentLight: "#a5b4fc",
    accentSurface: "#eef2ff",
    accentSurfaceDark: "#312e81",
    accentDark: "#a5b4fc",
    badge: "#6366f1",
  },
};

export const GEN_THEMES: { id: GenTheme; abbr: string; label: string; badge: string }[] = [
  { id: "gen1", abbr: "RBY",  label: "Red / Blue / Yellow",        badge: "#dc2626" },
  { id: "gen2", abbr: "GSC",  label: "Gold / Silver / Crystal",    badge: "#ca8a04" },
  { id: "gen3", abbr: "RSE",  label: "Ruby / Sapphire / Emerald",  badge: "#059669" },
  { id: "gen4", abbr: "DPPt", label: "Diamond / Pearl / Platinum", badge: "#2563eb" },
  { id: "gen5", abbr: "BW",   label: "Black / White",              badge: "#475569" },
  { id: "gen6", abbr: "XY",   label: "X / Y",                      badge: "#7c3aed" },
  { id: "gen7", abbr: "SM",   label: "Sun / Moon",                 badge: "#ea580c" },
  { id: "gen8", abbr: "SwSh", label: "Sword / Shield",             badge: "#e11d48" },
  { id: "gen9", abbr: "SV",   label: "Scarlet / Violet",           badge: "#6366f1" },
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
