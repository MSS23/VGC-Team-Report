import type { Metadata } from "next";
import { ChampionsContent } from "./ChampionsContent";

export const metadata: Metadata = {
  title: "Pokemon Champions VGC Team Builder & Reports",
  description:
    "Build, share, and discover competitive Pokemon Champions VGC team reports. Create detailed Regulation M-A team breakdowns with Mega Evolution support, matchup plans, damage calcs, and speed tiers.",
  alternates: { canonical: "https://pokemonvgcteamreport.com/champions" },
  openGraph: {
    title: "Pokemon Champions VGC Team Builder & Reports",
    description:
      "The #1 tool for creating and sharing Pokemon Champions VGC team reports. Mega Evolution, matchup plans, and damage calcs built in.",
    type: "website",
    siteName: "VGC Team Report",
    url: "https://pokemonvgcteamreport.com/champions",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pokemon Champions VGC Team Builder & Reports",
    description:
      "Build and share competitive Pokemon Champions team reports with Mega Evolution support.",
  },
  keywords: [
    "Pokemon Champions",
    "VGC team report",
    "Pokemon Champions team builder",
    "Regulation M-A",
    "Mega Evolution VGC",
    "Pokemon Champions competitive",
    "VGC 2026",
    "Pokemon Champions VGC",
  ],
};

export default function ChampionsPage() {
  return <ChampionsContent />;
}
