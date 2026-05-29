import type { Metadata } from "next";
import { ExploreContent } from "@/components/explore/ExploreContent";
import { BreadcrumbJsonLd, JsonLd } from "@/components/seo/JsonLd";
import { JsonLd, BreadcrumbListJsonLd } from "@/components/seo/JsonLd";

export const metadata: Metadata = {
  title: "Explore VGC Teams | VGC Team Report",
  alternates: { canonical: "https://pokemonvgcteamreport.com/explore" },
  description:
    "Browse community VGC team reports. Find top Pokemon Champions teams, Mega Evolution builds, and competitive team analysis from players worldwide.",
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
    title: "Explore VGC Teams | VGC Team Report",
    description:
      "Browse community VGC team reports. Find top Pokemon Champions teams, Mega Evolution builds, and competitive team analysis from players worldwide.",
    type: "website",
    siteName: "VGC Team Report",
    url: "https://pokemonvgcteamreport.com/explore",
    images: [{ url: "/explore/opengraph-image", width: 1200, height: 630, alt: "Explore VGC Teams — Browse competitive Pokemon team reports" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Explore VGC Teams | VGC Team Report",
    description:
      "Browse community VGC team reports. Find top Pokemon Champions teams, Mega Evolution builds, and competitive team analysis from players worldwide.",
    images: [{ url: "/explore/opengraph-image", width: 1200, height: 630, alt: "Explore VGC Teams — Browse competitive Pokemon team reports" }],
  },
};

export default function ExplorePage() {
  return (
    <>
      <BreadcrumbJsonLd
      <BreadcrumbListJsonLd
        items={[
          { name: "Home", url: "https://pokemonvgcteamreport.com" },
          { name: "Explore", url: "https://pokemonvgcteamreport.com/explore" },
        ]}
      />
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
