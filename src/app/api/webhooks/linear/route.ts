import { createHmac } from "crypto";
import { NextResponse } from "next/server";

/**
 * POST /api/webhooks/linear
 *
 * Receives Linear webhook events. Currently only handles URL verification
 * for the webhook registration. Issue implementation is done manually
 * via Claude Code CLI in the terminal.
 */
export async function POST(request: Request) {
  try {
    const rawBody = await request.text();

    // Verify HMAC-SHA256 signature from Linear
    const webhookSecret = process.env.LINEAR_WEBHOOK_SECRET;
    if (webhookSecret) {
      const signature = request.headers.get("x-linear-signature");
      if (!signature) {
        return NextResponse.json({ error: "Missing signature" }, { status: 401 });
      }
      const expected = createHmac("sha256", webhookSecret).update(rawBody).digest("hex");
      if (signature !== expected) {
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    } else {
      console.warn("LINEAR_WEBHOOK_SECRET is not set — skipping webhook signature verification");
    }

    const body = JSON.parse(rawBody);

    // Linear sends a verification request on webhook creation
    if (body.type === "url_verification") {
      return NextResponse.json({ challenge: body.challenge });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Linear webhook error:", e);
    return NextResponse.json({ error: "Webhook failed" }, { status: 500 });
  }
}
