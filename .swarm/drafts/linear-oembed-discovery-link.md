# UNFILED LINEAR TICKET (draft)

> **Not filed.** The Linear workspace returned `USAGE_LIMIT_EXCEEDED` — the free
> active-issue limit is reached, so `issueCreate` is rejected for every new ticket.
> File this by hand after closing stale issues, or paste it straight into Linear.

**Title:** [SEO] /api/oembed is built but undiscoverable — no <link rel="alternate" type="application/json+oembed"> anywhere

**State:** Backlog · **Priority:** 3 · **Labels:** auto-research
**Project:** Tech Debt & Polish

---

## Source

Nightly swarm 31-08-26, agent C1. Full evidence: `.swarm/c1-dead-code-31-08-26.md` on https://github.com/MSS23/VGC-Team-Report/pull/76.

## Finding

`/api/oembed` exists and works, but **no oEmbed discovery link tag exists anywhere in the app**. There is no

```html
<link rel="alternate" type="application/json+oembed" href="...">
```

on `/s/[id]` or any other page.

The oEmbed spec requires consumers to discover the endpoint via that tag. Without it **no unfurler can ever find it** — so the endpoint is inert in production despite being fully built.

## Why this is "wire it up", not "delete it"

The dead-code scan initially flagged `/api/oembed` as an uncalled route. It is not dead code — it is *unreachable* code with real value behind it. Deleting it would discard a working feature; adding one tag activates it.

## Impact

oEmbed is how a shared report renders as a rich card in Discord, Slack, Notion, WordPress and Ghost. For a product whose core loop is *share a team report link*, this is directly on the growth path — and VGC players share links in Discord constantly.

## Suggested scope

1. Emit the discovery `<link>` on `/s/[id]` (and `/embed/[id]` if appropriate) pointing at `/api/oembed?url=...`.
2. Confirm the endpoint's `type`, `width`, `height` and `thumbnail_url` satisfy the consumers above.
3. Note `thumbnail_url` points at `/api/team-graphic`, whose visibility gating changed in https://github.com/MSS23/VGC-Team-Report/pull/76 — oEmbed already filters to `is_public = TRUE`, so public reports are unaffected, but re-verify after that merges.

Purely local work; no egress or credentials needed.
