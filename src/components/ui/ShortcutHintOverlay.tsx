"use client";

import { useEffect, useState } from "react";

interface ShortcutHintOverlayProps {
  visible: boolean;
  onDismiss: () => void;
}

const SHORTCUTS = [
  { key: "\u2190 / \u2192", label: "Navigate slides" },
  { key: "P", label: "Toggle presentation" },
  { key: "D", label: "Toggle dark mode" },
  { key: "F", label: "Toggle fullscreen" },
  { key: "Esc", label: "Exit presentation" },
  { key: "?", label: "Show this help" },
];

export function ShortcutHintOverlay({ visible, onDismiss }: ShortcutHintOverlayProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (visible) {
      setShow(true);
      const timer = setTimeout(() => {
        setShow(false);
        onDismiss();
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      setShow(false);
    }
  }, [visible, onDismiss]);

  if (!show) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in"
      onClick={() => { setShow(false); onDismiss(); }}
    >
      <div className="bg-surface/95 border border-border rounded-2xl p-6 shadow-2xl max-w-xs w-full mx-4">
        <h3 className="text-sm font-bold text-text-primary mb-4 uppercase tracking-wider">
          Keyboard Shortcuts
        </h3>
        <div className="space-y-3">
          {SHORTCUTS.map(({ key, label }) => (
            <div key={key} className="flex items-center justify-between gap-4">
              <kbd className="px-2.5 py-1 bg-surface-alt border border-border rounded-lg text-xs font-mono font-semibold text-text-primary min-w-[3rem] text-center">
                {key}
              </kbd>
              <span className="text-sm text-text-secondary">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
