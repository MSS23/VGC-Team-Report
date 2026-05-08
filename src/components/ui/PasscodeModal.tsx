"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "@/lib/i18n";

interface PasscodeModalProps {
  mode: "set" | "unlock";
  error?: string | null;
  onShareWithPasscode: (passcode: string) => void;
  onShareWithout?: () => void;
  onUnlock?: (attempt: string) => void;
  onCancel: () => void;
}

export function PasscodeModal({
  mode,
  error,
  onShareWithPasscode,
  onShareWithout,
  onUnlock,
  onCancel,
}: PasscodeModalProps) {
  const { t } = useTranslation();
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onCancel]);

  const handleFocusTrap = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key !== "Tab") return;
      const dialog = dialogRef.current;
      if (!dialog) return;
      const focusable = dialog.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    },
    []
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "set") {
      onShareWithPasscode(value);
    } else {
      onUnlock?.(value);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="passcode-modal-title"
        className="bg-surface border border-border rounded-2xl p-6 shadow-2xl max-w-sm w-full mx-4 animate-fade-in"
        onKeyDown={handleFocusTrap}
      >
        <h3
          id="passcode-modal-title"
          className="text-base font-bold text-text-primary mb-1"
        >
          {mode === "set" ? t.setPasscode : t.unlockEditing}
        </h3>
        <p className="text-sm text-text-secondary mb-4">
          {mode === "set" ? t.passcodeEditDesc : t.passcodeUnlockDesc}
        </p>

        <form onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="password"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={mode === "set" ? t.enterPasscode : t.passcode}
            className="w-full px-4 py-2.5 bg-surface-alt border border-border rounded-xl text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/50"
          />

          {error && (
            <p className="mt-2 text-sm text-red-500 font-medium">{error}</p>
          )}

          <div className="flex flex-col gap-2 mt-4">
            {mode === "set" ? (
              <>
                <button
                  type="submit"
                  disabled={!value.trim()}
                  className="w-full px-4 py-2.5 bg-accent text-white rounded-xl font-semibold text-sm hover:bg-accent/85 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {t.shareWithPasscode}
                </button>
                <button
                  type="button"
                  onClick={onShareWithout}
                  className="w-full px-4 py-2.5 bg-surface-alt text-text-primary border border-border rounded-xl font-semibold text-sm hover:bg-surface-alt/80 transition-all"
                >
                  {t.shareWithoutPasscode}
                </button>
              </>
            ) : (
              <button
                type="submit"
                disabled={!value.trim()}
                className="w-full px-4 py-2.5 bg-accent text-white rounded-xl font-semibold text-sm hover:bg-accent/85 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {t.unlock}
              </button>
            )}
            <button
              type="button"
              onClick={onCancel}
              className="w-full px-4 py-2.5 text-text-secondary text-sm font-medium hover:text-text-primary transition-colors"
            >
              {t.cancel}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
