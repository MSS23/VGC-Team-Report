import type { Metadata } from "next";
import { Suspense } from "react";
import { I18nProvider } from "@/lib/i18n";
import { CompareContent } from "@/components/compare/CompareContent";
import { BreadcrumbListJsonLd } from "@/components/seo/JsonLd";

export const metadata: Metadata = {
  title: "Compare VGC Teams | VGC Team Report",
  description:
    "Compare two VGC team reports side by side — see differences in Pokémon, movesets, items, and EV spreads.",
  robots: { index: false, follow: true },
  openGraph: {
    title: "Compare VGC Teams | VGC Team Report",
    description:
      "Compare two VGC team reports side by side — see differences in Pokémon, movesets, items, and EV spreads.",
    type: "website",
    siteName: "VGC Team Report",
    url: "https://pokemonvgcteamreport.com/compare",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "VGC Team Report" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Compare VGC Teams | VGC Team Report",
    description:
      "Compare two VGC team reports side by side — see differences in Pokémon, movesets, items, and EV spreads.",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "VGC Team Report" }],
  },
};

export default function ComparePage() {
  return (
    <>
      <BreadcrumbListJsonLd
        items={[
          { name: "Home", url: "https://pokemonvgcteamreport.com" },
          { name: "Compare", url: "https://pokemonvgcteamreport.com/compare" },
        ]}
      />
      <I18nProvider>
        <Suspense>
          <CompareContent />
        </Suspense>
      </I18nProvider>
    </>
  );
}
