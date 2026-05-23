import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();

    const webhookSecret =
      process.env.LINEAR_WEBHOOK_SIGNING_SECRET ||
      process.env.LINEAR_WEBHOOK_SECRET;
    if (!webhookSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const signature =
      request.headers.get("linear-signature") ||
      request.headers.get("x-linear-signature");
    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 401 });
    }

    if (!rawBody) {
      return NextResponse.json({ error: "Missing body" }, { status: 400 });
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

    let body: { type?: string; challenge?: string } = {};
    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ ok: true });
    }

    if (body.type === "url_verification" && body.challenge) {
      return NextResponse.json({ challenge: body.challenge });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Linear webhook error:", e);
    return NextResponse.json({ error: "Webhook failed" }, { status: 500 });
  }
}
