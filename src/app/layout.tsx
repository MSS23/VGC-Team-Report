import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "VGC Team Report",
  description: "Transform your Pokemon Showdown VGC paste into a clean, professional team report",
  openGraph: {
    title: "VGC Team Report",
    description: "Build, share, and present professional VGC team reports",
    type: "website",
    siteName: "VGC Team Report",
  },
  twitter: {
    card: "summary",
    title: "VGC Team Report",
    description: "Build, share, and present professional VGC team reports",
  },
  icons: {
    icon: { url: "/favicon.svg", type: "image/svg+xml" },
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
      </body>
    </html>
  );
}
