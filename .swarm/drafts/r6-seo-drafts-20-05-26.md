# VGC Team Report SEO Fixes — Draft Recommendations (May 26, 2026)

## METADATA UPDATES — DRAFT CONTENT

### 1. FAQ Page Keywords (CRITICAL)

**File:** `src/app/faq/page.tsx`

**Current:**
```typescript
export const metadata: Metadata = {
  title: "VGC Team Report FAQ — Common Questions Answered",
  description: "...",
  alternates: { canonical: "..." },
  // NO KEYWORDS FIELD
};
```

**Draft Replacement:**
```typescript
export const metadata: Metadata = {
  title: "VGC Team Report FAQ — Common Questions Answered",
  description: "Answers to the most common questions about VGC Team Report: how to share a Pokémon VGC team, what a team report is, format support, and more.",
  alternates: { canonical: "https://pokemonvgcteamreport.com/faq" },
  keywords: [
    "VGC team report FAQ",
    "how to make a pokemon team report",
    "what is VGC team report",
    "pokemon showdown export",
    "damage calculation pokemon",
    "speed tiers VGC",
    "open team sheet format",
    "regulation M-A rules",
    "pokemon champions format guide",
    "VGC team building tips",
  ],
  openGraph: { /* existing */ },
  twitter: { /* existing */ },
};
```

---

### 2. Dashboard Profile Page — Add Robots

**File:** `src/app/dashboard/profile/page.tsx`

**Current:**
```typescript
export default function ProfilePage() {
  return (
    <I18nProvider>
      <ProfileInner />
    </I18nProvider>
  );
}
// NO METADATA EXPORT
```

**Draft Addition:**
```typescript
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Creator Profile",
  description: "Manage your VGC Team Report creator profile.",
  robots: { index: false, follow: false },
};

export default function ProfilePage() {
  return (
    <I18nProvider>
      <ProfileInner />
    </I18nProvider>
  );
}
```

---

### 3. Dashboard Privacy Page — Add Robots

**File:** `src/app/dashboard/privacy/page.tsx`

**Current:**
```typescript
export default function PrivacyDashboardPage() {
  return (
    <I18nProvider>
      <PrivacyDashboardInner />
    </I18nProvider>
  );
}
// NO METADATA EXPORT
```

**Draft Addition:**
```typescript
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Data & Privacy Settings",
  description: "Manage your personal data and privacy settings on VGC Team Report.",
  robots: { index: false, follow: false },
};

export default function PrivacyDashboardPage() {
  return (
    <I18nProvider>
      <PrivacyDashboardInner />
    </I18nProvider>
  );
}
```

---

### 4. Home Page Keywords — ENHANCEMENT

**File:** `src/app/layout.tsx`

**Current Keywords (Global):**
Not present in global layout (only page-level titles/descriptions).

**Draft Enhancement (Optional):**
Consider adding keywords to home page metadata:

```typescript
// In /src/app/page.tsx or create page metadata
export const metadata: Metadata = {
  title: "VGC Team Report — Build & Share Pokémon VGC Teams | Pokemon Champions 2026",
  description: "...",
  keywords: [
    "VGC team builder",
    "pokemon team report",
    "team building tool",
    "showdown team export",
    "VGC team template",
    "damage calculator pokemon",
    "pokemon champions 2026",
    "mega evolution teams",
    "competitive pokemon teams",
    "speed tier calculator",
  ],
};
```

---

### 5. FAQ Page Anchor IDs — VERIFICATION

**Current Status:** ✓ ALREADY IMPLEMENTED
The FAQ page already uses:
```typescript
const slugify = (text: string) => { /* ... */ };

{FAQ_ITEMS.map((item, index) => (
  <h2 id={slugify(item.question)} className="...">
    {item.question}
  </h2>
))}
```

**No changes needed.** Anchors allow deep linking to individual FAQ items.

---

## SITEMAP UPDATES — DRAFT CONTENT

### 6. Increase FAQ Priority & Add Feedback Page

**File:** `src/app/sitemap.ts`

**Current:**
```typescript
const staticPages: MetadataRoute.Sitemap = [
  { url: BASE, changeFrequency: "weekly", priority: 1.0, lastModified: now },
  { url: `${BASE}/explore`, changeFrequency: "daily", priority: 0.9, lastModified: now },
  { url: `${BASE}/champions`, changeFrequency: "weekly", priority: 0.9, lastModified: now },
  { url: `${BASE}/faq`, changeFrequency: "monthly", priority: 0.6, lastModified: now }, // ← TOO LOW
  { url: `${BASE}/tournaments`, changeFrequency: "weekly", priority: 0.7, lastModified: now },
  // `/feedback` not included
];
```

**Draft Update:**
```typescript
const staticPages: MetadataRoute.Sitemap = [
  { url: BASE, changeFrequency: "weekly", priority: 1.0, lastModified: now },
  { url: `${BASE}/explore`, changeFrequency: "daily", priority: 0.9, lastModified: now },
  { url: `${BASE}/champions`, changeFrequency: "weekly", priority: 0.9, lastModified: now },
  { url: `${BASE}/faq`, changeFrequency: "monthly", priority: 0.8, lastModified: now }, // ↑ INCREASED
  { url: `${BASE}/tournaments`, changeFrequency: "weekly", priority: 0.7, lastModified: now },
  { url: `${BASE}/feedback`, changeFrequency: "monthly", priority: 0.5, lastModified: now }, // ← ADDED
  { url: `${BASE}/changelog`, changeFrequency: "monthly", priority: 0.3, lastModified: now },
  { url: `${BASE}/privacy`, changeFrequency: "yearly", priority: 0.1, lastModified: now },
  { url: `${BASE}/terms`, changeFrequency: "yearly", priority: 0.1, lastModified: now },
  ...getRegMAMegasWithSprites().map((m) => ({ /* ... */ })),
];
```

---

## STRUCTURED DATA UPDATES — DRAFT CONTENT

### 7. Add BreadcrumbList to Home Page

**File:** `src/app/page.tsx`

**Current:**
```typescript
export default function Home() {
  return (
    <I18nProvider>
      <FAQPageJsonLd />
      <HowToSchema steps={HOW_TO_STEPS} />
      <Suspense>
        <HomeContent />
      </Suspense>
    </I18nProvider>
  );
}
```

**Draft Addition:**
```typescript
const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://pokemonvgcteamreport.com"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Build a Team Report",
      "item": "https://pokemonvgcteamreport.com/#paste"
    }
  ]
};

export default function Home() {
  return (
    <I18nProvider>
      <FAQPageJsonLd />
      <HowToSchema steps={HOW_TO_STEPS} />
      <JsonLd data={breadcrumbSchema} />
      <Suspense>
        <HomeContent />
      </Suspense>
    </I18nProvider>
  );
}
```

---

### 8. Add HowToSchema totalTime Attribute

**File:** `src/app/page.tsx`

**Current:**
```typescript
const HOW_TO_STEPS = [
  { name: "Export your team", text: "..." },
  { name: "Paste your team into VGC Team Report", text: "..." },
  // ... 5 steps
];

// HowToSchema is rendered from this
<HowToSchema steps={HOW_TO_STEPS} />
```

**Draft Enhancement (Check JsonLd Component):**

If the `HowToSchema` component doesn't already set `totalTime`, add:

```typescript
const howToData = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "How to Create a VGC Team Report",
  "description": "Build and share your competitive Pokemon VGC team with detailed analysis.",
  "totalTime": "PT5M", // ← ADD THIS
  "step": HOW_TO_STEPS.map((step, i) => ({
    "@type": "HowToStep",
    "position": i + 1,
    "name": step.name,
    "text": step.text,
  })),
};
```

---

## CONTENT PAGE RECOMMENDATIONS — DRAFT OUTLINES

### 9. New Guide Page: "How to Write a VGC Team Report"

**Path:** `src/app/guides/how-to-write-team-report/page.tsx`

**Purpose:** Rank for "how to write a VGC team report" (300-600 estimated monthly searches)

**Draft Outline:**

```markdown
# How to Write a VGC Team Report — Complete Guide

## Introduction (100 words)
- What is a VGC team report
- Why write one (documentation, coaching, tournament prep)
- Who this guide is for (competitive players, coaches, tournament attendees)

## Section 1: Before You Start — Team Selection & Paste (300 words)
- Export from Pokémon Showdown
- Get a PokéPaste link
- What to include (6 Pokémon, moves, items, abilities, EVs/IVs, nature)
- How to use VGC Team Report to import

## Section 2: Team Overview (400 words)
- Core strategy explanation
- Win conditions
- Key matchups you're prepared for
- Teambuilding philosophy (bulky cores, speed control, etc.)
- Example: "This team uses Tailwind setup with Psychic Terrain synergy..."

## Section 3: Individual Pokémon Writeups (600 words)
- Role explanation (Lead, Sweeper, Wall, etc.)
- Moveset justification
- Item choice explanation
- EV/IV spread reasoning
- Common switches and why
- Example format for each Pokémon

## Section 4: Damage Calculations (300 words)
- What are damage calcs and why they matter
- Key calcs for your team (survival benchmarks, OHKO thresholds)
- How to use VGC Team Report's damage calc tool
- Example: "Max Attack Landorus outspeeds and OHKOs bulky Groudon..."

## Section 5: Speed Tiers & Speed Control (400 words)
- Understanding speed tier hierarchies
- Calculating effective speed (base + EVs + nature + abilities)
- Speed control options (Tailwind, Trick Room, priority moves)
- Building your speed tier table
- Example table with benchmarks

## Section 6: Matchup Plans (300 words)
- What are matchup plans
- Common threats in the meta
- Bring strategy for each matchup
- Damage calcs under Trick Room / Tailwind
- Win conditions against top teams

## Section 7: Tournament Context (200 words)
- Why include tournament info (legitimacy, context for strategy)
- Placement, record, event name
- Metagame snapshot
- Rental code (for Pokemon Sword/Shield teams)

## Section 8: Polish & Share (200 words)
- Team summary highlights
- Adding notes/comments
- Setting visibility (Public vs. Link-Only)
- Publishing to Explore
- Getting feedback

## Conclusion (100 words)
- Recap benefits of detailed reports
- Call-to-action: Start building your report

**Metadata for Page:**
```typescript
export const metadata: Metadata = {
  title: "How to Write a VGC Team Report — Step-by-Step Guide",
  description: "Learn how to document your competitive Pokemon VGC team with strategy notes, damage calculations, and matchup analysis. Complete guide with examples.",
  keywords: [
    "how to write a VGC team report",
    "team report guide",
    "pokemon team documentation",
    "VGC strategy guide",
    "team building template",
  ],
};
```

---

### 10. New Page: "VGC Team Report vs. PokéPaste vs. VGC.tools — Comparison"

**Path:** `src/app/guides/comparison/page.tsx`

**Purpose:** Capture "pokemon team builder alternatives" and comparison search intent

**Draft Outline:**

```markdown
# VGC Team Report vs. PokéPaste vs. VGC.tools: Which Tool Should You Use?

## Introduction
- Three popular tools for competitive Pokemon
- When to use each one
- What this guide covers

## Comparison Table
| Feature | VGC Team Report | PokéPaste | VGC.tools |
|---|---|---|---|
| Team Sharing | ✓ (with analysis) | ✓ (minimal) | ✓ (builder only) |
| Notes/Commentary | ✓ | ✗ | ✗ |
| Damage Calculations | ✓ (built-in) | ✗ | ✓ (separate tool) |
| Speed Tiers | ✓ | ✗ | ✗ |
| Matchup Planning | ✓ | ✗ | ✗ |
| Free | ✓ | ✓ | ✓ |
| Community Discover | ✓ (Explore page) | ✗ | ✗ |
| OTS Export | ✓ | ✓ | ✓ |

## When to Use Each Tool

### Use PokéPaste When...
- You need a quick, minimal text-based team share
- You're in a tournament and only need movesets/items
- Sharing within Discord or Reddit

### Use VGC.tools When...
- Building a team from scratch with the builder
- Testing combinations before finalizing
- You don't need publish/sharing features

### Use VGC Team Report When...
- You've completed a team and want to document strategy
- Writing a tournament report
- Creating an Open Team Sheet (OTS)
- Getting community feedback on your team
- Building a personal library of tournament teams

## Deep Dives

### VGC Team Report Features
- Built-in damage calculations
- Speed tier comparison tables
- Matchup planning tools
- Public Explore page for discovery
- Collaborator support

### PokéPaste Strengths
- Ultra-lightweight
- Perfect for quick shares
- No account needed
- URL shortening capability

### VGC.tools Strengths
- Comprehensive team builder
- Set suggestions from competitive data
- Rental code generator

## Conclusion
- Best practice: Use together (build in VGC.tools, document in VGC Team Report, share paste via PokéPaste for tournaments)

**Metadata:**
```typescript
export const metadata: Metadata = {
  title: "VGC Team Report vs. PokéPaste vs. VGC.tools — Tool Comparison",
  description: "Compare VGC team building tools: VGC Team Report, PokéPaste, and VGC.tools. Find out which is best for documentation, sharing, and tournament prep.",
  keywords: [
    "pokemon team builder comparison",
    "VGC team report vs pokepaste",
    "pokemon showdown alternatives",
    "competitive pokemon tools",
    "best VGC team builder",
  ],
};
```

---

## VERIFICATION CHECKLIST

- [ ] Verify `/s/[id]?key=...` edit URLs return `robots: noindex` (check ShareRedirectClient)
- [ ] Check robots.txt includes all private directories
- [ ] Verify anchor IDs in FAQ are accessible via deep links
- [ ] Test OG image references (home, tournaments use fallback)
- [ ] Check if `/feedback` page exists and should be in sitemap
- [ ] Verify Shared Reports schema includes datePublished

---

## IMPLEMENTATION PRIORITY

**Week 1 (Critical):**
1. Add robots to dashboard pages (profile, privacy)
2. Add keywords to FAQ
3. Verify edit URL robots handling
4. Add `/feedback` to sitemap

**Week 2-3 (High):**
5. Create "How to Write a VGC Team Report" guide page
6. Add BreadcrumbList to home and tournament pages
7. Increase FAQ sitemap priority to 0.8

**Month 2:**
8. Create comparison page (VGC Team Report vs. alternatives)
9. Create dedicated landing page for damage calculator tool
10. Implement home-specific OG image

---

**Draft Prepared by:** Claude Code SEO Specialist  
**Date:** May 26, 2026  
**Status:** DRAFT ONLY — Do not publish without review
