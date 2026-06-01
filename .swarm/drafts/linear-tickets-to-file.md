# Linear Backlog Tickets to File — 2026-06-01

Linear MCP requires OAuth and the unattended overnight runner cannot complete the flow.
This file is the structured drop-zone for any tickets the human should create in Linear
on the morning of 2026-06-01. Each entry below maps 1:1 to a `linear_create_issue`
call (title, description, priority, labels). The human or a follow-up authenticated
session should file these via Linear MCP or the Linear UI.

Conventions:
- `priority`: Urgent=1, High=2, Medium=3, Low=4 (matches Linear's numeric scale).
- `labels`: comma-separated. Create `auto-research` and `posthog-signal` if missing.
- Source-of-truth file under `.swarm/` is referenced in each description so the human
  can find the underlying audit.

---

## P0 / Urgent

### TICKET-1
- **Title:** `[INFRA] Linear webhook still failing — verify LINEAR_WEBHOOK_SIGNING_SECRET in Vercel matches Linear`
- **Priority:** Urgent (1)
- **Labels:** `auto-research`, `infra`
- **Description:**
  > The Linear webhook handler at `src/app/api/webhooks/linear/route.ts` has been audited
  > and the code is correct (see `.swarm/webhook-investigation.md` for the full
  > checklist — every requirement passes). This is the **eighth** consecutive nightly
  > swarm run that has identified the env-var configuration as the likely root cause.
  >
  > **Action required (Vercel + Linear dashboards — cannot be automated):**
  > 1. Vercel → Project → Settings → Environment Variables → Production. Confirm
  >    `LINEAR_WEBHOOK_SIGNING_SECRET` is present, non-empty, and not a placeholder.
  > 2. Linear → Settings → API → Webhooks → "pokemonvgcteamreport.com" webhook.
  >    Copy the **Signing secret** field exactly.
  > 3. Compare the two values byte-for-byte (no leading/trailing whitespace, no smart
  >    quotes from copy-paste, no truncation).
  > 4. Confirm the Linear webhook URL points to `https://pokemonvgcteamreport.com/api/webhooks/linear`,
  >    **not** a stale Vercel preview URL.
  > 5. Redeploy production after any env-var change (Vercel only applies updates on the
  >    next deployment).
  > 6. Linear → Webhooks → click "Resend" on a recent failed delivery and confirm 200.
  > 7. If Linear has auto-disabled the webhook, re-enable it.
  >
  > Closing this ticket without a code change is OK — the deliverable is verified
  > webhook delivery.

---

## P2 / High (from research synthesis — see `.swarm/research-synthesis-01-06-26.md`)

_(These will be filled in after Wave 1 returns and synthesis is written.)_

---

## P3 / Medium (code-quality follow-ups from C-pool)

### TICKET-2 (placeholder — populated from C2 report)
- **Title:** `[TS] Add Zod validation to Clerk webhook payload (replace as unknown as T)`
- **Priority:** Medium (3)
- **Labels:** `auto-research`, `tech-debt`, `type-safety`
- **Description:**
  > `src/app/api/webhooks/clerk/route.ts:46` casts `event.data` via `as unknown as ClerkUserCreatedData` —
  > the most dangerous TypeScript pattern. If Clerk's webhook payload structure ever changes
  > (or sends a partially-populated event), the cast silently accepts invalid data and the
  > handler crashes on the first property access.
  >
  > Fix: define a Zod schema for the expected Clerk event shape and `.parse()` the body
  > before use. See `.swarm/c2-typescript-01-06-26.md` finding #3 for the proposed schema.

### TICKET-3 (placeholder — populated from C2 report)
- **Title:** `[TS] Replace z.unknown() validators on /api/share with concrete nested schemas`
- **Priority:** Medium (3)
- **Labels:** `auto-research`, `tech-debt`, `type-safety`
- **Description:**
  > `src/app/api/share/route.ts:16-19` uses `z.unknown()` for `matchupPlans`, `notes`,
  > `calcs`, `roles`, and `spriteSettings`. Downstream code then assumes a specific shape
  > on these fields (e.g. `matchupPlans[i].notes`), so the apparent validation is a no-op.
  >
  > Fix: define concrete schemas for each nested type so the validation actually catches
  > malformed payloads at the API boundary. See `.swarm/c2-typescript-01-06-26.md` finding #9.

_(Additional tickets from C1, C3, C4, C5, R1, R6, R8 will be appended after Wave 1 completes.)_
