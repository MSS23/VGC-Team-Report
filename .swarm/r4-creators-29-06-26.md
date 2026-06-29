# R4 — Creator Sentiment (Narrow Update)

**Date:** 2026-06-29
**Scope:** Net-new creator-side gap since `r4-twitter-vgc-sentiment.md` (2026-05-26). Read-only research.
**Creators referenced:** Wolfey, Cybertron (Aaron Zheng), JamesBaek, Aaron Zheng, JoeUX9, ZacharyM. Read-only. NEVER messaged.

---

## What's New Since Late May 2026

The May report covered the main creator workflows (Patreon funnel, attribution drama, image-first sharing, PokePaste limitations). Since then, the following signals have appeared:

1. **Wolfey Draft League Season 2** kicked off with a June 5 draft phase and Phase 1 running June 6 – July 25. Both Wolfey AND Cybertron are competing/casting on stream (Liquipedia). This is high-profile streamed VGC content for the entire summer.
2. **VGC OTS Chrome extension** (robsonbittencourt/vgc-ots, v1.2.6) updated June 1 2026 — sits on Pokemon Showdown to show the opponent's open team sheet. Reaching ~899 users. A community fork ("OpenTeamsheetGraphic"-derived) keeps gaining traction precisely because no tool produces a clean OTS sheet that streamers can put on screen.
3. **FomTarro/pkmn-tournament-overlay-tool** — community-built, browser-based tournament stream overlay generator. Confirms that VGC casters reinvent stream graphics by hand. No team-builder/team-paste site currently emits a stream-ready overlay.
4. **Smogon thread on OTS UX frustration** (partially-approved): community is openly arguing about *when* OTS is decided in the timer, evidence that OTS workflow is on the community's mind right now.
5. **38 Teams to Try For Pokemon Champions M-A** (DevonCorp, May/June 2026) — editorial team showcases are picking up steam, often referenced on stream.

JoeUX9 and ZacharyM did not surface in indexed search results for this date range — likely Twitter-only with no Google-indexed posts. I did not attempt to access them directly. No outreach drafted to them in this pass (see drafts file for rationale).

---

## The One Finding

**Every VGC creator who streams (Wolfey, Cybertron, JamesBaek, Wolfey Draft League casters) needs a transparent-background, OBS-ready stream overlay of the team currently being discussed.** Today they either screenshot a PokePaste / a builder, paste it into a Photoshop file, or use the community FomTarro overlay tool which is not integrated with any team data source. Our `/embed/[id]` route exists but renders a solid `#0B0B1A` background with `padding: 16px` — unusable as an OBS browser source because it covers the gameplay. There is no current option on **any** competitor (pokemonvgcteamreport.com, PokéBase, Pikalytics, crob.at, Champions Lab, VGenC) to get a "drop this URL into OBS → see your team float on stream" output.

This is a creator-specific feature that becomes a distribution channel: every stream that uses our overlay is free brand exposure with a "powered by pokemonvgcteamreport.com" footer and a QR/short URL inviting viewers to view the full report. It directly addresses Pain Point 2 (image-first sharing) AND opens a new one (in-stream visibility) the May report did not cover.

---

## Proposal

### Problem
1. Casters/streamers can't get a clean team graphic that sits on top of Showdown gameplay without a black box.
2. The existing `/embed/[id]` page assumes "rectangular widget on a website" — wrong sizing for stream (typically a 1920×1080 transparent canvas with the team docked in a corner or side rail), wrong background (solid color, kills the underlying capture).
3. FomTarro's tool is the de facto solution and it requires manual data entry every match.

### Solution (~2–3 hours of implementation)

Add a new route `/overlay/[id]` that:
- Renders a **transparent-background** (`html, body { background: transparent; }`) page at exactly the 1920×1080 viewport an OBS Browser Source uses.
- Renders the 6 Pokemon as a vertical strip dockable left or right (`?dock=left|right`, default `right`), with sprite, item icon, ability, tera type — same data shape as `/embed/[id]`.
- Supports `?theme=dark|light|neon` (cast palette match), `?compact=1` (sprite + species only, when the caster wants less screen real estate), and `?creator=1` (shows the creator credit line, default off so streamers can hide it for clean look).
- A small "powered by VGC Team Report" footer + QR to the full report — branded, low-noise.
- `revalidate = 600` (same as embed), `noindex` meta.
- Includes a one-liner instructions card on the `/s/[id]` ShareModal: "Stream the team — drop this URL into OBS Browser Source: `pokemonvgcteamreport.com/overlay/[id]?dock=right`" with a "Copy overlay URL" button.

### Files to touch

| File | Change |
|---|---|
| `src/app/overlay/[id]/page.tsx` | NEW. Mirror structure of `src/app/embed/[id]/page.tsx`. Transparent BG, 1920×1080 layout, dock/theme/compact/creator search params, branded footer, QR. |
| `src/components/ui/ShareModal.tsx` | Add a small "For streamers" section with overlay URL preview + Copy button + 1-line OBS instructions. ~25 lines. |
| `src/app/changelog/data.ts` | Add changelog entry: "Stream overlay for OBS — drop a URL into Browser Source to show your team while casting." |
| `src/lib/i18n/translations/en.ts` | Add the strings for the ShareModal addition. (Other locales optional — fall back to English.) |
| `src/middleware.ts` | If `embed` is allowlisted for cross-origin/frame, add `overlay` next to it. |

No DB schema changes (reuses `shares` table). No new dependencies (`qrcode` already exists in `OTSSheetModal`). Reuses `extractSpecies`, `resolveSlug`, `getSpriteUrls` — all in-repo.

### Why this fits "2–3 hours"
- `/embed/[id]` is 95 lines and already pulls the data we need — the new route is a styling fork with URL-param-driven theme switches.
- ShareModal addition is a single section under existing share UI.
- No new server logic, no new schema, no auth changes.

### Why this beats the next best idea (tiered Patreon-style visibility)
Tiered visibility (Pain Point 3 from the May report) is **also** a real gap but it's a multi-week project (paywall integration, Stripe/Patreon connect, role-based visibility on each Pokemon field, abuse handling, refunds). The stream overlay is 2–3 hours and ships before EUIC/Worlds streaming season hits its summer peak. It's the highest-leverage build given the time budget.

### Conflict-risk note
Cross-referenced `.swarm/main-changed-files.md`:
- `src/app/api/share/[id]/route.ts`, `src/app/api/share/route.ts`, `src/app/s/[id]/page.tsx`, `src/components/ui/ShareModal.tsx` — share-flow files have active edits on main. New route avoids touching these, only adds one tiny section to `ShareModal.tsx`.
- No conflict with existing `OTSSheetModal.tsx` (that addresses paper team sheets for in-person tournaments, a different use case from on-stream overlay).
- `src/app/embed/[id]/page.tsx` is NOT in the changed files list — safe to mirror.

### Risks / Open Questions
- We should confirm with the user before shipping: should the default theme be `dark` or pick from the site theme on the share record?
- QR code dependency (`qrcode`) is already in the bundle — verify it's tree-shaken from the overlay page if `?creator=0` (default) hides the QR.
- OBS Browser Source defaults to 1920×1080 but some casters use 1280×720. We render relatively and let OBS scale, so this is fine without special handling.

---

## What I Did NOT Do
- Did not message Wolfey, Cybertron, JoeUX9, ZacharyM, or any other creator. Read-only.
- Did not draft public Twitter outreach — pre-feature outreach was already covered in `drafts/r4-creator-outreach-drafts.md` and `drafts/r4-twitter-outreach.md`. Post-build outreach draft is the right next step, prepared in `drafts/r4-outreach-29-06-26.md` for the team to review.
- Did not implement the route — proposal only, per the constraint.

## Sources

- VGC OTS Chrome Extension (June 2026 v1.2.6): https://chromewebstore.google.com/detail/vgc-ots/codeajknmgnkbobmhjeenehcmfhmegkf
- robsonbittencourt/vgc-ots: https://github.com/robsonbittencourt/vgc-ots
- FomTarro/pkmn-tournament-overlay-tool: https://github.com/FomTarro/pkmn-tournament-overlay-tool
- Wolfey Draft League Season 2 (Liquipedia, June 2026): https://liquipedia.net/pokemon/Wolfey_Draft_League/Season_2
- Smogon OTS UX thread: https://www.smogon.com/forums/threads/changing-open-team-sheet-decision-in-vgc-to-be-before-team-preview.3718165/
- DevonCorp 38 Teams For M-A: https://devoncorp.press/resources/38-teams-for-pokemon-champions-regulation-m-a
- Existing internal: `src/app/embed/[id]/page.tsx`, `src/components/ui/ShareModal.tsx`, `src/components/ui/OTSSheetModal.tsx`, `.swarm/r4-twitter-vgc-sentiment.md`, `.swarm/main-changed-files.md`
