import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();

    if (!rawBody) {
      return NextResponse.json({ ok: true });
    }

    const webhookSecret = process.env.LINEAR_WEBHOOK_SIGNING_SECRET;
    if (!webhookSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const signature = request.headers.get("linear-signature");
    if (!signature) {
      return NextResponse.json(
        { error: "Missing signature" },
        { status: 400 }
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
  } catch {
    return NextResponse.json({ ok: true });
  }
}

export function GET() {
  return NextResponse.json(
    { error: "Method not allowed. This endpoint accepts POST requests only." },
    { status: 405, headers: { Allow: "POST" } }
  );
}
