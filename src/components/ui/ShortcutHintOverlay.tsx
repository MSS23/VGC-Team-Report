"use client";

import { useEffect, useRef } from "react";
import { useTranslation } from "@/lib/i18n";

interface ShortcutHintOverlayProps {
  visible: boolean;
  onDismiss: () => void;
  isPresentationMode?: boolean;
}

export function ShortcutHintOverlay({ visible, onDismiss, isPresentationMode = false }: ShortcutHintOverlayProps) {
  const { t } = useTranslation();
  const dialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const titleId = "shortcut-hint-overlay-title";

  const SHORTCUTS_COMMON = [
    { key: "\u2190 / \u2192", label: t.navigateSlides },
    { key: "\u2191 / \u2193", label: t.navigateSlides },
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

  // Focus trap + focus capture/restore while the overlay is visible.
  useEffect(() => {
    if (!visible) return;
    const dialog = dialogRef.current;
    if (!dialog) return;

    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;

    const focusableSelectors =
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

    const firstFocusable = dialog.querySelector<HTMLElement>(focusableSelectors);
    firstFocusable?.focus();

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(focusableSelectors));
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener("keydown", handleTab);
    const restoreTarget = previouslyFocusedRef.current;
    return () => {
      window.removeEventListener("keydown", handleTab);
      restoreTarget?.focus();
    };
  }, [visible]);

  if (!visible) return null;

  const shortcuts = [
    ...SHORTCUTS_COMMON,
    ...(isPresentationMode ? SHORTCUTS_PRESENTATION : SHORTCUTS_NORMAL),
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in"
      onClick={onDismiss}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="bg-surface/95 border border-border rounded-2xl p-6 shadow-2xl max-w-xs w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id={titleId} className="text-sm font-bold text-text-primary mb-4 uppercase tracking-wider">
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
          <p className="text-[11px] text-text-tertiary text-center leading-relaxed">
            {t.swipeHint}
          </p>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="mt-4 w-full text-center text-xs text-text-tertiary hover:text-text-secondary transition-colors cursor-pointer"
        >
          {t.clickOrEsc} <kbd className="px-1.5 py-0.5 bg-surface-alt border border-border rounded text-[10px] font-mono font-semibold">Esc</kbd> {t.toClose}
        </button>
      </div>
    </div>
  );
}
