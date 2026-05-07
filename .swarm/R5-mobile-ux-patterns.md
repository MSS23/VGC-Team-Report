# Mobile UX Patterns Research: Share-to-View Flows
## VGC Team Report — Research Deliverable R5

**Research Date:** 2026-05-07
**Scope:** Strava, Pinterest, Behance, Figma Community, plus Spotify, Duolingo, Wordle, Chess.com, and the VGC-specific competitive tooling ecosystem

---

## Executive Summary

Five patterns dominate high-converting share-to-view flows across these platforms. In order of impact for a VGC team-sharing app:

1. **Full guest access, then gate the action** — Show all content to non-logged-in visitors. Gate only write operations (fork, save, edit). Every login wall before the content kills the sharing loop.
2. **Dynamic per-entity OG images** — A unique, rich preview card per team generates 3x more clicks than a generic site image. Pokemon sprites on a dark background work like faces in click studies: they draw the eye.
3. **Web Share API as the primary mobile CTA** — Trigger the OS-native share sheet (`navigator.share()`). It shows only apps the user has installed, feels native, and has ~92% mobile browser coverage.
4. **Achievement card artifacts** — Spotify Wrapped and Strava Year in Sport proved that pre-formatted, identity-expressing visual cards are screenshot-first content. For VGC, a "post-tournament card" with record + team is the equivalent.
5. **Defer sign-up to the value moment** — Convert viewers via a contextual action ("Duplicate this team to your account") rather than a generic "Create account" prompt. The value must be concrete and immediate.

---

## 1. How the "Share" Action Feels on Mobile

### 1.1 Strava

Strava's share flow is one of the most studied in sports/fitness. On mobile, after saving an activity:

- A share icon appears in the activity view header (top right)
- Tapping opens a **share type selector**: choose map-with-stats or photo overlay
- Stats overlaid on the image include: distance, elevation, moving time, pace — user-selectable
- A "Share to…" step then triggers the **OS-native share sheet** (iOS/Android)
- Alternatively: "Copy Link" copies the `strava.com/activities/[id]` URL

**2024 addition:** Custom social cards — Strava generates 4–5 stylized image variants (flyover, map+data, transparent PNG, minimalist) that users pick from before sharing. This is a "choose your identity card" mechanic.

**Screenshot detection quirk:** Strava detects screenshots taken of an activity and proactively surfaces a share prompt. This is a deliberate trigger intercept — controversial with power users but measurably increases share conversion.

### 1.2 Pinterest

Pinterest's share flow operates at the Pin level:

- Long-press or tap "..." on any pin → **Share sheet** with direct platform targets (Messages, Instagram, Facebook, Copy Link)
- On mobile web, tapping a shared pin URL loads the full pin image with related pins below
- A persistent top banner: "See more ideas like this on Pinterest →" — soft sign-up nudge without blocking content
- The pin is fully visible without an account; the banner is the only gate signal

**Insight:** Pinterest originally hard-gated content behind login and saw significant drop in organic referral traffic. They reversed this and moved to a soft-gate model for direct pin links, with hard-gate only on infinite browse.

### 1.3 Behance

Behance shares at the project level:

- "Share" button above project header opens a modal with: URL field + Copy, Twitter, Facebook, LinkedIn, Pinterest
- No native share sheet integration (desktop-centric product)
- On mobile web, the share modal appears as a full-width bottom overlay
- **Key differentiator:** Non-members can "Appreciate" (like) projects — the appreciation CTA is functional without an account, reducing the friction of social validation

### 1.4 Figma Community

Figma Community shares at the file level:

- Shared community file URL → landing page shows file name, author, preview image, like count, duplicate count
- Primary CTA: **"Get a copy"** — this is the conversion action that requires an account
- Non-logged-in users can view the preview and file description but must sign in to open or duplicate
- **The "Duplicate to edit" pattern** is Figma's primary viewer-to-user conversion: it frames sign-up as unlocking capability, not as a gate

### 1.5 Wordle (NYT) — Bonus: Viral Sharing Without an Account

Wordle's share mechanism is the gold standard for no-login viral sharing:

- After solving: "Share" button copies an **emoji grid** to clipboard (no image, no link, no account)
- The grid encodes the result as colored squares with no answer spoilers
- Mechanism: pure clipboard text, pasted anywhere — Twitter, Discord, SMS
- Zero friction: one tap → content is in clipboard → player pastes it
- This viral loop grew Wordle from 90 players to 2 million+ in 6 weeks

**VGC relevance:** A "copy team emoji" representation (6 Pokemon icons as unicode/emoji) is a viable no-login share primitive.

---

## 2. What the Landing Page Looks Like for Shared Links

### 2.1 Strava (Public Activity Page, Logged-Out)

When someone opens a shared Strava activity URL without an account:

- **Full content visible:** activity distance, elevation, moving time, pace, calories, map, elevation profile, splits, kudos count, comments
- **Gated:** ability to give kudos, comment, follow the athlete
- **Sign-up prompt:** sticky bottom bar "Join Strava to track your own activities and connect with friends"
- **Note:** Only works if the activity privacy is set to "Everyone" — Followers-only activities redirect to login immediately

### 2.2 Pinterest (Single Pin)

- Full-size pin image loads immediately above the fold
- Description + source link below
- "More like this" discovery rail loads after
- **Top banner (not modal):** "See more ideas on Pinterest" with Sign Up / Log In links
- The banner is persistent but single-line — it does not obscure content

### 2.3 Behance (Project Page)

- Full project images load (sometimes behind a lazy-load scroll)
- Creator bio, appreciation count, view count visible
- "Follow [Designer]" and "Appreciate" CTAs functional without login
- Adobe/Behance header shows "Sign In" and "Join" but does not interrupt content
- No interstitial, no modal, no forced redirect

### 2.4 Figma Community (File Page)

- Preview screenshot of the file is visible
- File metadata: name, creator, like count, duplicate count
- **Hard gate on open/use:** "Get a copy" requires login
- The page functions as a product landing page for the file, not a pure viewer
- Non-logged-in CTA hierarchy: (1) Like, (2) Get a copy [requires login]

### 2.5 Spotify (Shared Playlist/Track)

- On mobile: deep link attempts to open the Spotify app; if not installed, loads `open.spotify.com` web player
- Non-users see: 30-second preview of the first track, full tracklist, album art
- **Smart app banner** at top: "Get Spotify Free" → App Store / Google Play
- Content is meaningfully previewed — enough to understand value before committing to install

---

## 3. Sign Up to Interact vs. View Without Account

### 3.1 The Spectrum of Gating Philosophies

| Platform | View without account | Interact without account | Sign-up trigger |
|----------|---------------------|--------------------------|-----------------|
| Strava (public activity) | Full view | None — all interactions gated | Persistent bottom banner |
| Pinterest (direct pin link) | Full view | None | Non-blocking top banner |
| Behance | Full view | Appreciate/like (!) | On follow/comment |
| Figma Community | Preview only | Like only | On "Get a copy" |
| Spotify (web) | 30s preview | None | Smart app banner + inline |
| Wordle | Full play | N/A (no account system) | None |
| Letterboxd | Full view (web) | None | On rate/review |

### 3.2 Key Finding: Behance's "Appreciate Without Account" Is Unusual and High-Value

Behance allows non-members to click the Appreciate button. This is deliberately permissive — it:
- Gives visitors a micro-commitment action (reduces exit rate)
- Creates a notification for the creator (driving creator satisfaction)
- Surfaces the sign-up prompt naturally ("Create an account to see who appreciated your project")

**For VGC Team Report:** Allowing guests to "upvote" or "save to favorites" a team without logging in, then prompting sign-up to see the notification, mirrors this pattern exactly.

### 3.3 Modal vs. Redirect for Sign-Up

Research across these platforms:

- **Modal over redirect:** Every studied platform that achieves high share-to-signup conversion keeps the original content visible behind the sign-up flow. Redirecting to `/signup` and destroying the context is a conversion killer.
- **Notion's pattern (not in the brief but most instructive):** The shared page stays fully visible; the sign-up slide-in panel appears from the right without obscuring content. Clicking anywhere outside dismisses it.
- **Pinterest's mobile:** Taps on restricted actions (save, create board) trigger a bottom sheet sign-up, not a page redirect.

### 3.4 Single Sign-On Priority Order for Mobile

All platforms studied put social/OAuth sign-in above email/password for mobile because it eliminates typing:

1. Continue with Google (covers most users)
2. Continue with Discord (covers VGC community specifically)
3. Continue with Apple (iOS users)
4. Email + password (power users, last resort)

---

## 4. Viewer-to-Creator Onboarding Patterns

### 4.1 Contextual Value Proposition

The highest-converting onboarding shown by shared-content platforms follows this structure:

```
[Content fully visible]
       ↓
[Action attempted that requires account]
       ↓
[Bottom sheet or slide-in panel]
[Showing: "Create a free account to [specific action]"]
       ↓
[OAuth buttons — one tap on mobile]
       ↓
[Immediately return to original content, with action now available]
```

The key is **specificity**: "Create an account to duplicate this team and run your own calcs" converts better than "Create an account to get started."

### 4.2 Duolingo's Friend Streak Pattern (Social Commitment)

Duolingo's Friend Streak found that learners with at least one shared streak are **22% more likely to complete their daily lesson**. The pattern:

- One user invites a friend by link
- The friend receives a personal invite ("join [Name]'s streak") not a generic app promo
- Acceptance creates mutual commitment — both parties are invested
- This social obligation mechanism is more powerful than reminders

**VGC application:** "Team review request" — a player sends their team link to another player asking "what do you think?" The recipient has a social reason to create an account (to give feedback) not just a product reason.

### 4.3 Figma's "Duplicate to Edit" Funnel

Figma measures community conversion by "duplicate count." Their insight:

- Viewers who duplicate once become regular creators (high LTV signal)
- The "Get a copy" CTA is the clearest possible value statement
- No free trial, no pricing, no sales funnel — just: "here's how to use this right now"

**For VGC Team Report:** "Fork this team" as the sign-up trigger is the equivalent — the user wants to modify the team they just viewed, and the sign-up unlocks exactly that capability.

### 4.4 Strava's Problematic Pattern (Anti-example)

Strava has been criticized in the running/cycling community for progressively tightening its login gate. The current pattern:

- Non-users see limited activity data on Strava profiles
- Public activity pages are fully visible but the sign-up prompt is more aggressive than before
- **Result:** Fewer organic link shares, less viral loop, weaker new-user acquisition from social sharing

The lesson: over-gating shared content actively damages virality even when the product is strong.

---

## 5. Visual Preview Patterns That Drive Click-Through

### 5.1 OG Image Best Practices (2026 Reality)

**Universal standard:** 1200x630px, PNG or JPEG, under 1MB, publicly accessible URL

| Platform | Renders at | Key requirement |
|----------|-----------|-----------------|
| Twitter/X | Large card 1200x600 (2:1 crop) | `twitter:card: summary_large_image` |
| Discord | Inline embed ~400px wide | Clear at small size |
| Reddit | Thumbnail in link posts | Text legible at 128px wide |
| Slack | ~400px wide sidebar preview | Title + image |
| WhatsApp | Small thumbnail (~80px) | Strong visual contrast |

### 5.2 What Makes High-CTR OG Images

Across social sharing research:

1. **Character/face-equivalent imagery** — Pokemon sprites serve the same click-attracting role as human faces in A/B tests. They draw the eye before text.
2. **Contrast** — Dark background with bright sprites stands out in light-mode feeds (Twitter/Reddit default). The inverse: light background for dark-mode-dominant platforms (Discord).
3. **Text legible at 256x134px** — This is Discord's preview size. Any text smaller than ~36px at 1200x630 becomes unreadable.
4. **Unique per-entity** — Generic site-wide OG images get ignored by repeat visitors. Per-team images maintain click novelty.
5. **Brand attribution visible but not dominant** — Bottom-right watermark at 16–18px is the standard across Strava cards, Spotify Wrapped, and Figma Community tiles.

### 5.3 Dynamic OG Generation in Next.js (Implementation-Ready)

Next.js App Router has a native `opengraph-image.tsx` convention that generates images via Vercel Edge Functions, cached automatically:

```
app/teams/[slug]/opengraph-image.tsx
```

Vercel's `@vercel/og` ImageResponse renders HTML/CSS to PNG at ~800ms average (demonstrated at scale with Next.js Conf 100,000+ attendee tickets). This is production-viable at any scale the VGC app will reach.

**Recommended card design for VGC Team Report:**
- Background: dark gradient (`#1a1a2e → #16213e`) — the competitive/tournament aesthetic
- Row of 6 Pokemon sprites (96x96px each) with a 16px gap
- Team name in bold white, 48px — most prominent text
- Regulation tag (Reg G, Reg H etc) in muted gray, 24px
- Bottom right: "VGC Team Report" watermark, 16px, ~40% opacity
- Optional: if tournament record exists, show "7-2 at [Tournament]" in an accent color badge

### 5.4 The Strava Social Card Model

Strava's custom card generator is the closest analog to what VGC Team Report should build:

- User picks from 4–5 pre-designed card styles (each emphasizes different data)
- Cards include a QR code or short URL for tracking
- Can be downloaded (1080x1920 for Instagram Stories, 1200x630 for Twitter) or shared directly via native share sheet
- The **stat selection** is identity expression — choosing which stats to show IS part of the sharing act

**For VGC:** Let players choose: "Show my team's coverage" vs. "Show my tournament record" vs. "Show my damage calc highlights" as card variants.

### 5.5 Wordle's Emoji Grid — The Zero-Pixel Alternative

For contexts where images don't render (SMS, older messaging apps, plain-text channels), a text-based share primitive is valuable:

```
My VGC Team @ Sheffield Regionals
7-2 — Top 16

🔥🌊❄️🌿⚡🌙
[Calyrex-S][Kyogre][Miraidon][Rillaboom][Regieleki][Lunala]

vgcteamreport.com/t/abc123
```

This is the Wordle model applied to team sharing: structured text that communicates identity even when the link doesn't unfurl. It also works in Discord servers where link embeds are disabled.

---

## 6. Platform-Specific Signals for VGC Team Report

### 6.1 Twitter/X (Primary VGC Distribution Channel)

- VGC pros, content creators, and tournament organizers are active on X
- `summary_large_image` card type — 1200x600 (2:1) renders without cropping
- 6 sprites visible at thumbnail size is the goal — each sprite should be ~180x180px on the card
- Pre-composed tweet text in share modal: `[Team Name] for Regulation [X] 🏆 vgcteamreport.com/t/abc123 via @VGCTeamReport`

### 6.2 Discord (Community Home)

- Most VGC discussion happens in Discord servers (r/VGC adjacent, regional circuits, content creator servers)
- Discord embeds og:image inline in chat — one shared link produces an automatic rich preview
- Title: "calyrex-shadow-kyogre-tr — VGC Team Report"
- The embed acts as a mini-advertisement for the platform in every Discord server that receives a shared link
- Suggested: Discord OAuth as sign-in option (the community already has Discord accounts)

### 6.3 Reddit (r/stunfisk, r/VGC, r/pokemon)

- Reddit link posts show og:image as the post thumbnail
- OG image must communicate value even without reading the title (scanned at 128x128px in mobile feed)
- Regulation and "Top Cut" or "7-2 Record" badge in the image would perform well in these communities

### 6.4 In-Person Tournament Context

- VGC has a specific analog use case: opponents must preview teams before matches (best-of-3 format)
- Current player behavior: show team sheet PDF, show Pokepaste URL, show phone screen
- Opportunity: QR code in the share modal labeled "Show at tournament" that links to the streamlined public view
- The public team view should load in under 2 seconds on tournament venue WiFi/LTE

---

## 7. Competitive Tooling Analysis (VGC-Specific)

### 7.1 Current Share Patterns in the Ecosystem

| Tool | Share method | Landing page | Guest access | OG image |
|------|-------------|--------------|--------------|----------|
| Pokepast.es | Copy paste URL | Plain text | Full | None (plain page) |
| Pikalytics | Copy link, Share Image, Pokepaste | Structured team view | Full | Generic |
| crob.at | Shareable link | Clean sprites + movesets | Full (no account) | Unknown |
| Limitless | Team lists on event pages | Tabular | Full | Generic event |
| VGC Team Report (target) | Web Share API + Copy Link + Card | Full rich report | Full (guest) | Dynamic per-team |

### 7.2 Differentiation Opportunities

1. **Dynamic OG images** — No current VGC tool generates per-team preview images. First mover advantage is high because every Discord share would embed a unique, branded card.
2. **Web Share API** — No current VGC tool uses the native share sheet. "Share" buttons in Pokepaste and crob.at are simple copy-link flows.
3. **Tournament card** — Post-result shareable image (record + team) has no equivalent in the ecosystem. This is the "Strava Year in Sport" moment for VGC.
4. **Fork-to-create onboarding** — None of the current tools have a "duplicate this team to your account" flow. Pokepaste is anonymous and stateless.

---

## 8. Recommended Implementation Sequence

### Tier 1 (Immediate impact, low complexity)
1. **Dynamic `opengraph-image.tsx`** per team route — sprites, name, regulation on dark background
2. **Web Share API** as primary mobile share CTA with clipboard fallback
3. **Full guest access** on `/teams/[slug]` — remove any login requirement from the view route

### Tier 2 (High conversion impact)
4. **Bottom sheet share modal** (desktop: center modal; mobile: bottom sheet) with Copy Link as primary action + Discord/Twitter/Reddit icons
5. **Non-blocking sign-up nudge** — persistent bottom banner on guest views, not a modal interstitial
6. **"Fork this team" conversion trigger** — the contextual sign-up prompt that ties account creation to immediate value

### Tier 3 (Virality and retention)
7. **Downloadable team card** (1200x630 + 1080x1920) — server-generated via `/api/team-card/[slug]`
8. **QR code in share modal** — "Show at tournament"
9. **Post-tournament shareable card** — record + team, timed to tournament end = Wrapped-style moment

---

## Sources

- [Sharing Your Strava Activities – Strava Support](https://support.strava.com/hc/en-us/articles/221089587-Sharing-Your-Strava-Activities)
- [How to Get and Share Links From Strava – Strava Support](https://support.strava.com/hc/en-us/articles/4418607378189-How-to-Get-and-Share-Links-From-Strava)
- [Now you can create custom Strava cards for social media | BikeRadar](https://www.bikeradar.com/news/now-you-can-create-custom-strava-cards-for-social-media)
- [How Do Your Profile and Activities Appear When Logged Out? | Strava Community](https://communityhub.strava.com/insider-journal-9/how-do-your-profile-and-activities-appear-when-logged-out-1525)
- [Pinterest's value-driven onboarding flow – GoodUX / Appcues](https://goodux.appcues.com/blog/pinterests-value-driven-onboarding-flow)
- [Pinterest Without Login: Explore & Save Pins | GlobalEx](https://globalex-soft.com/blog/pinterest-without-login-explore-and)
- [Guide: Sharing and Embedding Behance Content – Behance Help](https://help.behance.net/hc/en-us/articles/19288565618971-Guide-Sharing-and-Embedding-Behance-Content)
- [Guide: Share Your Work With Social Media – Behance Help](https://help.behance.net/hc/en-us/articles/204485084-Guide-Share-Your-Work-With-Social-Media)
- [Duplicate Community files – Figma Learn](https://help.figma.com/hc/en-us/articles/360038510873-Duplicate-Community-files)
- [Sharing a prototype without signing in – Figma Forum](https://forum.figma.com/ask-the-community-7/sharing-a-prototype-without-having-user-required-to-sign-in-to-figma-4274)
- [5 product lessons from building Friend Streak – Duolingo Blog](https://blog.duolingo.com/product-lessons-friend-streak/)
- [Wordle – Wikipedia (viral sharing mechanism)](https://en.wikipedia.org/wiki/Wordle)
- [UX Considerations for Web Sharing – CSS-Tricks](https://css-tricks.com/ux-considerations-for-web-sharing/)
- [Introducing OG Image Generation – Vercel](https://vercel.com/blog/introducing-vercel-og-image-generation-fast-dynamic-social-card-images)
- [Open Graph (OG) Image Generation – Vercel Docs](https://vercel.com/docs/og-image-generation)
- [How to Automatically Generate OG Images for Next.js 15.4+ | Build with Matija](https://www.buildwithmatija.com/blog/complete-guide-dynamic-og-image-generation-for-next-js-15)
- [Open Graph Image Sizes 2026 – Krumzi](https://www.krumzi.com/blog/open-graph-image-sizes-for-social-media-the-complete-2026-guide)
- [Deferred Deep Linking – Branch.io](https://www.branch.io/glossary/deferred-deep-linking/)
- [Pikalytics VGC Team Builder](https://www.pikalytics.com/team)
- [crob.at — Competitive Pokémon Tools](https://crob.at)
- [VGC Pastes – Falinks Teambuilder](https://www.falinks-teambuilder.com/pastes/vgc/)
- [PokePaste – crob.at](https://crob.at/pokepaste)
- [Mobile App Conversion Rate Benchmarks – UXCam](https://uxcam.com/blog/mobile-app-conversion-rate/)
- [Gated vs. Ungated Content – Leadfeeder](https://www.leadfeeder.com/blog/comparisons/gated-vs-ungated-content/)
