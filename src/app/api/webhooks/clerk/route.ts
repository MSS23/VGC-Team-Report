import { type NextRequest, NextResponse } from "next/server";
import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { sendWelcomeEmail } from "@/lib/email";
import { cacheDel, cacheSetIfAbsentResult } from "@/lib/cache";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface ClerkEmailAddress {
  id: string;
  email_address: string;
}

interface ClerkUserCreatedData {
  id: string;
  email_addresses: ClerkEmailAddress[];
  primary_email_address_id: string | null;
  first_name: string | null;
}

/**
 * POST /api/webhooks/clerk
 *
 * Receives Clerk webhook events. On user.created, sends a Day 0 welcome email.
 * Signature verification uses CLERK_WEBHOOK_SIGNING_SECRET (set in Clerk dashboard).
 *
 * Idempotency: svix-id is stored in Redis for 5 minutes to prevent duplicate
 * welcome emails when Clerk retries a delivery.
 */
export async function POST(request: NextRequest) {
  // Guard: signing secret must be configured
  const signingSecret = process.env.CLERK_WEBHOOK_SIGNING_SECRET;
  if (!signingSecret) {
    console.warn("CLERK_WEBHOOK_SIGNING_SECRET is not set — rejecting webhook");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 400 });
  }

  // Capture svix-id before verifyWebhook reads the body
  const svixId = request.headers.get("svix-id");

  let event: Awaited<ReturnType<typeof verifyWebhook>>;
  try {
    event = await verifyWebhook(request);
  } catch (e) {
    console.error("Clerk webhook signature verification failed:", e);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Deduplicate: if we have already processed this svix-id, return 200 immediately.
  //
  // Only a confirmed "exists" is a duplicate. When Redis itself is unavailable
  // the dedup state is UNKNOWN, and we deliberately FAIL OPEN and process the
  // event: a 200 here is final (Clerk never retries a 200), so treating an
  // Upstash blip as a duplicate dropped the welcome email permanently. At worst
  // failing open sends one extra welcome email; failing closed loses it forever.
  //
  // We also do not answer non-2xx to force a Clerk retry: a prolonged Upstash
  // outage would then fail every delivery and risk Clerk disabling the endpoint
  // for all signups — the same terminal shape the Linear webhook's 200-on-error
  // catch exists to avoid (VGC-WEBHOOK). Retries are still used where they
  // actually help: a failed email send below releases the key and returns 500.
  if (svixId) {
    const dedup = await cacheSetIfAbsentResult(`clerk:svix:${svixId}`, 300);
    if (dedup === "exists") {
      console.info("Clerk webhook duplicate detected — skipping", { svixId });
      return NextResponse.json({ ok: true, deduped: true });
    }
    if (dedup === "error") {
      console.error(
        "Clerk webhook dedup check unavailable (Redis error) — processing anyway, a duplicate delivery may resend the welcome email",
        { svixId, eventType: event.type },
      );
    }
  }

  try {
    if (event.type === "user.created") {
      const data = event.data as unknown as ClerkUserCreatedData;

      const primaryEmail = data.email_addresses.find(
        (addr) => addr.id === data.primary_email_address_id,
      );

      if (!primaryEmail?.email_address) {
        console.warn("Clerk user.created event has no primary email — skipping welcome email", {
          userId: data.id,
        });
        return NextResponse.json({ ok: true });
      }

      const result = await sendWelcomeEmail({
        to: primaryEmail.email_address,
        firstName: data.first_name,
      });

      if (!result) {
        // sendEmail returns null on failure — return 500 so Clerk retries.
        // Release the svix-id first, otherwise the retry is deduped and the email is lost.
        if (svixId) await cacheDel(`clerk:svix:${svixId}`);
        console.error("Failed to send welcome email to", primaryEmail.email_address);
        return NextResponse.json({ error: "Email send failed" }, { status: 500 });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Clerk webhook handler error:", e);
    // Return HTTP 200 even on internal/handler errors so Clerk does not
    // auto-disable the webhook or retry (which would cause duplicate welcome
    // emails). Signature verification failures above still return 4xx.
    return NextResponse.json({ ok: false, error: "handler_error" }, { status: 200 });
  }
}
