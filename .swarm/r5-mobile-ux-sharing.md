# Mobile UX Sharing Patterns Research: Strava, Pinterest, Behance, Figma Community

**Date:** 2026-05-25
**Focus:** Share-to-view flows, social proof, mobile-first virality, onboarding, and discovery mechanisms applicable to VGC Team Report.

---

## 1. Strava — Activity Sharing & Social Feed

### Share-to-View Flow
- **Record > View > Share** — the core loop is tight. Users complete an activity, immediately see stats (distance, pace, elevation, heart rate), then share with one tap.
- **Share Card Generator:** Strava auto-generates a branded image card with a map/route overlay + key stats. Users can customize which stats appear, choose a photo background, and share directly to Instagram Stories, TikTok, X, etc.
- **Stats Stickers:** Native integration with Instagram Stories — tapping "Share to Stories" opens IG with a pre-made stats sticker overlay positioned on the image.
- **Deep links:** Every shared card links back to the full activity on Strava, driving view-to-install conversion.

### Social Proof & Engagement Signals
- **Kudos** (lightweight likes): 14 billion+ given globally by 2025. Low-friction — single tap, no commitment, drives reciprocity.
- **Comments** visible below every activity in the feed.
- **Group amplification:** Athletes in groups receive 95% more kudos than solo users — social context multiplies engagement.
- **Leaderboard segments:** Competitive social proof via KOM/QOM crowns and local segment rankings.

### Mobile-First Patterns That Drive Sharing
- **One-tap share to multiple platforms** from activity detail or feed.
- **Auto-generated visual assets** — users never need to manually create shareable images.
- **Activity feed as social timeline** — scrollable, thumb-friendly, single-column layout.
- **Reshare others' activities** to amplify social reach within the network.

### Onboarding & Empty States
- **Data-first onboarding:** Immediately syncs with wearables (Apple Watch, Garmin) and shows past activity data — avoids blank empty states entirely.
- **Motivation-based routing:** Asks users their goals, then routes to relevant features (clubs, leaderboards, training plans).
- **First-action focus:** Onboarding skips secondary features and pushes users to record their first activity fast.
- **Kudos on first activity:** Immediate positive feedback reinforces the core loop.

### Discovery Mechanisms
- **Following/Followers social graph** — friends' activities surface in feed.
- **Clubs** — topic/sport communities with activity feeds.
- **Local segments** — discover popular routes nearby.
- **Challenges** — time-limited community goals that surface trending activities.

---

## 2. Pinterest — Visual Discovery & Saving

### Share-to-View Flow
- **Pin > Save to Board > Share Board/Pin** — content is always visual-first.
- **One-tap Save:** Hovering/long-pressing any pin reveals a "Save" button; user selects a board and it's done in 2 taps.
- **Share flow:** Every pin has a share icon leading to platform share sheet (link, message, social platforms).
- **Rich link previews:** Shared Pinterest URLs render with image + title, making shared pins visually compelling in any context.

### Social Proof & Engagement Signals
- **Save count** visible on pins — social proof of content value.
- **"Tried it" photos** — user-generated proof that a pin was useful.
- **Board followers** — signals board curation quality.
- **Related pins** — algorithmic "more like this" creates endless engagement loops.

### Mobile-First Patterns That Drive Sharing
- **Masonry grid layout:** Variable-height cards create visual density — maximizes content per screen. Accommodates different aspect ratios naturally.
- **Infinite scroll:** No pagination friction. Users spend longer per session, discovering more content passively.
- **Thumb-friendly single-column browse** on mobile with tap-to-expand detail.
- **Personalized "For You" feed:** ML-driven content recommendations achieve 80% more engagement than non-personalized content.
- **Visual-first, text-secondary:** Images dominate — descriptions are below the fold.

### Onboarding & Empty States
- **Interest selection on signup:** Users pick 5+ topics to seed their feed — eliminates cold-start empty states.
- **Pre-populated boards:** "Start with ideas" — suggested pins on new boards to show what's possible.
- **Progressive disclosure:** Core action (browse, save) taught first; creation (make pins) comes later.

### Discovery Mechanisms
- **Algorithmic "For You" feed** based on saves, clicks, and time spent.
- **Search with visual results** — even text searches show image grids.
- **"More like this"** on every pin detail page — endless related content.
- **Trending** section for viral/seasonal content.
- **Board recommendations** based on your interests.

---

## 3. Behance — Portfolio/Project Sharing

### Share-to-View Flow
- **Create Project > Add Images/Video > Publish > Share URL** — long-form showcase format.
- **Unique shareable URL** for every project — designed for external sharing.
- **Cover image system:** 808x632px minimum, displays at 202x158px in browse — the thumbnail IS the share preview.
- **Full-width presentation:** Project detail is a vertical scroll of full-width images — immersive, gallery-like experience on mobile.

### Social Proof & Engagement Signals
- **Appreciations** (hearts) — equivalent to likes, visible on project cards in browse.
- **View counter** — shows project reach, builds credibility.
- **Featured badge** — curated by Behance team, massive visibility boost and social proof.
- **Comments/critiques** — community feedback loop.
- **"Project Boost"** (Pro feature) — amplifies visibility in search + For You feeds.

### Mobile-First Patterns That Drive Sharing
- **Image-dominant layout** — minimal text chrome, maximum visual impact.
- **Full-bleed images** in project detail view — phone screens become galleries.
- **Quick-appreciate from browse** — no need to open a project to give kudos.
- **Sticky creator bar** — profile photo + follow button persist while scrolling.

### Onboarding & Empty States
- **"Add your first project"** CTA with clear instructions on what makes a good project.
- **Role-based recommendations:** Content surfaced based on declared creative field.
- **Featured/curated galleries** as starter content — shows quality bar and inspires creation.

### Discovery Mechanisms
- **Curated "Featured" galleries** — editorial picks by category.
- **"For You" feed** — personalized by your creative fields and interaction history.
- **Search + filters** by creative field, tools used, color.
- **"Discover" tab** — trending projects, new creators, thematic collections.
- **Adobe integration** — cross-pollination from Creative Cloud apps.

---

## 4. Figma Community — Design File Sharing

### Share-to-View Flow
- **Design > Publish to Community > Users Duplicate** — "open-source" model for design files.
- **One-click Duplicate:** Any community file can be duplicated to your drafts with a single button — zero friction to adopt.
- **Preview before duplicating:** Users see a full file preview, component list, and description before committing.
- **Versioning:** Publishers can update files; duplicates are snapshots (no live sync).

### Social Proof & Engagement Signals
- **Duplicate count** — primary engagement metric (equivalent to GitHub stars/forks).
- **Like count** — secondary engagement signal.
- **Creator profile** with follower count and published file portfolio.
- **"Used by" signals** — seeing which teams/companies use a community file.

### Mobile-First Patterns That Drive Sharing
- **Rich preview cards** — thumbnail + title + creator + duplicate count visible in browse.
- **Category tags** — quick filtering by design system, icons, wireframes, etc.
- **Personalized recommendations** based on your role (designer, developer, PM) set in profile.

### Onboarding & Empty States
- **Role-based personalization** — on signup, selecting your role seeds recommendations.
- **Curated "Getting Started" collections** — official Figma files teaching the tool.
- **Empty canvas prompts:** "Start from a Community file" — routes new users to templates rather than blank pages.

### Discovery Mechanisms
- **Trending/Popular** rankings by time period.
- **Curated collections** — thematic groupings by Figma team.
- **Search with rich filters** — by category, creator, recency.
- **"Related files"** on every community file page.
- **Plugin/widget ecosystem** — discovery of complementary tools alongside files.

---

## Synthesis: Patterns for VGC Team Report

### Pattern 1: Auto-Generated Share Cards (from Strava)
**What:** When a user publishes a team report, automatically generate a branded, visually rich image card showing key team info (Pokemon sprites, format, creator name, results/placement if any).
**Why:** Strava's auto-generated activity cards are the single biggest driver of organic sharing. Users share to X/Discord/Reddit without needing to manually screenshot or design anything.
**Implementation:**
- OG image generation via Next.js `ImageResponse` (already standard in Next.js 16)
- Include: 6 Pokemon sprites in party layout, format badge, creator avatar, win rate if available
- One-tap "Share to X" / "Copy Link" / "Share to Discord" buttons
- Stats sticker variant for Instagram Stories (vertical format, transparent overlay style)

### Pattern 2: Masonry Grid Discovery Feed (from Pinterest)
**What:** Browse/discover page uses a masonry grid of team report cards with variable heights based on content (some show EV spreads, some show results, some are minimal).
**Why:** Pinterest proves masonry grids maximize visual density and engagement. Infinite scroll eliminates pagination friction. Variable card heights create visual rhythm that keeps users scanning.
**Implementation:**
- Card shows: 6 Pokemon sprites (row), format tag, creator name, engagement count
- Infinite scroll with skeleton loading states
- Personalized "For You" based on formats played, Pokemon used, creators followed
- "More like this" on every team detail page

### Pattern 3: Kudos/Appreciation System (from Strava + Behance)
**What:** Lightweight one-tap engagement signal on team reports. Not "likes" — something VGC-flavored (e.g., "GG" button, trophy icon, or "Strong Team" kudos).
**Why:** Strava's 14B+ kudos prove low-friction appreciation drives reciprocal engagement and retention. Behance's appreciations visible on browse cards provide social proof that influences click-through.
**Implementation:**
- Single-tap from feed (no need to open the full report)
- Count visible on card in browse view (social proof)
- Notification to creator ("X gave your team a GG")
- Weekly "most appreciated teams" trending section

### Pattern 4: Interest-Seeded Onboarding / Empty State Elimination (from Pinterest + Strava)
**What:** On first visit/signup, ask users which VGC formats they play (Reg G, Reg H, etc.), which Pokemon they use, and what they're looking for (team ideas, EV spreads, matchup analysis). Use this to seed a personalized feed immediately.
**Why:** Pinterest's 5-topic onboarding eliminates cold-start empty states — users see relevant content instantly. Strava's data-first approach (sync existing data) avoids blank screens. Empty states cause bounce.
**Implementation:**
- Step 1: "What format do you play?" (multi-select)
- Step 2: "Pick Pokemon you're interested in" (visual grid of popular picks)
- Step 3: Immediately show a populated feed filtered to those preferences
- For creators: "Import from Pokepaste" one-click to avoid empty "create" state

### Pattern 5: One-Click Remix/Duplicate (from Figma Community)
**What:** Every published team report has a "Use This Team" button that duplicates it into the user's workspace for modification — changing EVs, swapping one Pokemon, adjusting moves.
**Why:** Figma's one-click duplicate is their highest-engagement action. It lowers the barrier from "admire" to "use" — converting passive viewers into active builders. For VGC, most players adapt existing teams rather than building from scratch.
**Implementation:**
- "Use This Team" button on every report detail page
- Creates a draft copy in user's account with all data pre-filled
- User can modify and publish as a variant (attribution: "Based on [original]")
- Remix count visible on original (social proof + flattery for creator)
- "Variants" section showing all public remixes of a team

### Pattern 6: Creator Attribution & Social Proof Cascade (from Behance + Strava)
**What:** Every team report prominently shows creator identity, their tournament results, and engagement metrics (views, GGs, remixes, tournament placements using this team).
**Why:** Behance's featured badge and view counters establish credibility. Strava's leaderboards create aspiration. In VGC, a team used by a Worlds qualifier carries inherent social proof that drives adoption.
**Implementation:**
- Creator card: avatar, name, highest placement, total teams published
- Report metrics: views, GGs, remixes, tournament results tagged to this team
- "Featured" or "Staff Pick" badges for exceptional reports
- Tournament result tags: "Top 8 Regionals" / "Day 2 Worlds" badges on teams

### Pattern 7: Deep Link Share-to-View with Rich Previews (from all four)
**What:** Every team report URL generates a rich preview (OG image + description) optimized for X, Discord embeds, Reddit, and messaging apps.
**Why:** All four apps invest heavily in making shared links look compelling in external contexts. A rich Discord embed with Pokemon sprites drives more clicks than a plain URL.
**Implementation:**
- Dynamic OG images per team report (Pokemon sprites + format + creator)
- Twitter Card large image format
- Discord embed with structured fields (Format, Pokemon, Creator, Record)
- Clean URL structure: `pokemonvgcteamreport.com/team/[slug]`
- No login wall for viewing — shared links open directly to content

---

## Priority Matrix

| Pattern | Impact | Effort | Priority |
|---------|--------|--------|----------|
| Auto-Generated Share Cards | High | Medium | P0 |
| Rich Link Previews (OG) | High | Low | P0 |
| Kudos/GG System | High | Medium | P1 |
| Masonry Discovery Feed | High | High | P1 |
| One-Click Remix | Medium | Medium | P2 |
| Interest-Seeded Onboarding | Medium | Medium | P2 |
| Creator Attribution | Medium | Low | P2 |

---

## Key Takeaways

1. **Visual sharing assets are non-negotiable.** Strava's entire viral loop depends on auto-generated images that users proudly share. VGC Team Report needs equivalent "team cards" that look good on X/Discord without any user effort.

2. **Low-friction engagement signals drive retention.** Strava (kudos) and Behance (appreciations) prove that one-tap reactions create reciprocal engagement loops. A "GG" button is trivial to implement but compounds over time.

3. **Eliminate empty states through personalization.** Pinterest and Strava both avoid showing blank screens to new users. Asking format preference on first visit and showing relevant teams immediately is the fastest path to engagement.

4. **Remix culture fits VGC perfectly.** Figma's duplicate model maps directly to how VGC players actually use teams — they adapt existing teams, not build from zero. Making this a first-class feature (with attribution) serves both creators and consumers.

5. **Rich previews are the cheapest high-impact investment.** Every platform invests in making shared URLs look compelling in external contexts. For VGC Team Report, a Discord embed showing 6 Pokemon sprites + format + results would dramatically increase click-through from the channels where VGC discussion actually happens.

---

## Sources

- [Strava Sharing Support](https://support.strava.com/hc/en-us/articles/221089587-Sharing-Your-Strava-Activities)
- [Strava Stats Stickers](https://communityhub.strava.com/what-s-new-10/use-strava-stats-stickers-on-ig-stories-ios-android-9344)
- [Strava Engagement & Gamification (StriveCloud)](https://www.strivecloud.io/blog/app-engagement-strava)
- [Strava Marketing Strategy (NoGood)](https://nogood.io/blog/strava-marketing-strategy/)
- [Strava Animated Onboarding (Medium)](https://medium.com/strava-design/creating-an-animated-onboarding-experience-19b0363a1326)
- [Pinterest UX Analysis (UX Collective)](https://uxdesign.cc/pinterests-patterns-and-user-flows-e5e2de836275)
- [Pinterest Endless Scroll UX](https://en.incarabia.com/inside-pinterest-ux-endless-scroll-endless-engagement-768866.html)
- [Pinterest Visual Discovery (Passionate Agency)](https://passionates.com/pinterest-visual-discovery-social-commerce-giant/)
- [Pinterest UI/UX Review (CreateBytes)](https://createbytes.com/insights/pinterest-ui-ux-review-boom-or-bloom)
- [Behance: How to Stand Out](https://www.behance.net/blog/how-to-stand-out-on-behance)
- [Behance Project Boost](https://www.behance.net/blog/project-boost)
- [Behance Intro Guide](https://help.behance.net/hc/en-us/articles/204483894-Guide-Intro-to-Behance)
- [Figma Community Guide](https://help.figma.com/hc/en-us/articles/360038510693--Guide-to-Figma-Community)
- [Figma Duplicate Community Files](https://help.figma.com/hc/en-us/articles/360038510873-Duplicate-Community-files)
- [Empty State UX (Mobbin)](https://mobbin.com/glossary/empty-state)
- [Empty State Design (Setproduct)](https://www.setproduct.com/blog/empty-state-ui-design)
- [Apps with Great Onboarding 2026 (UXCam)](https://uxcam.com/blog/10-apps-with-great-user-onboarding/)
