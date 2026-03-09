import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
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
    card: "summary",
    title: "VGC Team Report",
    description: "Build, share, and present professional VGC team reports",
  },
  icons: {
    icon: { url: "/favicon.svg", type: "image/svg+xml" },
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
    <html lang="en">
      <body className={`${inter.variable} antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
