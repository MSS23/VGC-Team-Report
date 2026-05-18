# Clerk Webhook — Welcome Email Implementation Plan
_Research date: 2026-05-18_

---

## 1. Overview

When a new user signs up via Clerk, Clerk fires a `user.created` webhook event. This plan describes how to verify that event and send a Day-0 welcome email using the existing `sendEmail()` helper in `src/lib/email.ts`.

---

## 2. New Dependency: svix

`svix` is **not currently installed** (confirmed from `package.json`). However, `@clerk/nextjs` v7 exports `verifyWebhook` from `@clerk/nextjs/webhooks`, which is the modern, recommended approach — it handles Svix verification internally using the bundled Clerk SDK without requiring a separate `svix` install.

**Recommended approach:** use `verifyWebhook` from `@clerk/nextjs/webhooks`.

**Fallback approach** (if `verifyWebhook` is unavailable): install `svix` and use the raw `Webhook` class.

```bash
# Only needed for the fallback approach
npm install svix
```

For the primary approach, no new packages are required.

---

## 3. Environment Variables Required

| Variable | Where to get it | Notes |
|---|---|---|
| `CLERK_WEBHOOK_SIGNING_SECRET` | Clerk Dashboard → Webhooks → your endpoint → Signing Secret | Starts with `whsec_...` |
| `RESEND_API_KEY` | Already present in `.env.local` | Used by existing `sendEmail()` |
| `RESEND_FROM_EMAIL` | Already present in `.env.local` | e.g. `VGC Team Report <updates@pokemonvgcteamreport.com>` |

Add to `.env.local`:
```
CLERK_WEBHOOK_SIGNING_SECRET=whsec_xxxxxxxxxxxxxxxxxxxx
```

Add to Vercel dashboard → Settings → Environment Variables (Production + Preview).

---

## 4. Clerk Dashboard Setup

1. Go to Clerk Dashboard → **Webhooks** → **Add Endpoint**
2. URL: `https://pokemonvgcteamreport.com/api/webhooks/clerk`
3. Subscribe to event: **`user.created`** (optionally also `user.updated`, `user.deleted` for future use)
4. Copy the **Signing Secret** (`whsec_...`) → add as `CLERK_WEBHOOK_SIGNING_SECRET`

---

## 5. Middleware — No Changes Needed

`src/middleware.ts` already includes `/api/webhooks/:path*` in `isPublicRoute` (line 33) and in the `isCronOrWebhook` bypass (line 65). The new `/api/webhooks/clerk` route will be treated as public and skip bot-detection automatically. CORS is also exempted for `/api/webhooks/` paths (line 115). **No middleware changes required.**

---

## 6. API Route Structure

**File:** `src/app/api/webhooks/clerk/route.ts`

```typescript
import { verifyWebhook } from '@clerk/nextjs/webhooks'
import { NextRequest, NextResponse } from 'next/server'
import { sendWelcomeEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  // 1. Verify signature — throws on invalid/missing CLERK_WEBHOOK_SIGNING_SECRET
  let evt
  try {
    evt = await verifyWebhook(req)
  } catch (err) {
    console.error('[clerk-webhook] Verification failed:', err)
    return NextResponse.json({ error: 'Verification failed' }, { status: 400 })
  }

  // 2. Handle user.created
  if (evt.type === 'user.created') {
    const { id, email_addresses, first_name, last_name } = evt.data

    const primaryEmail = email_addresses.find(
      (e) => e.id === evt.data.primary_email_address_id
    )?.email_address ?? email_addresses[0]?.email_address

    if (primaryEmail) {
      const firstName = first_name ?? ''
      await sendWelcomeEmail({ to: primaryEmail, firstName })
    } else {
      console.warn(`[clerk-webhook] user.created for ${id} had no email address`)
    }
  }

  return NextResponse.json({ ok: true })
}
```

### Fallback: Raw Svix Approach (if verifyWebhook not available)

```typescript
import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'

export async function POST(req: Request) {
  const secret = process.env.CLERK_WEBHOOK_SIGNING_SECRET
  if (!secret) {
    return Response.json({ error: 'No signing secret' }, { status: 500 })
  }

  const headerStore = await headers()
  const svixId        = headerStore.get('svix-id')
  const svixTimestamp = headerStore.get('svix-timestamp')
  const svixSignature = headerStore.get('svix-signature')

  if (!svixId || !svixTimestamp || !svixSignature) {
    return Response.json({ error: 'Missing svix headers' }, { status: 400 })
  }

  // IMPORTANT: use raw text body — JSON.parse then re-stringify breaks the signature
  const rawBody = await req.text()

  const wh = new Webhook(secret)
  let evt: WebhookEvent
  try {
    evt = wh.verify(rawBody, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as WebhookEvent
  } catch (err) {
    console.error('[clerk-webhook] Svix verify failed:', err)
    return Response.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (evt.type === 'user.created') {
    // ... same handler logic as above
  }

  return Response.json({ ok: true })
}
```

**Critical note on raw body:** The `Webhook.verify()` method is sensitive to the exact bytes of the request body. Never `JSON.parse` and re-`JSON.stringify` — use `req.text()` and pass the string directly. The `verifyWebhook` helper handles this correctly internally.

---

## 7. user.created Event Payload Shape

```typescript
// evt.type === 'user.created'
// evt.data is the Clerk User object:
{
  id: "user_29w83sxmDNGwOuEthce5gg56FcC",
  object: "user",
  first_name: "Example",
  last_name: null,
  username: null,
  image_url: "https://img.clerk.com/xxxxxx",
  primary_email_address_id: "idn_29w83yL7CwVlJXylYLxcslromF1",
  email_addresses: [
    {
      id: "idn_29w83yL7CwVlJXylYLxcslromF1",
      object: "email_address",
      email_address: "example@example.org",
      verification: { status: "verified", strategy: "admin" },
      linked_to: []
    }
  ],
  phone_numbers: [],
  external_accounts: [],
  public_metadata: {},
  private_metadata: {},
  unsafe_metadata: {},
  password_enabled: true,
  two_factor_enabled: false,
  created_at: 1654012591514,   // Unix ms
  updated_at: 1654012824306,
  last_sign_in_at: null
}
```

To get the primary email reliably:
```typescript
const email = evt.data.email_addresses.find(
  (e) => e.id === evt.data.primary_email_address_id
)?.email_address ?? evt.data.email_addresses[0]?.email_address
```

---

## 8. Welcome Email Function

Add `sendWelcomeEmail` to `src/lib/email.ts`:

```typescript
export async function sendWelcomeEmail(opts: {
  to: string
  firstName: string
}) {
  const name = opts.firstName || 'Trainer'
  return sendEmail({
    to: opts.to,
    subject: 'Welcome to VGC Team Report!',
    html: buildWelcomeEmailHtml(name),
  })
}
```

### Welcome Email HTML Template Plan

Structure (matches existing email templates — table-based, light theme, 520px max-width):

| Section | Content |
|---|---|
| **Preheader** | "Your VGC journey starts here — build, analyse, and share your teams." |
| **Logo block** | Red "V" badge + "VGC Team Report" wordmark (same as comment notification email) |
| **Hero heading** | "Welcome, {firstName}!" |
| **Body copy** | 2–3 sentences: what VGC Team Report does, key value props (paste a team, get analysis, share via link) |
| **Primary CTA** | "Build Your First Team" → `https://pokemonvgcteamreport.com/` (dark button, same style as existing) |
| **Secondary links** | Explore → `/explore`, Champions → `/champions` |
| **Footer** | Same as existing emails — minimal, no unsubscribe needed for transactional |

Styling conventions to follow (from existing templates):
- Background: `#F4F4F5`
- Card: `background:#FFFFFF; border-radius:16px; border:1px solid #E5E7EB; padding:28px`
- Heading: `font-size:20px; font-weight:700; color:#111827`
- Body text: `font-size:14px; color:#6B7280; line-height:1.6`
- Primary button: `background:#111827; color:#FFFFFF; padding:12px 24px; border-radius:8px; font-weight:600`

---

## 9. Error Handling Strategy

- **Missing secret:** Return 500 immediately — misconfiguration, not Clerk's fault
- **Invalid signature:** Return 400 — Clerk will NOT retry 4xx responses
- **Email send fails:** Log warning but return 200 — never fail the webhook on email errors (Clerk retries on non-2xx, so a transient Resend failure would cause duplicate welcome emails)
- **No email address:** Log warning, return 200 — edge case (OAuth without email)

---

## 10. Local Testing with ngrok / Clerk Dev

For local development:
1. `ngrok http 3000` → get a forwarding URL
2. Add ngrok URL as a webhook endpoint in Clerk Dashboard (dev instance)
3. Set `CLERK_WEBHOOK_SIGNING_SECRET` in `.env.local` to the dev endpoint's signing secret
4. Trigger: create a new user via Clerk's dashboard or sign up via the app
5. Check terminal for `[clerk-webhook]` log lines

Alternatively, use the **Clerk Dashboard → Webhooks → Send test event** to replay `user.created`.

---

## 11. File Checklist

| Action | File |
|---|---|
| CREATE | `src/app/api/webhooks/clerk/route.ts` |
| MODIFY | `src/lib/email.ts` — add `sendWelcomeEmail()` and `buildWelcomeEmailHtml()` |
| MODIFY | `.env.local` — add `CLERK_WEBHOOK_SIGNING_SECRET` |
| NO CHANGE | `src/middleware.ts` — already handles `/api/webhooks/:path*` correctly |
| NO CHANGE | `package.json` — no new packages needed (verifyWebhook bundled in @clerk/nextjs v7) |

---

## Sources

- [Clerk Webhooks SKILL.md (clerk/skills)](https://github.com/clerk/skills/blob/main/skills/features/clerk-webhooks/SKILL.md)
- [Clerk Docs: Sync data with webhooks](https://clerk.com/docs/guides/development/webhooks/syncing)
- [Svix: How to Verify Webhooks](https://docs.svix.com/receiving/verifying-payloads/how)
- [Clerk Webhooks Overview](https://clerk.com/docs/guides/development/webhooks/overview)
