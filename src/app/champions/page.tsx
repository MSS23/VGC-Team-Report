import type { Metadata } from "next";
import { ChampionsContent } from "./ChampionsContent";
import { JsonLd } from "@/components/seo/JsonLd";
import { getRegMAMegas } from "@/lib/data/mega-pokemon";

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
  const regMAMegas = getRegMAMegas();
  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "VGC Champions Format Pokémon — Regulation M-A",
    description: "All Mega Evolution Pokémon legal in the Pokemon Champions Regulation M-A competitive format (VGC 2026).",
    url: "https://pokemonvgcteamreport.com/champions",
    numberOfItems: regMAMegas.length,
    itemListElement: regMAMegas.map((mega, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: mega.displayName,
      url: `https://pokemonvgcteamreport.com/champions/${mega.slug}`,
      description: mega.description,
    })),
  };

  return (
    <>
      <JsonLd data={itemListSchema} />
      <ChampionsContent />
    </>
  );
}
