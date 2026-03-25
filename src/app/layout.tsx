import type { Metadata } from "next";
import { Sora, JetBrains_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { ServiceWorkerRegistration } from "@/components/ui/ServiceWorkerRegistration";
import { InstallPrompt } from "@/components/ui/InstallPrompt";
import "./globals.css";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "VGC Team Report",
    template: "%s | VGC Team Report",
  },
  description: "The home for competitive Pokemon VGC team reports. Build detailed team breakdowns with notes, matchup plans, and damage calcs — then share them with the community or present at tournaments.",
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
  },
  other: {
    "theme-color": "#E11D48",
    "mobile-web-app-capable": "yes",
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
        {children}
        <InstallPrompt />
        <Analytics />
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
