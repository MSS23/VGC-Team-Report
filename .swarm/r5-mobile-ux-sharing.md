# R5: Mobile UX Sharing Patterns - Cross-App Analysis

**Date:** 2026-05-26
**Focus:** Share-to-view flows from successful sharing apps and applicability to VGC Team Report

---

## 1. Strava - Activity Sharing

### Share Flow UX
- **Taps to share:** 2 taps (activity screen -> share icon -> choose destination)
- Share icon is prominent on every activity view
- On tap, presents a horizontal scrollable row of share destinations (Instagram Stories, WhatsApp, Copy Link, etc.)
- Activity visibility must be set to "everyone" or "followers" for sharing to work (private activities blocked)

### Preview / OG Image Generation
- **Auto-generated share cards:** Strava creates a visual card with route map, distance, elevation, and time stats
- GPS-recorded activities show a map overlay; non-GPS activities show stats only
- "Sticker Stats" feature (Spring 2025): transparent PNG stickers with route line drawing + stats, optimized for Instagram Stories overlay
- If photos are attached, user chooses between map card or photo share
- Share image cropped to 16:9 portrait for Stories compatibility

### Deep Linking
- Uses **Branch.io** for deferred deep links
- Non-app users directed to app store; app users deep-linked to the specific activity
- 75% click-to-install rate reported in Facebook Ad campaigns
- ~10% of users share activities externally, generating tens of millions of shares/month
- Shared links open a rich web preview for non-app users, deep-link into app for installed users

### Mobile-First Design Patterns
- Share button always visible without scrolling on activity view
- Instagram Stories integration is first-class (auto-opens Instagram with sticker placed)
- Snapchat Lens integration for overlaying stats on photos/videos
- Embeddable widgets for blogs/websites (activities, routes, weekly summaries)

### What Converts
- **Visual identity:** The route map is instantly recognizable as "a Strava share" - builds brand recognition
- **Stats as social proof:** Distance/elevation/pace creates aspirational content
- **Frictionless Instagram flow:** One tap opens Stories with sticker pre-placed
- **Deferred deep links:** Non-users see rich content on web, get prompted to install for the full experience

---

## 2. Pinterest - Pin Sharing & Re-pin UX

### Share Flow UX
- **Taps to share:** 1-2 taps (tap pin -> share icon or long-press -> share sheet)
- Re-pin (save) is even simpler: 1 tap on the "Save" button directly on the pin card
- "Direct Links" feature: 1 click directly to advertiser site (vs 2 clicks for other ad types)

### Preview / OG Image Generation
- **Rich Pins:** Pull structured metadata from page via Open Graph tags or Schema.org markup
- Required OG tags: `og:title`, `og:type`, `og:image`, `og:url`
- Optimal image size: 1000x1500px (portrait, 2:3 ratio) for Pinterest; 1200x630px for cross-platform
- Pinterest extends OG with `article:author` and Rich Pin type-specific metadata
- Must pass Pinterest Rich Pin Validator before Rich Pins activate

### Deep Linking
- **Universal Deep Links (UDL):** Single link routes to correct destination across Android, iOS, and web
- Mobile deep links direct users from Pins into retailer native apps
- Fallback: If app not installed, opens same page on mobile web within Pinterest app
- Early Direct Links adopters: **88% higher outbound CTR**, **39% decrease in CPC**

### Mobile-First Design Patterns
- Card-based masonry layout optimized for thumb scrolling
- Save button prominently placed on every pin (no need to open detail view)
- Share sheet appears as bottom drawer on mobile
- Visual-first: image dominates, text is secondary

### What Converts
- **Visual-first cards:** Large images with minimal text drive engagement
- **1-tap save:** Reducing re-pin to a single tap massively increases save rates
- **Direct links eliminating clicks:** Going from 2 clicks to 1 click = 88% higher CTR
- **Rich metadata:** Structured data creates trust and context without user effort

---

## 3. Behance - Portfolio/Project Sharing

### Share Flow UX
- **Taps to share:** 2-3 taps (project page -> share icon -> choose method)
- Share icon on right side of project page opens Share and Embed menu
- Options: Copy Link, Copy Embed, direct social platform shares
- Mobile app supports creating and sharing directly

### Preview / OG Image Generation
- **Cover image as thumbnail:** The first/cover image in a project becomes the social media preview
- Recommendation: Upload cover image closest to the top of project content for best preview
- No dynamic OG image generation - uses the uploaded project cover
- Each project has a unique URL for sharing across networks

### Deep Linking
- Standard URL-based linking (no deferred deep links documented)
- Mobile app opens project pages when available
- Embed codes available for blogs/websites

### Mobile-First Design Patterns
- Full-bleed image presentations on mobile
- Scroll-based project viewing (vertical scroll through project modules)
- Simple share icon placement consistent with platform conventions
- Work-in-Progress sharing from iOS app for iterative feedback

### What Converts
- **Hero image quality:** The cover image IS the share preview - high-quality visuals are critical
- **Full project context:** Shared links show the complete project, not a truncated preview
- **Creator credibility:** Profile/follower info visible alongside shared content
- **Embed capability:** Projects can live on external sites, driving traffic back to Behance

---

## 4. Figma Community - Design File Sharing

### Share Flow UX
- **Taps to share:** 2 taps (open file -> Share button in top-right)
- Share modal allows setting permissions and copying link
- Deep-linking to specific frames: If a frame is selected, the shared link opens to that exact frame
- Community files have dedicated resource pages with preview and metadata

### Preview / OG Image Generation
- **Custom thumbnails:** Recommended size 1920x1080px
- Community file cover frame preset available in Figma for correct sizing
- Up to 9 preview images can be added to Community file pages
- Thumbnail design guidance: "Keep it simple but eye-catching, less text is more"
- Thumbnails serve as the OG image when shared on social media

### Deep Linking
- Frame-level deep links: Selected frame/node included in URL, opens directly to that location
- Nested frames link to parent frame for context
- Public link sharing with configurable permissions
- "Duplicate" flow: 1-click copy of Community file to user's drafts (entire new file, no history)

### Mobile-First Design Patterns
- Resource pages with interactive previews (prototypes playable inline)
- Duplicate button prominent on Community file pages
- File metadata (description, tags, creator info) structured for discovery

### What Converts
- **1-click duplicate:** Lowest friction path from "see it" to "use it"
- **Frame-level deep links:** Share exactly the relevant part, not the whole file
- **Interactive previews:** Users can explore before committing to duplicate
- **Thumbnail quality:** Well-designed thumbnails significantly increase discovery and clicks

---

## 5. Linktree - Link Sharing Patterns

### Share Flow UX
- **Taps to share:** 0-1 taps (the entire page IS the share destination)
- Single URL houses all links - optimized for social media bios (Instagram, TikTok, Twitter)
- Mobile preview feature during setup ensures mobile-first design
- Strategic link ordering: most important in first 2-3 positions (above fold)

### Preview / OG Image Generation
- Profile image: 800x800px optimized for mobile
- Clean, branded preview when shared on social media
- Customizable themes and appearance for brand consistency
- The page itself is the "card" - no separate preview generation needed

### Deep Linking
- Universal link: One URL works everywhere, no platform-specific routing needed
- Each link on the page goes directly to its destination
- No deferred deep links or app-install flows

### Mobile-First Design Patterns
- Vertical stack of tappable buttons - designed for thumb reach
- Mobile users rarely scroll beyond visible screen, so top 2-3 links are critical
- Profile image + bio text at top for identity/trust
- Large tap targets (full-width buttons)
- Minimal cognitive load: scan and tap

### What Converts
- **Simplicity:** One page, one purpose, zero navigation
- **Above-the-fold priority:** Top 3 links get the most clicks
- **3-7 links optimal:** Too many links = decision paralysis
- **Mobile-native layout:** Full-width buttons designed for finger taps, not cursor clicks
- **Platform-specific strategy:** Tailoring link order per platform = 15-25% performance lift
- **34% traffic increase** reported by brands using strategic link ordering

---

## Cross-App Pattern Synthesis

### Universal Share Flow Principles

| Pattern | Strava | Pinterest | Behance | Figma | Linktree |
|---------|--------|-----------|---------|-------|----------|
| Taps to share | 2 | 1-2 | 2-3 | 2 | 0-1 |
| Auto-generated preview | Yes (map+stats) | Via Rich Pins | Cover image | Custom thumbnail | Profile card |
| Deep linking | Branch.io deferred | UDL universal | Standard URLs | Frame-level | Simple URL |
| Native share sheet | Yes | Yes | Yes | Yes | N/A |
| 1-click action | Instagram Stories | Save/Re-pin | Copy Link | Duplicate | Tap link |

### Key Findings

#### 1. Two Taps or Fewer
Every successful app keeps sharing to 2 taps maximum. The "Rule of Three Taps" from UX research is the ceiling, but best-in-class aim for 1-2. Pinterest's 1-tap Save is the gold standard.

#### 2. Auto-Generated Visual Previews Are Essential
- Strava auto-generates map cards with stats
- Pinterest pulls Rich Pin data from OG tags
- Figma uses custom 1920x1080 thumbnails
- Users should NEVER have to create their own share image

#### 3. OG Image Specs That Work Everywhere
- **Cross-platform default:** 1200x630px (1.91:1 ratio) - works on Facebook, Twitter/X, LinkedIn, Slack, Discord
- **Pinterest/vertical:** 1000x1500px (2:3 ratio)
- **Instagram Stories:** 16:9 portrait (1080x1920)
- **Figma Community:** 1920x1080px
- For VGC Team Report: Generate 1200x630 OG images dynamically using Next.js `ImageResponse` (Satori)

#### 4. Deep Linking Is Table Stakes
- Deferred deep links (Branch.io pattern): show content on web, prompt app install, then deep-link after install
- For a web-first app like VGC Team Report: focus on rich web previews with OG tags rather than app-install flows
- Frame-level/section-level deep links (Figma pattern) are valuable - link to specific Pokemon on a team

#### 5. The Share Card IS the Marketing
- Strava's route map is instantly recognizable
- Pinterest's Rich Pins show structured product data
- For VGC Team Report: The share card should be visually distinctive and immediately signal "Pokemon VGC team"

#### 6. Web Share API for Native Feel
- `navigator.share()` triggers the OS-native share sheet on mobile
- Requires HTTPS (which Vercel provides)
- Must include fallback for unsupported browsers
- Can share URL + title + text; some browsers support file sharing

#### 7. Mobile-First Layout Principles
- Large tap targets: minimum 44x44px (Apple HIG) / 48x48dp (Material Design)
- Above-the-fold priority: key actions visible without scrolling
- Vertical stacking for thumb-friendly navigation
- Full-width buttons for primary actions

---

## Recommendations for VGC Team Report

### Priority 1: Dynamic OG Image Generation
```
Route: /api/og/team/[id]
Tech: next/og ImageResponse (Satori)
Size: 1200x630px
Content: Team name, 6 Pokemon sprites in a row, format/regulation badge, author name
```
This is the single highest-impact improvement. Every shared link becomes a branded visual card showing the team composition at a glance.

### Priority 2: Web Share API Integration
```typescript
// Share button component
async function shareTeam(team) {
  if (navigator.share) {
    await navigator.share({
      title: `${team.name} - VGC Team Report`,
      text: `Check out this ${team.format} team by ${team.author}`,
      url: `https://pokemonvgcteamreport.com/team/${team.id}`
    });
  } else {
    // Fallback: copy to clipboard + toast notification
    await navigator.clipboard.writeText(url);
  }
}
```
2 taps maximum: tap share icon -> native share sheet opens.

### Priority 3: Share Card Design (Strava Pattern)
- Auto-generate a visually distinctive card for every team
- Include: Pokemon sprites, team name, format, win rate if available
- Make it instantly recognizable as "a VGC Team Report share" (like Strava's route maps)
- Consider a "Sticker Stats" equivalent: transparent PNG with team sprites for Instagram Stories

### Priority 4: Deep Link to Specific Pokemon
- Follow Figma's frame-level deep linking pattern
- URL like `/team/abc123#pokemon-3` scrolls to and highlights the third Pokemon
- Useful for Discord discussions: "look at this Urshifu set"

### Priority 5: Linktree-Style Team Hub
- Player profile page as a "link hub" for all their teams
- Vertical stack of team cards, most recent first
- Shareable profile URL: `pokemonvgcteamreport.com/@username`
- Top 3 teams above the fold

### Priority 6: Copy-to-Clipboard Fallback
- Always provide "Copy Link" as an alternative to native share
- Show a brief toast/snackbar confirmation ("Link copied!")
- Include the OG-image URL in clipboard for platforms that support rich paste

---

## Technical Implementation Notes (Next.js 16)

### OG Image Generation
```
// app/api/og/team/[id]/route.tsx
import { ImageResponse } from 'next/og'

// Use Satori JSX to render:
// - Team name (bold, large)
// - 6 Pokemon sprites in a grid
// - Format badge (e.g., "Regulation H")
// - Author name
// - VGC Team Report branding/logo

// Size: 1200x630 for cross-platform compatibility
// Edge runtime for fast generation
```

### Meta Tags per Team Page
```html
<meta property="og:title" content="Rain Team by Player123 - VGC Team Report" />
<meta property="og:description" content="Pelipper / Palafin / Rillaboom / Urshifu / Amoonguss / Incineroar" />
<meta property="og:image" content="https://pokemonvgcteamreport.com/api/og/team/abc123" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:url" content="https://pokemonvgcteamreport.com/team/abc123" />
<meta name="twitter:card" content="summary_large_image" />
```

### Web Share API with Fallback
- Feature-detect `navigator.share` and `navigator.canShare`
- Primary: native share sheet (mobile)
- Fallback 1: Copy link to clipboard (desktop/unsupported)
- Fallback 2: Direct share buttons for Discord, Twitter/X, Reddit (VGC community platforms)

---

## Sources

- [Strava Deep Linking with Branch](https://www.branch.io/resources/blog/how-strava-unifies-in-app-experiences-with-deep-links-mobile-user-acquisition-engagement/)
- [Strava Activity Sharing Support](https://support.strava.com/hc/en-us/articles/221089587-Sharing-Your-Strava-Activities)
- [Strava Sticker Stats (Spring 2025)](https://www.bikeradar.com/news/strava-sticker-stats-spring-2025-updates)
- [Strava Custom Cards for Social Media](https://www.bikeradar.com/news/now-you-can-create-custom-strava-cards-for-social-media)
- [Pinterest Mobile Deep Links](https://help.pinterest.com/en/business/article/mobile-deep-links)
- [Pinterest Direct Links Expansion](https://www.socialmediatoday.com/news/pinterest-expands-direct-links-more-ad-campaign-types/701044/)
- [Pinterest Rich Pins Reference](https://developers.pinterest.com/docs/rich-pins/reference/)
- [Open Graph Tags Ultimate Guide](https://offshoremarketers.com/open-graph/)
- [Behance Social Media Sharing Guide](https://help.behance.net/hc/en-us/articles/204485084-Guide-Share-Your-Work-With-Social-Media)
- [Behance Social Media Thumbnails](https://help.behance.net/hc/en-us/articles/360034073754-Guide-Social-Media-Thumbnails)
- [Figma Share Files and Prototypes](https://help.figma.com/hc/en-us/articles/360040531773-Share-files-and-prototypes)
- [Figma Community File Thumbnails](https://help.figma.com/hc/en-us/articles/23510169950871-Design-a-file-thumbnail)
- [Figma Duplicate Community Files](https://help.figma.com/hc/en-us/articles/360038510873)
- [Linktree Strategy Guide](https://www.decktopus.com/blog/linktree-strategy)
- [Linktree Mobile Engagement](https://reviewsbeacon.com/maximize-mobile-engagement-linktree/)
- [Web Share API in React](https://www.brannen.dev/posts/using-the-web-share-api-in-react)
- [Next.js OG Image Generation](https://nextjs.org/docs/app/getting-started/metadata-and-og-images)
- [Vercel OG Image Generation](https://vercel.com/docs/og-image-generation)
- [Mobile App Conversion Rate Benchmarks 2026](https://uxcam.com/blog/mobile-app-conversion-rate/)
- [Mobile UX Best Practices 2026](https://www.brandvm.com/post/mobile-ux-best-practices)
