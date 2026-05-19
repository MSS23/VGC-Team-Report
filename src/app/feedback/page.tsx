import type { Metadata } from "next";
import { FeedbackContent } from "./FeedbackContent";

export const metadata: Metadata = {
  title: "Feedback",
  description: "Request features, report bugs, or suggest improvements for VGC Team Report.",
  alternates: { canonical: "https://pokemonvgcteamreport.com/feedback" },
};

export default function FeedbackPage() {
  return <FeedbackContent />;
}
