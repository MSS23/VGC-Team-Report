import type { Metadata } from "next";
import { HomePageServer } from "@/components/home/HomePageServer";

export const metadata: Metadata = {
  alternates: { canonical: "https://pokemonvgcteamreport.com" },
};

export default function Home() {
  return <HomePageServer />;
}
