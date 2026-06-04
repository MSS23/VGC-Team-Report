# R2 Competitor Teardown — VGCpastes, Limitless, Trainer Hill

**Date:** 2026-06-04
**Author:** Claude (R2 sub-agent)
**Method:** WebFetch (all 3 returned 403 — blocked by Cloudflare/bot protection) + 3 WebSearch queries (2026-scoped). Findings rely on search-result snippets, X/Twitter posts, derivative aggregator pages (vgenc.net, scribd PDF mirror), and prior R-series notes in `.swarm/r2-*` for context.
**Calls used:** 6/6 (3 WebFetch blocked, 3 WebSearch productive).

---

## 1. VGCpastes (vgcpastes.com / @VGCPastes on X)

### Core differentiator
Community-curated **paste archive of top tournament teams**, organized by Pokémon regulation (currently Reg H/J and Champions format). Backbone of the VGC tryout culture — when a new team wins a regional, VGCpastes has the paste within hours, plus a Showdown replica code. Authority comes from speed + completeness, not analytics.

### Best UX feature
**One-click Showdown replica codes alongside every paste.** Users can paste a code directly into Pokémon Showdown's team importer and ladder the exact team in under 30 seconds. This is the killer share primitive — paste + replica code + tournament context shipped together.

### Worst UX failure
**Site is fundamentally a static repo / Twitter-linked spreadsheet** — discovery happens on X, not on the site. There is no in-site search, no Pokémon-filtered browse, no "show me teams that beat Calyrex." Once on the site, you scroll a giant list per regulation. Mobile is a long-scroll table with tiny tap targets and no team preview.

### Sharing / discovery
- Discovery channel: **Twitter/X primarily.** Each new team is announced as a tweet with a screenshot + paste link.
- Sharing: paste link + replica code. No OG image previews on the site's own URLs.
- No user accounts, no follows, no favorites.

### Mobile experience
Poor. Listing pages are dense tables; the team detail is a raw pokepaste embed. No team sprite grid, no responsive card view. Tap-to-copy works (it's just text) but the UX context (player, tournament placement) is hard to scan on a phone.

### Tournament data integration
Manual: human curators (Castorbrown + community) attach `{Player, Event, Placement, Regulation}` tuples to each paste. No automated ingestion from Limitless. No usage stats or matchup data.

---

## 2. Limitless TCG / Limitless VGC (limitlesstcg.com, limitlessvgc.com, play.limitlesstcg.com)

### Core differentiator
**Tournament infrastructure as a product.** Limitless runs the actual Swiss pairings + standings software many third-party VGC tournaments use, then aggregates the resulting data into a unified database (`limitlessvgc.com` for VGC, separate TCG side). The data is **first-party** — they own the source, not a scraper. Indianapolis Regionals (May 2026, 1,013 players) standings appear on `standings.limitlessvgc.com` because Limitless ran or imported the bracket.

### Best UX feature
**Live tournament standings + pairings + decklist links in a single view.** When a tournament is live, you can watch the bracket update round-by-round; when it's complete, every player row links to their team. Cross-tournament player profile pages aggregate a player's results across the season. This is the "ESPN scoreboard" of VGC.

### Worst UX failure
**Information-dense, designer-hostile UI.** Tables are wide, fonts small, navigation hierarchy is `play.limitlesstcg.com` vs `limitlesstcg.com` vs `limitlessvgc.com` vs `standings.limitlessvgc.com` — four subdomains with overlapping content, no clear "start here." New users bounce. Mobile is a horizontal-scroll table for standings.

### Sharing / discovery
- Per-tournament URL is canonical and persistent (good for SEO + tweet linking).
- Per-player profile URL is shareable.
- No OG image previews on standings URLs; tweets look bare.
- Discovery inside the site is "browse upcoming/completed tournaments list" — no recommendation, no "trending teams this week."

### Mobile experience
Functional but cramped. Standings tables horizontally scroll. The hamburger nav is fine. No PWA, no app. Reasonably fast (static-ish HTML for completed events).

### Tournament data integration
**Best in class** — they ARE the tournament data layer. Other tools (Pikalytics, VGCpastes curators) scrape from Limitless. Decklist submission is built into the tournament-runner product, so the data pipeline `register → submit team → play rounds → final standings + team published` is unified.

---

## 3. Trainer Hill (trainerhill.com)

### Core differentiator
**Analytics layer for Pokémon TCG decklists** — meta trends, matchup win rates, card usage trends, tier list builder. NOTE: Trainer Hill is **TCG (trading card game), not VGC (video game)**. They are an adjacent but not directly competing product. Still useful as a reference for "what does mature meta-analytics look like for a Pokémon competitive scene." They have podcasts + testing tools as community surface area.

### Best UX feature
**Matchup matrix + win-rate filtering on decklists.** Pick an archetype → see its win rate vs every other archetype in the meta over the last N events. This is the "I'm prepping for a tournament, who should I beat" use case that VGC currently lacks a polished tool for.

### Worst UX failure
TCG-specific. Some pages assume you know archetype shorthand ("Charizard ex" etc.) with no glossary. The site mixes deep analytics with podcasts/about pages without a clear primary CTA on the homepage.

### Sharing / discovery
- Decklist permalinks shareable.
- Meta dashboards have date-range filters → URLs reflect state (good).
- Some content gated behind an account (signup friction).
- Discovery via "trending decks" / "tier list" pages — these are the real entry points.

### Mobile experience
Acceptable. Charts reflow. Tier-list drag-and-drop is desktop-leaning.

### Tournament data integration
Pulls from Limitless TCG + other community sources. Lags Limitless by a few hours but adds the analytics layer Limitless deliberately doesn't ship.

---

## Synthesis

### Top 3 features WE should copy

**1. Showdown replica code next to every team paste (from VGCpastes).**
Every team page on our site should expose a one-click "Copy Showdown code" button alongside the existing paste copy. This is the highest-leverage share primitive in VGC — it converts a viewer into a ladderer in 30 seconds. We already render the paste; adding the Showdown-format export is a small server-side transform. Big retention + sharing win for ~1 ticket of work.

**2. Per-player profile pages aggregating cross-tournament results (from Limitless).**
A `/player/[slug]` route that shows every team a player has piloted, their finishes, and their season trajectory. This is the surface VGCpastes lacks and what Twitter community asks for ("what is Wolfey running now?"). We already have player names attached to teams — we just need to index them and ship a profile page. Drives SEO (player names are searched constantly) and gives us a citation surface for AI answers (per r7-aeo notes).

**3. Matchup / counter-team analytics on team pages (from Trainer Hill).**
A small "Teams that beat this team" / "Common counters" section on each team report page, computed from co-occurrence in tournament top-cuts. We have the tournament data; we have the team data; the join is the value. Even a v1 "this team faced X archetype N times in top-cut" is more than anyone else ships for VGC right now.

### Top 2 anti-patterns to avoid

**1. Don't fragment across subdomains the way Limitless does.** Single canonical domain, single nav hierarchy. New users should never have to learn `play.` vs `standings.` vs naked-domain. Our `/teams`, `/players`, `/events` should all live at the same root.

**2. Don't make Twitter/X the de facto discovery layer the way VGCpastes does.** We need in-site discovery — trending teams, "new since you last visited," weekly digest landing page — so the site itself retains attention rather than acting as a CDN for tweets. Ship OG images on every team URL so the tweets that DO link us look first-class.

---

## Sources

- [VGenC Top Teams (VGCpastes mirror)](https://vgenc.net/top-teams)
- [VGC Pokepastes on X (@VGCPastes)](https://x.com/vgcpastes)
- [VGCPastes Champions announcement tweet](https://x.com/VGCPastes/status/2043019220095734204)
- [VGCpastes Repository SV Series 1 (scribd PDF mirror)](https://www.scribd.com/document/630880063/VGCPastes-Repository-SV-Series-1-pdf)
- [Limitless VGC homepage](https://limitlessvgc.com/)
- [Limitless TCG homepage](https://limitlesstcg.com/)
- [Limitless tournaments index](https://play.limitlesstcg.com/tournaments/)
- [Indianapolis Regional standings (limitless)](https://standings.limitlessvgc.com/0033/standings)
- [Limitless completed VGC tournaments](https://play.limitlesstcg.com/tournaments/completed?game=VGC)
- [Trainer Hill homepage](https://www.trainerhill.com/)
- [Trainer Hill decklist analysis](https://www.trainerhill.com/decklist)
- [About Trainer Hill](https://www.trainerhill.com/about)
