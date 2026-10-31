# Competitor Analysis: Pikalytics & PokePaste

**Date:** 2026-05-28
**Analyst:** Claude (VGC trend research)

---

## 1. Pikalytics

**URL:** https://www.pikalytics.com
**Traffic:** ~1.3M visits/month (April 2026, per Semrush) — up 420% from March
**Audience:** US-heavy (48.65% direct traffic, 39.89% Google)
**Platform:** Web + native iOS/Android app
**Monetization:** Ko-fi supporter model (donation-based), 100% ad-free. No paywall on core features.

### 1.1 Features They Offer That VGC Team Report Doesn't

| Feature | Description | Gap Severity |
|---------|-------------|-------------|
| **Usage statistics (Pokedex)** | Per-Pokemon pages showing usage %, winrate, top moves, items, abilities, EV spreads, teammates — sourced from Showdown ladder + Limitless tournaments | HIGH |
| **Damage calculator** | Integrated calc with Champions meta presets, field conditions (weather, terrain, Intimidate, spread), KO odds | HIGH |
| **Speed tiers tool** | Full list of base speeds, max investment, neutral, Choice Scarf benchmarks for the current format | MEDIUM |
| **Top Teams browser** | Real tournament teams ordered by placement, filterable by Pokemon/archetype, linkable to Limitless source | HIGH |
| **Tournament results aggregation** | Win/loss records, event rankings, team compositions from recent high-level events (winrates from Limitless over past 4 weeks) | HIGH |
| **Interactive quizzes (Labs)** | Speed Quiz (guess who's faster), Calc Quiz (guess damage bucket), Type Quiz (super effective or not) — gamification with streak tracking | MEDIUM |
| **Mobile app (offline)** | Fully offline iOS/Android app for between-round usage at tournaments. Ad-free. | MEDIUM |
| **Team builder with stats integration** | Build teams with usage-based recommendations for moves, items, spreads. Export to Showdown, share as PokePaste, share as image | HIGH |
| **Multi-format support** | BSS, Smogon OU, Smogon Ubers, not just VGC | LOW |
| **Articles/guides** | Educational content at /articles | LOW |

### 1.2 Share UX

Pikalytics team builder offers **6 sharing methods**:
1. **Copy Team** — Showdown export format to clipboard
2. **Share Team** — Pikalytics URL
3. **Share Image** — Visual team card for social media
4. **Import from Showdown** — Paste Showdown export
5. **Export to Showdown** — Copy for Showdown import
6. **Share PokePaste** — Generate pokepast.es link

This is significantly more versatile than VGC Team Report's current sharing flow. The image share option is particularly valuable for Twitter/Discord engagement.

### 1.3 Monetization Model

- **Free tier:** All features, no paywall, no ads
- **Supporter tier:** Ko-fi donations (voluntary). Some premium features mentioned for logged-in supporters but not prominently gated
- **Mobile app:** One-time purchase on App Store (exact price unclear from research)
- **No subscription model** — entirely donation-supported

This means Pikalytics competes on goodwill and community trust. Their cost structure is likely low (static data, no user-generated content hosting at scale).

### 1.4 What They Do Better Than Us

1. **Data density:** Every Pokemon page is a one-stop reference (usage %, moves, items, spreads, teammates, winrate). We don't have usage stats at all.
2. **Tournament integration:** Direct links to Limitless source data. Real teams, real results, real winrates.
3. **Tool ecosystem:** Calc + speed tiers + team builder + quizzes = a complete "stay on Pikalytics" loop. Users don't need to leave.
4. **SEO dominance:** 1.3M visits/month. Every Pokemon + format combination is an indexed page. They rank for "VGC [Pokemon] build" queries.
5. **Mobile-first:** Offline app for tournament floors where Wi-Fi is unreliable.
6. **Speed:** Static data, fast loads, no auth required for browsing.

### 1.5 Weaknesses We Could Exploit

1. **No team reports/writeups:** Pikalytics shows WHAT teams are used but not WHY. No matchup plans, no lead choices, no endgame strategies. This is our core product.
2. **No community/social layer:** No comments, no likes, no follows, no creator profiles. It's a data tool, not a community.
3. **No user-generated content:** All data is machine-aggregated. Players can't share their own insights, EV justifications, or tournament stories.
4. **Donation-only revenue:** Sustainable but fragile. If traffic grows, server costs could outpace donations. No clear path to premium features.
5. **No team narrative:** A Pikalytics team is six stat blocks. A VGC Team Report is a story — matchup plans, damage calcs in context, speed tier reasoning.
6. **Generic presentation:** Every team looks the same. No branding, no personality, no creator identity.
7. **No embeddable content:** Teams can't be embedded in blogs, Discord bots, or other sites easily.
8. **Articles are thin:** /articles exists but doesn't seem to be a major content pillar.

---

## 2. PokePaste (pokepast.es)

**URL:** https://pokepast.es
**Traffic:** Not publicly tracked (likely much lower than Pikalytics)
**Platform:** Web only (mobile-friendly)
**Technology:** Go (open source, BSD license, github.com/felixphew/pokepaste)
**Monetization:** None. Fully free, open source, no ads.

### 2.1 Features They Offer That VGC Team Report Doesn't

| Feature | Description | Gap Severity |
|---------|-------------|-------------|
| **Instant paste-and-share** | Paste Showdown export, get URL in seconds. Zero friction. | HIGH |
| **No account required** | No login, no signup, no email. Paste → share → done. | HIGH |
| **Universal format** | "PokePaste" is the de facto standard for sharing competitive teams. Everyone knows the format. | HIGH |
| **Syntax highlighting** | Pokemon names colored by type, moves colored by type, items highlighted | LOW |
| **Showdown compatibility** | Direct import/export with Pokemon Showdown teambuilder | MEDIUM |
| **Title + notes fields** | Optional metadata for context | LOW |

### 2.2 Share UX

PokePaste's share flow is the simplest in the ecosystem:
1. Go to pokepast.es
2. Paste your Showdown team export
3. Optionally add title + notes
4. Click "Submit"
5. Get a unique URL

**Time to share: ~10 seconds.** No account, no formatting, no decisions.

However, the shared page is **plain text with small sprites**. No visual richness, no social preview images, no embeds. When you share a pokepast.es link on Discord or Twitter, there's no preview card — just a URL.

### 2.3 Monetization Model

- **None.** Completely free, open source, no ads, no donations page
- Hosted as a community service
- Extremely low operating costs (Go backend, MySQL, minimal assets)

### 2.4 What They Do Better Than Us

1. **Zero friction:** The fastest way to share a team. No account, no decisions, paste and go.
2. **Universal standard:** "Send me a pokepaste" is the lingua franca of competitive Pokemon. The format is the standard.
3. **Ecosystem integration:** Every tool (Pikalytics, Showdown, crob.at, tournament organizers) supports PokePaste format.
4. **Simplicity:** Does one thing perfectly. No feature bloat, no distractions.
5. **Trust:** Open source, no data collection, no accounts = maximum trust.

### 2.5 Weaknesses We Could Exploit

1. **Ugly output:** Plain text with tiny sprites. No visual appeal. No social preview cards. Links look dead on Discord/Twitter.
2. **No analysis:** Just a paste. No damage calcs, no speed tiers, no matchup notes, no EV justification.
3. **No discovery:** You can't browse or search PokePastes. It's a pastebin, not a directory. No "top teams" or "trending."
4. **No creator identity:** Anonymous by default. No way to build a reputation or following.
5. **No social features:** No comments, no likes, no "used this team and went X-Y."
6. **Broken sprites:** Known issues with missing Pokemon art (Solosis, Wynaut, Flabebe, Mime Jr.). A Chrome extension (pokepastefix) exists to patch this.
7. **No embed support:** Can't embed a PokePaste in a blog post, tweet, or Discord message with a rich preview.
8. **Notes field is broken:** URLs in notes can't be selected without browser dev tools. Links to source material don't work.
9. **Emoji bugs:** Emojis in nicknames cause errors.
10. **No mobile app:** Web only, though mobile-friendly.
11. **Stale maintenance:** Open source but not actively developed. Issues pile up.
12. **No team context:** Six stat blocks with no narrative. Why this team? What are the leads? What's the game plan?

---

## 3. Competitive Landscape Summary

### The Market Gap VGC Team Report Fills

```
PokePaste  ←→  "Here's my team (raw data)"
Pikalytics ←→  "Here's what the meta looks like (aggregated data)"
VGC Team Report ←→  "Here's my team AND why it works (narrative + data)"
```

Neither competitor offers the **team report** format: structured writeups with matchup plans, damage calc context, speed tier reasoning, lead choices, and endgame strategies tied to a specific team.

### Feature Priority Matrix

| Feature to Build/Improve | Competitive Impact | Effort | Priority |
|--------------------------|-------------------|--------|----------|
| **PokePaste import** (paste Showdown export → auto-populate team) | Removes friction, meets users where they are | Medium | P0 |
| **Social preview cards** (OG images showing team sprites when shared on Discord/Twitter) | Massive share UX improvement over PokePaste | Medium | P0 |
| **One-click share to Discord/Twitter** | Reduces share friction | Low | P1 |
| **Embed widget** (iframe for blogs, forums) | Distribution channel PokePaste/Pikalytics lack | Medium | P1 |
| **Usage stats on Pokemon pages** (even basic Showdown ladder data) | Closes biggest Pikalytics gap | High | P2 |
| **Speed tier reference** integrated into team reports | Matches Pikalytics feature in our context | Medium | P2 |
| **Creator profiles with follow/reputation** | Community moat neither competitor has | Medium | P1 |
| **Anonymous quick-paste mode** (no account for basic sharing) | Competes with PokePaste's zero-friction flow | Low | P1 |
| **Gamification** (quizzes, streaks) | Engagement + retention, matches Pikalytics Labs | High | P3 |

### Strategic Positioning

**Don't try to out-Pikalytics Pikalytics on data.** They have years of data infrastructure, 1.3M monthly visits, and SEO dominance on usage stats. Instead:

1. **Own the "team report" format.** Be the place where teams get explained, not just listed. Every team report should answer: "Why this team? How do you play it? What are the hard matchups?"

2. **Be the beautiful PokePaste.** PokePaste is ugly and has no social previews. We should be the tool people use when they want their team to LOOK good when shared. Rich OG cards, visual team displays, embeddable widgets.

3. **Build the creator layer.** Neither Pikalytics nor PokePaste has creator profiles, followers, or reputation. VGC Team Report can be the "Medium for team reports" — where players build their brand.

4. **Import from everywhere, export to everywhere.** Accept PokePaste format, export to Showdown, generate pokepast.es links. Be the hub, not a silo.

5. **Win on share UX.** When someone shares a VGC Team Report link on Discord, it should show a beautiful card with 6 Pokemon sprites, the creator's name, and the team's record. PokePaste shows nothing. Pikalytics shows generic data. We should show the story.

---

## 4. Key Metrics to Track

| Metric | Why |
|--------|-----|
| Share-to-view ratio | Are reports being shared? Is the share UX working? |
| PokePaste imports/month | Are we capturing PokePaste users? |
| Time-to-share | How fast from "I want to share my team" to "link sent"? Target: <30 sec |
| Discord/Twitter click-through from OG cards | Is our visual sharing working? |
| Creator return rate | Are report authors coming back? |
| SEO rankings for "[Pokemon] VGC team report" | Are we capturing long-tail search? |

---

## Sources

- [Pikalytics](https://www.pikalytics.com/)
- [Pikalytics Team Builder](https://www.pikalytics.com/team)
- [Pikalytics Damage Calculator](https://www.pikalytics.com/calc)
- [Pikalytics Speed Tiers](https://www.pikalytics.com/speed-tiers)
- [Pikalytics Top Teams](https://www.pikalytics.com/topteams)
- [Pikalytics Speed Quiz](https://www.pikalytics.com/speed-quiz)
- [Pikalytics Calc Quiz](https://www.pikalytics.com/calc-quiz)
- [Pikalytics Type Quiz](https://www.pikalytics.com/type-quiz)
- [Pikalytics Ko-fi](https://ko-fi.com/pikalytics)
- [Pikalytics iOS App](https://apps.apple.com/us/app/pikalytics-battle-strategy/id1511370166)
- [Pikalytics Traffic - Semrush](https://www.semrush.com/website/pikalytics.com/overview/)
- [PokePaste](https://pokepast.es/)
- [PokePaste Syntax Guide](https://pokepast.es/syntax.html)
- [PokePaste GitHub](https://github.com/felixphew/pokepaste)
- [PokePaste Smogon Thread](https://www.smogon.com/forums/threads/pokepaste-a-pokemon-pastebin.3601073/)
- [crob.at PokePaste Alternative](https://crob.at/pokepaste)
- [VGC Team Report](https://pokemonvgcteamreport.com/)
- [Pikalytics on Grokipedia](https://grokipedia.com/page/Pikalytics)
- [Pikalytics on VGCpedia](https://www.vgcpedia.com/website/pikalytics/)
