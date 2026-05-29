import { type NextRequest, NextResponse } from "next/server";
import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { sendEmail, buildWelcomeEmailHtml } from "@/lib/email";
import { cacheSetIfAbsent } from "@/lib/cache";

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
  // cacheSetIfAbsent returns true only on the first call within the TTL window.
  if (svixId) {
    const isNew = await cacheSetIfAbsent(`clerk:svix:${svixId}`, 300);
    if (!isNew) {
      console.info("Clerk webhook duplicate detected — skipping", { svixId });
      return NextResponse.json({ ok: true, deduped: true });
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

      const displayName = data.first_name || "there";
      const result = await sendEmail({
        to: primaryEmail.email_address,
        subject: "Welcome to VGC Team Report!",
        html: buildWelcomeEmailHtml(displayName),
      });

      if (!result) {
        // sendEmail returns null on failure — return 500 so Clerk retries.
        // The next retry will pass the svix-id dedup check only if this
        // delivery's svix-id hasn't been cached (i.e. Redis was unavailable).
        console.error("Failed to send welcome email to", primaryEmail.email_address);
        return NextResponse.json({ error: "Email send failed" }, { status: 500 });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Clerk webhook handler error:", e);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
