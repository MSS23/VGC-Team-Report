# Nightly swarm run summary — 02-11-26

Branch `swarm-nightly-2026-11-02`, cut fresh from `origin/main` @ `10dfd74`.

## Dispatch budget: 23 of 25

**Wave 1 — 7 read-only audits** (C1 dead code, C2 TypeScript soundness, C3
bundle/perf, C4 security, C5 last-20-commit review, R6 repo-only SEO, R8 static
accessibility).

**Six research agents deliberately NOT dispatched** (R1/R2 competitor teardowns,
R3 Reddit sentiment, R4 Twitter/creator sentiment, R5 mobile-UX benchmarking,
R7 AEO/GEO citation scan). The proxy gateway answers 403 to CONNECT for every
host they needed — reddit.com, pikalytics.com, app.posthog.com, and even
pokemonvgcteamreport.com. With no reachable source they would have produced
recollection presented as research, filed onto a board already holding 63
`auto-research` tickets. Budget moved to implementation, matching the run's
stated priority (drain the board over compound it). Tracked by VGC-255.

**Wave 2 — 16 implementation agents**, 15 landed, 1 refused by the permission
classifier (see below).

## What landed (16 commits, all gated)

| Area | Change |
|---|---|
| P0 privacy | Flipping a report private now revokes its public og:image Blob card |
| VGC-253 | `creator_profiles` bound to `user_id`; display-name takeover closed |
| VGC-316+315 | `@custom-variant dark` wired to the theme attribute; `--accent-foreground` token; dark CTAs 1.40→7.16-13.89:1 |
| VGC-295 | Explore keyset pagination completed; tied rows no longer skipped/duplicated |
| VGC-317 | Invalid FAQPage/HowTo schema removed from 82 URLs; /feedback noindex; 4 titles; /support og:image |
| VGC-300 | zod deduped off the vulnerable nested copy — prod-tree HIGH advisories 4→0; 4 array bounds added |
| VGC-293 redone | `/compare` First Load JS −76.5 KB gz (the earlier fix was cosmetic); guard test made transitive |
| Correctness | SP-vs-EV spread discrimination; Mega speed tiers use the Mega's ability; sync normalisation; share-baseline ordering; Redis-blip welcome email |
| Perf | Coverage charts memoised; cookie banner deferred (−9.0 KB gz every route); SSG DB fan-out 162→~6 queries per build |
| Chore | `@pkmn/dex` → devDependencies (52 MB); 5 starter SVGs + 22 LOC of dead exports |

Final gate on the integrated tree: `tsc --noEmit --incremental false` clean,
**931 passed / 3 skipped / 0 failures** (baseline 784/3), `next build` exit 0.

## Blocked / handed back

1. **Linear is at its free-plan `activeIssueCount` cap.** VGC-330 filed; 10
   further tickets written out under `.swarm/unfiled-ticket-bodies/02-11-26-*.md`.
   See `linear-issue-limit-02-11-26.md`. 56 tickets sit In Review whose branches
   have merged — moving those to Done frees the capacity.
2. **`/embed/[id]` framing fix refused by the permission classifier.** The route
   ships ~210 KB but `X-Frame-Options: DENY` on `/(.*)` makes it unframeable,
   despite a shipped oEmbed endpoint. Relaxing `frame-ancestors` unattended was
   judged unsafe — a reasonable call. Not retried. Analysis in
   `unfiled-ticket-bodies/02-11-26-4-*.md`; needs a human ruling on whether that
   route can ever serve private reports.
3. **PostHog unavailable** (no credentials AND egress-denied) — zero
   analytics-sourced tickets rather than invented event names. VGC-220.
4. **Vercel unverifiable** (no token, no MCP) — webhook env config and
   deployment logs unchecked. The Linear webhook handler itself was re-audited
   in code and is healthy.

## Deliberately not implemented, with reasons

- **VGC-301** (regulation into the parser) — changes displayed numbers on
  already-shared Champions reports; the ticket itself asks for a human decision.
  It is also the real fix for the SP heuristic narrowed this run.
- **VGC-290** (restricted-Pokémon ruling) — needs an authoritative source.
- **VGC-236** (drop the legacy webhook env name) — needs the Vercel var verified
  first; dropping the fallback blind could break production webhooks.
- **VGC-318** (`/s/[id]` server-render) — sized Large, and unverifiable without a
  browser or production access. Premise re-confirmed TRUE and commented.
- **VGC-289** — verified STALE. Reg M-C is fully implemented. Commented with
  evidence recommending closure.
- **VGC-330** (248 EVs = 31 or 32 SP) — filed this run. Needs a product ruling,
  not another assertion flip; three runs have now flipped it.
