"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import type { AnalyzedPokemon } from "@/lib/types/analysis";
import { hapticLight } from "@/lib/utils/haptics";

const OffensiveCoverageChart = dynamic(() => import("./OffensiveCoverageChart").then(m => ({ default: m.OffensiveCoverageChart })), {
  loading: () => <div className="animate-pulse bg-surface-alt rounded-xl h-48" />,
});
const DefensiveCoverageChart = dynamic(() => import("./DefensiveCoverageChart").then(m => ({ default: m.DefensiveCoverageChart })), {
  loading: () => <div className="animate-pulse bg-surface-alt rounded-xl h-48" />,
});

interface TeamCoverageSlideProps {
  pokemon: AnalyzedPokemon[];
}

type CoverageTab = "offensive" | "defensive";

export function TeamCoverageSlide({ pokemon }: TeamCoverageSlideProps) {
  const [tab, setTab] = useState<CoverageTab>("offensive");

  return (
    <div className="animate-fade-in">
      {/* ── Mobile: tabbed (< 640px) ── */}
      <div className="sm:hidden flex flex-col gap-4 pb-6">
        <div className="flex gap-1 bg-surface-alt/60 rounded-xl p-1">
          <button
            type="button"
            onClick={() => { setTab("offensive"); hapticLight(); }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-all ${
              tab === "offensive"
                ? "bg-surface text-accent shadow-sm"
                : "text-text-tertiary hover:text-text-secondary"
            }`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
            Offensive
          </button>
          <button
            type="button"
            onClick={() => { setTab("defensive"); hapticLight(); }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-all ${
              tab === "defensive"
                ? "bg-surface text-accent shadow-sm"
                : "text-text-tertiary hover:text-text-secondary"
            }`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            Defensive
          </button>
        </div>
        {tab === "offensive" && <OffensiveCoverageChart pokemon={pokemon} />}
        {tab === "defensive" && <DefensiveCoverageChart pokemon={pokemon} />}
      </div>

      {/* ── Desktop: both charts stacked (>= 640px) ── */}
      <div className="hidden sm:flex sm:flex-col gap-8">
        <OffensiveCoverageChart pokemon={pokemon} />
        <hr className="border-border" />
        <DefensiveCoverageChart pokemon={pokemon} />
      </div>
    </div>
  );
}
