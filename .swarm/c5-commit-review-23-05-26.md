# C5 — Commit Review (last 20 commits on main)

Date: 2026-05-23
Scope: `git log origin/main -20` (range `03c1547..850e91c`)
Reviewer: code-review (Claude)

## Commits reviewed

```
850e91c Delete share + reaction docks; persist duplicate-CTA dismissal
3ace051 Instagram-style dock UX + double-tap-to-like + owner pencil
b1af62f Streamline mobile shared-view UX
767ef07 swarm: nightly improvements 20-05-26 (#34)
52437b8 chore: remove newsletter signup component and API route
6f1e552 swarm: nightly improvements 19-05-26 (#33)
b1e95df swarm: nightly improvements 18-05-26 (#32)
90c57c2 swarm: nightly improvements 17-05-26 (#30)
7dd9900 swarm: nightly improvements 16-05-26 (#29)
83295c1 fix: posthog?.capture optional chain in anonymous share intent handler
cddad63 Merge branch 'claude-dev' into main
8021723 swarm: Discord notification payload (unsent — no .env.local) 15-05-26
9c644f5 swarm: research notes, drafts, and rejection log 15-05-26
8fd7e37 swarm: update Updates page for May 2026 (version 5.15 — 10 entries)
09c073c swarm: PWA — engagement-triggered install prompt + manifest screenshots
2fe7cb5 VGC-175: add static /public/og-default.png as OG image fallback
de7466b swarm: onboarding UX — Explore empty state shortcuts + paste hint tooltip
761a10d swarm: fix dead exports and implicit-any TypeScript errors in API routes
282aef1 VGC-182: push Champions meta species aggregation into SQL
03c1547 VGC-137: speed tier chart — Yours/Meta badge disambiguation + Mega matching
```

---

## Findings

### F1 — XSS in `sendWelcomeEmail` (welcome email HTML)
- Commit: `b1e95df` (VGC-125 Clerk webhook → welcome email)
- File: `src/lib/email.ts:185–219` (`buildWelcomeEmailHtml`)
- Category: **Security (P0)**
- Detail: The 19-05-26 swarm (commit `6f1e552`) introduced `escapeHtml()` and applied it to the weekly-digest templates. The welcome-email path added in `b1e95df` interpolates Clerk-supplied `firstName` directly into the `<h1>` (`Welcome to VGC Team Report, ${firstName}!`) with no escaping. An attacker who sets a malicious first name on their Clerk profile gets HTML injected into the welcome email at sign-up time.
- Suggested fix: extract `escapeHtml()` into `src/lib/utils/html-escape.ts`, import in `email.ts`, and wrap every `firstName`, `displayName`, `commenterName`, `commentBody`, `reportTitle` interpolation. Also escape the title in the `subject:` string of `sendCommentNotificationEmail` (it embeds `reportTitle` in quotes — minor, but consistent).
- File a Linear ticket: **YES** — P0 follow-up. Same class as the partially-fixed digest bug.

### F2 — Same XSS class in `buildCommentNotificationHtml`
- Commit: pre-window (existing), but flagged because the 19-05-26 escape fix should have caught it
- File: `src/lib/email.ts:89–158` (`buildCommentNotificationHtml`, lines 130 & 135)
- Category: **Security (P0)**
- Detail: `commenterName`, `commentBody`, and `reportTitle` are interpolated raw. `commentBody` is the most dangerous — it's persisted from public commenters. White-space-pre-wrap CSS does NOT neutralise HTML; the browser/email client still parses `<script>` / `<img onerror>` tags.
- Suggested fix: same escape helper as F1.
- File a Linear ticket: **YES** — bundle with F1 as a single "Escape all user-controlled email HTML" ticket.

### F3 — Fire-and-forget SQL queries inside serverless handlers
- Commit: `b1e95df` (and earlier — touched in `7dd9900` too)
- Files: `src/app/api/share/route.ts:222–225`, `:336–339`, `:345`, `:349`
- Category: **Bug / Tech-Debt**
- Detail: Several `sql\`…\`.catch(…)` calls are NOT awaited. On Vercel + Neon HTTP driver, the lambda freezes immediately when the `NextResponse` returns; the unawaited query is cancelled mid-flight. Result: changelog entries silently fail to insert, drafts are not deleted, explore cache is not always invalidated. The user comment says "fire-and-forget" but the runtime doesn't actually support that pattern.
- Suggested fix: `await` each call. They're already inside try/catch (or wrapped with `.catch(() => {})`), so a stray failure won't bring the response down — but the work will actually complete.
- File a Linear ticket: **YES** — easy fix, high-confidence correctness bug.

### F4 — `POST /api/user/saved` doesn't verify the share exists / is accessible
- Commit: `850e91c` (Navbar Save button consumes it)
- File: `src/app/api/user/saved/route.ts:53–86`
- Category: **Security (low) / Maintainability**
- Detail: Body is `{ shareId: string.min(1) }`. The INSERT does `ON CONFLICT DO NOTHING` but never checks that the share exists, isn't deleted, isn't a draft, and isn't private + non-owner. A signed-in user can poke `POST /api/user/saved` with any `shareId` string (including IDs they shouldn't be able to view) and pollute their `saved_reports` table. Subsequent `GET /api/user/saved` JOINs against `shares`, so private rows DO get rendered back to the would-be attacker (which is the real leak).
- Suggested fix: add a pre-INSERT `SELECT id FROM shares WHERE id = $1 AND deleted_at IS NULL AND (is_public = TRUE OR owner_id = $userId)` guard. Return 404 if not found.
- File a Linear ticket: **YES** — low-severity but real privacy leak.

### F5 — InstallPrompt: Android prompt never reveals on non-scrolling pages
- Commit: `09c073c` (15-05-26) → `90c57c2` (17-05-26 added iOS `pageIsShort` rescue)
- File: `src/components/ui/InstallPrompt.tsx:33–58`
- Category: **Bug (Maintainability)**
- Detail: `maybeReveal()` requires `timerFired && scrollFired && promptReady`. On iOS, the 17-05-26 swarm added a `pageIsShort` fallback. The Android/Chrome path (lines 33–58) didn't get the same treatment: a Chrome user on a short-content page (e.g. landing page on a tall desktop monitor) where `window.scrollY` never reaches 200 will *never* see the install prompt, even though `beforeinstallprompt` fired.
- Suggested fix: apply the same `pageIsShort` short-circuit to `maybeReveal()` — pre-set `scrollFired = true` once we detect the page can't be scrolled 200px after the 60s timer.
- File a Linear ticket: **YES** — discoverability regression on desktop Chrome.

### F6 — `DoubleTapLikeOverlay` aria-label heuristic is over-broad
- Commit: `3ace051`
- File: `src/components/social/DoubleTapLikeOverlay.tsx:50–57` and `:228–235`
- Category: **Bug (UX)**
- Detail: The DOCK_SELECTOR matches any element whose `aria-label` contains the word "share" or "reaction" (case-insensitive). The Navbar Share button has `aria-label="Share"`. Other future controls that simply mention "share" (e.g. "Share via email", "Reaction settings") would also be excluded from the double-tap. The composedPath fallback at lines 228–235 also blocks on any element with an `aria-label` matching `/share/i` or `/reaction/i`. Effect today is mild (it just means double-tapping the Navbar share button won't fire a like — desired); but the pattern is fragile and will catch future legitimate targets.
- Suggested fix: prefer the explicit `data-vgc-dock` attribute and drop the aria-label regex. Tag the few control containers that legitimately want to opt out of the gesture with `data-vgc-dock` instead.
- File a Linear ticket: **No** — note in code, fix opportunistically.

### F7 — Stale changelog entry advertises deleted ShareDock feature
- Commit: `850e91c` (deleted ShareDock) — earlier changelog entry survived
- File: `src/app/changelog/ChangelogContent.tsx:274`
- Category: **Maintainability**
- Detail: Entry still reads "Persistent ShareDock on every shared report — X/Twitter, Reddit, Discord copy and Copy Link are one tap away in a top-anchored pill…" The dock was deleted in `850e91c`. Users reading the changelog will look for a feature that no longer exists.
- Suggested fix: either delete the entry or add a counter-entry in the latest version noting the rollback rationale.
- File a Linear ticket: **No** — content fix, piggyback on next push.

### F8 — `SHARE_CTA_DISMISSED_KEY` referenced by name but never declared
- Commit: `850e91c`
- File: `src/app/page.tsx:244`
- Category: **Maintainability**
- Detail: Comment talks about the "`SHARE_CTA_DISMISSED_KEY` namespace" but the codebase only uses an inline template literal `vgc-share-cta-dismissed:${id}` (lines 637, 1648). Reader has to grep for the symbol and find nothing. Extracting the prefix to a `const SHARE_CTA_DISMISSED_KEY = "vgc-share-cta-dismissed"` would make the comment honest and prevent future drift.
- Suggested fix: hoist the prefix constant.
- File a Linear ticket: **No** — tiny.

### F9 — `cypress/` excluded from tsconfig despite no e2e test runner
- Commit: `b1e95df`
- File: `tsconfig.json` (cypress added to exclude)
- Category: **Tech-Debt**
- Detail: The 18-05-26 commit excluded `cypress` because @types/cypress was missing. If we don't intend to use Cypress, the directory itself is dead weight. If we DO intend to use it, we should install the types and re-include it. Right now we have the worst of both: cypress files sit in the repo but TypeScript never validates them.
- Suggested fix: either `rm -rf cypress/` or `npm i -D cypress @types/cypress` and remove the tsconfig exclude.
- File a Linear ticket: **YES** — small, but it accumulates.

### F10 — Welcome email subject contains template-injected firstName
- Commit: `b1e95df` (and ongoing in weekly-digest)
- Files: `src/app/api/cron/weekly-digest/route.ts:342`, `src/lib/email.ts:78`
- Category: **Security (low)**
- Detail: Resend's API takes `subject` as a JSON string, so CRLF injection is neutralised by `JSON.stringify` server-side — but if the subject ever flows through a header builder, mis-formatted user input (`First\r\nBcc: evil@…`) becomes a header-injection vector. Defence-in-depth: strip control chars from the values before composing the subject. Same `replace(/[\r\n]/g, "")` pattern as `RESEND_FROM_EMAIL`.
- Suggested fix: small helper `safeSubject(s: string)` applied at every call site.
- File a Linear ticket: **No** — file as P3 hardening alongside F1/F2.

---

## Conflict-risk check (overlap with `.swarm/main-changed-files.md`)

The following files are in both this review's "files that need a follow-up touch" list AND the `main-changed-files.md` 7-day recently-touched list. Any fix here risks merge conflicts if a swarm run grabs them first:

- `src/lib/email.ts` — recently touched (welcome + digest builders). F1 & F2 land here.
- `src/app/api/share/route.ts` — heavily touched (3 swarm runs). F3 lands here.
- `src/app/api/user/saved/route.ts` — NOT in `main-changed-files.md`. Safe.
- `src/components/ui/InstallPrompt.tsx` — recently touched. F5 lands here.
- `src/app/page.tsx` — extremely hot file (touched 4× in last 7 days). F8 lands here — keep change tiny.
- `src/app/changelog/ChangelogContent.tsx` — touched every swarm run. F7 will conflict if not coordinated with the version-N entry.
- `src/components/social/DoubleTapLikeOverlay.tsx` — new file, not in 7-day list yet but will be edited heavily. F6 should be deferred to next gesture-tuning pass.
- `tsconfig.json` — touched 18-05-26. F9 safe (one-line change).

Recommendation: batch F1+F2+F10 (one PR touching `email.ts`), F3 (one small PR on `share/route.ts`), F4 (isolated, safe), F5 (isolated). Keep F6, F7, F8, F9 for opportunistic clean-up.

---

## Top 5 follow-ups (file as Linear tickets)

1. **F1 + F2 + F10 — Escape user-controlled HTML in welcome + comment notification emails (P0 security).** The 19-05-26 swarm partially fixed the same XSS class in weekly-digest; the welcome and comment-notification paths were missed.
2. **F3 — Replace fire-and-forget SQL with awaited writes in `src/app/api/share/route.ts`.** Changelog inserts and draft cleanup silently fail today because the serverless function returns before the unawaited query lands.
3. **F4 — Validate share access in `POST /api/user/saved`.** A signed-in user can poison their saved-reports list with private/draft shareIds and then GET back the joined data, leaking content the share's owner did not make public.
4. **F5 — Apply `pageIsShort` short-circuit to the Android `InstallPrompt` path.** Desktop Chrome users on short-content pages never see the install prompt because `scrollFired` never becomes true.
5. **F9 — Decide on Cypress: delete the directory or install the types.** Today the e2e files sit in-repo with no type-checking and no runner.
