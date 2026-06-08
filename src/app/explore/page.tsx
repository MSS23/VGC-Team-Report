import type { Metadata } from "next";
import { ExploreContent } from "@/components/explore/ExploreContent";
import { JsonLd } from "@/components/seo/JsonLd";

export const metadata: Metadata = {
  title: "Best VGC Teams 2026 — Explore Top Team Reports",
  alternates: { canonical: "https://pokemonvgcteamreport.com/explore" },
  description:
    "Discover the best VGC teams for 2026. Browse top team reports, use our VGC team builder, and find Pokemon Champions teams with Mega Evolution builds.",
  keywords: [
    "best VGC teams 2026",
    "best VGC teams",
    "VGC team builder",
    "share VGC team",
    "VGC team reports",
    "top VGC teams",
    "Pokemon Champions team builds",
    "VGC 2026 teams",
    "open team sheet",
    "OTS Pokemon",
    "Pokemon VGC open team sheet",
    "competitive Pokemon teams",
    "Regulation M-A teams",
    "Pokemon VGC team report",
    "VGC team analysis",
  ],
  openGraph: {
    title: "Best VGC Teams 2026 — Explore Top Team Reports",
    description:
      "Discover the best VGC teams for 2026. Browse and share VGC team reports, use our VGC team builder tools, and find top Pokemon Champions teams with competitive analysis.",
    type: "website",
    siteName: "VGC Team Report",
    url: "https://pokemonvgcteamreport.com/explore",
    images: [{ url: "/explore/opengraph-image", width: 1200, height: 630, alt: "Best VGC Teams 2026 — Browse and share competitive Pokemon team reports" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Best VGC Teams 2026 — Explore Top Team Reports",
    description:
      "Discover the best VGC teams for 2026. Browse and share VGC team reports, use our VGC team builder tools, and find top Pokemon Champions teams with competitive analysis.",
    images: [{ url: "/explore/opengraph-image", width: 1200, height: 630, alt: "Best VGC Teams 2026 — Browse and share competitive Pokemon team reports" }],
  },
};

export default function ExplorePage() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "Best VGC Teams 2026",
          url: "https://pokemonvgcteamreport.com/explore",
          description:
            "Discover the best VGC teams for 2026. Browse and share competitive Pokemon team reports from tournaments worldwide.",
          isPartOf: {
            "@type": "WebApplication",
            name: "VGC Team Report",
            url: "https://pokemonvgcteamreport.com",
          },
          breadcrumb: {
            "@type": "BreadcrumbList",
            itemListElement: [
              {
                "@type": "ListItem",
                position: 1,
                name: "Home",
                item: "https://pokemonvgcteamreport.com",
              },
              {
                "@type": "ListItem",
                position: 2,
                name: "Explore Best VGC Teams 2026",
                item: "https://pokemonvgcteamreport.com/explore",
              },
            ],
          },
        }}
      />
      <ExploreContent />
    </>
  );
}
