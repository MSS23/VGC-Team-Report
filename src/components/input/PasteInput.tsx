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
    <div className="w-full max-w-2xl mx-auto px-4 pt-14 sm:pt-14 pb-20 sm:pb-0">

      {/* Top nav bar */}
      <div className="fixed top-0 left-0 right-0 z-20 backdrop-blur-xl bg-background/80 border-b border-border/30">
        <div className="max-w-2xl mx-auto px-4 h-12 flex items-center justify-between">
          {/* Page links (desktop only — mobile uses bottom tabs) */}
          <nav className="hidden sm:flex items-center gap-1">
            {[
              { href: "/explore", label: "Explore" },
              { href: "/compare", label: "Compare" },
              { href: "/changelog", label: "Updates" },
              { href: "/feedback", label: "Feedback" },
            ].map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="px-2.5 py-1.5 text-xs font-bold text-text-tertiary hover:text-text-primary hover:bg-surface-alt/60 rounded-lg transition-all"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Logo on mobile (since nav links are hidden) */}
          <a href="/" className="sm:hidden flex items-center gap-1.5 font-bold text-sm">
            <span className="text-text-primary">VGC Team</span>
            <span className="text-accent">Report</span>
          </a>

          {/* Auth + language */}
          <div className="flex items-center gap-2">
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
                className="px-2.5 py-1.5 text-xs font-bold text-text-secondary hover:text-accent transition-colors hidden sm:inline"
              >
                Dashboard
              </a>
              <UserButton
                appearance={{
                  elements: { avatarBox: "w-7 h-7" },
                }}
              />
            </Show>
            <LanguageSelector />
          </div>
        </div>
      </div>

      {/* Mobile bottom tab bar (same as PageNavbar) */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-surface/95 backdrop-blur-xl border-t border-border safe-bottom" aria-label="Mobile navigation">
        <div className="flex items-center justify-around px-2 py-1.5">
          {[
            { href: "/", label: "Home", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1", active: true },
            { href: "/explore", label: "Explore", icon: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z", active: false },
            { href: "/compare", label: "Compare", icon: "M18 20V10M12 20V4M6 20v-6", active: false },
            { href: "/dashboard", label: "Dashboard", icon: "M4 6h16M4 12h16m-7 6h7", active: false },
          ].map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-all min-w-[56px] active:scale-[0.93] ${
                link.active ? "text-accent" : "text-text-tertiary active:text-text-primary"
              }`}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={link.active ? "2.5" : "2"} strokeLinecap="round" strokeLinejoin="round">
                <path d={link.icon} />
              </svg>
              <span className={`text-[10px] font-bold ${link.active ? "text-accent" : ""}`}>{link.label}</span>
            </a>
          ))}
        </div>
      </nav>

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

      {/* How it works — quick explainer for new users */}
      <motion.div
        className="flex flex-col sm:flex-row items-stretch gap-3 mb-8 sm:mb-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
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

        {/* Feedback CTA */}
        <a
          href="/feedback"
          className="block bg-surface border-2 border-border rounded-2xl px-5 py-4 hover:border-accent/30 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-extrabold text-text-primary group-hover:text-accent transition-colors tracking-tight">
                Send Feedback
              </h2>
              <p className="text-xs sm:text-sm text-text-secondary mt-0.5">
                Found a bug? Have an idea? Help shape the future of VGC Team Report.
              </p>
            </div>
            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-accent-surface flex items-center justify-center group-hover:bg-accent/10 transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
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

      {/* App credit + links */}
      <motion.div
        className="mt-10 sm:mt-14 space-y-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
      >
        <div className="flex items-center justify-center gap-2">
          {[
            { href: "/changelog", label: "Changelog" },
            { href: "/feedback", label: "Feedback" },
            { href: "/privacy", label: t.privacy },
          ].map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="px-3 py-1.5 text-xs font-bold text-text-tertiary hover:text-text-primary hover:bg-surface-alt rounded-lg transition-all"
            >
              {link.label}
            </a>
          ))}
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
  );
}
