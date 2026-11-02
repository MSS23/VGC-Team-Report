import type { Metadata } from "next";
import { FeedbackContent } from "./FeedbackContent";

export const metadata: Metadata = {
  title: "Feedback",
  description: "Request features, report bugs, or suggest improvements for VGC Team Report.",
  alternates: { canonical: "https://pokemonvgcteamreport.com/feedback" },
  // The whole page sits behind Clerk's `isLoaded` gate, so the server renders
  // no <h1> and ~120 chars of footer — a thin-content signal if indexed
  // (VGC-317). Kept crawlable (`follow`) for the outbound links. This MUST
  // stay in lockstep with sitemap.ts, which deliberately omits /feedback;
  // sitemapping a noindex URL sends contradictory signals (VGC-272).
  robots: { index: false, follow: true },
  openGraph: {
    title: "Feedback | VGC Team Report",
    description: "Request features, report bugs, or suggest improvements for VGC Team Report.",
    url: "https://pokemonvgcteamreport.com/feedback",
    type: "website",
    siteName: "VGC Team Report",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "VGC Team Report" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Feedback | VGC Team Report",
    description: "Request features, report bugs, or suggest improvements for VGC Team Report.",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "VGC Team Report" }],
  },
};

export default function FeedbackPage() {
  return <FeedbackContent />;
}
