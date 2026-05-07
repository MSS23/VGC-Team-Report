# SEO Metadata Drafts
**Status: DRAFT — DO NOT PUBLISH without review**  
**Created:** 2026-05-07  
**Purpose:** Proposed title tags, meta descriptions, and keyword targets for 5 key pages.

---

## Methodology
- Titles: 50–60 characters (Google truncates at ~60)
- Meta descriptions: 140–160 characters (optimal CTR window)
- Targeting: one primary intent cluster per page, front-loaded with highest-volume keyword
- No keyword stuffing — must read naturally
- All drafts include an A/B variant

---

## Page 1: Homepage (`/`)

**Current title:** `VGC Team Report`  
**Current description:** "The home for competitive Pokemon VGC team reports. Build breakdowns with matchup plans, damage calcs, and speed tiers — then share with the community."

### Draft A (Emphasizes team builder angle — targets "VGC team builder" gap)
```
Title:       VGC Team Report — Build & Share Pokemon VGC Teams
             (53 chars)

Description: Build detailed Pokemon VGC team reports with matchup plans, damage calcs,
             and EV spreads — then share them in one link. Free. No download required.
             (152 chars)
```

### Draft B (Emphasizes pokepaste alternative angle — targets "pokepaste alternative" gap)
```
Title:       VGC Team Report — Beyond PokePaste for VGC
             (49 chars)

Description: Paste your Showdown team and get a shareable VGC report with matchup plans,
             damage calcs, speed tiers, and tournament context. Way more than PokePaste.
             (158 chars)
```

**Recommendation:** Draft A — "team builder" is higher volume. Draft B is strong for content marketing but riskier as the primary title.

**OG title (can differ from `<title>`):**  
"VGC Team Report — Build, Share & Analyze Pokemon Competitive Teams"

---

## Page 2: `/explore`

**Current title:** `Explore VGC Team Reports`  
**Current description:** "Browse Pokemon VGC team reports shared by competitive players from tournaments around the world. Search by Pokemon, tournament, or creator."

### Draft A (Year-keyed, targets "VGC 2026 teams" gap)
```
Title:       VGC Teams 2026 — Browse Competitive Pokemon Reports
             (54 chars)

Description: Discover VGC 2026 team reports from tournament players. Search by Pokemon,
             regulation, creator, or event. Reg M-A, Reg I, and more — updated daily.
             (158 chars)
```

### Draft B (Broader evergreen)
```
Title:       Explore VGC Teams — Community Pokemon Team Reports
             (55 chars)

Description: Browse hundreds of competitive Pokemon VGC team reports shared by players
             worldwide. Filter by regulation, Pokemon, tournament placement, and creator.
             (158 chars)
```

**Recommendation:** Draft A in the short term (2026 season), then migrate to Draft B once the year-specific traffic window closes.

**JSON-LD addition:**  
Extend the existing `CollectionPage` schema with `numberOfItems` (count of public reports) — signals freshness and scale to Google.

---

## Page 3: `/champions` (Champions index)

**Current title:** `Pokemon Champions VGC Team Builder & Reports`  
**Current description:** "Build, share, and discover competitive Pokemon Champions VGC team reports. Create detailed Regulation M-A team breakdowns with Mega Evolution support, matchup plans, damage calcs, and speed tiers."

### Draft A (Targets "mega evolution team" and "pokemon champions" queries)
```
Title:       Pokemon Champions VGC Teams — Mega Evolution Reports
             (58 chars)

Description: Build and share Regulation M-A Pokemon Champions team reports with Mega
             Evolution support. EV spreads, matchup plans, and damage calcs built in.
             (154 chars)
```

### Draft B (Targets top-of-funnel "pokemon champions team builder" searchers)
```
Title:       Pokemon Champions Team Builder — Reg M-A Reports
             (55 chars)

Description: The only VGC tool that combines Mega Evolution team building with matchup
             plans and damage calcs. Share your Reg M-A report in one link — for free.
             (156 chars)
```

**Recommendation:** Draft B — stronger value proposition and addresses both "team builder" and "free" intent signals. Keep the current keywords array as-is.

**JSON-LD to add:**  
```json
{
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  "name": "Pokemon Champions VGC Team Reports — Regulation M-A",
  "url": "https://pokemonvgcteamreport.com/champions",
  "description": "Browse Regulation M-A team reports with Mega Evolution builds, matchup plans, and damage calcs.",
  "about": {
    "@type": "SportsOrganization",
    "name": "Pokemon Video Game Championships"
  }
}
```

---

## Page 4: `/champions/[pokemon]` — Example: Charizard Mega X (`/champions/charizard-mega-x`)

**Current title:** `Charizard Mega X VGC Guide — EV Spreads, Movesets & Teams`  
**Current description (generated):** "Complete Charizard Mega X VGC guide for Pokemon Champions Regulation M-A: best EV spreads, movesets, damage calcs, and top competitive teams. Drought with Charizardite X."

The generated title/description template is good. These drafts propose adjustments to the template itself:

### Draft A (Stronger lead with year, targets "[Pokemon] competitive set VGC" intent)
```
Title template:  {displayName} VGC 2026 — Best EV Spread, Moveset & Teams
                 (Using Charizard-Mega-X: 57 chars)

Description template: {displayName} best EV spread, moveset, and teams for Pokemon
                       Champions Reg M-A. Damage calcs and top competitive reports
                       included. {ability} via {megaStone}.
                       (Using Charizard-Mega-X: ~158 chars)
```

### Draft B (Positions as guide + tool, matches Pikalytics-style query intent)
```
Title template:  {displayName} VGC Build Guide — Reg M-A {year}
                 (e.g. "Charizard Mega X VGC Build Guide — Reg M-A 2026" = 51 chars)

Description template: Top Charizard Mega X EV spreads, movesets, speed benchmarks, and
                       team reports from Pokemon Champions Regulation M-A. Community
                       builds and damage calcs included.
```

**Recommendation:** Draft A — front-loading "best EV spread" matches the most common search intent for per-Pokemon pages.

**Missing og:image — proposed fix:**  
Add `/champions/[pokemon]/opengraph-image.tsx` that renders the Pokemon's sprite with a dark card, the display name, and key stats (base stats, ability). Currently `/champions/opengraph-image.tsx` covers only the index page.

**JSON-LD to add (per-pokemon page):**
```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "{displayName} VGC Guide — EV Spreads, Movesets & Teams",
  "description": "...",
  "about": {
    "@type": "Thing",
    "name": "{displayName}",
    "description": "Mega Evolution of {baseName}"
  },
  "publisher": {
    "@type": "Organization",
    "name": "VGC Team Report",
    "url": "https://pokemonvgcteamreport.com"
  }
}
```

---

## Page 5: `/creator/[name]` — Example: `/creator/Wolfe%20Glick`

**Current title:** `{name}'s VGC Teams | VGC Team Report`  
**Current description:** `View all public VGC team reports by {name}.`

The description is extremely thin (44 chars) and has zero keyword signal.

### Draft A (Adds context and keyword signal)
```
Title template:  {name} — VGC Team Reports | VGC Team Report
                 (e.g. "Wolfe Glick — VGC Team Reports | VGC Team Report" = 50 chars)

Description template: Explore all competitive VGC team reports shared by {name} on
                       VGC Team Report. Full EV spreads, matchup plans, and tournament
                       results included.
                       (~155 chars)
```

### Draft B (Name-forward for local/player SEO — targets "[player name] pokemon team" queries)
```
Title template:  {name} Pokemon VGC Teams & Reports
                 (e.g. "Wolfe Glick Pokemon VGC Teams & Reports" = 39 chars)

Description template: {name}'s competitive Pokemon VGC teams — view EV spreads, matchup
                       plans, damage calcs, and tournament placements. Shared on VGC
                       Team Report.
```

**Recommendation:** Draft B — the `{name} Pokemon VGC Teams` formulation matches how fans search for player-specific content (e.g., "Wolfe Glick VGC team"). This is the strongest player/creator SEO signal available.

**og:image recommendation:**  
Add `/creator/[name]/opengraph-image.tsx` that renders a card showing the creator's name, number of public reports, and a sprite collage of their most-used Pokemon. This would make creator page social shares much richer and drive click-through when players share their own creator profiles.

---

## Cross-Cutting Recommendations

### 1. Add "pokepaste alternative" to homepage copy (not title)
A discreet H2 or feature bullet on the landing page: "Import any PokePaste URL — transform it into a rich, shareable team report." This would help the page appear for "pokepaste alternative" without changing the brand-forward title.

### 2. Year-stamp the explore page description dynamically
Instead of a static meta description, generate it server-side with the current year and current report count:  
`"Browse ${reportCount.toLocaleString()} competitive Pokemon VGC 2026 team reports shared by players worldwide."`

### 3. Add a `/speed-tiers` or `/resources` page
A standalone page listing VGC 2026 speed benchmarks (extractable from the same speed tier logic already in the codebase) would capture "VGC speed tiers 2026" traffic that currently goes entirely to Pikalytics.

### 4. Add keyword "free" to homepage description
Every major competitor (Pikalytics, crob.at, etc.) emphasizes that their tools are free. The site's FAQ JSON-LD mentions "free" but the meta description does not. Adding "free" to the homepage description increases CTR for cost-sensitive queries.
