# R2 — Competitor Teardown: VGCPastes, Limitless VGC, Trainer Hill
Date: 2026-06-22
Scope: Read-only research. Draft only — implementation deferred to Wave 2.

---

## 0. Executive context

VGC Team Report's positioning today:
- `/champions` (mega meta hub), `/explore` (team discovery), `/compare` (team vs team), `/creator` (creator hub), `/dashboard` (signed-in user), `/report` (per-team analytics), `/tournaments`
- Capabilities: PWA, embed cards, share links with OG images
- Persona: VGC player who wants *insights and shareable reports* — not just a tournament archive, not just a paste host

The three competitors investigated here occupy adjacent — not identical — territory:
- **VGCPastes** = community-curated paste repository (Google Sheet + Twitter front-door)
- **Limitless VGC** = authoritative tournament/results database
- **Trainer Hill** = personal analytics ("how am I doing?") — primarily TCG but pattern is relevant

Each one beats us at exactly one job. None of them beats us at *insight delivery for shareable team reports*. The opportunity is to absorb their highest-value workflows without diluting our core.

---

## 1. VGCPastes — `vgcpastes.com` / `@VGCPastes` / public Google Sheet

### 1.1 What it is
Community-driven repository of competitive VGC teams, organized per regulation set (currently Reg M-A / M-B for Champions, previously Reg G/H/I for Scarlet & Violet). Lives primarily as a public Google Sheet + a Twitter/X account that announces updates. Castorbrown and the VGCPastes team manually transcribe tournament Top Cut teams from Twitter rental codes, Bilibili VODs, and tournament streams into the sheet.

Latest activity: Reg I had 63 teams as of April 2026; Champions M-A repository launched and is being filled with rental replica codes.

### 1.2 Core features (top 10)
1. **Per-regulation tabs** (one Google Sheet tab per Reg set) — instant pivot when format changes
2. **Tournament-tagged rows** — every team has event, placement, player handle, country
3. **Pokepaste link per team** — one click to Showdown-importable text
4. **Replica/rental code per team** (Champions era) — copy code, load team in-game
5. **Sprite preview row** — six little sprites visible without opening the paste
6. **Item / Tera / ability metadata in the row** — scannable without expanding
7. **Twitter announcement firehose** — every batch update broadcast to ~30k followers
8. **Discord submission funnel** — community can submit a paste to be added
9. **Spreadsheet filtering** — Google Sheets native filter views (by Pokemon, by event)
10. **Free, no login, no app** — the lowest-friction discovery tool in the entire VGC ecosystem

### 1.3 Share UX flow
1. User opens the Sheet link (typically shared via Twitter, Discord, or a Reddit thread)
2. Ctrl+F to find a Pokemon or player
3. Click the cell with the pokepaste URL → opens pokepast.es
4. Copy text from pokepast.es → paste into Showdown teambuilder
5. (Champions era) Copy replica code → enter in-game

Share *outward*: copy the Sheet URL or the individual pokepaste URL. There is no per-team OG image, no embed widget, no in-app share sheet.

### 1.4 Monetization
**None.** Zero ads, zero subscriptions, zero Patreon. Pure volunteer / community labor of love. Costs are effectively a Twitter account and a Google account.

### 1.5 What they do better than us
- **Authority and trust** — when a paste appears in VGCPastes it is treated as canon
- **Coverage breadth** — they index *every* Top Cut from *every* regional + nationals + Worlds + Battle Stadium ladder snapshot
- **Twitter distribution** — a single tweet from `@VGCPastes` lands in front of half the competitive scene within hours
- **Format pivot speed** — they had Champions M-A teams in the sheet within days of the format going live
- **Zero-friction discovery** — Ctrl+F a Google Sheet beats any custom search UI for raw speed

### 1.6 What they do worse than us
- No insight layer — it's a list of teams, not analysis of *why* a team works
- No visual team cards — sprites are tiny, no Tera/item icons sized for skimming
- No comparison, no matchup data, no usage stats
- Spreadsheet UX is hostile on mobile (the maintainers themselves acknowledge it; they share alternate per-Pokemon filter links)
- No personalization, no saving, no notes, no creator attribution beyond a Twitter handle
- No SEO surface — Google doesn't index spreadsheet cells, so they get zero organic search traffic
- No OG images, no embeds, no rich link previews on Discord (the pokepaste link does that, not the Sheet)

---

## 2. Limitless VGC — `limitlessvgc.com`, `play.limitlesstcg.com`, `standings.limitlessvgc.com`

### 2.1 What it is
The authoritative tournament results database for competitive VGC. Part of the broader Limitless TCG empire (Pokemon TCG, One Piece, Digimon, Lorcana, Star Wars Unlimited, Riftbound, etc.) Limitless TCG is the dominant tournament-organizer software for competitive card games; Limitless VGC is the read-side database for VGC events that flow through the platform plus events that are manually ingested.

Footprint cited on the platform: 346+ tournaments, 71,000+ recorded battles across the catalog.

### 2.2 Core features (top 10)
1. **Tournament database** — every regional, international, nationals, Worlds, plus 3rd-party online events
2. **Player ranking ladder** — global ranked list by season points
3. **Player profiles** — career results, head-to-head history, teams used
4. **Pokemon rankings** — usage % across tournaments, sortable by format/region/season
5. **Team detail page** — every Top Cut team with full EV spread, item, Tera, ability
6. **Standings / pairings live** — running tournaments display live brackets
7. **Tournament filtering** — by season, format (Reg M-A vs M-B), region, prize tier
8. **Organizer-facing tooling** — `play.limitlesstcg.com` is the actual TO software (Swiss pairing, decklist submission, scorekeeper apps)
9. **Cross-game search** — same engine indexes TCG, One Piece, Lorcana, etc.
10. **Patreon ad-removal tier** — only monetization touchpoint

### 2.3 Share UX flow
1. User lands on `limitlessvgc.com` from a Twitter result post
2. Clicks tournament → scrolls Top Cut
3. Clicks player → sees their team's six-mon detail page
4. Copies team text (manual select-all on the team block) OR uses the "send to Team Builder" link
5. Shares back outward by copying the URL — link previews exist but are minimal

There is no native "share to X" button, no embed widget, no per-team OG image (link previews are generic site OG).

### 2.4 Monetization
- Display ads (banner / inline) on the read-side site
- **Patreon → ad-free**, no usage limits or premium features behind it
- Organizer side (`play.limitlesstcg.com`) appears free for TOs; revenue model is ads on read-side + sponsorship of marquee events (Limitless ran a $1000 VGC23 Series 1 sponsored by them)

### 2.5 What they do better than us
- **Authoritative tournament data** — they *are* the source of truth, not a derived view
- **Player identity layer** — career profiles with persistent identity across events
- **Live tournament integration** — they run the events, so data is real-time, not scraped
- **Cross-format reuse of UI** — the same shell handles 10+ card games; engineering leverage is enormous
- **Brand trust** — `limitlessvgc.com/tournaments/399` is the URL anyone shares for Worlds 2025
- **SEO** — every player name, every tournament, every Pokemon is a long-lived indexed page

### 2.6 What they do worse than us
- Aesthetic is utilitarian / table-heavy — no visual storytelling, no team cards optimized for mobile share
- No insight layer beyond raw stats (no "this team's win condition is X" narrative)
- No team comparison tool
- No mega-format hub like our `/champions` page
- No PWA / installable app
- No share-optimized OG images per team or per player
- No creator-side experience (we have `/creator`; they treat humans as data rows)
- No embed widgets for blogs/Twitter/Discord embeds beyond stock OG
- No personalization — signed-in is for TO/scorekeeper, not for fan/player

---

## 3. Trainer Hill — `trainerhill.com` + `plus.trainerhill.com`

### 3.1 What it is
Personal analytics suite primarily for Pokemon **TCG** players, with the same patterns directly transferable to VGC. Run by a small team (Trainer-Hill on GitHub). Best read as the "Strava for competitive Pokemon" — instrument your own play, see your own stats. They have not yet shipped first-class VGC support, though the Battle Journal data model is game-agnostic enough that the gap is bridgeable.

### 3.2 Core features (top 10)
1. **Battle Journal** — log every match (deck, opponent's deck, result, notes, sideboarding decisions)
2. **Cross-device sync** — log on phone at the event, review on laptop at home
3. **Personal meta winrate** — your winrate vs each archetype in the field
4. **Custom archetype labels + tags** — tag a match "Reg M-A meta call", "vs paradox stall", etc.
5. **Tier list builder** — drag-and-drop, with tournament meta % overlays, shareable
6. **Badge maker** — customizable player badge (sport / esports skeuomorph)
7. **Discord announcements channel** — weekly meta updates + event recaps
8. **Tournament data ingest** — meta percentages from recent events feed the tier list builder
9. **Battle Journal+** — Patreon-exclusive tier with multi-game support + advanced analytics
10. **Open-source posture** — GitHub org is public, builds community goodwill

### 3.3 Share UX flow
1. User builds a tier list or badge in the web tool
2. Generates a share URL (tier lists have a "publish" step that yields a public read URL)
3. Drops URL into Twitter / Discord
4. Tournament Battle Journal entries are private by default — share UX is "screenshot your dashboard"

This is the weakest share story of the three competitors. Trainer Hill is built around *self-observation*, not *broadcast*.

### 3.4 Monetization
- **Patreon tiers** — Battle Journal+ is the headline lock
- No display ads visible
- Cross-game expansion (One Piece, Lorcana, etc.) is the bet that grows the addressable Patreon base

### 3.5 What they do better than us
- **Personal data loop** — they capture the user's own match history, which is enormously sticky
- **Tier list builder UX** — drag-and-drop with meta % overlays is genuinely delightful
- **Patreon framing** — "support the indie tool" is a more sympathetic ask than ads
- **Badge maker is a viral hook** — players post their custom badge on Twitter, free top-of-funnel
- **Open-source signal** — public GitHub org earns trust we don't currently project

### 3.6 What they do worse than us
- **No VGC support yet** — the entire format we live in is unaddressed
- No team-sharing layer (it's a private journal, not a social paste hub)
- No tournament database depth (relies on imported meta %s)
- No mega-format / Champions-specific hub
- No automated insights — the user has to interpret their own data
- Tier list builder is the only outward-facing surface; everything else is locked behind auth
- No team comparison
- No OG-image-optimized share cards
- No PWA-quality mobile install experience

---

## 4. Capability matrix (vs VGC Team Report)

| Capability | VGCPastes | Limitless VGC | Trainer Hill | **VGC Team Report** |
|---|:-:|:-:|:-:|:-:|
| Tournament results DB | weak (manual) | strong | weak | medium |
| Per-team paste/import | strong | strong | n/a | strong |
| Visual team cards | weak | weak | n/a | **strong** |
| Mega/Champions hub | n/a | weak | n/a | **strong (/champions)** |
| Team comparison | n/a | n/a | n/a | **strong (/compare)** |
| Insight narrative per team | n/a | n/a | n/a | **strong (/report)** |
| Creator hub | n/a | n/a | n/a | **strong (/creator)** |
| Per-team OG share image | n/a | n/a | weak | **strong** |
| Embed widget | n/a | n/a | n/a | **strong** |
| PWA / installable | n/a | n/a | n/a | **strong** |
| Player identity / profile | n/a | strong | medium | medium |
| Personal match journal | n/a | n/a | **strong** | n/a |
| Tier list builder | n/a | n/a | strong | weak |
| Pokemon usage % rankings | n/a | strong | weak | medium |
| Replica/rental code per team | strong | medium | n/a | weak |
| Twitter distribution firehose | strong | strong | medium | weak |
| Free / no-login default | strong | strong | partial | strong |
| SEO surface | weak | strong | weak | medium |

---

## 5. Top 3 features WE should adopt

Selected for highest leverage on our existing stack (Next.js 16 SSG + Vercel), highest pull-through to share/embed (our differentiator), and highest defensibility against the three competitors above.

### Recommendation 1 — Replica/Rental Code surface, per team

**What:** First-class field for the Pokemon Champions in-game replica code (and SV rental code legacy support) on every team object. Surfaced on the team page, in the embed card, in OG image, and as a one-tap copy on mobile.

**Why:**
- Champions transition (April 2026) made replica codes the *primary* in-game team distribution channel — bigger than pokepaste text for Switch-bound players
- VGCPastes' entire 2026 advantage is they have replica codes and we don't surface them prominently
- One-tap copy + visible code is a 1-day visual change with massive perceived value
- Strengthens our share story: a tweeted share card with a visible replica code is instantly actionable

**Scope estimate (Wave 2 sizing):**
- Schema: 1 nullable string column (Champions replica code) + 1 nullable string (SV rental code) — half day
- Ingest / creator entry UI: add field in `/creator` and team edit modal — half day
- Display: surface on `/report/[teamId]`, on team cards in `/explore`, in `/compare` — 1 day
- OG image: render the code at the bottom of the share card — half day
- Embed widget: copy button with success state — half day
- Backfill from existing pokepaste-only teams: out of scope; new teams + opt-in retrofit
- **Total: ~3 dev days**, very low risk

### Recommendation 2 — Tier List Builder (Champions meta)

**What:** Drag-and-drop tier list builder for the current Reg M-A / M-B Champions Pokemon pool, with our `/champions` usage % data overlaid as live meta context. Publishable to a stable share URL with auto-generated OG image. Anonymous-allowed; signed-in users save tier lists to `/dashboard`.

**Why:**
- Trainer Hill has proven this is a high-engagement, high-viral mechanic — players love posting tier lists
- We already have the Pokemon roster + usage % data wired through `/champions` and `/explore` — the data layer is free
- A tier list is a perfect OG-image vehicle (our differentiator)
- Currently *nobody* in the VGC scene has a polished, Champions-specific tier list builder. Trainer Hill is TCG-only.
- Direct top-of-funnel: each shared tier list is an ad for the site

**Scope estimate:**
- Tier list UI: dnd-kit drag-drop grid with 4–6 tiers (S/A/B/C/D/F) — 2 days
- Data hookup: pull mega-eligible Pokemon list + thumbnail sprites from existing data — 0.5 day
- Persistence: tier list as a JSON blob on Supabase, slug-based URL — 1 day
- OG image: composite tier rows into our existing OG renderer — 1 day
- Embed widget variant (read-only iframe of a tier list) — 1 day
- Auth-aware "save to dashboard" path — 0.5 day
- **Total: ~6 dev days**, medium risk (dnd a11y needs care per UI/UX standards)

### Recommendation 3 — Player Profile + Tournament Result attribution

**What:** Lightweight player profile pages (`/player/[handle]`) that aggregate (a) any teams the player has submitted to us via `/creator`, (b) any tournament Top Cut entries we ingest from Limitless VGC's public results, (c) badges for placements. Crucially: each team page gains a "played by" attribution chip linking to that profile.

**Why:**
- Limitless VGC's strongest moat is *identity*. They own the answer to "what teams has Marco Silva run?" — we own zero of that today
- Layered on our existing creator hub, this is mostly relational glue not net-new infra
- Player profile pages are massive SEO surface — every name becomes an indexed page
- Closes the loop with creators: creators want their name on their teams, with a portfolio view
- Unlocks future features cheaply: "follow a player", "alert me when X publishes a new team", leaderboards

**Scope estimate:**
- Schema: `player` table (handle, display name, country, socials), `team_attribution` join — 1 day
- Limitless data ingest: scrape or polite scrape of public tournament results into our DB (no scraping of `play.limitlesstcg.com` paywalled/login pages — only public read URLs); start with manual import script for top events — 2 days
- `/player/[handle]` SSG page — 1.5 days
- Attribution chip on team pages + creator hub linkup — 1 day
- OG image for player profile (avatar, top result, top team thumbnail) — 1 day
- Backfill: top 50 players initially, expand by automation — ongoing
- **Total: ~6.5 dev days for v1**, medium risk (data ingest is the unknown; legal/ToS — Limitless results pages are public so attribution-with-link is defensible)

### Honorable mentions (not in top 3)
- **Twitter firehose** — auto-tweet new high-quality team submissions. Low effort, high distribution. Should pair with Rec 1.
- **Personal Battle Journal lite** — Trainer Hill's mechanic, but is a different product surface (logged-in retention vs. broadcast). Defer to a later wave; doesn't compound with our differentiators yet.
- **Badge maker** — viral hook, but feels off-brand for "team report" positioning. Revisit after Rec 3 makes player identity a first-class concept.

---

## 6. Defensive posture summary

- **Versus VGCPastes:** they will always have authority for raw paste curation. Don't fight that; integrate. Display a "Also indexed by VGCPastes" badge with a deep link when a team exists in both. Make our visual layer + insight layer worth the extra click.
- **Versus Limitless VGC:** they will always have tournament data depth. Don't fight that either; cite and link them where appropriate, build adjacent value (insights, share cards, creator hub, mega-format hub) that they show no signs of building.
- **Versus Trainer Hill:** they don't do VGC yet. The window to claim the "VGC tier list builder" surface (Rec 2) is open *now* and probably narrow.

## 7. Sources

- https://x.com/VGCPastes (VGCPastes announcements)
- https://www.scribd.com/document/763189040/VGCPastes-Repository-SV-Regulation-G (archived sheet snapshot)
- https://limitlessvgc.com/ (read-side site; 403'd to WebFetch but searchable)
- https://limitlessvgc.com/teams
- https://limitlessvgc.com/players
- https://play.limitlesstcg.com/tournaments?game=VGC
- https://standings.limitlessvgc.com/
- https://labs.limitlesstcg.com/ (Limitless Labs — TCG analytics)
- https://www.trainerhill.com/
- https://plus.trainerhill.com/ (Battle Journal+)
- https://www.trainerhill.com/tools/tier-list
- https://www.trainerhill.com/tools/battle-journal
- https://github.com/Trainer-Hill
- https://pokepast.es/ (referenced for share-target context)
- https://crob.at/pokepaste (visual paste alternative — corroborates importance of visual share cards)
