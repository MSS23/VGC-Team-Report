# R1 — Competitor Teardown: Pikalytics, PokePaste, VGCPastes

Sources blocked direct fetch (Cloudflare 403); synthesis from search + cached descriptions.

## 1. Pikalytics (pikalytics.com)

**Does better:**
1. **Authoritative meta data** — usage %, winrate, EV spreads, common teammates, items per Pokemon per regulation. Updates with current Reg (Reg F / Reg I / Champions) and tournament-tagged subpages (e.g., Indianapolis Regionals Top 16). This is their moat.
2. **Tournament-indexed pages** — every major RK9 event gets a dedicated URL with team listings ordered by placement. Huge SEO + recurring traffic.
3. **Mobile app + Pokedex deep-links** — iOS app and per-Pokemon stat pages cover singles formats (Gen 9 OU) plus VGC, giving them cross-format reach.

**VGC Team Report likely does better:**
1. **Share-first UX** — paste → OG image + QR + /share link in seconds; Pikalytics is browse-first, not share-first.
2. **Creator profiles** — /creator routes give individuals a brand home; Pikalytics has none.

**< 4hr ship:** Add a "Meta context" sidebar on each team-report page that pulls each Pokemon's *current-reg usage %* (scraped/cached weekly from Pikalytics or Smogon stats JSON) so a shared team shows "Mienshao — 18% usage, top-5 in Reg I" inline. One cron-refreshed JSON, one server component.

## 2. PokePaste (pokepast.es)

**Does better:**
1. **Universal trust + muscle memory** — every VGC player already knows the URL pattern; copy/paste import into Showdown is one click. It IS the protocol.
2. **Permanence + zero friction** — no account, no login, no JS heavy lift; pastes load instantly and never rot.
3. **Raw-text portability** — the plain Showdown export is greppable, AI-ingestible, and embeddable in any forum/Discord.

**VGC Team Report likely does better:**
1. **Visual richness** — sprites, type icons, OG previews, QR codes vs. pokepast.es plain text.
2. **Analytics layer** — type coverage, speed tiers, role breakdown that pokepast.es flatly does not have.

**< 4hr ship:** Accept `pokepast.es/<id>` URLs directly in the paste box (server-side fetch the raw text, parse, redirect to our `/share/...`). Capture every existing pokepaste link shared in Discord/Reddit as an inbound funnel. ~2 hours: one API route + regex + existing parser.

## 3. VGCPastes (vgcpastes.com / @VGCPastes / VGenC)

**Does better:**
1. **Curation authority** — human-curated top-cut pastes per regulation; the spreadsheet is the de-facto community library (1000+ teams, Reg M–A).
2. **Distribution via Twitter/X** — every regulation drop is a viral thread; built-in audience.
3. **Rental-code surfacing** — partner with Victory Road to flag which teams have in-game rental codes — a feature competitive players actively filter for.

**VGC Team Report likely does better:**
1. **Per-team detail page** — /explore + /tournaments give each team a real page with analytics, not a spreadsheet row.
2. **Search & compare** — /compare lets you diff two teams; a spreadsheet cannot.

**< 4hr ship:** Add a `rentalCode` field (nullable string) to the team schema + a "Rental Code" badge + filter on /explore. Pre-seed with the top 50 VGCPastes Reg-I teams that have codes. Schema migration + 1 input + 1 badge + 1 filter chip.

---
Word count: ~400.
