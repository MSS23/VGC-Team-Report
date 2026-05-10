# Mobile UX Patterns Research: Share-to-View Flows for VGC Team Report

**Research Date:** 2026-05-10
**Researcher:** UX Research Agent (r5 — Wave 2 brief)
**Scope:** Share-to-view conversion, screenshot-first design, social proof mechanics, PWA install timing, friction reduction in first 10 seconds

---

## Executive Summary

Five UX pattern clusters define high-converting share-to-view flows in 2025–2026: (1) frictionless zero-login guest views that gate *action* not *viewing*, (2) screenshot-first identity cards (Spotify Wrapped model) that create FOMO-driven organic resharing, (3) progressive disclosure of content with contextual registration prompts placed after emotional peaks, (4) dynamic per-team OG images that serve as identity-expression artifacts across Discord, Twitter/X, and Reddit, and (5) PWA install prompts deferred until a clear value-delivery moment rather than shown on arrival.

For VGC Team Report specifically, the biggest opportunity is replicating the Wrapped/Year-in-Sport pattern applied to competitive team-building: personalized, visual, screenshot-native cards that express a player's identity ("I went 7-2 at Regionals with this team") and drive FOMO among non-users who see the shared image.

---

## Part 1: Share-to-View Flows — How Successful Apps Handle It

### 1.1 The Frictionless View Principle

The single most consistent finding across Strava, Pinterest, Figma Community, Notion, and Behance: **forcing account creation before viewing a shared link devastates the viral sharing loop.**

Key data:
- 35% of users abandon at a login wall before seeing the shared content (Baymard Institute)
- 24% of all users abandon a flow when forced to create an account (guest checkout studies, structurally identical pattern)
- Guest checkout / guest view equivalent: 25% conversion improvement from a single UX decision

**The correct pattern (Notion, Figma public links, Behance portfolio links):**
```
Click shared link
       ↓
Full content loads immediately — no interstitial, no login
       ↓
Persistent non-blocking bottom banner: "Build your own → Create free account"
       ↓
User reaches natural end of content
       ↓
Contextual CTA: "Want to duplicate/analyze this team? Sign up free"
       ↓
Sign-up modal overlays content (NOT a redirect) — content stays visible behind
```

**Gate the action, never the view.** Duplicate, edit, fork, save — these require an account. Viewing never should.

### 1.2 What Recipients Without an Account See (Platform Analysis)

**Strava shared activities:**
- Public activity pages load without login — route map, stats, photos visible
- Sign-up prompt is a dismissible banner at the top
- Kudos and comments are visible (social proof) but require login to interact
- The experience validates the activity's value before asking for commitment

**Figma Community files:**
- Files open in view mode without an account on free public links
- "Duplicate to edit" requires sign-up — intentional gate on action, not viewing
- Login requirement for prototype viewing (for non-public links) is a documented friction point widely criticized in Figma forums

**Pinterest:**
- All pins and boards are viewable without login on web
- Saving, following, creating boards require an account
- Pinterest uses a "phantom board" technique: lets you pin multiple items, then gates the save action — you're already invested before the ask

**Behance:**
- Portfolio pages fully viewable without account
- "Appreciate" (like), follow, comment require login
- No login wall between shared link and content — industry best practice for portfolio platforms

**Lesson for VGC Team Report:** `/teams/[slug]` must be fully viewable without login. Lock only: duplicate, save to my account, edit, export to pokepaste (as a growth mechanic).

### 1.3 Recipient Experience — First 10 Seconds

Research from conversion science on guest landing pages:

| Second | What must happen |
|--------|-----------------|
| 0–1 | Content visible above the fold — no splash screens, no login interstitials |
| 1–3 | Primary content identity is clear: "This is a VGC team report for [Team Name]" |
| 3–6 | Social proof signal visible: player name, tournament record, or community engagement |
| 6–10 | One non-blocking value proposition for signing up appears (bottom banner or inline) |
| 10+ | Full content explorable; conversion prompt at natural end of scroll |

**What kills the first 10 seconds:**
- Full-screen login/signup modal on arrival (common mistake — see Strava's mixed reception)
- Skeleton screens that take >1.5s to resolve on mobile (LCP issue)
- Autoplay audio or video (disrupts context switching from share origin)
- Unclear attribution ("Who made this team? For what format?") — social context is essential

---

## Part 2: Social Proof and Preview Mechanics

### 2.1 Open Graph Image Design

The OG image is the de facto "ad" for shared content — it appears in Discord channels, Twitter/X feeds, iMessage previews, and Reddit link posts before anyone clicks. It is the most high-leverage pixel in the sharing flow.

**Optimal dimensions (2025–2026):**
- Universal safe: 1200x630px (1.91:1 ratio)
- Twitter/X preferred: 1200x600px (2:1) for no-crop rendering
- Discord, Slack, iMessage: 1200x630px renders inline without click

**Design principles for high-CTR OG images:**
1. Characters/sprites in the center — faces and characters consistently outperform abstract visuals for click-through
2. Dark backgrounds + bright sprite colors create high contrast that stands out in feeds
3. Readable at 400x210px (Twitter feed thumbnail) — test at this size
4. Team name + regulation visible without clicking
5. Subtle brand mark bottom-right — builds recognition over 1000s of shares
6. Dynamic per-team image, not a generic site image — same-for-all OG images are a CTR killer

**Next.js implementation (App Router):**
```
app/teams/[slug]/opengraph-image.tsx
```
Uses `ImageResponse` from `next/og` at the Edge. Vercel caches automatically per slug. No need to pre-generate — renders on first request, cached thereafter.

**OG metadata per team page:**
- `og:title`: "[Team Name] — [Regulation] VGC Team" (max 60 chars)
- `og:description`: "[Archetype] team by [Player] — matchups, calcs & strategy" (120-150 chars)
- `twitter:card`: `summary_large_image`
- `og:type`: `website` (teams don't expire like articles)

### 2.2 Social Proof Display Strategy

**The credibility threshold problem:** Low share/view counts create negative social proof. "3 people viewed this" actively suppresses further sharing.

**Recommended approach:**
- Show view counts only above 100 (threshold where number feels meaningful)
- Show comment/analysis count rather than share count (activity signal vs. vanity)
- Show tournament result badge prominently if attached ("7-2 Sheffield Regional")
- Show creation date + regulation to signal freshness ("Built for Reg G, 2025")

**Trust signals for new viewers (non-members):**
- Player display name visible (author attribution builds credibility)
- Regulation label (confirms relevance to current meta)
- Team archetype tag (Trick Room, HO, Bulky Offense) — helps viewers self-qualify
- Any tournament placement if the player entered it

---

## Part 3: Screenshot-First Content Design (Wrapped/Year-in-Sport Model)

### 3.1 What "Screenshot-First" Means

Spotify Wrapped and Strava Year in Sport are the two canonical case studies. Both are designed so the **screenshot is the shareable artifact**, not the URL link.

The screenshot-first principle:
- The image contains all the essential information (self-contained)
- It is formatted for Instagram Stories (9:16) or Twitter cards (16:9) out of the box
- It expresses identity, not just data — "this is who I am as a player/listener"
- It creates FOMO in non-users who see it ("I want my own")

**Spotify Wrapped mechanics:**
- 21% increase in app downloads in the first week of December 2020 — driven almost entirely by FOMO from shared Wrapped screenshots
- 156 million users interacted with Wrapped in 2023
- Key psychological driver: the paradox of belonging AND uniqueness — your stats are unique, but participating in Wrapped puts you in a shared cultural moment
- Non-users see Wrapped screenshots flooding social media and feel excluded from the ritual
- The share card contains: top artist, minutes listened, listener archetype label ("the Enthusiast") — all identity expression

**Strava Year in Sport mechanics:**
- Personalized per-sport: running vs cycling vs swimming get different cards
- Customizable: users choose whether to show cumulative or sport-specific stats, whether to include profile photo
- Screenshot-native: saves as PNG with Strava branding watermark
- "Video" version for Stories — not just static image
- Works for non-subscribers: Year in Sport was free for all in 2024

### 3.2 Applying the Wrapped Model to VGC Team Report

VGC players already have the cultural pattern: posting team reports and tournament results is a community ritual. The opportunity is to make those posts visually richer and more screenshot-native.

**VGC "Wrapped Card" concept:**
```
┌─────────────────────────────────┐  ← 1080x1920 (9:16 Story format)
│    VGC TEAM REPORT              │
│    [Player name]                │
│                                 │
│  [6 Pokemon sprites — large]    │
│                                 │
│  ─────────────────────────────  │
│  Team: [Name]                   │
│  Regulation: [G/H/etc.]         │
│  Format: Doubles                │
│                                 │
│  Tournament: [Name if entered]  │
│  Record: 7-2                    │
│                                 │
│  Key core: [Pokemon] + [Pokemon]│
│  Win condition: [one-liner]     │
│                                 │
│  vgc-team-report.com            │  ← Watermark / viral attribution
└─────────────────────────────────┘
```

**Also generate 16:9 (1200x630) for Twitter/Discord.**

The watermark is a growth mechanic: every screenshot shared drives organic discovery. Spotify's Wrapped logo on every card is the model — present but not intrusive.

**Year-end/season-end campaign moment (highest virality potential):**
- "My Regulation G Season" card — tournament record, teams used, top Pokémon
- Timed to regulation rotation announcements (when old reg ends, new one starts)
- Analogous to Wrapped's December timing — culturally resonant moment

### 3.3 Identity Elements That Drive Sharing

From Wrapped analysis: the content must simultaneously express uniqueness AND belonging.

For VGC:
- **Uniqueness**: "This team counters 9/10 top meta cores" (creative insight)
- **Belonging**: Tournament record badge, regulation, community-recognized archetypes
- **Provocation**: "This team is not standard — here's why it works"
- **Achievement**: Record at a named tournament (strongest sharing trigger)

---

## Part 4: Five Specific UX Patterns for VGC Team Report

### Pattern 1: Progressive Disclosure with Deferred Registration

**What it is:** Show the full team report to anyone with the link, progressively reveal deeper layers (calcs, matchup analysis, notes), and only ask for registration when the user wants to take an action (duplicate, save, comment).

**Implementation:**
- Slide 1–3: Team overview, sprites, held items — fully visible to guests
- Slide 4+: Damage calcs, matchup notes, strategy — visible but with a "sign up to run your own calcs" prompt at the end
- Never block viewing — only block interaction
- Registration CTA triggers after the emotional peak (after viewing the final slide, after seeing a particularly impressive calc result)

**Why it works:** Users who have already seen value are 3-4x more likely to sign up than users hit with a registration wall on arrival. The "I want this for myself" moment is the conversion trigger.

**Conversion messaging:** "Like what you see? Build your own team report — free." (not "Create an account to continue")

### Pattern 2: Screenshot-Native Identity Cards

**What it is:** One-tap downloadable team cards in screenshot-optimized formats (9:16 Stories, 16:9 Twitter) that players can share on any platform without clicking a link.

**Why it converts:** The card image itself is the ad. Every Instagram Story, Twitter post, or Discord attachment of a VGC Team Report card is free distribution. The watermark drives discoverability. The uniqueness drives FOMO.

**Mechanics:**
- Generate via server-side Edge function (`/api/team-card/[slug]`)
- Offer two formats from the share modal: "Story (9:16)" and "Card (16:9)"
- One-tap download — no login required to download your own team's card
- Include: sprites, record (if entered), team name, regulation, site watermark

### Pattern 3: Sticky Bottom Sheet Sign-Up Nudge (Not a Wall)

**What it is:** A persistent but dismissible bottom banner on guest-viewed team pages that converts viewers to registered users without interrupting the viewing experience.

**Specs:**
- Height: 56–64px (one line of text + CTA button)
- Content: "Build and share your own team free →" with a CTA button
- Dismissible: small X closes it (never returns that session)
- Never obscures the main content — sits below the scroll content area
- Re-appears at end of content scroll as a larger contextual CTA

**Data:** Sticky CTAs improve mobile conversions 12–27% vs. non-persistent alternatives. The non-intrusive bottom placement avoids the rage-click pattern associated with modal overlays.

**Contrast with pattern to avoid:** Full-screen interstitial login prompts on shared link arrival — proven to increase bounce rate and break the viral sharing loop.

### Pattern 4: Native Share Sheet with Smart Fallback

**What it is:** On mobile, the share button triggers the OS-native share sheet (Web Share API). On desktop, it opens a custom bottom sheet modal. The share action always starts with "Copy Link" as the primary option.

**Why it wins:**
- Native share sheet shows apps the user already has installed — personalized, frictionless
- No custom sharing UI to maintain for 15 different platforms
- 92% browser support on mobile (2025)

**Fallback hierarchy:**
1. `navigator.share()` — fires native share sheet if available
2. Clipboard copy + inline "Copied!" confirmation — universal fallback
3. Custom bottom sheet with: Copy Link field, Discord/Twitter/Reddit icons (3 max), Download Card option, QR Code option ("Show at tournament")

**VGC-specific addition:** QR code target for in-person tournament team preview — unique differentiator vs. every other VGC platform.

### Pattern 5: Context-Timed PWA Install Prompt

**What it is:** The PWA "Add to Home Screen" prompt is deferred until after a meaningful user action, not shown on first visit.

**Why timing matters:**
- Showing install prompt on first arrival: ~1-3% acceptance rate
- Showing after completing a team build or viewing a second team: 30%+ higher acceptance
- Chrome/Android requires 30+ seconds of interaction before the `beforeinstallprompt` event fires anyway

**Recommended trigger moments (in priority order):**
1. After completing a team build (all 6 Pokemon added) — highest intent signal
2. After the second team viewed in a session (return visitor pattern)
3. After saving a team to account (post-conversion install)
4. Never on: first page load, shared link landing, or during damage calc flow

**Messaging that converts:**
- "Add VGC Team Report to your home screen for instant access at tournaments"
- Emphasize offline/speed benefit: "Works without internet — perfect for tournament day"
- iOS requires manual education (no `beforeinstallprompt`): show a banner with "Tap [share icon] then 'Add to Home Screen'" with an animated GIF

**Implementation notes:**
- Capture and store the `beforeinstallprompt` event on page load
- Fire the stored prompt only at the trigger moments above
- If dismissed, don't show again for 14 days (browser may re-fire event after that)
- Show a persistent "Install App" option in the site's main menu as a persistent low-pressure path

---

## Part 5: PWA Install Prompt Best Practices

### 5.1 Timing and Triggers (Research Synthesis)

The consensus from Google, Microsoft, and PWA practitioners:

| Trigger Type | Relative Acceptance Rate |
|-------------|------------------------|
| First page load (immediate) | Baseline (1x) |
| After 2+ pages visited | ~1.3x |
| After key completed action | ~1.8–2.2x |
| After second session | ~2.5x |
| After sign-up / conversion | ~3x |

**Best practice:** Capture `beforeinstallprompt` immediately, show only at high-engagement moments.

### 5.2 Android vs. iOS Differences

**Android (Chrome, Edge, Samsung Browser):**
- `beforeinstallprompt` event fires automatically
- Can show native OS install dialog via stored `prompt()` call
- Custom install buttons work cleanly
- Requirements: served over HTTPS, has web manifest, service worker registered

**iOS (Safari):**
- No `beforeinstallprompt` event — Apple blocks it by design
- Installation is fully manual: Share → Add to Home Screen
- Best approach: custom bottom banner with illustrated instructions
- Show only when: `navigator.userAgent` includes "iPhone" or "iPad" AND page is in Safari (not already installed)
- Timing: same as Android — show after meaningful engagement, not on arrival

### 5.3 Messaging and Copy

**Value proposition framing that converts:**
- Functional: "Access your teams offline — no internet needed at tournaments"
- Speed: "Opens instantly from your home screen — no browser loading"
- Community: "Get notified when top players share new team reports" (if push enabled)

**Avoid:**
- Generic "Install our app" (sounds like spam)
- "Add to Home Screen" as the CTA label (too technical for casual users)
- Showing the prompt when the user is mid-task (reading a team report, running a calc)

### 5.4 Conversion Data (Industry Examples)

- Trivago PWA: 150% increase in engagement for users who install; 97% increase in clickouts to hotel offers
- General e-commerce PWA installs: 52% average conversion rate improvement vs. mobile web
- PWA install prompt after completed action: 30%+ higher acceptance vs. early prompt

---

## Part 6: Synthesis — VGC Team Report Specific Recommendations

### Priority Matrix

| Pattern | Impact | Effort | Priority |
|---------|--------|--------|----------|
| Remove login wall from team view | Very High | Low | P0 — do first |
| Dynamic OG images per team | Very High | Medium | P0 |
| Native share sheet (Web Share API) | High | Low | P1 |
| Downloadable team card (Story format) | High | Medium | P1 |
| End-of-report sign-up CTA | High | Low | P1 |
| Screenshot-native season recap card | Very High | High | P2 |
| PWA install timing refinement | Medium | Low | P2 |
| QR code for tournament use | Medium | Low | P2 |

### Immediate Wins (Wave 2 Focus)

**1. Audit the current guest experience on `/teams/[slug]`**
If any login wall exists before viewing, remove it. This is the single highest-ROI change.

**2. Implement dynamic OG images**
A generic site image on every shared team link is leaving engagement on the table. Each Discord paste of a team link should show that team's 6 sprites + name. This is a 2–4 hour implementation with `opengraph-image.tsx` in Next.js App Router.

**3. Add "Download Share Card" to share flow**
Players already post team screenshots to Twitter/Discord. Give them a pre-formatted, branded version. They'll use it instead of a raw screenshot, and the watermark drives attribution.

**4. Contextual end-of-report sign-up prompt**
After viewing the last slide, show: "Liked this team? Build your own — VGC Team Report is free." This converts viewers who are already engaged rather than cold arrivals.

**5. Move PWA prompt to post-team-completion**
If the prompt currently appears early, defer it to after the user completes their first team build. Same prompt, 2x the acceptance rate.

---

## Sources

- [The Wrapped Phenomenon — Spotify Wrapped sharing mechanics analysis](https://aadilsyed.medium.com/the-wrapped-phenomenon-how-we-learned-to-love-sharing-our-data-6392034f995f)
- [Why Spotify Wrapped Goes Viral Every Year — Binghamton University](https://www.binghamton.edu/news/story/5948/why-spotify-wrapped-goes-viral-every-year-binghamton-university-experts-weigh-in)
- [UX Psychology Principles Behind Spotify Wrapped 2024](https://medium.com/design-bootcamp/ux-psychology-principles-behind-spotify-wrapped-2024-14f737002403)
- [Driving FOMO: Spotify on 10 Years of Wrapped — Marketing Week](https://www.marketingweek.com/fomo-spotify-10-years-wrapped/)
- [Spotify Wrapped Marketing Strategy: Viral Phenomenon — NoGood](https://nogood.io/blog/spotify-wrapped-marketing-strategy/)
- [Your 2024 Year In Sport is Here — Strava Community Hub](https://communityhub.strava.com/what-s-new-10/your-2024-year-in-sport-is-here-8084)
- [Strava Year in Review 2024 Analysis — Oreate AI Blog](https://www.oreateai.com/blog/strava-year-in-review-2024/7f4d570d05dfbaa567357a7f10f90ba4)
- [Patterns for Promoting PWA Installation — web.dev](https://web.dev/articles/promote-install)
- [Installation Prompt — web.dev PWA Learning Path](https://web.dev/learn/pwa/installation-prompt)
- [Trigger Installation from Your PWA — MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/How_to/Trigger_install_prompt)
- [PWA Stats — Conversion Case Studies](https://www.pwastats.com/)
- [Master PWA Installs on iOS and Android: The 2025 Guide — JunKangWorld](https://junkangworld.com/blog/master-pwa-installs-on-ios-android-the-2025-guide)
- [Open Graph Image Sizes for Social Media: Complete 2025 Guide — Krumzi](https://www.krumzi.com/blog/open-graph-image-sizes-for-social-media-the-complete-2025-guide)
- [Getting Started: Metadata and OG Images — Next.js Docs](https://nextjs.org/docs/app/getting-started/metadata-and-og-images)
- [Creating Dynamic OG Images with Next.js — Sanity Learn](https://www.sanity.io/learn/course/seo-optimization/creating-dynamic-open-graph-images-with-vercel-og)
- [Progressive Disclosure in UX — NN/Group](https://www.nngroup.com/articles/progressive-disclosure/)
- [What Is Progressive Disclosure in UX — UXPin](https://www.uxpin.com/studio/blog/what-is-progressive-disclosure/)
- [Guest Checkout vs. Account: Conversion Data — Krepling Pay](https://pay.krepling.com/guest-checkout-vs-account-which-strategy-converts-more-customers-in-2026/)
- [Best Sign Up Flows (2026) — Eleken](https://www.eleken.co/blog-posts/sign-up-flow)
- [Stop Losing Users at Onboarding: Progressive UX — Dreambit](https://dreambit.io/stop-losing-users-at-onboarding-how-progressive-ux-can-save-40-of-your-users/)
- [Should You Make the Main CTA on Mobile Stick-to-Scroll? — AB Tasty](https://www.abtasty.com/blog/mobile-stick-to-scroll/)
- [Sticky CTAs Data — StickyCTAs](https://www.stickyctas.com/articles/sticky-ctas-data)
- [Share files and prototypes — Figma Help Center](https://help.figma.com/hc/en-us/articles/360040531773-Share-files-and-prototypes)
- [Sharing a prototype without requiring sign-in — Figma Forum](https://forum.figma.com/ask-the-community-7/sharing-a-prototype-without-having-user-required-to-sign-in-to-figma-4274)
- [Sharing Your Strava Activities — Strava Support](https://support.strava.com/hc/en-us/articles/221089587-Sharing-Your-Strava-Activities)
- [How Spotify Used Motion Design to Create a Viral Campaign — Fable](https://www.fable.app/blog/how-spotify-used-motion-design-to-create-a-viral-annual-campaign)
- [4 Ways Spotify Wrapped Builds Brand Loyalty — Brand Extract](https://www.brandextract.com/Insights/Articles/4-Ways-Spotify%E2%80%99s-%E2%80%9CWrapped%E2%80%9D-Builds-Brand-Loyalty/)
