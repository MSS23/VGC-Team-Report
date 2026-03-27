"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { isPokePasteUrl, fetchPokePaste } from "@/lib/utils/pokepaste";
import { useTranslation } from "@/lib/i18n";
import { PageNavbar } from "@/components/layout/PageNavbar";
import { SpotlightCard } from "@/components/explore/SpotlightCard";
import type { ExploreReport } from "@/components/explore/ReportCard";
import { applyRandomAccent } from "@/lib/utils/random-accent";
import { WhatsNewModal } from "@/components/ui/WhatsNewModal";


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
  darkMode: boolean;
  onToggleDarkMode: () => void;
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

export function PasteInput({ paste, onPasteChange, onAnalyze, selectedTemplate, onTemplateSelect, darkMode, onToggleDarkMode }: PasteInputProps) {
  const { t } = useTranslation();
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);

  // Random accent color on landing page
  useEffect(() => { applyRandomAccent(); }, []);

  // Collapse "How it works" for returning users
  const [howItWorksOpen, setHowItWorksOpen] = useState(false);
  const [isReturningUser, setIsReturningUser] = useState(false);
  useEffect(() => {
    const visited = localStorage.getItem("vgc-visited");
    if (visited) {
      setIsReturningUser(true);
    } else {
      setHowItWorksOpen(true);
      localStorage.setItem("vgc-visited", "1");
    }
  }, []);
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
    <>
      <PageNavbar darkMode={darkMode} onToggleDarkMode={onToggleDarkMode} maxWidth="max-w-2xl" activePage="home" />

      <div className="w-full max-w-2xl mx-auto px-4 pt-4 pb-24 sm:pb-4">

      {/* Animated sprites with floating effect */}
      <div className="flex justify-center gap-3 sm:gap-5 mb-5 sm:mb-10 overflow-hidden">
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
        className="text-center mb-4 sm:mb-8"
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

      {/* How it works — collapsible for returning mobile users */}
      <motion.div
        className="mb-6 sm:mb-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        {isReturningUser && !howItWorksOpen ? (
          <button
            type="button"
            onClick={() => setHowItWorksOpen(true)}
            className="sm:hidden w-full flex items-center justify-center gap-1.5 py-2 text-[10px] font-bold text-text-tertiary hover:text-text-secondary transition-colors cursor-pointer"
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6,9 12,15 18,9" />
            </svg>
            How it works
          </button>
        ) : null}
        <div className={`flex flex-col sm:flex-row items-stretch gap-3 ${isReturningUser && !howItWorksOpen ? "hidden sm:flex" : "flex"}`}>
          {[
            { step: "1", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2", title: "Paste your team", desc: "From Showdown, PokePaste, or any team builder" },
            { step: "2", icon: "M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z", title: "Add your notes", desc: "Damage calcs, matchup plans, and strategy" },
            { step: "3", icon: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 100-8 4 4 0 000 8M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75", title: "Share with anyone", desc: "Public link, presentation mode, or PDF export" },
          ].map((item) => (
            <div
              key={item.step}
              className="flex-1 flex items-start gap-3 p-3 rounded-xl bg-surface border border-border"
            >
              <div className="w-7 h-7 rounded-lg bg-accent-surface flex items-center justify-center flex-shrink-0">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
                  <path d={item.icon} />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-text-primary">{item.title}</p>
                <p className="text-[10px] text-text-tertiary leading-snug mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
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
          className="relative w-full h-44 sm:h-72 p-4 sm:p-5 bg-surface border-2 border-border rounded-xl text-sm font-[family-name:var(--font-mono)] text-text-primary placeholder:text-text-tertiary/40 resize-none focus:outline-none focus:border-accent/50 transition-all duration-300"
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
        className="flex flex-col gap-3 mt-5"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25, duration: 0.3 }}
      >
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

        {/* New to this? Try a sample */}
        {!hasContent && (
          <div className="flex items-center gap-2 p-3 bg-surface-alt/50 rounded-xl border border-border/50">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent flex-shrink-0">
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <p className="text-[11px] text-text-secondary flex-1">
              <span className="font-semibold text-text-primary">New here?</span>{" "}
              Paste a team from{" "}
              <a href="https://pokepast.es" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline font-semibold">PokePaste</a>,{" "}
              <a href="https://play.pokemonshowdown.com" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline font-semibold">Showdown</a>, or{" "}
              <button type="button" onClick={() => onPasteChange(SAMPLE_PASTE)} className="text-accent hover:underline font-semibold cursor-pointer">try a sample team</button> to see how it works.
            </p>
          </div>
        )}
      </motion.div>


      {/* Quick links — visible near the action area so users know the site has more pages */}
      <motion.div
        className="mt-8 sm:mt-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35, duration: 0.4 }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-border" />
          <span className="text-[10px] font-extrabold text-text-tertiary uppercase tracking-widest">More</span>
          <div className="flex-1 h-px bg-border" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { href: "/explore", label: "Explore Teams", icon: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z", desc: "Community reports" },
            { href: "/compare", label: "Compare", icon: "M18 20V10M12 20V4M6 20v-6", desc: "Side-by-side analysis" },
            { href: "/changelog", label: "Updates", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z", desc: "What's new" },
            { href: "/feedback", label: "Feedback", icon: "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z", desc: "Bugs & ideas" },
          ].map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="flex items-center gap-2.5 px-3 py-2.5 bg-surface border border-border rounded-xl hover:border-accent/30 hover:bg-surface-alt/50 transition-all group"
            >
              <div className="w-7 h-7 rounded-lg bg-accent-surface/60 flex items-center justify-center flex-shrink-0 group-hover:bg-accent/10 transition-colors">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
                  <path d={link.icon} />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-text-primary group-hover:text-accent transition-colors leading-tight">{link.label}</p>
                <p className="text-[10px] text-text-tertiary leading-tight hidden sm:block">{link.desc}</p>
              </div>
            </a>
          ))}
        </div>
      </motion.div>

      {/* Spotlight report */}
      {spotlight && (
        <motion.div
          className="mt-8 sm:mt-10"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <div className="flex items-center gap-2 mb-3">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-accent">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            <span className="text-[10px] font-extrabold text-text-tertiary uppercase tracking-widest">Featured Team Report</span>
          </div>
          <SpotlightCard report={spotlight} />
        </motion.div>
      )}

      {/* Footer */}
      <motion.div
        className="mt-10 sm:mt-14 space-y-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
      >
        <div className="flex items-center justify-center gap-2">
          <a href="/privacy" className="px-3 py-1.5 text-xs font-bold text-text-tertiary hover:text-text-primary hover:bg-surface-alt rounded-lg transition-all">
            {t.privacy}
          </a>
        </div>
        <p className="text-center text-xs text-text-tertiary font-medium">
          {t.builtBy}{" "}
          <a
            href="https://x.com/Manny64Official"
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold text-text-primary hover:text-accent transition-colors"
          >
            Manraj Sidhu
          </a>
        </p>
      </motion.div>

      <WhatsNewModal />
      </div>
    </>
  );
}
