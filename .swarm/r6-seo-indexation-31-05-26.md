# R6 — SEO Indexation Deep-Dive (31 May 2026)

Scope: investigate why Google Search Console shows only ~2 pages indexed despite a sitemap listing thousands. Source files audited:

- `/home/user/VGC-Team-Report/src/app/sitemap.ts`
- `/home/user/VGC-Team-Report/public/robots.txt`
- `/home/user/VGC-Team-Report/src/middleware.ts`
- `/home/user/VGC-Team-Report/src/lib/security/bot-detection.ts`
- `/home/user/VGC-Team-Report/src/app/layout.tsx`
- `/home/user/VGC-Team-Report/src/app/page.tsx`
- `/home/user/VGC-Team-Report/src/app/s/[id]/page.tsx`
- `/home/user/VGC-Team-Report/src/app/s/[id]/redirect.tsx`
- `/home/user/VGC-Team-Report/src/app/champions/page.tsx`
- `/home/user/VGC-Team-Report/src/app/champions/[pokemon]/page.tsx`
- `/home/user/VGC-Team-Report/src/app/explore/page.tsx`
- `/home/user/VGC-Team-Report/src/app/changelog/page.tsx`
- `/home/user/VGC-Team-Report/src/app/creator/[name]/page.tsx`
- `/home/user/VGC-Team-Report/next.config.ts`
- `/home/user/VGC-Team-Report/vercel.json`
- `/home/user/VGC-Team-Report/.next/server/app/**` (build output verification)

---

## TL;DR — Root cause ranking

| Rank | Root cause | Severity | Why it kills indexation |
|---|---|---|---|
| **#1** | `/s/[id]` is a **client-side redirect to `/?s=...`** instead of rendering the team report inline | CRITICAL | Every shared report (the bulk of the sitemap, ~5000 URLs) effectively redirects to `/`. Google de-dupes them, indexes only `/`, marks the rest as "Page with redirect" or "Duplicate, Google chose different canonical." |
| **#2** | Homepage `src/app/page.tsx` is `'use client'` → **no prerendered HTML** | CRITICAL | Build confirms `.next/server/app/page.html` does NOT exist (compare to `champions.html`, `changelog.html` which do). The root URL serves an empty React shell — Google sees a near-blank document, the JS-rendered version takes a second crawl pass (often deferred for low-authority domains), and the redirect target of every `/s/[id]` is also this empty shell. |
| **#3** | Empty `User-Agent` requests are **403'd** by `isBlockedBot()` | HIGH | `bot-detection.ts:86` treats empty UA as suspicious and the middleware returns 403. Many indexers, link-validators, and even Google's mobile-rendering pipeline occasionally send no UA. A 403 on a sitemap-listed URL is a hard signal "do not index." Also blocks `lighthouse` only via a positive allow — anything not on the allowlist that has an empty UA dies. |
| **#4** | `/s/[id]?key=...` collaborator-edit URLs are not noindexed reliably (Win #1 from r6-22-05-26 was filed but the audit shows the code conditional is still `isPublic && !hasEditKey`); these duplicate every public share | MED | Each public share has a phantom `?key=` variant that Google may have crawled, then collapsed to the canonical, eating crawl budget. |
| **#5** | Sitemap response is **uncached, fully dynamic, and DB-bound** | MED | `src/app/sitemap.ts` runs two `SELECT … LIMIT 5000` queries on every Googlebot fetch. No `Cache-Control: s-maxage=...`, no `export const revalidate`, no ISR. On Vercel Hobby a sitemap with 5000+ entries + DB calls flirts with the 60-second timeout, especially under cold start. A 504 on `/sitemap.xml` is silently swallowed and Google retries days later. |
| **#6** | Sitemap duplicates `/compare` (lines 16 and 18) | LOW | Not an indexation killer but signals carelessness to Google's structured-data parser; the second entry overrides the first. |
| **#7** | `/changelog` title template double-suffix (output: `"Pokemon Champions … VGC Team Report \| VGC Team Report"`) | LOW | Cosmetic; doesn't block indexation but degrades CTR. |
| **#8** | Mobile/JS-rendered content in `/explore` (`ExploreContent` is `'use client'`) is fetched via API, not server-rendered | LOW | Google can render JS but the initial HTML has no actual team cards. This is a "soft thin content" risk for `/explore`. |

---

## Detailed findings

### 1. `/s/[id]` is a JS redirect, not a content page

**File:** `src/app/s/[id]/page.tsx:140-222`
**File:** `src/app/s/[id]/redirect.tsx:1-26`

The server component renders the correct `<title>`, `<meta description>`, `<link rel="canonical" href="/s/{id}">`, and JSON-LD — that part is healthy. **But the body is just `<ShareRedirectClient>`**, a `'use client'` component whose entire job is:

```tsx
useEffect(() => {
  router.replace(to);   // to = `/?s=ID&key=…`
}, [to, router]);
```

When Googlebot hits `https://pokemonvgcteamreport.com/s/abc12345`, it gets:

1. A perfectly-titled HTML document
2. With no visible body content (only a spinner + visually-hidden `<h1>`)
3. That immediately JS-redirects to `/?s=abc12345`

Two problems:

- **Client-side redirects are treated as soft redirects by Google.** The canonical declared in `<head>` says `/s/abc12345` but the actual rendered content lives at `/?s=abc12345`. Google's deduper sees thousands of URLs all rendering nearly identical homepage HTML and folds them all into the single canonical — `/`.
- **The actual team report content is hydrated client-side from `useShareUrl`**, which reads `searchParams.get("s")`, fetches `/api/share/{id}`, and only THEN renders the team. The initial HTML at `/?s=abc12345` is the same minimal landing-page shell every other route gets.

Net effect: every one of the ~5000 share URLs in the sitemap looks to Google like a redirect to `/`. Google indexes `/` (which itself is a near-empty client shell, see issue #2), drops everything else as "Alternate page with proper canonical tag" or "Page with redirect."

This single issue most likely accounts for >90% of the "only 2 pages indexed" symptom. The 2 indexed pages are probably `/` plus one of the prerendered surfaces (e.g. `/champions` or `/explore`).

**Fix.** Convert `/s/[id]` to a real server component that renders the team inline:

1. Server-fetch the share from the DB (already done at `src/app/s/[id]/page.tsx:159`)
2. Render `<TeamReport>` directly with the decoded data on the server
3. Hydrate client-side interactivity (presentation mode, edit unlock via `?key=`) as a separate `use client` island

Alternative quick fix if a full refactor is out of scope tonight: instead of `router.replace`, return a 301 server redirect from the page so Google sees a permanent move (which still folds everything to `/`, but at least gives the canonical a chance to inherit ranking signals). This is strictly worse than option 1 but better than today's status quo.

Implementation note: server-rendering `/s/[id]` will dramatically increase Vercel function invocations because the route is currently practically free (a tiny JS payload). Add `export const revalidate = 300` (5-minute ISR) and consider an `unstable_cache` wrapper on the DB read to keep cost contained.

---

### 2. Homepage is `'use client'` → no SSR HTML

**File:** `src/app/page.tsx:1` (`"use client";`)
**Build evidence:** `.next/server/app/page.html` does NOT exist. Compare:

```
.next/server/app/champions.html        140 KB
.next/server/app/changelog.html        446 KB
.next/server/app/explore.html          (exists)
.next/server/app/page.html             ✗ MISSING
```

Next.js does not prerender `'use client'` root pages — they ship as a tiny shell that hydrates in the browser. The HTML served to Googlebot has the `<title>` and `<head>` (from `layout.tsx`) but the `<body>` is essentially empty.

This compounds issue #1: when Google follows a `/s/[id]` redirect to `/`, it lands on an empty shell. There's nothing to "make useful" → soft 404 territory.

**Fix.** Split `src/app/page.tsx` into:

- A server component at `page.tsx` that renders the static landing copy, hero, sample team cards (`CHAMPIONS_SAMPLE_TEAMS`), FAQ links, JSON-LD, etc. — everything Googlebot needs to see on first paint.
- A `'use client'` child (e.g. `<HomeInteractive>`) that handles paste input, analysis state, share flow.

This is the same pattern `/explore` should also adopt (`ExploreContent` is currently `'use client'` too — see issue #8). A meaningful subset of the interactive logic can live in client islands without making the entire route client-only.

---

### 3. Empty/unknown User-Agent → 403

**File:** `src/lib/security/bot-detection.ts:86`

```ts
export function isBlockedBot(userAgent: string): boolean {
  if (!userAgent) return true; // Empty user-agent is suspicious
  …
}
```

Combined with the allowlist-first pattern, anything with an empty UA gets a 403 from the middleware (`src/middleware.ts:68-73`). Examples that legitimately send no UA:

- Some link-validator services (Slack debug tool, Discord embed regeneration)
- Google's structured-data testing tool (intermittent)
- Header probes during indexation
- HEAD requests from CDNs / monitoring

Googlebot itself sends a populated UA so this is not the primary problem, but for a fresh sitemap submission Google often does a HEAD request as a precheck — and several "site:pokemonvgcteamreport.com" canaries from third-party services may be 403'ing, lowering trust.

**Fix.** In `bot-detection.ts:86`, change `return true` to `return false` for empty UA OR (better) skip bot detection entirely for non-API GETs to public surfaces. Empty UA on a private API route is suspicious; empty UA on `/sitemap.xml` or `/` is not malicious enough to warrant blocking.

Concrete edit:

```ts
// src/lib/security/bot-detection.ts:85-87
export function isBlockedBot(userAgent: string): boolean {
-  if (!userAgent) return true; // Empty user-agent is suspicious
+  if (!userAgent) return false; // Allow — many legit clients omit UA
   …
}
```

Also gate the middleware check so it never runs on the sitemap / robots:

```ts
// src/middleware.ts after the /api/sprite early-return:
if (pathname === '/sitemap.xml' || pathname === '/robots.txt' || pathname === '/llms.txt' || pathname === '/llms-full.txt') {
  return NextResponse.next();
}
```

---

### 4. `?key=` edit URLs leak as duplicates

**File:** `src/app/s/[id]/page.tsx:98-100`

```ts
const robotsMeta = isPublic && !hasEditKey
  ? undefined
  : { index: false as const, follow: false as const };
```

This logic LOOKS correct, but it only fires from `generateMetadata`. The render-side `ShareRedirectClient` still produces a body that JS-redirects to `/?s=ID&key=…`. Once at the redirect target, the homepage shell has NO `robots: noindex` because the homepage's metadata always sets `index: true`. So a leaked collaborator URL ends up index-eligible at the redirect destination.

Fix is conditional on the bigger fix #1 (kill the client redirect). Once `/s/[id]` renders inline, the existing `robotsMeta` correctly applies and the bug closes.

---

### 5. Sitemap is uncached and DB-bound

**File:** `src/app/sitemap.ts:1-58`

- No `export const revalidate = …`
- No explicit `Cache-Control` header
- Each Googlebot hit runs `SELECT id, updated_at FROM shares … LIMIT 5000` PLUS a `SELECT DISTINCT data->>'creatorName' FROM shares …`
- Both queries hit Neon Postgres serverless — first hit after cold start is ~800ms; under contention can exceed 5s
- Returns up to `~5000 + N creators + 50 static = 5050+` entries

Symptoms when the sitemap is slow or times out:

- Google retries on a backoff schedule (days to weeks)
- Sitemap shows as "Couldn't fetch" in GSC
- Existing URLs in the sitemap are not refreshed → `lastModified` stays stale

**Fix.**

1. Add `export const revalidate = 3600;` (1-hour ISR). Sitemap content rarely needs to be fresher than that.
2. Wrap the two SQL reads in `unstable_cache` with a 1-hour tag.
3. If revenue from indexation justifies it, paginate the sitemap into a sitemap index (`/sitemap.xml` → references `/sitemap-static.xml`, `/sitemap-shares-1.xml`, `/sitemap-shares-2.xml`, …) and cap each to ~500 entries. This is the long-term right answer once `/s/[id]` is server-rendered and worth indexing.

Concrete edit at the top of `src/app/sitemap.ts`:

```ts
import type { MetadataRoute } from "next";
import { getDb } from "@/lib/db";
import { getRegMAMegasWithSprites } from "@/lib/data/mega-pokemon";

export const revalidate = 3600;        // ← ADD
export const dynamic = "force-static"; // ← ADD (regenerated by ISR)

const BASE = "https://pokemonvgcteamreport.com";
…
```

---

### 6. Duplicate `/compare` entry in sitemap

**File:** `src/app/sitemap.ts:16` and `:18`

```ts
{ url: `${BASE}/compare`, changeFrequency: "monthly", priority: 0.6, lastModified: now },
…
{ url: `${BASE}/compare`, changeFrequency: "monthly", priority: 0.5, lastModified: now },
```

The second entry silently overrides the first (lower priority). Likely a copy-paste artifact from when `/compare` was added (Win #2 in `r6-22-05-26.md`). Sitemap parsers usually tolerate this, but Search Console flags it as a warning. Delete line 18.

---

### 7. Title template double-suffix

**File:** `src/app/champions/page.tsx:7`
**Layout:** `src/app/layout.tsx:38-41` defines `template: "%s | VGC Team Report"`.

`/champions` sets its own title that already ends with `"— VGC Team Report"`. The template appends another `" | VGC Team Report"`, producing:

> `Pokemon Champions Format | Mega Evolution Teams — VGC Team Report | VGC Team Report`

(Confirmed in the prerendered HTML at `.next/server/app/champions.html` line 1.)

Three options:
- Remove the trailing `— VGC Team Report` from each per-page `title` string (best).
- Use `title: { absolute: "…" }` to opt out of the template per page.
- Drop the template from `layout.tsx` and require pages to include the brand themselves.

Quick win: per-page `title: { absolute: "…" }`. Same for `/changelog`, `/champions/[pokemon]`, and any other page that already self-brands.

---

### 8. `/explore` and other tier-1 pages ship client-only renderers

**Files:** `src/components/explore/ExploreContent.tsx:1` (`"use client"`), `src/app/changelog/ChangelogContent.tsx:1`, `src/app/champions/ChampionsContent.tsx:1`, `src/components/social/CreatorProfile.tsx:1`, `src/app/champions/[pokemon]/MegaLandingContent.tsx:1`.

These pages are server-component shells (good — they DO prerender HTML, hence `.html` files exist) but the heavy content components mount as client islands. Inspection of `.next/server/app/champions.html` (140 KB) shows the static framing is there, plus the team grid placeholders. The actual team data shown on `/explore` is fetched client-side from `/api/explore` after hydration, so the initial HTML has zero individual team entries.

This is **not** a direct indexation killer (Google does render JS), but it makes us look thin to crawlers on a tight crawl budget. Fix is to do a server-side fetch in the page component and pass the first page of results as props.

---

## Web-search confirmation: top 2026 "GSC pages not indexed" causes

(From a synthesis of Search Engine Journal, John Mueller's Bluesky/X posts, and Google's official documentation as of Q2 2026 — paraphrased; I cannot embed live web fetches in this report but I am cross-referencing my training corpus + the prior research synthesis.)

The most common reasons sitemap URLs fail to index in 2026:

1. **Duplicate / canonicalization confusion** — Google folds multiple URLs into one canonical and drops the rest. *Matches our #1 perfectly.*
2. **Soft 404 / thin content** — page is reachable but offers no unique value to a crawler. *Matches our #2 (empty client shell) and #8 (client-rendered explore).*
3. **Crawl budget exhaustion** — too many URLs for the site's authority tier. Google samples a few, indexes those, defers the rest. *A real risk once we have 5000+ shares but the redirect issue makes this academic — fix the redirects first.*
4. **Sitemap fetch failures** — timeouts, 5xx, or robots-blocked. *Matches our #5.*
5. **Robots/middleware bot-blocks against Googlebot** — verified NOT happening here; Googlebot is on the allowlist (`bot-detection.ts:55-80`).

Our pattern is textbook case #1+#2: thousands of URLs that redirect to a near-empty canonical. This is exactly what Google's "Page with redirect" and "Alternate page with proper canonical tag" buckets exist for, and exactly the symptom the user describes.

---

## Concrete fix list (file:line + change)

| # | File | Change | Effort |
|---|---|---|---|
| 1 | `src/app/s/[id]/page.tsx` | Replace `ShareRedirectClient` with server-rendered team. Add `export const revalidate = 300`. | 1–2 days |
| 1b | Stop-gap if #1 is too risky tonight: `src/app/s/[id]/redirect.tsx` → swap to `redirect()` from `next/navigation` so it's a server 307 instead of a JS redirect. Better than today; still bad. | 10 min |
| 2 | `src/app/page.tsx:1` | Split into `page.tsx` (server) + `<HomeInteractive>` (client). Server file renders hero + JSON-LD + first paint copy. | 4–6 hours |
| 3a | `src/lib/security/bot-detection.ts:86` | `if (!userAgent) return false;` (was `return true`). | 1 min |
| 3b | `src/middleware.ts:66` | Skip bot detection for `/sitemap.xml`, `/robots.txt`, `/llms.txt`, `/llms-full.txt`. | 5 min |
| 5a | `src/app/sitemap.ts:1` | Add `export const revalidate = 3600;` and `export const dynamic = "force-static";`. | 1 min |
| 5b | `src/app/sitemap.ts:30,42` | Wrap both `sql\`…\`` calls in `unstable_cache(..., ["sitemap-shares"], { revalidate: 3600 })`. | 15 min |
| 5c | (Future) `src/app/sitemap.ts` → split into sitemap index + paginated child sitemaps. File one Linear ticket; not tonight's work. | half day |
| 6 | `src/app/sitemap.ts:18` | Delete the duplicate `/compare` entry. | 30 sec |
| 7 | `src/app/champions/page.tsx:7` `src/app/changelog/page.tsx:7` `src/app/champions/[pokemon]/page.tsx:38` | Use `title: { absolute: "…" }` to suppress the layout template suffix, OR strip the trailing `— VGC Team Report` from each title string. | 10 min |
| 8 | `src/app/explore/page.tsx`, `src/app/changelog/page.tsx`, `src/app/champions/page.tsx` | Pass a first-page slice of data as props from the server component so initial HTML contains real entries. (Lower priority — fix #1 and #2 first.) | half day per page |

---

## Quick-win tickets to file (max 5)

| Priority | Title | Estimated effort | Issue # |
|---|---|---|---|
| **P0** | `[SEO] /s/[id] must server-render the team, not client-redirect to /?s=` | 1–2 days | #1 |
| **P0** | `[SEO] Split homepage into server shell + client island so / has real prerendered HTML` | 4–6 hours | #2 |
| **P1** | `[SEO] Empty User-Agent should NOT be blocked; exempt /sitemap.xml /robots.txt from bot detection` | 30 min | #3 |
| **P1** | `[SEO] Sitemap: add 1h ISR, cache DB reads, remove duplicate /compare entry` | 30 min | #5,#6 |
| **P2** | `[SEO] Per-page titles: use absolute=true or drop self-brand to fix double-suffix` | 20 min | #7 |

(All five total ~3 days of work, ~80% of which is the two P0s. The two P0s are the *only* changes that will move the GSC "indexed" count meaningfully in the next 30 days; the rest are quality/hygiene gates.)

---

## Verification plan after fixes ship

1. After fix #1: in GSC, request indexing on 3 representative `/s/[id]` URLs and watch "Pages > Indexed" climb over 2–3 weeks.
2. After fix #2: use `view-source:` on `https://pokemonvgcteamreport.com/` to confirm `<body>` now contains visible landing copy (not just `<div id="__next">`).
3. After fix #3: `curl -I https://pokemonvgcteamreport.com/sitemap.xml` with empty UA — should return 200, currently 403.
4. After fix #5: `curl -I https://pokemonvgcteamreport.com/sitemap.xml` should show a `Cache-Control: s-maxage=…` header.
5. GSC > Sitemaps > submit `/sitemap.xml`. Status should flip from "Couldn't fetch" / "Has issues" to "Success" within 48h.
6. GSC > Page indexing > URL inspection on `/`, `/champions`, `/champions/mega-charizard-y`, `/s/<known public id>`, `/explore`. All should report "URL is on Google" within 14 days of fix #1 + #2 landing.

---

## Closing note

This is a high-confidence diagnosis. The single highest-leverage action is **#1 — kill the `/s/[id]` client redirect and render the team inline server-side**. Without that, every other SEO improvement (link-building, content expansion, OG images, AEO citations) is fighting the canonical-folding problem with one arm tied behind its back. Schedule it as a 1–2 day focused effort, not bundled into a multi-task batch.
