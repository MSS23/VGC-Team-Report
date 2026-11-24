"use client";

import type { RefObject } from "react";
import type { ExportMode } from "@/components/ui/PdfExport";

interface ExportThemePickerModalProps {
  dialogRef: RefObject<HTMLDivElement | null>;
  exportTheme: "light" | "dark";
  onSelectTheme: (theme: "light" | "dark") => void;
  pendingExportMode: ExportMode | null;
  onConfirm: () => void;
  onClose: () => void;
}

/**
 * Export theme picker modal for tournament exports, moved verbatim out of
 * HomePageClient.tsx. Focus management and the Tab trap stay in the parent's
 * effect, which reads `dialogRef`.
 */
export function ExportThemePickerModal({
  dialogRef,
  exportTheme,
  onSelectTheme,
  pendingExportMode,
  onConfirm,
  onClose,
}: ExportThemePickerModalProps) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-theme-modal-title"
        tabIndex={-1}
        className="bg-surface border border-border rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center">
          <h3
            id="export-theme-modal-title"
            className="text-lg font-extrabold text-text-primary"
          >
            Export Theme
          </h3>
          <p className="text-xs text-text-tertiary mt-1">
            Choose how your team sheet looks
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Light option */}
          <button
            type="button"
            onClick={() => onSelectTheme("light")}
            className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all cursor-pointer ${
              exportTheme === "light"
                ? "border-accent bg-accent/5 shadow-md"
                : "border-border hover:border-accent/30"
            }`}
          >
            <div className="w-14 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1A1A2E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            </div>
            <span className="text-sm font-bold text-text-primary">Light</span>
          </button>

          {/* Dark option */}
          <button
            type="button"
            onClick={() => onSelectTheme("dark")}
            className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all cursor-pointer ${
              exportTheme === "dark"
                ? "border-accent bg-accent/5 shadow-md"
                : "border-border hover:border-accent/30"
            }`}
          >
            <div className="w-14 h-10 rounded-lg bg-[#0B0B1A] border border-[#2A2A52] flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F0EDE6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
              </svg>
            </div>
            <span className="text-sm font-bold text-text-primary">Dark</span>
          </button>
        </div>

        <button
          type="button"
          onClick={onConfirm}
          className="w-full py-2.5 rounded-xl bg-accent text-accent-foreground font-bold text-sm hover:bg-accent/90 transition-colors cursor-pointer"
        >
          Download PNG {pendingExportMode === "tournament-stats" ? "(Stats)" : "(EVs)"}
        </button>
      </div>
    </div>
  );
}
