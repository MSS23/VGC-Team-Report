# R4 — Outreach Drafts (29-06-2026)

**Status:** DRAFTS ONLY. Not sent. Read-only research role; no creator was contacted.
**Purpose:** Once the `/overlay/[id]` stream-overlay feature ships, these are pre-staged messages a human on the team can review, edit, and send.

---

## Pre-flight checklist before sending ANY of these
- [ ] The `/overlay/[id]` route is live on production and tested in a real OBS Browser Source at 1920×1080.
- [ ] The ShareModal "For streamers" section is live and the Copy button works.
- [ ] A short Loom or 15-second mp4 demo exists (drag URL into OBS → team appears over Showdown) to attach to outreach.
- [ ] Brand-side approval to name-drop these creators publicly in launch tweets, if we choose to do so.
- [ ] The Discord #builds notification fired for the feature (confirms deploy).

If any box is unchecked, do not send. Defer.

---

## Draft 1 — Wolfey (`@WolfeyGlick`) — DM, not public

> Hey Wolfey — built a small thing for Wolfey Draft League casters and noticed you might find it useful. We added a stream overlay route to VGC Team Report — drop one URL into OBS Browser Source and your team renders on top of gameplay with a transparent background, no Photoshop. Example: `https://pokemonvgcteamreport.com/overlay/[id]?dock=right&theme=dark`. Costs you nothing, no account needed. If you ever try it and want a tweak (different dock position, hide our footer for a clean stream, etc.) we can ship the same day. — Mahir

**Why DM and not public:** Wolfey's audience is huge and a public @-mention reads as growth-hacking. A DM with a specific use-case for Draft League respects his time.

---

## Draft 2 — Cybertron (`@CybertronVGC`) — DM

> Hey Aaron — saw you're casting Wolfey Draft League. We just shipped a stream overlay route on VGC Team Report — paste `https://pokemonvgcteamreport.com/overlay/[paste-id]?dock=left` into an OBS Browser Source and the team floats with a transparent background. Built it because casters were doing screenshots into Photoshop. Free, no account, no logo if you'd rather hide it (`?creator=0`). If you want to try it on the next cast and want any tweaks let us know — happy to ship same-day. — Mahir

---

## Draft 3 — Aaron Traylor (`@attraylor`) — DM
*(Aaron is the long-form report archetype — overlay is less relevant for him, but the parallel ShareModal improvement is.)*

> Aaron — small one: we noticed Medium has no VGC primitives so your reports always live in two browser tabs. We're working toward making VGC Team Report the report canvas (damage calcs, sprite renders, narrative) so the whole thing lives at one URL. Curious what's missing for the warstory format you write — would love 10 minutes of your time whenever, no pressure.

*(Same draft as previous outreach round if not already sent. Cross-check `drafts/r4-creator-outreach-drafts.md` before sending to avoid duplicates.)*

---

## Draft 4 — JoeUX9 — DO NOT SEND
- Could not surface a verified handle for JoeUX9 in indexed search results from this pass.
- Verification step required before any outreach: confirm exact handle and that the account is active in 2026.
- If verified, use a variant of Draft 2 (the streamer angle) only if their content includes streamed gameplay; otherwise variant of Draft 3.

---

## Draft 5 — ZacharyM — DO NOT SEND
- Same as JoeUX9: no verified profile from this pass.
- Verify handle, recent activity, and which content format they produce before any draft is composed.

---

## Public launch tweet (for the project account, NOT @-tagging creators)
*Run this AFTER the feature ships, AFTER any creator DMs have had a 24h window to try the tool privately.*

> Stream overlay for VGC casters — drop one URL into OBS Browser Source and your team renders on top of gameplay. Transparent background, dockable left/right, three themes. Built for Worlds prep season. Free, no account needed. Link → pokemonvgcteamreport.com/overlay-demo

---

## Notes / Don'ts
- Do NOT cold-email any creator a feature request before they've tried the tool. Lead with "here's a thing we built that solves X, try it" — not "we'd love your feedback."
- Do NOT @-mention any creator in a public launch tweet. That is growth-hacking and damages the brand.
- Do NOT promise custom features in DMs without engineering buy-in (the "ship same-day" language is fine for theme tweaks but should be removed if we're not actually staffed for it).
- All four creators above are public figures who get a lot of DMs. Expect low response rates. That's fine — the feature ships on its own merit.

---

**Reminder:** This file is a DRAFT BUNDLE. Nothing here has been sent. R4's scope is read-only research and pre-staging copy for human review.
