import type { NextConfig } from "next";

const scriptSources = [
  "'self'",
  "'unsafe-inline'",
  // React Refresh uses eval in local development. Keep the production CSP
  // strict while allowing the development bundle to hydrate correctly.
  ...(process.env.NODE_ENV === "development" ? ["'unsafe-eval'"] : []),
  "https://*.clerk.accounts.dev",
  "https://*.clerk.com",
  "https://clerk.pokemonvgcteamreport.com",
  "https://va.vercel-scripts.com",
  "https://vercel.live",
  "https://*.vercel.live",
  "https://challenges.cloudflare.com",
  "https://eu-assets.i.posthog.com",
].join(" ");

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ["motion/react"],
  },
  // Heavy, server-only OpenTelemetry packages (used by src/instrumentation.ts
  // for PostHog log export). Keep them out of the bundle trace so they're
  // require()'d at runtime rather than bundled into serverless functions.
  serverExternalPackages: [
    "@opentelemetry/sdk-logs",
    "@opentelemetry/exporter-logs-otlp-http",
    "@opentelemetry/api-logs",
    "@opentelemetry/resources",
  ],
  images: {
    remotePatterns: [],
    minimumCacheTTL: 2592000,
  },
  // Reverse proxy PostHog through our domain to bypass ad blockers
  async rewrites() {
    return [
      {
        source: "/ingest/static/:path*",
        destination: "https://eu-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/ingest/:path*",
        destination: "https://eu.i.posthog.com/:path*",
      },
      {
        source: "/ingest/decide",
        destination: "https://eu.i.posthog.com/decide",
      },
    ];
  },
  async headers() {
    return [
      {
        // Ensure sw.js is never cached by the browser — stale SW scripts cause
        // "Failed to update a ServiceWorker" TypeErrors on deploy
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
        ],
      },
      {
        // manifest.json is static and changes only on a deploy. Without an
        // explicit Cache-Control, Vercel serves /public assets with
        // must-revalidate, so the browser sends a conditional request on every
        // navigation — a misbehaving client then produces a storm of 304s.
        // A 1h max-age + SWR lets the browser serve it from cache and stop
        // hammering the origin, while still picking up changes within the hour.
        source: "/manifest.json",
        headers: [
          { key: "Cache-Control", value: "public, max-age=3600, stale-while-revalidate=86400" },
        ],
      },
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()",
          },
          {
            key: "X-Permitted-Cross-Domain-Policies",
            value: "none",
          },
          {
            key: "Cross-Origin-Opener-Policy",
            // unsafe-none required for Clerk OAuth popups (Google, Discord, Twitch sign-in)
            value: "unsafe-none",
          },
          {
            key: "Cross-Origin-Resource-Policy",
            // cross-origin required for loading Showdown sprites from external domain
            value: "cross-origin",
          },
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              // Scripts: self, Clerk (all domains), Vercel, Cloudflare, PostHog
              `script-src ${scriptSources}`,
              // Styles: self + inline + Google Fonts + Clerk
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://*.clerk.com https://clerk.pokemonvgcteamreport.com",
              // Images: self, Showdown sprites, Clerk, GitHub, data URIs, Vercel Toolbar
              "img-src 'self' data: blob: https://play.pokemonshowdown.com https://*.pokemonshowdown.com https://img.clerk.com https://*.clerk.com https://raw.githubusercontent.com https://vercel.live https://vercel.com",
              // Fonts: self + Google Fonts + Clerk + Vercel Live toolbar
              // (vercel.live serves geist.woff2 / geist_mono.woff2 for the
              //  in-app feedback widget on preview deploys; blocking them
              //  produced noisy CSP violations in prod consoles.)
              "font-src 'self' data: https://fonts.gstatic.com https://fonts.googleapis.com https://*.clerk.com https://clerk.pokemonvgcteamreport.com https://vercel.live https://*.vercel.live",
              // Connect: self, Clerk (all), Vercel, PokePaste, PostHog
              "connect-src 'self' https://play.pokemonshowdown.com https://*.pokemonshowdown.com https://*.clerk.accounts.dev https://*.clerk.com https://clerk.pokemonvgcteamreport.com https://clerk-telemetry.com https://va.vercel-scripts.com https://vitals.vercel-insights.com https://vercel.live https://*.vercel.live https://pokepast.es https://eu.i.posthog.com https://*.posthog.com",
              // Frames: Clerk OAuth, Cloudflare, Vercel Live
              "frame-src https://*.clerk.accounts.dev https://*.clerk.com https://clerk.pokemonvgcteamreport.com https://challenges.cloudflare.com https://vercel.live https://*.vercel.live",
              // Workers
              "worker-src 'self' blob:",
              // Media
              "media-src 'self'",
              // Object
              "object-src 'none'",
              // Base URI
              "base-uri 'self'",
              // Form actions: self + Clerk OAuth redirects
              "form-action 'self' https://*.clerk.accounts.dev https://*.clerk.com https://clerk.pokemonvgcteamreport.com",
              // Frame ancestors: none (prevent embedding our site)
              "frame-ancestors 'none'",
              // Force HTTPS
              "upgrade-insecure-requests",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
