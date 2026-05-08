# VGC-58: Discord Server Strategy

**DRAFT ONLY — Do not publish**

---

## 1. Channel Structure

### Category: START HERE
- `#welcome` — Server rules, quick start guide, link to vgc-team-report.vercel.app
- `#announcements` — New features, site updates, tournament news (mod-only posting)
- `#roadmap` — Pinned post with current feature roadmap; read-only

### Category: TEAM WORKSHOP
- `#share-your-team` — Post your team report links here. Format: link + one-line team description
- `#team-feedback` — Ask for specific feedback on your build. Tag spreads, matchups, or concept questions clearly
- `#replays` — Share replays alongside your team report for context
- `#work-in-progress` — Half-baked ideas, experimental builds, open questions

### Category: META TALK
- `#meta-discussion` — General current-format strategy discussion
- `#tournament-results` — Post results, team reports, and tournament takeaways after events
- `#regulation-hub` — One thread per active regulation pinned at top; archive threads for past regs
- `#threat-analysis` — Specific Pokemon analysis: sets, counters, EV choices

### Category: COMMUNITY
- `#general` — Off-topic, introductions, casual chat
- `#looking-for-practice` — Find practice partners; include your timezone and skill level
- `#content-creators` — VGC YouTube, Twitch, and stream links from community members
- `#feedback-and-bugs` — Site feedback and bug reports. Direct line to the developer

### Category: MOD / ADMIN (private)
- `#mod-log`
- `#bot-config`
- `#dev-notes`

---

## 2. Welcome Message Draft

**Channel:** `#welcome`

---

Welcome to the VGC Team Report server.

This is the community home for vgc-team-report.vercel.app — a free tool for sharing, reviewing, and discussing VGC teams.

**Getting started:**
1. Head to vgc-team-report.vercel.app and paste your current team's Showdown export
2. Grab your shareable link and drop it in `#share-your-team`
3. Introduce yourself in `#general` — what format you're playing, where you're based, how long you've been competing

**Server rules:**
- Be specific when asking for feedback. "Rate my team" without context gets vague answers.
- No personal attacks. Disagreeing about spreads is fine. Disrespecting people is not.
- No unsolicited self-promotion in team channels. Share content in `#content-creators`.
- When posting a team, use a VGC Team Report link — it makes reviewing 10x easier for everyone.
- Bugs and feature requests go in `#feedback-and-bugs`. The developer reads that channel daily.

This server grows by word of mouth. If the tool or community is useful to you, tell a teammate.

Good luck at your next event.

---

## 3. Bot Commands to Consider

The following bot commands would add value to this community. These are proposals — implementation depends on available bot frameworks (e.g. Discord.py, discord.js) or existing bots like Carl-bot or MEE6 extended with custom functionality.

### High Priority

**`/share-team [showdown-paste]`**
Accepts a Showdown team paste directly in Discord, submits it to the VGC Team Report API, and returns the shareable link in the channel. Eliminates the need to visit the site separately.

**`/analyze [team-report-url]`**
Pulls the team from a VGC Team Report link and returns a brief analysis summary in Discord: type coverage gaps, speed tier notes, tera type spread. Useful for quick channel-level discussion.

**`/meta [regulation]`**
Returns a pinned meta summary for the specified regulation (e.g. `/meta reg-h`). Links to the relevant regulation guide page on the site.

### Medium Priority

**`/lookup [pokemon-name]`**
Returns common VGC sets, base stats, and relevant speed tiers for any Pokemon. Powered by site data.

**`/tournament [event-name]`**
Posts the most recent team report links from a given tournament if they've been submitted to the site.

**`/practice`**
Cross-posts the user's message to `#looking-for-practice` with a standard format reminder.

### Low Priority / Future

**`/remind [time] [message]`** — Tournament day reminder bot.
**`/weekly-meta`** — Auto-posts a meta summary every Monday morning from the site's data.

---

## 4. Growing from 0 to 100 Members

### Phase 1: Foundation (0–20 members)

The server needs content before it needs promotion. Before inviting anyone:
- Set up all channels as described above
- Write and pin the welcome message
- Seed `#share-your-team` with 3–5 example team reports (your own or with permission from others)
- Write a pinned meta summary in `#regulation-hub` for the current active format
- Have the bot commands (at minimum `/share-team`) working

Invite 5–10 people you already know from the VGC community. Ask them to engage genuinely, not just join. A server with 10 active members is more compelling than one with 100 silent ones.

### Phase 2: Community Seeding (20–50 members)

- Post the launch thread on Twitter/X (see VGC-56). Include the Discord invite link in Tweet 9.
- Include the Discord link in the r/VGC launch post (see VGC-57). Do not make joining the server feel like a condition of using the tool.
- Reply to "looking for practice partner" threads in r/VGC with a link to `#looking-for-practice`.
- Add the Discord invite link to every page footer on vgc-team-report.vercel.app.
- Add it to every team report page: "Discuss this team on Discord."

### Phase 3: Organic Growth (50–100 members)

- Run a "team of the week" feature: pick the most-discussed team from `#team-feedback` and post a write-up in `#announcements`. Tag the creator.
- Host a live team-building session in a voice channel. Announce in `#announcements` 48 hours ahead.
- Reach out to one VGC content creator (see VGC-59 outreach strategy) and offer them a verified creator role. A creator posting their teams here brings their audience with them.
- Post a weekly meta thread in `#meta-discussion` every Monday. Active moderation generates active members.
- Submit the server to Pokemon community Discord directories (e.g. Disboard with relevant tags: Pokemon, VGC, competitive).

### Retention

- The developer should post in `#feedback-and-bugs` each time a new feature ships, explaining what changed and why.
- Members who give genuinely useful feedback get credited by name in `#announcements`.
- Keep `#general` from going silent — even a weekly "what are you prepping for?" post maintains momentum.

---

*Total word count: ~870*
