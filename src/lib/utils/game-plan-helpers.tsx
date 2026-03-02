"use client";

import type { GameResult } from "@/hooks/useMatchupPlans";

export const GAME_COLORS = [
  { badge: "bg-blue-500/20 text-blue-400 border-blue-500/30", accent: "border-l-blue-500" },
  { badge: "bg-amber-500/20 text-amber-400 border-amber-500/30", accent: "border-l-amber-500" },
  { badge: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", accent: "border-l-emerald-500" },
] as const;

export function getReplayInfo(url: string): { label: string; type: "youtube" | "showdown" | "other" } {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    if (hostname.includes("youtube") || hostname.includes("youtu.be"))
      return { label: "YouTube", type: "youtube" };
    if (hostname.includes("pokemonshowdown") || hostname.includes("psim.us"))
      return { label: "Showdown", type: "showdown" };
    return { label: hostname.replace(/^www\./, ""), type: "other" };
  } catch {
    return { label: "Link", type: "other" };
  }
}

export function ReplayIcon({ type }: { type: "youtube" | "showdown" | "other" }) {
  if (type === "youtube") {
    return (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="flex-shrink-0">
        <polygon points="8,5 19,12 8,19" />
      </svg>
    );
  }
  if (type === "showdown") {
    return (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
        <polyline points="13,2 3,14 12,14 11,22 21,10 12,10 13,2" />
      </svg>
    );
  }
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
      <polyline points="15,3 21,3 21,9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

const RESULT_STYLES: Record<string, string> = {
  W: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
  L: "bg-red-500/20 text-red-400 border-red-500/40",
  T: "bg-amber-500/20 text-amber-400 border-amber-500/40",
};

export function ResultBadge({ result }: { result: GameResult }) {
  if (!result) return null;
  return (
    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-md text-[10px] font-bold border ${RESULT_STYLES[result]}`}>
      {result}
    </span>
  );
}

export function ResultToggle({
  result,
  onChange,
}: {
  result: GameResult;
  onChange: (result: GameResult) => void;
}) {
  const options: ("W" | "L" | "T")[] = ["W", "L", "T"];
  return (
    <div className="flex items-center gap-1" role="group">
      {options.map((opt) => (
        <span
          key={opt}
          role="button"
          tabIndex={0}
          onClick={(e) => {
            e.stopPropagation();
            onChange(result === opt ? null : opt);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              e.stopPropagation();
              onChange(result === opt ? null : opt);
            }
          }}
          className={`inline-flex items-center justify-center w-6 h-6 rounded-md text-[10px] font-bold border transition-all cursor-pointer select-none ${
            result === opt
              ? RESULT_STYLES[opt]
              : "border-border text-text-tertiary hover:border-border-subtle hover:text-text-secondary"
          }`}
        >
          {opt}
        </span>
      ))}
    </div>
  );
}
