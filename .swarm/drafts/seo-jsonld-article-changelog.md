# Draft: Article JSON-LD for /changelog entries

Status: DRAFT — do not publish. Wave 2 review only.

## Goal

Emit `Article` schema for each changelog entry so:
1. Google indexes changelog as a dated content stream (Top Stories eligibility).
2. AI crawlers parse structured update history without scraping prose.
3. Rich-result anchors on "what's new in VGC Team Report" type queries.

## Implementation snippet

### File: `src/app/changelog/page.tsx`

Add this server-rendered JSON-LD before the existing `<ChangelogContent />` render.

```tsx
import { JsonLd } from "@/components/seo/JsonLd";
import { ENTRIES } from "./data";

// Normalize "May 2026" / "April 2026" labels to ISO month dates.
// Lossy on the day, but good enough for schema purposes — we use the 15th
// of each month as a stable midpoint. If precise dates are added to
// ChangelogEntry later, swap this for the real timestamp.
function normalizeDate(label: string): string {
  const months: Record<string, string> = {
    January: "01", February: "02", March: "03", April: "04",
    May: "05", June: "06", July: "07", August: "08",
    September: "09", October: "10", November: "11", December: "12",
  };
  const [monthName, yearStr] = label.split(" ");
  const monthNum = months[monthName] ?? "01";
  return `${yearStr}-${monthNum}-15`;
}

export default function ChangelogPage() {
  // Cap at first 30 entries to keep JSON-LD payload reasonable.
  const articles = ENTRIES.slice(0, 30).map((entry) => ({
    "@type": "Article",
    headline: entry.title,
    datePublished: normalizeDate(entry.date),
    author: {
      "@type": "Organization",
      name: "VGC Team Report",
      url: "https://pokemonvgcteamreport.com",
    },
    publisher: {
      "@type": "Organization",
      name: "VGC Team Report",
      logo: {
        "@type": "ImageObject",
        url: "https://pokemonvgcteamreport.com/icon-512.png",
      },
    },
    description: entry.items
      .map((i) => i.text)
      .join(" ")
      .slice(0, 250),
    url: `https://pokemonvgcteamreport.com/changelog#${entry.version}`,
    articleSection: "Product Updates",
    keywords: ["VGC", "Pokemon", "team report", entry.title].join(", "),
    isPartOf: {
      "@type": "WebApplication",
      name: "VGC Team Report",
      url: "https://pokemonvgcteamreport.com",
    },
  }));

  return (
    <>
      <JsonLd data={{ "@context": "https://schema.org", "@graph": articles }} />
      {/* ... existing changelog render ... */}
    </>
  );
}
```

### Required HTML anchor change

For the `#${entry.version}` URL hash to resolve, each rendered changelog row needs
`id={entry.version}` on its outer element. If `ChangelogContent` doesn't already
emit this, add it:

```tsx
<section id={entry.version} aria-labelledby={`changelog-${entry.version}-title`}>
  <h2 id={`changelog-${entry.version}-title`}>{entry.title}</h2>
  {/* ... */}
</section>
```

## Validation

After implementing, validate with Google's Rich Results Test:
- Paste `https://pokemonvgcteamreport.com/changelog` into https://search.google.com/test/rich-results
- Expect: 30 Article structured-data items, all valid.
- Failure modes to watch for:
  - `datePublished` parsing — must be ISO 8601.
  - `description` truncation introducing mid-word breaks (cosmetic only).
  - Schema.org rejecting nested `WebApplication` inside `Article.isPartOf` (it should accept this).

## Cost

Pure server render — zero runtime cost. JSON-LD adds ~12KB to the changelog HTML
once (~30 entries × ~400 bytes each). The page is already a server component
with the changelog data extracted (per v5.22 changelog note), so no bundle
impact on the client.
