import type { Metadata } from "next";
import { ExploreContent } from "@/components/explore/ExploreContent";
import { JsonLd } from "@/components/seo/JsonLd";
import { getPopularReports } from "@/lib/explore/get-popular-reports";

// Rebuild the populated ItemList schema every 5 minutes — fresh enough for
// AEO/SEO without hammering the DB on every request.
export const revalidate = 300;

export const metadata: Metadata = {
  title: "Best VGC Teams 2026 — Explore Top Team Reports | VGC Team Report",
  alternates: { canonical: "https://pokemonvgcteamreport.com/explore" },
  description:
    "Discover the best VGC teams for 2026. Browse and share VGC team reports, use our VGC team builder tools, and find top Pokemon Champions teams with Mega Evolution builds and competitive analysis.",
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

export default async function ExplorePage() {
  // Fetch the top 20 popular public reports server-side so we can embed a
  // populated ItemList JSON-LD block. The visual list itself is still
  // rendered + filtered by the existing client component below.
  const popular = await getPopularReports(20);

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Popular VGC Teams",
    itemListOrder: "ItemListOrderDescending",
    numberOfItems: popular.length,
    itemListElement: popular.map((r, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "CreativeWork",
        "@id": `https://pokemonvgcteamreport.com/s/${r.id}`,
        name: r.title,
        ...(r.creatorName
          ? { author: { "@type": "Person", name: r.creatorName } }
          : {}),
        datePublished: r.createdAt,
        dateModified: r.updatedAt,
        interactionStatistic: [
          {
            "@type": "InteractionCounter",
            interactionType: "https://schema.org/LikeAction",
            userInteractionCount: r.likeCount,
          },
          {
            "@type": "InteractionCounter",
            interactionType: "https://schema.org/ViewAction",
            userInteractionCount: r.viewCount,
          },
        ],
      },
    })),
  };

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
      {popular.length > 0 ? <JsonLd data={itemListSchema} /> : null}
      <ExploreContent />
    </>
  );
}
