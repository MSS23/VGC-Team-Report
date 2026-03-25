import type { Metadata } from "next";
import { ChangelogContent } from "./ChangelogContent";

export const metadata: Metadata = {
  title: "Changelog",
  description: "See what's new in VGC Team Report — latest features, improvements, and fixes.",
};

export default function ChangelogPage() {
  return <ChangelogContent />;
}
