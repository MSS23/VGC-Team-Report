import type { Metadata } from "next";
import { CreatorProfileWrapper } from "@/components/social/CreatorProfile";
import { JsonLd } from "@/components/seo/JsonLd";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ name: string }>;
}): Promise<Metadata> {
  const { name } = await params;
  const creator = decodeURIComponent(name);
  return {
    title: `${creator}'s VGC Team Reports | Pokemon VGC 2026`,
    description: `View all public VGC team reports by ${creator}.`,
    alternates: {
      canonical: `https://pokemonvgcteamreport.com/creator/${encodeURIComponent(creator)}`,
    },
    openGraph: {
      title: `${creator}'s Teams - VGC Team Report`,
      description: `View all public VGC team reports by ${creator}.`,
      type: "profile",
      siteName: "VGC Team Report",
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
