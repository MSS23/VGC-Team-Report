import type { Metadata } from "next";
import { TournamentsContent } from "./TournamentsContent";

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
  },
  twitter: {
    card: "summary_large_image",
    title: "VGC Tournament Results Archive",
    description:
      "Discover team reports from top finishers at VGC Regionals, Internationals, and Worlds.",
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

export default function TournamentsPage() {
  return <TournamentsContent />;
}
