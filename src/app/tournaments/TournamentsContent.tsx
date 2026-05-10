"use client";

import Link from "next/link";
import { useEffect } from "react";
import { track } from "@vercel/analytics";
import { PageFooter } from "@/components/layout/PageFooter";
import { JsonLd } from "@/components/seo/JsonLd";
import { applyRandomAccent } from "@/lib/utils/random-accent";

interface Tournament {
  id: string;
  name: string;
  date: string;
  location: string;
  format: string;
  reportCount: number;
  topPokemon: string[];
  eventType: "Worlds" | "International" | "Regional" | "Online";
}

const TOURNAMENTS: Tournament[] = [
  {
    id: "worlds-2025",
    name: "2025 Pokémon World Championships",
    date: "2025-08-15",
    location: "Washington D.C., USA",
    format: "Regulation G",
    reportCount: 8,
    topPokemon: ["Calyrex-Ice", "Incineroar", "Flutter Mane", "Raging Bolt"],
    eventType: "Worlds",
  },
  {
    id: "naic-2025",
    name: "2025 North America International Championships",
    date: "2025-06-20",
    location: "Columbus, Ohio, USA",
    format: "Regulation G",
    reportCount: 6,
    topPokemon: ["Miraidon", "Raging Bolt", "Incineroar", "Urshifu-Rapid"],
    eventType: "International",
  },
  {
    id: "euic-2025",
    name: "2025 Europe International Championships",
    date: "2025-04-11",
    location: "London, England",
    format: "Regulation G",
    reportCount: 5,
    topPokemon: ["Calyrex-Ice", "Incineroar", "Tornadus", "Flutter Mane"],
    eventType: "International",
  },
  {
    id: "san-diego-regionals-2025",
    name: "San Diego Regional Championships 2025",
    date: "2025-02-15",
    location: "San Diego, California, USA",
    format: "Regulation G",
    reportCount: 4,
    topPokemon: ["Miraidon", "Raging Bolt", "Iron Hands", "Incineroar"],
    eventType: "Regional",
  },
  {
    id: "charlotte-regionals-2025",
    name: "Charlotte Regional Championships 2025",
    date: "2025-01-18",
    location: "Charlotte, North Carolina, USA",
    format: "Regulation G",
    reportCount: 3,
    topPokemon: ["Calyrex-Ice", "Incineroar", "Flutter Mane", "Urshifu-Single"],
    eventType: "Regional",
  },
  {
    id: "global-challenge-2026",
    name: "Global Challenge 2026 I",
    date: "2026-05-01",
    location: "Online",
    format: "Regulation M-A",
    reportCount: 2,
    topPokemon: ["Charizard-Mega", "Incineroar", "Rillaboom", "Tornadus"],
    eventType: "Online",
  },
];

const EVENT_TYPE_STYLES: Record<Tournament["eventType"], string> = {
  Worlds: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20",
  International: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20",
  Regional: "bg-accent/10 text-accent border border-accent/20",
  Online: "bg-surface-alt text-text-tertiary border border-border",
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function TournamentCard({ tournament }: { tournament: Tournament }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5 flex flex-col gap-4 hover:border-accent/30 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-extrabold text-text-primary leading-snug">
            {tournament.name}
          </h2>
          <p className="text-xs text-text-tertiary mt-1">{formatDate(tournament.date)}</p>
        </div>
        <span
          className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0 ${EVENT_TYPE_STYLES[tournament.eventType]}`}
        >
          {tournament.eventType}
        </span>
      </div>

      {/* Meta */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2 text-xs text-text-secondary">
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="flex-shrink-0 text-text-tertiary"
            aria-hidden="true"
          >
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <span>{tournament.location}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-text-secondary">
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="flex-shrink-0 text-text-tertiary"
            aria-hidden="true"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <span>{tournament.format}</span>
        </div>
      </div>

      {/* Top Pokémon badges */}
      <div>
        <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider mb-2">
          Top Pokémon
        </p>
        <div className="flex flex-wrap gap-1.5">
          {tournament.topPokemon.map((mon) => (
            <span
              key={mon}
              className="text-[11px] font-semibold text-text-secondary bg-surface-alt border border-border px-2 py-0.5 rounded-full"
            >
              {mon}
            </span>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-auto pt-2 border-t border-border/50">
        <span className="text-xs text-text-tertiary">
          <span className="font-bold text-text-primary">{tournament.reportCount}</span>{" "}
          {tournament.reportCount === 1 ? "report" : "reports"}
        </span>
        <Link
          href={`/explore?tournament=${tournament.id}`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-accent bg-accent-surface rounded-lg hover:brightness-105 transition-all"
          aria-label={`View top teams from ${tournament.name}`}
        >
          View top teams
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </Link>
      </div>
    </div>
  );
}

export function TournamentsContent() {
  useEffect(() => {
    applyRandomAccent();
    track("tournaments_page_visited");
  }, []);

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "VGC Tournament Results Archive",
          url: "https://pokemonvgcteamreport.com/tournaments",
          description:
            "Browse team reports from top finishers at VGC Regionals, Internationals, and World Championships. Find the best teams from every major competitive Pokémon event.",
          isPartOf: {
            "@type": "WebApplication",
            name: "VGC Team Report",
            url: "https://pokemonvgcteamreport.com",
          },
        }}
      />

      <main className="min-h-screen bg-background pb-24 sm:pb-0">
        {/* Hero */}
        <section className="relative overflow-hidden py-16 sm:py-20 px-4">
          <div className="absolute inset-0 bg-gradient-to-b from-accent/5 via-transparent to-transparent" />
          <div className="relative max-w-5xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-accent-surface rounded-full mb-6">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-accent"
                aria-hidden="true"
              >
                <polyline points="22 8 12 2 2 8" />
                <polyline points="2 8 12 14 22 8" />
                <polyline points="2 14 12 20 22 14" />
                <polyline points="2 20 12 26 22 20" />
              </svg>
              <span className="text-xs font-extrabold text-accent uppercase tracking-widest">
                Tournament Archive
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight leading-tight mb-4">
              VGC Tournament Results
            </h1>
            <p className="text-sm sm:text-base text-text-secondary max-w-2xl leading-relaxed">
              Browse team reports from top finishers at VGC Regionals, Internationals, and World
              Championships. Discover the strongest teams, trending Pokémon, and winning strategies
              from every major competitive event.
            </p>
          </div>
        </section>

        {/* Tournament grid */}
        <section className="max-w-5xl mx-auto px-4 py-8">
          {TOURNAMENTS.length === 0 ? (
            <div className="text-center py-20 text-text-secondary">
              <p className="text-sm">
                No tournament reports yet. Check back after the next Regional event.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              {TOURNAMENTS.map((tournament) => (
                <TournamentCard key={tournament.id} tournament={tournament} />
              ))}
            </div>
          )}
        </section>

        {/* CTA */}
        <section className="max-w-5xl mx-auto px-4 py-12 text-center">
          <p className="text-sm text-text-secondary mb-4">
            Just finished a tournament? Share your team report with the community.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-white text-sm font-bold rounded-xl hover:brightness-110 shadow-lg shadow-accent/30 transition-all"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Build a Team Report
          </Link>
        </section>
      </main>

      <PageFooter />
    </>
  );
}
