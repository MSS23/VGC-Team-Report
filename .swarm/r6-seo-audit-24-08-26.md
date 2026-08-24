# R6 — SEO Audit (repo-only), 2026-08-24

Scope: static analysis of `/home/user/VGC-Team-Report` at `415a281`. Live site not fetched (egress-blocked).
Status: **DRAFT — no code changed, nothing published.**

---

## 1. VGC-275 verdict — `/s/[id]` serves a client redirect, not the report

**The claim is ACCURATE, and the root cause is worse than the ticket states.**

### What `/s/[id]` actually renders

`src/app/s/[id]/page.tsx:224-231` — the server component's entire return is:

```tsx
return (
  <>
    {jsonLd && <JsonLd data={jsonLd} />}
    <ShareRedirectClient to={`/${qs}`} heading={heading} />
  </>
);
```

`qs` is built at `src/app/s/[id]/page.tsx:156` as `?s=<id>`, so `to` = `/?s=<id>`.

`src/app/s/[id]/redirect.tsx:6-24` is a `"use client"` component whose only behaviour is
`useEffect(() => router.replace(to), …)` (`redirect.tsx:9-11`), rendering a spinner plus a
visually-hidden `<h1>` (`redirect.tsx:18-21`) and the string "Loading shared team...".

So the server HTML at `/s/<id>` contains, in the body: **one `sr-only` h1, a spinning div, and the
text "Loading shared team..."** — zero team data. No Pokémon names, no spreads, no moves, no notes,
no matchup text. Nothing that could rank for anything.

### Where the content actually comes from

`router.replace("/?s=<id>")` is a Next.js *soft* navigation to the homepage tree. `src/app/page.tsx:1`
is `"use client"`. The report is then fetched **in the browser**:

- `src/hooks/useHomePage.ts:64-68` reads `?s=` and sets `isInShareContext`
- `src/hooks/useShareUrl.ts:184-186` — `const fetchUrl = /api/share/${shareId}` then `fetch(fetchUrl, …)`
- `src/hooks/useShareUrl.ts:212` — `history.replaceState(null, "", "/s/${shareId}")` puts the URL back

There is no server render of report content on **either** URL in the chain.

### The compounding failure nobody has noticed

`public/robots.txt:7` is `Disallow: /api/`.

Googlebot's renderer (WRS) obeys robots.txt for **subresource and XHR/fetch requests**, not just
top-level navigations. The one network call that could ever produce report content —
`fetch("/api/share/<id>")` at `useShareUrl.ts:184` — is therefore **disallowed for Googlebot**.

This means the `/s/[id]` pages are not "slow to index" or "dependent on JS rendering". They are
**structurally impossible to index with content**, even with a perfect render budget. The 15-second
client timeout at `useShareUrl.ts:161` is irrelevant; the request is refused before it starts.

### Blast radius

`src/app/sitemap.ts:40-51` submits up to **5,000** `/s/{id}` URLs
(`LIMIT 5000`, `is_public = TRUE`). The ticket's "~5,000 sitemap URLs affected" is exactly right.

The same defect hits two more indexed route families that are *also* in the sitemap:

| Route | Fetch | Sitemapped |
|---|---|---|
| `/s/[id]` | `useShareUrl.ts:184` → `/api/share/[id]` | up to 5,000 (`sitemap.ts:46`) |
| `/creator/[name]` | `src/components/social/CreatorProfile.tsx:51` → `/api/creator/[name]` | up to 5,000 (`sitemap.ts:60`) |
| `/explore` | `src/components/explore/ExploreContent.tsx:106` → `/api/explore` | yes (`sitemap.ts:14`, priority 0.9) |

**~10,000 sitemapped URLs render an empty shell to crawlers.** `/explore` is the site's second-highest
priority URL and its body is a hero heading plus an empty grid.

### What IS correct on `/s/[id]` (be fair)

The `<head>` is genuinely good and should not be touched:
- `generateMetadata` (`page.tsx:7-146`) produces a real title (`page.tsx:56-68`), a composed
  description (`page.tsx:84-101`), a self-referencing canonical (`page.tsx:134`), and correct
  `noindex` for private/unlisted shares (`page.tsx:36`, `page.tsx:106-108`) and for `?key=` edit
  links (`page.tsx:21`, `page.tsx:106`).
- `CreativeWork` JSON-LD with author/contributor/dates (`page.tsx:195-218`), suppressed for private
  shares (`page.tsx:172-175`).

So the ticket title is precise: metadata is fine, **the report is what's missing**.

### Recommended fix (draft, not implemented)

Ordered by value/effort:

1. **Server-render the report at `/s/[id]`.** The data is already loaded server-side twice in this
   file (`page.tsx:26` in `generateMetadata`, `page.tsx:167` in the page). Pass the parsed team into
   a server-rendered read-only view instead of `ShareRedirectClient`. Keep the client app for the
   interactive/edit path. This alone fixes the P1.
2. **If (1) is too large for one ticket**, an interim: render a server-side `<noscript>`-independent
   summary block (team name, 6 species, item/ability/moves, spreads, teamSummary) above
   `ShareRedirectClient`. Crawlers get real content; users still get redirected.
3. **Narrow the robots.txt disallow** regardless of (1)/(2). `Disallow: /api/` should become
   targeted disallows (`/api/user/`, `/api/cron/`, `/api/webhooks/`, `/api/migrate`, `/api/setup`,
   `/api/cleanup`) with `Allow: /api/share/`, `/api/explore`, `/api/creator/` — otherwise `/explore`
   and `/creator/[name]` stay blind even after `/s/` is fixed. Note VGC-272's comment at
   `public/robots.txt:1-4` explains why there is only one UA group; keep that structure.
4. **Drop the client hop entirely.** Once `/s/[id]` renders server-side, `router.replace` →
   `history.replaceState` back to `/s/[id]` (`useShareUrl.ts:212`) is a round trip to nowhere.

---

## 2. Second finding — `/s/[id]/opengraph-image.tsx` is dead code

`src/app/s/[id]/opengraph-image.tsx` exists and **is built** — confirmed in
`.next/app-path-routes-manifest.json` (`/s/[id]/opengraph-image/route`). But
`src/app/s/[id]/page.tsx:131` sets `openGraph.images: []` and `page.tsx:140` sets
`twitter.images: []`.

Next.js merge logic (`node_modules/next/dist/lib/metadata/resolve-metadata.js:149`):

```js
if (openGraph && !source?.openGraph?.hasOwnProperty('images')) { … apply file convention … }
```

Because `images` is an **own property** (even though empty), the file-based OG image is suppressed.
The comment at `page.tsx:110-121` describing this as intentional is therefore *self-consistent* — but
it contradicts the changelog entry claiming "Social share preview cards restored"
(`src/app/changelog/data.ts:188`, v5.10). One of the two is wrong.

Net effect: every shared link unfurls as a bare text card, an edge function is deployed and paid for
on every build, and it is never reachable from any meta tag. Either delete the file or delete the
two `images: []` lines — but not neither. Worth its own ticket; it is a shipped-feature/regression
mismatch, not a style preference.

---

## 3. Canonical handling

`src/app/layout.tsx:82-84` sets `alternates.canonical: "https://pokemonvgcteamreport.com"` on the
**root layout**. Next.js inherits `alternates` down to any page that does not override it. Pages that
do set their own canonical are safe:

`/explore` (`explore/page.tsx:7`), `/champions` (`champions/page.tsx:15`),
`/champions/[pokemon]` (`champions/[pokemon]/page.tsx:72`), `/s/[id]` (`s/[id]/page.tsx:134`),
`/creator/[name]` (`creator/[name]/page.tsx:29`), `/faq` (`faq/page.tsx:11`),
`/tools/ev-to-sp` (`tools/ev-to-sp/page.tsx:38`), `/tournaments` (`tournaments/page.tsx:9`),
`/changelog` (`changelog/page.tsx:9`), `/feedback` (`feedback/page.tsx:7`),
`/support` (`support/page.tsx:8`), `/privacy` (`privacy/page.tsx:7`), `/terms` (`terms/page.tsx:7`).

**Pages inheriting the homepage canonical:**

| Route | Own canonical | Robots | Verdict |
|---|---|---|---|
| `/` | — (inherits) | index | correct by coincidence |
| `/compare` | none | `index:false` (`compare/page.tsx:11`) | harmless, but a noindex page emitting `rel=canonical` to `/` is a mixed signal — set a self-canonical or drop it |
| `/notifications` | none | `index:false` (`notifications/page.tsx:9`) | harmless |
| `/dashboard*` | none | `index:false` (`dashboard/page.tsx:7`, `dashboard/profile/layout.tsx:4`, `dashboard/privacy/layout.tsx:4`, `dashboard/notifications/page.tsx:9`) | harmless |
| `/not-found` | none | none | **404 page emits `canonical: https://pokemonvgcteamreport.com`** — recommend `robots: {index:false}` on `not-found.tsx` |
| `/embed/[id]` | n/a | inline `<meta name="robots" content="noindex, nofollow">` (`embed/[id]/page.tsx:31`) | correct; this page renders its own `<html>` so layout metadata does not apply |

**Recommendation:** move `alternates.canonical` out of the root layout and onto `src/app/page.tsx`
(which currently exports no metadata at all). A layout-level canonical is a footgun: any future page
added without its own canonical silently self-canonicalises to the homepage.

---

## 4. Sitemap (`src/app/sitemap.ts`)

Correct:
- Single `MetadataRoute.Sitemap`, `revalidate = 3600` (`sitemap.ts:9`) so new shares appear within an hour.
- Only `is_public = TRUE` shares are listed (`sitemap.ts:42`) — matches the `noindex` applied to
  unlisted shares at `s/[id]/page.tsx:106-108`. No contradictory signals.
- `/compare` deliberately excluded with an explanatory comment (`sitemap.ts:20-22`, VGC-272).
- Mega pages derived from `getRegMBMegasWithSprites()` (`sitemap.ts:31`), the same source as
  `generateStaticParams` (`champions/[pokemon]/page.tsx:27`) — so sitemap and prerender can't drift.
- DB failure degrades to static pages only (`sitemap.ts:67-70`) rather than throwing.

Gaps:
1. **No `lastModified` on any static page** (`sitemap.ts:12-35`). Share and creator entries have it;
   static ones don't. Low impact but free to add.
2. **`LIMIT 5000` on both shares and creators** (`sitemap.ts:44`, `sitemap.ts:58`) is a silent
   truncation. At ~10k total URLs you are well under the 50,000-URL cap, so raise the limits or split
   into a sitemap index before the cap is a real concern. Ordering by `updated_at DESC` means the
   *oldest* (often most-linked, most-established) shares are the ones that fall off.
3. **`priority` is being set on every entry.** Google has ignored `<priority>` since 2015. Harmless,
   but it is not doing what the comments imply.
4. Sitemapping 10,000 contentless URLs (§1) is an active liability — it invites a "Crawled – currently
   not indexed" pile-up and dilutes crawl budget away from `/champions/*`, which is the one route
   family that *is* server-rendered and genuinely rankable.

---

## 5. robots.txt

`public/robots.txt` (static file; there is **no** `src/app/robots.ts`):

```
User-agent: *
Allow: /
Disallow: /api/
Sitemap: https://pokemonvgcteamreport.com/sitemap.xml
```

- Single-group structure is correct and the VGC-272 comment (`robots.txt:1-4`) explains why. Keep it.
- **`Disallow: /api/` is the silent killer described in §1.** Highest-value change on this page.
- `llms.txt` / `llms-full.txt` exist in `public/` but are not advertised anywhere — no `Sitemap:`-style
  pointer, no `<link>` in `layout.tsx`. Consider a comment line in robots.txt referencing them.
- Both llms files are stamped `Updated: 2026-05-23` (`public/llms.txt:3`) and describe Champions as
  "Regulation M-A" throughout (`llms.txt:11`, `llms.txt:23`) while the app has shipped M-B
  (`src/lib/data/tags.ts:9`). Stale by one format rotation.

### Bot allow/block list

`src/lib/security/bot-detection.ts` is invoked from `src/proxy.ts:36` and **403s** blocked agents.
The allowlist (`bot-detection.ts:55-80`) correctly passes Googlebot, Bingbot, GPTBot, PerplexityBot,
ClaudeBot, Discordbot, Twitterbot, Slackbot, facebookexternalhit. Two notes:

- `bot-detection.ts:86` — `if (!userAgent) return true` blocks empty-UA requests. Some legitimate
  unfurlers send no UA. Low risk, worth knowing.
- `/api/sprite` bypasses middleware entirely (`proxy.ts:27-29`), so sprite loading is unaffected.
- Google-Extended, Applebot-Extended, and Googlebot-News are not explicitly listed but fall through
  to `return false` (allowed), which is the right default.

---

## 6. Metadata completeness per route

| Route | Title | Desc | Canonical | OG | Twitter | Keywords | JSON-LD |
|---|---|---|---|---|---|---|---|
| `/` | layout default | layout | inherited | ✅ (layout:48-51) | ✅ summary_large_image | ❌ | FAQPage + HowTo (`page.tsx:92-93`) + Org/WebSite/WebApplication (`layout.tsx:108-135`) |
| `/explore` | ✅ | ✅ | ✅ | ✅ file-based | ✅ | ✅ (15) | ✅ (`explore/page.tsx:48`) |
| `/champions` | ✅ | ✅ | ✅ | ✅ (no `images` key → file convention applies) | ✅ | ✅ (10) | Breadcrumb + ItemList (`champions/page.tsx:64,70`) |
| `/champions/[pokemon]` | ✅ | ✅ | ✅ | ✅ explicit | ✅ | ✅ (~17, per-mon) | WebPage+Breadcrumb + FAQPage (`[pokemon]/page.tsx:276,307`) |
| `/s/[id]` | ✅ | ✅ | ✅ | ⚠️ `images: []` (§2) | ⚠️ `summary` only | ❌ | CreativeWork (`s/[id]/page.tsx:227`) |
| `/creator/[name]` | ✅ | ✅ | ✅ | ✅ generic | ✅ | ✅ (8) | Breadcrumb + ProfilePage (`creator/[name]/page.tsx:57,67`) |
| `/tools/ev-to-sp` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ (11) | Breadcrumb + FAQPage + custom (`ev-to-sp/page.tsx:122-129`) |
| `/faq` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ (9) | Breadcrumb + FAQPage + HowTo (`faq/page.tsx:135-142`) |
| `/tournaments` | ✅ | ✅ | ✅ | ✅ | ✅ | — | Breadcrumb + SportsEvent (`tournaments/page.tsx:58,64`) |
| `/changelog` | ✅ | ✅ | ✅ | — | — | ❌ | Breadcrumb only |
| `/compare` | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ | none (noindex) |
| `/feedback`,`/support`,`/privacy`,`/terms` | ✅ | ✅ | ✅ | partial | partial | ❌ | none |
| `/embed/[id]` | inline `<title>` | ❌ | n/a | ❌ | ❌ | — | none (noindex — correct) |
| `/dashboard*`,`/notifications` | ✅ | ✅ | inherited | — | — | — | none (noindex — correct) |
| `/not-found`,`/error` | ❌ | ❌ | inherited ⚠️ | — | — | — | none |

Notable gaps worth drafting tickets for:
- **No `twitter.site` / `twitter.creator` handle** anywhere (`layout.tsx:53-61`). Cards render without
  attribution; adds no ranking value but is a free brand signal.
- **`/changelog` has no OG/Twitter block** — it inherits the layout's, which is acceptable.
- **`/` (homepage) exports no page-level metadata at all.** Everything comes from `layout.tsx`. That
  works, but it means the homepage cannot carry its own `keywords` array while every secondary page can.
- **`/not-found.tsx` has no metadata export** — add `robots: { index: false }`.
- **`metadataBase` is set once** (`layout.tsx:41`) and relative OG paths resolve correctly. Good.

---

## 7. Heading hierarchy

Checked the routes that matter:

- `/` (paste screen): single `<h1>` at `src/components/input/PasteInput.tsx:275`. ✅
- `/` (report view): `src/components/report/TeamOverview.tsx:419` (sr-only, when `isReadOnly && !teamName`)
  and `:432` (visible, when `teamName`) are **mutually exclusive** — no duplicate h1. `src/app/page.tsx:1170`
  adds an sr-only h1 only when `physicalSlide !== 0`, also exclusive. ✅ (VGC-259 work looks sound.)
- `/champions`: h1 at `ChampionsContent.tsx:120`, then h2/h3 in order. ✅
- `/champions/[pokemon]`: h1 at `MegaLandingContent.tsx:134`, h2s at `:155/:168/:216/:248`, h3 at `:226`. ✅
- `/faq`: h1 at `faq/page.tsx:158`, questions as h2 with slug ids (`:171`). ✅
- `/tools/ev-to-sp`: h1 at `:165`, section h2s at `:113`, h3 at `:326`. ✅ **but** `EvToSpConverter.tsx:100`
  renders an `<h2>` and the converter is imported into the page — verify it doesn't precede the h1 in DOM order.
- `/tournaments`: h1 at `TournamentsContent.tsx:268` appears **after** an h2 at `:105` in source order.
  Worth a visual check — if the card list renders above the hero, the h1 is not the first heading.
- `/explore`: h1 at `ExploreHero.tsx:10`. ✅
- `/creator/[name]`: h1 at `CreatorProfile.tsx:126`. ✅
- `/s/[id]`: sr-only h1 at `redirect.tsx:18` — technically present, semantically empty (§1).

Only real defect is `/tournaments` heading order; everything else is clean.

---

## 8. Top 10 keyword gaps vs the competitive set

Research note: **Trainer Hill is a Pokémon TCG meta tool, not VGC.** The actual competitors that have
appeared in the Champions/VGC SERP since the format launched are Pikalytics, PokeStats, ChampDex,
ChampsDex, PikaChampions, PokeSynergy, VGenC, crob.at, Pokémon Zone, StrataDex and Game8. Several of
these did not exist a year ago and are ranking on pure long-tail content volume.

The site's structural advantage is that `/champions/[pokemon]` is **server-rendered and prerendered**
(`champions/[pokemon]/page.tsx:17-28`) — it is the only route family that can compete today. Every
gap below should be built as a Champions-page section or a new `/tools/*` page, not as a client-rendered
feed.

| # | Keyword cluster | Who owns it now | Repo status | Recommendation |
|---|---|---|---|---|
| 1 | **"pokemon champions speed tiers" / "reg M-B speed tiers"** | Pikalytics `/speed-tiers`, PokeStats, Smogon | `SpeedTierChart` exists in `src/components/report/` but is **locked inside a report** — no standalone URL | New SSG page `/tools/speed-tiers` with a full Reg M-B table, Tailwind ×2 / Scarf ×1.5 / Trick Room columns. Highest-volume gap you can serve from data you already own. |
| 2 | **"{Mega} SP spread" / "best SP spread {mon}"** | PikaChampions, ChampsDex, PokeStats | Targeted in `keywords` (`[pokemon]/page.tsx:93`) but **no actual spread content on the page** | Add a "Common SP spreads" section to `MegaLandingContent` with 2-3 named spreads (max-speed / bulky / mixed) and the benchmark each one hits. Keywords without matching body copy don't rank. |
| 3 | **"pokemon champions tier list" / "best megas reg M-B"** | Game8, GameRant, Pokémon Zone, Operation Sports | Nothing | `/champions/tier-list` SSG page. Highest-traffic Champions query class and currently owned entirely by generic games media. |
| 4 | **"pokemon champions damage calculator"** | ChampDex `/tools/calc` | Damage calcs exist per-report only | Standalone `/tools/damage-calc` — pairs naturally with the existing `/tools/ev-to-sp`, which is already correctly built and canonicalised. |
| 5 | **"EV to SP" / "stat points explained" / "66 SP budget"** | ChampDex, BattleWise AI, GameCards, PokeStats | ✅ **You own this** — `/tools/ev-to-sp` is well-built (canonical, FAQPage JSON-LD, keywords) | Defend it: add the per-stat conversion table for all six stats and an "SP vs EV" comparison. This is your one genuinely competitive asset. |
| 6 | **"regulation I" (current SV format)** | PokeStats, Pikalytics (`homebsd`) | `Reg I` exists in `src/lib/data/tags.ts:9` but appears in **zero** page copy, metadata, or `llms.txt` | The site markets Champions M-A/M-B heavily and ignores the concurrent SV regulation. Add Reg I to `/explore` copy and llms.txt at minimum. |
| 7 | **"{mon} moveset" / "best moves {mon} champions"** | Pikalytics pokedex pages, Pokémon Zone | In `keywords` only | Add a moveset section to `/champions/[pokemon]` sourced from the public teams already queried server-side at `getTeamsForPokemon`. |
| 8 | **"reg M-B teams to copy paste" / "rental code"** | crob.at, VGCPastes, Pikalytics `/topteams` | Rental codes are stored and filterable on `/explore` (changelog v5.8) — but `/explore` renders empty to crawlers (§1) | Fix §1 first. Then a server-rendered `/explore` with rental-code filter is directly competitive with crob.at. |
| 9 | **"open team sheet" / "OTS pokemon"** | Nobody strongly | Already in `/explore` and `/creator` keywords (`explore/page.tsx:20-22`) | Genuine low-competition opening — but again gated on §1, since both pages are contentless to crawlers. |
| 10 | **"16 new megas M-B" / "{mon} mega stats types abilities"** | StrataDex, GameRant | `getRegMBMegas()` and `getMegaRegulation()` already distinguish M-B-only Megas (`champions/page.tsx:44`, `[pokemon]/page.tsx:38`) | Cheapest win in the list: an SSG `/champions/regulation-m-b` page listing exactly the M-B-only additions. The data model already knows which they are. |

**Cross-cutting content gaps**

- `public/llms.txt` and `llms-full.txt` are stamped 2026-05-23 and still describe Champions as
  "Regulation M-A" (`llms.txt:11`). Since AI-assistant citation is an explicit goal (changelog v5.10),
  a stale llms.txt is actively misinforming the crawlers you most want.
- `OrganizationJsonLd` `sameAs` (`src/components/seo/JsonLd.tsx:75-77`) lists only a GitHub repo. Add
  X/Twitter and Discord — entity consolidation is cheap and every competitor has it.
- No `Product`/`SoftwareApplication` aggregate rating, no `Article`/`BlogPosting` schema anywhere.
  There is no editorial content on the site at all, which is why the Champions long tail is being
  taken by blogs rather than by the tool that actually computes the numbers.

---

## 9. Priority order (recommended)

| P | Item | § |
|---|---|---|
| **P0** | Server-render `/s/[id]` — 5,000 sitemapped URLs currently ship a spinner | 1 |
| **P0** | Narrow `Disallow: /api/` — it blocks the render-time fetch on `/s/`, `/explore`, `/creator/` | 1, 5 |
| **P1** | Server-render `/explore` and `/creator/[name]` (~5,000 more URLs) | 1 |
| **P1** | Resolve `/s/[id]/opengraph-image.tsx` vs `images: []` — one of them is a bug | 2 |
| **P2** | Move root-layout canonical onto `/`; add `robots:{index:false}` to `not-found.tsx` | 3 |
| **P2** | Refresh `llms.txt` / `llms-full.txt` for Reg M-B and Reg I | 5, 8 |
| **P2** | `/tools/speed-tiers` and `/champions/tier-list` SSG pages | 8 |
| **P3** | `/tournaments` heading order; `lastModified` on static sitemap entries; `twitter.site` | 4, 6, 7 |

---

## Sources

- [Pikalytics — Pokemon Champions VGC 2026 Reg. M-B](https://pikalytics.com/)
- [Pikalytics — Speed Tiers](https://www.pikalytics.com/speed-tiers)
- [Pikalytics — Team Builder](https://www.pikalytics.com/team)
- [Pikalytics — Top Teams](https://www.pikalytics.com/topteams)
- [PokeStats — VGC Speed Tiers 2026](https://pokestats.cc/guides/vgc-speed-tiers)
- [PokeStats — VGC Guides 2026, Regulation I](https://pokestats.cc/guides)
- [ChampDex — Stat Points & EVs Explained](https://champdex.com/guides/stat-points)
- [ChampDex — Damage Calculator](https://champdex.com/tools/calc)
- [ChampsDex — Common EV Spreads in Pokemon Champions](https://champsdex.com/posts/pokemon-champions-ev-spreads-guide-2026/)
- [PikaChampions — Guides](https://pikachampions.com/guides/)
- [PokeSynergy — Pokemon Champions Team Builder](https://pokesynergy.app/)
- [crob.at — Reg M-B Teams to Copy & Paste](https://crob.at/teams/vgc)
- [VGenC — Top Teams Pokémon Champions Reg M-A](https://vgenc.net/top-teams)
- [Pokémon Zone — Champions Mega Tier List](https://www.pokemon-zone.com/champions/tier-list-mega/)
- [StrataDex — 16 New Megas in Pokémon Champions M-B](https://stratadex.net/guides/m-b-mega-evolutions)
- [Game8 — Best Mega Pokemon Tier List](https://game8.co/games/Pokemon-Champions/archives/593897)
- [Trainer Hill — About](https://www.trainerhill.com/about) (TCG, not VGC)
- [Limitless VGC](https://limitlessvgc.com/)
- [VGCPastes on X](https://x.com/VGCPastes)
