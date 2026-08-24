# R4 — VGC Content-Creator Sentiment: Team Sharing & Team-Report Tools

**Date:** 2026-08-24 · **Agent:** R4 (read-only UX research) · **Method:** WebSearch (X/Twitter, YouTube, articles, competitor sites) + static repo audit
**Predecessor:** `.swarm/r4-creator-sentiment.md` (2026-05-07). This run re-checks that picture, adds the crob.at competitive shift, and grounds every recommendation against the **current** codebase.

> **Egress note:** `pokemonvgcteamreport.com` is blocked from this container. Every claim about our own product below is from **reading source in `/home/user/VGC-Team-Report/src`**, not from the live site. Search engines *did* surface our own indexed pages (`/faq`, `/tournaments`, `/`), which confirms indexing but nothing about runtime behaviour.

---

## 1. Executive summary

Three things changed since the May run, and they all point the same direction:

1. **A direct competitor now owns the exact positioning we were moving toward.** `crob.at` markets itself explicitly as "the best free PokePaste alternative" with sprites, item icons, OG preview images for Discord/Twitter/Reddit, multi-team import, no login, and current **Reg M-B / Champions** support. It has SEO landing pages per format (`/teams/vgc`, `/teams/champions`) and per intent (`/pokepaste-alternative`, `/guide/share-showdown-teams`). This is no longer a gap we can walk into — it is a race.
2. **The distribution channel itself has degraded.** X's 2026 algorithm changes penalise posts containing external links by ~30–50% initial reach, and near-zero median engagement for non-Premium accounts posting links. The documented creator workaround is **post an image, put the link in the first reply.** That makes a downloadable, self-contained, on-brand **image** the primary creator artifact and the link a secondary asset. Our OG image is what gets seen; our page is what gets clicked *second*.
3. **We have already built most of the plumbing** — `/embed/[id]`, `/api/oembed`, `/api/team-graphic` (3 styles), per-share OG image, `TeamCardExport` PNG, creator profiles with avatar/twitter/youtube, `verified_creators`. The remaining gap is not "build sharing features." It is **make the creator's brand, not ours, the thing on the artifact** — and make the outputs fit where creators actually publish.

**One-line thesis:** we are past the "can you share it" stage and into the "whose logo is on it" stage. The five opportunities in §7 are weighted accordingly.

---

## 2. What creators actually use to share teams (2026)

| Channel | Who uses it | What it is |
|---|---|---|
| **Pokepaste** (`pokepast.es`) | Everyone, as the substrate | Plain-text pastebin. Species, item, ability, EVs, nature, Tera, moves. No sprites, no preview, no embed. Still the lingua franca — every other tool *imports* it. |
| **Rental / replica codes** | Wolfey, most tournament players | In-game code. The "free hook" — casual audience can use the team without understanding it. |
| **Patreon** | Wolfey (`WolfeyVGC`), THATSAplusONE | The paywall tier. Full EVs, IVs, spread rationale, hour-long explanation videos. |
| **crob.at** | Growing; positioned at creators | Visual Pokepaste alternative — sprites, item icons, OG preview, multi-team, no login, Reg M-B support. **The new competitor.** |
| **VGCPastes (@VGCPastes) + Sandshrew Bot** | Community aggregation | Volunteer X account collecting *any* paste or rental code shared online; Discord bot with search / get-rental / random-team. Repository ~tinyurl.com/vgcpastes2026 for Champions. Submissions arrive by **DM**. |
| **Victory Road** (`victoryroad.pro`) | Top finishers | Editorial home of long-form team reports + SV rental team library. **Submission is literally "send us a DM over on Twitter."** |
| **Limitless VGC** (`limitlessvgc.com/teams`) | Tournament infrastructure | OTS/team-sheet publication from published events. Players must upload sheets pre-tournament or be dropped. |
| **Pikalytics** | Everyone, for data | Champions VGC 2026 team builder with usage-derived suggested spreads. Data authority, not a sharing surface. |
| **Team-sheet generators** | Tournament attendees | NuzTools `/vgc/dashboard`, The Frontier `/teamsheet` (fills the official 2-page VGC PDF). Purely functional, no sharing. |
| **YouTube description / Discord** | Mid-size creators | Paste link dumped in the description; Discord servers as the real conversation venue. |

### 2a. Creator archetypes and their sharing model

- **Wolfey (@WolfeyGlick) — the funnel.** Public tweet announces result + rental code; the spread rationale lives on Patreon. Observed across years of tweets ("rental code + export are up on the Patreon"; "Team rental code, details, and explanation are up now"). Notably he has *commissioned custom graphics* to make a team approachable for a non-competitive audience (the Jaiden collab tweet) — evidence that top creators will pay for visual team presentation when the built-in options aren't good enough.
- **Cybertron (@CybertronVGC) — the educator.** Free long-form guides, co-founder of VGCguide.com with Wolfey and Aaron Traylor. Growth via accessibility, not gating.
- **Aaron Traylor (@attraylor) — the long-form warstory.** Medium posts: team origin → per-Pokémon breakdown → round-by-round → takeaways. Medium is a hostile host for this: no calc embeds, no sprite rendering, no inline paste.
- **James Baek (@jameswbaek) — live.** Twitch-first, builds on stream. Sharing is ephemeral and verbal; the artifact is the VOD.
- **Mid-size (Moxie Boosted et al.) — the description link.** Lower production overhead, higher volume. These are the creators with the *most* to gain from a tool that removes report-writing effort, and the least brand leverage to lose by using someone else's site.

---

## 3. Friction creators actually mention

Ordered by how load-bearing the evidence is.

1. **Pokepaste has no visual preview and no social embed.** This is the single most-repeated complaint and it is the entire marketing premise of crob.at: "text only, no sprites, no item icons, no visual team preview, no social embeds when pasting links on Discord or Twitter, single-team only." When a creator drops a `pokepast.es` link in Discord or X, the audience sees a bare URL.
2. **Links are now algorithmically penalised on X.** ~30–50% reach loss; near-zero for non-Premium. Creators post images and relegate links to replies. A team-sharing tool whose value is *the link* is fighting the platform.
3. **Report distribution runs on DMs.** Both Victory Road and VGCPastes ingest via Twitter DM. That is a human bottleneck: it gates who gets published on who has social access to an editor, and it means the report a player wrote is trapped until a volunteer processes it.
4. **Writing the report is the expensive part, not sharing it.** Traylor-style reports are hours of work. The reason most top-cut teams never get a written report is effort, not distribution. Every creator who *does* publish is doing unpaid editorial labour.
5. **Multi-team is unsupported everywhere.** Creators covering "5 teams to try this week" have to produce five separate links. crob.at calls this out explicitly (full teambuilder export in one share).
6. **No format continuity.** Champions Reg M-A/M-B uses **SP (66 total, max 32/stat)**, not EVs. Tools that haven't handled the switch produce wrong-looking spreads. crob.at and Pikalytics both advertise Reg M-B support — this is now table stakes, and it is an area where our `convertToChampionsSp` work is a genuine moat if we surface it.
7. **Branding leakage (inferred, high-confidence).** Creators monetise attention. A creator with a Patreon has a direct financial reason not to send their audience to a page watermarked with someone else's domain. This is the friction our own product currently creates — see §4.

---

## 4. Where WE actually stand (source-verified)

### Already built — do not rebuild

| Capability | Location | State |
|---|---|---|
| Per-share OG image | `src/app/s/[id]/opengraph-image.tsx` | Edge `ImageResponse`, with a large Showdown→sprite slug map |
| Share graphic API, 3 styles | `src/app/api/team-graphic/route.tsx` (526 lines) | `?style=compact\|wide\|wrapped` — "wrapped" is a Spotify-Wrapped-style layout |
| oEmbed provider | `src/app/api/oembed/route.ts` | Returns iframe HTML + `thumbnail_url` → `/api/team-graphic?style=wide`, cached `s-maxage=3600` |
| Iframe embed | `src/app/embed/[id]/page.tsx` | Renders sprites + creator name, fixed 200px height |
| PNG team card download | `src/components/ui/TeamCardExport.tsx` | html2canvas, dynamic-imported |
| PDF export | `src/components/ui/PdfExport.tsx` | Present |
| Share modal | `src/components/ui/ShareModal.tsx` | Copy link / **rental code** / Discord-formatted message / raw paste / embed code / download card. Well-instrumented (`team_card_downloaded`) and a11y-correct (`aria-live` copy announcements) |
| Creator profile | `src/app/creator/[name]/page.tsx`, `src/components/social/CreatorProfile.tsx`, `src/app/api/creator/[name]/route.ts` | bio, twitter, discord, youtube, `avatar_url`, follower count, `verified_creators` table |
| Champions SP | `src/lib/analysis/stat-calculator.ts` | `convertToChampionsSp`, budget constants |

**This is a genuinely strong base.** The May report's recommendations have largely landed.

### Confirmed gaps

**G1 — Every exported artifact is watermarked with *our* domain, never the creator's.**
`TeamCardExport.tsx` hardcodes the footer watermark:
```
pokemonvgcteamreport.com
```
`/api/team-graphic/route.tsx` does the same at two places (lines ~361 and ~511). It *does* render `creatorName` (lines ~338–348, ~422–425) as an `@handle` in muted grey `#9898BE` — but the creator is a caption and we are the brand. For a creator whose business is their brand, this inverts the relationship. crob.at doesn't solve this either, so it's still open ground.

**G2 — Creator pages fall back to the generic site OG image.**
`src/app/creator/[name]/page.tsx` `generateMetadata` sets both `openGraph.images` and `twitter.images` to `/opengraph-image` — the generic site card. A creator sharing *their own profile* — the highest-intent share they can make — produces our marketing image with no avatar, no team sprites, no stats. Compare: the per-share route `/s/[id]` has a bespoke OG image. The profile route, which is what a creator puts in a YouTube description or an X bio, does not.

**G3 — The embed is a fixed 200px strip.**
`/api/oembed` hardcodes `height: 200` and `width: 600`; `/embed/[id]` renders a single row of 48px sprites plus a 3-line-clamped summary. Fine as a link unfurl, but it is not an embed a creator can drop into a blog post or Victory Road-style article as *the report*. There's no theme parameter, no size variants, no "full report" embed.

**G4 — No multi-team share object.** Everything is keyed to a single `shareId`. A creator's "5 teams for Reg M-B" post needs five links.

**G5 — Creator profile is name-matched, not claimed.** `route.ts` looks up `creator_profiles` and `verified_creators` by `LOWER(name)`. Profiles are written through `/api/user/profile` (authenticated), but the *join* to public reports is on a free-text display name. There is no visible claim flow that binds "the string `WolfeyGlick` on a report" to "the account that owns that identity." For an outreach push targeting name-brand creators, that is both an impersonation risk and an onboarding blocker — a creator can't be told "your page is already live, claim it."

**G6 — Nothing targets the X image-first workflow.** We produce a good OG image (seen only on unfurl) and a downloadable card. We do not produce the thing the 2026 X workflow wants: a ready-to-post image + pre-written caption + the link staged for the first reply.

---

## 5. What "creator-friendly" concretely means

Synthesising §2–§4, a creator evaluating a team-report tool is asking four questions:

1. **"Does this make me look professional, or does it make *you* look professional?"** → creator logo/avatar/accent colour on the artifact; our mark small or optional.
2. **"Can I post it where my audience is, without a reach penalty?"** → image-first outputs sized for X (16:9), Instagram/TikTok (9:16 — note the existing `wrapped` style is already close), Discord, and YouTube thumbnails/end-cards.
3. **"Does it save me the part I hate?"** → the report *writing*: damage calcs, speed tiers, matchup notes generated from the paste, so the creator only supplies narrative.
4. **"Do I keep my audience?"** → links back to their Patreon/YouTube/Twitch from the report; a profile page that is a real landing page, not a listing.

Point 3 is where we structurally beat crob.at. crob.at is a *renderer* — it makes a paste pretty. We are an *analyst* — speed tiers, damage calcs, Champions SP conversion, matchup notes. crob.at cannot follow us there cheaply. Our positioning should not be "prettier Pokepaste" (that fight is now contested); it should be **"the report writes itself."**

---

## 6. Competitive read: crob.at

Worth a standing watch. What it has that we should note:
- Zero-friction entry: **no login**, paste a `pokepast.es` URL or raw export.
- Format-scoped SEO landing pages: `/teams/vgc`, `/teams/champions`, plus intent pages `/pokepaste-alternative`, `/guide/share-showdown-teams`, `/random-team`.
- Multi-team import from a full Showdown teambuilder export.
- Explicit current-format claim (Reg M-B) *and* historical regulations, plus Smogon OU / National Dex — broader than VGC-only.
- A browse surface of community-shared teams.

What it lacks: analysis (no speed tiers, no damage calcs, no matchup notes), no creator profiles, no report narrative, no PDF/team-sheet output, no Champions SP semantics beyond rendering. Our differentiation is intact but our *entry friction* is worse if we require auth to share.

Also newly visible in this space: `pokesynergy.app/teams` (archives winning builds from Limitless events), `pokepro.co`, `buildpokemonteam.com`, and a "PokePaste MCP" for LLM-driven team building — the long tail is filling in fast.

---

## 7. Five concrete opportunities

Ranked by (creator pull × differentiation) ÷ effort.

---

### O1 — Creator-branded export artifacts ("your logo, our engine") — **M**

**Problem:** G1. Every PNG/OG artifact is stamped `pokemonvgcteamreport.com`; the creator's name is grey 9px caption text. Creators monetise brand and will not hand their audience to our watermark.

**Do:** Add optional creator branding to `TeamCardExport.tsx` and `/api/team-graphic/route.tsx` — creator avatar (already on `creator_profiles.avatar_url`), display name promoted to a primary type slot, an accent-colour token, and their `@handle` for X/YouTube. Demote our watermark to a small, fixed-position mark (keep it — attribution is the growth loop — but stop making it the loudest thing in the corner). Gate the avatar/accent on a **verified or claimed** profile so it can't be spoofed.

**Why M:** two render paths (React DOM via html2canvas, and Satori/`ImageResponse` in the edge route) must be kept visually identical; remote avatar fetching inside `ImageResponse` needs an allowlist + size cap; needs a colour-contrast guard so a creator-chosen accent doesn't break the 4.5:1 standard.

**Signal it worked:** `team_card_downloaded` rate among reports with `creatorName` set.

---

### O2 — Per-creator OG image for `/creator/[name]` — **S**

**Problem:** G2. The highest-intent share a creator makes — their own profile link, in a YouTube description or X bio — unfurls as our generic marketing card.

**Do:** Add `src/app/creator/[name]/opengraph-image.tsx` following the existing `s/[id]` pattern (reuse the sprite slug map — consider lifting it to `src/lib/` since it's about to have three consumers). Render: avatar, display name, verified tick if in `verified_creators`, report count, follower count, and sprites from their most recent public team. Then point `generateMetadata`'s `openGraph.images` / `twitter.images` at it instead of `/opengraph-image`.

**Why S:** the pattern, the data query (`/api/creator/[name]/route.ts` already returns exactly these fields), and the slug map all exist. This is assembly, not invention. **Highest ratio of the five — do it first.**

---

### O3 — "Post-ready" share kit built for the X image-first workflow — **M**

**Problem:** G6 + §3.2. X penalises link posts 30–50%; creators post an image and put the link in reply one. Our share modal is link-centric.

**Do:** Extend `ShareModal` with a "Post kit" section: (a) one-tap download of the graphic in **X 16:9**, **story/Shorts 9:16** (the `wrapped` style is nearly there), and **square**; (b) a copyable caption pre-filled with result/tournament/placement and *no* URL; (c) a separate "reply text" containing the link. Mirror the existing Discord-formatted-message affordance, which already proves the pattern works. Add `?style=` variants to `/api/team-graphic` rather than new endpoints.

**Why M:** mostly layout variants on an existing 526-line renderer plus modal UI; needs `ui-checklist-reviewer` (touch targets, one primary CTA, focus order in an already-busy modal).

---

### O4 — Claimable / verified creator profiles — **M**

**Problem:** G5. Profiles join to reports on a free-text `LOWER(name)`. No claim flow ⇒ no credible outreach ("your page is live, claim it"), no safe basis for O1's branding, and a live impersonation vector if we start promoting creator pages.

**Do:** A claim flow binding an authenticated user to a creator name — verify via a link on their X/YouTube profile pointing back at us, or a one-time code in a bio/description (the same trick every creator platform uses; no API keys needed). On success, write to `verified_creators` and unlock O1 branding + O2 verified tick. Add a rel-me / backlink to their Patreon/Twitch from the profile so they keep their audience (§5.4).

**Why M:** DB + auth + a verification worker, and a moderation path for disputes. Contained, but it is real backend work with an abuse surface. **Prerequisite for outreach at Wolfey/Cybertron tier — do not run a name-brand outreach campaign before this ships.**

---

### O5 — Multi-team collections ("Reg M-B: 5 teams to try") — **L**

**Problem:** G4 + §3.5. Everything is keyed to one `shareId`. crob.at ships multi-team from a full teambuilder export; creators covering several teams per video need one link, not five.

**Do:** A `collections` concept — ordered set of shares, own share ID, own OG image (grid of team thumbnails), own oEmbed, own creator attribution. Accept a full Showdown teambuilder export (multiple `===` blocks) at import.

**Why L:** new DB table + migration, new route + OG + oEmbed + embed variants, parser work for multi-team pastes, and it touches `explore`/`creator` listing surfaces. Also brushes the **Neon 512MB free-tier** guardrail — collections should store share *references*, never duplicated team JSON. (Precedent: `share_versions` snapshots ate 447MB in July 2026.)

---

### Sequencing

**O2** (S, immediate) → **O1** (M, the differentiator) → **O3** (M, meets the platform where it is) → **O4** (M, gate for outreach) → **O5** (L, only if creator demand is evidenced).

Note the dependency: **O1's avatar/accent branding should ship behind O4's verification**, or ship O1 first using only the *self-entered* profile fields already scoped to an authenticated user, and add avatar/accent when O4 lands.

---

## 8. Caveats

- Search-tool summarisation stands between me and most primary sources; direct quotes above are those the tool surfaced verbatim from tweet titles. Individual creator tweets from 2023–24 were easy to retrieve; **fresh Aug-2026 creator commentary was thin** — X content is poorly indexed for this kind of search. Treat §3.7 (branding leakage) as well-reasoned inference, not a sourced quote.
- One search collided with "VGC = Video Games Chronicle" and returned nothing usable on rental-code expiry friction; that question is unresolved.
- All product claims are from source reading only — the live site was unreachable (egress-blocked). Anything about runtime behaviour should be re-verified against production.
- No outreach was sent. A pilot pitch is drafted at `.swarm/drafts/r4-creator-pilot-pitch-24-08-26.md` for human review.

## Sources

- [crob.at — Visual Pokémon Showdown Team Sharing](https://crob.at/)
- [crob.at — Best PokePaste Alternative: Visual Team Sharing](https://crob.at/pokepaste-alternative)
- [crob.at — How to Share a Pokémon Showdown Team](https://crob.at/guide/share-showdown-teams)
- [crob.at — Pokémon Champions VGC 2026 Reg M-B Teams](https://crob.at/teams/vgc)
- [VGC Pokepastes (@VGCPastes) on X](https://x.com/vgcpastes)
- [VGCPastes — account purpose: collect any paste or rental code shared online](https://x.com/VGCPastes/status/1501920960672272387?lang=en)
- [VGCPastes — Champions M-B repository update](https://x.com/VGCPastes/status/2043019220095734204?lang=en)
- [Sandshrew Bot — Discord App Directory](https://discord.com/discovery/applications/964203274695745636)
- [Victory Road — Team Reports for VGC (submission via Twitter DM)](https://victoryroad.pro/sv-reports/)
- [Victory Road — Team Reports category](https://victoryroad.pro/category/articles/reports/)
- [Victory Road — SV Rental Teams](https://victoryroad.pro/sv-rental-teams/)
- [Limitless VGC — Teams](https://limitlessvgc.com/teams)
- [Limitless — VGC THESE HANDS (open team sheet rules)](https://play.limitlesstcg.com/tournament/63c712e1f61c172bc031cd19/details)
- [Pikalytics — Pokémon Champions VGC 2026 Team Builder](https://www.pikalytics.com/team)
- [Wolfey — "rental code + export are up on the Patreon"](https://x.com/WolfeyGlick/status/1705982747133489612?lang=en)
- [Wolfey — "Team rental code, details, and explanation are up now"](https://x.com/WolfeyGlick/status/1842944947391230276)
- [Wolfey — commissioned team graphics for a non-competitive audience](https://x.com/WolfeyGlick/status/1498380083278532612?lang=en)
- [Charlotte Regionals Champion Team | WolfeyVGC on Patreon](https://www.patreon.com/posts/charlotte-team-96999929)
- [Wolfe Glick — Wikipedia](https://en.wikipedia.org/wiki/Wolfe_Glick)
- [Moxie Boosted — YouTube](https://www.youtube.com/@MoxieBoosted)
- [X (Twitter) Algorithm: Ranking Factors & Growth Tips (August 2026) — SocialPilot](https://www.socialpilot.co/blog/twitter-algorithm)
- [X (Twitter) Algorithm 2026 — Teract](https://www.teract.ai/resources/twitter-algorithm-2026)
- [The X Algorithm in 2026: What Actually Makes Posts Go Viral — OpenTweet](https://opentweet.io/blog/how-twitter-x-algorithm-works-2026)
- [NuzTools — VGC Team Builder Dashboard](https://nuztools.net/vgc/dashboard)
- [The Frontier — Team Sheet Generator](https://thefrontiervgc.com/teamsheet)
- [PokeSynergy — Best Pokemon Champions Teams (VGC 2026)](https://pokesynergy.app/teams)
- [Smogon — Team Reports forum](https://www.smogon.com/forums/forums/team-reports.680/)
