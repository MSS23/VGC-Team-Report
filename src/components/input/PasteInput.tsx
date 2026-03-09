"use client";

import { useState } from "react";
import { motion } from "motion/react";
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

function looksLikeShowdownPaste(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;
  const hasAbility = /\bAbility:/i.test(trimmed);
  const hasEVs = /\bEVs:/i.test(trimmed);
  const hasMove = /^- .+/m.test(trimmed);
  return [hasAbility, hasEVs, hasMove].filter(Boolean).length >= 2;
}

const POKEMON_SPRITES = [
  "incineroar", "fluttermane", "rillaboom",
  "urshifu", "tornadus", "landorus-therian",
];

export function PasteInput({ paste, onPasteChange, onAnalyze }: PasteInputProps) {
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);

  const isUrl = isPokePasteUrl(paste);
  const hasContent = paste.trim().length > 0;

  const handleAnalyze = () => {
    if (paste.trim() && !isUrl && !looksLikeShowdownPaste(paste)) {
      setValidationError("Invalid format. Paste a Showdown team export or PokéPaste URL.");
      return;
    }
    setValidationError(null);
    onAnalyze();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      if (isUrl) {
        handleFetchPaste();
      } else {
        handleAnalyze();
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

      {/* Animated sprites */}
      <div className="flex justify-center gap-2 sm:gap-3 mb-6 sm:mb-8 overflow-hidden">
        {POKEMON_SPRITES.map((name, i) => (
          <motion.img
            key={name}
            src={`https://play.pokemonshowdown.com/sprites/ani/${name}.gif`}
            alt=""
            className="w-10 h-10 sm:w-14 sm:h-14 object-contain"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: 0.1 + i * 0.09,
              duration: 0.5,
              ease: "easeOut",
            }}
            loading="lazy"
          />
        ))}
      </div>

      {/* Title — minimal */}
      <motion.div
        className="text-center mb-6 sm:mb-8"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <h1 className="text-2xl sm:text-4xl font-bold text-text-primary tracking-tight">
          VGC Team Report
        </h1>
        <p className="text-sm text-text-tertiary mt-2">
          Paste a Showdown export or PokéPaste URL
        </p>
      </motion.div>

      {/* Textarea */}
      <motion.div
        className="relative"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4, ease: "easeOut" }}
      >
        <div
          className={`absolute -inset-px rounded-2xl transition-all duration-300 ${
            isFocused
              ? "bg-gradient-to-b from-accent/25 to-accent/5"
              : "bg-transparent"
          }`}
        />
        <textarea
          value={paste}
          onChange={(e) => {
            onPasteChange(e.target.value);
            setFetchError(null);
            setValidationError(null);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={
            "Incineroar @ Sitrus Berry\nAbility: Intimidate\nLevel: 50\nEVs: 252 HP / 4 Atk / 252 Spe\nCareful Nature\n- Fake Out\n- Knock Off\n- Flare Blitz\n- Parting Shot"
          }
          className="relative w-full h-52 sm:h-72 p-4 sm:p-5 bg-surface border border-border rounded-2xl text-sm font-mono text-text-primary placeholder:text-text-tertiary/40 resize-none focus:outline-none transition-colors duration-200"
          spellCheck={false}
        />
        {isUrl && (
          <motion.span
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute top-3 right-3 px-2 py-0.5 bg-accent/15 text-accent text-[10px] font-semibold rounded-md uppercase tracking-wider"
          >
            PokéPaste
          </motion.span>
        )}
      </motion.div>

      {/* Error */}
      {(fetchError || validationError) && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm text-red-400 mt-3 px-1"
        >
          {fetchError || validationError}
        </motion.p>
      )}

      {/* Actions */}
      <motion.div
        className="flex items-center justify-between gap-3 mt-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25, duration: 0.3 }}
      >
        <button
          onClick={() => onPasteChange(SAMPLE_PASTE)}
          className="text-sm text-text-secondary hover:text-text-primary border border-border hover:border-border-subtle rounded-xl px-4 py-2.5 transition-colors cursor-pointer"
        >
          Load sample
        </button>

        {isUrl ? (
          <motion.button
            onClick={handleFetchPaste}
            disabled={isFetching}
            whileTap={{ scale: 0.97 }}
            className="px-6 py-2.5 bg-accent text-white rounded-xl text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-colors hover:bg-accent/85 shadow-sm shadow-accent/25 cursor-pointer"
          >
            {isFetching ? (
              <span className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Fetching...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                Fetch & Analyze
                <kbd className="text-[10px] opacity-50 hidden sm:inline font-mono">Ctrl+Enter</kbd>
              </span>
            )}
          </motion.button>
        ) : (
          <motion.button
            onClick={handleAnalyze}
            disabled={!hasContent}
            whileTap={hasContent ? { scale: 0.97 } : undefined}
            className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              hasContent
                ? "bg-accent text-white hover:bg-accent/85 shadow-sm shadow-accent/25"
                : "bg-surface-alt text-text-tertiary border border-border cursor-not-allowed"
            }`}
          >
            <span className="flex items-center gap-2">
              Analyze Team
              <kbd className="text-[10px] opacity-50 hidden sm:inline font-mono">Ctrl+Enter</kbd>
            </span>
          </motion.button>
        )}
      </motion.div>

      {/* App credit */}
      <motion.p
        className="text-center text-xs text-text-secondary mt-8 sm:mt-12"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
      >
        Built by{" "}
        <a
          href="https://x.com/Manny64Official"
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-text-primary hover:text-accent transition-colors"
        >
          Manraj Sidhu
        </a>
        <span className="mx-1.5 text-text-tertiary">&middot;</span>
        <a
          href="/privacy"
          className="text-text-tertiary hover:text-text-primary transition-colors"
        >
          Privacy
        </a>
      </motion.p>
    </div>
  );
}
