import type { Metadata } from "next";
import { TournamentsContent } from "./TournamentsContent";
import { SportsEventJsonLd, BreadcrumbListJsonLd } from "@/components/seo/JsonLd";

export const metadata: Metadata = {
  title: "VGC Tournament Results Archive | Team Reports 2026",
  description:
    "Find team reports from top finishers at VGC Regionals, Internationals, and World Championships. Browse winning strategies and Pokémon usage from every major competitive event.",
  alternates: { canonical: "https://pokemonvgcteamreport.com/tournaments" },
  openGraph: {
    title: "VGC Tournament Results Archive | Team Reports 2026",
    description:
      "Browse team reports from top VGC tournament finishers. Regionals, Internationals, and World Championships — all in one place.",
    type: "website",
    siteName: "VGC Team Report",
    url: "https://pokemonvgcteamreport.com/tournaments",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "VGC Team Report" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "VGC Tournament Results Archive",
    description:
      "Discover team reports from top finishers at VGC Regionals, Internationals, and Worlds.",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "VGC Team Report" }],
  },
  keywords: [
    "VGC tournament results",
    "VGC Regionals teams",
    "VGC Worlds teams",
    "Pokemon VGC results",
    "competitive Pokemon teams",
    "VGC team reports",
    "VGC top teams 2025",
    "VGC top teams 2026",
  ],
};

const TOURNAMENT_SCHEDULE = [
  {
    name: "VGC Indianapolis Regionals 2026",
    startDate: "2026-05-29",
    location: "Indianapolis, Indiana, USA",
    url: "https://pokemonvgcteamreport.com/tournaments",
    description: "The first Pokemon Champions Regulation M-A Regional Championship, held May 29-31, 2026 in Indianapolis.",
  },
  {
    name: "2026 Pokemon World Championships",
    startDate: "2026-08-28",
    location: "Moscone Center, San Francisco, California, USA",
    url: "https://pokemonvgcteamreport.com/tournaments",
    description: "The 2026 Pokemon World Championships held August 28-30 in San Francisco, the pinnacle of the VGC competitive season.",
  },
];

// This list is hand-maintained, so an event stays here after it happens.
// Derive eventStatus from the date rather than asserting EventScheduled
// forever — the same rule TournamentsContent applies to its own list — so a
// past event degrades to EventCompleted instead of publishing a stale
// "upcoming" claim in structured data.
const TOURNAMENT_EVENTS = TOURNAMENT_SCHEDULE.map((event) => ({
  ...event,
  eventStatus:
    event.startDate > new Date().toISOString().slice(0, 10)
      ? "https://schema.org/EventScheduled"
      : "https://schema.org/EventCompleted",
}));

export default function TournamentsPage() {
  return (
    <>
      <BreadcrumbListJsonLd
        items={[
          { name: "Home", url: "https://pokemonvgcteamreport.com" },
          { name: "Tournaments", url: "https://pokemonvgcteamreport.com/tournaments" },
        ]}
      />
      <SportsEventJsonLd events={TOURNAMENT_EVENTS} />
      <TournamentsContent />
    </>
  );
}
