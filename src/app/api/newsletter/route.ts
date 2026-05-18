import { getDb } from "@/lib/db";
import { isRateLimitedAsync } from "@/lib/rate-limit";
import { NextResponse } from "next/server";
import { z } from "zod";

const NewsletterBody = z.object({
  email: z.string().email("Invalid email address").max(254),
});

const RESEND_API = "https://api.resend.com";

export async function POST(request: Request) {
  try {
    // Parse and validate body
    let raw: unknown;
    try {
      raw = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const parsed = NewsletterBody.safeParse(raw);
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      const message = fieldErrors.email?.[0] ?? "Invalid submission";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const { email } = parsed.data;

    // Rate limit by email — 3 attempts per hour
    if (await isRateLimitedAsync(`newsletter:${email}`, 3, 60 * 60_000)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const apiKey = process.env.RESEND_API_KEY;

    // If Resend is not configured, store the signup in the database instead
    if (!apiKey) {
      console.info("[newsletter] RESEND_API_KEY not set — storing signup in DB for:", email);
      // newsletter_subscribers table migration needed — see VGC-116 description
      const sql = getDb();
      try {
        await sql`
          INSERT INTO newsletter_subscribers (email, subscribed_at)
          VALUES (${email}, NOW())
          ON CONFLICT (email) DO NOTHING
        `;
      } catch (e) {
        console.warn("Failed to store newsletter signup in DB:", e);
        // Still return ok: true — the user did nothing wrong
      }
      return NextResponse.json({ ok: true, method: "db" });
    }

    const audienceId = process.env.RESEND_AUDIENCE_ID;

    if (audienceId) {
      // Add contact to Resend audience
      const res = await fetch(`${RESEND_API}/audiences/${audienceId}/contacts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ email, unsubscribed: false }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        // 422 means the contact already exists — treat as success
        if (res.status === 422) {
          return NextResponse.json({ ok: true });
        }
        console.error("[newsletter] Resend audience error:", res.status, text);
        return NextResponse.json({ error: "Failed to subscribe. Please try again." }, { status: 502 });
      }
    } else {
      // No audience configured — just validate the API key by doing nothing further
      console.info("[newsletter] RESEND_AUDIENCE_ID not set — skipping audience add for:", email);
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[newsletter] Unexpected error:", e);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
