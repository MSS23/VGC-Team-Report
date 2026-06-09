"use client";

import { useState, useMemo } from "react";
import { parseShowdownPaste } from "@/lib/parser/showdown-parser";
import { Button } from "@/components/ui/Button";
import { isPokePasteUrl, fetchPokePaste } from "@/lib/utils/pokepaste";
import { useTranslation } from "@/lib/i18n";
import { ARCHETYPES } from "@/lib/data/tags";

const ARCHETYPE_ICONS: Record<string, string> = {
  Rain: "\u{1F327}\u{FE0F}",
  Sun: "\u{2600}\u{FE0F}",
  Sand: "\u{1F3DC}\u{FE0F}",
  Snow: "\u{2744}\u{FE0F}",
  "Trick Room": "\u{1F504}",
  "Semi-TR": "\u{1F503}",
  "Hyper Offense": "\u{2694}\u{FE0F}",
  Balance: "\u{2696}\u{FE0F}",
  "Bulky Offense": "\u{1F6E1}\u{FE0F}",
  Tailwind: "\u{1F4A8}",
  Goodstuffs: "\u{2B50}",
  "Mega Offense": "\u{1F4A5}",
  "Primal Weather": "\u{1F30B}",
};

interface AddOpponentInputProps {
  onAdd: (paste: string, label: string) => void;
}

export function AddOpponentInput({ onAdd }: AddOpponentInputProps) {
  const { t } = useTranslation();
  const [label, setLabel] = useState("");
  const [paste, setPaste] = useState("");
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const isUrl = isPokePasteUrl(paste);

  const parsedResult = useMemo(() => {
    if (!paste.trim() || isUrl) return null;
    return parseShowdownPaste(paste);
  }, [paste, isUrl]);

  const parsedCount = parsedResult?.pokemon.length ?? 0;

  // Auto-detect label from paste header if user hasn't typed one
  const effectiveLabel = label.trim() || parsedResult?.teamName || "";
  const canAdd = parsedCount > 0 && effectiveLabel.length > 0;

  const handleFetchPaste = async () => {
    if (!isUrl) return;
    setIsFetching(true);
    setFetchError(null);
    try {
      const result = await fetchPokePaste(paste);
      setPaste(result.paste);
      // Always update label to match the newly fetched paste
      if (result.title) {
        setLabel(result.title);
      } else {
        const parsed = parseShowdownPaste(result.paste);
        if (parsed.teamName) setLabel(parsed.teamName);
      }
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : "Failed to fetch PokéPaste");
    } finally {
      setIsFetching(false);
    }
  };

  const handleAdd = () => {
    if (!canAdd) return;
    onAdd(paste.trim(), effectiveLabel);
    setLabel("");
    setPaste("");
    setFetchError(null);
  };

  return (
    <div className="mt-6 pt-6 border-t border-border">
      <h3 className="text-sm font-semibold text-text-primary mb-3">
        {t.addMatchupPlan}
      </h3>
      <div className="space-y-3">
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder={parsedResult?.teamName ? `${t.autoDetected}: ${parsedResult.teamName}` : t.opponentLabelPlaceholder}
          aria-label={t.opponentLabelPlaceholder}
          className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-shadow"
        />
        {/* Quick archetype label buttons */}
        {!label.trim() && (
          <div className="flex flex-wrap gap-1.5">
            {ARCHETYPES.map((arch) => (
              <button
                key={arch}
                type="button"
                onClick={() => setLabel(arch)}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-surface-alt/50 text-text-secondary border border-border hover:border-accent/30 hover:text-accent hover:bg-accent-surface/30 transition-all cursor-pointer"
              >
                <span className="text-[11px]">{ARCHETYPE_ICONS[arch] ?? ""}</span>
                {arch}
              </button>
            ))}
          </div>
        )}
        <div className="relative">
          <textarea
            value={paste}
            onChange={(e) => { setPaste(e.target.value); setFetchError(null); }}
            placeholder={t.pasteOpponentPlaceholder}
            aria-label={t.pasteOpponentPlaceholder}
            className="w-full h-36 sm:h-40 p-4 bg-surface border border-border rounded-xl text-sm font-mono text-text-primary placeholder:text-text-tertiary resize-none focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-shadow"
            spellCheck={false}
          />
          {isUrl && (
            <div className="absolute top-2 right-2 px-2 py-0.5 bg-accent-surface text-accent text-[10px] font-semibold rounded-md uppercase tracking-wide">
              PokéPaste URL
            </div>
          )}
        </div>
        {fetchError && (
          <p className="text-xs text-red-400 px-1">{fetchError}</p>
        )}
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-text-tertiary">
            {isUrl
              ? t.fetchPokePasteToContinue
              : parsedCount > 0
                ? `${parsedCount} ${t.pokemonDetected}${parsedResult?.teamName ? ` — "${parsedResult.teamName}"` : ""}`
                : t.pasteTeamToContinue}
          </span>
          {isUrl ? (
            <Button onClick={handleFetchPaste} disabled={isFetching} size="md">
              {isFetching ? t.fetching : t.fetchAndAnalyze}
            </Button>
          ) : (
            <Button onClick={handleAdd} disabled={!canAdd} size="md">
              {t.addPlan}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
