"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { MotionDiv } from "@/components/ui/LazyMotion";
import { useAuth } from "@clerk/nextjs";
import { usePostHog } from "@/components/providers/PostHogProvider";
import { useSessionId } from "@/hooks/useSessionId";
import { I18nProvider, useTranslation } from "@/lib/i18n";


import { PageFooter } from "@/components/layout/PageFooter";
import { ExploreHero } from "./ExploreHero";
import { ExploreFilters, type SearchCategory } from "./ExploreFilters";
import { SpotlightSection } from "./SpotlightCard";
import { ReportCard, type ExploreReport } from "./ReportCard";
import { ExploreEmpty } from "./ExploreEmpty";
import { applyRandomAccent } from "@/lib/utils/random-accent";
import { useExploreUrlSync } from "@/hooks/useExploreUrlSync";

export function ExploreContent() {
  return (
    <I18nProvider>
      <ExploreInner />
    </I18nProvider>
  );
}

function ExploreInner() {
  const { t } = useTranslation();
  const posthog = usePostHog();
  useEffect(() => { applyRandomAccent(); posthog?.capture("explore_visited"); }, [posthog]);

  const [reports, setReports] = useState<ExploreReport[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const initialLoad = useRef(true);
  const listVersionRef = useRef(0);

  // Batched per-viewer state for the visible cards (replaces the old
  // per-card GET /api/reactions/{id} and GET /api/user/saved N+1 effects).
  const { isSignedIn } = useAuth();
  const sessionId = useSessionId();
  const [likedIds, setLikedIds] = useState<Set<string> | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string> | null>(null);

  useEffect(() => {
    if (!sessionId || reports.length === 0) return;
    let cancelled = false;
    const ids = reports.map((r) => r.id).join(",");
    fetch(`/api/reactions?ids=${encodeURIComponent(ids)}&sessionId=${encodeURIComponent(sessionId)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data) setLikedIds(new Set<string>(data.liked ?? []));
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [reports, sessionId]);

  useEffect(() => {
    if (!isSignedIn) return;
    let cancelled = false;
    fetch("/api/user/saved?idsOnly=1")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data) setSavedIds(new Set<string>(data.ids ?? []));
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [isSignedIn]);

  const {
    query, setQuery,
    sort, setSort,
    searchCategory, setSearchCategory,
    regulation, setRegulation,
    eventType, setEventType,
    archetype, setArchetype,
    species, setSpecies,
    excludeSpecies, setExcludeSpecies,
    placement, setPlacement,
    followingOnly, setFollowingOnly,
    tournamentMode, setTournamentMode,
    hasRental, setHasRental,
  } = useExploreUrlSync();

  const fetchReports = useCallback(
    async (cursor?: string) => {
      const params = new URLSearchParams();
      if (cursor) params.set("cursor", cursor);
      if (query) params.set("q", query);
      if (sort !== "popular") params.set("sort", sort);
      if (searchCategory !== "all") params.set("searchType", searchCategory);
      if (regulation) params.set("regulation", regulation);
      if (eventType) params.set("eventType", eventType);
      if (archetype) params.set("archetype", archetype);
      if (species) params.set("species", species);
      if (excludeSpecies) params.set("excludeSpecies", excludeSpecies);
      if (placement) params.set("placement", placement);
      if (followingOnly) params.set("following", "1");
      if (tournamentMode) params.set("tournament", "1");
      if (hasRental) params.set("hasRental", "1");

      const res = await fetch(`/api/explore?${params}`, {
        cache: sort === "newest" || sort === "updated" ? "no-store" : "default",
      });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json() as Promise<{
        reports: ExploreReport[];
        nextCursor: string | null;
      }>;
    },
    [query, sort, searchCategory, regulation, eventType, archetype, species, excludeSpecies, placement, followingOnly, tournamentMode, hasRental],
  );

  useEffect(() => {
    let cancelled = false;
    const requestVersion = ++listVersionRef.current;
    const load = async () => {
      setLoading(true);
      setLoadingMore(false);
      setLoadError(false);
      try {
        const data = await fetchReports();
        if (!cancelled && requestVersion === listVersionRef.current) {
          setReports(data.reports);
          setNextCursor(data.nextCursor);
        }
      } catch {
        if (!cancelled && requestVersion === listVersionRef.current) {
          setReports([]);
          setLoadError(true);
        }
      } finally {
        if (!cancelled && requestVersion === listVersionRef.current) {
          setLoading(false);
          initialLoad.current = false;
        }
      }
    };
    load();
    return () => {
      cancelled = true;
      if (requestVersion === listVersionRef.current) listVersionRef.current += 1;
    };
  }, [fetchReports, retryKey]);

  const loadMore = async () => {
    if (!nextCursor || loadingMore) return;
    const requestVersion = listVersionRef.current;
    setLoadingMore(true);
    try {
      const data = await fetchReports(nextCursor);
      if (requestVersion !== listVersionRef.current) return;
      setReports((prev) => {
        const seen = new Set(prev.map((report) => report.id));
        return [...prev, ...data.reports.filter((report) => !seen.has(report.id))];
      });
      setNextCursor(data.nextCursor);
    } catch {
      // silently fail
    } finally {
      if (requestVersion === listVersionRef.current) setLoadingMore(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-text-primary" style={{ scrollPaddingTop: "8rem" }}>
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-3 sm:py-12 pb-24 sm:pb-12">
        <ExploreHero />

        <div className="hidden sm:block">
          <SpotlightSection />
        </div>

        <ExploreFilters
          query={query}
          onQueryChange={setQuery}
          sort={sort}
          onSortChange={setSort}
          searchCategory={searchCategory}
          onSearchCategoryChange={setSearchCategory}
          regulation={regulation}
          onRegulationChange={setRegulation}
          eventType={eventType}
          onEventTypeChange={setEventType}
          archetype={archetype}
          onArchetypeChange={setArchetype}
          species={species}
          onSpeciesChange={setSpecies}
          excludeSpecies={excludeSpecies}
          onExcludeSpeciesChange={setExcludeSpecies}
          placement={placement}
          onPlacementChange={setPlacement}
          followingOnly={followingOnly}
          onFollowingOnlyChange={setFollowingOnly}
          tournamentMode={tournamentMode}
          onTournamentModeChange={setTournamentMode}
          hasRental={hasRental}
          onHasRentalChange={setHasRental}
        />

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-surface rounded-xl border border-border overflow-hidden animate-pulse min-h-[260px]">
                <div className="px-4 pt-4 pb-2 flex justify-center gap-1">
                  {Array.from({ length: 6 }).map((_, j) => (
                    <div key={j} className="w-10 h-10 rounded-full bg-surface-alt" />
                  ))}
                </div>
                <div className="px-4 pb-4 space-y-2">
                  <div className="h-4 bg-surface-alt rounded w-3/4" />
                  <div className="h-3 bg-surface-alt rounded w-1/2" />
                  <div className="h-3 bg-surface-alt rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : loadError ? (
          <div className="flex flex-col items-center gap-4 py-16 text-center animate-fade-in">
            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-400" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-text-primary">Couldn&apos;t load reports</p>
              <p className="text-sm text-text-secondary mt-1">Check your connection and try again.</p>
            </div>
            <button
              onClick={() => setRetryKey((k) => k + 1)}
              className="min-h-[44px] px-6 py-2.5 bg-accent text-white rounded-xl font-semibold text-sm hover:brightness-110 active:scale-[0.97] transition-all cursor-pointer"
            >
              Retry
            </button>
          </div>
        ) : reports.length === 0 ? (
          <ExploreEmpty
            hasSearch={!!query}
            hasActiveFilters={!!(query || regulation || eventType || archetype || species || excludeSpecies || placement || followingOnly || tournamentMode || hasRental)}
            onSearch={setQuery}
            onClearFilters={() => {
              setQuery("");
              setRegulation("");
              setEventType("");
              setArchetype("");
              setSpecies("");
              setExcludeSpecies("");
              setPlacement("");
              setFollowingOnly(false);
              setTournamentMode(false);
              setHasRental(false);
            }}
          />
        ) : (
          <>
            <MotionDiv
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5"
              initial="hidden"
              animate="visible"
              variants={{
                hidden: {},
                visible: { transition: { staggerChildren: 0.05 } },
              }}
            >
              {reports.map((report) => (
                <ReportCard
                  key={report.id}
                  report={report}
                  initialLiked={likedIds ? likedIds.has(report.id) : undefined}
                  initialSaved={savedIds ? savedIds.has(report.id) : undefined}
                />
              ))}
            </MotionDiv>

            {nextCursor && (
              <div className="flex justify-center mt-10">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="px-6 py-2.5 rounded-lg text-sm font-bold bg-surface border-2 border-border text-text-primary hover:border-accent/40 hover:bg-accent-surface active:scale-[0.97] transition-all disabled:opacity-40 disabled:cursor-not-allowed tracking-wide"
                >
                  {loadingMore ? t.loading : t.loadMore}
                </button>
              </div>
            )}
          </>
        )}
      </main>

      <PageFooter />
    </div>
  );
}
