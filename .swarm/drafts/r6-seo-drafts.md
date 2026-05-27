# R6 SEO Drafts — Metadata & Content Changes (2026-05-27)

## 1. Homepage metadata (layout.tsx) — tighten keyword targeting

**Current title:**
```
VGC Team Report — Build & Share Pokemon VGC Teams | Pokemon Champions 2026
```

**Proposed title:**
```
VGC Team Report — Free VGC Team Builder & PokePaste Alternative | Pokemon Champions 2026
```
*Rationale:* Adds "free", "team builder", and "pokepaste alternative" -- three keyword gaps where the site is invisible.

**Current description:**
```
The free VGC team report builder — share your VGC team with notes, matchup plans, and damage calcs. Supports Pokemon Champions, Mega Evolution, and all VGC team builder formats.
```

**Proposed description:**
```
The free VGC team report builder and PokePaste alternative. Build and share competitive Pokemon VGC teams with SP spreads, speed tiers, damage calcs, matchup plans, and open team sheets (OTS). Supports Pokemon Champions Reg M-A and Mega Evolution.
```
*Rationale:* Adds "PokePaste alternative", "SP spreads", "speed tiers", "open team sheets (OTS)", "Reg M-A" -- all high-gap keywords from the audit.

---

## 2. /explore metadata — target "best vgc teams 2026"

**Current title:** `Explore VGC Teams | VGC Team Report`

**Proposed title:** `Best VGC Teams 2026 — Browse & Discover Team Reports | VGC Team Report`

**Proposed description:**
```
Browse the best Pokemon VGC teams for 2026. Discover community team reports with SP spreads, matchup plans, damage calcs, and tournament results for Pokemon Champions Reg M-A.
```

---

## 3. /champions metadata — target "pokemon champions teams"

**Current title:** `Pokemon Champions Format | Mega Evolution Teams — VGC Team Report`

**Proposed title:** `Pokemon Champions Teams & Mega Evolution Guide — VGC 2026 | VGC Team Report`

**Proposed description:**
```
Build and share Pokemon Champions VGC teams with Mega Evolution support. Complete Reg M-A guide with SP spreads, speed tiers, damage calcs, and matchup plans for every Mega Pokemon.
```

---

## 4. Missing meta descriptions for /privacy and /terms

```tsx
// privacy/page.tsx
export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How VGC Team Report collects, uses, and protects your data. Read our full privacy policy.",
  alternates: { canonical: "https://pokemonvgcteamreport.com/privacy" },
};

// terms/page.tsx
export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms of service for using VGC Team Report, the free Pokemon VGC team builder and sharing platform.",
  alternates: { canonical: "https://pokemonvgcteamreport.com/terms" },
};
```

---

## 5. Add /compare to sitemap

```ts
// In sitemap.ts, add to staticPages array:
{ url: `${BASE}/compare`, changeFrequency: "monthly", priority: 0.6, lastModified: now },
```

---

## 6. Homepage SSR strategy (high-impact, larger change)

The homepage (`page.tsx`) is a client component. The most impactful SEO change would be to extract a server-rendered landing shell that renders visible text content (h1, feature descriptions, FAQ answers) as static HTML, with the interactive report builder loaded client-side via dynamic import.

**Approach:**
- Create a new server component wrapper that renders the landing page headline, feature grid, FAQ text, and HowTo steps as real HTML
- The PasteInput and TeamReport remain `"use client"` and load dynamically
- JSON-LD schemas move to the server component so they are in the initial HTML

This ensures Googlebot sees rich text content on first crawl without waiting for JS hydration.

---

## 7. New landing pages for keyword gaps (content strategy)

Consider creating lightweight static pages to capture uncovered keyword clusters:

| URL | Target keyword | Content |
|-----|---------------|---------|
| `/tools/speed-tiers` | "vgc speed tiers" | Interactive speed tier table, already built in-app |
| `/tools/damage-calc` | "vgc damage calculator" | Standalone damage calc page |
| `/tools/ots-generator` | "vgc open team sheet generator" | OTS export with its own URL |
| `/guides/pokepaste-alternative` | "pokepaste alternative" | Comparison page: PokePaste vs VGC Team Report |
| `/guides/best-teams` | "best vgc teams 2026" | Curated top teams from /explore with editorial context |

Each page would have unique metadata, structured data, and internal links back to the main app.
