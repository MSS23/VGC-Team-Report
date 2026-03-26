"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { isPokePasteUrl, fetchPokePaste } from "@/lib/utils/pokepaste";
import { useTranslation } from "@/lib/i18n";
import { LanguageSelector } from "@/components/ui/LanguageSelector";
import { SpotlightCard } from "@/components/explore/SpotlightCard";
import type { ExploreReport } from "@/components/explore/ReportCard";
import { applyRandomAccent } from "@/lib/utils/random-accent";
import { WhatsNewModal } from "@/components/ui/WhatsNewModal";
import { SignInButton, UserButton, Show } from "@clerk/nextjs";
import { REPORT_TEMPLATES } from "@/lib/templates";

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
  selectedTemplate?: string;
  onTemplateSelect?: (id: string) => void;
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

export function PasteInput({ paste, onPasteChange, onAnalyze, selectedTemplate, onTemplateSelect }: PasteInputProps) {
  const { t } = useTranslation();
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);

  // Random accent color on landing page
  useEffect(() => { applyRandomAccent(); }, []);
  const [spotlight, setSpotlight] = useState<ExploreReport | null>(null);

  // Fetch spotlight report once per session (delayed to avoid blocking render)
  useEffect(() => {
    // Check session cache first
    const cached = sessionStorage.getItem("vgc-spotlight");
    if (cached) {
      try { setSpotlight(JSON.parse(cached)); } catch { /* ignore */ }
      return;
    }
    // Delay fetch to avoid blocking initial paint
    const timer = setTimeout(() => {
      fetch("/api/spotlight")
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data?.spotlight) {
            setSpotlight(data.spotlight);
            sessionStorage.setItem("vgc-spotlight", JSON.stringify(data.spotlight));
          }
        })
        .catch(() => {});
    }, 500);
    return () => clearTimeout(timer);
  }, []);

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

      {/* Top right: auth + language */}
      <div className="fixed top-3 right-3 z-20 flex items-center gap-2">
        <Show when="signed-out">
          <SignInButton mode="modal">
            <button className="px-3 py-1.5 text-xs font-bold text-text-secondary bg-surface border border-border rounded-lg hover:border-accent/30 hover:text-accent transition-all cursor-pointer">
              Sign In
            </button>
          </SignInButton>
        </Show>
        <Show when="signed-in">
          <a
            href="/dashboard"
            className="px-3 py-1.5 text-xs font-bold text-text-secondary bg-surface border border-border rounded-lg hover:border-accent/30 hover:text-accent transition-all"
          >
            Dashboard
          </a>
          <UserButton
            appearance={{
              elements: { avatarBox: "w-8 h-8" },
            }}
          />
        </Show>
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
        className="text-center mb-6 sm:mb-8"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <h1 className="text-3xl sm:text-5xl font-extrabold text-text-primary tracking-tight leading-none">
          {t.appTitle}
          <span className="text-accent"> {t.appTitleAccent}</span>
        </h1>
        <p className="text-sm sm:text-base text-text-secondary mt-3 font-medium max-w-md mx-auto">
          {t.appSubtitle}
        </p>
      </motion.div>

      {/* Feature pills */}
      <motion.div
        className="flex flex-wrap items-center justify-center gap-2 mb-8 sm:mb-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        {[
          { icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2", label: "Team Analysis" },
          { icon: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 100-8 4 4 0 000 8M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75", label: "Share & Explore" },
          { icon: "M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z", label: "Matchup Plans" },
        ].map((pill) => (
          <span
            key={pill.label}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold rounded-full bg-surface border border-border text-text-secondary"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
              <path d={pill.icon} />
            </svg>
            {pill.label}
          </span>
        ))}
      </motion.div>

      {/* Textarea with accent glow */}
      <motion.p
        className="text-xs text-text-tertiary font-medium mb-2 px-1"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.3 }}
      >
        {t.appInputHint}
      </motion.p>
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

      {/* Template selector */}
      <motion.div
        className="mt-8"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
      >
        <div className="flex items-center gap-2 mb-3">
          <h3 className="text-[10px] font-extrabold uppercase tracking-widest text-text-tertiary">What kind of report?</h3>
          <span className="text-[9px] text-text-tertiary/60 font-medium">(pre-fills structure after analyzing)</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {REPORT_TEMPLATES.map((tmpl) => {
            const isSelected = selectedTemplate === tmpl.id;
            return (
              <button
                key={tmpl.id}
                type="button"
                onClick={() => onTemplateSelect?.(tmpl.id)}
                className={`relative flex flex-col items-start gap-1.5 p-3 rounded-xl border-2 text-left transition-all cursor-pointer ${
                  isSelected
                    ? "border-accent bg-accent-surface shadow-sm shadow-accent/10"
                    : "border-border bg-surface hover:border-accent/30 hover:bg-surface-alt/50"
                }`}
              >
                {isSelected && (
                  <span className="absolute top-2 right-2">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </span>
                )}
                <span className="text-base">{tmpl.icon}</span>
                <span className={`text-xs font-bold ${isSelected ? "text-accent" : "text-text-primary"}`}>{tmpl.name}</span>
                <span className="text-[10px] text-text-tertiary leading-tight">{tmpl.description}</span>
              </button>
            );
          })}
        </div>
        {selectedTemplate && selectedTemplate !== "blank" && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[11px] text-accent font-semibold mt-2.5 flex items-center gap-1.5"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            {selectedTemplate === "quick" && "Quick Share \u2014 starts with a summary prompt. Matchup plans hidden by default."}
            {selectedTemplate === "tournament" && "Tournament Report \u2014 all sections enabled. Add matchups, calcs, and game plans."}
            {selectedTemplate === "guide" && "Team Guide \u2014 starts with a detailed summary prompt. Focused on notes and calcs."}
          </motion.p>
        )}
      </motion.div>

      {/* Community section: spotlight + explore CTA */}
      <motion.div
        className="mt-12 sm:mt-16 space-y-6"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        {/* Section divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-border" />
          <span className="text-[10px] font-extrabold text-text-tertiary uppercase tracking-widest">Community</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Explore CTA */}
        <a
          href="/explore"
          className="block bg-surface border-2 border-border rounded-2xl px-5 py-4 hover:border-accent/30 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-extrabold text-text-primary group-hover:text-accent transition-colors tracking-tight">
                {t.explore} Community Teams
              </h2>
              <p className="text-xs sm:text-sm text-text-secondary mt-0.5">
                See what other players are building and sharing from tournaments around the world.
              </p>
            </div>
            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-accent-surface flex items-center justify-center group-hover:bg-accent/10 transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
          </div>
        </a>

        {/* Compare CTA */}
        <a
          href="/compare"
          className="block bg-surface border-2 border-border rounded-2xl px-5 py-4 hover:border-accent/30 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-extrabold text-text-primary group-hover:text-accent transition-colors tracking-tight">
                Compare Teams
              </h2>
              <p className="text-xs sm:text-sm text-text-secondary mt-0.5">
                Side-by-side type coverage, speed tiers, and shared Pokemon analysis.
              </p>
            </div>
            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-accent-surface flex items-center justify-center group-hover:bg-accent/10 transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
                <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
              </svg>
            </div>
          </div>
        </a>

        {/* Spotlight report */}
        {spotlight && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-accent">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              <span className="text-[10px] font-extrabold text-text-tertiary uppercase tracking-widest">Featured Team Report</span>
            </div>
            <SpotlightCard report={spotlight} />
          </div>
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
          href="/changelog"
          className="text-text-tertiary hover:text-text-primary transition-colors"
        >
          Changelog
        </a>
        <span className="mx-1.5 text-border">&middot;</span>
        <a
          href="/feedback"
          className="text-text-tertiary hover:text-text-primary transition-colors"
        >
          Feedback
        </a>
        <span className="mx-1.5 text-border">&middot;</span>
        <a
          href="/privacy"
          className="text-text-tertiary hover:text-text-primary transition-colors"
        >
          {t.privacy}
        </a>
      </motion.p>

      <WhatsNewModal />
    </div>
  );
}
