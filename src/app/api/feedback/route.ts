import { getDb } from "@/lib/db";
import { isRateLimited } from "@/lib/rate-limit";
import { NextResponse } from "next/server";
import { z } from "zod";

const DISCORD_WEBHOOK = process.env.DISCORD_FEEDBACK_WEBHOOK || "";

const TYPE_EMOJI: Record<string, string> = {
  feature: "\uD83D\uDCA1",
  bug: "\uD83D\uDC1B",
  improvement: "\u26A1",
  other: "\uD83D\uDCAC",
};

const TYPE_COLOR: Record<string, number> = {
  feature: 0x10b981,  // emerald
  bug: 0xef4444,      // red
  improvement: 0xf59e0b, // amber
  other: 0x3b82f6,    // blue
};

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

async function sendDiscordNotification(data: z.infer<typeof FeedbackBody>) {
  if (!DISCORD_WEBHOOK) return;
  try {
    const fields = [
      { name: "Description", value: data.description.slice(0, 1024), inline: false },
    ];
    if (data.device || data.browser || data.screenSize) {
      fields.push({
        name: "Device Info",
        value: [
          data.device && `Device: ${data.device}`,
          data.browser && `Browser: ${data.browser}`,
          data.screenSize && `Screen: ${data.screenSize}`,
        ].filter(Boolean).join("\n"),
        inline: false,
      });
    }
    if (data.contact) {
      fields.push({ name: "Contact", value: data.contact, inline: false });
    }

    await fetch(DISCORD_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        embeds: [{
          title: `${TYPE_EMOJI[data.type] ?? ""} ${data.type.charAt(0).toUpperCase() + data.type.slice(1)}: ${data.title}`,
          color: TYPE_COLOR[data.type] ?? 0x6366f1,
          fields,
          footer: { text: "VGC Team Report Feedback" },
          timestamp: new Date().toISOString(),
        }],
      }),
    });
  } catch (e) {
    console.warn("Discord webhook failed:", e);
  }
}

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

    // Save to database
    await sql`
      INSERT INTO feedback (type, title, description, device, browser, screen_size, contact, session_id)
      VALUES (${type}, ${title}, ${description}, ${device ?? null}, ${browser ?? null}, ${screenSize ?? null}, ${contact ?? null}, ${sessionId ?? null})
    `;

    // Send Discord notification (fire-and-forget)
    sendDiscordNotification(parsed.data);

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Feedback error:", e);
    return NextResponse.json({ error: "Failed to submit" }, { status: 500 });
  }
}
