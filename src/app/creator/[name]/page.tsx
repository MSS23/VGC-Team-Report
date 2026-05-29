import type { Metadata } from "next";
import { CreatorProfileWrapper } from "@/components/social/CreatorProfile";
import { BreadcrumbJsonLd, JsonLd } from "@/components/seo/JsonLd";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ name: string }>;
}): Promise<Metadata> {
  const { name } = await params;
  const creator = decodeURIComponent(name);
  const title = `${creator}'s VGC Team Reports | VGC Team Report`;
  const description = `View ${creator}'s VGC competitive team reports, open team sheets (OTS), matchup analysis, and tournament results. Browse all public Pokemon VGC 2026 team builds shared by ${creator}.`;
  return {
    title,
    description,
    keywords: [
      `${creator} VGC`,
      `${creator} Pokemon team`,
      `${creator} VGC team report`,
      `${creator} open team sheet`,
      "VGC team reports",
      "Pokemon VGC 2026",
      "competitive Pokemon teams",
      "VGC Team Report",
    ],
    alternates: {
      canonical: `https://pokemonvgcteamreport.com/creator/${encodeURIComponent(creator)}`,
    },
    openGraph: {
      title,
      description,
      type: "profile",
      siteName: "VGC Team Report",
      url: `https://pokemonvgcteamreport.com/creator/${encodeURIComponent(creator)}`,
      images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "VGC Team Report" }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "VGC Team Report" }],
    },
  };
}

export default async function CreatorPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = await params;
  const creator = decodeURIComponent(name);
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: "https://pokemonvgcteamreport.com" },
          { name: "Explore", url: "https://pokemonvgcteamreport.com/explore" },
          {
            name: creator,
            url: `https://pokemonvgcteamreport.com/creator/${encodeURIComponent(creator)}`,
          },
        ]}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ProfilePage",
          name: `${creator}'s VGC Teams`,
          url: `https://pokemonvgcteamreport.com/creator/${encodeURIComponent(creator)}`,
          description: `View all public VGC team reports by ${creator}.`,
          mainEntity: {
            "@type": "Person",
            name: creator,
          },
        }}
      />
      <CreatorProfileWrapper name={creator} />
    </>
  );
}
