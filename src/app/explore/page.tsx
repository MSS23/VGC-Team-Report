import type { Metadata } from "next";
import { ExploreContent } from "@/components/explore/ExploreContent";
import { JsonLd } from "@/components/seo/JsonLd";

export const metadata: Metadata = {
  title: "Explore Best VGC Teams 2026 — Pokemon Champions Team Reports",
  alternates: { canonical: "https://pokemonvgcteamreport.com/explore" },
  description:
    "Browse the best VGC teams for 2026. Find top Pokemon Champions teams, Mega Evolution builds, tournament-winning team reports, and competitive analysis from players worldwide. PokePaste alternative with full team breakdowns.",
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
    title: "Explore Best VGC Teams 2026 — Pokemon Champions Team Reports",
    description:
      "Browse community VGC team reports. Find top Pokemon Champions teams, Mega Evolution builds, and competitive team analysis from players worldwide.",
    type: "website",
    siteName: "VGC Team Report",
    url: "https://pokemonvgcteamreport.com/explore",
    images: [{ url: "/explore/opengraph-image", width: 1200, height: 630, alt: "Explore VGC Teams — Browse competitive Pokemon team reports" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Explore Best VGC Teams 2026 — Pokemon Champions Team Reports",
    description:
      "Browse community VGC team reports. Find top Pokemon Champions teams, Mega Evolution builds, and competitive team analysis from players worldwide.",
    images: [{ url: "/explore/opengraph-image", width: 1200, height: 630, alt: "Explore VGC Teams — Browse competitive Pokemon team reports" }],
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
