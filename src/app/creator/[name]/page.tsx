import type { Metadata } from "next";
import { CreatorProfileWrapper } from "@/components/social/CreatorProfile";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ name: string }>;
}): Promise<Metadata> {
  const { name } = await params;
  const creator = decodeURIComponent(name);
  return {
    title: `${creator}'s Teams`,
    description: `View all public VGC team reports by ${creator}.`,
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
  return <CreatorProfileWrapper name={decodeURIComponent(name)} />;
}
