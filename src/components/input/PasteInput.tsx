"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { motion } from "motion/react";
import { isPokePasteUrl, fetchPokePaste } from "@/lib/utils/pokepaste";
import { useTranslation } from "@/lib/i18n";

import { SpotlightCard } from "@/components/explore/SpotlightCard";
import type { ExploreReport } from "@/components/explore/ReportCard";
import { applyRandomAccent } from "@/lib/utils/random-accent";
import { resolveSlug, getSpriteUrls } from "@/lib/utils/sprite-slug";
import { CHAMPIONS_SAMPLE_TEAMS } from "@/data/champions-sample-teams";

const WhatsNewModal = dynamic(
  () => import("@/components/ui/WhatsNewModal").then(m => ({ default: m.WhatsNewModal })),
  { ssr: false }
);


export const SAMPLE_PASTE = `Kangaskhan-Mega @ Kangaskhanite
Ability: Parental Bond
Level: 50
EVs: 4 HP / 252 Atk / 252 Spe
Jolly Nature
- Fake Out
- Return
- Sucker Punch
- Power-Up Punch

Salamence-Mega @ Salamencite
Ability: Aerilate
Level: 50
EVs: 4 Atk / 252 SpA / 252 Spe
Naive Nature
- Hyper Voice
- Double-Edge
- Flamethrower
- Protect

Incineroar @ Assault Vest
Ability: Intimidate
Level: 50
EVs: 252 HP / 4 Atk / 76 Def / 108 SpD / 68 Spe
Careful Nature
- Fake Out
- Knock Off
- Flare Blitz
- U-turn

Tapu Fini @ Leftovers
Ability: Misty Surge
Level: 50
EVs: 252 HP / 4 Def / 68 SpA / 108 SpD / 76 Spe
Calm Nature
- Muddy Water
- Moonblast
- Calm Mind
- Protect

Landorus-Therian @ Choice Scarf
Ability: Intimidate
Level: 50
EVs: 4 HP / 252 Atk / 252 Spe
Jolly Nature
- Earthquake
- Rock Slide
- U-turn
- Superpower

Amoonguss @ Sitrus Berry
Ability: Regenerator
Level: 50
EVs: 252 HP / 148 Def / 108 SpD
Relaxed Nature
IVs: 0 Spe
- Spore
- Rage Powder
- Giga Drain
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
  "kangaskhan-mega", "salamence-mega", "incineroar",
  "charizard-megay", "groudon-primal", "metagross-mega",
];

function PopularCardSprite({ species }: { species: string }) {
  const urls = getSpriteUrls(species);
  const [idx, setIdx] = useState(0);
  return (
    <img
      src={urls[Math.min(idx, urls.length - 1)]}
      alt={species}
      width={28}
      height={28}
      className="w-7 h-7 object-contain"
      loading="lazy"
      onError={() => setIdx((i) => Math.min(i + 1, urls.length - 1))}
    />
  );
}

export function PasteInput({ paste, onPasteChange, onAnalyze }: PasteInputProps) {
  const { t } = useTranslation();
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [showPasteHint, setShowPasteHint] = useState(false);
  const [pasteHintSeen, setPasteHintSeen] = useState(false);

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
    // Seed hint-seen flag from localStorage
    if (localStorage.getItem("vgc-paste-hint-seen")) {
      setPasteHintSeen(true);
    }
  }, []);
  const [championsBannerDismissed, setChampionsBannerDismissed] = useState(true);
  useEffect(() => {
    setChampionsBannerDismissed(localStorage.getItem("vgc-champions-banner-dismissed") === "1");
  }, []);
  const dismissChampionsBanner = () => {
    setChampionsBannerDismissed(true);
    localStorage.setItem("vgc-champions-banner-dismissed", "1");
  };

  const [spotlight, setSpotlight] = useState<ExploreReport | null>(null);
  const [latestReports, setLatestReports] = useState<ExploreReport[]>([]);

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

  // Fetch the actual newest public reports. This deliberately avoids a
  // session-long cache so returning to the homepage surfaces newly published
  // teams instead of a stale "latest" rail.
  useEffect(() => {
    const timer = setTimeout(() => {
      fetch("/api/explore?limit=6&sort=newest", { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          const reports = Array.isArray(data?.reports) ? data.reports as ExploreReport[] : [];
          if (reports.length > 0) {
            setLatestReports(reports);
          }
        })
        .catch(() => {});
    }, 800);
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
      <div className="w-full max-w-3xl mx-auto px-4 pt-3 pb-8 sm:pb-4">

      {/* Static sprites on mobile save bandwidth and battery; desktop keeps
          the animated Showdown artwork with a short entrance only. */}
      <div className="flex justify-center gap-3 sm:gap-5 mb-4 sm:mb-8 overflow-hidden">
        {POKEMON_SPRITES.map((name, i) => (
          <picture key={name}>
            <source
              media="(max-width: 639px), (prefers-reduced-motion: reduce)"
              srcSet={`https://play.pokemonshowdown.com/sprites/home/${resolveSlug(name)}.png`}
            />
            <motion.img
              src={`https://play.pokemonshowdown.com/sprites/ani/${resolveSlug(name)}.gif`}
              alt=""
              width={64}
              height={64}
              className="w-11 h-11 sm:w-16 sm:h-16 object-contain drop-shadow-lg"
              initial={{ opacity: 0, y: 12, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.05 + i * 0.04, duration: 0.25, ease: "easeOut" }}
              loading="eager"
            />
          </picture>
        ))}
      </div>

      {/* Title — bold, distinctive */}
      <motion.div
        className="text-center mb-3 sm:mb-6"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight leading-tight">
          {t.appTitle}
          <span className="text-accent"> {t.appTitleAccent}</span>
        </h1>
        <p className="text-sm sm:text-base text-text-secondary mt-3 font-semibold max-w-md mx-auto">
          {t.appSubtitle}
        </p>
        <p className="text-xs sm:text-sm text-text-tertiary mt-2 leading-relaxed max-w-lg mx-auto">
          {t.appMission}
        </p>
      </motion.div>

      {/* Champions announcement banner */}
      {!championsBannerDismissed && (
        <motion.a
          href="/champions"
          className="group flex items-center gap-3 mb-4 sm:mb-6 px-4 py-3 rounded-xl bg-gradient-to-r from-accent/10 via-accent/5 to-transparent border border-accent/20 hover:border-accent/40 transition-all relative"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
        >
          <div className="w-9 h-9 rounded-lg bg-accent/15 flex items-center justify-center flex-shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
              <path d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs sm:text-sm font-bold text-text-primary leading-snug">
              Pok&eacute;mon Champions is here!
            </p>
            <p className="text-[10px] sm:text-xs text-text-secondary mt-0.5">
              Build your Mega Evolution team report for the new format.
            </p>
          </div>
          <span className="text-xs font-bold text-accent group-hover:translate-x-0.5 transition-transform flex-shrink-0 hidden sm:inline">
            Learn more &rarr;
          </span>
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); dismissChampionsBanner(); }}
            className="absolute top-2 right-2 p-1 rounded-md text-text-tertiary hover:text-text-primary hover:bg-surface-alt transition-colors cursor-pointer"
            aria-label="Dismiss"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </motion.a>
      )}

      {/* How it works — collapsible for returning mobile users */}
      <motion.div
        className="mb-4 sm:mb-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        {isReturningUser && !howItWorksOpen ? (
          <button
            type="button"
            onClick={() => setHowItWorksOpen(true)}
            className="sm:hidden w-full min-h-11 flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-text-tertiary hover:text-text-secondary active:text-text-primary transition-colors cursor-pointer"
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6,9 12,15 18,9" />
            </svg>
            How it works
          </button>
        ) : null}
        <div className={`flex flex-col sm:flex-row items-stretch gap-3 ${isReturningUser && !howItWorksOpen ? "hidden sm:flex" : "flex"}`}>
          {[
            { step: "1", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2", title: "Paste your team", desc: "Import any PokéPaste URL, rental code, or Showdown export" },
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
            // Dismiss hint on first keystroke
            if (showPasteHint) setShowPasteHint(false);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            setIsFocused(true);
            // Show hint for new users on first focus of empty textarea
            if (!isReturningUser && !paste.trim() && !pasteHintSeen) {
              setShowPasteHint(true);
              setPasteHintSeen(true);
              localStorage.setItem("vgc-paste-hint-seen", "1");
            }
          }}
          onBlur={() => {
            setIsFocused(false);
            setShowPasteHint(false);
          }}
          placeholder={
            "Incineroar @ Sitrus Berry\nAbility: Intimidate\nLevel: 50\nEVs: 252 HP / 4 Atk / 252 Spe\nCareful Nature\n- Fake Out\n- Knock Off\n- Flare Blitz\n- Parting Shot"
          }
          aria-label="Paste your Showdown team export, PokéPaste URL, or replay URL"
          className="relative w-full h-40 sm:h-56 p-4 sm:p-5 bg-surface border-2 border-border rounded-xl text-sm font-[family-name:var(--font-mono)] text-text-primary placeholder:text-text-tertiary/40 resize-none focus:outline-none focus:border-accent/50 transition-all duration-300"
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

      {/* Contextual paste hint for new users */}
      {showPasteHint && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          aria-live="polite"
          className="text-xs text-text-secondary mt-2 px-1"
        >
          Paste your full 6-Pok&eacute;mon Showdown export, or a{" "}
          <span className="font-semibold text-text-primary">pokepast.es</span> URL
        </motion.p>
      )}

      {/* Error */}
      {(fetchError || validationError) && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          role="alert"
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
            className="min-h-11 px-6 py-2.5 bg-accent text-white rounded-xl text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:brightness-110 shadow-md shadow-accent/30 cursor-pointer tracking-wide"
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
            className={`min-h-11 px-6 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer tracking-wide ${
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

        {/* Archetype sample team picker — 3 cards, horizontally scrollable on mobile */}
        <p className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center text-xs text-text-tertiary">
          <span>Free to build</span>
          <span aria-hidden="true">&bull;</span>
          <span>Saved on this device</span>
          <span aria-hidden="true">&bull;</span>
          <span>Link-only sharing by default</span>
        </p>

        {!hasContent && (
          <motion.div className="flex flex-col gap-2">
            <p className="text-xs font-bold text-text-tertiary uppercase tracking-widest px-0.5">
              Try a sample team:
            </p>
            <div className="flex gap-2 overflow-x-auto pb-1 snap-x snap-mandatory scrollbar-none -mx-1 px-1">
              {CHAMPIONS_SAMPLE_TEAMS.map((team) => (
                <motion.button
                  key={team.id}
                  type="button"
                  whileTap={{ scale: 0.96 }}
                  onClick={() => { onPasteChange(team.paste); onAnalyze(team.paste); }}
                  className="flex-shrink-0 snap-start flex flex-col items-center justify-center gap-1.5 min-w-[140px] min-h-[88px] px-3 py-3 rounded-xl border border-accent/30 bg-accent/[0.08] hover:bg-accent/15 hover:border-accent/50 transition-all cursor-pointer text-center"
                  aria-label={`Try ${team.name} sample team`}
                >
                  <div className="flex flex-wrap justify-center gap-0.5 w-full max-w-[96px]">
                    {team.pokemon.map((species) => (
                      <PopularCardSprite key={species} species={species} />
                    ))}
                  </div>
                  <span className="text-xs font-bold text-accent leading-tight mt-0.5 px-1">
                    {team.name}
                  </span>
                </motion.button>
              ))}
            </div>
            <p className="text-xs text-text-tertiary text-center leading-relaxed">
              Or paste from{" "}
              <a href="https://pokepast.es" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center text-accent hover:underline font-semibold">PokePaste</a>{" "}
              /{" "}
              <a href="https://play.pokemonshowdown.com" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center text-accent hover:underline font-semibold">Showdown</a>
            </p>
          </motion.div>
        )}
      </motion.div>


      {/* Spotlight report */}
      {spotlight && (
        <motion.div
          className="mt-6 sm:mt-8"
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

      {/* Popular reports rail */}
      {latestReports.length > 0 && (
        <motion.div
          className="mt-6 sm:mt-8"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4 }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
              <span className="text-[10px] font-extrabold text-text-tertiary uppercase tracking-widest">Latest Public Reports</span>
            </div>
            <Link href="/explore?sort=newest" className="inline-flex min-h-11 items-center px-2 text-[10px] font-bold text-text-tertiary hover:text-accent transition-colors">
              View all →
            </Link>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 snap-x snap-mandatory scrollbar-none -mx-1 px-1">
            {latestReports.map((report) => (
              <Link
                key={report.id}
                href={`/s/${report.id}`}
                className="flex-shrink-0 snap-start w-40 sm:w-44 rounded-xl bg-surface border border-border hover:border-accent/40 hover:bg-surface-alt/60 transition-all p-3 group"
              >
                <div className="flex flex-wrap gap-0.5 mb-2">
                  {report.species.slice(0, 6).map((s) => (
                    <PopularCardSprite key={s} species={s} />
                  ))}
                </div>
                {(report.tournamentName || report.placement) && (
                  <p className="text-[10px] font-bold text-accent truncate leading-tight mb-0.5">
                    {report.placement ? `${report.placement} ` : ""}{report.tournamentName ?? ""}
                  </p>
                )}
                {report.creatorName && (
                  <p className="text-[10px] text-text-tertiary truncate">
                    by {report.creatorName}
                  </p>
                )}
              </Link>
            ))}
          </div>
        </motion.div>
      )}

      {/* Feedback callout */}
      <motion.div
        className="mt-6 sm:mt-8"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45, duration: 0.4 }}
      >
        <a
          href="/feedback"
          className="group flex items-start gap-3 p-4 rounded-xl bg-surface border border-border hover:border-accent/30 transition-all"
        >
          <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0 group-hover:bg-accent/15 transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-text-primary group-hover:text-accent transition-colors">Got a feature idea or found a bug?</p>
            <p className="text-xs text-text-tertiary mt-0.5 leading-relaxed">
              Your feedback shapes this tool. Suggest features, report issues, or tell us what you&apos;d improve.
            </p>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-tertiary group-hover:text-accent group-hover:translate-x-0.5 transition-all flex-shrink-0 mt-1">
            <polyline points="9,18 15,12 9,6" />
          </svg>
        </a>
      </motion.div>

      {/* Footer */}
      <motion.div
        className="mt-8 sm:mt-10 space-y-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
      >
        <div className="flex items-center justify-center gap-3">
          <Link href="/feedback" className="inline-flex min-h-11 items-center px-3 py-2 text-sm font-bold text-text-tertiary hover:text-text-primary hover:bg-surface-alt active:bg-surface-alt rounded-lg transition-all">
            Feedback
          </Link>
          <span className="text-text-tertiary/30">|</span>
          <Link href="/support" className="inline-flex min-h-11 items-center px-3 py-2 text-sm font-bold text-text-tertiary hover:text-text-primary hover:bg-surface-alt active:bg-surface-alt rounded-lg transition-all">
            Support
          </Link>
          <span className="text-text-tertiary/30">|</span>
          <Link href="/privacy" className="inline-flex min-h-11 items-center px-3 py-2 text-sm font-bold text-text-tertiary hover:text-text-primary hover:bg-surface-alt active:bg-surface-alt rounded-lg transition-all">
            {t.privacy}
          </Link>
        </div>
        <p className="text-center text-sm text-text-tertiary font-medium">
          {t.builtBy}{" "}
          <a
            href="https://x.com/Manny64Official"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center font-bold text-text-primary hover:text-accent transition-colors"
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
