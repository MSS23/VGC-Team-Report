import type { Metadata } from "next";
import { ExploreContent } from "@/components/explore/ExploreContent";
import { JsonLd } from "@/components/seo/JsonLd";

export const metadata: Metadata = {
  title: "Explore VGC Teams",
  alternates: { canonical: "https://pokemonvgcteamreport.com/explore" },
  description:
    "Browse Pokemon VGC team reports shared by competitive players from tournaments around the world. Search by Pokemon, tournament, or creator.",
  openGraph: {
    title: "Explore VGC Teams — VGC Team Report",
    description:
      "Browse Pokemon VGC team reports shared by competitive players from tournaments around the world.",
    type: "website",
    siteName: "VGC Team Report",
    images: [{ url: "/explore/opengraph-image", width: 1200, height: 630, alt: "Explore VGC Teams — Browse competitive Pokemon team reports" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Explore VGC Teams",
    description: "Discover team reports shared by the VGC community.",
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
