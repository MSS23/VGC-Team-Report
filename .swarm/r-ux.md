# R-UX — User Research Synthesis

Combined R3 (Reddit sentiment) + R5 (mobile sharing UX) research, focused on Wave 2
frontend changes that are 1–2 files each and require no backend changes. All findings
below have been triangulated against prior swarm research and current source.

Sources cross-referenced:
- `.swarm/r3-community-sentiment-20-05-26.md` (prior Reddit sentiment)
- `.swarm/r5-mobile-ux-sharing-20-05-26.md` (prior mobile share patterns)
- Current source: `src/app/page.tsx`, `src/components/input/PasteInput.tsx`,
  `src/components/ui/ShareModal.tsx`, `src/components/ui/ShareViewCTA.tsx`,
  `src/components/social/*`, `src/app/opengraph-image.tsx`
- Fresh web research (June 2026) — see bottom of file.

`main-changed-files.md` shows fresh branch — no in-flight conflicts to dodge.

---

## Top 5 user complaints from Reddit / community

1. **"PokePaste is text-only, looks terrible in Discord/Twitter embeds, no sprites."**
   - Triangulated from multiple sources (Smogon forums on PokePaste, crob.at's
     positioning copy, Reddit pokemon community threads). The whole reason crob.at
     and our app exist is that pokepast.es displays plain text without sprites or
     social embeds.
   - **How we address it:** We *do* have a rich OG image (`src/app/opengraph-image.tsx`)
     and `TeamCardExport`. **Gap:** the OG image is the *generic site image*, not a
     per-team render. Per-team OG (`src/app/s/[id]/opengraph-image.tsx`) does exist
     in the file tree — but R5 found this is suppressed/not wired for share links
     in some surfaces. The share modal's `TeamCardExport` preview is great but
     viewers on Discord/Twitter never see it unless someone clicks through.
   - Source: <https://crob.at/pokepaste>, <https://www.smogon.com/forums/threads/pokepaste-a-pokemon-pastebin.3601073/>

2. **"Missing Pokemon sprites on PokePaste — Zygarde forms, Sirfetch'd, Ash-Greninja, etc."**
   - Long-standing complaint that spawned a Chrome extension (`pokepastefix`) just
     to patch the missing images. Users want a tool that *just works* for every form.
   - **How we address it:** We have `getSpriteUrls()` with a fallback chain
     (`PokemonSprite.tsx`, `PopularCardSprite` in `PasteInput.tsx` uses `onError`
     fallback). **Gap:** we don't visibly market this. Empty-state should call out
     "Every form, every mega, every regional variant — sprites that just work."
   - Source: <https://chromewebstore.google.com/detail/pokepastefix/ekceaboabpgkgbpigacngnjagcdhdkmn>,
     <https://www.smogon.com/forums/threads/pokepaste-image-fix.3733096/>

3. **"PokePaste has no source-link field — can't link back to RMT thread or original Reddit post."**
   - Smogon-forum-issue: users want to credit / link to a Rate My Team thread or
     original creator. Currently they hack it by putting URLs in the notes box,
     where URLs can't be clicked without inspect element.
   - **How we address it:** We have `forkedFrom` attribution (`src/app/page.tsx`
     lines 1138–1184) and `creatorName`, but no first-class "Source / Credit"
     field on a team for "this is based on X's tournament team" with a clickable
     URL. Currently only forks (server-side copies *within* our system) get the
     attribution banner.
   - Source: <https://www.smogon.com/forums/threads/pokepaste-a-pokemon-pastebin.3601073/page-2>

4. **"PokePaste has no Format / Regulation field — can't filter or know what reg a paste is for."**
   - Users specifically request a "Format" field that Showdown can output and that
     downstream tools can filter on.
   - **How we address it:** We have `tags.regulation` (Reg M-A, etc.) and the
     entire Champions/regs guide system. **This is already a competitive
     advantage**, but the share modal doesn't surface the regulation badge
     prominently next to the team card preview. Adding a small `Reg M-A` chip on
     the preview card would let recipients verify the team is for the right
     format at a glance — and would prompt creators who skipped tagging.

5. **"Sharing teams in Discord requires copy-paste hacks; the embed doesn't show what's on the team."**
   - Discord-share is the dominant VGC sharing surface (more than Twitter for tactical
     team-trading). Bare `pokepast.es` URLs unfurl as a thin gray box. Our app's
     share modal already has a "Copy for Discord" button — good — but the actual
     Discord *embed* (when someone pastes our URL) still depends on per-share OG
     images, which is the gap from #1.
   - **How we address it:** Per-team OG is half-wired. The mobile share modal
     correctly puts native share as primary action (`ShareModal.tsx` line 462-481),
     which is excellent — Strava-pattern. The "Copy for Discord" formatted-text
     button is a strong differentiator.
   - Source: <https://crob.at/pokepaste>, R5 prior research.

---

## Top 5 mobile share-flow patterns to steal

1. **Native share sheet as the PRIMARY mobile action (Strava pattern).**
   - Strava's mobile share is a single tap → OS share sheet → done. We already do
     this (`ShareModal.tsx` lines 462–481 — full-width accent-colored button at the
     top of mobile modal). ✅ **Already best-in-class.**
   - Strava source: <https://support.strava.com/hc/en-us/articles/221089587-Sharing-Your-Strava-Activities>

2. **Per-artifact OG preview card (Strava activity card, Pinterest pin preview).**
   - Strava's share *image* contains route + stats so the link previews tell the
     story before the click. Pinterest's pin-share generates a per-pin preview
     image. We have `TeamCardExport` rendering inside the modal but the *outbound
     OG image* for a `/s/[id]` route appears to be the generic site OG. Fixing
     this is the single biggest lever for Discord/Twitter virality.
   - Pinterest source: <https://help.pinterest.com/en/article/share-pins-and-boards-to-social-networks>

3. **QR code in the share sheet for in-person/tournament use.**
   - Tournament venue Wi-Fi is unreliable; players physically next to each other
     want to scan a code to load a team. The official Pokemon rental system uses
     14-digit codes. Pinterest, Spotify, and most social apps have a QR tab in
     their share sheet.
   - **Gap:** ShareModal has no QR. Adding a tiny QR-code section (lazy-loaded
     `qrcode` lib, ~3KB) would matter at locals/regionals.
   - Source: <https://thegamehaus.com/gaming/pokemon/pokemon-qr-rental-teams/2017/02/17/>

4. **Empty/preview state that previews a real artifact (Twilio Paste guidance).**
   - Best empty-state pattern: the empty state *is* a preview pane that updates as
     the user takes action. Our `PasteInput.tsx` shows sample-team cards (good)
     but the *paste textarea itself* is just a blank box with a placeholder. As
     soon as someone pastes valid Showdown text, we could render a live tiny
     6-sprite preview *next to the textarea* (or above it) so they see immediate
     value before they even click Analyze.
   - Source: <https://paste.twilio.design/patterns/empty-state>

5. **Intent-driven duplicate as the share-to-conversion moment (Figma Community pattern).**
   - Figma converts viewers by gating only the "Duplicate" action — not the
     content. We already do this in `ShareViewCTA.tsx`. ✅ **Already on-pattern**,
     but R5 found the CTA fires *immediately* on page load. Should defer until
     the viewer scrolls past the first Pokemon slide (intent signal).
   - Source: <https://help.figma.com/hc/en-us/articles/360038510873-Duplicate-Community-files>

---

## Concrete Wave 2 frontend changes (ranked by leverage)

Each is 1–2 files and requires NO backend changes. None overlap with the empty
`main-changed-files.md`.

1. **Add a QR-code tab to ShareModal for in-person tournament sharing**
   - Files: `src/components/ui/ShareModal.tsx` (+ tiny new
     `src/components/ui/QrCode.tsx` or inline `<canvas>` render)
   - Dynamic-import a QR library (`qrcode` or `qr-code-styling`) only when the
     modal opens, so it doesn't impact the homepage bundle. Tap "Show QR" → a
     128×128 code renders pointing at `publicUrl`. Saves a tournament hallway
     conversation: scan → load team.
   - Effort: ~2 hours. High leverage — direct match to VGC tournament behavior.

2. **Live 6-sprite preview rail above the paste textarea (PasteInput empty state)**
   - File: `src/components/input/PasteInput.tsx` (single file).
   - As the user types/pastes, parse species names client-side (`@/lib/utils/sprite-slug`
     already exists) and render 6 sprite slots above the textarea — empty
     placeholders → animated fill as species are detected. Provides instant
     value perception before "Analyze" is clicked.
   - Effort: ~3 hours. Addresses Twilio "preview as you act" pattern + reduces
     paste-anxiety for new users.

3. **Surface regulation/format chip prominently on the share modal preview card**
   - Files: `src/components/ui/ShareModal.tsx` (+ optional minor tweak to
     `src/components/ui/TeamCardExport.tsx`).
   - Render a small `Reg M-A` / `Reg I` chip overlaid on the team card preview
     inside the modal. If `tags.regulation` is missing, show a soft prompt:
     "Add a regulation tag so viewers know which format this is for." Fixes
     directly-quoted Reddit/Smogon complaint #4.
   - Effort: ~1 hour. Tiny visual change, immediate signal-to-recipient win.

4. **"Source / credit URL" field on team metadata + clickable chip on the report**
   - Files: `src/components/report/TeamOverview.tsx` (or
     `src/components/social/CreatorLink.tsx`) — add an optional editable
     `sourceUrl` next to creator name; render as a "Based on @username's
     tournament team" chip with external-link icon.
   - State already flows through `ShareableState`. No backend schema change
     needed if we piggyback on an existing string field, OR we add it to the
     existing tags blob.
   - Effort: ~3 hours. Solves Reddit #3 (source-link request) and gives our app
     a credit/attribution model PokePaste lacks.

5. **Defer `ShareViewCTA` until viewer engagement signal (scroll past first Pokemon)**
   - File: `src/app/page.tsx` (props/wiring) + `src/components/ui/ShareViewCTA.tsx`
     (small effect).
   - Add an `IntersectionObserver` hook that mounts `ShareViewCTA` only after
     the viewer has either (a) scrolled past slide 1, or (b) spent >8 seconds
     on the page. Matches Figma Community / Pinterest intent-driven auth.
   - Effort: ~2 hours. Addresses R5's earlier finding that the CTA fires before
     value delivery, hurting conversion.

---

## Honorable mentions (lower leverage, but easy)

- **Always show the one-line benefit text under the ShareViewCTA title on mobile**
  (`src/components/ui/ShareViewCTA.tsx` line 39 — remove `hidden sm:block`).
  Effort: 5 minutes.
- **Add a "Sprites for every form" trust-line under the paste hint** in
  `PasteInput.tsx` — addresses Reddit complaint #2 head-on, costs zero space.
- **Marketing line in empty state**: "Every Mega, every Tera, every regional —
  sprites that just work" — addresses #2.

---

## Draft outreach (DO NOT POST)

No outreach drafted in this run — the work is product-shaped, not community-shaped.
If the parent wants Reddit replies for the implementation announcement, draft
them into `.swarm/drafts/ux-outreach-qr-launch.md` after VGC-XX ticket is filed.

---

## Sources

- <https://support.strava.com/hc/en-us/articles/221089587-Sharing-Your-Strava-Activities>
- <https://help.pinterest.com/en/article/share-pins-and-boards-to-social-networks>
- <https://help.figma.com/hc/en-us/articles/360038510873-Duplicate-Community-files>
- <https://paste.twilio.design/patterns/empty-state>
- <https://crob.at/pokepaste>
- <https://www.smogon.com/forums/threads/pokepaste-a-pokemon-pastebin.3601073/>
- <https://www.smogon.com/forums/threads/pokepaste-image-fix.3733096/>
- <https://chromewebstore.google.com/detail/pokepastefix/ekceaboabpgkgbpigacngnjagcdhdkmn>
- <https://www.smogon.com/forums/threads/pokepaste-a-pokemon-pastebin.3601073/page-2>
- <https://thegamehaus.com/gaming/pokemon/pokemon-qr-rental-teams/2017/02/17/>
- Prior: `.swarm/r3-community-sentiment-20-05-26.md`, `.swarm/r5-mobile-ux-sharing-20-05-26.md`
