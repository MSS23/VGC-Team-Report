"use client";

import { useEffect } from "react";
import { useTranslation } from "@/lib/i18n";

interface ShortcutHintOverlayProps {
  visible: boolean;
  onDismiss: () => void;
  isPresentationMode?: boolean;
}

export function ShortcutHintOverlay({ visible, onDismiss, isPresentationMode = false }: ShortcutHintOverlayProps) {
  const { t } = useTranslation();

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
        className="bg-surface/95 border border-border rounded-2xl p-6 shadow-2xl max-w-xs w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-sm font-bold text-text-primary mb-4 uppercase tracking-wider">
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
          onClick={onDismiss}
          className="mt-4 w-full text-center text-xs text-text-tertiary hover:text-text-secondary transition-colors cursor-pointer"
        >
          {t.clickOrEsc} <kbd className="px-1.5 py-0.5 bg-surface-alt border border-border rounded text-[10px] font-mono font-semibold">Esc</kbd> {t.toClose}
        </button>
      </div>
    </div>
  );
}
