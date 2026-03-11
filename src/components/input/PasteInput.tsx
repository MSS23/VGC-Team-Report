"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { isPokePasteUrl, fetchPokePaste } from "@/lib/utils/pokepaste";
import { useTranslation } from "@/lib/i18n";
import { LanguageSelector } from "@/components/ui/LanguageSelector";

export const SAMPLE_PASTE = `Incineroar @ Sitrus Berry
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
  const { t } = useTranslation();
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);

  const isUrl = isPokePasteUrl(paste);
  const hasContent = paste.trim().length > 0;

  const handleAnalyze = () => {
    if (paste.trim() && !isUrl && !looksLikeShowdownPaste(paste)) {
      setValidationError(t.invalidFormat);
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
      setFetchError(err instanceof Error ? err.message : "Failed to fetch PokePaste");
    } finally {
      setIsFetching(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4">

      {/* Language selector — top right */}
      <div className="fixed top-3 right-3 z-20">
        <LanguageSelector />
      </div>

      {/* Animated sprites with floating effect */}
      <div className="flex justify-center gap-3 sm:gap-5 mb-8 sm:mb-10 overflow-hidden">
        {POKEMON_SPRITES.map((name, i) => (
          <motion.img
            key={name}
            src={`https://play.pokemonshowdown.com/sprites/ani/${name}.gif`}
            alt=""
            className="w-11 h-11 sm:w-16 sm:h-16 object-contain drop-shadow-lg"
            initial={{ opacity: 0, y: 30, scale: 0.8 }}
            animate={{
              opacity: 1,
              y: [0, -6, 0],
              scale: 1,
            }}
            transition={{
              opacity: { delay: 0.1 + i * 0.09, duration: 0.5 },
              scale: { delay: 0.1 + i * 0.09, duration: 0.5 },
              y: {
                delay: 0.6 + i * 0.09,
                duration: 2.5,
                repeat: Infinity,
                ease: "easeInOut",
              },
            }}
            loading="lazy"
          />
        ))}
      </div>

      {/* Title — bold, distinctive */}
      <motion.div
        className="text-center mb-8 sm:mb-10"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <h1 className="text-3xl sm:text-5xl font-extrabold text-text-primary tracking-tight leading-none">
          {t.appTitle}
          <span className="text-accent"> {t.appTitleAccent}</span>
        </h1>
        <p className="text-sm sm:text-base text-text-tertiary mt-3 font-medium tracking-wide">
          {t.appSubtitle}
        </p>
      </motion.div>

      {/* Textarea with accent glow */}
      <motion.div
        className="relative"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4, ease: "easeOut" }}
      >
        <div
          className={`absolute -inset-px rounded-xl transition-all duration-500 ${
            isFocused
              ? "bg-gradient-to-b from-accent/30 via-accent/10 to-transparent shadow-lg shadow-accent/10"
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
          className="relative w-full h-52 sm:h-72 p-4 sm:p-5 bg-surface border-2 border-border rounded-xl text-sm font-[family-name:var(--font-mono)] text-text-primary placeholder:text-text-tertiary/40 resize-none focus:outline-none focus:border-accent/50 transition-all duration-300"
          spellCheck={false}
        />
        {isUrl && (
          <motion.span
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute top-3 right-3 px-2.5 py-1 bg-accent text-white text-[10px] font-extrabold rounded-md uppercase tracking-widest shadow-sm"
          >
            {t.pokePaste}
          </motion.span>
        )}
      </motion.div>

      {/* Error */}
      {(fetchError || validationError) && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm text-danger font-semibold mt-3 px-1"
        >
          {fetchError || validationError}
        </motion.p>
      )}

      {/* Actions */}
      <motion.div
        className="flex items-center justify-between gap-3 mt-5"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25, duration: 0.3 }}
      >
        <button
          onClick={() => onPasteChange(SAMPLE_PASTE)}
          className="text-sm font-semibold text-text-secondary hover:text-accent border-2 border-border hover:border-accent/30 rounded-lg px-4 py-2.5 transition-all duration-200 cursor-pointer hover:bg-accent-surface/50"
        >
          {t.loadSample}
        </button>

        {isUrl ? (
          <motion.button
            onClick={handleFetchPaste}
            disabled={isFetching}
            whileTap={{ scale: 0.97 }}
            className="px-6 py-2.5 bg-accent text-white rounded-lg text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:brightness-110 shadow-md shadow-accent/30 cursor-pointer tracking-wide"
          >
            {isFetching ? (
              <span className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {t.fetching}
              </span>
            ) : (
              <span className="flex items-center gap-2">
                {t.fetchAndAnalyze}
                <kbd className="text-[10px] opacity-60 hidden sm:inline font-[family-name:var(--font-mono)]">Ctrl+Enter</kbd>
              </span>
            )}
          </motion.button>
        ) : (
          <motion.button
            onClick={handleAnalyze}
            disabled={!hasContent}
            whileTap={hasContent ? { scale: 0.97 } : undefined}
            className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all cursor-pointer tracking-wide ${
              hasContent
                ? "bg-accent text-white hover:brightness-110 shadow-md shadow-accent/30"
                : "bg-surface-alt text-text-tertiary border-2 border-border cursor-not-allowed"
            }`}
          >
            <span className="flex items-center gap-2">
              {t.analyzeTeam}
              <kbd className="text-[10px] opacity-60 hidden sm:inline font-[family-name:var(--font-mono)]">Ctrl+Enter</kbd>
            </span>
          </motion.button>
        )}
      </motion.div>

      {/* App credit */}
      <motion.p
        className="text-center text-xs text-text-tertiary mt-10 sm:mt-14 font-medium"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
      >
        {t.builtBy}{" "}
        <a
          href="https://x.com/Manny64Official"
          target="_blank"
          rel="noopener noreferrer"
          className="font-bold text-text-primary hover:text-accent transition-colors"
        >
          Manraj Sidhu
        </a>
        <span className="mx-1.5 text-border">&middot;</span>
        <a
          href="/privacy"
          className="text-text-tertiary hover:text-text-primary transition-colors"
        >
          {t.privacy}
        </a>
      </motion.p>
    </div>
  );
}
