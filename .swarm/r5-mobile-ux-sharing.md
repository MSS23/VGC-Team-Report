# Mobile UX Sharing Research: Share-to-View Flows for VGC Team Report

**Research Date:** 2026-05-07
**Researcher:** UX Analysis Agent (r5)
**Focus:** Mobile sharing flows, share-to-view conversion, viral patterns for team report app

---

## Executive Summary

The highest-leverage improvements for share-to-view flows in VGC Team Report center on five themes: (1) native share sheet integration via Web Share API with smart fallback, (2) bottom sheet share modals instead of center-screen dialogs on mobile, (3) dynamic per-team OG images that act as identity-expression artifacts, (4) frictionless "view first, sign up later" guest flows, and (5) share trigger timing that fires after emotional peaks (end of last slide, after viewing damage calcs). Shareability in the VGC context is driven by identity expression — a player's team reflects who they are — making achievement-style cards (Spotify Wrapped model) the strongest viral mechanic available.

---

## 1. Share Modal UX Best Practices

### 1.1 Desktop vs. Mobile Modal Architecture

**The platform split is decisive.** Successful sharing apps (YouTube, Instagram, Pinterest) use:
- **Desktop**: Center-screen modal with multiple share targets + copy-link field
- **Mobile**: Native bottom sheet (iOS "sheet", Android "bottom sheet") that leverages OS-level share UX

Key insight from industry analysis: bottom sheets achieve **25–30% higher engagement rates** than traditional center-screen modals on mobile because they are less intrusive, easier to dismiss with a swipe, and feel native.

### 1.2 Optimal Share Modal Structure

Based on patterns across Figma, Notion, Strava, and Pinterest:

```
Share Modal Layout (mobile bottom sheet):
┌─────────────────────────────────┐
│  [Handle bar / drag indicator]  │
│                                 │
│  Share "[Team Name]"            │  ← Contextual title
│                                 │
│  [URL input + Copy Link btn]    │  ← Always first / most prominent
│                                 │
│  [Native Share / More Options]  │  ← Web Share API trigger
│                                 │
│  ─── Or share to ───            │
│                                 │
│  [Twitter/X] [Discord] [Reddit] │  ← 3 max platform icons (VGC-relevant)
│                                 │
│  [Embed code]  [Download img]   │  ← Secondary actions, collapsible
└─────────────────────────────────┘
```

**What to limit:** Showing 8+ social platform icons creates decision paralysis. For VGC, the relevant platforms are Twitter/X, Discord, and Reddit — 3 icons maximum. Facebook and LinkedIn are irrelevant to this community.

**Important:** Never show share counts if they are low. Low share counts create negative social proof and actively suppress sharing ("this content isn't good enough"). Hide the counter until a meaningful threshold (100+ views or 10+ shares).

### 1.3 Copy Link UX

- Copy link must be the **first and most prominent action** — it's the universal fallback and most common action
- After copy: show inline confirmation ("Copied!") inside the button or field — not a separate toast
- On Android 13+, the OS shows its own "Copied" toast; avoid doubling up
- Icon: use a chain-link icon, not the ambiguous "share" box-with-arrow
- Auto-select the URL text on tap so power users can copy manually if needed

### 1.4 Embed Code

Include an embed option only if:
- The content is likely to be embedded in third-party blogs (team analysis articles, tournament recaps)
- The user has explicitly created a public/shareable team

For VGC Team Report: a minimal iframe embed option is worth including (tournament organizers embed team lists in match pages), but make it a secondary collapsed section — not primary UI.

---

## 2. Social Sharing CTAs: Placement, Copy, and Timing

### 2.1 Where to Place Share CTAs

Research across CTA placement studies:

| Placement | Effect |
|-----------|--------|
| After last slide / end of report | +20–30% conversion vs. inline |
| After damage calc reveals (emotional peak) | High shareability moment |
| After "this team went X-Y at tournament" | Identity expression trigger |
| Floating sticky (always visible) | Creates noise, reduces focus; use sparingly |
| CTAs placed after testimonials/proof points | Convert 25% better |

**For VGC Team Report specifically:** The share trigger should appear:
1. At the end of the final slide ("You've seen the full report — share it")
2. On the team summary view, after all 6 Pokemon are displayed
3. As a sticky mini-share button in the top-right corner (icon only, no label) that opens the bottom sheet

**Never** interrupt mid-viewing with a share prompt. Users are in analysis mode; interrupting breaks flow.

### 2.2 CTA Copy That Converts

Avoid generic: "Share this team"
Use identity-expression language:
- "Share your team" (ownership framing)
- "Show them what you're bringing" (tournament context)
- "Let the meta know" (community provocation)
- "Copy team link" (functional, honest — high trust)

Primary CTAs in center of screen get 682% more clicks than left-aligned alternatives. For mobile bottom sheet, center the primary "Copy Link" button.

### 2.3 Timing and Triggers

**Best trigger moments:**
- After completing the team (all 6 Pokemon added) — celebration moment
- After running damage calcs — "my Calyrex can survive that!" identity peak
- After importing a pokepaste — "look at my refined build"
- After tournament results are logged (if this feature exists)

**Urgency is counterproductive** in community tools. Don't use "Limited time" — VGC players distrust marketing language. Lean into community and identity instead.

---

## 3. "View Without Account" Flows: Guest Access Patterns

### 3.1 The Friction Paradox

The research consensus: **requiring login before viewing a shared link kills sharing loops.** Strava's decision to require login for full activity viewing is widely criticized as a growth mistake. Notion's public pages model (view without account, sign up to duplicate/edit) is the correct pattern for content-first products.

**Principle:** Every friction step between "click link" and "see content" reduces sharing motivation. If a VGC player shares a team link and their friend hits a login wall, the friend's willingness to return later is near zero.

### 3.2 Recommended Guest Flow

```
Shared link received
       ↓
Full team report loads (no login, no interstitial)
       ↓
Persistent but non-intrusive banner at bottom:
"Want to build your own team? Create free account →"
       ↓
User scrolls through all slides
       ↓
End-of-report CTA (contextual):
"Like this team? Duplicate it to your account →"
       ↓
Sign-up modal (NOT a redirect) — keep the report visible behind it
```

**Key pattern from SaaS analysis:** Gate the *action* (copy, edit, fork), not the *viewing*. Let guests see everything; require an account only to interact.

### 3.3 Guest-to-Registration Conversion

Research from SaaS sharing flows:
- Modal sign-up (overlay, content stays visible) converts better than redirect-to-signup-page
- "Duplicate this team" as the conversion trigger outperforms generic "create account" because it provides immediate value
- Show what they'll get: "Save this team to your account to run calcs, export, and get updates"
- Don't ask for email upfront — offer "Continue with Google/Discord" first (single tap on mobile)

---

## 4. Mobile-Specific Sharing Patterns

### 4.1 Web Share API: The Right Primary Mobile Action

**Web Share API** (`navigator.share()`) is the single most impactful mobile sharing improvement available:
- Triggers the OS-native share sheet (the same UI users use in every other app)
- Shows only apps the user has installed (personalized relevance)
- Mobile browser support: ~92% (caniuse.com)
- Must be triggered by user gesture (button tap) — cannot fire automatically
- HTTPS required

**Implementation pattern for VGC Team Report:**

```typescript
const handleShare = async () => {
  const shareData = {
    title: `${team.name} — VGC Team Report`,
    text: `Check out this ${team.regulation} team on VGC Team Report`,
    url: teamUrl,
  };
  
  if (navigator.share && navigator.canShare(shareData)) {
    // Mobile: native share sheet
    await navigator.share(shareData);
  } else {
    // Desktop: open share modal
    setShareModalOpen(true);
  }
};
```

**Fallback chain:** Web Share API → copy to clipboard + confirm → open share modal with platform icons.

### 4.2 Deep Links

Every team should have a canonical deep link: `vgc-team-report.vercel.app/teams/[team-slug]`

Deep link best practices:
- Slug should be human-readable: `/teams/calyrex-shadow-kyogre-reg-g` not `/teams/abc123`
- Canonical URL in og:url must match the shareable URL exactly
- No tracking params in the base URL (clean links get shared more); add UTM in the share modal's generated URL only

### 4.3 QR Code for Tournament Context

VGC has a specific high-value use case: in-person team preview at tournaments. Players show their team to opponents before the match.

**Add QR code to share modal** (secondary action):
- Generate client-side using a library like `qrcode.react`
- Link to the public team view
- Label: "Show at tournament" or "Let opponent scan"
- Display at 200x200px minimum for camera scanability

This is a unique VGC-specific differentiator that no other platform offers cleanly.

### 4.4 Downloadable Share Image (The "Wrapped Card")

The highest-virality mobile sharing pattern for team-report content is the **achievement card** model, pioneered by Spotify Wrapped and replicated by Strava Year in Sport.

**Why it works:**
- Transforms data into identity expression
- Pre-formatted for Instagram Stories (9:16) or Twitter cards (16:9)
- No friction: one tap → download → paste into preferred platform
- Each card is unique to the player = natural conversation starter

**For VGC Team Report:** Generate a shareable team card image featuring:
- Team name + regulation
- 6 Pokemon sprites (large, clear)
- Key stat (tournament record, top threat handled, damage calc highlight)
- Branding: vgc-team-report.com watermark (subtle but present)
- Background: themed to the team's archetype (Trick Room = dark/purple, Weather = environmental)

Implementation: Use `html2canvas` or a server-side `@vercel/og` ImageResponse route to generate the card. Offer two formats: 1200x630 (Twitter card) and 1080x1920 (Instagram Story).

---

## 5. OG Image Best Practices for Social Sharing

### 5.1 Dimensions (2026 Reality)

| Platform | Recommended Size | Notes |
|----------|-----------------|-------|
| Twitter/X | 1200x600 (2:1) | Renders without cropping |
| Facebook | 1200x630 | Standard OG spec |
| Discord | 1200x630 | Shows inline in chat |
| Slack | 1200x630 | Shows in link preview |
| LinkedIn | 1200x627 | Close enough to standard |
| Universal safe | 1200x630 | One size for all |

**2026 update:** Major platforms now render 2:1 (1200x600) without cropping. Using 1200x630 is still safe as the 30px difference is negligible.

**Format:** JPEG for photo-heavy cards, PNG for sprite-based Pokemon cards. AVIF and WebP are NOT supported for OG images.

**File size:** Under 5MB, ideally under 1MB for fast social preview loading.

### 5.2 Dynamic OG Image Generation in Next.js

VGC Team Report (Next.js App Router) should implement per-team dynamic OG images using the `opengraph-image.tsx` file convention:

```
app/
  teams/
    [slug]/
      page.tsx
      opengraph-image.tsx  ← generates custom image per team
```

```typescript
// app/teams/[slug]/opengraph-image.tsx
import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image({ params }: { params: { slug: string } }) {
  const team = await getTeamBySlug(params.slug);
  
  return new ImageResponse(
    <div style={{ 
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
      width: '100%', height: '100%',
      display: 'flex', flexDirection: 'column',
      padding: '48px'
    }}>
      <div style={{ fontSize: 48, fontWeight: 700, color: '#fff' }}>
        {team.name}
      </div>
      <div style={{ fontSize: 24, color: '#a0aec0', marginTop: 8 }}>
        {team.regulation} · VGC Team Report
      </div>
      {/* Pokemon sprite row */}
      <div style={{ display: 'flex', gap: 16, marginTop: 32 }}>
        {team.pokemon.map(p => (
          <img key={p.name} src={p.spriteUrl} width={96} height={96} />
        ))}
      </div>
    </div>
  );
}
```

**Vercel Edge caches computed images automatically** — no manual cache invalidation needed.

### 5.3 OG Content Best Practices

- `og:title`: Include team name + regulation — max 60 chars before truncation
- `og:description`: "A [Archetype] team by [Player] — view matchups, calcs & strategy" (120–150 chars)
- `og:url`: Canonical team URL with no tracking params
- `og:type`: `website` (not `article` — teams don't expire)
- `twitter:card`: `summary_large_image` for the full 1200x630 preview
- `twitter:site`: `@VGCTeamReport` (or whatever the official handle is)

**Critical:** Set different OG tags per team page. Sharing from a specific team page should show that team's image, not a generic site image.

### 5.4 What Makes a High-CTR OG Image

Research from social sharing analysis:
1. **Faces and characters** get more clicks — Pokemon sprites serve this purpose well
2. **Contrast and color** — dark backgrounds with bright sprites stand out in feeds
3. **Readable text at thumbnail size** — test at 400x210px (Twitter feed size) and 256x134px (Discord preview)
4. **Clear brand attribution** — small watermark bottom-right builds brand recognition over time
5. **Dynamic content** — the same generic image for every share kills CTR; unique per-team images consistently outperform

---

## 6. What Makes Shared Content Go Viral vs. Sink

### 6.1 The VGC Identity Layer

VGC players share teams because of identity expression — "this team reflects my skill, creativity, and meta-read." This is the same psychological driver as Spotify Wrapped. The team IS the player's identity in the competitive space.

**What triggers sharing:**
- Tournament performance attached (went 7-2 at Regionals → very shareable)
- Unexpected or creative core (Wo-Chien + Calyrex counter-pick → conversation starter)
- Visual novelty (unusual types, interesting Tera types)
- Validation-seeking (shared before tournament for community feedback)
- Post-tournament debrief (community tradition, especially top cuts)

**What kills sharing:**
- Incomplete teams (only 4 Pokemon built)
- No context (just a pokepaste with no notes)
- Generic teams (standard meta copy with no original thinking)
- Login required to view (destroys the feedback loop)

### 6.2 Emotion and Timing

Research on viral content: **high-arousal emotions drive sharing**. For VGC:
- Awe: "This Grimmsnarl set survives +2 Life Orb Calyrex" (impressive calc)
- Pride: "My team went 7-1 at Sheffield"
- Provocation: "This team loses to nothing in the meta right now"

**Timing windows for VGC sharing:**
- Immediately after a tournament result (24-48hr window)
- During regulation announcement week (everyone is building)
- Post-World Championship (analysis season)

### 6.3 Shareability Score Design Principle

**Never display a share count below your credibility threshold.**

If a team has 3 shares, showing "3 people shared this" is worse than showing nothing — it signals the team isn't notable. Options:
- Show shares only above 50 or 100
- Show "views" instead (higher number, less commitment signal)
- Show community engagement: "12 comments" (activity signal without vanity metrics)

### 6.4 The Viral Loop Architecture

For VGC Team Report to achieve viral growth, the sharing loop must be:

```
Player builds team
       ↓
System prompts: "Share your team" (after completion)
       ↓
Player shares link (with rich OG image preview)
       ↓
Viewer sees full team WITHOUT login
       ↓
Viewer wants to analyze/copy → signs up
       ↓
New player builds team → shares → loop continues
```

**Friction in any step breaks the loop.** The login wall between steps 3 and 4 is the most common loop-killer in SaaS sharing products.

### 6.5 "Wrapped-Style" Campaign Moments

Spotify Wrapped works because:
1. **Personalized** (unique to each user)
2. **Timed** (year-end reflection resonates culturally)
3. **Visual** (designed to be screenshotted, not just linked)
4. **Comparative** (see where you stand vs. others)

VGC Team Report equivalents to build:
- **"My Regulation G Season"** — year-end card with tournament record, teams used, win rate
- **Post-tournament card** — auto-generated after entering a result: "I went 7-2 at [Tournament] with this team"
- **Meta matchup badge** — "This team handles 9/10 of the current top meta cores"

These are screenshot-native artifacts. Players will post them to Twitter/Discord naturally because they express identity.

---

## 7. Platform-Specific Recommendations for VGC Team Report

### 7.1 Twitter/X (Primary platform for VGC community)

- Large image preview (summary_large_image)
- 1200x600 optimal (2:1 renders cleanly)
- Include 6 sprite thumbnails prominently
- @-mention support in pre-composed tweet text

### 7.2 Discord (Community's home)

- Discord renders og:image inline in chat — this is huge for VGC Discord servers
- Include team name in og:title so it previews cleanly
- Add discord-specific UTM: `?ref=discord` to track which community drives traffic

### 7.3 Reddit (r/stunfisk, r/VGC)

- Reddit shows the og:image in link posts
- Design card to be compelling without clicking (enough info in the image alone)
- Include regulation and record in the image for Reddit post scannability

### 7.4 Tournament Circuit (In-person)

- QR code in share modal → "Show at tournament"
- Clean, fast-loading team view (no heavy JS bundles before paint)
- Print-friendly CSS for players who bring physical team sheets

---

## 8. Technical Implementation Priorities (Next.js 16)

### Priority 1: Dynamic OG Images (Week 1)
- Implement `opengraph-image.tsx` per team route
- Design: dark background, 6 sprites, team name, regulation, branding
- Test with Twitter Card Validator and Facebook Sharing Debugger

### Priority 2: Web Share API Integration (Week 1)
- Add native share button for mobile (fires `navigator.share()`)
- Graceful fallback to clipboard copy + bottom sheet modal
- Bottom sheet for desktop with Copy Link + 3 platform icons

### Priority 3: Guest View Flow (Week 2)
- Remove login requirement from `/teams/[slug]` public view
- Add persistent non-blocking sign-up nudge (bottom banner)
- Gate only: "Duplicate this team", "Save to my account", "Edit"

### Priority 4: Shareable Team Card Image (Week 3-4)
- Server-side image generation via `/api/team-card/[slug]`
- Two formats: Twitter (1200x630) and Story (1080x1920)
- "Download share image" in share modal

### Priority 5: Share Trigger Timing (Week 2)
- Fire share prompt after last slide scroll completion
- Show share nudge after damage calc runs (emotional peak)
- Add share button to post-tournament result screen

---

## Sources

- [UX Considerations for Web Sharing | CSS-Tricks](https://css-tricks.com/ux-considerations-for-web-sharing/)
- [How to Design the Most Intuitive Share Modal | UX Movement](https://uxmovement.substack.com/p/how-to-design-the-most-intuitive)
- [CTA Best Practices 2025 | Protocol80](https://www.protocol80.com/blog/cta-best-practices)
- [CTA Placement Strategies That Boost Conversions | Avintiv Media](https://avintivmedia.com/blog/cta-placement-strategies-that-work/)
- [BEST HIGH-CONVERTING CTA STATISTICS 2025 | Amra & Elma](https://www.amraandelma.com/high-converting-cta-statistics/)
- [Bottom Sheets: Definition and UX Guidelines | Nielsen Norman Group](https://www.nngroup.com/articles/bottom-sheet/)
- [Best Examples of Mobile App Bottom Sheets | Plotline](https://www.plotline.so/blog/mobile-app-bottom-sheets/)
- [Open Graph Image Sizes for Social Media: The Complete 2025 Guide | Krumzi](https://www.krumzi.com/blog/open-graph-image-sizes-for-social-media-the-complete-2025-guide)
- [The Best OG Image Tips in 2025 | MyOGImage](https://myogimage.com/blog/og-image-tips-2025-social-sharing-guide)
- [Introducing OG Image Generation | Vercel](https://vercel.com/blog/introducing-vercel-og-image-generation-fast-dynamic-social-card-images)
- [Dynamic OG Images in Next.js | F22 Labs](https://www.f22labs.com/blogs/boost-site-engagement-with-dynamic-open-graph-images-in-next-js/)
- [Web Share API | W3C](https://w3c.github.io/web-share/)
- [Sharing made simple: Web Share API | Vaadin Blog](https://vaadin.com/blog/sharing-made-simple-integrating-the-web-share-api-with-vaadin)
- [Designing for Social Sharing | Number Analytics](https://www.numberanalytics.com/blog/designing-for-social-sharing)
- [Viral Social Media Psychology: 7 Mental Triggers | Postnitro](https://postnitro.ai/blog/post/viral-social-media-psychology-7-mental-triggers)
- [The Wrapped Phenomenon | Medium](https://aadilsyed.medium.com/the-wrapped-phenomenon-how-we-learned-to-love-sharing-our-data-6392034f995f)
- [Design your apps for viral growth | Placid.app](https://placid.app/blog/design-your-apps-for-viral-growth-with-social-sharing)
- [Toast Notifications UX | LogRocket](https://blog.logrocket.com/ux-design/toast-notifications/)
- [Login & Signup UX Guide 2025 | Authgear](https://www.authgear.com/post/login-signup-ux-guide)
- [Sharing Your Activities - Strava Support](https://support.strava.com/hc/en-us/articles/221089587-Sharing-Your-Strava-Activities)
- [Share files and prototypes | Figma Help Center](https://help.figma.com/hc/en-us/articles/360040531773-Share-files-and-prototypes)
- [Next.js Metadata and OG Images](https://nextjs.org/docs/app/getting-started/metadata-and-og-images)
- [Open Graph meta tags | Ahrefs](https://ahrefs.com/blog/open-graph-meta-tags/)
- [Social Proof design pattern | UI Patterns](https://ui-patterns.com/patterns/Social-proof)
- [The Psychology of Viral Content | COMGroup](https://www.comgroup.com/blog/the-psychology-of-viral-content-why-we-share)
- [QR Codes for Sports | Fan Engagement | Flowcode](https://www.flowcode.com/industries/sports)
- [VGC Team Report](https://pokemonvgcteamreport.com)
- [PokePaste](https://pokepast.es/)
- [VGC Pokepastes on X](https://x.com/VGCPastes)
