import type { Metadata } from "next";
import { ChangelogContent } from "./ChangelogContent";
import { ENTRIES } from "./data";

export const metadata: Metadata = {
  title: "Changelog — VGC Team Report",
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
  return <ChangelogContent entries={ENTRIES} />;
}
