import type { Metadata } from "next";
import { ChampionsContent } from "./ChampionsContent";
import { JsonLd, BreadcrumbListJsonLd } from "@/components/seo/JsonLd";
import { getRegMCMegas } from "@/lib/data/mega-pokemon";

// Metadata tracks the CURRENT Champions regulation. It used to be pinned to
// "Regulation M-A", which went stale the moment the format rotated to M-B and
// left the hub page invisible for every "Reg M-B" query (VGC-258).
const HUB_DESCRIPTION =
  `Explore Pokemon Champions team reports for Regulation M-C, M-B and M-A. All ${getRegMCMegas().length} legal Mega Evolutions including the new Z Megas, matchup analysis, SP spreads, and team breakdowns from the competitive community.`;

export const metadata: Metadata = {
  title: "Pokemon Champions Format | Reg M-C Mega Teams & Z Megas",
  description: HUB_DESCRIPTION,
  alternates: { canonical: "https://pokemonvgcteamreport.com/champions" },
  openGraph: {
    title: "Pokemon Champions Format | Reg M-C Mega Teams & Z Megas — VGC Team Report",
    description: HUB_DESCRIPTION,
    type: "website",
    siteName: "VGC Team Report",
    url: "https://pokemonvgcteamreport.com/champions",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pokemon Champions Format | Reg M-C Mega Teams & Z Megas — VGC Team Report",
    description: HUB_DESCRIPTION,
  },
  keywords: [
    "Pokemon Champions",
    "VGC team report",
    "Pokemon Champions team builder",
    "Regulation M-C",
    "Reg M-C Megas",
    "Mega Garchomp Z",
    "Regulation M-B",
    "Regulation M-A",
    "Mega Evolution VGC",
    "Pokemon Champions competitive",
    "VGC 2026",
    "Pokemon Champions VGC",
  ],
};

export default function ChampionsPage() {
  // Reg M-C is a superset of M-B and M-A, so this ItemList covers every Mega
  // legal in any Champions regulation.
  const champMegas = getRegMCMegas();
  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "VGC Champions Format Pokémon — Regulation M-C",
    description: "All Mega Evolution Pokémon legal in the Pokemon Champions Regulation M-C competitive format (VGC 2026). Reg M-C is a superset of Reg M-B and M-A.",
    url: "https://pokemonvgcteamreport.com/champions",
    numberOfItems: champMegas.length,
    itemListElement: champMegas.map((mega, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: mega.displayName,
      url: `https://pokemonvgcteamreport.com/champions/${mega.slug}`,
      description: mega.description,
    })),
  };

  return (
    <>
      <BreadcrumbListJsonLd
        items={[
          { name: "Home", url: "https://pokemonvgcteamreport.com" },
          { name: "Champions", url: "https://pokemonvgcteamreport.com/champions" },
        ]}
      />
      <JsonLd data={itemListSchema} />
      <ChampionsContent />
    </>
  );
}
