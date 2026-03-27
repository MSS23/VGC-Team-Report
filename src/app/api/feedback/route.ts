import { getDb } from "@/lib/db";
import { isRateLimited } from "@/lib/rate-limit";
import { escapeHtml } from "@/lib/utils/sanitize";
import { containsBlockedWords } from "@/lib/utils/word-filter";
import { createLinearIssue } from "@/lib/linear";
import { postFeedbackEmbed } from "@/lib/discord-bot";
import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const TYPE_EMOJI: Record<string, string> = {
  feature: "\uD83D\uDCA1",
  bug: "\uD83D\uDC1B",
  improvement: "\u26A1",
  other: "\uD83D\uDCAC",
};

const TYPE_COLOR: Record<string, number> = {
  feature: 0x10b981,
  bug: 0xef4444,
  improvement: 0xf59e0b,
  other: 0x3b82f6,
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

async function sendDiscordNotification(data: z.infer<typeof FeedbackBody>, submitterName: string, linearUrl?: string) {
  const webhookUrl = process.env.DISCORD_FEEDBACK_WEBHOOK;
  if (!webhookUrl) return;

  const fields = [
    { name: "Description", value: data.description.slice(0, 1024), inline: false },
    { name: "Submitted by", value: submitterName, inline: true },
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
    fields.push({ name: "Contact", value: data.contact, inline: true });
  }
  if (linearUrl) {
    fields.push({ name: "Linear", value: `[View issue](${linearUrl})`, inline: true });
  }

  await fetch(webhookUrl, {
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
  }).catch((e) => console.error("Discord webhook error:", e));
}

export async function POST(request: Request) {
  try {
    // Require authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Sign in to submit feedback" }, { status: 401 });
    }

    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    if (isRateLimited(`feedback:${userId}`, 3, 60_000)) {
      return NextResponse.json({ error: "Too many submissions. Please wait a minute." }, { status: 429 });
    }

    const raw = await request.json();
    const parsed = FeedbackBody.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid submission", details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const { type, title: rawTitle, description: rawDescription, device, browser, screenSize, contact, sessionId } = parsed.data;

    const title = escapeHtml(rawTitle);
    const description = escapeHtml(rawDescription);

    if (containsBlockedWords(rawTitle) || containsBlockedWords(rawDescription)) {
      return NextResponse.json({ error: "Submission contains inappropriate language" }, { status: 400 });
    }

    // Get the user's real name from Clerk
    const user = await currentUser();
    const submitterName = user?.firstName
      ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ""}`
      : user?.username ?? "Unknown User";
    const submitterEmail = user?.emailAddresses?.[0]?.emailAddress ?? undefined;

    const sql = getDb();

    // Save to database with user info
    await sql`
      INSERT INTO feedback (type, title, description, device, browser, screen_size, contact, session_id, submitter_id, submitter_name)
      VALUES (${type}, ${title}, ${description}, ${device ?? null}, ${browser ?? null}, ${screenSize ?? null}, ${contact ?? null}, ${sessionId ?? null}, ${userId}, ${submitterName})
    `;

    // Create Linear issue (fire-and-forget, non-blocking)
    let linearUrl: string | undefined;
    try {
      const issue = await createLinearIssue({
        type,
        title: rawTitle,
        description: rawDescription,
        submitterName,
        submitterEmail,
        device,
        browser,
        screenSize,
        contact,
      });
      if (issue) linearUrl = issue.url;
    } catch (e) {
      console.error("Linear issue creation failed:", e);
    }

    // Send Discord webhook (legacy) + bot embed with thread
    let linearIdentifier: string | undefined;
    if (linearUrl) {
      const match = linearUrl.match(/\/issue\/(VGC-\d+)/);
      if (match) linearIdentifier = match[1];
    }

    try {
      await sendDiscordNotification(parsed.data, submitterName, linearUrl);
    } catch (e) {
      console.error("Discord webhook failed:", e);
    }

    try {
      await postFeedbackEmbed({
        type,
        title: rawTitle,
        description: rawDescription,
        submitterName,
        contact,
        device,
        browser,
        screenSize,
        linearUrl,
        linearIdentifier,
      });
    } catch (e) {
      console.error("Discord bot embed failed:", e);
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Feedback error:", e);
    return NextResponse.json({ error: "Failed to submit" }, { status: 500 });
  }
}
