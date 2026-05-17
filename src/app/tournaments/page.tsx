import type { Metadata } from "next";
import { TournamentsContent } from "./TournamentsContent";
import { SportsEventJsonLd } from "@/components/seo/JsonLd";

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

const UPCOMING_TOURNAMENTS = [
  {
    name: "VGC Indianapolis Regionals 2026",
    startDate: "2026-05-29",
    location: "Indianapolis, Indiana, USA",
    url: "https://pokemonvgcteamreport.com/tournaments",
    description: "The first Pokemon Champions Regulation M-A Regional Championship, held May 29-31, 2026 in Indianapolis.",
  },
  {
    name: "2026 Pokemon World Championships",
    startDate: "2026-08-14",
    location: "San Francisco, California, USA",
    url: "https://pokemonvgcteamreport.com/tournaments",
    description: "The 2026 Pokemon World Championships held August 14-17 in San Francisco, the pinnacle of the VGC competitive season.",
  },
];

export default function TournamentsPage() {
  return (
    <>
      <SportsEventJsonLd events={UPCOMING_TOURNAMENTS} />
      <TournamentsContent />
    </>
  );
}
