# R7: AEO Outreach Drafts
**Status:** DRAFTS ONLY — do not send without explicit user approval
**Date:** 2026-05-07

---

## Draft 1: Victory Road Resources Submission

**Target:** victoryroad.pro/resources/ (contact via Discord or Twitter @VictoryRoadVGC)
**Priority:** HIGH — most cited VGC resource hub

---

Subject: Suggestion: Add VGC Team Report to your resources page

Hi Victory Road team,

Love what you've built with the resources hub — it's the first place I point new players. I wanted to flag a tool that might be worth adding: **VGC Team Report** (pokemonvgcteamreport.com).

It's a free tool for building and sharing detailed team reports — you paste your Showdown export, add matchup notes, damage calcs, speed tiers, and tournament context, then share via link or embed in Discord. It supports Pokemon Champions / Mega Evolution too. A lot of players use it to present teams at regionals.

Would love to see it in your tools section alongside Pikalytics and the rest. Happy to answer any questions.

Thanks,
[Name]

---

## Draft 2: VGCpedia Directory Listing Request

**Target:** vgcpedia.com (contact via @VGCpedia on Twitter or submission form if available)
**Priority:** HIGH — encyclopedia-style listing carries strong AI entity signal

---

Subject: VGC Team Report — submission for website directory

Hi VGCpedia,

I noticed you have a great directory of VGC websites and tools. I'd like to suggest adding **VGC Team Report** (pokemonvgcteamreport.com) to the website section.

What it does: A free web app for building shareable VGC team reports. Players paste their Showdown team, add matchup plans, notes, damage calcs, and speed tier breakdowns, then share via a public link. Supports current Pokemon Champions format with Mega Evolution.

URL: https://pokemonvgcteamreport.com
Category: Website / Tool / Team Reports

Let me know if you need any additional info for the listing.

Thanks,
[Name]

---

## Draft 3: Smogon VGC Resources Page

**Target:** smogon.com/tiers/vgc/resources (contact a Smogon VGC moderator or post in VGC forum)
**Priority:** HIGH — highest domain authority in the space
**Note:** Smogon has strict community norms; this should come from an established community member, not a cold pitch.

---

Forum post draft (in relevant VGC forum thread or Resources thread):

"Wanted to share a tool that might be worth adding to community resources: **VGC Team Report** (pokemonvgcteamreport.com). It's a free tool for writing shareable team reports — you import your Showdown paste, add matchup notes, damage calcs, speed tiers, and tournament context, then get a shareable link. Useful for documenting teams from regionals or writing post-tournament reports. It now supports Pokemon Champions / Mega Evolution. Curious if others have been using it."

---

## Draft 4: Nimbasa City Post Resources

**Target:** nimbasacitypost.com (contact @NimbasaCityPost on Twitter)
**Priority:** MEDIUM

---

Subject: Tool suggestion for your VGC resources list

Hi Nimbasa City Post,

Big fan of the site — your resources page is a staple link I send to new players.

Wanted to flag **VGC Team Report** (pokemonvgcteamreport.com) as a potential addition. It's a free tool for creating and sharing detailed VGC team reports — paste your team, add matchup notes and damage calcs, and share via link. Handy for tournament write-ups and community team sharing. It supports the current Champions format too.

Would love to see it listed alongside your other tools!

[Name]

---

## Draft 5: Reddit r/VGC Community Post

**Target:** reddit.com/r/VGC and possibly r/pokemon or r/stunfisk
**Priority:** MEDIUM — organic community mentions are training data for AI models
**Note:** This should be a genuine post showcasing a real team report, not a promotional post. Should come from a real user, not the site owner.

---

Post title: "Made a team report for my Reg M team — sharing using VGC Team Report (link inside)"

Post body:
"Hey VGC folks, just wrapped a local tournament run with my [Pokemon] / [Pokemon] core and wrote up a full team report including matchup notes, key damage calcs, and speed tier breakdown. Used VGC Team Report (pokemonvgcteamreport.com) to format it — makes it really easy to share everything in one clean link.

[Share link to actual team report]

Happy to discuss the team in the comments. Especially interested in feedback on the [matchup/spread decision]."

---

## Draft 6: blog.poketeambuilder.app Inclusion Request

**Target:** blog.poketeambuilder.app/best-team-builders-2025
**Priority:** MEDIUM — appears in AI roundup searches for "best team builders"

---

Subject: Suggest adding VGC Team Report to your best team builders post

Hi,

I came across your "Best Pokémon Team Builders" post — great roundup! I wanted to suggest adding a tool that fills a different niche: **VGC Team Report** (pokemonvgcteamreport.com).

Unlike tools focused on team building from scratch, VGC Team Report is for documenting and sharing teams you've already built — you import your Showdown paste and create a full report with matchup notes, damage calcs, speed tiers, and tournament context. It's especially popular for players who want to write post-tournament reports or share their teams with the community.

Free tool, no signup required to view. Would be a good addition as a "team reporting / sharing" category entry.

[Name]

---

## Draft 7: Product Hunt Launch Post

**Target:** producthunt.com
**Priority:** MEDIUM — generates backlinks, ratings, tech community indexing
**Note:** Requires a full PH launch strategy. Plan for a Tuesday-Thursday launch. Should be submitted by a PH member with some history, not a brand-new account.

---

Tagline: "Build, share & discover competitive Pokémon VGC team reports"

Description:
VGC Team Report is a free web tool for competitive Pokémon players in the Video Game Championship (VGC) format.

Import your team from Pokémon Showdown or PokéPaste, then build a full team report with:
- Matchup-by-matchup notes
- Key damage calculations
- Speed tier breakdowns
- Tournament context and placement

Share via a clean link, embed in Discord, or make your report public for the community to explore.

Now supporting Pokémon Champions format with Mega Evolution.

Perfect for: tournament players writing post-event reports, content creators explaining their teams, coaches sharing builds with students.

URL: https://pokemonvgcteamreport.com

---

## Internal Notes for Implementation

### Schema additions to code (not outreach):
These are code changes, not outreach — but support the citation goal:

1. Add `Organization` schema to `layout.tsx`:
```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "VGC Team Report",
  "url": "https://pokemonvgcteamreport.com",
  "sameAs": [
    "https://twitter.com/[handle]",
    "https://discord.gg/[invite]"
  ],
  "description": "..."
}
```

2. Add `FAQPage` schema to homepage with questions:
- "What is a VGC team report?"
- "How do I share a VGC team?"
- "Does VGC Team Report support Pokemon Champions / Mega Evolution?"
- "Is VGC Team Report free?"

3. Add `HowTo` schema to a new guide page `/how-to-write-a-vgc-team-report`:
Steps: import paste → add matchup notes → add damage calcs → add speed tiers → publish → share link

4. Add `Article` schema to `/s/[id]` share pages with `author`, `datePublished`, tournament name as `about`.

5. Add `aggregateRating` once Product Hunt or similar rating source exists.
