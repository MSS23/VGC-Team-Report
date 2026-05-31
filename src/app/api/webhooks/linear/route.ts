import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export const runtime = "nodejs";

/**
 * POST /api/webhooks/linear
 *
 * Receives Linear webhook events. Verifies the HMAC-SHA256 signature
 * Linear sends in the `linear-signature` header against the raw request
 * body using the LINEAR_WEBHOOK_SIGNING_SECRET (legacy name
 * LINEAR_WEBHOOK_SECRET still accepted to avoid breaking existing Vercel
 * env configuration).
 *
 * Returns 200 for valid signatures (including unknown event types) and for
 * the empty-body setup ping Linear sends when first configuring a webhook.
 * Returns 200 in the catch block as well so Linear does not auto-disable the
 * webhook on a transient error. Returns 400 for a missing signature and 401
 * for an invalid signature or missing signing secret.
 */
export async function POST(request: Request) {
  try {
    const rawBody = await request.text();

    // Linear sends an empty-body request when first configuring the webhook.
    if (!rawBody) {
      return NextResponse.json({ ok: true });
    }

    const webhookSecret =
      process.env.LINEAR_WEBHOOK_SIGNING_SECRET ??
      process.env.LINEAR_WEBHOOK_SECRET;
    if (!webhookSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const signature =
      request.headers.get("linear-signature") ??
      request.headers.get("x-linear-signature");
    if (!signature) {
      return NextResponse.json(
        { error: "Missing signature" },
        { status: 400 },
      );
    }

    const expected = createHmac("sha256", webhookSecret)
      .update(rawBody)
      .digest("hex");
    const expectedBuf = Buffer.from(expected, "utf8");
    const signatureBuf = Buffer.from(signature, "utf8");
    if (
      expectedBuf.length !== signatureBuf.length ||
      !timingSafeEqual(expectedBuf, signatureBuf)
    ) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const body = JSON.parse(rawBody);

    if (body.type === "url_verification") {
      return NextResponse.json({ challenge: body.challenge });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    // Log without exposing raw body, signature, or secrets — observability for
    // the catch-all path that previously failed silently.
    console.error("linear webhook handler error", {
      message: err instanceof Error ? err.message : String(err),
    });
    // Return 200 so Linear does not auto-disable the webhook on a transient error.
    return NextResponse.json({ ok: true });
  }
}

export function GET() {
  return NextResponse.json(
    { error: "Method not allowed. This endpoint accepts POST requests only." },
    { status: 405, headers: { Allow: "POST" } }
  );
}
