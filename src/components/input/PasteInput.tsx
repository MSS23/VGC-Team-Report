"use client";

import { useState, useEffect, type ReactNode } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { isPokePasteUrl, fetchPokePaste } from "@/lib/utils/pokepaste";
import { useTranslation } from "@/lib/i18n";

import { SpotlightCard } from "@/components/explore/SpotlightCard";
import type { ExploreReport } from "@/components/explore/ReportCard";
import { applyRandomAccent } from "@/lib/utils/random-accent";
import { getSpriteUrls } from "@/lib/utils/sprite-slug";
import { CHAMPIONS_SAMPLE_TEAMS } from "@/data/champions-sample-teams";
import { QuickShare } from "./QuickShare";

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
  sprites: ReactNode;
  steps: ReactNode;
  feedback: ReactNode;
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

export function PasteInput({ sprites, steps, feedback, paste, onPasteChange, onAnalyze, selectedTemplate, onTemplateSelect }: PasteInputProps) {
  const { t } = useTranslation();
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [loadWhatsNew, setLoadWhatsNew] = useState(false);
  useEffect(() => {
    try {
      const eligible = !!localStorage.getItem("vgc-has-visited") && !localStorage.getItem("vgc-whats-new-v10");
      if (eligible) setLoadWhatsNew(true);
      else localStorage.setItem("vgc-has-visited", "1");
    } catch { /* Storage can be blocked in private browsing. */ }
  }, []);
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
      {sprites}

      {/* Title — bold, distinctive */}
      <div
        className="text-center mb-3 sm:mb-6"



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
      </div>

      {/* Champions announcement banner */}
      {!championsBannerDismissed && (
        <a
          href="/champions"
          className="group flex items-center gap-3 mb-4 sm:mb-6 px-4 py-3 rounded-xl bg-gradient-to-r from-accent/10 via-accent/5 to-transparent border border-accent/20 hover:border-accent/40 transition-all relative"



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
        </a>
      )}

      {/* How it works — collapsible for returning mobile users */}
      <div
        className="mb-4 sm:mb-8"



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
          {steps}
        </div>
      </div>

      {/* Textarea with accent glow */}
      <p
        className="text-xs text-text-tertiary font-medium mb-2 px-1"



      >
        {t.appInputHint}
      </p>
      <div
        className="relative"



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
          <span


            className="absolute top-3 right-3 px-2.5 py-1 bg-accent text-white text-[10px] font-extrabold rounded-md uppercase tracking-widest shadow-sm"
          >
            {t.pokePaste}
          </span>
        )}
      </div>

      {/* Contextual paste hint for new users */}
      {showPasteHint && (
        <p

          aria-live="polite"
          className="text-xs text-text-secondary mt-2 px-1"
        >
          Paste your full 6-Pok&eacute;mon Showdown export, or a{" "}
          <span className="font-semibold text-text-primary">pokepast.es</span> URL
        </p>
      )}

      {/* Error */}
      {(fetchError || validationError) && (
        <p


          role="alert"
          className="text-sm text-danger font-semibold mt-3 px-1"
        >
          {fetchError || validationError}
        </p>
      )}

      {/* Actions */}
      <div
        className="flex flex-col gap-3 mt-5"



      >
        {isUrl ? (
          <button
            onClick={handleFetchPaste}
            disabled={isFetching}

            className="min-h-11 active:brightness-90 px-6 py-2.5 bg-accent text-white rounded-xl text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:brightness-110 shadow-md shadow-accent/30 cursor-pointer tracking-wide"
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
          </button>
        ) : (
          <button
            onClick={handleAnalyze}
            disabled={!hasContent}

            className={`min-h-11 active:brightness-90 px-6 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer tracking-wide ${
              hasContent
                ? "bg-accent text-white hover:brightness-110 shadow-md shadow-accent/30"
                : "bg-surface-alt text-text-tertiary border-2 border-border cursor-not-allowed"
            }`}
          >
            <span className="flex items-center gap-2">
              {t.analyzeTeam}
              <kbd className="text-[10px] opacity-60 hidden sm:inline font-[family-name:var(--font-mono)]">Ctrl+Enter</kbd>
            </span>
          </button>
        )}

        <QuickShare paste={paste} />

        {/* Archetype sample team picker — 3 cards, horizontally scrollable on mobile */}
        <p className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center text-xs text-text-tertiary">
          <span>Free to build</span>
          <span aria-hidden="true">&bull;</span>
          <span>Saved on this device</span>
          <span aria-hidden="true">&bull;</span>
          <span>Link-only sharing by default</span>
        </p>

        {!hasContent && (
          <div className="flex flex-col gap-2">
            <p className="text-xs font-bold text-text-tertiary uppercase tracking-widest px-0.5">
              Try a sample team:
            </p>
            <div className="flex gap-2 overflow-x-auto pb-1 snap-x snap-mandatory scrollbar-none -mx-1 px-1">
              {CHAMPIONS_SAMPLE_TEAMS.map((team) => (
                <button
                  key={team.id}
                  type="button"

                  onClick={() => { onPasteChange(team.paste); onAnalyze(team.paste); }}
                  className="active:brightness-90 flex-shrink-0 snap-start flex flex-col items-center justify-center gap-1.5 min-w-[140px] min-h-[88px] px-3 py-3 rounded-xl border border-accent/30 bg-accent/[0.08] hover:bg-accent/15 hover:border-accent/50 transition-all cursor-pointer text-center"
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
                </button>
              ))}
            </div>
            <p className="text-xs text-text-tertiary text-center leading-relaxed">
              Or paste from{" "}
              <a href="https://pokepast.es" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center text-accent hover:underline font-semibold">PokePaste</a>{" "}
              /{" "}
              <a href="https://play.pokemonshowdown.com" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center text-accent hover:underline font-semibold">Showdown</a>
            </p>
          </div>
        )}
      </div>


      {/* Spotlight report */}
      {spotlight && (
        <div
          className="mt-6 sm:mt-8"



        >
          <div className="flex items-center gap-2 mb-3">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-accent">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            <span className="text-[10px] font-extrabold text-text-tertiary uppercase tracking-widest">Featured Team Report</span>
          </div>
          <SpotlightCard report={spotlight} />
        </div>
      )}

      {/* Popular reports rail */}
      {latestReports.length > 0 && (
        <div
          className="mt-6 sm:mt-8"



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
        </div>
      )}

      {feedback}

      {/* Footer */}
      <div
        className="mt-8 sm:mt-10 space-y-3"



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
      </div>

      {loadWhatsNew && <WhatsNewModal />}
      </div>
    </>
  );
}
