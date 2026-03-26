"use client";

import { useCallback, useSyncExternalStore } from "react";

// ─── Shared external store so ALL useDarkMode() callers share state ────

const STORAGE_KEY = "vgc-dark-mode";
const listeners = new Set<() => void>();

let darkModeValue = false;

// Load from localStorage on module init (client only)
if (typeof window !== "undefined") {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      darkModeValue = stored === "true";
    } else {
      // Respect system preference when no saved preference exists
      darkModeValue = window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
  } catch {}
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): boolean {
  return darkModeValue;
}

function getServerSnapshot(): boolean {
  return false;
}

function applyDarkMode(dark: boolean) {
  if (dark) {
    document.documentElement.setAttribute("data-dark-mode", "");
  } else {
    document.documentElement.removeAttribute("data-dark-mode");
  }
}

function setDarkModeValue(dark: boolean) {
  if (dark === darkModeValue) return;
  darkModeValue = dark;
  try { localStorage.setItem(STORAGE_KEY, String(dark)); } catch {}
  if (typeof document !== "undefined") applyDarkMode(dark);
  listeners.forEach((fn) => fn());
}

// Apply on first load
if (typeof window !== "undefined") {
  const init = () => {
    requestAnimationFrame(() => applyDarkMode(darkModeValue));
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
}

export function useDarkMode() {
  const darkMode = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const setDarkMode = useCallback((dark: boolean) => setDarkModeValue(dark), []);
  const toggleDarkMode = useCallback(() => setDarkModeValue(!darkModeValue), []);
  return { darkMode, setDarkMode, toggleDarkMode };
}
