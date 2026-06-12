# DRAFT — SEO meta copy for Finding #6 (privacy / terms OG blocks)

These are marketing-copy drafts. Not shipped. Pasted here so R6 can hand them off without R6 (read-only) writing live source files.

---

## `src/app/privacy/page.tsx` — proposed `openGraph` + `twitter` additions

```ts
openGraph: {
  title: "Privacy Policy | VGC Team Report",
  description:
    "How VGC Team Report handles your data — GDPR rights, CCPA, third-party processors, retention windows. We do not sell your personal information.",
  url: "https://pokemonvgcteamreport.com/privacy",
  type: "website",
  siteName: "VGC Team Report",
  images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "VGC Team Report Privacy Policy" }],
},
twitter: {
  card: "summary_large_image",
  title: "Privacy Policy | VGC Team Report",
  description:
    "How VGC Team Report handles your data — GDPR rights, CCPA, third-party processors, retention windows.",
  images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "VGC Team Report Privacy Policy" }],
},
```

Why this copy: GDPR/CCPA hits are the actual audience for a privacy-link click. Lead with what the page actually contains (rights, processors, retention) rather than restating the title. Keep ≤155 chars.

---

## `src/app/terms/page.tsx` — proposed `openGraph` + `twitter` additions

```ts
openGraph: {
  title: "Terms of Service | VGC Team Report",
  description:
    "Terms of using VGC Team Report — a free community tool for Pokemon VGC players. Acceptable use, content ownership, liability, Pokemon trademark notice.",
  url: "https://pokemonvgcteamreport.com/terms",
  type: "website",
  siteName: "VGC Team Report",
  images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "VGC Team Report Terms of Service" }],
},
twitter: {
  card: "summary_large_image",
  title: "Terms of Service | VGC Team Report",
  description:
    "Terms of using VGC Team Report — a free community tool for Pokemon VGC players. Acceptable use, content ownership, liability, Pokemon trademark notice.",
  images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "VGC Team Report Terms of Service" }],
},
```

Why this copy: people share Terms URLs when settling disputes (DMCA, moderation, trademark concerns) — front-load the bits that matter to that audience. The Pokemon trademark line is load-bearing because half the legal-page-share use case is "is this site official Nintendo?" — explicitly saying it isn't, in the unfurl, is brand safety.

---

## Notes on what I deliberately did NOT draft

- **Per-page title/description rewrites** — outside this audit's scope; the prior R6/R7 audits handled those.
- **`/champions/[mega]` description tweaks** — current copy at `src/app/champions/[pokemon]/page.tsx:38–39` already targets `"<Pokemon> VGC Guide — SP Spreads, Movesets & Teams"` which is on-keyword for June 2026 intent. Leave alone.
- **Homepage OG title rewrite** — R7 already drafted this; not re-litigating.
