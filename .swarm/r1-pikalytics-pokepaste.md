# Competitor Teardown: Pikalytics & PokePaste
**Research date:** 2026-05-08
**Researcher:** Swarm Agent R1

---

## 1. Pikalytics (pikalytics.com)

### Core Offering
Pikalytics is a **metagame usage-statistics platform** for competitive Pokemon, primarily VGC. It pulls data from Pokemon Showdown ladder (Glicko-rated tiers: 1630+, 1500+, 0+) and organizes it by regulation set. It has pivoted to support **Pokemon Champions** (the new 2026 Nintendo/TPC battle platform) faster than most competitors, with dedicated Champions stats, team builder, and damage calculator pages.

### Feature Inventory

#### Stats & Data
- **Usage Pokedex**: Per-Pokemon pages showing move frequency %, ability %, item %, EV spread %, and teammate %, all weighted by rating tier. Covers VGC 2025/2026 regulation sets (Reg F, G, H, I, J, M-A, Champions Preview) plus Battle Stadium Singles, Smogon OU, and Smogon Ubers.
- **Champions Ladder Page** (`/champions`): Aggregated usage rankings and top threats for the Pokemon Champions format specifically. Described as "glanceable showcase cards" for the meta.
- **Top Teams** (`/topteams`): Tournament-sourced top-placing teams displayed as expandable showcase cards (6-Pokemon view + full movesets), with source links to Limitless VGC.
- **Speed Tiers** (`/speed-tiers`): Browsable speed tiers for every Pokemon and Mega in current format — base speed, max speed, neutral natures, Choice Scarf calculations.
- **Articles** (`/articles`): Educational blog covering EV math, team building guides, format primers. Includes beginner-facing content like "Where Do I Start?" serving SEO/new player acquisition.

#### Team Builder (`/team`)
- Import from Showdown paste or Pokepaste link
- Export to Showdown paste
- Share via Pokepaste (generates new paste URL)
- **Share Image** button: exports team as a shareable PNG/image card
- **Meta Calcs** integration: run offensive and defensive calcs against the meta directly from the team builder; update spreads, moves, items, and abilities with calcs recalculating in real time
- Format-specific versions (e.g., `/team/homebsd` for Reg I)

#### Damage Calculator (`/calc` and `/damage-calculator`)
- Full damage calculator with Champions-format stat point framing (not legacy EV framing)
- Checks weather, terrain, Intimidate, spread moves, Mega options
- Pre-populated sets from the Champions ladder dex
- Speed breakpoint cross-referencing with Speed Tiers page

#### Labs / Interactive Learning
- **Calc Quiz** (`/calc-quiz`): Read a full damage roll, bucket it (0%, <25%, 25-50%, 50-75%, 75-100%, OHKO) — trains competitive intuition
- **Speed Quiz**: Head-to-head speed matchup guessing game
- **Type Quiz**: Tests offensive/defensive matchups including new Mega Evolution interactions

#### iOS App (Pikalytics: Battle Strategy)
- 4.7-star App Store rating; paid app, **100% ad-free**, works **offline**
- Ranking Pokedex, top moves/abilities/items/teammates per format
- Favorite Pokemon storage for quick access
- Covers VGC + BSS + Smogon formats
- **Notable app gaps**: no damage calculator, no team builder — users actively complain about these missing web features in App Store reviews
- Major update pushed during Champions format launch (2025); some users report stats falling 2-3 months behind during slow update windows

#### Localization
- Full multilingual support: English, Japanese, Italian, French, German, Spanish, Korean, Simplified Chinese, Traditional Chinese
- Language toggle visible in URL parameters (`?l=spa`, `?l=fra`, etc.)

### Traffic (Approximate)
- ~221K monthly visits (Semrush, Oct 2025)
- Top competitor in the VGC tools space by traffic; Victory Road VGC at ~201K visits

### Monetization
- **Website**: Almost certainly ad-supported (display ads). No confirmed premium tier or paywall on any data feature.
- **iOS app**: Paid download, ad-free, offline — classic "pay once for offline access" model. Exact price not confirmed but positioned as a companion purchase.
- No visible Patreon or donation model confirmed.

### What Pikalytics Does Well
1. **Speed to new format support** — Champions data live very quickly after format launches
2. **Integrated toolchain** — stats → team builder → damage calc → speed tiers all cross-link, reducing tool-switching friction
3. **Data density** — move/item/ability % breakdowns at multiple rating tiers are the single best public source of meta quantification
4. **Localization** — 9 languages enables global VGC audience
5. **Labs tools** — gamified quizzes build habitual return visits from players wanting to drill skills
6. **SEO content** — articles section captures beginner search traffic and funnels into the tool ecosystem
7. **Image sharing** — one-click team image export supports social media sharing workflow

### Gaps / Weaknesses
1. **No narrative team reports** — the tool tells you *what* (usage %) but never *why* (matchup strategy, team role explanation). There is no place to write a player's reasoning.
2. **No player attribution on top teams** — teams sourced from Limitless show the Pokemon but the player story is absent; no "this is why I chose X" context.
3. **Team builder is stateless / no accounts** — teams appear to be session-only or rely on shareable URLs; no persistent account to organize your team history.
4. **iOS app is incomplete** — paying users get no damage calculator and no team builder, creating frustration.
5. **No community/social layer** — no comments, no following players, no liking/bookmarking others' teams.
6. **No tournament result context on team pages** — teams displayed without placement info, opponent record, or event context.
7. **Stats lag** — during format transitions, data can be weeks or months behind, reducing trust.

---

## 2. PokePaste (pokepast.es)

### Core Offering
PokePaste is a **pastebin for competitive Pokemon teams** — the de facto standard format for sharing sets across VGC, Smogon, and online tournaments. It stores Showdown-format team exports as structured plain text and assigns each paste a unique, cryptographically-derived URL (intentionally no central index — privacy by design).

### Technical Foundation
- Built in Go (v3 rewrite); MySQL database; BSD-3-licensed open source (GitHub: `felixphew/pokepaste`)
- 121 GitHub stars, 155 open issues, 6 open PRs — maintenance is light/community-supported
- Past known issues: storage drive filling up (noted and "properly fixed")

### Feature Inventory

#### Paste Format (Showdown-compatible)
Fields per Pokemon: name, item (@), ability, EVs, IVs, nature, moves, shiny, teraType, pokeball. Unspecified EVs default to 0; unspecified IVs default to 31.

Paste-level metadata: **title** (optional), **author** (optional), **notes** (optional free-text field).

#### Display Features
- Syntax highlighting: Pokemon names colored by primary type, moves colored by type, items color-coded
- Pokemon sprite images (from Pokemon Global Link art)
- Item images
- Mobile-responsive layout

#### Sharing Model
- Unique URL per paste (e.g., `pokepast.es/abc123`) — share the link anywhere
- **No login required** to create or view
- No edit after creation (URL is cryptographically fixed — intentional)
- No delete by creator (privacy-by-design, but frustrating for mistakes)
- No public index or search — discoverability is zero unless you share the link yourself
- Privacy is the link itself: unlisted by default

#### Ecosystem Integration
- Universally supported as import/export target by Showdown, Pikalytics, Falinks Teambuilder, VGC Helper, and VGC Team Report
- MCP server available (third-party): `create_pokepaste` tool accepts Pokemon configuration and returns a pokepast.es URL — enabling AI-assisted team sharing workflows
- Python library (`pokemon-formats` on PyPI) can parse pastes programmatically

### Community Role
- **The universal handshake format** for VGC team sharing — nearly every tool either imports from or exports to a pokepaste URL
- VGCPastes account on X (@VGCPastes) maintains curated repositories of tournament-tested teams by regulation set (Reg H: 1150+ teams; Reg I: 63 teams as of Q1 2025; Champions format growing)
- Content creators and coaches use pokepaste links as deliverables ("here's the team")
- Online tournament circuits accept pokepaste submission instead of full team sheets

### Traffic Context
- Top competitor in its space is pokemonshowdown.com at 15.6M visits/month (Nov 2024 Similarweb data) — pokepast.es is significantly smaller but serves a distinct niche

### Monetization
- **None visible** — free, open source, no ads, no premium tier, no donation link prominently surfaced
- Sustained by the creator (`felixphew`) on a passion/community basis
- Storage issues in the past suggest infrastructure costs are a real concern

### What PokePaste Does Well
1. **Zero friction creation** — no account, no form, paste text + submit = URL. Fastest possible sharing experience.
2. **Universal format compatibility** — every tool accepts it; it IS the standard
3. **Privacy by default** — unlisted, cryptographic URLs mean teams don't leak unless you share the link
4. **Open source** — the community can fork/extend; MCP server and Python libraries exist because the format is documented
5. **Lightweight and fast** — no JavaScript bloat; loads instantly

### Gaps / Weaknesses (Exploitable)
1. **No narrative layer** — a paste is just stats. There is no place for matchup notes, tech explanations, tournament report prose, or "why I built it this way." Players who want to write a report have to publish it somewhere else and link to the paste.
2. **No edit or delete** — a typo in your paste means creating a new URL and redistributing. No version history.
3. **No search or browse** — can't discover teams by format, player, or Pokemon used. Discoverability is entirely external (Twitter, Discord, spreadsheets).
4. **No player attribution beyond text field** — the "author" field is just a plain text string; no linked profile, no history, no credibility signal.
5. **No visual presentation** — plain text with sprites. No matchup charts, no damage calc integration, no threat analysis. A paste is a raw input, not a presentation.
6. **No tournament context** — no way to attach "top 4 at EUIC 2025" or "12-2 Day 1" to a paste.
7. **No social features** — no likes, comments, forks, or follows. Community curation happens entirely on third-party platforms (Twitter, Discord, spreadsheets).
8. **No image/OG preview** — sharing a pokepaste URL on Discord/Twitter shows a generic link card, not a visual team preview.
9. **Maintenance concerns** — 155 open GitHub issues, light maintainer activity. Community-dependent reliability.

---

## 3. Landscape Context: Other Adjacent Tools

### Falinks Teambuilder (falinks-teambuilder.com)
- **Real-time collaborative** team builder (multi-user editing, like Google Docs for teams)
- Imports from Showdown paste or Pokepaste; exports to both
- Hosts the VGCPastes repository as a searchable/filterable database
- Parsed Masters Open Team Lists for tournament team search
- Userscript to add "Open in Falinks" button on both Showdown and pokepaste.es pages
- Gap: collaborative but still no narrative report layer; presentation is still a list of sets

### Victory Road (victoryroad.pro)
- The premier **editorial team report** destination: player-written reports for VGC, tournament-organized
- High production value but **editorial gate** — not self-serve; reports are curated/published by the site
- Gap: creates supply-constrained scarcity; most players can't publish there

### Limitless VGC (limitlessvgc.com)
- Tournament database: standings, team lists, player records
- Teams linked to placement results — gives tournament context pokepaste lacks
- Gap: read-only archive; no player commentary or matchup notes

### crob.at
- Free team builder/viewer with visual presentation (sprites, movesets displayed nicely)
- Accepts pokepaste URLs as input; shows teams more visually than raw text
- Gap: display tool only, no report/narrative layer

---

## 4. Actionable Insights for VGC Team Report

### Insight 1: Own the "Team Report" Format That Nobody Else Offers at Scale
Victory Road is editorially gated. Smogon is forum-based. Pikalytics has no narrative layer. PokePaste is raw text. There is **no self-serve, structured team report creator** that combines the paste (machine-readable team data) with the player narrative (why this tech, matchup plans, tournament context). This is the exact white space VGC Team Report lives in — the gap is real and current.

### Insight 2: Make PokePaste Obsolete as a Sharing Artifact
PokePaste URLs are shared because they're the universal input format, not because the URL is a good presentation. A VGC Team Report URL should replace the pokepaste URL in sharing workflows: it embeds the paste data *plus* the narrative, produces a visual team preview card for Discord/Twitter OG embed, and is a better deliverable in every dimension. Target the use case of "player finishes a tournament and wants to share their team."

### Insight 3: Fill Pikalytics' Social Blind Spot
Pikalytics has no accounts, no player profiles, no follows, no community. There is zero social graph. VGC Team Report can own the player identity layer — a profile page showing all of a player's published reports, their tournament history (manually entered or linked to Limitless), and a way for others to follow/bookmark players they want to watch. This creates return-visit behavior Pikalytics can never replicate.

### Insight 4: Tournament Context Is the Missing Link Across All Tools
Every tool (Pikalytics top teams, PokePaste, Falinks repository) shows teams stripped of result context. Limitless has results but no player notes. The combination — a report anchored to "I went X-Y at [Event] with this team, here's my matchup-by-matchup breakdown" — does not exist as a self-serve product. Adding structured tournament result fields (event name, placement, record) to reports creates a differentiated data asset and makes reports more useful to the reader.

### Insight 5: OG/Social Preview Is a Free Distribution Win
PokePaste generates zero visual preview when shared to Discord, Twitter, or Reddit. Pikalytics team builder share image requires a deliberate extra step. VGC Team Report should auto-generate a rich Open Graph image for every report — showing the 6-Pokemon team sprite strip, player name, event/format, and key tech — so every link share is a free visual ad. This costs one server-side image generation feature and converts passive shares into active click-throughs.

### Insight 6: Localization Parity Is a Medium-Term Moat
Pikalytics supports 9 languages; pokepaste.es is English-only with no i18n. The VGC player base is genuinely global (Japan, LATAM, Europe are massive). If VGC Team Report adds even Spanish and Japanese UI/Pokemon name support, it captures a meaningfully underserved audience that Pikalytics already serves for stats but no competitor serves for *narrative* reports.

---

## 5. Recent Changes / New Features (2025-2026)

### Pikalytics
- Full pivot to Pokemon Champions format (2026): new `/champions` stats hub, damage calculator updated for Stat Points (not EVs), team builder updated for Champions sets, Mega Evolution support throughout
- Major iOS app update pushed during Champions format launch weekend (tweet: "major update to give you more tools for the lab") — exact features not publicly detailed yet
- Top Teams page (`/topteams`) appears to be a newer addition sourcing from Limitless tournament data
- Labs section (Calc Quiz, Speed Quiz, Type Quiz) are recent gamification additions

### PokePaste
- No significant new features identified; maintenance mode apparent (155 open issues, light commit activity)
- Third-party MCP server created by community (not official) — indicates demand for programmatic paste creation
- Storage issues have historically caused brief outages; appears stable as of research date
- The format itself is ossified by design — changes would break the ecosystem of tools depending on it

---

## Summary Table

| Dimension | Pikalytics | PokePaste | Gap for VGC Team Report |
|---|---|---|---|
| Metagame stats | Excellent (best in class) | None | Not competing here |
| Team creation UX | Good (data-driven) | None (text only) | Structure + guidance |
| Sharing artifact | Team image, Showdown export, Pokepaste link | Plain URL | Rich report page with OG embed |
| Narrative/report layer | None | None (notes field only) | Core differentiator |
| Tournament context | Partial (top teams sourced externally) | None | Full result + matchup report |
| Player identity | None (no accounts) | None (text field) | Profile + history |
| Social features | None | None | Follows, bookmarks, comments |
| Search/browse | None for teams | None | Discoverable public reports |
| Localization | 9 languages | English only | Opportunity in ES, JP |
| Monetization | Ads (web) + paid app | None | Not yet established |
| Mobile | iOS app (incomplete) | Responsive web only | PWA / mobile-first reports |
