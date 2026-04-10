"use client";

import { useState, useRef } from "react";
import type { CalcCategory } from "@/hooks/useDamageCalcs";
import { useTranslation } from "@/lib/i18n";

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
 * Split a single line into separate calcs at HKO boundaries.
 * Each calc in standard Showdown format ends with "OHKO", "2HKO", "3HKO", etc.
 * When users paste multiple calcs joined into one line, split them at the end of each HKO token.
 *
 * Post-HKO qualifiers ("after Leftovers", "if rain", etc.) stay attached to the preceding calc;
 * anything that looks like the start of a new calc (begins with a digit/spread pattern) becomes a new chunk.
 */
function splitByHKO(line: string): string[] {
  const hkoRegex = /\b(?:\d+|O)HKO\b/gi;
  const endIndices: number[] = [];
  let m: RegExpExecArray | null;
  while ((m = hkoRegex.exec(line)) !== null) {
    endIndices.push(m.index + m[0].length);
  }
  if (endIndices.length <= 1) {
    return [line.trim()].filter((s) => s.length > 0);
  }

  const chunks: string[] = [];
  let start = 0;
  for (const end of endIndices) {
    const chunk = line.slice(start, end).trim();
    if (chunk) chunks.push(chunk);
    start = end;
  }
  const trailing = line.slice(start).trim();
  if (trailing) {
    // If it starts with a post-HKO qualifier, attach to the previous chunk
    if (/^(after|if|with|when|plus|minus|\+|-)\b/i.test(trailing) && chunks.length > 0) {
      chunks[chunks.length - 1] += " " + trailing;
    } else if (trailing.length > 0) {
      // Otherwise treat as its own fragment (may be a new calc without HKO)
      chunks.push(trailing);
    }
  }
  return chunks;
}

/**
 * Parse multi-line calc output into individual entries.
 * Splits by newlines first, then by HKO boundaries within each line
 * so that bulk-pasted calcs on a single line still come out as separate entries.
 */
function parseCalcLines(rawText: string, pokemonSpecies: string): ParsedCalcLine[] {
  return rawText
    .split("\n")
    .flatMap((line) => splitByHKO(line))
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
  const { t } = useTranslation();
  const catLabelMap: Record<string, string> = {
    "Offensive": t.offensive,
    "Defensive": t.defensive,
    "Speed Tier": t.speedTier,
  };
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

  const setLineCategory = (index: number, category: CalcCategory) => {
    setParsedLines((prev) =>
      prev.map((line, i) => (i === index ? { ...line, category } : line))
    );
  };

  if (mode === "paste") {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">
              {t.pasteCalcs}
            </span>
            <span className="text-[11px] text-text-secondary leading-snug">
              Paste <span className="text-red-500 dark:text-red-400 font-semibold">offensive</span> and{" "}
              <span className="text-emerald-500 dark:text-emerald-400 font-semibold">defensive</span> calcs
              together — we&apos;ll auto-sort them. Multi-line or all on one line both work.
            </span>
          </div>
          <button
            type="button"
            onClick={() => { setMode("single"); setPasteInput(""); setParsedLines([]); }}
            className="text-xs text-text-tertiary hover:text-text-secondary transition-colors flex-shrink-0"
          >
            {t.cancel}
          </button>
        </div>

        <textarea
          ref={textareaRef}
          value={pasteInput}
          onChange={(e) => handlePasteChange(e.target.value)}
          placeholder={`Paste one or many calcs — offensive and defensive, mixed together.

Examples:
⚔️  252+ Atk Incineroar Flare Blitz vs. 252 HP / 0 Def Rillaboom: 210-248 (103.4 - 122.1%) -- guaranteed OHKO
🛡️  252+ SpA Choice Specs Miraidon Electro Drift vs. 252 HP / 4 SpD Amoonguss: 134-158 (62.0 - 73.1%) -- guaranteed 2HKO`}
          className="w-full min-h-[7rem] p-3 bg-surface border border-border rounded-xl text-sm font-mono text-text-primary placeholder:text-text-tertiary resize-y focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-shadow"
          spellCheck={false}
          autoFocus
        />

        {/* Preview parsed calcs */}
        {parsedLines.length > 0 && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] text-text-tertiary">
                {parsedLines.length} {t.calcsDetected}
              </span>
              <span className="text-[10px] text-text-tertiary italic">
                Tap &#9876; &#128737; &#9889; to fix a wrong category
              </span>
            </div>
            {parsedLines.map((line, i) => {
              const cfg = CATEGORY_CONFIG[line.category];
              return (
                <div
                  key={i}
                  className={`flex flex-col sm:flex-row sm:items-center gap-2 px-3 py-2.5 bg-surface-alt border ${cfg.borderClass} border-l-[3px] rounded-lg`}
                  style={{ borderLeftColor: "currentColor" }}
                >
                  <span className="flex-1 text-xs text-text-primary leading-snug break-words">
                    {line.text}
                  </span>
                  <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-center">
                    {/* Segmented category switcher */}
                    <div className="flex items-center gap-0.5 rounded-lg bg-surface border border-border p-0.5">
                      {(["offensive", "defensive", "speed"] as const).map((cat) => {
                        const catCfg = CATEGORY_CONFIG[cat];
                        const isActive = line.category === cat;
                        const label = catLabelMap[catCfg.label] ?? catCfg.label;
                        return (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => setLineCategory(i, cat)}
                            aria-label={`${t.changeCategory}: ${label}`}
                            aria-pressed={isActive}
                            title={label}
                            className={`inline-flex items-center justify-center h-8 w-8 rounded-md text-sm transition-all duration-150 ${
                              isActive
                                ? `${catCfg.tagBg} ${catCfg.tagText} shadow-sm`
                                : "text-text-tertiary hover:text-text-primary hover:bg-surface-alt"
                            }`}
                          >
                            <span aria-hidden>{catCfg.icon}</span>
                          </button>
                        );
                      })}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAddSingle(i)}
                      className="text-accent text-xs font-semibold hover:text-accent/80"
                    >
                      {t.add}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveParsed(i)}
                      className="inline-flex items-center justify-center h-7 w-7 rounded-md text-text-tertiary hover:text-red-500 hover:bg-red-500/10 transition-colors"
                      aria-label="Remove calc"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              );
            })}
            <button
              type="button"
              onClick={handleAddAll}
              className="self-end px-4 py-2 bg-accent text-white text-sm font-medium rounded-xl hover:bg-accent/90 transition-colors"
            >
              {t.addAll} ({parsedLines.length})
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
        <div className="flex gap-1 sm:gap-1.5 flex-wrap">
          {(["offensive", "defensive", "speed"] as const).map((cat) => {
            const cfg = CATEGORY_CONFIG[cat];
            const isActive = calcCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setCalcCategory(cat)}
                className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-colors min-h-[32px] ${
                  isActive
                    ? `${cfg.tagBg} ${cfg.tagText} border ${cfg.borderClass}`
                    : "bg-surface border border-border text-text-tertiary hover:text-text-secondary"
                }`}
              >
                <span>{cfg.icon}</span>
                <span className="hidden sm:inline">{catLabelMap[cfg.label] ?? cfg.label}</span>
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={() => setMode("paste")}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-accent/10 text-accent hover:bg-accent/15 text-xs font-semibold transition-colors flex-shrink-0 min-h-[32px] border border-accent/20"
          title="Paste multiple offensive and defensive calcs at once"
        >
          <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <rect x="5" y="4" width="10" height="13" rx="2" />
            <path d="M8 4V3a1 1 0 011-1h2a1 1 0 011 1v1" />
          </svg>
          <span>{t.paste}</span>
          <span className="hidden sm:inline text-accent/70 font-normal">· bulk</span>
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
                ? "e.g. 252 SpA Moonblast: 42-50% (lives)"
                : "e.g. 140 Spe outruns max Rillaboom"
          }
          className="flex-1 min-w-0 px-3 sm:px-4 py-2.5 bg-surface border border-border rounded-xl text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-shadow"
        />
        <button
          type="submit"
          disabled={!calcInput.trim()}
          className="px-3 sm:px-4 py-2.5 bg-accent text-white text-sm font-medium rounded-xl hover:bg-accent/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0 min-h-[40px]"
        >
          {t.add}
        </button>
      </form>
    </div>
  );
}
