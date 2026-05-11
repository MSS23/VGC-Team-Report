import type { Metadata } from "next";
import { Suspense } from "react";
import { I18nProvider } from "@/lib/i18n";
import { CompareContent } from "@/components/compare/CompareContent";

export const metadata: Metadata = {
  title: "Compare VGC Teams | VGC Team Report",
  description:
    "Compare two VGC team reports side by side — see differences in Pokémon, movesets, items, and EV spreads.",
  alternates: { canonical: "https://pokemonvgcteamreport.com/compare" },
  openGraph: {
    title: "Compare VGC Teams | VGC Team Report",
    description:
      "Compare two VGC team reports side by side — see differences in Pokémon, movesets, items, and EV spreads.",
    type: "website",
    siteName: "VGC Team Report",
    url: "https://pokemonvgcteamreport.com/compare",
  },
};

export default function ComparePage() {
  return (
    <I18nProvider>
      <Suspense>
        <CompareContent />
      </Suspense>
    </I18nProvider>
  );
}
