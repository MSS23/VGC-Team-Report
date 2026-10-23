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

  const primaryBtn =
    "inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-card bg-accent px-6 text-base font-semibold text-accent-ink transition-[background-color,transform] duration-(--dur-short) ease-out hover:brightness-110 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-55 disabled:active:translate-y-0";

  return (
    <>
      {/* Hero · Counter posture: the action is the visual. Head on five columns, the paste box on seven. */}
      <section className="mx-auto max-w-(--container) px-(--gutter) pt-10 pb-(--section-gap-s) sm:pt-14 lg:min-h-[calc(100dvh-4rem)] lg:pt-0 lg:flex lg:items-center">
        <div className="grid w-full gap-12 lg:grid-cols-12 lg:gap-(--gap-columns)">
          <div className="lg:col-span-5">
            {/* Static sprites on mobile save bandwidth and battery; desktop keeps
                the animated Showdown artwork. */}
            {sprites}

            <h1 className="font-display text-display font-bold tracking-display text-text-primary">
              {t.appTitle} {t.appTitleAccent}
            </h1>
            <p className="lead mt-6 text-text-secondary">
              {t.appSubtitle}
            </p>

            <ul className="mt-8 grid gap-2 text-sm text-text-secondary sm:grid-cols-3 lg:grid-cols-1">
              <li className="border-t border-border pt-2">Free to build</li>
              <li className="border-t border-border pt-2">Saved on this device</li>
              <li className="border-t border-border pt-2">Link-only sharing by default</li>
            </ul>
          </div>

          {/* The paste box: the product doing its one job on the first screen */}
          <div className="lg:col-span-7">
            <label htmlFor="team-paste" className="block text-sm text-text-secondary">
              {t.appInputHint}
            </label>
            <div className="relative mt-2">
              <textarea
                id="team-paste"
                name="paste"
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
                aria-describedby="paste-help"
                className={`block h-72 w-full resize-none rounded-card border bg-surface p-5 font-[family-name:var(--font-mono)] text-sm leading-relaxed text-text-primary outline-2 outline-offset-[-3px] outline-transparent transition-[border-color] duration-(--dur-short) placeholder:text-text-tertiary/50 focus-visible:outline-accent sm:h-80 lg:h-[26rem] ${
 isFocused ? "border-accent" : "border-text-tertiary"
                }`}
                spellCheck={false}
              />
              {isUrl && (
                <span className="absolute right-3 top-3 rounded-md bg-accent px-2 py-1 text-xs font-semibold text-accent-ink">
                  {t.pokePaste}
                </span>
              )}
            </div>

            <p id="paste-help" aria-live="polite" className="mt-2 min-h-[1lh] text-sm text-text-secondary">
              {showPasteHint && (
                <>
                  Paste your full 6-Pok&eacute;mon Showdown export, or a{" "}
                  <span className="font-semibold text-text-primary">pokepast.es</span> URL
                </>
              )}
            </p>

            {(fetchError || validationError) && (
              <p role="alert" className="mt-1 text-sm font-semibold text-danger">
                {fetchError || validationError}
              </p>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-4">
              {isUrl ? (
                <button type="button" onClick={handleFetchPaste} disabled={isFetching} aria-busy={isFetching} className={primaryBtn}>
                  {isFetching ? (
                    <span className="flex items-center gap-2">
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-accent-ink/30 border-t-accent-ink keep-motion" />
                      {t.fetching}
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      {t.fetchAndAnalyze}
                      <kbd className="hidden font-[family-name:var(--font-mono)] text-xs opacity-70 sm:inline">Ctrl+Enter</kbd>
                    </span>
                  )}
                </button>
              ) : (
                <button type="button" onClick={handleAnalyze} disabled={!hasContent} className={primaryBtn}>
                  <span className="flex items-center gap-2">
                    {t.analyzeTeam}
                    <kbd className="hidden font-[family-name:var(--font-mono)] text-xs opacity-70 sm:inline">Ctrl+Enter</kbd>
                  </span>
                </button>
              )}
              <p className="text-sm text-text-secondary">
                Or paste from{" "}
                <a href="https://pokepast.es" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center font-semibold text-text-primary underline decoration-border underline-offset-4 transition-colors duration-(--dur-short) hover:decoration-accent">PokePaste</a>{" "}
                or{" "}
                <a href="https://play.pokemonshowdown.com" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center font-semibold text-text-primary underline decoration-border underline-offset-4 transition-colors duration-(--dur-short) hover:decoration-accent">Showdown</a>
              </p>
            </div>

            <QuickShare paste={paste} />
          </div>
        </div>
      </section>

      {/* Sample teams · Grid of three */}
      {!hasContent && (
        <section className="mx-auto max-w-(--container) px-(--gutter) pb-(--section-gap)" aria-labelledby="samples-heading">
          <h2 id="samples-heading" className="font-display text-section font-bold tracking-display text-text-primary">
            Try a sample team
          </h2>
          {!championsBannerDismissed && (
            <div className="relative mt-6 flex items-start gap-3 border-l-2 border-accent pl-4 pr-12">
                <p className="text-sm text-text-secondary">
                  <a href="/champions" className="font-semibold text-text-primary underline decoration-border underline-offset-4 transition-colors duration-(--dur-short) hover:decoration-accent">
                    Pok&eacute;mon Champions is here.
                  </a>{" "}
                  Build your Mega Evolution team report for the new format.
                </p>
                <button
                  type="button"
                  onClick={dismissChampionsBanner}
                  className="absolute right-0 top-1/2 flex h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-lg text-text-tertiary transition-colors duration-(--dur-short) hover:bg-surface-alt hover:text-text-primary"
                  aria-label="Dismiss"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
            </div>
          )}
          <ul className="mt-8 grid gap-(--gap-columns) sm:mt-12 sm:grid-cols-2 lg:grid-cols-3">
            {CHAMPIONS_SAMPLE_TEAMS.map((team) => (
              <li key={team.id} className="group relative flex h-full flex-col gap-4 rounded-card border border-border bg-surface p-4 transition-[border-color] duration-(--dur-short) hover:border-accent focus-within:border-accent sm:gap-6 sm:p-6">
                  <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-3 sm:gap-2">
                    {team.pokemon.map((species) => (
                      <span key={species} className="flex aspect-square items-center justify-center rounded-lg bg-surface-alt">
                        <PopularCardSprite species={species} />
                      </span>
                    ))}
                  </div>
                  <span className="font-display text-title font-bold tracking-tight text-text-primary transition-colors duration-(--dur-short) group-hover:text-accent">
                    {team.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => { onPasteChange(team.paste); onAnalyze(team.paste); }}
                    className="mt-auto inline-flex min-h-12 cursor-pointer items-center self-start whitespace-nowrap text-sm font-semibold text-text-primary underline decoration-border underline-offset-4 transition-colors duration-(--dur-short) after:absolute after:inset-0 after:content-[''] hover:decoration-accent focus-visible:outline-none"
                    aria-label={`Try ${team.name} sample team`}
                  >
                    Try this team
                  </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* How it works · Steps, a real ordered list */}
      <section className="border-y border-border bg-surface" aria-labelledby="how-heading">
        <div className="mx-auto max-w-(--container) px-(--gutter) py-(--section-gap-s)">
          <div>
            <div className="max-w-3xl">
              <h2 id="how-heading" className="font-display text-section font-bold tracking-display text-text-primary">
                How it works
              </h2>
              <p className="lead mt-5 text-text-secondary">{t.appMission}</p>
              {isReturningUser && !howItWorksOpen ? (
                <button
                  type="button"
                  onClick={() => setHowItWorksOpen(true)}
                  className="mt-4 inline-flex min-h-11 cursor-pointer items-center gap-1.5 text-sm font-semibold text-text-secondary transition-colors duration-(--dur-short) hover:text-text-primary sm:hidden"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="6,9 12,15 18,9" />
                  </svg>
                  Show the steps
                </button>
              ) : null}
            </div>
            <div className={`mt-12 ${isReturningUser && !howItWorksOpen ? "hidden sm:block" : "block"}`}>
              {steps}
            </div>
          </div>
        </div>
      </section>

      {/* Spotlight · Showcase */}
      {spotlight && (
        <section className="mx-auto max-w-(--container) px-(--gutter) pt-(--section-gap)" aria-labelledby="spotlight-heading">
          <h2 id="spotlight-heading" className="font-display text-section font-bold tracking-display text-text-primary">
            Featured team report
          </h2>
          <div className="mt-12">
            <SpotlightCard report={spotlight} />
          </div>
        </section>
      )}

      {/* Latest public reports · Rail */}
      {latestReports.length > 0 && (
        <section className="pt-(--section-gap)" aria-labelledby="latest-heading">
          <div className="mx-auto flex max-w-(--container) flex-wrap items-end justify-between gap-4 px-(--gutter)">
            <h2 id="latest-heading" className="font-display text-section font-bold tracking-display text-text-primary">
              Latest public reports
            </h2>
            <Link href="/explore?sort=newest" className="inline-flex min-h-11 items-center text-sm font-semibold text-text-primary underline decoration-border underline-offset-4 transition-colors duration-(--dur-short) hover:decoration-accent">
              View all
            </Link>
          </div>
          <ul
            className="mt-10 grid snap-x snap-mandatory auto-cols-[minmax(14rem,22%)] grid-flow-col gap-(--gap-columns) overflow-x-auto px-(--gutter) pb-2 scrollbar-none [scroll-padding-inline:var(--gutter)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
            tabIndex={0}
            aria-label="Latest public reports"
          >
            {latestReports.map((report) => (
              <li key={report.id} className="snap-start">
                <Link
                  href={`/s/${report.id}`}
                  className="group block h-full rounded-card border border-border bg-surface p-5 transition-[border-color] duration-(--dur-short) hover:border-accent"
                >
                  <div className="grid grid-cols-3 gap-1.5">
                    {report.species.slice(0, 6).map((s) => (
                      <span key={s} className="flex aspect-square items-center justify-center rounded-md bg-surface-alt">
                        <PopularCardSprite species={s} />
                      </span>
                    ))}
                  </div>
                  {(report.tournamentName || report.placement) && (
                    <p className="mt-4 truncate text-sm font-semibold text-text-primary transition-colors duration-(--dur-short) group-hover:text-accent">
                      {report.placement ? `${report.placement} ` : ""}{report.tournamentName ?? ""}
                    </p>
                  )}
                  {report.creatorName && (
                    <p className="mt-1 truncate text-sm text-text-secondary">
                      by {report.creatorName}
                    </p>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {feedback}

      {loadWhatsNew && <WhatsNewModal />}
    </>
  );
}
