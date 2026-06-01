import { type NextRequest, NextResponse } from "next/server";
import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { sendWelcomeEmail } from "@/lib/email";

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
 */
export async function POST(request: NextRequest) {
  // Guard: signing secret must be configured
  const signingSecret = process.env.CLERK_WEBHOOK_SIGNING_SECRET;
  if (!signingSecret) {
    console.warn("CLERK_WEBHOOK_SIGNING_SECRET is not set — rejecting webhook");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 400 });
  }

  let event: Awaited<ReturnType<typeof verifyWebhook>>;
  // verifyWebhook reads the body internally — pass the request directly

  try {
    event = await verifyWebhook(request);
  } catch (e) {
    console.error("Clerk webhook signature verification failed:", e);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    if (event.type === "user.created") {
      const data = event.data as unknown as ClerkUserCreatedData;

      // Find the primary email address
      const primaryEmail = data.email_addresses.find(
        (addr) => addr.id === data.primary_email_address_id,
      );

      if (!primaryEmail?.email_address) {
        console.warn("Clerk user.created event has no primary email — skipping welcome email", {
          userId: data.id,
        });
        return NextResponse.json({ ok: true });
      }

      await sendWelcomeEmail({
        to: primaryEmail.email_address,
        firstName: data.first_name,
      });
    }

    // Acknowledge all other event types
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[webhook:clerk] handler error:", error);
    // Return HTTP 200 even on internal/handler errors so Clerk does not
    // auto-disable the webhook or retry (which would cause duplicate welcome
    // emails). Signature verification failures above still return 4xx.
    return NextResponse.json({ ok: false, error: "handler_error" }, { status: 200 });
  }
}
