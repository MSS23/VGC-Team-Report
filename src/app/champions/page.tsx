import type { Metadata } from "next";
import { ChampionsContent } from "./ChampionsContent";
import { JsonLd, BreadcrumbListJsonLd } from "@/components/seo/JsonLd";
import { getRegMBMegas } from "@/lib/data/mega-pokemon";

// Metadata tracks the CURRENT Champions regulation. It used to be pinned to
// "Regulation M-A", which went stale the moment the format rotated to M-B and
// left the hub page invisible for every "Reg M-B" query (VGC-258).
const HUB_DESCRIPTION =
  "Explore Pokemon Champions team reports for Regulation M-B and M-A. All 75 legal Mega Evolutions, matchup analysis, SP spreads, and team breakdowns from the competitive community.";

export const metadata: Metadata = {
  title: "Pokemon Champions Format | Reg M-B & M-A Mega Teams",
  description: HUB_DESCRIPTION,
  alternates: { canonical: "https://pokemonvgcteamreport.com/champions" },
  openGraph: {
    title: "Pokemon Champions Format | Reg M-B & M-A Mega Teams — VGC Team Report",
    description: HUB_DESCRIPTION,
    type: "website",
    siteName: "VGC Team Report",
    url: "https://pokemonvgcteamreport.com/champions",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pokemon Champions Format | Reg M-B & M-A Mega Teams — VGC Team Report",
    description: HUB_DESCRIPTION,
  },
  keywords: [
    "Pokemon Champions",
    "VGC team report",
    "Pokemon Champions team builder",
    "Regulation M-B",
    "Regulation M-A",
    "Reg M-B Megas",
    "Mega Evolution VGC",
    "Pokemon Champions competitive",
    "VGC 2026",
    "Pokemon Champions VGC",
  ],
};

export default function ChampionsPage() {
  // Reg M-B is a superset of M-A, so this ItemList covers every Mega legal in
  // either Champions regulation (75), not just the 59 that were M-A legal.
  const champMegas = getRegMBMegas();
  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "VGC Champions Format Pokémon — Regulation M-B",
    description: "All Mega Evolution Pokémon legal in the Pokemon Champions Regulation M-B competitive format (VGC 2026). Reg M-B is a superset of Reg M-A.",
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
