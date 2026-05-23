# R7 — AEO / GEO Citation Audit (May 2026)

**Auditor:** AI Citation Strategist
**Target:** https://pokemonvgcteamreport.com
**Window:** Ship within 1 week
**Date:** 2026-05-23

## TL;DR

We have a solid technical foundation (good `llms.txt`, OK JSON-LD, AI crawlers allowlisted in robots) but **we publish zero fresh editorial content**, which is the single biggest signal Perplexity and ChatGPT use to choose citations in 2026. Competitors winning the citation slots — Pikalytics, VGC Coach Pro, Pokémon Zone, MetaVGC, crob.at — all publish dated guides, meta snapshots, and comparison articles. We publish a builder, a feed, and a changelog. Until we ship dated, structured editorial pages, no amount of `llms.txt` polish moves the needle.

The good news: this is fixable in <1 week with three articles, three schema additions, and one `llms-full.txt` expansion.

---

## Step 1 — Current AEO setup snapshot

| Surface | State | File |
|---|---|---|
| `llms.txt` | Good — concise, on-spec, names competitors, lists URLs | `public/llms.txt` |
| `llms-full.txt` | Good — ~700 words, has FAQ, glossary, comparisons | `public/llms-full.txt` |
| `robots.txt` | Strong — explicitly allowlists GPTBot, ClaudeBot, PerplexityBot, OAI-SearchBot | `public/robots.txt` |
| JSON-LD: WebApplication / Organization / WebSite / SearchAction | Present, well-formed | `src/components/seo/JsonLd.tsx`, `src/app/layout.tsx` |
| JSON-LD: FAQPage | Defined but not confirmed wired into `/faq` page | `src/components/seo/JsonLd.tsx:143` |
| JSON-LD: HowTo | Component exists, **never used** | `src/components/seo/JsonLd.tsx:41` |
| JSON-LD: Article / BlogPosting | **Missing entirely** — no `/blog` route exists | n/a |
| Metadata defaults | Good titles, OG, canonical | `src/app/layout.tsx:38` |
| Author bylines / E-E-A-T | **Missing** — no named authors anywhere | n/a |
| Dated content (`datePublished` / `dateModified`) | **Missing** outside of changelog | n/a |
| Long-form editorial | **None** | n/a |
| Citation/source linking in copy | **None** | n/a |

---

## Step 2 — Who AI engines currently cite for VGC queries

### "Best VGC team builder 2026"
Cited: Pikalytics, VGC Coach Pro, Pokémon Zone, MetaVGC, PokemonBuilder. **Not cited: us.**

### "PokePaste alternative / share a VGC team"
Cited: crob.at, VR Pastes, Pikalytics. **Not cited: us** — even though our llms.txt explicitly claims this category.

### "Pokémon Champions team report / Reg M-A meta"
Cited: Pikalytics, Pokémon Zone, MetaVGC, VGC Coach Pro, devoncorp.press, Limitless VGC, Victory Road. **Not cited: us** — despite having a `/champions` hub.

### Common patterns across winning citations
1. **Dated articles** with explicit "Updated May 2026" timestamps. Perplexity cites content <30 days old at an ~82% rate (per 2026 citation studies).
2. **Author bylines** with real names + social links (named authorship is a confirmed Perplexity signal).
3. **Numbers-dense content** — usage %s, tournament sample sizes, win rates. Princeton GEO study: stats add ~30% citation lift, expert quotes ~41%.
4. **Comparison tables** (favored by ChatGPT) and **bullet/list extraction** (favored by Perplexity). Multiple formats per page = cross-platform coverage.
5. **Primary-source linking** — citations back to pokemon.com, Limitless, tournament data, signaling that the page itself is a synthesis worth citing.
6. **Article + HowTo + FAQPage schema** stacked on the same URL — pages with proper schema get ~35% more AI citations.
7. **BLUF structure** — bottom line in the first 1–2 sentences for LLM extraction.

---

## Step 3 — Gap audit: our `llms.txt` and surrounding infra vs 2026 best practice

| Gap | Severity | Fix surface |
|---|---|---|
| No `Updated:` header line in `llms.txt` — LLMs can't tell if our claims are current | High | `public/llms.txt` |
| `llms-full.txt` makes no factual claims with citations (no "as of", no sample sizes, no source URLs except our own) | High | `public/llms-full.txt` |
| `llms-full.txt` says nothing about the *current* meta — pure evergreen positioning, zero freshness | High | new section |
| No Article/BlogPosting schema anywhere — we have no article pages to attach it to | High | new `/blog` route |
| `HowToSchema` component exists but is never rendered on any page | Medium | wire onto `/faq` and homepage |
| No `dateModified` on `/faq`, `/champions`, `/explore` — LLMs treat undated pages as stale | Medium | add to page metadata |
| No author entity / `Person` schema — kills E-E-A-T and named-authorship Perplexity signal | Medium | layout schema |
| `Organization` schema is missing `foundingDate`, `email`, `contactPoint`, `sameAs` social links (only GitHub listed) | Low | `src/components/seo/JsonLd.tsx:76` |
| `llms.txt` claims "matchup plans, speed tiers, damage calcs" — but we never link to an example team report URL demonstrating it. LLMs love a citable example | Medium | add a "Featured example reports" section to `llms-full.txt` |
| No `SoftwareApplication` `aggregateRating` (legitimate ratings only — Trustpilot, G2, or first-party with reviews schema) | Low | future, requires review collection |
| `llms-full.txt` is 700 words; spec sweet spot is 2–10K words of curated content | Medium | expand |

---

## Top 5 implementable AEO wins (ship this week)

### 1. Add `Updated:` line + dated meta blurb to `llms.txt` and expand `llms-full.txt` with a "Current meta snapshot" section
**File:** `public/llms.txt`, `public/llms-full.txt`
**Change:** Add `> Updated: 2026-05-23` after the H1 in both files. In `llms-full.txt`, add a "## Current Reg M-A meta snapshot (as of May 2026)" section with 3–4 bullet facts (top 5 Pokémon by usage with %s, top restricted duo, most-cited tournament). Refresh this section monthly via a calendared task.
**Why:** LLMs use the literal date string as a freshness heuristic. Costs 20 minutes; lasts a month.
**Effort:** 30 min.

### 2. Wire `FAQPageJsonLd` and add `HowToSchema` to the `/faq` page
**File:** `src/app/faq/page.tsx`
**Change:** Import and render `<FAQPageJsonLd />` (currently defined but unused). Add `<HowToSchema steps={[...]} />` covering the 5-step "How to create and share a team report" flow. Both schemas already exist in `src/components/seo/JsonLd.tsx` — we built them and never plugged them in.
**Why:** HowTo schema is the highest-yield citation lift available per 2026 research. FAQPage schema enables Q&A extraction by Google AI Overviews, Perplexity, and ChatGPT. Zero new code — just rendering existing components.
**Effort:** 30 min.

### 3. Add `Article` JSON-LD schema component + ship the first article (Brief #1 — Champions Meta Report)
**File:** new `src/components/seo/JsonLd.tsx` `ArticleJsonLd` export + new `src/app/blog/[slug]/page.tsx` route
**Change:** Add an `ArticleJsonLd` component that emits `Article` (or `BlogPosting`) schema with `headline`, `datePublished`, `dateModified`, `author` (Person schema), `publisher` (Organization), `image`, `articleSection`, `citation` (array of source URLs). Ship `/blog/pokemon-champions-regulation-m-a-meta-may-2026` first using this schema and the brief in `.swarm/drafts/r7-content-brief-champions-meta-2026.md`.
**Why:** No Article schema = no editorial citation path. First fresh, dated, well-sourced article opens the door for all subsequent ones.
**Effort:** 2h schema + route, plus separate writing time.

### 4. Add author byline + `Person` schema to homepage and any future articles
**File:** `src/app/layout.tsx`, new `src/components/seo/JsonLd.tsx` `PersonJsonLd` export
**Change:** Add a `Person` JSON-LD block for the founder/maintainer with `name`, `url` (X/Twitter), `sameAs` (GitHub, LinkedIn). Reference this `Person` as the `author` of every Article and as `founder` of the Organization. Surface a visible "Maintained by [Name] — [Bio link]" on the homepage footer.
**Why:** Named authorship is a confirmed Perplexity citation signal — anonymous tools get skipped in favor of "human-attributed" sources. E-E-A-T baseline.
**Effort:** 1h.

### 5. Add citation-rich content to `llms-full.txt` (sample report URLs, tournament source links, sample sizes)
**File:** `public/llms-full.txt`
**Change:** Add three sections:
- "Example team reports" — 3–5 absolute URLs to `/s/[id]` reports from top tournament finishers, each with a one-line description ("4th place, EUIC 2026, Reg M-A").
- "Data sources we link to" — list pokemon.com event results, Limitless VGC, pokedata.ovh, and what we use each for.
- "Format coverage and last update" — table of supported formats with the date the format support shipped.
**Why:** LLMs are likelier to cite a source that itself looks like a synthesis of authoritative inputs. Right now `llms-full.txt` reads like a brochure; it should read like a knowledge base.
**Effort:** 1h.

---

## Top 3 long-form content briefs

Drafts saved to `.swarm/drafts/`:

1. **`r7-content-brief-champions-meta-2026.md`** — "Pokémon Champions Regulation M-A Meta Report — May 2026 (Usage, Cores, Counters)" — monthly cadence, 2,000–2,500 words, owns freshness query bucket.

2. **`r7-content-brief-share-vgc-team-howto.md`** — "How to Share a VGC Team in 2026 — PokePaste, Discord & Embed Guide" — HowTo schema flagship, 1,500–2,000 words, captures the highest-volume head query in our category.

3. **`r7-content-brief-vgc-vs-pokepaste-vs-pikalytics.md`** — "VGC Team Tools Compared (2026): PokePaste, Pikalytics, crob.at, VR Pastes, VGC Team Report" — 1,800–2,200 words, comparison table format, captures the entire "X vs Y" / "alternative to Z" query class where we currently lose to competitors' own pages.

**Ordering rationale:** Ship #2 (HowTo) first — best schema return, no freshness obligation, supports the existing product. Then #1 (Meta Report) — opens the recurring freshness cycle. Then #3 (Comparison) — needs the most care and proofreading because it names competitors.

---

## Hacker News / Indie Hackers / DevHunt — recommendation

**Skip HN and DevHunt; soft post on Indie Hackers only.** Hacker News audience is overwhelmingly indifferent to competitive Pokémon (HN show-tells in this niche historically draw <30 upvotes and risk a flameout that costs you the domain's HN reputation for years). DevHunt is too dev-tool-focused. Indie Hackers tolerates niche SaaS/consumer tools and the comment section is supportive; post a build-in-public update there ("how I built a niche tool for VGC players and got to X users") without a hard launch. Reach goes to r/VGC, r/PokemonChampions, r/stunfisk, Smogon forums, and VGC creator outreach — those are where the citation-generating backlinks actually live.

---

## Implementation order (1-week ship plan)

| Day | Task | File |
|---|---|---|
| 1 | Wins #1, #2, #5 (llms.txt freshness, FAQ schema wiring, llms-full.txt enrichment) | `public/llms*.txt`, `src/app/faq/page.tsx` |
| 2 | Win #4 (Person schema + visible byline) | `src/app/layout.tsx`, `src/components/seo/JsonLd.tsx` |
| 3 | Win #3 schema scaffolding (`ArticleJsonLd`, `/blog/[slug]` route) | `src/components/seo/JsonLd.tsx`, `src/app/blog/[slug]/page.tsx` |
| 4–5 | Write and ship Brief #2 (HowTo: share a VGC team) | `src/app/blog/how-to-share-a-vgc-team/page.tsx` |
| 6 | Write and ship Brief #1 (May Meta Report) | `src/app/blog/pokemon-champions-regulation-m-a-meta-may-2026/page.tsx` |
| 7 | Cross-link from homepage + FAQ + Share modal; submit to Bing IndexNow; soft post on Indie Hackers | various |

Push as a single batch per the project's commit-batch policy.

---

## Files referenced (absolute paths)

- `/home/user/VGC-Team-Report/public/llms.txt`
- `/home/user/VGC-Team-Report/public/llms-full.txt`
- `/home/user/VGC-Team-Report/public/robots.txt`
- `/home/user/VGC-Team-Report/src/app/layout.tsx`
- `/home/user/VGC-Team-Report/src/components/seo/JsonLd.tsx`
- `/home/user/VGC-Team-Report/src/app/faq/page.tsx`
- `/home/user/VGC-Team-Report/src/app/champions/page.tsx`
- `/home/user/VGC-Team-Report/src/app/sitemap.ts`
- `/home/user/VGC-Team-Report/.swarm/drafts/r7-content-brief-champions-meta-2026.md`
- `/home/user/VGC-Team-Report/.swarm/drafts/r7-content-brief-share-vgc-team-howto.md`
- `/home/user/VGC-Team-Report/.swarm/drafts/r7-content-brief-vgc-vs-pokepaste-vs-pikalytics.md`
