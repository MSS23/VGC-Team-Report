# R5: Mobile UX Patterns from Sharing Apps

**Date:** 2026-05-27 | **Sources:** Strava, Pinterest, Spotify Wrapped, Figma Community, Behance

## 1. Share-to-View Flows That Convert

The highest-converting pattern is **rich preview card to full content**. Open Graph meta tags (og:image, og:title, og:description) turn bare links into attention-grabbing cards that consistently outperform plain URLs in click-through rate. Key specs: 1200x630px landscape image for feed links, 1080x1920 (9:16) for Stories/TikTok. WhatsApp truncates images above 300KB. Description is hidden on mobile apps (Android/iOS) so the image and title must carry the message alone.

Spotify Wrapped reverse-engineers slides from social platforms inward -- every card is pre-sized for Instagram Stories and TikTok, eliminating cropping friction entirely.

## 2. Mobile Share Sheet Handling

Use the **Web Share API** on supported browsers to invoke the native OS share sheet rather than showing a static grid of social icons. The native sheet is personalized to the user's installed apps and recent contacts, which increases share completion. Pinterest uses an overflow menu icon under each card that presents share/save/report options via a bottom sheet. Strava integrates directly with Instagram Stories via Stats Stickers -- tapping "Share" opens Instagram with a ready-made sticker overlay.

## 3. What Makes Share Cards Compelling

- **Showcase the user, not the brand.** Spotify Wrapped goes viral (2.1M social mentions in 48 hours, 400M+ TikTok views in 3 days) because cards represent user identity, not Spotify's brand.
- **Bold colors and dynamic visuals** that pop in crowded feeds. High-contrast palettes grab attention mid-scroll.
- **Personalized data points that invite conversation** -- top artist, distance run, team composition. Data that says something about *you* gets shared.
- **Pre-formatted for every platform** -- no cropping, no reformatting. Each slide is ready to post.

## 4. Empty State / Onboarding UX

Best practice: **two parts instruction, one part delight.** Empty states must balance clarity, tone, and action. Modern apps use conversational microcopy ("No teams saved yet -- build your first one!"), progress indicators, and a single prominent CTA. Duolingo-style personalization (asking *why* the user is here) increases retention. Nearly 1 in 4 users abandon after first use -- the empty state is the make-or-break moment. Always include a skip option and keep text under a few short phrases with simple graphics.

## 5. Driving Organic Sharing (Growth Loops)

Three loop types that matter for VGC Team Report:

- **Content/UGC loops:** Every team report a user creates becomes a shareable node. Strava turns every run into a potential Instagram Story. The product *creates* the share content.
- **Social loops:** Non-incentivized, identity-driven. Users share because the content says something about them. Frictionless sharing must be embedded as a natural outcome, not an afterthought.
- **Viral coefficient (K-factor):** K > 1.0 is rare; K of 0.2 is valuable, 0.5+ is excellent. Even modest sharing rates compound over time.

Key tactic: embed the share moment at the **peak emotion point** (post-activity for Strava, end-of-year for Wrapped, team-save for VGC). One tap to a pre-formatted, identity-rich card posted to the native share sheet.

## VGC Team Report Application

| Pattern | VGC Implementation |
|---------|-------------------|
| Rich OG cards | Team preview with Pokemon sprites, player name, event -- 1200x630 + 9:16 variants |
| Native share sheet | Web Share API with fallback to copy-link + Twitter/Discord deep links |
| Identity-first cards | "My Reg F team" with player name prominent, brand subtle |
| Empty state CTA | "No teams yet -- import from Pokepaste or build from scratch" with one button |
| Share at peak emotion | Prompt share immediately after team save/tournament result entry |
