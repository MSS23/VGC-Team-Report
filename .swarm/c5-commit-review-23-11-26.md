# C5 — Commit review, last 20 commits on `main` (23-11-26)

Window: `83fc12f … 10dfd74` (`git log --oneline -20 origin/main`). Read-only review; no edits made.

Verification run during review:
- `node node_modules/eslint/bin/eslint.js` → **0 errors, 66 warnings**. `d8aba62`'s claim ("clear the 36 lint errors, make lint blocking") holds; the CI gate is real.
- `vitest run` on `stat-calculator`, `champions-legality`, `useShareUrl-collaboration` → 92 passed.

Ownership is against `.swarm/pr-owned-files.txt` (152 files, PRs #91–93) and `.swarm/free-src-files.txt`.

---

## 1. og:image card survives a public → private flip (privacy) — `e4d9354`

**File:** `src/app/api/user/reports/[shareId]/route.ts:53–104` (PATCH) — **OWNED (PR #91–93)** → ticket only.

`e4d9354` states the invariant plainly: *"Private reports have their card deleted (the Blob URL is public)."* It is enforced in exactly two places:

- `src/app/api/share/route.ts:418,577` → `schedulePublishShareOgImage`, which calls `removeShareOgImage` when `!isPublic && !isUnlisted`.
- `src/app/api/user/reports/[shareId]/route.ts:140` → `removeShareOgImage` on soft-delete.

The visibility toggle — `PATCH /api/user/reports/[shareId]`, the UI path for "make this private" — flips `is_public`/`is_unlisted` in SQL, invalidates the share and explore caches, and **never touches the card**. So after a user makes a shared report private:

- `og/<shareId>.png` stays live in Vercel Blob with `access: "public"`, `addRandomSuffix: false`, i.e. at a guessable path derived from the share id that was already circulated.
- `/s/<id>` stops serving metadata for the report (the private early-return at `page.tsx:38`), so nothing ever re-reconciles it. The only expiry is the 90-day Redis TTL on `og:<id>`.
- Worse: once that Redis key expires, `removeShareOgImage` early-returns on `if (!card) return` (`og-image.ts:76`), so a later delete can no longer find the URL. The public PNG of the team card is then orphaned permanently, with no code path that can remove it.

Consequence: a report pulled back to private keeps a publicly fetchable render of the team (species, items unless `privateFields` hid them, placement, creator name) indefinitely. This directly undercuts `0c6f94e` ("visibility is owner-only"), landed four commits earlier.

Fix: in the PATCH visibility branch, after the UPDATE returns, call `removeShareOgImage(shareId)` when the new state is neither public nor unlisted (and `schedulePublishShareOgImage` when it becomes public/unlisted again). Separately, make `removeShareOgImage` fall back to `del(blobPath(shareId))` when the Redis entry is gone, so the Blob delete is not dependent on cache state. `src/lib/sharing/__tests__/og-image.test.ts` already covers the library behaviour — the gap is purely the missing call site, so the test to add is on the route.

## 2. Clerk webhook 500-loops when Resend is not configured — `10dfd74` (VGC-230)

**File:** `src/app/api/webhooks/clerk/route.ts:74–85` — **OWNED** → ticket only.

```ts
const result = await sendWelcomeEmail({ ... });
if (!result) {
  if (svixId) await cacheDel(`clerk:svix:${svixId}`);  // release the dedupe
  return NextResponse.json({ error: "Email send failed" }, { status: 500 });
}
```

`sendEmail` (`src/lib/email.ts:38–42`) returns `null` for **two different** conditions: a transient Resend failure *and* `RESEND_API_KEY` not set ("RESEND_API_KEY not set, skipping email"). The route treats both as retryable. In any deployment without `RESEND_API_KEY` — preview deployments, a rotated key, local — every `user.created` delivery returns 500 and explicitly releases its dedupe key, so Clerk retries with backoff and each retry fails identically until Clerk disables the webhook.

That is the exact failure mode `13dcffc` ("acknowledge stale Linear payloads with 200 so retries stop failing") fixed for Linear six commits earlier, with the reasoning spelled out in `src/app/api/webhooks/linear/route.ts:69–76`: *"Answering 401 made every retry fail permanently… one transient blip became terminal."* The same lesson was not applied here.

Fix: have `sendEmail` distinguish "not configured" from "send failed" (e.g. return `{ skipped: true }` vs `null`, or export an `emailEnabled()` guard mirroring `ogImageEnabled()`), and 200-ack the not-configured case. `src/lib/email.ts` is **FREE**, but the branch that must change is in the owned route, so this is a ticket.

Also: VGC-230 shipped with **no test** for either the dedupe or the 500 path — the merge's only new test file is `share-flow.test.ts`. Route-level `__tests__` are the established convention here (`060a095`, `66854cf`, `13dcffc` all added them in the same window).

## 3. A timing-based test hack in the same commit as the known VGC-330 revert — `f223d3e`

**File:** `src/hooks/__tests__/useShareUrl-collaboration.test.ts:13` — **OWNED** → ticket only.

VGC-330 covers the 248-EV assertions in this commit; this is the *other* half of it and is not covered by that ticket.

```diff
-  await act(async () => { hook = renderHook(useShareUrl); await new Promise(resolve => setTimeout(resolve, 0)); });
+  await act(async () => { hook = renderHook(useShareUrl); await new Promise(resolve => setTimeout(resolve, 50)); });
```

`282dbed` made the share-fetch path `await import("@/lib/sharing/url-codec.schemas")`, so the edit session now settles a dynamic-import tick later. The response was to sleep longer, not to wait on a condition. The commit message says it out loud: *"the collaboration fixture needs more than one macrotask."* A fixed 50 ms sleep is a flake waiting for a loaded CI runner (zod cold-import under parallel vitest workers), and when it flakes the symptom will be an unrelated-looking assertion failure in a collaboration test.

Fix: poll for the condition instead of sleeping — loop on `hook.current.<editSession>` with `await act(async () => {})` until set, with a generous iteration cap. The whole file ran in ~1.1 s locally, so the condition is cheap to wait on properly.

## 4. Merge commit message claims four tickets' worth of work that is not in the merge — `10dfd74`

**Scope:** commit metadata + Linear bookkeeping. No source file to fix.

`10dfd74` touches 6 files (`weekly-digest/route.ts`, `share-flow.test.ts`, `webhooks/clerk/route.ts`, `HomePageClient.tsx`, `OTSSheetModal.tsx`, `email.ts`). Its message lists seven squashed PRs. Checked against the tree:

| Claimed | Reality |
|---|---|
| VGC-234: "Add `src/lib/email-html.ts` with `html`` ` tagged template… migrate email.ts + weekly-digest builders… remove the ad-hoc `escapeHtml`" | `src/lib/email-html.ts` **does not exist**. `weekly-digest/route.ts:3` still imports and uses `escapeHtml` from `@/lib/email`. Nothing migrated. |
| VGC-229: "Add ArticleJsonLd + SportsTeamJsonLd, wire into /s/[id]" | No such identifiers anywhere in `src/` (`grep` clean). |
| VGC-223: "focus trap for Export Theme modal + aria-labels" | Not in the merge diff. |
| VGC-230: "Export `buildWelcomeEmailHtml`… call sendEmail directly, without the error-swallowing wrapper" | `buildWelcomeEmailHtml` is still a private `function` (`email.ts:206`) and the route still calls the `try/catch` wrapper `sendWelcomeEmail`. |
| VGC-231: "Add POST/GET /api/user/preferences" | That route exists, but from `8f7a266` (VGC-48), not this merge. |

Security-wise this is benign — `escapeHtml` is applied at every interpolation I checked (`email.ts:149,154,240`; `weekly-digest/route.ts:19,123,128`), so no XSS was introduced by VGC-234 not landing. The real cost is bookkeeping: per CLAUDE.md's Linear workflow, these shas get handed to `linear-discord-updater` and the tickets move to In Review on the strength of this message. VGC-229, VGC-223 and VGC-234 are very likely sitting in In Review with nothing merged.

Fix: re-verify those four tickets against `main` and move the unlanded ones back to In Progress. Worth also checking whether the work is stranded on one of PRs #91–93.

## 5. `List-Unsubscribe` without `List-Unsubscribe-Post` — `10dfd74` (VGC-231)

**File:** `src/app/api/cron/weekly-digest/route.ts:361` — **FREE** → fixable tonight.

```ts
emailJobs.push({ to: email, subject, html, headers: { "List-Unsubscribe": `<${APP_URL}/dashboard/notifications>` } });
```

The commit message promises *"List-Unsubscribe **and List-Unsubscribe-Post** headers"*; only the first shipped. Without `List-Unsubscribe-Post: List-Unsubscribe=One-Click`, Gmail/Yahoo do not treat this as one-click unsubscribe, which is the specific thing the bulk-sender rules require — and the URL points at `/dashboard/notifications`, which is behind Clerk auth, so an unsubscribe click from the mail client lands on a sign-in wall. The compliance intent of VGC-231 is not met.

Fix: add `"List-Unsubscribe-Post": "List-Unsubscribe=One-Click"` and point the header at an unauthenticated token-bearing POST endpoint rather than the dashboard page (the `digestUnsubscribed` flag in Clerk `publicMetadata` is already the mechanism; it needs a signed-token route in front of it). The header line itself is a one-line change in a free file; the token endpoint is a ticket.

## 6. VGC-235's "integration test" never runs — `10dfd74`

**File:** `src/app/api/share/__tests__/share-flow.test.ts:15,59` — **FREE**.

```ts
const SKIP = !process.env.DATABASE_URL;
describe.skipIf(SKIP)("shares INSERT/UPDATE/dedup — SQL column correctness", …)
```

`.github/workflows/ci.yml` sets no `DATABASE_URL` (grep: no `env:` block), so this suite is skipped on every CI run and on every local `npm test`. It is the only `skipIf`/`skip` test in `src/`. The two regressions it names (17-05 owner_id corruption, 24-05 unlisted→private demotion) are therefore still unguarded in practice, while the ticket reads as closed with coverage.

Secondary concern: when it *does* run, it INSERTs rows with `owner_id = "vitest-share-flow-owner"` into the live `shares` table of whatever `DATABASE_URL` points at — for most local setups, the production Neon database. Cleanup is in `afterAll`, so an interrupted run leaves rows behind, and CLAUDE.md flags Neon as a 512 MB free tier.

Fix: either give CI a scratch Neon branch and drop the skip, or mark the suite explicitly (`*.integration.test.ts` + a separate script) and say in the ticket that it is opt-in — but do not leave it looking like coverage. A guard that refuses to run against a `DATABASE_URL` without a test/branch marker would also be cheap.

## 7. A Blob render + upload on every card-affecting autosave — `e4d9354`

**File:** `src/app/api/share/route.ts:418` — **OWNED** → ticket only.

The update branch schedules `publishShareOgImage` on *every* POST, and the fingerprint covers `data.paste`, so any autosave that changed the paste re-renders a 1200×400 PNG (satori + resvg in the serverless function) and re-uploads it. A ten-minute editing session is tens of renders and Blob PUTs for one card that only matters once the link is shared. CLAUDE.md's cost guardrails are explicit about this class of thing.

Fix: on the update path, gate the schedule on `isPublish` (already in scope at that call site, used for the PostHog event two lines above). Staleness is already handled: `/s/[id]`'s `generateMetadata` compares the stored fingerprint and queues `scheduleOgImageBackfill` under a lock, so a card missed at save time is rendered on first view.

---

## CLAUDE.md compliance

- **"New logic in `src/lib/` gets a vitest test beside it"** — honoured across the window. `og-image.ts`, `effective-typing.ts`, `mega-pokemon.megaSlugForSpecies`, `natures.getNature`, `extract-species`, `stat-calculator` (`hasSpeedDoublingAbility`, `compareTurnOrder`, `isSpFormSpread`) all got `__tests__` neighbours. No violation.
- **"A regression fix should get a test that names the bug"** — honoured well: `060a095`, `66854cf`, `544d02a`, `13dcffc`, `0c6f94e` each added a named regression test; `b14c717` added `describe("regression: an over-budget SP spread was silently re-converted as EVs")`.
- **Commit message format** — `13dcffc` is `VGC-WEBHOOK: …`, which is not `VGC-XX` nor one of `fix:`/`chore:`/`ci:`. Cosmetic, worth a mention only because the ticket id cannot be recovered from the log. `swarm:` prefixes (`e147d8d`, `d539c6a`) are also outside the stated set.
- **Focused diffs, no drive-by refactors** — `d8aba62` touches 27 files, but it is a declared lint-debt sweep and every suppression carries a `--` reason; that is in scope, not a drive-by. `e4d9354` moving 511 lines of renderer out of `/api/team-graphic` into `src/lib/sharing/team-graphic-image.tsx` is required by the feature (two callers), and I verified the route kept its visibility gate (`route.tsx:46–91`) and that the shared renderer still honours `privateFields` via `redactPasteFields` (`team-graphic-image.tsx:91–94`). No violation.

## Did any commit weaken a test to pass a gate?

Only `f223d3e`, and only in the two ways already known: the 248-EV SP assertions (**VGC-330 — not re-filed**) and the `setTimeout(0) → 50` sleep (finding 3 above, not covered by VGC-330).

Mechanical check across the window — `git show <sha> -- '*__tests__*' '*.test.ts*' | grep '^-.*\(expect(\|it(\|describe(\)'` — flags only three commits:

| sha | removed test lines | verdict |
|---|---|---|
| `f223d3e` | 3 | the known revert (VGC-330) + the sleep |
| `b14c717` | 4 | **legitimate** — flipped two assertions that encoded the `if (ev >= 248) return 32` defect, with the reasoning in both the diff comments and the message. This is the commit VGC-330 is about; the EV-ladder half was later reverted by `f223d3e` while the over-budget/nature/header fixes stayed. |
| `e4d9354` | 1 | **legitimate** — a test *rename* ("keeps the deliberate image suppression" → "keeps images empty when no card has been pre-rendered") plus two new assertions. Coverage increased. |

Nothing else in the window deleted, skipped or loosened a test. `d8aba62`'s one test-file edit (`src/hooks/__tests__/render-hook.ts`) is a behaviour-preserving rewrite of the probe (`let value` → `latest.value`) with a documented `react-hooks/immutability` disable.

## Follow-up ticket candidates (no code change tonight)

- **Champions SP unit inference has a documented hole.** `isSpFormSpread` (`stat-calculator.ts:244–275`, **OWNED**) infers EV-vs-SP units from per-stat magnitude, so the 32-SP-per-stat cap is unenforceable from the numbers alone (`EVs: 33 HP / 10 Atk` reads as EVs) and `validateChampionsTeam` deliberately omits that check. The residual is documented in the helper, pinned by a test, and `b14c717`'s message names the real fix: a `statForm: "ev" | "sp"` field on `ParsedPokemon`, set by the parser, carried through the share schema. That is the ticket. Not a defect in the commit — it was narrowed on purpose — but it is an open gap in the domain core.
- **66 remaining eslint warnings** (lint is now error-blocking only). Mostly `exhaustive-deps` and unused vars; `src/hooks/useSlideSystem.ts:34` (`hiddenSlides` assigned but never used) and `src/lib/sharing/url-codec.ts:77` (`toBase64Url` unused) look like real dead code for `/dead-code`.

## Nits (not findings)

- **`// ponytail:` is real and is a convention, not a typo.** Four live uses: `src/hooks/useTeamReport.ts:25`, `src/app/api/user/delete/route.ts:121`, `src/app/api/webhooks/linear/route.ts:79`, `src/lib/data/type-chart.ts:189` — and `d8aba62` *removed* a fifth from `.github/workflows/ci.yml` when it cleared the debt that comment described. Every use marks a knowingly-accepted residual risk, and `66854cf`'s message refers to it by name ("Known residual, marked ponytail"). So it is a deliberate grep-able marker that is working as intended; it is just undocumented — `CLAUDE.md`, `AGENTS.md` and `docs/` never mention it, so a new contributor cannot tell it from a typo. One line in CLAUDE.md's Conventions would fix that. (`og-image.ts:27` uses a different prefix, `// shortcut:`, once — possibly a second marker, possibly drift.)
- `src/hooks/useShareUrl.ts:282` (**OWNED**) — `baselineRef.current` and `versionRef.current` are still assigned from the *unvalidated* body, a few lines before `parseFetchedShareState` runs. Harmless today because a rejected payload settles into the corrupt-link screen and the edit-session refs are correctly gated behind `validated`, but the ordering reads as if the validation guards more than it does.
- `src/components/report/InlinePokemonEditor.tsx:101` (**FREE**) — `d8aba62` replaced the clamp effect with `activeIndex = highlighted < results.length ? highlighted : 0` (correct, and the right call), but `setHighlighted` still advances from the stale `highlighted`, so after the list shrinks ArrowDown jumps from displayed row 0 to row 2 rather than row 1. Cosmetic.
- `megaSlugForSpecies` (`2886c78`) issues a **308** permanent redirect. If a species later gains a second Mega the function returns `null` and the route 404s, but browsers and CDNs that cached the 308 keep redirecting. A 307 would be safer for a mapping derived from a rotating dex.
- `calcBattleSpeed`'s stage maths in `1fa2e4a` is correct against Showdown's boost table in both directions (`stage >= 0 → floor(speed*(2+stage)/2)`; `stage < 0 → floor(speed*2/(2-stage))`, giving 2/3, 1/2, 2/5 … 1/4), clamped to ±6 and tested. No action.

## Fixable tonight on free files

1. Finding 5 — add `List-Unsubscribe-Post: List-Unsubscribe=One-Click` in `src/app/api/cron/weekly-digest/route.ts:361` (one line; the token endpoint it should point at is a ticket).
2. Finding 6 — rename/mark `src/app/api/share/__tests__/share-flow.test.ts` as opt-in integration so it stops reading as coverage, and/or add a `DATABASE_URL` safety guard.
3. The InlinePokemonEditor nit, if someone is already in that file.

Everything in findings 1, 2, 3 and 7 lands in PR-owned files (`[shareId]/route.ts`, `webhooks/clerk/route.ts`, `useShareUrl-collaboration.test.ts`, `api/share/route.ts`) → tickets only.
