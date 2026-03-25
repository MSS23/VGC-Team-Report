import type { Metadata } from "next";
import { ExploreContent } from "@/components/explore/ExploreContent";

export const metadata: Metadata = {
  title: "Explore VGC Teams",
  description:
    "Browse Pokemon VGC team reports shared by competitive players from tournaments around the world. Search by Pokemon, tournament, or creator.",
  openGraph: {
    title: "Explore VGC Teams — VGC Team Report",
    description:
      "Browse Pokemon VGC team reports shared by competitive players from tournaments around the world.",
    type: "website",
    siteName: "VGC Team Report",
  },
  twitter: {
    card: "summary_large_image",
    title: "Explore VGC Teams",
    description: "Discover team reports shared by the VGC community.",
  },
};

export default function ExplorePage() {
  return <ExploreContent />;
}
