import type { Metadata } from "next";
import { ChampionsContent } from "./ChampionsContent";

export const metadata: Metadata = {
  title: "Pokemon Champions Format | Mega Evolution Teams — VGC Team Report",
  description:
    "Explore Pokemon Champions (Regulation M-A) team reports. Mega Evolution builds, matchup analysis, and team breakdowns from the competitive community.",
  alternates: { canonical: "https://pokemonvgcteamreport.com/champions" },
  openGraph: {
    title: "Pokemon Champions Format | Mega Evolution Teams — VGC Team Report",
    description:
      "Explore Pokemon Champions (Regulation M-A) team reports. Mega Evolution builds, matchup analysis, and team breakdowns from the competitive community.",
    type: "website",
    siteName: "VGC Team Report",
    url: "https://pokemonvgcteamreport.com/champions",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pokemon Champions Format | Mega Evolution Teams — VGC Team Report",
    description:
      "Explore Pokemon Champions (Regulation M-A) team reports. Mega Evolution builds, matchup analysis, and team breakdowns from the competitive community.",
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
