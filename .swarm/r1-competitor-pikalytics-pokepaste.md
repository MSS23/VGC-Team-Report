# Competitor Teardown: Pikalytics & PokePaste

**Produced:** 2026-05-26
**Scope:** Full feature, UX, monetisation, share mechanics, and gap analysis vs VGC Team Report

---

## 1. Pikalytics (pikalytics.com)

### What It Is

Pikalytics is the dominant competitive Pokemon statistics platform. It aggregates usage data from millions of ranked battles on Showdown, Pokemon HOME, and Battle Stadium, and now covers Pokemon Champions (the 2026 official VGC format). It is the industry reference for usage rates, EV/Stat Point spreads, movesets, items, and teammate synergy across VGC, Smogon, and GO PvP formats.

### Traffic & Reach

- ~223K monthly visits (Similarweb), ~82K (HypeStat) — estimates vary, but solidly 100K+ monthly uniques
- Bounce rate ~43% — indicates moderate engagement depth
- Primarily US traffic; global reach via 8-language support
- iOS app rated 4.7/5 stars; Android app removed from Play Store (August 2024)

### Feature Inventory

| Feature | Detail |
|---|---|
| **Pokedex / Usage Stats** | Per-Pokemon page: usage %, ability distribution, item distribution, top moves, EV/Stat Point spread clusters, common teammates, counters, Tera type preferences. Filterable by regulation and format. Updated monthly. |
| **Team Builder** | Build 6-mon teams with suggested sets from meta data. Import from Showdown or PokePaste URL. Export to Showdown. Share team via URL. Share team as generated image (screenshot). Share as PokePaste link. |
| **Meta Calcs (inline)** | "Meta Calcs" button inside Team Builder launches a live damage calculator. Spreads/moves/items update offensive and defensive calcs in real time. Auto-populates likely attackers/defenders from the Champions ladder. |
| **Standalone Damage Calculator** | `/damage-calculator` — full calc handling weather, terrain, screens, Helping Hand, Intimidate, spread-move penalties, Mega options. Now supports Pokemon Champions Stat Points (not just legacy EVs). |
| **Top Teams** | Glanceable 6-mon showcase cards from recent tournament results. Expandable to full moveset. Filter by Pokemon or archetype. Links out to Limitless VGC for source data. |
| **Champions Hub** | Dedicated section for Pokemon Champions 2026: usage rankings, Pokedex, team builder entry, top threats digest, preview stats. |
| **Tournament Results** | Historical results viewer across regulations. |
| **Speed Tiers** | `/speed-tiers` — full speed tier reference table with base speeds, max investment benchmarks, and Choice Scarf calculations for the current format. |
| **Gamification / Quizzes** | Three interactive learning tools: **Speed Quiz** (streak-based speed-tier guessing), **Calc Quiz** (guess damage bucket from full calc strings), **Type Quiz** (super-effective check with ability modifiers). All log session history. |
| **Articles / Education** | Editorial guides: "Pokemon 101: Where Do I Start?", "Planning My Team", metagame breakdowns. Beginner onboarding pipeline. |
| **Multi-language** | EN, JP, IT, FR, DE, ES, KO, ZH — 8 languages total. |
| **iOS App** | Paid app (~$0.99). Ad-free, offline access. Favourites, usage stats, meta data. Missing: team builder, damage calculator. Updates lag website by 2-3 months. |

### Share UX

| Mechanism | How It Works |
|---|---|
| **Share URL** | Generates a unique Pikalytics URL encoding the team composition. Shareable via copy-paste. No OG image preview on Discord/Twitter — plain link unfurl only. |
| **Share Image** | Client-side screenshot generation of the team view. Downloadable PNG for social posting. Not auto-embedded — user must upload the image manually. |
| **Share PokePaste** | One-click export to pokepast.es — creates a PokePaste and returns the URL. Acknowledges PokePaste as the community standard. |
| **Export to Showdown** | Copies Showdown paste format to clipboard. |
| **No embed/OG support** | Sharing a Pikalytics team URL on Discord/Twitter produces a generic site description, not a team preview card. No dynamic OG images. |

### Monetisation

| Revenue Stream | Detail |
|---|---|
| **Ko-fi membership** | Primary funding. Monthly tiers with member-only posts/content. Exact pricing not publicly listed on landing page — requires login. Covers server costs and developer expenses. |
| **iOS app** | $0.99 one-time purchase. Separate from website features. Revenue likely minimal. |
| **No paywalled features** | All stats, team builder, calc, quizzes are free on the web. Premium is patronage, not access gating. |
| **No display ads** | Clean UI. "Advertise on Pikalytics" link in footer suggests sponsored partnership slots exist but are not programmatic display ads. |
| **No affiliate/merch** | No observable affiliate links or merchandise. |

### What Pikalytics Does Better (vs a new competitor)

1. **Meta Calcs inside the team builder.** Real-time damage calc with auto-populated meta threats, all within the team-building workflow. This seamless loop — build team, verify spreads, adjust, re-check — keeps power users on Pikalytics for hours. No competitor matches this integration depth.
2. **Authoritative, aggregated usage statistics.** Millions of battles aggregated per regulation with historical archives. Usage %, item/ability/move distributions, EV spread clusters, teammate correlation — all on one page per Pokemon. This is the single most-linked resource in VGC content creation.
3. **Gamified learning tools.** Speed Quiz, Calc Quiz, and Type Quiz are sticky daily engagement loops with streak tracking. No other tool in the space has implemented this. Creates return visits from players who are practising, not just building.
4. **Champions-native support.** Already adapted to Pokemon Champions' Stat Point system (not just legacy EVs). Calculator, team builder, and pokedex all use the new Champions framing.
5. **Multi-language coverage.** 8 languages makes it accessible to the global VGC community (Japan, Korea, Europe, LATAM). Most competitors are English-only.

### Weaknesses & Known Pain Points

1. **Data freshness lag.** Updates monthly, not weekly or real-time. MunchStats was created specifically because Pikalytics is "taking a while to update its usage stats." During regulation transitions and early-meta periods, Pikalytics data is stale and players seek faster sources.
2. **No user accounts or team history.** Web users cannot save teams, view history, or manage a collection. Each session is ephemeral. Power users who build dozens of teams have no persistence layer.
3. **No community/social layer.** No comments, ratings, follows, or team discovery feed. Top Teams links out to Limitless — users leave the site entirely. No player profiles.
4. **Team share is data-only.** Shared teams have zero narrative context: no matchup notes, no role explanations, no EV rationale. The share URL is a data dump, not a story.
5. **No Discord/social embed previews.** Sharing a Pikalytics team URL on Discord or Twitter produces no team preview card. No dynamic OG images. Users must manually screenshot and upload.
6. **Mobile app is degraded.** iOS app is $0.99 but missing the two best website features (team builder, damage calc). Updates lag by months. Android app removed entirely in August 2024.
7. **No privacy/unlisted mode.** Teams on the site are not discoverable (no public feed), but there is no explicit privacy framing. No password protection, no "share with my team only" mode.

---

## 2. PokePaste (pokepast.es)

### What It Is

PokePaste is a purpose-built pastebin for competitive Pokemon. Accepts Pokemon Showdown export format and returns a permanent URL with syntax-highlighted team display. No login required. Written in Go, open-sourced at `github.com/felixphew/pokepaste`. It is the de facto community standard for sharing competitive Pokemon teams.

### Traffic & Reach

- Exact traffic unknown (no Similarweb/HypeStat data reliable for pokepast.es)
- Universal adoption: every VGC team shared publicly on Reddit, Discord, Smogon, and tournament systems uses a pokepaste link
- The "lingua franca" of competitive Pokemon sharing — network effect is the product

### Feature Inventory

| Feature | Detail |
|---|---|
| **Paste creation** | Paste Showdown export -> unique cryptographic URL in seconds. No account. Title and notes fields optional. |
| **Syntax highlighting** | Pokemon names and moves coloured by type. Items highlighted. |
| **Sprite/image display** | Pokemon sprites and item images per set. **Broken for many forms** — Zygarde-10%, Zygarde-Complete, Sirfetch'd, Galarian birds, Raging Bolt, many DLC Pokemon. |
| **Notes field** | Freeform text per paste. **URLs in notes are not clickable** — known unfixed bug for years. |
| **Columns mode** | Toggle between single-column and multi-column display. Has known display errors. |
| **No expiry** | Pastes are permanent. |
| **VGC-aware defaults** | Assumes Level 50 when no level is specified. |
| **Open source** | GitHub: 121+ stars, 27 forks. **156 open issues** (as of May 2026). Maintenance is minimal. |
| **Privacy by design** | No public search, no browsing by author. URL-only discovery — intentional pre-tournament security. |

### Share UX

| Mechanism | How It Works |
|---|---|
| **URL scheme** | `pokepast.es/<random-hash>` — short, unique, permanent. The URL is the entire product. |
| **No OG image/embed** | Sharing a pokepaste URL on Discord/Twitter produces **no visual preview**. No sprites, no team summary card. Just a plain text link unfurl at best. This is a major gap — crob.at was built specifically to solve this. |
| **No social integration** | No share-to-Twitter, share-to-Discord, or copy-as-image buttons. Users manually copy the URL and paste it into their platform of choice. |
| **No import from other tools** | PokePaste only accepts raw Showdown export text. Cannot import from Pikalytics, VGC Team Report, or other team builders without first exporting to Showdown format. |
| **Universal interop** | Despite no active integration, pokepaste URLs are accepted by Pikalytics (import), crob.at (visual upgrade), VGC Team Report, Showdown, and most VGC tools. The URL is the API. |

### Monetisation

**None whatsoever.** No ads, no donations page, no Ko-fi, no Patreon, no premium tier. Entirely reliant on maintainer goodwill. This creates acute sustainability risk.

### What PokePaste Does Better (vs a new competitor)

1. **Zero-friction sharing: paste-to-URL in under 10 seconds.** No login, no form fields, no decisions. The lowest possible activation energy for sharing a competitive team. New users can share their first team in seconds.
2. **Universal portability and network effect.** A pokepaste URL is understood everywhere. It is accepted by every downstream tool in the ecosystem. This network-effect moat means players default to pokepaste even when better alternatives exist. Switching costs are high because the URL format is baked into thousands of forum posts, Discord messages, and content creator videos.
3. **Privacy-safe by default.** Cryptographic URLs with no public search or browsing. Players can share with teammates without opponents discovering the team via Google. This is critical for pre-tournament preparation.
4. **Permanence.** Pastes never expire. Teams shared years ago still resolve. This creates deep link equity across the community.

### Weaknesses & Known Pain Points

1. **Sprite rot — the most visible failure.** Broken images for Zygarde-10%, Sirfetch'd, Galarian forms, Raging Bolt, many DLC/Champions Pokemon. A community Chrome extension (pokepastefix, actively maintained through 2026) exists solely to work around this. The fact that a third-party extension is needed to fix core functionality is damning.
2. **No social embed previews.** Sharing a pokepaste URL on Discord/Twitter produces no visual preview — no sprites, no team summary. crob.at was created specifically to address this gap by generating OG preview images from pokepaste URLs. This is a significant UX gap in a social-first community.
3. **Creation failures.** Users report "No (or Invalid) Paste" errors when creating teams (Issue #313, February 2026). Emoji characters in nicknames cause database errors. The formatting help link has returned 404 errors. Basic reliability is degrading.
4. **Disk space incidents.** The site has experienced multiple "drive filled up" outages. The homepage itself has noted "Drive filled up again today (4th June), so now it's properly fixed" — indicating recurring infrastructure fragility.
5. **156 open issues, minimal maintenance.** The GitHub repo has 156 open issues as of May 2026. Most recent issues (May 2026) appear to be user-submitted content rather than bug reports, but legitimate bugs go unresolved for months or years. The URL-in-notes-not-clickable bug has persisted for years.
6. **No narrative or context layer.** Shows what a team is, not why. No matchup plans, no role explanations, no EV rationale. For tournament reports and educational content, users must pair a pokepaste link with a separate document (Reddit post, Medium article, etc.).
7. **No accounts, no team management.** No "my pastes" view, no history, no editing after creation. Lose the URL and the paste is effectively gone (no search, no recovery).
8. **No analytics or stats.** No view counts, no popularity metrics, no trending teams. Each paste exists in isolation.

### Emerging Alternatives to PokePaste

| Tool | Key Differentiator |
|---|---|
| **crob.at** | PokePaste alternative + importer. Generates visual preview images with sprites. Produces OG images for Discord/Twitter embeds. Stays up during pokepaste outages. Free, no account required. |
| **VR Pastes** (vrpastes.com) | Password-protected pastes. Open Team List mode (hides EVs/IVs for competitive privacy). Encrypted storage for protected pastes. Addresses the security gap for tournament prep. |
| **VGC Helper** (vgchelper.com) | Team sheet sharing with integrated damage calculator. Mobile-focused. |
| **Falinks Teambuilder** | VGC paste collection with team builder integration. |

---

## 3. Three-Column Comparison Table

| Feature | Pikalytics | PokePaste | VGC Team Report |
|---|---|---|---|
| **Core purpose** | Meta analytics + tools | Team paste sharing | Team report creation + sharing |
| **Usage stats (meta data)** | Yes — monthly, authoritative | No | No |
| **Damage calculator** | Yes — advanced, inline Meta Calcs | No | No (external link) |
| **Speed tiers reference** | Yes — `/speed-tiers` page | No | Yes |
| **Team builder** | Yes — meta-informed suggested sets | No | Yes — Showdown import |
| **Sprite display** | Yes — reliable, current | Broken for many forms | Needs parity verification |
| **Tournament top teams** | Yes — auto-aggregated from Limitless | No | Yes — champion pages |
| **Player-authored narrative** | No | No (notes only, broken URLs) | **Yes — core product** |
| **Matchup plans / gameplan** | No | No | **Yes** |
| **EV spread rationale** | No | No | **Yes** |
| **Team discovery / browsing** | No | No | **Yes — public feed** |
| **User accounts** | No | No | Yes (Clerk auth) |
| **Social: likes/comments/follow** | No | No | Partial (fork/like/comment) |
| **Fork / clone a team** | No | No | **Yes** |
| **Mobile app** | iOS only (Android dead) | No app | PWA |
| **Mobile web** | Functional but not mobile-first | Functional but minimal | Responsive / PWA |
| **Multi-language** | Yes — 8 languages | No | No |
| **Gamification / quizzes** | Yes — 3 quiz types | No | No |
| **Educational articles** | Yes | No | No |
| **Shareable image cards** | Yes — screenshot generation | No | Yes — Wrapped cards |
| **Discord/Twitter embed preview** | No (generic unfurl) | No (no preview at all) | **Opportunity** |
| **OG image generation** | No | No | **Opportunity** |
| **Tiered publishing** | No | No | Yes |
| **Privacy / pre-tournament** | No explicit privacy mode | Yes — URL-only, no search | Public by default |
| **Password protection** | No | No | No (VR Pastes does this) |
| **Open Team List (hide EVs)** | No | No | No (VR Pastes does this) |
| **Import from Showdown paste** | Yes | N/A (is the paste) | Yes |
| **Import from PokePaste URL** | Yes | N/A | Could add |
| **Data freshness** | Monthly (known lag) | Immediate (static) | Real-time (player-authored) |
| **Maintenance health** | Active | Degrading (156+ open issues) | Active |
| **Monetisation** | Ko-fi + iOS app ($0.99) | None | TBD |
| **Open source** | Calc only | Yes (full project) | No |

---

## 4. Top 5 Actionable Gaps VGC Team Report Can Close

### Gap 1 — Dynamic OG images for social sharing (Neither competitor does this)

**Neither Pikalytics nor PokePaste generates dynamic OG images.** Sharing a team URL on Discord or Twitter produces no visual preview with sprites. crob.at is the only tool that does this, and it was built specifically because this gap exists. VGC Team Report should generate a dynamic OG image for every team report showing the 6-mon sprites, team name, and author — making every shared link a visual advertisement for the platform.

**Why it matters:** VGC teams are shared primarily on Discord and Twitter. A rich preview card with sprites makes a link 3-5x more likely to be clicked than a plain text unfurl. This is a greenfield opportunity that neither incumbent serves.

### Gap 2 — Frictionless anonymous share mode (close PokePaste's moat)

PokePaste's zero-friction share is its moat. VGC Team Report requires auth for full reports. Adding a **guest quick-share mode** — paste Showdown export, get a shareable URL with basic rendering and sprites (no login required) — captures the pokepaste use case while funneling users toward the richer report product. Prompt for auth post-share: "Save this to your account to add matchup notes and EV rationale."

**Why it matters:** Activation energy is the #1 barrier. If VGC Team Report can match pokepaste's 10-second paste-to-URL flow while adding better sprites, OG images, and optional narrative, the network effect can start shifting.

### Gap 3 — Privacy/unlisted mode with Open Team List support

PokePaste's privacy-by-default model is a competitive advantage for tournament players. VR Pastes adds password protection and Open Team List (hidden EVs). VGC Team Report should offer: (a) unlisted reports visible only via direct link, (b) Open Team List mode that hides EVs/IVs/natures for sharing with opponents or tournament organizers, and (c) optional password protection for team-only access.

**Why it matters:** High-level players are the community's influencers. If they will not use the tool for tournament prep because their teams become public, the platform loses the most valuable user segment.

### Gap 4 — Inline damage calculator (Pikalytics' strongest lock-in)

Pikalytics' Meta Calcs integration — live calc with meta-sourced threats inside the team builder — is the feature that keeps power users engaged for hours. VGC Team Report currently links to external calcs. Even a read-only calc embed showing key offensive and defensive benchmarks per Pokemon on a report page would close the biggest workflow friction point.

**Why it matters:** Every serious player runs calcs. The tool that hosts the calc owns the session.

### Gap 5 — Import from PokePaste URL (meet users where they are)

Pikalytics already imports from PokePaste URLs. VGC Team Report should do the same: paste a `pokepast.es/xxx` URL and auto-populate the team builder with all 6 sets. This converts the existing library of thousands of shared pokepastes into potential VGC Team Report content. Users can upgrade a pokepaste into a full team report with one click.

**Why it matters:** There are thousands of existing pokepaste URLs circulating in the community. Making it trivial to convert a pokepaste into a rich team report removes the "I already have a pokepaste, why would I re-enter everything?" objection.

---

## 5. Positioning Statements

- **vs Pikalytics:** "Pikalytics tells you the meta. VGC Team Report tells your story in it."
- **vs PokePaste:** "PokePaste shares your team. VGC Team Report explains your team."
- **vs Both:** "The only tool where your team gets a preview card, not just a link."

---

## 6. Monetisation Context

| Tool | Model | Notes |
|---|---|---|
| **Pikalytics** | Ko-fi memberships + iOS app ($0.99) | Community-funded grassroots model. No paywalled features — premium is patronage, not access. Proves paying VGC users exist but are not accustomed to feature-gated paywalls. |
| **PokePaste** | None | Zero revenue. Maintenance debt accumulating (156 open issues, recurring disk failures, creation bugs). Community workarounds (Chrome extension, crob.at) signal the tool is under-resourced. Sustainability risk is real. |
| **VGC Team Report** | TBD (freemium recommended) | Neither competitor paywalls core features. Premium should be additive: report branding/themes, tournament presentation mode, private team vault beyond free quota, bulk export, analytics dashboard. Freemium is the only credible entry — players will not pay for what pokepaste gives free, but they may pay for what pokepaste cannot do. |

---

## 7. Competitive Landscape Shifts Since Last Analysis (May 2026 Update)

1. **crob.at has emerged as a PokePaste upgrade layer** — not a replacement, but an overlay that generates OG preview images and provides backup uptime during pokepaste outages. This validates the OG image gap as a real user need.
2. **VR Pastes has introduced password-protected pastes and Open Team List mode** — features neither PokePaste nor Pikalytics offer. This validates the privacy/tournament-prep gap.
3. **MunchStats continues to exist as a response to Pikalytics' data freshness lag** — confirming that monthly updates are too slow for meta-sensitive players.
4. **Pikalytics has fully adapted to Pokemon Champions' Stat Point system** — calc, builder, and pokedex all use Champions framing. Any new tool must be Champions-native too.
5. **PokePaste's maintenance trajectory is worsening** — 156 open issues, creation failures reported in Feb 2026, recurring disk space outages. The window to capture dissatisfied pokepaste users is widening.
6. **Porygon Labs is emerging as a calc competitor** — now shows real Regulation usage percentages, computed as a weighted average from Pikalytics and tournament data.
7. **PokePaste MCP servers are appearing** — AI/LLM integrations for pokepaste (MCP servers) signal that the competitive Pokemon tool ecosystem is being extended by AI developers. Early mover advantage for AI-native team analysis.

---

## Sources

- https://www.pikalytics.com/
- https://www.pikalytics.com/champions
- https://www.pikalytics.com/team
- https://www.pikalytics.com/topteams
- https://www.pikalytics.com/damage-calculator
- https://www.pikalytics.com/speed-tiers
- https://www.pikalytics.com/speed-quiz
- https://www.pikalytics.com/calc-quiz
- https://www.pikalytics.com/type-quiz
- https://www.pikalytics.com/articles
- https://ko-fi.com/pikalytics
- https://apps.apple.com/us/app/pikalytics-battle-strategy/id1511370166
- https://hypestat.com/info/pikalytics.com
- https://www.similarweb.com/website/pikalytics.com/competitors/
- https://pokepast.es/
- https://pokepast.es/syntax.html
- https://github.com/felixphew/pokepaste
- https://github.com/felixphew/pokepaste/issues
- https://github.com/felixphew/pokepaste/issues/313
- https://www.smogon.com/forums/threads/pokepaste-a-pokemon-pastebin.3601073/
- https://www.smogon.com/forums/threads/pokepaste-image-fix.3733096/
- https://chromewebstore.google.com/detail/pokepastefix/ekceaboabpgkgbpigacngnjagcdhdkmn
- https://crob.at/pokepaste
- https://www.vrpastes.com/
- https://vgchelper.com/
- https://munchstats.com/
- https://www.porygonlabs.com/
- https://www.vgcpedia.com/website/pikalytics/
- https://game-solver.com/pikalytics-battle-strategy/
- https://appsmenow.com/reviews/179024-pikalytics-battle-strategy
