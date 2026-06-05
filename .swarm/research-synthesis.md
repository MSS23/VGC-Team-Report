# Wave 1 Synthesis — 2026-06-05

## Top 5 highest-leverage opportunities

1. **Lazy-load moves.ts + pokemon.ts as JSON (~2h, C3).** 7,500+ lines of literal data parsed eagerly inside slide chunks — single biggest unrealised perf win. (Deferred this run — non-trivial scope.)
2. **Pokepast.es URL ingestion (~2h, R1).** Accept `pokepast.es/<id>` in the paste box; server-fetch + parse + redirect to /share. Hijacks every existing pokepaste link circulating in Discord/Reddit. SHIPPING TONIGHT.
3. **Type tightening across normalize-report + diff-state + pokepaste (~2.5h, C2).** lib utilities lose all shape info via AnyRecord; tighten and let TS catch real bugs. SHIPPING TONIGHT.
4. **Comment-flag authz + profile-URL validation (~3h, C4 SEC1).** Real authz bypass (sessionId is client-supplied; one attacker can auto-delete any comment). Plus javascript:-URL vector in profile fields. SHIPPING TONIGHT.
5. **SEO: rewrite root title + add H1 (~1h, R6 #1+#2).** Brand-first homepage title means we don't rank for "VGC team builder 2026". SHIPPING TONIGHT (metadata only — H1 deferred to avoid page.tsx conflict).

## Top 5 quick-win bugs/issues

1. **Webhook catch blocks silently swallow errors (C5).** Linear/PostHog/Clerk all `catch { return 200 }` with no log. Tiny diff, restores observability. SHIPPING TONIGHT.
2. **Dead exports in share-codec (C1 items 1-4).** 4 internal Zod schemas exported with no callers. SHIPPING TONIGHT.
3. **Focus rings missing on nav + Toggle (R8 QW1).** No focus-visible:ring on PageNavbar Links or Toggle switch. SHIPPING TONIGHT.
4. **9-10px body text unreadable (R8 QW2).** Codemod min text to 11px. (Deferred — ShareModal/page.tsx conflict risk.)
5. **Linear webhook — handler is healthy, env-var likely mismatched.** P0 ticket queued for human action via Vercel.

## Blockers for Wave 2

- Linear API/MCP unavailable in this environment (no .env.local, no token). Linear ticket updates queued to .swarm/linear-pending.md for human action.
- Discord webhook unavailable. Notification queued to .swarm/discord-failed.md.
- PostHog API unavailable. No live signal cross-referencing this run.

## High-conflict-risk files (from .swarm/main-changed-files.md) — recommendations flagged

- `src/app/page.tsx` (R6 H1 add, R8 #4) — DEFERRED.
- `src/app/layout.tsx` (R6 metadata) — proceeding cautiously (W6).
- `src/components/layout/PageNavbar.tsx` (R8 QW1) — proceeding cautiously (W7).
- `src/components/ui/Toggle.tsx` (R8 QW1) — proceeding cautiously (W7).
- `src/components/ui/ShareModal.tsx` (R5 toast, R8 #4) — DEFERRED.
- `src/lib/email.ts` (C2 risky win) — DEFERRED.

## Wave 2 plan (8 implementation subagents)

- **W1.** Webhook observability: console.error in linear+posthog+clerk catch blocks.
- **W2.** De-export 4 internal schemas (url-codec.ts, redact-paste.ts).
- **W3.** VGC-TYPE: tighten normalize-report + diff-state + pokepaste return surfaces.
- **W4.** VGC-SEC1a: server-bind comment-flag throttling.
- **W5.** VGC-SEC1b: validate profile social URLs + avatarUrl hostname allowlist.
- **W6.** VGC-SEO1: rewrite root metadata title to lead with intent + year.
- **W7.** VGC-A11Y-QW1: focus-visible rings on PageNavbar Links + Toggle.
- **W8.** VGC-FEAT-POKEPASTE: accept pokepast.es URLs in paste input.

Total subagent budget: 9 (Wave 1) + 8 (Wave 2) = 17 of 25.
