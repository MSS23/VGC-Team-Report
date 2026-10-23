"use client";
import { useState, useEffect, useCallback, type ReactNode } from "react";
import { useTranslation } from "@/lib/i18n";
import { hapticLight } from "@/lib/utils/haptics";
import { FieldDiffHighlight } from "../TeamReport";
import { encodeSectionKey } from "@/lib/utils/version-diff";
export function PokemonDetailLayout({ header, moves, stats, notes, calcs, pokemonIndex }: { header: ReactNode; moves: ReactNode; stats: ReactNode; notes: ReactNode; calcs: ReactNode; pokemonIndex?: number }) {
const { t } = useTranslation();
  // ── Mobile card tabs ──────────────────────────────────────────────
  const MOBILE_TABS = ["set", "stats", "notes", "calcs"] as const;
  type MobileTab = typeof MOBILE_TABS[number];
  const [mobileTab, setMobileTab] = useState<MobileTab>("set");

  const handleTabChange = useCallback((tab: MobileTab) => {
    setMobileTab(tab);
    hapticLight();
  }, []);

  // Listen for walkthrough tab switch events
  useEffect(() => {
    const handler = (e: Event) => {
      const tab = (e as CustomEvent).detail as MobileTab;
      if (MOBILE_TABS.includes(tab)) setMobileTab(tab);
    };
    window.addEventListener("walkthrough-tab", handler);
    return () => window.removeEventListener("walkthrough-tab", handler);
  }, []);

  const mobileTabLabels: Record<MobileTab, string> = {
    set: t.moves ?? "Set",
    stats: t.stats ?? "Stats",
    notes: t.notes ?? "Notes",
    calcs: t.notableCalcs ?? "Calcs",
  };

  const mobileTabIcons: Record<MobileTab, React.ReactNode> = {
    set: <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>,
    stats: <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>,
    notes: <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>,
    calcs: <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" /><line x1="8" y1="6" x2="16" y2="6" /><line x1="16" y1="14" x2="16" y2="18" /><line x1="8" y1="10" x2="8" y2="10.01" /><line x1="12" y1="10" x2="12" y2="10.01" /><line x1="16" y1="10" x2="16" y2="10.01" /><line x1="8" y1="14" x2="8" y2="14.01" /><line x1="12" y1="14" x2="12" y2="14.01" /><line x1="8" y1="18" x2="8" y2="18.01" /><line x1="12" y1="18" x2="12" y2="18.01" /></svg>,
  };

  // ── Single return: mobile tabs + desktop two-column via CSS ─────
  return (
    <div className="animate-fade-in">
      {/* ── Mobile: card-based tabbed layout (< 640px) ── */}
      <div className="sm:hidden flex flex-col gap-3">
        <FieldDiffHighlight field={pokemonIndex !== undefined ? [encodeSectionKey({ kind: "pokemon", index: pokemonIndex })] : []} label="Set changed">
          {header}
        </FieldDiffHighlight>

        {/* Tab bar */}
        <div className="flex gap-1 bg-surface-alt/60 rounded-xl p-1" style={{ touchAction: "pan-x" }}>
          {MOBILE_TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => handleTabChange(tab)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 min-h-11 rounded-lg text-xs font-bold transition ${
 mobileTab === tab
 ? "bg-surface text-accent shadow-sm"
                  : "text-text-tertiary hover:text-text-secondary"
              }`}
            >
              {mobileTabIcons[tab]}
              <span>{mobileTabLabels[tab]}</span>
            </button>
          ))}
        </div>

        <div className="min-h-[200px]">
          {mobileTab === "set" && <div className="flex flex-col gap-3">{moves}</div>}
          {mobileTab === "stats" && <div className="flex flex-col gap-3">{stats}</div>}
          {mobileTab === "notes" && notes}
          {mobileTab === "calcs" && <div className="pb-16">{calcs}</div>}
        </div>
      </div>

      {/* ── Desktop: two-column layout (>= 640px) ── */}
      <div className="hidden sm:grid sm:grid-cols-[9fr_11fr] gap-6 lg:gap-10 items-start">
        <FieldDiffHighlight field={pokemonIndex !== undefined ? [encodeSectionKey({ kind: "pokemon", index: pokemonIndex })] : []} label="Set changed">
        <div className="flex flex-col gap-6 min-w-0">
          {header}
          {moves}
          {stats}
        </div>
        </FieldDiffHighlight>

        <div className="flex flex-col gap-6 min-w-0 sm:max-h-[calc(100dvh-12rem)] sm:overflow-y-auto sm:scrollbar-thin sm:pr-1">
          {notes}
          {calcs}
        </div>
      </div>
    </div>
  );
}


