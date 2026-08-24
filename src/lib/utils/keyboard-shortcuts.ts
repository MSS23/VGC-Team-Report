/**
 * Single-character keyboard shortcut preference (WCAG 2.1.4).
 *
 * The report viewer binds unmodified single characters (D, F, P, E, H, ?, [, ],
 * 1-9) at the window level. WCAG 2.1.4 "Character Key Shortcuts" (Level A)
 * requires that such shortcuts can be turned off, remapped, or scoped to focus.
 * This module owns the "turn off" mechanism: a persisted, app-wide on/off flag
 * that `useSlideNavigation` reads and the keyboard-shortcuts dialog toggles.
 *
 * Arrow keys, Home/End and Escape are navigation keys, not character keys, and
 * stay active regardless of this preference.
 */

const STORAGE_KEY = "vgc-keyboard-shortcuts";
const EVENT = "vgc-keyboard-shortcuts-change";

/** Shortcuts are on unless the user has explicitly turned them off. */
export function areShortcutsEnabled(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return window.localStorage.getItem(STORAGE_KEY) !== "off";
  } catch {
    // Private mode / storage disabled — fall back to the default.
    return true;
  }
}

export function setShortcutsEnabled(enabled: boolean): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, enabled ? "on" : "off");
  } catch {
    // Preference cannot be persisted; still notify listeners for this session.
  }
  window.dispatchEvent(new CustomEvent<boolean>(EVENT, { detail: enabled }));
}

/** Subscribe to changes (same tab via CustomEvent, other tabs via `storage`). */
export function subscribeShortcutsEnabled(listener: (enabled: boolean) => void): () => void {
  if (typeof window === "undefined") return () => {};
  const onCustom = () => listener(areShortcutsEnabled());
  const onStorage = (e: StorageEvent) => {
    if (e.key === null || e.key === STORAGE_KEY) listener(areShortcutsEnabled());
  };
  window.addEventListener(EVENT, onCustom);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(EVENT, onCustom);
    window.removeEventListener("storage", onStorage);
  };
}
