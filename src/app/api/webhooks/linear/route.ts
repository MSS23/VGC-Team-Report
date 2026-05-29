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
 * env configuration). Returns 200 for valid signatures (including unknown
 * event types), 401 for invalid or missing signatures, 400 for missing
 * body, 500 for unexpected errors.
 */
export async function POST(request: Request) {
  const webhookSecret =
    process.env.LINEAR_WEBHOOK_SIGNING_SECRET ||
    process.env.LINEAR_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("Linear webhook: signing secret not configured");
    return NextResponse.json(
      { error: "Webhook not configured" },
      { status: 500 },
    );
  }

  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return NextResponse.json({ error: "Unable to read body" }, { status: 400 });
  }

  if (!rawBody) {
    return NextResponse.json({ error: "Empty body" }, { status: 400 });
  }

  const signature =
    request.headers.get("linear-signature") ||
    request.headers.get("x-linear-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 401 });
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

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ ok: true });
  }

  if (body && body.type === "url_verification" && typeof body.challenge === "string") {
    return NextResponse.json({ challenge: body.challenge });
  }

  return NextResponse.json({ ok: true });
}
