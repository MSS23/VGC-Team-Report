import type { Metadata } from "next";
import { ChampionsContent } from "./ChampionsContent";
import { JsonLd, BreadcrumbListJsonLd, FAQPageJsonLd } from "@/components/seo/JsonLd";
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

  const championsFaqItems = [
    {
      question: "What is Pokemon Champions (Regulation M-A)?",
      answer:
        "Pokemon Champions is the official 2026 competitive VGC platform that replaces Scarlet & Violet. Its first format, Regulation M-A, reintroduces Mega Evolution as the headline mechanic and bans all Legendary and Restricted Pokemon. Players Mega Evolve once per battle from a curated pool of 59 legal Mega forms.",
    },
    {
      question: "Which Megas are legal in Pokemon Champions?",
      answer:
        "Regulation M-A legalises 59 curated Mega Evolutions. Notable exclusions are Mega Salamence, Mega Metagross, and Mega Mawile. Check each Pokemon's Champions page on VGC Team Report for the latest legality status, stats, and competitive sets.",
    },
    {
      question: "When does Regulation M-A start?",
      answer:
        "Regulation M-A goes live with the Pokemon Champions launch on April 8, 2026. It powers Global Challenge 2026 I (May 1-4), Indianapolis Regionals (May 29-31), NA International Championships (June 12-14), and the 2026 World Championships in San Francisco (August 28-30).",
    },
    {
      question: "How do I build a Pokemon Champions team report?",
      answer:
        "Paste a Showdown export or pokepast.es URL into the VGC Team Report homepage. Mega Evolutions are auto-detected and tagged as Reg M-A. Add SP spreads, matchup plans, damage calcs, and one-click share a permanent public link with the community.",
    },
  ];

  return (
    <>
      <BreadcrumbListJsonLd
        items={[
          { name: "Home", url: "https://pokemonvgcteamreport.com" },
          { name: "Champions", url: "https://pokemonvgcteamreport.com/champions" },
        ]}
      />
      <JsonLd data={itemListSchema} />
      <FAQPageJsonLd items={championsFaqItems} />
      <ChampionsContent />
    </>
  );
}
