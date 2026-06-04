# Linear Tickets to File (Drafts) — 2026-06-04

Linear MCP requires OAuth (user asleep) and `.env.local` is missing so `LINEAR_API_KEY` is unreachable. The tickets below would have been filed via the Linear API as part of Step 6 of the swarm protocol — please file them manually or wait for the next swarm run when Linear access is restored.

---

## P0 — INFRASTRUCTURE

### [INFRA] Verify Vercel `LINEAR_WEBHOOK_SIGNING_SECRET` matches Linear webhook config

**Priority:** Urgent (P0)
**Labels:** `infra`, `auto-research`, `webhook`
**State:** Backlog

**Description:**
Linear has reported repeated webhook delivery failures to `https://pokemonvgcteamreport.com/api/webhooks/linear` and warned it will be auto-disable. This is the 8th nightly swarm run that has audited and "fixed" the handler — the code on main (commit 1a30839, file `src/app/api/webhooks/linear/route.ts`) is correct:

- Reads raw body via `await request.text()` before parsing
- Computes HMAC-SHA256 over the raw bytes with `process.env.LINEAR_WEBHOOK_SIGNING_SECRET` (with legacy `LINEAR_WEBHOOK_SECRET` fallback for env compat)
- Verifies the `linear-signature` header with `crypto.timingSafeEqual`
- Returns 200 on valid signature, 401 on invalid, 400 on missing header, 200 on empty-body setup ping
- Returns 200 for unknown event types so Linear does not auto-disable on transient errors
- `export const dynamic = "force-dynamic"` is set
- Does not log secrets

Since the code is correct and the fix has shipped through every nightly merge for over a week, **the root cause must be env-var configuration on Vercel**. Action required:

1. Open Vercel → Project Settings → Environment Variables → Production
2. Confirm `LINEAR_WEBHOOK_SIGNING_SECRET` exists and is not blank / placeholder
3. Open Linear → Settings → API → Webhooks → the VGC Team Report webhook
4. Confirm the signing secret displayed there matches the Vercel value EXACTLY (no trailing whitespace, no surrounding quotes)
5. If they don't match: regenerate the Linear webhook, copy the new secret into Vercel, redeploy, then send a test event from Linear to confirm 200

**Acceptance:** Linear's webhook delivery log shows three consecutive 200 responses, and the webhook is no longer flagged for auto-disable.

---

## High — SEO / AEO

### [SEO] Rewrite home-page H1 + first 100 words for AI citation

**Priority:** High
**Labels:** `seo`, `aeo`, `auto-research`
**State:** Backlog

**Description:** From `.swarm/r7-aeo-04-06-26.md`. Current H1 "VGC Team / Report" + "Build, share, and explore" tells LLMs nothing about what this site does or for whom. ChatGPT, Claude, and Perplexity consistently cite Pikalytics, crob.at, Victory Road, and Bulbapedia when asked "best VGC team builder" or "alternative to PokePaste" — never us.

Replace the H1 with an entity-defining 78-char headline and the subtitle with a benefit-dense sentence naming Reg M-A, Mega Evolution, and Showdown format support. Then add an SSR'd `<HomeIntro />` prose section so the FAQPage + HowTo JSON-LD already on the page have matching visible body text — answer engines distrust schema without on-page coverage.

Draft copy in `.swarm/drafts/r7-aeo-drafts-04-06-26.md`.

---

### [SEO] Ship /compare/pokepaste and /compare/pikalytics head-to-head pages

**Priority:** High
**Labels:** `seo`, `aeo`, `auto-research`
**State:** Backlog

**Description:** From `.swarm/r7-aeo-04-06-26.md`. Every "alternative to X" query routes to a comparison page when one exists. We have draft copy in `.swarm/drafts/r7-aeo-drafts-04-06-26.md`. Ship as two static MDX or TSX routes under `/compare/<competitor>` with a real `<table>` (feature × competitor × us), explicit ProductComparison or BlogPosting JSON-LD, and internal links from the homepage FAQ.

---

## Medium — Features from research

### [FEATURE] Searchable team archive: /teams?reg=…&mon=…&placement_lt=…

**Priority:** Medium
**Labels:** `feature`, `seo`, `auto-research`
**State:** Backlog

**Description:** From `.swarm/r3-reddit-sentiment-04-06-26.md`. Top recurring r/VGC ask: "any Reg I Calyrex-Shadow top-16 team?" — currently unanswerable by any tool. We have the data; needs Postgres indices on `regulation`, `placement`, and a GIN index on the `pokemon[]` jsonb path, plus a server component at `/teams` with sidebar filters. Expect this to also rank well for long-tail SEO ("calyrex shadow vgc team", "reg I top cut team", etc.).

---

### [FEATURE] Showdown replica code one-click copy on every team page

**Priority:** Medium
**Labels:** `feature`, `quick-win`, `auto-research`
**State:** Backlog

**Description:** From `.swarm/r2-competitors-vgcpastes-limitless-trainerhill-04-06-26.md`. VGCpastes ships Showdown replica codes alongside every paste — highest-leverage micro-feature in the share flow. Add a "Copy Showdown" button next to the existing copy-paste action on `/s/[id]`. Same primitive, takes ~15 minutes.

---

### [FEATURE] Pokepaste import with transparent linter

**Priority:** Medium
**Labels:** `feature`, `auto-research`
**State:** Backlog

**Description:** From `.swarm/r3-reddit-sentiment-04-06-26.md`. PokePaste GH #313 ("No or Invalid Paste") is the #1 recurring r/VGC complaint about PokePaste. Ship `/import` with a Showdown-format paste box, a pre-import linter that names the offending Pokémon and line on parse failure, and a round-trip export with blank-line preservation pinned by a unit test.

---

## Low — A11y polish

### [A11Y] Audit popover vs modal semantics across NotificationBell, DisplayTogglePill, ShareModal

**Priority:** Low
**Labels:** `a11y`, `auto-research`
**State:** Backlog

**Description:** From `.swarm/r8-accessibility-04-06-26.md`. The R8 audit flagged missing `aria-modal="true"` on NotificationBell and a contradictory `aria-modal="false"` on DisplayTogglePill. On review these are non-modal dropdowns/popovers — the literal R8 fix (add aria-modal=true) is wrong without also adding a focus trap and inert backdrop. Right answer is to either (a) commit to "popover" semantics with `role="menu"` + roving tabindex and remove aria-modal entirely, or (b) commit to "modal" semantics with full focus trap + inert backdrop + Escape-to-close + restore-focus-on-close. Pick one per component, document the decision, ship one PR.

---

## Tracking note for next swarm run

The Linear board could not be queried tonight. The tickets above represent what would have been filed. When Linear access is restored:

1. File each as a new Backlog ticket with the labels listed.
2. Apply the `auto-research` label to every ticket (create the label if missing).
3. Set the priority field to match.
4. Optionally link each back to the .swarm/ research file that surfaced it.
