# R4: VGC Creator Sentiment Research
*Research date: 2026-05-08 | Swarm agent: r4*

---

## 1. How Top Creators Currently Share Teams

### The Standard Post-Tournament Workflow

After finishing a tournament, top VGC creators follow a well-established (but fragmented) multi-step sharing process:

1. **Twitter/X announcement post** — "Finished X-Y, here's my team" with results
2. **PokePaste link** — plain text export with EVs/IVs/moves, no strategy context
3. **Rental code** — gated behind Patreon (for paid creators) or tweeted freely by others
4. **YouTube video** — full team breakdown video days or weeks later with descriptions in the video body rather than a structured report

**Key observation**: There is no single tool that handles all four steps. Creators manually stitch together Twitter, PokePaste, Patreon, and YouTube with no unified analytics or canonical "team page."

### Creator-Specific Patterns

**WolfeyVGC (Wolfe Glick)**
- Active Patreon (~2,200 patrons, estimated $9,000/month revenue)
- Post-tournament flow: tweets result + Patreon link → patrons get rental code + EV spreads within one week
- Example tweet: "I've posted the rental team and EV spreads on Patreon!" (links to patreon.com/WolfeyVGC)
- Some teams tweeted publicly with rental code attached (non-Patreon exclusive when promoting)
- Source: x.com/WolfeyGlick/status/1749559261120569637, x.com/WolfeyGlick/status/1842944947391230276

**CybertronVGC (Aaron Zheng)**
- Shares team paste links directly in tweets and YouTube descriptions
- Credits team creators when covering other players' teams (tweet: "Team Creator: @BehzadVgc Rental Code: R5C")
- No dedicated Patreon-gating of team content — open sharing model
- Commentator role means he promotes others' teams as well as his own
- Source: x.com/CybertronVGC/status/1899560768536031475

**James Baek**
- YouTube channel focused on high-level battle analysis
- Created a detailed video on his 10th-place 2025 Worlds team ("How I Built My 10th Place Pokémon VGC 2025 Worlds Team")
- Shares teams through YouTube descriptions + Twitter posts
- Less Patreon-focused, more open community sharing

**THATSAplusONE (Phillip Wingett)**
- Heavy Patreon gating — virtually every rental code and PokePaste is Patreon-exclusive
- Very high posting frequency: tournament teams, fun/creative builds, ranked teams
- Posts announce teams on public YouTube, rental code paywalled to Patreon

---

## 2. Current Sharing Ecosystem

### Tools in Use (ranked by ubiquity)

| Tool | Role | Friction |
|------|------|----------|
| PokePaste (pokepast.es) | Text export of team stats | No strategy notes, no images, no matchup context, broken sprites for newer Pokemon |
| Twitter/X | Announcement + rental code drop | 280-char limit; no way to embed full team; no persistent structured URL |
| Patreon | Monetized team access | Paywall creates friction; no discovery beyond existing fans |
| YouTube descriptions | Team strategy context | Unstructured text; buried; no linking to live calculator |
| Victory Road (victoryroad.pro) | Curated team reports from top placers | Editorial gatekeeping; requires invitation; slow to publish |
| Smogon Team Reports | Community write-up forum | High effort; niche audience; no rental code integration |
| VGCPastes (@VGCPastes on X) | Community aggregator | Twitter bot collecting pastes; spreadsheet-based repository; no search by stat |
| VGC.tools | Community team library | Browser + Showdown focused; no detailed report format; no rental code field |
| VGC Helper (app) | iOS/Android app | Added team image sharing in v1.2.0 — good UX on mobile |

### PokePaste Specific Friction (from Smogon community threads)
- **No images for newer DLC Pokemon** — community built a Chrome extension as a workaround
- **No clickable/linkable URLs in notes** — users can't put a readable strategy URL in the notes field without inspect element
- **No direct import to Showdown from URL** — users must copy/paste the entire text export
- **No matchup notes or strategy context** — pure stat dump only
- **No creator attribution page** — a paste has no creator profile or tournament result attached

---

## 3. Monetization Patterns

### The Standard VGC Creator Monetization Stack

1. **YouTube AdSense** — Battle videos, team showcases, tournament coverage
2. **Patreon (primary)** — Rental codes + EV spreads are the core recurring hook
   - Wolfey: ~$9k/month estimated from ~2,200 patrons
   - THATSAplusONE: every individual team post is a Patreon post
3. **Sponsorships** — Peripheral sponsors (gear, etc.), occasional TCG Player / card sponsors
4. **Twitch subs** — Secondary; most VGC creators are primarily YouTube

### The Rental Code + Patreon Model

The rental code is the VGC creator's equivalent of an "exclusive track" for musicians. It turns competitive results into recurring Patreon revenue:

- Creator performs well at tournament
- Tweets result to build hype
- Posts full rental code + EV spreads to Patreon only
- Fans who want to "play the exact team" must subscribe

**Friction in this model:**
- Rental codes are perishable (tournament format changes make old codes useless)
- No analytics on how many people actually used the team
- Patreon is a wall that prevents wider distribution and discovery
- No way to know if your team went viral or was only used by 50 people

---

## 4. What Creators Say About Existing Tools

Direct evidence of sentiment is limited since creators rarely tweet explicitly about tool friction (they use what exists). However, indirect signals are strong:

### Signals That Current Flow Is Suboptimal

1. **@VGCPastes was created because PokePaste + Twitter alone is insufficient.** A dedicated account manually aggregates pastes from Twitter because there is no tool that does this automatically. The repository is maintained in a Google Spreadsheet (as of 2025 supporting Regulation I with 63 teams).

2. **VGCHelper added team image sharing** (v1.2.0) because the community wanted shareable visual team previews for social media — something PokePaste couldn't provide.

3. **crob.at exists as a PokePaste alternative** specifically offering visual sprites + shareable clean links because the community found PokePaste too bare-bones.

4. **Victory Road editorially filters team reports** — only top-placing players get featured. The large majority of competitive players who want to publish a team report have no well-designed home for it.

5. **Smogon Team Reports is high-effort, low-distribution** — writing a Smogon thread requires significant effort and reaches a niche forum audience rather than Twitter or YouTube followers.

6. **Wolfey's workflow shows the gap clearly**: Tweet result → link to Patreon → Patreon post contains separate rental code + separate EV spreads in unstructured text. No single page that shows: player profile + tournament result + rental code + full team report + matchup notes.

---

## 5. What Would Make Creators Use a New Tool

Based on research synthesis:

### Must-Haves (table stakes)
- **Import from PokePaste/Showdown export** — zero friction entry, they already have the paste
- **Rental code field** — critical for the Patreon-replacement or complement use case
- **Visual team display** — sprites/renders for social media sharing
- **Shareable URL** — one clean link to tweet (e.g. pokemonvgcteamreport.com/team/abc123)

### High-Value Differentiators
- **Patreon integration or "unlock" gate** — allow creators to set a public preview with EV spreads/rental gated behind a paywall (or free-with-email-gate)
- **Tournament result field** — "Used this team to go X-2 at [Regional], Top 8" gives context that PokePaste cannot
- **Creator profile page** — aggregated list of all teams a creator has shared, their tournament history
- **Analytics dashboard** — view count, copy count, Showdown import count ("1,200 people copied this team")
- **Matchup notes section** — brief text per matchup/archetype (replacing the unstructured YouTube description)
- **Speed tier + damage calc links embedded** — instead of forcing users to go to a separate calculator

### Nice-to-Haves
- Discord bot integration (Sandshrew Bot model but for the platform)
- "Try on Showdown" one-click import
- Export to tournament registration sheet format
- Season-tagged archive (teams marked as Reg G, Reg H, etc.)

---

## 6. Competitor Landscape Summary

| Tool | Strengths | Gaps vs VGC Team Report |
|------|-----------|------------------------|
| PokePaste | Universal standard; zero friction | No strategy; no images; no creator identity |
| VGC.tools | Community library; browseable | No detailed report; no rental code; no Patreon hook |
| Victory Road reports | High credibility; editorial quality | Gatekept; slow; no self-service |
| Smogon Team Reports | Depth; permanent archival | High effort; niche reach |
| VGCHelper (app) | Mobile UX; image sharing | App-only; no web distribution |
| crob.at | Visual + shareable | No strategy notes; no creator profile |
| Patreon (as team repo) | Monetization | Not discoverable; search impossible |

**VGC Team Report's positioning opportunity**: Be the only tool that combines Patreon-style monetization hooks, PokePaste-level ease of entry, and a professional team report format with creator profiles — essentially "the creator's canonical team page."

---

## Sources

- https://x.com/WolfeyGlick/status/1749559261120569637
- https://x.com/WolfeyGlick/status/1842944947391230276
- https://x.com/CybertronVGC/status/1899560768536031475
- https://www.patreon.com/WolfeyVGC/membership
- https://www.patreon.com/thatsaplusone
- https://x.com/VGCPastes
- https://x.com/VGCPastes/status/1910793869333324057
- https://x.com/VGCPastes/status/1501920960672272387
- https://vgchelper.com/versions/01_02_00/
- https://vgc.tools/
- https://crob.at
- https://pokemonvgcteamreport.com
- https://victoryroad.pro/sv-reports/
- https://www.smogon.com/forums/forums/team-reports.680/
- https://www.smogon.com/forums/threads/pokepaste-a-pokemon-pastebin.3601073/
- https://devoncorp.press/team-reports-and-war-stories
- https://patreonstats.com/creator/WolfeyVGC
