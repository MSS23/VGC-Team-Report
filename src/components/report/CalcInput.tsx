"use client";

import { useState, useRef } from "react";
import type { CalcCategory } from "@/hooks/useDamageCalcs";

const CATEGORY_CONFIG = {
  offensive: {
    label: "Offensive",
    icon: "⚔️",
    borderClass: "border-red-400/30",
    tagBg: "bg-red-500/20",
    tagText: "text-red-400",
  },
  defensive: {
    label: "Defensive",
    icon: "🛡️",
    borderClass: "border-emerald-400/30",
    tagBg: "bg-emerald-500/20",
    tagText: "text-emerald-400",
  },
  speed: {
    label: "Speed Tier",
    icon: "⚡",
    borderClass: "border-border-subtle",
    tagBg: "bg-surface-alt",
    tagText: "text-text-tertiary",
  },
} as const;

interface ParsedCalcLine {
  text: string;
  category: CalcCategory;
}

/**
 * Auto-detect calc category from calc text.
 * - Lines with "vs." are damage calcs → offensive or defensive based on perspective
 * - Lines mentioning speed/spe/outspeed → speed tier
 * - Default to offensive
 */
function autoDetectCategory(line: string, pokemonSpecies: string): CalcCategory {
  const lower = line.toLowerCase();
  const speciesLower = pokemonSpecies.toLowerCase();

  // Speed-related
  if (/\bspe\b|speed|outspeed|underspeed|speed tier|creep/i.test(line)) {
    return "speed";
  }

  // Damage calc with "vs."
  if (/\bvs\.?\s/i.test(line)) {
    // Format: "ATTACKER move vs. DEFENDER: damage"
    // If the pokemon species appears before "vs." → offensive
    // If it appears after "vs." → defensive
    const vsIndex = lower.indexOf("vs.");
    if (vsIndex === -1) return "offensive";

    const beforeVs = lower.slice(0, vsIndex);
    const afterVs = lower.slice(vsIndex);

    if (beforeVs.includes(speciesLower)) return "offensive";
    if (afterVs.includes(speciesLower)) return "defensive";

    // Can't determine — default offensive
    return "offensive";
  }

  return "offensive";
}

/**
 * Parse multi-line calc output into individual entries.
 * Handles standard Showdown/Nerd of Now calc format.
 */
function parseCalcLines(rawText: string, pokemonSpecies: string): ParsedCalcLine[] {
  return rawText
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((text) => ({
      text,
      category: autoDetectCategory(text, pokemonSpecies),
    }));
}

interface CalcInputProps {
  pokemonSpecies: string;
  onAddCalc: (text: string, category: CalcCategory) => void;
}

export function CalcInput({ pokemonSpecies, onAddCalc }: CalcInputProps) {
  const [mode, setMode] = useState<"single" | "paste">("single");
  const [calcInput, setCalcInput] = useState("");
  const [calcCategory, setCalcCategory] = useState<CalcCategory>("offensive");
  const [pasteInput, setPasteInput] = useState("");
  const [parsedLines, setParsedLines] = useState<ParsedCalcLine[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSingleAdd = () => {
    if (!calcInput.trim()) return;
    onAddCalc(calcInput.trim(), calcCategory);
    setCalcInput("");
  };

  const handlePasteChange = (value: string) => {
    setPasteInput(value);
    if (value.trim()) {
      setParsedLines(parseCalcLines(value, pokemonSpecies));
    } else {
      setParsedLines([]);
    }
  };

  const handleAddAll = () => {
    parsedLines.forEach((line) => {
      onAddCalc(line.text, line.category);
    });
    setPasteInput("");
    setParsedLines([]);
    setMode("single");
  };

  const handleAddSingle = (index: number) => {
    const line = parsedLines[index];
    onAddCalc(line.text, line.category);
    const next = parsedLines.filter((_, i) => i !== index);
    setParsedLines(next);
    if (next.length === 0) {
      setPasteInput("");
      setMode("single");
    }
  };

  const handleRemoveParsed = (index: number) => {
    setParsedLines((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleCategory = (index: number) => {
    setParsedLines((prev) =>
      prev.map((line, i) => {
        if (i !== index) return line;
        const categories: CalcCategory[] = ["offensive", "defensive", "speed"];
        const nextIdx = (categories.indexOf(line.category) + 1) % categories.length;
        return { ...line, category: categories[nextIdx] };
      })
    );
  };

  if (mode === "paste") {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">
            Paste Calcs
          </span>
          <button
            type="button"
            onClick={() => { setMode("single"); setPasteInput(""); setParsedLines([]); }}
            className="text-xs text-text-tertiary hover:text-text-secondary transition-colors"
          >
            Cancel
          </button>
        </div>

        <textarea
          ref={textareaRef}
          value={pasteInput}
          onChange={(e) => handlePasteChange(e.target.value)}
          placeholder={"Paste damage calc results here — one per line.\n\ne.g. 252+ Atk Incineroar Flare Blitz vs. 252 HP / 0 Def Rillaboom: 210-248 (103.4 - 122.1%) -- guaranteed OHKO"}
          className="w-full min-h-[6rem] p-3 bg-surface border border-border rounded-xl text-sm font-mono text-text-primary placeholder:text-text-tertiary resize-y focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-shadow"
          spellCheck={false}
          autoFocus
        />

        {/* Preview parsed calcs */}
        {parsedLines.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] text-text-tertiary">
              {parsedLines.length} calc{parsedLines.length !== 1 ? "s" : ""} detected — click category to change
            </span>
            {parsedLines.map((line, i) => {
              const cfg = CATEGORY_CONFIG[line.category];
              return (
                <div
                  key={i}
                  className={`flex items-center gap-2 px-3 py-2 bg-surface-alt border ${cfg.borderClass} rounded-lg`}
                >
                  <button
                    type="button"
                    onClick={() => toggleCategory(i)}
                    className={`flex-shrink-0 px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${cfg.tagBg} ${cfg.tagText} hover:opacity-80 transition-opacity`}
                    title="Click to change category"
                  >
                    {cfg.icon} {cfg.label}
                  </button>
                  <span className="flex-1 text-xs text-text-primary truncate">
                    {line.text}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleAddSingle(i)}
                    className="text-accent text-xs font-medium hover:text-accent/80 flex-shrink-0"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveParsed(i)}
                    className="text-text-tertiary hover:text-red-400 text-xs flex-shrink-0"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
            <button
              type="button"
              onClick={handleAddAll}
              className="self-end px-4 py-2 bg-accent text-white text-sm font-medium rounded-xl hover:bg-accent/90 transition-colors"
            >
              Add All ({parsedLines.length})
            </button>
          </div>
        )}
      </div>
    );
  }

  // Single input mode
  return (
    <div className="flex flex-col gap-2">
      {/* Category selector + paste mode toggle */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-1.5 flex-wrap">
          {(["offensive", "defensive", "speed"] as const).map((cat) => {
            const cfg = CATEGORY_CONFIG[cat];
            const isActive = calcCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setCalcCategory(cat)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? `${cfg.tagBg} ${cfg.tagText} border ${cfg.borderClass}`
                    : "bg-surface border border-border text-text-tertiary hover:text-text-secondary"
                }`}
              >
                <span>{cfg.icon}</span>
                <span className="hidden sm:inline">{cfg.label}</span>
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={() => setMode("paste")}
          className="text-xs text-accent hover:text-accent/80 font-medium transition-colors"
        >
          Paste Calcs
        </button>
      </div>
      {/* Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSingleAdd();
        }}
        className="flex gap-2"
      >
        <input
          type="text"
          value={calcInput}
          onChange={(e) => setCalcInput(e.target.value)}
          placeholder={
            calcCategory === "offensive"
              ? "e.g. 252+ Atk Flare Blitz vs 252 HP Rillaboom: 81-96%"
              : calcCategory === "defensive"
                ? "e.g. 252 SpA Flutter Mane Moonblast: 42-50% (lives)"
                : "e.g. 140 Spe to outspeed max speed Rillaboom"
          }
          className="flex-1 min-w-0 px-3 sm:px-4 py-2.5 bg-surface border border-border rounded-xl text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-shadow"
        />
        <button
          type="submit"
          disabled={!calcInput.trim()}
          className="px-4 py-2.5 bg-accent text-white text-sm font-medium rounded-xl hover:bg-accent/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
        >
          Add
        </button>
      </form>
    </div>
  );
}
