import type { Metadata } from "next";
import { TournamentsContent } from "./TournamentsContent";
import { SportsEventJsonLd, BreadcrumbListJsonLd, type SportsEventData } from "@/components/seo/JsonLd";

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

// Dates/venues here are published as SportsEvent structured data — only add an
// entry once the date and venue are confirmed by an official Play! Pokemon source.
// Worlds 2026 verified 2026-08-03 against pokemon.com (PokemonXP + Worlds schedule
// announcement): August 28-30 2026, Moscone Center, San Francisco, finals at Chase Center.
const UPCOMING_TOURNAMENTS: SportsEventData[] = [
  {
    name: "VGC Indianapolis Regionals 2026",
    startDate: "2026-05-29",
    endDate: "2026-05-31",
    location: "Indianapolis, Indiana, USA",
    url: "https://pokemonvgcteamreport.com/tournaments",
    description: "The first Pokemon Champions Regulation M-A Regional Championship, held May 29-31, 2026 in Indianapolis.",
  },
  {
    name: "2026 Pokemon World Championships",
    startDate: "2026-08-28",
    endDate: "2026-08-30",
    location: "Moscone Center, San Francisco, California, USA",
    url: "https://pokemonvgcteamreport.com/tournaments",
    description: "The 2026 Pokemon World Championships, held August 28-30 at the Moscone Center in San Francisco with Championship Sunday finals at the Chase Center. The pinnacle of the VGC competitive season, played in Pokemon Champions Regulation M-B.",
  },
];

export default function TournamentsPage() {
  return (
    <>
      <BreadcrumbListJsonLd
        items={[
          { name: "Home", url: "https://pokemonvgcteamreport.com" },
          { name: "Tournaments", url: "https://pokemonvgcteamreport.com/tournaments" },
        ]}
      />
      <SportsEventJsonLd events={UPCOMING_TOURNAMENTS} />
      <TournamentsContent />
    </>
  );
}
