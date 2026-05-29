import type { Metadata } from "next";
import { FeedbackContent } from "./FeedbackContent";

export const metadata: Metadata = {
  title: "Feedback | VGC Team Report",
  description: "Request features, report bugs, or suggest improvements for VGC Team Report.",
  alternates: { canonical: "https://pokemonvgcteamreport.com/feedback" },
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
