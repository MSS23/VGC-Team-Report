# R5: Mobile-First Share UX — 5 Concrete Improvements (2026-06-05)

Cross-referenced against `src/components/ui/ShareModal.tsx` (native-share already prioritized on mobile, X/Reddit/Discord/embed/QR/rental code present) and `ShareViewCTA.tsx` (Duplicate CTA for viewers). Patterns drawn from Strava (1-tap Story sticker card), Pinterest (toast-over-modal after copy), Figma Community (anonymous "Like" before sign-up), Behance (creator attribution in OG + bottom action bar), Letterboxd (concise OG drives RTs), Instagram Story 1080×1920 safe-zone. Prioritised by reach × effort, all <4h.

## 1. Share to Instagram Story via `navigator.share({ files })` (HIGH — ~3h)
Strava's killer growth lever is the prebuilt 9:16 story sticker. We already render `TeamCardExport`; add a "Share to Story" button on mobile that renders the 6-Pokemon card at 1080×1920 with QR + URL in the central 80% safe zone, then calls `navigator.canShare({ files })` → `navigator.share({ files: [pngBlob], title, url })`. Falls back to download on browsers that reject file-share. Touches `ShareModal.tsx` only.

## 2. Replace inline "Copied" with a thumb-zone toast (MED — ~2h)
Current `linkCopied` flip ("Copy" → "Copied" inline) is hidden under the user's finger on the URL row. Pinterest's lesson is that a toast beats a modal/inline state. Show a bottom toast: "Link copied — anyone you send this to can view your team." Use `aria-live="polite"` for screen readers; auto-dismiss 2.5s. Reuse for Discord/paste/rental-code/embed copies.

## 3. Stamp `?ref=share-{channel}` + creator handle into OG image (MED — ~2h)
Behance/Letterboxd attribution loop. Update each social handler to append `?ref=share-twitter|reddit|discord|native|story` to `publicUrl` before serialising. Update `src/app/api/og/...` to render `by {creatorName} · pokemonvgcteamreport.com` in the OG footer. Lets PostHog attribute downstream views → forks per channel and bakes attribution into every screenshot/repost.

## 4. Anonymous "Helpful" reaction on shared view (MED-HIGH — ~3h)
Figma Community's lowest-friction engagement = anonymous Like. Add a single heart button on the `/s/{id}` view that increments a counter via localStorage + a debounced anon POST. Lifts engagement floor for the ~80% who won't sign up, feeds Explore ranking, and gives the duplicate-prompt better social proof ("47 found this helpful").

## 5. Auto-open native share-sheet on first share, modal as fallback (HIGH — ~2h)
Right now mobile users see the whole modal even when they just want to ship the link. If team is already public/unlisted and `navigator.share` exists, fire it immediately on the first click; show the modal only if the user cancels or `share()` rejects. Mirrors Strava's "share-sheet-now, settings-later" flow. Add a localStorage opt-out toggle inside the modal.

---

**Defer:** Twitter pre-fill emojis (X killed link-preview reach); full OEmbed; "Send to recent collaborator" Pinterest row (high effort until contacts API stabilises).
