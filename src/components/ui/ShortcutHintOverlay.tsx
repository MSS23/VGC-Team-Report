"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "@/lib/i18n";
import { areShortcutsEnabled, setShortcutsEnabled } from "@/lib/utils/keyboard-shortcuts";

interface ShortcutHintOverlayProps {
  visible: boolean;
  onDismiss: () => void;
  isPresentationMode?: boolean;
}

export function ShortcutHintOverlay({ visible, onDismiss, isPresentationMode = false }: ShortcutHintOverlayProps) {
  const { t } = useTranslation();
  // WCAG 2.1.4 — the single-character shortcuts must be switchable off.
  const [singleKeyOn, setSingleKeyOn] = useState(true);

  const SHORTCUTS_COMMON = [
    { key: "\u2190 / \u2192", label: t.navigateSlides },
    { key: "\u2191 / \u2193", label: t.navigateSlides },
    { key: "Home / End", label: t.navigateSlides },
    { key: "D", label: t.toggleDarkMode },
    { key: "?", label: t.showHideShortcuts },
  ];

  const SHORTCUTS_PRESENTATION = [
    { key: "F", label: t.toggleFullscreen },
    { key: "Esc", label: t.exitPresentation },
  ];

  const SHORTCUTS_NORMAL = [
    { key: "P", label: t.enterPresentation },
    { key: "E", label: "Toggle edit mode" },
    { key: "1-9", label: "Jump to slide" },
    { key: "0", label: "Jump to last slide" },
    { key: "H", label: "Hide/show current slide" },
    { key: "[ / ]", label: "Reorder slide up/down" },
  ];
  // Re-read the stored preference each time the panel opens
  useEffect(() => {
    if (visible) setSingleKeyOn(areShortcutsEnabled());
  }, [visible]);

  // Close on Escape key
  useEffect(() => {
    if (!visible) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        onDismiss();
      }
    };
    window.addEventListener("keydown", handler, { capture: true });
    return () => window.removeEventListener("keydown", handler, { capture: true });
  }, [visible, onDismiss]);

  if (!visible) return null;

  const shortcuts = [
    ...SHORTCUTS_COMMON,
    ...(isPresentationMode ? SHORTCUTS_PRESENTATION : SHORTCUTS_NORMAL),
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in"
      onClick={onDismiss}
      role="presentation"
    >
      <div
        className="bg-surface/95 border border-border rounded-2xl p-6 shadow-2xl max-w-xs w-full mx-4"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="keyboard-shortcuts-title"
      >
        <h3 id="keyboard-shortcuts-title" className="text-sm font-bold text-text-primary mb-4 uppercase tracking-wider">
          {t.keyboardShortcuts}
        </h3>
        <div className="space-y-3">
          {shortcuts.map(({ key, label }) => (
            <div key={key} className="flex items-center justify-between gap-4">
              <kbd className="px-2.5 py-1 bg-surface-alt border border-border rounded-lg text-xs font-mono font-semibold text-text-primary min-w-[3rem] text-center">
                {key}
              </kbd>
              <span className="text-sm text-text-secondary">{label}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-3 border-t border-border-subtle">
          <label
            htmlFor="single-key-shortcuts-toggle"
            className="flex items-center justify-between gap-3 min-h-11 cursor-pointer"
          >
            <span className="text-xs font-semibold text-text-secondary">Single-key shortcuts</span>
            <input
              id="single-key-shortcuts-toggle"
              type="checkbox"
              checked={singleKeyOn}
              onChange={(e) => {
                setSingleKeyOn(e.target.checked);
                setShortcutsEnabled(e.target.checked);
              }}
              className="w-5 h-5 flex-shrink-0 accent-[var(--accent)] cursor-pointer"
            />
          </label>
          <p className="text-[11px] text-text-tertiary leading-relaxed">
            Turn these off if letter keys clash with speech input or a screen reader. Arrow keys,
            Home/End and Esc keep working, and this panel stays available from the Keyboard
            shortcuts button.
          </p>
        </div>
        <div className="mt-3 pt-3 border-t border-border-subtle">
          <p className="text-[11px] text-text-tertiary text-center leading-relaxed">
            {t.swipeHint}
          </p>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="mt-4 min-h-11 w-full text-center text-xs text-text-tertiary hover:text-text-secondary transition-colors cursor-pointer"
        >
          {t.clickOrEsc} <kbd className="px-1.5 py-0.5 bg-surface-alt border border-border rounded text-[10px] font-mono font-semibold">Esc</kbd> {t.toClose}
        </button>
      </div>
    </div>
  );
}
