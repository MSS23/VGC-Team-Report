import { getDb } from "@/lib/db";
import { isRateLimited } from "@/lib/rate-limit";
import { NextResponse } from "next/server";
import { z } from "zod";

const FeedbackBody = z.object({
  type: z.enum(["feature", "bug", "improvement", "other"]),
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(2000),
  device: z.string().max(100).optional(),
  browser: z.string().max(100).optional(),
  screenSize: z.string().max(50).optional(),
  contact: z.string().max(200).optional(),
  sessionId: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    if (isRateLimited(`feedback:${ip}`, 3, 60_000)) {
      return NextResponse.json({ error: "Too many submissions. Please wait a minute." }, { status: 429 });
    }

    const raw = await request.json();
    const parsed = FeedbackBody.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid submission", details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const { type, title, description, device, browser, screenSize, contact, sessionId } = parsed.data;
    const sql = getDb();

    await sql`
      INSERT INTO feedback (type, title, description, device, browser, screen_size, contact, session_id)
      VALUES (${type}, ${title}, ${description}, ${device ?? null}, ${browser ?? null}, ${screenSize ?? null}, ${contact ?? null}, ${sessionId ?? null})
    `;

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Feedback error:", e);
    return NextResponse.json({ error: "Failed to submit" }, { status: 500 });
  }
}
