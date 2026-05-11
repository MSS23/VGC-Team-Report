import type { Metadata } from "next";
import { ExploreContent } from "@/components/explore/ExploreContent";
import { JsonLd } from "@/components/seo/JsonLd";

export const metadata: Metadata = {
  title: "Browse VGC Team Reports | Top Pokémon VGC Teams",
  alternates: { canonical: "https://pokemonvgcteamreport.com/explore" },
  description:
    "Browse the best VGC team reports from top competitive players. Find Pokemon Champions team builds, open team sheets (OTS), matchup notes, and EV spreads for VGC 2026 Regulation M-A. Search by Pokémon, tournament, or creator.",
  keywords: [
    "VGC team reports",
    "top VGC teams",
    "Pokemon Champions team builds",
    "VGC 2026 teams",
    "open team sheet",
    "OTS Pokemon",
    "Pokemon VGC open team sheet",
    "competitive Pokemon teams",
    "VGC team builder",
    "Regulation M-A teams",
    "Pokemon VGC team report",
    "VGC team analysis",
  ],
  openGraph: {
    title: "Browse VGC Team Reports | Top Pokémon VGC Teams",
    description:
      "Find the best Pokemon Champions team builds, open team sheets (OTS), and competitive VGC reports from top players. Search by Pokémon, tournament, or creator.",
    type: "website",
    siteName: "VGC Team Report",
    url: "https://pokemonvgcteamreport.com/explore",
    images: [{ url: "/explore/opengraph-image", width: 1200, height: 630, alt: "Explore VGC Teams — Browse competitive Pokemon team reports" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Browse VGC Team Reports | Top Pokémon VGC Teams",
    description:
      "Find the best Pokemon Champions team builds, open team sheets (OTS), and competitive VGC reports from top players.",
  },
};

export default function ExplorePage() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "Explore VGC Teams",
          url: "https://pokemonvgcteamreport.com/explore",
          description:
            "Browse Pokemon VGC team reports shared by competitive players from tournaments around the world.",
          isPartOf: {
            "@type": "WebApplication",
            name: "VGC Team Report",
            url: "https://pokemonvgcteamreport.com",
          },
        }}
      />
      <ExploreContent />
    </>
  );
}
