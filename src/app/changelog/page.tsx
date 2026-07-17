import type { Metadata } from "next";
import { ChangelogContent } from "./ChangelogContent";
import { BreadcrumbListJsonLd } from "@/components/seo/JsonLd";
import { ENTRIES } from "./data";

export const metadata: Metadata = {
  title: "Changelog",
  description: "Full version history of VGC Team Report — new features, bug fixes, and improvements.",
  alternates: { canonical: "https://pokemonvgcteamreport.com/changelog" },
  openGraph: {
    title: "VGC Team Report Changelog",
    description: "Full version history of VGC Team Report — new features, bug fixes, and improvements.",
    url: "https://pokemonvgcteamreport.com/changelog",
    type: "website",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "VGC Team Report" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "VGC Team Report Changelog",
    description: "Full version history of VGC Team Report — new features, bug fixes, and improvements.",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "VGC Team Report" }],
  },
};

export default function ChangelogPage() {
  return (
    <>
      <BreadcrumbListJsonLd
        items={[
          { name: "Home", url: "https://pokemonvgcteamreport.com" },
          { name: "Changelog", url: "https://pokemonvgcteamreport.com/changelog" },
        ]}
      />
      <ChangelogContent entries={ENTRIES} />
    </>
  );
}
