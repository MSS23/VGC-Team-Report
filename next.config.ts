import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
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
            value: "same-origin",
          },
          {
            key: "Cross-Origin-Resource-Policy",
            value: "same-origin",
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
              // Default: block everything not explicitly allowed
              "default-src 'self'",
              // Scripts: self, Clerk, Vercel Analytics/Speed Insights, Sentry
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.clerk.accounts.dev https://*.clerk.com https://va.vercel-scripts.com https://*.sentry.io https://challenges.cloudflare.com",
              // Styles: self + inline (Tailwind, motion)
              "style-src 'self' 'unsafe-inline'",
              // Images: self, Pokemon Showdown sprites, Clerk avatars, data URIs
              "img-src 'self' data: blob: https://play.pokemonshowdown.com https://*.pokemonshowdown.com https://img.clerk.com https://*.clerk.com https://raw.githubusercontent.com",
              // Fonts: self + Google Fonts
              "font-src 'self' https://fonts.gstatic.com",
              // Connect: self, API calls, Clerk, Sentry, Vercel Analytics
              "connect-src 'self' https://*.clerk.accounts.dev https://*.clerk.com https://*.sentry.io https://va.vercel-scripts.com https://vitals.vercel-insights.com https://pokepast.es",
              // Frames: Clerk (OAuth popups), Cloudflare challenges
              "frame-src https://*.clerk.accounts.dev https://*.clerk.com https://challenges.cloudflare.com",
              // Workers: self (service worker)
              "worker-src 'self' blob:",
              // Media: self
              "media-src 'self'",
              // Object: none
              "object-src 'none'",
              // Base URI: self
              "base-uri 'self'",
              // Form actions: self
              "form-action 'self'",
              // Frame ancestors: none (prevent embedding)
              "frame-ancestors 'none'",
              // Force HTTPS for all resources
              "upgrade-insecure-requests",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
