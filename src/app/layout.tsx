import type { Metadata, Viewport } from "next";
import { Sora, JetBrains_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { ServiceWorkerRegistration } from "@/components/ui/ServiceWorkerRegistration";
import { ChunkErrorReloader } from "@/components/ui/ChunkErrorReloader";
import { InstallPrompt } from "@/components/ui/InstallPrompt";
import { ConnectivityStatus } from "@/components/ui/ConnectivityStatus";
import { PostHogProvider } from "@/components/providers/PostHogProvider";
import { ClarityProvider } from "@/components/providers/ClarityProvider";
import { CookieBanner } from "@/components/providers/CookieBanner";
import { ConsentGate } from "@/components/providers/ConsentGate";
import { JsonLd, OrganizationJsonLd, WebSiteSchema } from "@/components/seo/JsonLd";
import { PersistentNavbar } from "@/components/layout/PersistentNavbar";
import "./globals.css";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FAF9F6" },
    { media: "(prefers-color-scheme: dark)", color: "#0B0B1A" },
  ],
};

export const metadata: Metadata = {
  title: {
    default: "VGC Team Report — Build & Share Pokémon VGC Teams | Pokemon Champions 2026",
    template: "%s | VGC Team Report",
  },
  description: "The free VGC team report builder — share your VGC team with notes, matchup plans, and damage calcs. Supports Pokémon Champions, Mega Evolution, and all VGC team builder formats.",
  metadataBase: new URL("https://pokemonvgcteamreport.com"),
  openGraph: {
    title: "VGC Team Report — Build, Share & Discover Pokemon Teams",
    description: "The home for competitive Pokemon VGC team reports. Build, share, and explore team breakdowns from players around the world.",
    type: "website",
    siteName: "VGC Team Report",
    url: "https://pokemonvgcteamreport.com",
    images: [
      { url: "https://pokemonvgcteamreport.com/opengraph-image", width: 1200, height: 630, alt: "VGC Team Report" },
      { url: "https://pokemonvgcteamreport.com/og-default.png", width: 1200, height: 630, alt: "VGC Team Report" },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "VGC Team Report — Build, Share & Discover Pokemon Teams",
    description: "The home for competitive Pokemon VGC team reports. Build, share, and explore team breakdowns from players around the world.",
    images: [
      { url: "https://pokemonvgcteamreport.com/opengraph-image", width: 1200, height: 630, alt: "VGC Team Report" },
      { url: "https://pokemonvgcteamreport.com/og-default.png", width: 1200, height: 630, alt: "VGC Team Report" },
    ],
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48" },
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: { url: "/apple-touch-icon.png", sizes: "180x180" },
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "VGC Report",
    startupImage: [
      { url: "/icon-512.png" },
    ],
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
  alternates: {
    canonical: "https://pokemonvgcteamreport.com",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var r=document.documentElement,dm=localStorage.getItem("vgc-dark-mode"),isDark=dm==="true"||(dm===null&&matchMedia("(prefers-color-scheme:dark)").matches);if(isDark)r.setAttribute("data-dark-mode","");var t=localStorage.getItem("vgc-gen-theme")||"gen9",p={"gen1":{a:"#8b5cf6",l:"#c4b5fd",s:"#f5f3ff",ad:"#c4b5fd",sd:"#4c1d95"},"gen2":{a:"#d97706",l:"#fcd34d",s:"#fffbeb",ad:"#fcd34d",sd:"#78350f"},"gen3":{a:"#16a34a",l:"#86efac",s:"#f0fdf4",ad:"#86efac",sd:"#14532d"},"gen4":{a:"#3b82f6",l:"#93c5fd",s:"#eff6ff",ad:"#93c5fd",sd:"#1e3a5f"},"gen5":{a:"#0ea5e9",l:"#7dd3fc",s:"#f0f9ff",ad:"#7dd3fc",sd:"#0c4a6e"},"gen6":{a:"#dc2626",l:"#fca5a5",s:"#fef2f2",ad:"#fca5a5",sd:"#7f1d1d"},"gen7":{a:"#ea580c",l:"#fdba74",s:"#fff7ed",ad:"#fdba74",sd:"#7c2d12"},"gen8":{a:"#0891b2",l:"#67e8f9",s:"#ecfeff",ad:"#67e8f9",sd:"#164e63"},"gen9":{a:"#e11d48",l:"#fda4af",s:"#fff1f2",ad:"#fda4af",sd:"#881337"}}[t]||{a:"#e11d48",l:"#fda4af",s:"#fff1f2",ad:"#fda4af",sd:"#881337"};r.style.setProperty("--accent",isDark?p.ad:p.a);r.style.setProperty("--accent-light",p.l);r.style.setProperty("--accent-surface",isDark?p.sd:p.s)}catch(e){}})()` }} />
      </head>
      <body className={`${sora.variable} ${jetbrainsMono.variable} antialiased`}>
        <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-accent focus:text-white focus:rounded-lg focus:text-sm focus:font-bold">
          Skip to content
        </a>
        <ClerkProvider>
        <CookieBanner />
        <OrganizationJsonLd />
        <WebSiteSchema />
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": ["WebApplication", "SoftwareApplication"],
            name: "VGC Team Report",
            url: "https://pokemonvgcteamreport.com",
            description:
              "Build detailed competitive Pokemon VGC team breakdowns with notes, matchup plans, and damage calcs — then share them with the community or present at tournaments.",
            applicationCategory: "GameApplication",
            operatingSystem: "Any",
            featureList: [
              "PokePaste Import",
              "VGC Speed Tiers",
              "SP Spread Builder",
              "Matchup Plans",
              "Team Sharing",
              "Champions Format Support",
            ],
            offers: {
              "@type": "Offer",
              price: "0",
              priceCurrency: "USD",
            },
            browserRequirements: "Requires a modern web browser",
          }}
        />
        <PostHogProvider>
          <PersistentNavbar />
          <div id="main-content">{children}</div>
        </PostHogProvider>
        <ClarityProvider />
        <InstallPrompt />
        <ConnectivityStatus />
        <ServiceWorkerRegistration />
        <ChunkErrorReloader />
        </ClerkProvider>
      </body>
    </html>
  );
}
