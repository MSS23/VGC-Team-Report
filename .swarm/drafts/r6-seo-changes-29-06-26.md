# R6 SEO Wave 2 — Draft Changes (29 June 2026)

Draft text for the five quick wins in `.swarm/r6-seo-29-06-26.md`. **Not applied** — implementing agent should copy these into the named files.

---

## Win #1 — Delete duplicate `/compare` entry

**File:** `src/app/sitemap.ts`

**Diff (intent):**

```diff
     { url: `${BASE}/feedback`, changeFrequency: "monthly", priority: 0.6, lastModified: now },
     { url: `${BASE}/tournaments`, changeFrequency: "weekly", priority: 0.7, lastModified: now },
     { url: `${BASE}/compare`, changeFrequency: "monthly", priority: 0.6, lastModified: now },
     { url: `${BASE}/changelog`, changeFrequency: "monthly", priority: 0.3, lastModified: now },
-    { url: `${BASE}/compare`, changeFrequency: "monthly", priority: 0.5, lastModified: now },
     { url: `${BASE}/privacy`, changeFrequency: "yearly", priority: 0.1, lastModified: now },
     { url: `${BASE}/terms`, changeFrequency: "yearly", priority: 0.1, lastModified: now },
```

Delete line 18 (the priority 0.5 dup that landed in commit `1d6c3def`). Keep line 16 (priority 0.6 from commit `484fa50`).

---

## Win #2 — Tighten robots.txt

**File:** `public/robots.txt`

**Full replacement content:**

```
User-agent: *
Allow: /
Disallow: /api
Disallow: /dashboard
Disallow: /notifications
Disallow: /embed/

# Explicitly allow major search engine bots
User-agent: Googlebot
Allow: /
Disallow: /api
Disallow: /dashboard
Disallow: /notifications
Disallow: /embed/

User-agent: Bingbot
Allow: /
Disallow: /api
Disallow: /dashboard
Disallow: /notifications
Disallow: /embed/

# Explicitly allow AI crawlers
User-agent: GPTBot
Allow: /
Disallow: /api

User-agent: ClaudeBot
Allow: /
Disallow: /api

User-agent: PerplexityBot
Allow: /
Disallow: /api

User-agent: OAI-SearchBot
Allow: /
Disallow: /api

# Canonical host declaration (Yandex honors this; Google ignores it gracefully)
Host: pokemonvgcteamreport.com

Sitemap: https://pokemonvgcteamreport.com/sitemap.xml
```

Notes:
- `Disallow: /api` (no trailing slash) matches both `/api` and `/api/...` — slightly tighter than the previous `Disallow: /api/`.
- The per-bot disallows for `/dashboard`, `/notifications`, `/embed/` are belt-and-braces — these are already noindex via `metadata.robots`, but a robots.txt disallow conserves crawl budget on these large dynamic surfaces.
- AI crawler disallows kept to `/api` only — they may have a legitimate reason to fetch `/embed/[id]` for sourcing purposes, and we want their citations.

---

## Win #3 — Add BreadcrumbList JSON-LD to `/explore` and `/compare`

### `src/app/explore/page.tsx`

Add import:
```ts
import { JsonLd, BreadcrumbListJsonLd } from "@/components/seo/JsonLd";
```

Add inside the returned fragment, **before** `<JsonLd …>`:
```tsx
<BreadcrumbListJsonLd
  items={[
    { name: "Home", url: "https://pokemonvgcteamreport.com" },
    { name: "Explore", url: "https://pokemonvgcteamreport.com/explore" },
  ]}
/>
```

(The existing inline `breadcrumb` property on the `CollectionPage` schema can stay — it's redundant but not harmful. Google de-duplicates.)

### `src/app/compare/page.tsx`

Add import:
```ts
import { BreadcrumbListJsonLd } from "@/components/seo/JsonLd";
```

Wrap the existing return so it includes the breadcrumb:
```tsx
export default function ComparePage() {
  return (
    <I18nProvider>
      <BreadcrumbListJsonLd
        items={[
          { name: "Home", url: "https://pokemonvgcteamreport.com" },
          { name: "Compare", url: "https://pokemonvgcteamreport.com/compare" },
        ]}
      />
      <Suspense>
        <CompareContent />
      </Suspense>
    </I18nProvider>
  );
}
```

---

## Win #4 — `og:locale` + `twitter:creator` on root layout

**File:** `src/app/layout.tsx`

In the `openGraph` block (currently lines 44-54), add `locale`:

```diff
   openGraph: {
+    locale: "en_US",
     title: "VGC Team Report - Build and Share Pokemon VGC Teams",
```

In the `twitter` block (currently lines 55-63), add `site` and `creator`:

```diff
   twitter: {
     card: "summary_large_image",
+    site: "@Manny64Official",
+    creator: "@Manny64Official",
     title: "VGC Team Report - Build and Share Pokemon VGC Teams",
```

Source for the handle: `src/components/layout/PageFooter.tsx` line 45 — `https://x.com/Manny64Official` is already the linked author handle in the footer.

Per-page metadata that overrides `openGraph` / `twitter` (FAQ, Explore, Champions, Tournaments, Compare, Changelog, Feedback, Creator) does NOT need locale/creator overrides — `next/metadata` merges them in from the root layout.

---

## Win #5 — Consolidate duplicate `BreadcrumbJsonLd` helper

**File:** `src/components/seo/JsonLd.tsx`

Pick **one** of the two paths below. Recommended: Path A (alias).

### Path A — Alias (keeps backwards compatibility)

Replace lines 153-169 (the `BreadcrumbJsonLd` function body) with:

```ts
/**
 * @deprecated — use `BreadcrumbListJsonLd` instead. Kept as an alias so any
 * historical imports keep working until the next sweep.
 */
export const BreadcrumbJsonLd = BreadcrumbListJsonLd;
```

(Must come **after** the `BreadcrumbListJsonLd` declaration to satisfy the closure-over-declaration ordering. Move accordingly in the file.)

### Path B — Delete entirely

1. Delete lines 153-169 of `src/components/seo/JsonLd.tsx`.
2. Update `src/app/creator/[name]/page.tsx`:
   ```diff
   - import { BreadcrumbJsonLd, JsonLd } from "@/components/seo/JsonLd";
   + import { BreadcrumbListJsonLd, JsonLd } from "@/components/seo/JsonLd";
   ```
   ```diff
   -      <BreadcrumbJsonLd
   +      <BreadcrumbListJsonLd
            items={[
              { name: "Home", url: "https://pokemonvgcteamreport.com" },
              { name: "Explore", url: "https://pokemonvgcteamreport.com/explore" },
              {
                name: creator,
                url: `https://pokemonvgcteamreport.com/creator/${encodeURIComponent(creator)}`,
              },
            ]}
   -      />
   +      />
   ```
   (Component-name swap only — the props are identical.)

Path B is the cleaner end-state. Path A is the safer one-PR option if there's any consumer outside this repo that imports the symbol (there isn't, per `grep` — so Path B is fine).

---

## Verification commands (run after deploy)

```bash
# 1. Sitemap dedupe verification
curl -sS -A "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)" \
  https://pokemonvgcteamreport.com/sitemap.xml \
  | xmllint --xpath 'count(//*[local-name()="loc" and text()="https://pokemonvgcteamreport.com/compare"])' -
# Expect: 1 (not 2)

# 2. robots.txt
curl -sS -A "Mozilla/5.0 (compatible; Googlebot/2.1)" https://pokemonvgcteamreport.com/robots.txt

# 3. BreadcrumbList on /explore + /compare
curl -sS -A "Mozilla/5.0 (compatible; Googlebot/2.1)" https://pokemonvgcteamreport.com/explore \
  | grep -o '"@type":"BreadcrumbList"' | wc -l
# Expect: 1+

curl -sS -A "Mozilla/5.0 (compatible; Googlebot/2.1)" https://pokemonvgcteamreport.com/compare \
  | grep -o '"@type":"BreadcrumbList"' | wc -l
# Expect: 1

# 4. Twitter handle on root
curl -sS -A "Mozilla/5.0 (compatible; Googlebot/2.1)" https://pokemonvgcteamreport.com/ \
  | grep -E 'twitter:(site|creator)'
# Expect: both meta tags present with @Manny64Official

# 5. No duplicate Breadcrumb helper imports
grep -rn 'BreadcrumbJsonLd' src/
# Expect: zero matches if Path B; only the alias declaration if Path A.
```
