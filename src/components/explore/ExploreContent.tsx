"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "motion/react";
import { track } from "@vercel/analytics";
import posthog from "posthog-js";
import { I18nProvider, useTranslation } from "@/lib/i18n";
import { useDarkMode } from "@/hooks/useDarkMode";
import { PageNavbar } from "@/components/layout/PageNavbar";
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
  const { darkMode, setDarkMode } = useDarkMode();

  // Random accent color on explore page
  useEffect(() => { applyRandomAccent(); track("explore_visited"); posthog.capture("explore_visited"); }, []);

  const [reports, setReports] = useState<ExploreReport[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const initialLoad = useRef(true);

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
  } = useExploreUrlSync();

  const fetchReports = useCallback(
    async (cursor?: string) => {
      const params = new URLSearchParams();
      if (cursor) params.set("cursor", cursor);
      if (query) params.set("q", query);
      if (sort !== "newest") params.set("sort", sort);
      if (searchCategory !== "all") params.set("searchType", searchCategory);
      if (regulation) params.set("regulation", regulation);
      if (eventType) params.set("eventType", eventType);
      if (archetype) params.set("archetype", archetype);
      if (species) params.set("species", species);
      if (excludeSpecies) params.set("excludeSpecies", excludeSpecies);
      if (placement) params.set("placement", placement);
      if (followingOnly) params.set("following", "1");
      if (tournamentMode) params.set("tournament", "1");

      const res = await fetch(`/api/explore?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json() as Promise<{
        reports: ExploreReport[];
        nextCursor: string | null;
      }>;
    },
    [query, sort, searchCategory, regulation, eventType, archetype, species, excludeSpecies, placement, followingOnly, tournamentMode],
  );

  // Initial + filter/sort change fetch
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const data = await fetchReports();
        if (!cancelled) {
          setReports(data.reports);
          setNextCursor(data.nextCursor);
        }
      } catch {
        if (!cancelled) setReports([]);
      } finally {
        if (!cancelled) {
          setLoading(false);
          initialLoad.current = false;
        }
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [fetchReports]);

  const loadMore = async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const data = await fetchReports(nextCursor);
      setReports((prev) => [...prev, ...data.reports]);
      setNextCursor(data.nextCursor);
    } catch {
      // silently fail
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-text-primary">
      <PageNavbar darkMode={darkMode} onToggleDarkMode={() => setDarkMode(!darkMode)} activePage="explore" />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 pb-24 sm:pb-12">
        <ExploreHero />

        <SpotlightSection />

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
        />

        {/* Results */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-surface rounded-xl border border-border overflow-hidden animate-pulse">
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
        ) : reports.length === 0 ? (
          <ExploreEmpty hasSearch={!!query} />
        ) : (
          <>
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5"
              initial="hidden"
              animate="visible"
              variants={{
                hidden: {},
                visible: { transition: { staggerChildren: 0.05 } },
              }}
            >
              {reports.map((report) => (
                <ReportCard key={report.id} report={report} />
              ))}
            </motion.div>

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
