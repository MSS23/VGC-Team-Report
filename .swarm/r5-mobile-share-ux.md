# R5 — Mobile Share-to-View UX Patterns

**Date:** 2026-05-24
**Researcher:** R5 (UX)
**Focus:** Conversion-best-practice patterns from Strava, Spotify Wrapped, Pinterest, Behance, Figma — applied to `src/components/ui/ShareModal.tsx`.

---

## Current State Snapshot

`ShareModal.tsx` (852 lines) currently orders the sheet as:

1. Header (title + subtitle)
2. Optional "just published" celebration banner
3. URL display (copy-link row)
4. Native Share CTA (mobile only, accent button)
5. Social tiles: Twitter / Reddit / Discord / Copy Paste / Native (desktop)
6. **Download Team Card** (`TeamCardExport`) buried at the bottom of the social block
7. Embed snippet
8. Public-confirm prompt
9. Visibility 3-state picker
10. Comments toggle
11. Bookmark warning + growth note footer

The auto-generated visual artifact (the team card image) is the strongest identity-expression payload we have — and it currently lives **below five other actions**, with no preview. Viewers tap "Share" and see a URL string, not their team.

---

## 3 Patterns to Adopt

### 1. Preview-First Hero (Spotify Wrapped / Strava monthly recap)

- **Pattern name:** "Show what you're sharing before you share it"
- **Source app:** Spotify Wrapped 2025 share cards + Strava activity summary
- **One-sentence description:** Wrapped puts the rendered story card at the top of the sheet — users see the visual artifact first, then choose where to send it; share-rate jumps because the user is already proud of the artifact before the buttons appear.
- **Concrete change:**
  - File: `src/components/ui/ShareModal.tsx` (lines ~352–400)
  - Render a compact `<TeamCardExport>` preview (scaled to ~280px wide, no download button) **above** the URL row. Lift `TeamCardExport` out of the social grid (lines ~551–561) and move it to a new top section. The "Download PNG" button stays as a secondary action below.
- **Scope:** S (1–2h). The component already renders the card; we just reposition + add a `compact` prop that hides the download button when used as a preview.

### 2. Sticky Primary CTA, Demoted Secondaries (Pinterest pin save sheet)

- **Pattern name:** "One hero share action, everything else scrolls"
- **Source app:** Pinterest "Save / Send" sheet + Figma Community share modal
- **One-sentence description:** Pinterest's mobile sheet pins a single high-contrast primary action (Save/Send) to the top — every other option is visually demoted to icon rows or tucked behind "More" — eliminating decision paralysis from a flat list of 5 equally-styled tiles.
- **Concrete change:**
  - File: `src/components/ui/ShareModal.tsx`
  - The Native Share button (lines 382–400) is already the strongest CTA on mobile but only renders when `canNativeShare` is true. When it's absent (desktop, older browsers), there's no clear primary. Promote **Copy Link** to a full-width accent button when native share is unavailable, instead of the muted card row at lines 354–368. Demote Twitter/Reddit/Discord/Paste into a compact 4-icon horizontal row (square 56x56 tiles) instead of full-width stacked cards — saves ~280px of vertical space and reduces "wall of buttons" feel.
- **Scope:** M (3–4h). Requires restructuring the social grid + adding a desktop-primary fallback. Touch targets must stay ≥44px per CLAUDE.md UI standards.

### 3. Achievement Framing in the Share Text (Strava activity share)

- **Pattern name:** "Sell the outcome, not the URL"
- **Source app:** Strava activity share + Behance project share
- **One-sentence description:** Strava's auto-generated share text leads with the achievement ("New 10K PR! 42:18 in Brooklyn") and pushes the URL to the second line — Behance does the same with project stats — so the share preview reads as a brag-worthy headline, not a link drop.
- **Concrete change:**
  - File: `src/components/ui/ShareModal.tsx` (lines 207–217 — `twitterText`, `discordText`)
  - Current Twitter text starts "Check out my [tournament] VGC team report:" which reads as self-promotion. Lead with the result: `"${placement} at ${tournamentName} with ${speciesText}"` then URL on a new line. Add a stat line when available (e.g. record, win-rate). Mirror in Discord text. Reddit title already follows this pattern reasonably well.
- **Scope:** XS (30min). Pure string template change. A/B-able via PostHog `share_twitter_clicked` event already in place.

---

## 3 Patterns to AVOID

### A1. "Wall of equally-weighted share buttons"

- **Anti-pattern we exhibit:** Lines 403–562 render 5 stacked full-width tiles (Twitter / Reddit / Discord / Paste / Download) all in identical `bg-surface-alt` styling. Spotify, Pinterest, and Strava all visually rank options — we treat them as a flat list. Result: cognitive load increases, click-through to any one option drops (classic Hick's law).

### A2. "Hide the visual asset behind a button"

- **Anti-pattern we exhibit:** The Team Card PNG (our most shareable artifact) only appears as a "Download" tile — no preview, no thumbnail. Pinterest and Behance never make users tap to see what they're about to share. If the user can't see the card, they won't download it.

### A3. "Settings-heavy share sheet"

- **Anti-pattern we exhibit:** The visibility 3-state picker (lines 647–793, ~150 lines), comments toggle, publish-confirm prompts, bookmark warning, and growth note collectively occupy more pixels than the actual share actions. Strava/Pinterest keep settings in a separate "Privacy" section behind a tap. **Don't remove** — but collapse the visibility picker into a compact one-line summary (`"Public · Anyone can view"` with a Change button) when the user has already chosen, freeing the share actions to dominate. Auto-expand only on first share or when there are warnings.

---

## 2 Low-Effort Wins (Implementable Tonight)

### W1. Reorder: Preview → Native Share → URL → Socials (45min)

Move sections in `ShareModal.tsx`:

1. New: render `<TeamCardExport compact />` (no download btn) at the top
2. Native Share button (already exists, lines 382–400) — promote to first action on both mobile and desktop
3. URL display (current lines 352–379) — move below native share
4. Social tiles — unchanged
5. Visibility picker — unchanged but already lower

Cost: pure JSX reordering + one new `compact` boolean on `TeamCardExport`. No new dependencies. Single-file change.

### W2. Achievement-led share text (15min)

Rewrite `twitterText` and `discordText` (lines 207–217) to lead with the placement/tournament/team as the headline:

```
${placement ? `${placement} ` : ''}${tournamentName ? `at ${tournamentName} ` : ''}with ${speciesText}

${publicUrl}

#PokemonChampions #VGC2026
```

Single-string change, no UI work, immediately measurable via existing `share_twitter_clicked` PostHog event. Worth A/B testing.

---

## Files Referenced

- `/home/user/VGC-Team-Report/src/components/ui/ShareModal.tsx` (primary target — 852 lines)
- `/home/user/VGC-Team-Report/src/components/ui/TeamCardExport.tsx` (needs `compact` prop for W1)
- `/home/user/VGC-Team-Report/src/hooks/useShareFlow.ts` (not modified — analytics only)
- `/home/user/VGC-Team-Report/src/components/ui/ShareViewCTA.tsx` (entry point, not modified)

## Sources

- [Spotify Wrapped 2025 design / Rive](https://rive.app/blog/spotify-used-rive-for-spotify-wrapped-2025)
- [Spotify 2025 Wrapped user experience](https://newsroom.spotify.com/2025-12-03/2025-wrapped-user-experience/)
- [Strava monthly recap flow (Mobbin)](https://mobbin.com/explore/flows/12b59a5c-335c-4ec6-a4ba-975ec34928d4)
- [Strava UX design patterns (Medium)](https://medium.com/@loranvandenbosch/reflection-user-flows-design-patterns-on-strava-6a5c21c46e78)
- [Pinterest UX heuristic analysis](https://medium.com/@Chaytoo7/ux-analysis-of-pinterest-a-heuristic-and-ux-laws-breakdown-fb68f1a158f3)
- [Figma share files docs](https://help.figma.com/hc/en-us/articles/360040531773-Share-files-and-prototypes)
