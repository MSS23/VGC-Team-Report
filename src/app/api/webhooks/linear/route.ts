import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * POST /api/webhooks/linear
 *
 * Receives Linear webhook events. Verifies HMAC signature over the raw
 * request body before processing. Unknown event types are acknowledged
 * with 200 so Linear stops retrying.
 */
export async function POST(request: Request) {
  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return NextResponse.json({ error: "Failed to read body" }, { status: 400 });
  }

  const webhookSecret =
    process.env.LINEAR_WEBHOOK_SIGNING_SECRET ||
    process.env.LINEAR_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("Linear webhook: signing secret env var not set");
    return NextResponse.json({ error: "Server not configured" }, { status: 500 });
  }

  // Linear sends the signature in the `linear-signature` header (lowercased
  // by Node's HTTP layer). Older code read `x-linear-signature` which never
  // matches — preserve compatibility by checking both.
  const signature =
    request.headers.get("linear-signature") ||
    request.headers.get("x-linear-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 401 });
  }

  if (!rawBody) {
    // Linear's setup verification ping may arrive with an empty body. We've
    // already validated the secret is configured; acknowledge so registration
    // succeeds.
    return NextResponse.json({ ok: true });
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

  // Acknowledge unknown / future event types so Linear does not retry.
  try {
    const body = JSON.parse(rawBody);
    if (body?.type === "url_verification" && typeof body.challenge === "string") {
      return NextResponse.json({ challenge: body.challenge });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
