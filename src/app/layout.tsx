import type { Metadata } from "next";
import { Sora, JetBrains_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { ServiceWorkerRegistration } from "@/components/ui/ServiceWorkerRegistration";
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
  description: "Transform your Pokemon Showdown VGC paste into a clean, professional team report. Build, share, and present with one click.",
  metadataBase: new URL("https://vgc-team-report.vercel.app"),
  openGraph: {
    title: "VGC Team Report",
    description: "Build, share, and present professional VGC team reports",
    type: "website",
    siteName: "VGC Team Report",
    url: "https://vgc-team-report.vercel.app",
  },
  twitter: {
    card: "summary_large_image",
    title: "VGC Team Report",
    description: "Build, share, and present professional VGC team reports",
  },
  icons: {
    icon: { url: "/favicon.svg", type: "image/svg+xml" },
  },
  manifest: "/manifest.json",
  other: {
    "theme-color": "#E11D48",
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
        <Analytics />
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
