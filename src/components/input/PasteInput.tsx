"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { isPokePasteUrl, fetchPokePaste } from "@/lib/utils/pokepaste";

const SAMPLE_PASTE = `Incineroar @ Sitrus Berry
Ability: Intimidate
Level: 50
Tera Type: Ghost
EVs: 252 HP / 4 Atk / 76 Def / 108 SpD / 68 Spe
Careful Nature
- Fake Out
- Knock Off
- Flare Blitz
- Parting Shot

Flutter Mane @ Choice Specs
Ability: Protosynthesis
Level: 50
Tera Type: Fairy
EVs: 4 HP / 252 SpA / 252 Spe
Timid Nature
- Moonblast
- Shadow Ball
- Dazzling Gleam
- Mystical Fire

Rillaboom @ Assault Vest
Ability: Grassy Surge
Level: 50
Tera Type: Fire
EVs: 252 HP / 116 Atk / 4 Def / 92 SpD / 44 Spe
Adamant Nature
- Grassy Glide
- Wood Hammer
- U-turn
- Fake Out

Urshifu-Rapid-Strike @ Focus Sash
Ability: Unseen Fist
Level: 50
Tera Type: Water
EVs: 4 HP / 252 Atk / 252 Spe
Jolly Nature
- Surging Strikes
- Close Combat
- Aqua Jet
- Detect

Tornadus (M) @ Covert Cloak
Ability: Prankster
Level: 50
Tera Type: Steel
EVs: 4 HP / 252 SpA / 252 Spe
Timid Nature
- Tailwind
- Hurricane
- Icy Wind
- Taunt

Landorus-Therian @ Life Orb
Ability: Intimidate
Level: 50
Tera Type: Steel
EVs: 4 HP / 252 Atk / 252 Spe
Jolly Nature
- Earthquake
- Rock Slide
- U-turn
- Protect`;

interface PasteInputProps {
  paste: string;
  onPasteChange: (value: string) => void;
  onAnalyze: (directPaste?: string) => void;
}

export function PasteInput({ paste, onPasteChange, onAnalyze }: PasteInputProps) {
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const isUrl = isPokePasteUrl(paste);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      if (isUrl) {
        handleFetchPaste();
      } else {
        onAnalyze();
      }
    }
  };

  const handleFetchPaste = async () => {
    if (!isUrl) return;
    setIsFetching(true);
    setFetchError(null);
    try {
      const result = await fetchPokePaste(paste);
      onPasteChange(result.paste);
      onAnalyze(result.paste);
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : "Failed to fetch PokéPaste");
    } finally {
      setIsFetching(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4">
      {/* Hero */}
      <div className="text-center mb-10 animate-fade-in-up">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-accent/10 text-accent text-xs font-bold rounded-full mb-6 tracking-widest uppercase border border-accent/20">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
          </svg>
          VGC Team Report
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-text-primary mb-4 tracking-tight leading-[1.1]">
          Build Your{" "}
          <span className="bg-gradient-to-r from-accent via-purple-500 to-accent bg-clip-text text-transparent">
            Team Report
          </span>
        </h1>
        <p className="text-base sm:text-lg text-text-secondary max-w-lg mx-auto leading-relaxed">
          Paste your Showdown team or PokéPaste URL to create a professional, shareable VGC team report.
        </p>
      </div>

      {/* Input Area */}
      <div className="space-y-4 animate-fade-in" style={{ animationDelay: "150ms" }}>
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-accent/20 via-purple-500/20 to-accent/20 rounded-[18px] opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 blur-sm" />
          <textarea
            value={paste}
            onChange={(e) => { onPasteChange(e.target.value); setFetchError(null); }}
            onKeyDown={handleKeyDown}
            placeholder="Paste your Pokemon Showdown team export or a pokepast.es URL..."
            className="relative w-full h-64 sm:h-80 p-5 sm:p-6 bg-surface border border-border rounded-2xl text-sm font-mono text-text-primary placeholder:text-text-tertiary resize-none focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/60 transition-all duration-200 shadow-sm"
            spellCheck={false}
          />
          {isUrl && (
            <div className="absolute top-3 right-3 px-2.5 py-1 bg-accent text-white text-[10px] font-bold rounded-lg uppercase tracking-wider shadow-sm">
              PokéPaste URL
            </div>
          )}
        </div>

        {fetchError && (
          <div className="flex items-center gap-2 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl animate-fade-in">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-400 flex-shrink-0">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p className="text-sm text-red-400">{fetchError}</p>
          </div>
        )}

        <div className="flex items-center justify-between gap-3 pt-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onPasteChange(SAMPLE_PASTE)}
            className="text-text-tertiary"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-1.5">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14,2 14,8 20,8" />
            </svg>
            Load Sample
          </Button>
          {isUrl ? (
            <Button
              onClick={handleFetchPaste}
              disabled={isFetching}
              size="lg"
            >
              {isFetching ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Fetching...
                </>
              ) : (
                <>
                  Fetch & Analyze
                  <span className="ml-2 text-xs opacity-50 hidden sm:inline">Ctrl+Enter</span>
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={() => onAnalyze()}
              disabled={!paste.trim()}
              size="lg"
            >
              Analyze Team
              <span className="ml-2 text-xs opacity-50 hidden sm:inline">Ctrl+Enter</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
