# AEO / GEO Audit — VGC Team Report
**Date:** 2026-05-08
**Researcher:** r7-aeo-geo swarm agent

---

## 1. Current AI Citation Landscape

### Who Gets Cited for VGC Tool Queries?

When AI assistants (ChatGPT, Perplexity, Claude) answer "best VGC team builder" or "how to share a VGC team", the consistently-cited sites are:

| Site | Why AI cites it |
|---|---|
| **Pikalytics** | High-authority domain, massive usage stats corpus, heavily backlinked from Smogon/Reddit |
| **Champions Lab** | Comprehensive all-in-one hub (builder + simulator + meta), strong topical authority signals |
| **Limitless VGC** | Tournament database, cited on Bulbapedia, deep backlink profile |
| **Victory Road** | Resource hub with curated lists (authority page), hosts team reports natively |
| **vgc.tools** | Community-built, directly named in "team sharing" queries |

**VGC Team Report does appear** in "how to share a VGC team" results — described as "the #1 tool for creating and sharing Pokémon Champions VGC team reports." This is meaningful but the site is absent from "best VGC team builder" queries where Pikalytics and Champions Lab dominate.

---

## 2. Already Filed (Do Not Re-File)

- **VGC-147** — Victory Road listing submission
- **VGC-148** — Community resource page submissions
- **VGC-155** — HowTo + Article schema implementation

---

## 3. Current Schema Audit

### What exists:
| Page | Schema Types Present |
|---|---|
| Root (`/`) | `WebApplication` (basic — name, url, description, applicationCategory, price) |
| `/explore` | `CollectionPage` |
| `/champions/[pokemon]` | `WebPage` + `BreadcrumbList` + **`FAQPage`** (5–6 questions per Pokemon, dynamically generated) |
| `/s/[id]` | `CreativeWork` (author, datePublished, dateModified, isPartOf) |

### What is missing:

1. **`Organization` schema on root** — No `Organization` with `sameAs` links to social profiles. This is the single highest-impact missing schema for entity resolution. AI engines use `sameAs` to link the brand to known knowledge graph nodes. Without it, "VGC Team Report" is a floating entity that AI systems cannot confidently disambiguate.

2. **`WebSite` schema with `SearchAction`** — Enables Google to understand the site has internal search (the Explore filter). Indirectly strengthens AI citation confidence.

3. **`SoftwareApplication` is present but thin** — Missing: `featureList`, `screenshot`, `aggregateRating` (if possible), `author` (Organization), `applicationSubCategory`. AEO research shows `SoftwareApplication` with rich properties gets 4.2× more AI citations than a bare `WebApplication`.

4. **`FAQPage` only on champion sub-pages** — The homepage, `/explore`, and `/champions` index have no FAQ schema. The homepage in particular should have a top-level FAQ answering "what is VGC Team Report", "how do I share a VGC team", "what is Regulation M-A" — these are exact phrasings used in AI queries.

5. **`ItemList` schema on `/explore` and `/champions`** — These pages render lists of teams/Megas but emit only `CollectionPage`. An `ItemList` wrapping the top N items would make the list directly machine-readable and citable.

6. **`BreadcrumbList` only on champion sub-pages** — Missing from `/explore` and shared report pages (`/s/[id]`).

7. **No `@graph` structure** — Schema blocks are emitted as separate `<script>` tags rather than a single `@graph` array. A `@graph` lets engines resolve relationships between entities on the same page (e.g. the `FAQPage` is `about` the `WebApplication`).

---

## 4. AI Crawler Access

### robots.txt status: GOOD (no blocking)
```
User-agent: *
Allow: /
Disallow: /api/
```

**However:** The robots.txt does not explicitly name AI crawlers. While the wildcard `Allow: /` technically permits them, AEO research in 2026 shows that **explicit named entries for AI bots** (`GPTBot`, `ClaudeBot`, `PerplexityBot`, `OAI-SearchBot`) serve as a positive signal — some AI training pipelines de-prioritise sites without explicit opt-in entries, and explicit `Allow` overrides Perplexity's aggressive IP rotation.

Recommended additions:
```
User-agent: GPTBot
Allow: /

User-agent: OAI-SearchBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Google-Extended
Allow: /
```

---

## 5. Content Structure Gaps

### No dedicated FAQ/Guide/About page
There is no `/about`, `/faq`, `/guide`, or `/how-it-works` page. AEO research is clear: topical authority requires multiple well-structured articles, not just tool UI. AI engines like Perplexity specifically favour "fresh, well-cited articles clearly scoped to the topic being asked about."

A single `/guide` or `/about` page with structured H2 sections and FAQ schema answering the 5 most common VGC team-sharing questions would be a high-leverage addition:
- "What is VGC Team Report?"
- "How do I create a VGC team report?"
- "What is Regulation M-A / Pokemon Champions?"
- "How do I share a VGC team with my opponent or coach?"
- "What is an Open Team Sheet (OTS) in VGC?"

### Explore page lacks answer-ready content
`/explore` is pure UI (client component). AI crawlers see essentially no text content on this page. A static intro paragraph above the dynamic content with structured H2s about what the explore section contains would help.

### Creator pages lack schema
`/creator/[name]` pages have no `Person` schema. These are profileable entities that could carry `sameAs` links (Twitter/X handles, Limitless profiles) and improve author authority signals for shared reports.

---

## 6. Off-Site Citation Gap Analysis

### Not listed on key community resource hubs (that AI engines use as authority sources):

| Resource Hub | Status | Notes |
|---|---|---|
| **Smogon VGC Resources** (`smogon.com/tiers/vgc/resources`) | Not listed | Highest-trust VGC authority domain. A single link here would substantially increase AI citation probability. Already covered by VGC-147/148 area — confirm Smogon specifically is targeted. |
| **VGCpedia Resources** (`vgcpedia.com/resources`) | Unknown (403) | Community wiki-style resource list |
| **DevonCorp VGC Resources** | Unknown (403) | Curated list page indexed by search |
| **Limitless VGC** | No dedicated resources page | No listing opportunity available |
| **Nimbasa City Post** | Not linked | Publishes sample teams — could link to VGC Team Report as the tool to build team reports |

### Reddit presence
Search results show VGC Team Report appearing in AI-generated summaries of "how to share a VGC team" queries, but no organic Reddit threads referencing the site were surfaced. Reddit posts linking to shared reports would create natural backlink signals that AI training pipelines (which index Reddit heavily) would pick up.

---

## 7. New AEO Opportunities (Beyond VGC-147/148/155)

### HIGH PRIORITY

**Opportunity A: Organization + WebSite schema on root**
- Add `Organization` schema to `layout.tsx` root `JsonLd` alongside the existing `WebApplication`
- Include: `name`, `url`, `logo`, `description`, `sameAs` array (Discord, Twitter/X, GitHub)
- Add `WebSite` schema with `SearchAction` pointing to `/explore?q={search_term_string}`
- Use `@graph` to link them
- **Expected impact:** Resolves the brand as a known entity in AI knowledge graphs. The `sameAs` property is "the most under-used high-impact schema element" per AEO research — pages with entity resolution earn 2.8× higher AI citation rates.

**Opportunity B: Homepage FAQ schema**
- Add `FAQPage` schema to the homepage covering the 5 core questions above
- These are the exact questions being asked of AI engines right now
- The champion sub-pages already have this pattern working — replicate at root level
- **Expected impact:** Direct citation surface for "how do I share a VGC team" queries

**Opportunity C: Explicit AI crawler entries in robots.txt**
- Add explicit `GPTBot`, `OAI-SearchBot`, `ClaudeBot`, `PerplexityBot`, `Google-Extended` allow entries
- Low effort, positive signal for training and retrieval crawlers
- **Expected impact:** Removes any ambiguity about AI crawl permission; may improve training inclusion

### MEDIUM PRIORITY

**Opportunity D: `/about` or `/guide` page with AEO-optimised content**
- Static page with H2-structured answers to common VGC tool questions
- Include `FAQPage` + `HowTo` schema (complementary to VGC-155's scope — that ticket appears to target team report pages specifically, not a dedicated guide page)
- Opening sentence of each H2 section should be a direct 40–75 word answer (AEO "answer capsule" pattern)
- **Expected impact:** Creates a crawlable, citable authority page that doesn't currently exist; directly targets Perplexity's preference for fresh, clearly-scoped articles

**Opportunity E: `SoftwareApplication` schema enrichment**
- Upgrade the existing thin `WebApplication` schema to `SoftwareApplication` with `featureList`, `screenshot` URL, `applicationSubCategory: "Sports"`, `author` (Organization reference)
- **Expected impact:** Richer structured data = more AI-parseable signals about what the tool does

**Opportunity F: `ItemList` on `/explore` and `/champions`**
- Wrap the top 6–10 items on each page in an `ItemList` schema with `name`, `url`, `description` per item
- For `/explore`: top public team reports
- For `/champions`: Mega Pokemon species list
- **Expected impact:** Makes list content directly machine-readable; ItemList is one of the top 5 schema types for AEO

### LOWER PRIORITY

**Opportunity G: `Person` schema on `/creator/[name]` pages**
- Add `Person` schema with `name`, `url`, optionally `sameAs` (if creator links a social handle)
- Improves author authority for shared reports (`/s/[id]` already has `author: Person`)

**Opportunity H: `BreadcrumbList` on `/explore` and `/s/[id]`**
- `/s/[id]` share pages have no breadcrumb schema; adding it signals content hierarchy to AI crawlers

**Opportunity I: Nimbasa City Post / community content partnership**
- Nimbasa City Post publishes sample team articles and is indexed by AI engines
- Reaching out to include VGC Team Report as the recommended tool for building full reports from their sample pastes would create an authoritative inbound citation
- This is a content/partnership play, not a code change

---

## 8. Sitemap Coverage: GOOD
The dynamic sitemap at `/sitemap.ts` includes:
- All static pages + all Mega champion pages
- All public share URLs (up to 5,000)
- All creator profile pages
- Daily change frequency on `/explore`, weekly on champions

No gaps identified. The sitemap is well-constructed for crawl prioritisation.

---

## 9. Summary Table of New Opportunities

| # | Opportunity | Effort | Expected AI Citation Impact | Status |
|---|---|---|---|---|
| A | Organization + WebSite + @graph schema on root | Low (schema code) | HIGH — entity resolution | New |
| B | FAQPage schema on homepage | Low (schema code) | HIGH — direct query match | New |
| C | Explicit AI bot entries in robots.txt | Trivial | Medium | New |
| D | /about or /guide page with AEO content | Medium (new page) | HIGH — topical authority | New |
| E | SoftwareApplication schema enrichment | Low (schema code) | Medium | New |
| F | ItemList schema on /explore + /champions | Low (schema code) | Medium | New |
| G | Person schema on /creator/[name] | Low (schema code) | Low-Medium | New |
| H | BreadcrumbList on /explore + /s/[id] | Low (schema code) | Low | New |
| I | Nimbasa City Post content partnership | Outreach | Medium | New |

---

## 10. Key Sources Consulted

- Live web searches for AI assistant citation behaviour on VGC tool queries (May 2026)
- AEO/GEO research: Frase.io, Stackmatix, Flowout, Search Scale AI, GenOptima
- Schema best practice: schema.org/SoftwareApplication, AirOps, Kerkarmedia, OutpaceSEO
- robots.txt AI crawler guidance: AppearOnAI, Prominara, Soar.sh
- VGC community resource hubs: Victory Road, Smogon, Limitless VGC, VGCpedia (403s on community pages)
- Codebase: `layout.tsx`, `sitemap.ts`, `JsonLd.tsx`, champion + explore + share page schema
