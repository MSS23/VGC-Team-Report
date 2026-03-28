import type { Metadata } from "next";
import { QuickAddContent } from "./QuickAddContent";

export const metadata: Metadata = {
  title: "Quick Add",
  description: "Quickly add ideas and tasks to the Linear board from anywhere.",
  robots: "noindex",
};

export default function QuickAddPage() {
  return <QuickAddContent />;
}
