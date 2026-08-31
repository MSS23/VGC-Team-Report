# UNFILED LINEAR TICKET (draft)

> **Not filed.** The Linear workspace returned `USAGE_LIMIT_EXCEEDED` — the free
> active-issue limit is reached, so `issueCreate` is rejected for every new ticket.
> File this by hand after closing stale issues, or paste it straight into Linear.

**Title:** [Perf] Clerk ships 58.1 kB gz eagerly on / across 3 chunks — untracked, larger than the motion cost in VGC-268

**State:** Backlog · **Priority:** 2 · **Labels:** auto-research, see below
**Project:** Tech Debt & Polish

---

## Source

Nightly swarm 31-08-26, agent C3. Full evidence: `.swarm/c3-perf-31-08-26.md` on https://github.com/MSS23/VGC-Team-Report/pull/76.

## Finding

Clerk ships **199.0 kB raw / 58.1 kB gzipped** across 3 eagerly-loaded chunks on `/`, entered from `src/app/page.tsx:50`.

That is **larger than the `motion` cost (38.4 kB gz) that VGC-268 already tracks**, and no ticket currently covers it.

## Route context (measured this run)

| Route | Initial JS raw | gzip |
|---|---|---|
| `/compare` | 1205.7 kB | 344.1 kB |
| `/` | 1152.1 kB | **349.9 kB** (worst gzipped) |
| `/dashboard` | 1107.0 kB | 336.2 kB |

Shared by all routes: 551.4 kB / 170.3 kB.

## Why it matters

The homepage is the paste-a-team entry point — the moment a player at an event on phone data first uses the product. It is currently the worst gzipped route in the app.

## Suggested approach

Defer Clerk on `/` so the signed-out paste flow does not pay for auth it never uses. The homepage's primary action (paste → report) does not require a session; only the save/publish path does. Worth checking whether `<ClerkProvider>` can be scoped below the paste UI, or the client SDK dynamically imported on first auth interaction.

## Methodology caveat (important for anyone re-measuring)

Next 16.3.0 + Turbopack prints **no First Load JS column** and emits no `app-build-manifest.json` — this is VGC-269. The table above was reconstructed by parsing chunk references out of `.next/server/app/**/*.html` and summing raw+gzip bytes, with chunk-to-module attribution via content-unique markers. **VGC-269 should be done first** so numbers like these stop needing hand-reconstruction.
