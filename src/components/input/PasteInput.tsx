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
    <div className="w-full max-w-2xl mx-auto px-4 animate-fade-in">
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-accent-surface text-accent text-xs font-bold rounded-full mb-5 tracking-widest uppercase">
          VGC Team Report
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-text-primary mb-4 tracking-tight leading-[1.1]">
          Build Your<br className="sm:hidden" /> Team Report
        </h1>
        <p className="text-base sm:text-lg text-text-secondary max-w-lg mx-auto leading-relaxed">
          Paste your Showdown team or a PokéPaste URL to build a professional, shareable team report.
        </p>
      </div>

      <div className="space-y-4">
        <div className="relative group">
          <textarea
            value={paste}
            onChange={(e) => { onPasteChange(e.target.value); setFetchError(null); }}
            onKeyDown={handleKeyDown}
            placeholder="Paste your Pokemon Showdown team export or a pokepast.es URL..."
            className="w-full h-64 sm:h-80 p-5 sm:p-6 bg-surface border border-border rounded-2xl text-sm font-mono text-text-primary placeholder:text-text-tertiary resize-none focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/60 transition-all duration-200 shadow-sm group-hover:shadow-md group-hover:border-border"
            spellCheck={false}
          />
          {isUrl && (
            <div className="absolute top-3 right-3 px-2.5 py-1 bg-accent-surface text-accent text-[10px] font-bold rounded-lg uppercase tracking-wider">
              PokéPaste URL
            </div>
          )}
        </div>

        {fetchError && (
          <div className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-xl">
            <span className="text-red-400 text-sm">&#9888;</span>
            <p className="text-sm text-red-400">{fetchError}</p>
          </div>
        )}

        <div className="flex items-center justify-between gap-3 pt-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onPasteChange(SAMPLE_PASTE)}
          >
            Load Sample
          </Button>
          {isUrl ? (
            <Button
              onClick={handleFetchPaste}
              disabled={isFetching}
              size="lg"
            >
              {isFetching ? "Fetching..." : "Fetch & Analyze"}
              <span className="ml-2 text-xs opacity-50 hidden sm:inline">Ctrl+Enter</span>
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
