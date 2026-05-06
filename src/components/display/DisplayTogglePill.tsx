"use client";

import { useEffect, useRef, useState } from "react";

interface DisplayTogglePillProps {
  /** Whether at least one Pokemon on the team is Mega-capable. Drives Form-segment visibility. */
  hasMegaCapable: boolean;

  /** Effective team-wide Mega default. null = auto (treat as true). */
  globalMegaDefault: boolean | null;
  /**
   * Set the team-wide Mega default. The caller is expected to also clear
   * any per-card overrides so a single tap normalizes the team — see
   * setGlobalMegaDefaultAndReset in useHomePage. The pill surfaces a
   * "will reset N overrides" caption below the radiogroup so users know
   * what the tap will do before they tap.
   */
  onGlobalMegaChange: (value: boolean | null) => void;
  /** Whether the user has any per-card Mega overrides set. Drives the
   *  pre-tap reset caption and the non-default dot indicator. */
  hasMegaOverrides: boolean;

  /** First-run discovery pulse — fires once and then onMarkSeen is called. */
  hasSeenPill: boolean;
  onMarkSeen: () => void;

  /** Hide entirely in presentation mode and version-compare. */
  hidden?: boolean;
  /**
   * Lift the pill above the full-width "Build your own team report" CTA
   * banner that shows to read-only viewers of a shared report. Without
   * this, the right-anchored pill sits on top of the CTA's "Create
   * yours" button and makes it unclickable on PWA.
   */
  liftAboveCta?: boolean;
}

/**
 * Floating "Display" pill anchored bottom-right of the viewport.
 * Tap to expand into a popover with the Form (Base / Mega) segmented control.
 *
 * Visibility rules: hidden when no Pokemon on the team is Mega-capable.
 * Read-only viewers still see it — display preferences aren't edits.
 *
 * The pill respects PWA safe-area insets via the existing
 * --bottom-nav-height CSS variable from globals.css and env(safe-area-inset-bottom).
 */
export function DisplayTogglePill({
  hasMegaCapable,
  globalMegaDefault,
  onGlobalMegaChange,
  hasMegaOverrides,
  hasSeenPill,
  onMarkSeen,
  hidden = false,
  liftAboveCta = false,
}: DisplayTogglePillProps) {
  const [open, setOpen] = useState(false);
  const [pulse, setPulse] = useState(false);
  const pillRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Effective mega state — null is treated as "auto" → true (the existing
  // PokemonCard auto-detect behavior).
  const showingMega = globalMegaDefault ?? true;

  // Active state indicator on collapsed pill: any state other than the
  // baseline (global Mega on). Per-card overrides count as non-default too
  // so the user sees the dot whenever any card is diverging from the
  // team's global form, even if the pill itself is still on the default
  // Mega setting.
  const hasNonDefault =
    hasMegaCapable && (!showingMega || hasMegaOverrides);

  // First-run discovery pulse: 1.5s subtle ring fade. Respects reduced motion
  // by skipping the animation entirely.
  useEffect(() => {
    if (hasSeenPill || hidden) return;
    if (typeof window !== "undefined") {
      const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      if (reducedMotion) {
        onMarkSeen();
        return;
      }
    }
    const start = setTimeout(() => setPulse(true), 600);
    const stop = setTimeout(() => {
      setPulse(false);
      onMarkSeen();
    }, 2400);
    return () => {
      clearTimeout(start);
      clearTimeout(stop);
    };
  }, [hasSeenPill, hidden, onMarkSeen]);

  // Close popover on outside click / Escape
  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (popoverRef.current?.contains(target) || pillRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        pillRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Visibility rule: hide when no Mega capability on the team.
  if (hidden || !hasMegaCapable) return null;

  const compactLabel = "Form";

  return (
    <>
      {/* Tap-through backdrop while open — invisible, just catches outside clicks */}
      {open && (
        <div
          aria-hidden
          className="fixed inset-0 z-[39] bg-transparent"
          onClick={() => setOpen(false)}
        />
      )}

      <div
        className="fixed right-3 sm:right-4 z-40 flex flex-col items-end gap-2"
        style={{
          // Base offset: clear the PWA bottom nav + iOS safe-area.
          // When the "Build your own team report" CTA is showing for
          // read-only viewers, add ~72px so the pill sits above it
          // instead of covering the "Create yours" button.
          bottom: liftAboveCta
            ? "calc(var(--bottom-nav-height, 3rem) + env(safe-area-inset-bottom, 0px) + 84px)"
            : "calc(var(--bottom-nav-height, 3rem) + env(safe-area-inset-bottom, 0px) + 12px)",
          transition: "bottom 200ms cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        {/* Popover (renders above the pill, anchored bottom-right) */}
        {open && (
          <div
            ref={popoverRef}
            role="dialog"
            aria-modal="false"
            aria-label="Display options"
            className="w-[260px] rounded-2xl bg-surface border border-border shadow-2xl p-3 origin-bottom-right animate-fade-in motion-reduce:animate-none"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-text-tertiary">
                Display options
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close display options"
                className="w-8 h-8 -mr-1 flex items-center justify-center rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-alt transition-colors cursor-pointer"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Form (Base / Mega) */}
            {hasMegaCapable && (
              <div className="mb-3 last:mb-0">
                <div className="text-[11px] font-bold uppercase tracking-widest text-text-tertiary mb-1.5">
                  Form
                </div>
                <div
                  role="radiogroup"
                  aria-label="Mega Evolution form"
                  className="inline-flex w-full h-11 items-center rounded-lg bg-surface-alt border border-border p-0.5 gap-0.5"
                >
                  <button
                    type="button"
                    role="radio"
                    aria-checked={!showingMega}
                    onClick={() => onGlobalMegaChange(false)}
                    className={`flex-1 h-full rounded-md text-xs font-semibold transition-colors duration-150 cursor-pointer ${
                      !showingMega
                        ? "bg-accent text-white shadow-sm"
                        : "text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    Base
                  </button>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={showingMega}
                    onClick={() => onGlobalMegaChange(true)}
                    className={`flex-1 h-full rounded-md text-xs font-extrabold transition-colors duration-150 cursor-pointer ${
                      showingMega
                        ? "bg-gradient-to-br from-pink-500 to-purple-600 text-white shadow-sm shadow-purple-500/30"
                        : "text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    Mega
                  </button>
                </div>
                {hasMegaOverrides && (
                  // Pre-tap caption: tells the user that tapping Base or
                  // Mega above will ALSO clear their per-card overrides,
                  // so they're not surprised when overridden cards snap
                  // back to the team default. The wiring lives in
                  // useHomePage.setGlobalMegaDefaultAndReset.
                  <p
                    role="note"
                    className="mt-2 text-[10px] font-semibold text-text-tertiary leading-snug"
                  >
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-accent align-middle mr-1.5" aria-hidden />
                    Per-card overrides active &middot; tapping above resets all
                  </p>
                )}
              </div>
            )}

          </div>
        )}

        {/* Collapsed pill */}
        <button
          ref={pillRef}
          type="button"
          aria-label={open ? "Close display options" : "Open display options"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className={`relative inline-flex items-center gap-2 h-11 px-3.5 min-w-[112px] rounded-full bg-surface/95 backdrop-blur-md border border-border shadow-lg text-text-secondary hover:text-text-primary hover:-translate-y-0.5 active:scale-[0.97] transition-all duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
            pulse ? "ring-2 ring-accent/40 motion-safe:animate-pulse" : ""
          }`}
        >
          {/* Sliders icon */}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <line x1="21" y1="4" x2="14" y2="4" />
            <line x1="10" y1="4" x2="3" y2="4" />
            <line x1="21" y1="12" x2="12" y2="12" />
            <line x1="8" y1="12" x2="3" y2="12" />
            <line x1="21" y1="20" x2="16" y2="20" />
            <line x1="12" y1="20" x2="3" y2="20" />
            <line x1="14" y1="2" x2="14" y2="6" />
            <line x1="8" y1="10" x2="8" y2="14" />
            <line x1="16" y1="18" x2="16" y2="22" />
          </svg>
          <span className="text-[11px] font-bold uppercase tracking-widest">{compactLabel}</span>
          {/* Non-default state indicator */}
          {hasNonDefault && (
            <span
              aria-hidden
              className="absolute top-1 right-1 w-2 h-2 rounded-full bg-accent ring-2 ring-surface"
            />
          )}
        </button>
      </div>
    </>
  );
}
