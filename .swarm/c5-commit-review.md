# C5 Commit Review — Last 25 commits (May 14–20, 2026)

**Reviewer:** C5
**Window:** 850e91c → b50656f (Wed 20 May 19:32 → Wed 14 May)
**Files cross-referenced:** `.swarm/main-changed-files.md` (last 7 days)
**Time budget:** 20 min

---

## P0 / P1 bugs spotted in recent code

### P0 — Welcome email HTML XSS (regression of the bug "fixed" in 19-05-26 swarm)
**File:** `src/lib/email.ts` line 219
The 19-05-26 swarm explicitly fixed the same XSS class in the weekly digest builder (escapeHtml added for `tournamentName`, `creatorName`, `firstName`). But the welcome email added in 18-05-26 (`buildWelcomeEmailHtml`) injects `${firstName}` **raw** into the `<h1>` — no escape. A user with first-name `<img src=x onerror=…>` in Clerk lands an HTML payload in every welcome email. Same pattern.
**Also affected:** `buildCommentNotificationHtml` (lines 130, 135) — `commenterName`, `commentBody`, `reportTitle` are all interpolated raw into the HTML body. `commentBody` is the most dangerous (user-controlled text). This has been broken since before the swarm window.
**Fix:** Pull `escapeHtml` out of `weekly-digest/route.ts` into `src/lib/email.ts`, wrap every `${…}` interpolation. Reuse for subject lines too (`subject: \`New comment on "${opts.reportTitle}"\`` — escape there as well; Resend escapes header-values, but unescaped quotes can still break subject rendering).

### P1 — Re-sharing an unlisted report silently demotes it to private
**File:** `src/app/api/share/route.ts` lines 269–298 (dedup branch)
The dedup `SELECT` only fetches `(id, edit_token, version, is_public)` — `is_unlisted` is NOT selected. Then `effectiveIsUnlistedDup = isUnlisted ?? false` falls back to `false` whenever the client doesn't explicitly send `isUnlisted`. Result: a user with an unlisted share, when the autosave/save flow re-POSTs the same paste without an explicit `isUnlisted`, gets the `is_unlisted` column flipped to `false` — quietly converting unlisted → private.
**Fix:** Add `is_unlisted` to the SELECT, then `effectiveIsUnlistedDup = isUnlisted ?? !!dup.is_unlisted`.

### P1 — Weekly digest cron tells users to "unsubscribe via notification preferences" — UI doesn't exist
**Files:** `src/app/api/cron/weekly-digest/route.ts` line 303–307, line 111/204 (footer text)
The cron checks `user.publicMetadata.digestUnsubscribed === true`, but there is **no UI** anywhere in the app that writes that key (no occurrences in `src/` outside the cron). The email footer says "To unsubscribe from weekly digests, visit your notification preferences." — clicking through `/dashboard/notifications` doesn't expose this control. CAN-SPAM compliance gap; users have no opt-out. Once the cron actually fires Monday 9am, every user gets a mail with no way out except blocking the sender.
**Fix:** Either (a) add a digest opt-out toggle in `/dashboard/notifications` that writes `publicMetadata.digestUnsubscribed`, or (b) include a one-click unsubscribe link (signed token route) in every email per CAN-SPAM §316.5.

### P1 — Clerk webhook has no idempotency / replay protection
**File:** `src/app/api/webhooks/clerk/route.ts`
`verifyWebhook()` from `@clerk/nextjs/webhooks` validates the Svix signature but does NOT dedupe events. Clerk retries on 5xx; if `sendWelcomeEmail` is slow / Resend is briefly slow, Clerk retries the same `user.created` event and the user gets multiple welcome emails. Also `sendWelcomeEmail` swallows errors (`console.warn`), so we return 200 even when the email never sent — no retry path.
**Fix:** Either store seen `svix_id` headers in a TTL'd cache (5 min) and short-circuit, or accept duplicate-email risk and document it. Prefer the former.

### P2 — i18n stubs are empty strings; non-English users see blank ShareModal
**Files:** `src/lib/i18n/translations/{fr,es,it,ja,ko,zh}.ts` (shareModal namespace), `src/lib/i18n/index.ts`
VGC-121 added 26 `shareModal*` keys to all 7 language files but the 6 non-English ones contain literal `""` placeholders. The provider in `src/lib/i18n/index.ts` does NOT fall back to English on empty values — `t.shareModal.shareModalTitleViewer` simply renders as an empty string. Every non-English user who opens the share modal sees blank labels (no copy button text, no modal title, etc.).
**Fix:** In `useTranslation()`, wrap the returned object with a Proxy/get that returns `en[key]` whenever the localized value is `""` or undefined. Cheap. Or backfill the translations now.

---

## Top 5 follow-up tickets

| # | Area / File | What's wrong | Fix | Scope |
|---|---|---|---|---|
| 1 | `src/lib/email.ts` (welcome, comment notif) | Raw interpolation of `firstName`, `commenterName`, `commentBody`, `reportTitle` → stored XSS in HTML email clients | Lift `escapeHtml` to a shared util in `src/lib/email.ts`, escape every `${...}` in every HTML builder, escape subject lines too | S (~1 hr) |
| 2 | `src/app/api/share/route.ts` lines 269–284 (dedup) | Unlisted shares silently flip to private on re-share | Add `is_unlisted` to the dedup SELECT; fall back to `!!dup.is_unlisted` instead of `false` | XS (~15 min) |
| 3 | `src/app/api/cron/weekly-digest/route.ts` + `/dashboard/notifications` UI | "Unsubscribe via preferences" promised in email but no UI exists; CAN-SPAM gap | Add digest opt-out toggle that writes `publicMetadata.digestUnsubscribed` via Clerk; or signed one-click unsubscribe route | M (~2–4 hrs) |
| 4 | `src/app/api/webhooks/clerk/route.ts` | No idempotency — Clerk retries cause duplicate welcome emails | Dedupe by `svix-id` header in a 5-min cache (redis or in-memory map); short-circuit on hit | S (~1 hr) |
| 5 | `src/lib/i18n/index.ts` + 6 non-English `translations/*.ts` | Empty-string stubs render literally; non-English users see blank ShareModal | Proxy-wrap `t` to fall back to `en` on `""`/undefined; OR backfill translations | S–M (proxy is XS, backfill is M) |

---

## Architectural recommendations

### 1. Consolidate "user-facing HTML/email" templating behind a single escape boundary
The pattern of raw template literals + `escapeHtml` applied ad-hoc has now produced two XSS regressions in two weeks (digest 19-05-26 swarm, welcome email 18-05-26 still broken). Move all email templates into a thin tagged-template helper (`html\`<h1>${name}</h1>\`` that escapes interpolations by default and offers a `raw()` opt-out). Same for any future Discord embed / Slack message builders. One audit point, no foot-guns.

### 2. Add an integration smoke test for the share INSERT/UPDATE pair
The 17-05-26 INSERT-column-mismatch bug (silently corrupted ownership on every new share, fixed in 18-05-26) and the unlisted-demotion bug (still present) are both column-list bugs that pass `tsc` and `npm run build` cleanly. A 30-line vitest that creates → reads → updates → reads a row through `getDb()` against a test schema would have caught both. Currently the only test for the share flow is the `extractSpecies` unit test. Worth one focused test file given how often this route is touched.

### 3. Codify the swarm's "dock" cleanup — DoubleTapLikeOverlay still encodes dead UI
After 850e91c removed `ShareDock` and `FloatingReactionDock`, `DoubleTapLikeOverlay` still has 50+ lines guarding against `[data-vgc-dock]`, `aria-label*="share"`, `aria-label*="reaction"` elements that no longer exist. The Navbar overflow bookmark item explicitly mentions in comments that it "replaces FloatingReactionDock". `ChangelogContent.tsx:274` still advertises "Persistent ShareDock on every shared report" as a current feature. Net effect: future devs reading the code will think this UI exists. A 5-minute follow-up pass should strip the dock selectors (keep only the standard `INTERACTIVE_SELECTOR`) and rewrite the stale changelog entry as a removal note.

---

## Notes on the swarm cadence

- 4 swarm PRs in 7 days (16/17/18/19/20-05) is high-velocity but the failure mode is now visible: the 17-05 swarm introduced a P0 share-corruption bug, the 18-05 swarm fixed it, the 18-05 swarm introduced a new XSS, the 19-05 swarm fixed *part* of it (digest only, missed welcome+comment), the 20-05 swarm shipped CRLF-injection hardening (good) but didn't audit the sibling templates. Pattern: swarm finds & half-fixes one instance of a class of bug per night, never sweeps the class.
- Recommendation: when a swarm closes a security ticket (e.g. VGC-202 CRLF, 19-05 XSS), add a follow-up "audit sibling code for same class" sub-issue before closing. Or have C4 (security) always grep for the same anti-pattern across the codebase as part of fix verification.
- The "Discord-failed-DD-MM-YY.md" files keep accumulating (6 so far). The notification side of the swarm has not worked in a week. Out of scope for this review but worth a Linear ticket if not already filed.
