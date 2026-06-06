# Linear Updates — Pending (MCP unauthenticated)

Date: 06-06-26
Branch: swarm-nightly-2026-06-06

The Linear MCP server in this remote env requires interactive OAuth and the
`.env.local` carrying `LINEAR_API_KEY` is not mounted, so the swarm could not
push Linear updates this run. Below is the full work-set so a human (or a
future swarm run with auth) can replay it via `linear.sh`.

## Tickets to file in Backlog (new tickets — `auto-research` label unless noted)

1. **[INFRA] Linear webhook signing secret mismatch — verify Vercel env var
   matches Linear webhook config** (Urgent / P0)
   - Description: `.swarm/webhook-investigation.md` confirms the handler code
     is correct. The repeated webhook failures Linear is reporting are almost
     certainly an env-var mismatch between Vercel Production's
     `LINEAR_WEBHOOK_SIGNING_SECRET` and the secret stored in Linear's
     webhook config. Requires human action via Vercel dashboard.
   - Label: `infra`

2. **[INFRA] /embed/[id] is unframeable in production** (Urgent / P0)
   - Description: Global `X-Frame-Options: DENY` + CSP `frame-ancestors 'none'`
     in `next.config.ts` apply to `/(.*)`, so every embed iframe is blocked
     by third-party browsers. The oEmbed endpoint actively hands out iframe
     HTML that browsers refuse to render. Override headers for `/embed/(.*)`.
   - Source: `.swarm/c4-security.md` (C4 P0-1).
   - Label: `bug`, `seo`

3. **[SECURITY] Update js-cookie via npm audit fix** (High / P1)
   - Description: GHSA-qjx8-664m-686j (CVSS 7.5, prototype hijack) still in
     the `@clerk/shared` dep chain. `npm audit fix` was blocked in tonight's
     remote env because the Cypress binary download is firewalled. Run
     `npm audit fix` locally and verify nothing breaks.
   - Source: `.swarm/c4-security.md` (C4 P0-3).
   - Label: `security`

4. **[PERF] Async-import dex-subset.json (340KB raw)** (High)
   - Description: Five major client components transitively pull dex-subset
     through `lib/data/pokemon → pkmn-dex-fallback`. Refactor
     `pkmn-dex-fallback` to `await import("./dex-subset")` on demand.
     Estimated ~50-80KB gzip win + chunk dedup.
   - Source: `.swarm/c3-bundle.md`.
   - Label: `perf`

5. **[FEATURE] Per-team dynamic OG image at /s/[id]/opengraph-image**
   (High)
   - Description: Biggest organic-growth lever surfaced by R-UX research.
     PokePaste embeds in Discord/Twitter have no sprites — our visual share
     card is excellent but currently the outbound OG image is the generic
     site default. Wire per-team OG using next/og + the sprite-rail design
     from TeamCardExport.
   - Source: `.swarm/r-ux.md`, `.swarm/r6-seo.md`.
   - Label: `feature`, `seo`, `social`

6. **[SEO] Programmatic /pokemon/[species] route** (Medium)
   - Description: Closes top keyword gaps ("Calyrex Shadow Rider VGC EV
     spread", "Garchomp VGC moveset 2026") both currently dominated by
     Pikalytics and Game8. Built from `@pkmn/dex` + share aggregations.
     Spec at `.swarm/drafts/seo-pokemon-route-spec.md`.
   - Source: `.swarm/r6-seo.md`.
   - Label: `seo`, `feature`

7. **[SEO] Article JSON-LD on /changelog** (Medium)
   - Description: Emit `@graph` of Article schemas from `ENTRIES` in
     `src/app/changelog/data.ts`, rendered server-side in
     `src/app/changelog/page.tsx`. Unlocks Top Stories eligibility.
     Draft at `.swarm/drafts/seo-jsonld-article-changelog.md`.
   - Source: `.swarm/r6-seo.md`.
   - Label: `seo`

8. **[A11Y] InlinePokemonEditor missing aria-modal + Tab trap** (Medium)
   - Description: Modal has role + Escape but no aria-modal and no Tab
     focus trap. Apply the OTSSheetModal pattern.
   - Source: `.swarm/r8-a11y.md` (R8 P0-4).
   - Label: `a11y`, `bug`

9. **[A11Y] CommentSection action buttons hidden + below target size**
   (Medium)
   - Description: Delete/Flag actions live behind `opacity-0 group-hover`
     (touch users can never see them) AND only 10px text. Make
     touch-visible at all times and bump to 44x44px.
   - Source: `.swarm/r8-a11y.md`.
   - Label: `a11y`, `bug`

10. **[REFACTOR] Section detection in SlideNavControls re-derives slide
    structure** (Low)
    - Description: `SlideNavControls.tsx:78-89` re-derives section
      boundaries via prefix sniffing (`!COVERAGE_KEYS.includes(k) &&
      !k.startsWith("matchup-")`). Any future slide kind silently
      misclassifies as "Team". Expose `sectionOfKey()` from
      `useSlideSystem.ts` and consume it instead.
    - Source: `.swarm/c5-recent-commits.md`.
    - Label: `tech-debt`

11. **[INFRA] Drop newsletter_subscribers table in Neon** (Low)
    - Description: Newsletter removal in 52437b8 left the Neon
      `newsletter_subscribers` table behind. Zero-risk
      `DROP TABLE IF EXISTS` via Neon SQL editor.
    - Source: `.swarm/c5-recent-commits.md`.
    - Label: `infra`, `tech-debt`

## Tickets to comment on + move to In Review / Done

None implemented this run had pre-existing Linear identifiers (no VGC-XX
commits this run). The work landed under `swarm:` prefixes per the
non-ticket convention.
