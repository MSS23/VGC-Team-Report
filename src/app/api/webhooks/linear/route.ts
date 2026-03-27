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
    const body = await request.json();

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
