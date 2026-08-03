# DRAFT — NOT SENT

**Status: DRAFT ONLY. Nothing in this file has been posted, commented, DM'd, submitted, or published anywhere.**
**Produced:** 2026-08-03 by R1 (research swarm). Read-only run — no outbound writes were made to any platform.

Do not send any of this without a human reading it first. Several items depend on facts I could not verify directly this run (the egress proxy blocked all competitor domains, Reddit was unreachable to the crawler, and third-party GitHub repos were out of session scope). Verification notes are attached per item.

---

## Ground rules if any of this is ever used

1. **Every one of these communities has an anti-self-promo norm.** Smogon Technical Projects tolerates tool posts *from the tool author, once, with substance*. r/VGC removes low-effort promo. Discords ban it outright without mod permission. Ask a mod first, every time.
2. **Lead with the artefact, not the ask.** The only outreach that works here is "here is a thing that answers the question you asked," posted in a thread where that question was actually asked.
3. **Do not claim competitor deficiencies you have not personally verified.** I could not open crob.at, pokepast.es, VR Pastes, or RK9 this run. Any comparative claim must be re-checked by a human with a browser before it goes out.
4. **Never post the same copy to two places.** Cross-posting identical text is the fastest way to get flagged.

---

## Draft 1 — Smogon Technical Projects post (EV⇄SP converter)

*Trigger: only after the `/tools/ev-to-sp` page from opportunity #2 actually ships. Smogon's Technical Projects subforum is where MetaHaunter and PokeSuite were announced, so a tool post is on-format there. Post as the tool author.*

> **Subject:** [Tool] Champions EV ⇄ SP converter — handles the 4-then-8 first-point rule
>
> Champions replaced EVs/IVs with Stat Points: 66 per Pokémon, 32 max per stat. The conversion trips people up because it isn't a flat divide — the **first** SP in a stat costs 4 EVs and every one after costs 8, following the HOME transfer rule. So 252 EVs → 32 SP works out cleanly, but most other numbers don't land where people expect when they do it by hand.
>
> I put up a converter that does it both directions: paste an EV spread (or a whole Showdown export) and it returns the SP allocation, flags anything over the 66 total or 32-per-stat budget, and shows the resulting level 50 stats. It shows the per-stat arithmetic rather than just the answer, so you can check it.
>
> [LINK]
>
> Free, no account. Happy to fix anything that's wrong — if you find a spread where my numbers disagree with what the game gives you, please post it and I'll chase it down.

**Verify before sending:**
- [ ] The tool is live and correct on edge cases (0 EVs, odd EVs, 4 EVs, 252 EVs, over-budget spreads).
- [ ] The 4-then-8 rule as stated matches `convertToChampionsSp` exactly. If the code and the copy disagree, the code is probably right — fix the copy.
- [ ] Read the subforum rules and recent threads for tone. Confirm tool posts are currently welcome.
- [ ] Post from an account that is a real participant, not a fresh one.

---

## Draft 2 — Reply template for "how do I convert my EV spread" questions

*Trigger: an actual question, in an actual thread, that this actually answers. Never dropped cold. One reply, no follow-up promo.*

> The reason the maths feels off is that it isn't a flat 8 EVs per SP — the first point in each stat costs 4 EVs and each one after that costs 8. That's why 252 → 32 comes out clean but most in-between numbers don't.
>
> If it helps, I built a converter that does the whole team at once and shows the per-stat working: [LINK]

**Verify before sending:**
- [ ] The question is genuinely about EV→SP conversion, not general teambuilding.
- [ ] Nobody has already answered it correctly. If they have, don't pile on with a link.
- [ ] Subreddit/forum rules permit linking your own tool in a reply. Many require a disclosure — add "(I made this)" if so.
- [ ] Reddit was unreachable this run, so I have **not** confirmed such threads currently exist on r/VGC. Find a real one before using this.

---

## Draft 3 — Discord mod permission request (community bot)

*Trigger: only after the public bot from opportunity #4 exists and has been tested in a private server. Send to mods via modmail or the server's designated contact — never post it in a public channel.*

> Hi — I build pokemonvgcteamreport.com, a tool that turns a Showdown paste into a shareable team report (speed tiers, coverage, matchup notes).
>
> I've built a Discord bot with a `/report` command: someone pastes a team or a paste link, and it replies in-channel with a summary embed and a link, so people don't have to leave chat to see what a team actually is.
>
> Before I go anywhere near your server: would you be open to it, and if so what would you want it restricted to? Happy to lock it to a single channel, disable auto-embeds entirely, or just not do it if it's not a fit. I'd rather ask than show up uninvited.

**Verify before sending:**
- [ ] The bot exists, is tested, and has rate limiting.
- [ ] You can genuinely deliver the restrictions offered (channel allow-list, auto-embed toggle).
- [ ] There is a documented privacy/data answer ready — mods will ask what the bot stores.
- [ ] Do not send this to the VGCPastes Discord first. They run Sandshrew Bot and may reasonably read it as competitive. Start with a smaller, friendlier server.

---

## Draft 4 — Victory Road contact note (listing / directory, not a pitch)

*Trigger: optional, low priority. Victory Road maintains a resources hub. This is a directory-listing request, nothing more. They now run VR Pastes, which overlaps with us — expect a no, and accept it gracefully.*

> Hi — I maintain pokemonvgcteamreport.com, a free tool that converts a Showdown paste into a structured team report: speed tiers, type coverage, matchup notes, Champions SP handling, shareable link.
>
> I noticed your resources page collects VGC tools. If it's a fit I'd be glad to be considered for it; if not, no problem at all, and thanks for the rental team and report archives — they're genuinely useful.

**Verify before sending:**
- [ ] Their resources page actually accepts submissions and has a stated contact route. Use it; don't cold-DM the X account.
- [ ] Be aware VR Pastes is their own competing product. Do not compare, do not pitch against it.
- [ ] One message. No follow-up chasing.

---

## Explicitly NOT drafted, and why

- **Anything comparing us to crob.at, PokePaste, or VR Pastes.** I could not load any of those sites this run. Writing comparison copy from search snippets is how you end up publicly wrong about a competitor.
- **Anything aimed at r/VGC or r/stunfisk.** Reddit was inaccessible to the crawler, so I have no read on current rules, tone, moderation, or whether relevant threads exist. Drafting blind for a community I could not observe would be irresponsible.
- **Creator DMs.** Prior runs already produced these (`.swarm/drafts/creator-outreach-dms.md`, `r4-creator-outreach-drafts.md`, `r4-twitter-outreach.md`). No reason to generate near-duplicates; review those instead.
- **Any post announcing features that don't exist yet.** All four drafts above are gated on their feature shipping first.
