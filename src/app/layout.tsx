import type { Metadata, Viewport } from "next";
import { Sora, JetBrains_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { ServiceWorkerRegistration } from "@/components/ui/ServiceWorkerRegistration";
import { InstallPrompt } from "@/components/ui/InstallPrompt";
import { ConnectivityStatus } from "@/components/ui/ConnectivityStatus";
import { PostHogProvider } from "@/components/providers/PostHogProvider";
import { CookieBanner } from "@/components/providers/CookieBanner";
import { ConsentGate } from "@/components/providers/ConsentGate";
import { JsonLd } from "@/components/seo/JsonLd";
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
    default: "VGC Team Report",
    template: "%s | VGC Team Report",
  },
  description: "The home for competitive Pokemon VGC team reports — now supporting Pokemon Champions and Mega Evolution. Build detailed team breakdowns with notes, matchup plans, and damage calcs — then share them with the community or present at tournaments.",
  metadataBase: new URL("https://pokemonvgcteamreport.com"),
  openGraph: {
    title: "VGC Team Report — Build, Share & Discover Pokemon Teams",
    description: "The home for competitive Pokemon VGC team reports. Build, share, and explore team breakdowns from players around the world.",
    type: "website",
    siteName: "VGC Team Report",
    url: "https://pokemonvgcteamreport.com",
  },
  twitter: {
    card: "summary_large_image",
    title: "VGC Team Report — Build, Share & Discover Pokemon Teams",
    description: "The home for competitive Pokemon VGC team reports. Build, share, and explore team breakdowns from players around the world.",
  },
  icons: {
    icon: [
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
      // Use the app icon as fallback splash — better than blank white
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
      <body className={`${sora.variable} ${jetbrainsMono.variable} antialiased`}>
        <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-accent focus:text-white focus:rounded-lg focus:text-sm focus:font-bold">
          Skip to content
        </a>
        <ClerkProvider>
        <CookieBanner />
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "WebApplication",
            name: "VGC Team Report",
            url: "https://pokemonvgcteamreport.com",
            description:
              "Build detailed competitive Pokemon VGC team breakdowns with notes, matchup plans, and damage calcs — then share them with the community or present at tournaments.",
            applicationCategory: "GameApplication",
            operatingSystem: "Any",
            offers: {
              "@type": "Offer",
              price: "0",
              priceCurrency: "USD",
            },
            browserRequirements: "Requires a modern web browser",
          }}
        />
        <div id="main-content">{children}</div>
        <InstallPrompt />
        <ConnectivityStatus />
        <ServiceWorkerRegistration />
        <ConsentGate>
          <PostHogProvider><Analytics /><SpeedInsights /></PostHogProvider>
        </ConsentGate>
        </ClerkProvider>
      </body>
    </html>
  );
}
