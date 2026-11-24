import { Suspense } from "react";
import type { Metadata, Viewport } from "next";
import { Sora, JetBrains_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { DeferredLayoutExtras } from "@/components/ui/DeferredLayoutExtras";
import { PostHogProvider } from "@/components/providers/PostHogProvider";
import { ClarityProvider } from "@/components/providers/ClarityProvider";
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
    default: "VGC Team Report - Build and Share Pokemon VGC Teams",
    template: "%s | VGC Team Report",
  },
  description: "The free VGC team report builder. Build and share Pokemon VGC team reports with notes, matchup plans, damage calcs, and speed tiers. Supports Pokemon Champions 2026, Mega Evolution, and all VGC formats.",
  metadataBase: new URL("https://pokemonvgcteamreport.com"),
  openGraph: {
    title: "VGC Team Report - Build and Share Pokemon VGC Teams",
    description: "Build and share Pokemon VGC team reports with notes, matchup plans, damage calcs, and speed tiers. The home for competitive Pokemon VGC team breakdowns.",
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
    title: "VGC Team Report - Build and Share Pokemon VGC Teams",
    description: "Build and share Pokemon VGC team reports with notes, matchup plans, damage calcs, and speed tiers. The home for competitive Pokemon VGC team breakdowns.",
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
  // No site-wide canonical/robots here: every page without its own inherited
  // canonical=homepage (telling Google it is a duplicate of /), and 404s got
  // "index, follow" alongside Next's automatic "noindex". Indexable is the
  // default; the homepage sets its own canonical in app/page.tsx.
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://play.pokemonshowdown.com" crossOrigin="" />
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var r=document.documentElement,dm=localStorage.getItem("vgc-dark-mode"),isDark=dm==="true"||(dm===null&&matchMedia("(prefers-color-scheme:dark)").matches);if(isDark)r.setAttribute("data-dark-mode","");var t=localStorage.getItem("vgc-gen-theme")||"gen9",p={"gen1":{a:"#8256e6",l:"#c4b5fd",s:"#f5f3ff",ad:"#c4b5fd",sd:"#4c1d95"},"gen2":{a:"#ad5f05",l:"#fcd34d",s:"#fffbeb",ad:"#fcd34d",sd:"#78350f"},"gen3":{a:"#12843c",l:"#86efac",s:"#f0fdf4",ad:"#86efac",sd:"#14532d"},"gen4":{a:"#3370d5",l:"#93c5fd",s:"#eff6ff",ad:"#93c5fd",sd:"#1e3a5f"},"gen5":{a:"#0a7aac",l:"#7dd3fc",s:"#f0f9ff",ad:"#7dd3fc",sd:"#0c4a6e"},"gen6":{a:"#dc2626",l:"#fca5a5",s:"#fef2f2",ad:"#fca5a5",sd:"#7f1d1d"},"gen7":{a:"#c64b0a",l:"#fdba74",s:"#fff7ed",ad:"#fdba74",sd:"#7c2d12"},"gen8":{a:"#077d9a",l:"#67e8f9",s:"#ecfeff",ad:"#67e8f9",sd:"#164e63"},"gen9":{a:"#df1d47",l:"#fda4af",s:"#fff1f2",ad:"#fda4af",sd:"#881337"}}[t]||{a:"#df1d47",l:"#fda4af",s:"#fff1f2",ad:"#fda4af",sd:"#881337"};r.style.setProperty("--accent",isDark?p.ad:p.a);r.style.setProperty("--accent-light",p.l);r.style.setProperty("--accent-surface",isDark?p.sd:p.s)}catch(e){}})()` }} />
      </head>
      <body className={`${sora.variable} ${jetbrainsMono.variable} antialiased`}>
        <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-accent focus:text-accent-foreground focus:rounded-lg focus:text-sm focus:font-bold">
          Skip to content
        </a>
        <ClerkProvider>
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
            applicationCategory: "SportsApplication",
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
          <Suspense fallback={null}>
            <PersistentNavbar />
          </Suspense>
          <div id="main-content">{children}</div>
        </PostHogProvider>
        <ClarityProvider />
        <DeferredLayoutExtras />
        </ClerkProvider>
      </body>
    </html>
  );
}
