import { isCronAuthorized } from "@/lib/cron-auth";
import { postToBuildsChannel, COLORS } from "@/lib/discord-webhook";
import { NextResponse } from "next/server";

const LINEAR_API = "https://api.linear.app/graphql";

async function linearQuery(query: string) {
  const apiKey = process.env.LINEAR_API_KEY;
  if (!apiKey) throw new Error("LINEAR_API_KEY not set");

  const res = await fetch(LINEAR_API, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: apiKey },
    body: JSON.stringify({ query }),
  });

  const data = await res.json();
  return data.data;
}

export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const teamId = process.env.LINEAR_TEAM_ID;
  if (!teamId) {
    return NextResponse.json({ error: "LINEAR_TEAM_ID not set" }, { status: 500 });
  }

  try {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    // Get issues completed this week
    const doneData = await linearQuery(`{
      team(id: "${teamId}") {
        issues(filter: {
          state: { type: { eq: "completed" } }
          completedAt: { gte: "${oneWeekAgo}" }
        }, first: 50) {
          nodes { identifier title completedAt }
        }
      }
    }`);

    // Get issues currently in progress
    const inProgressData = await linearQuery(`{
      team(id: "${teamId}") {
        issues(filter: { state: { name: { eq: "In Progress" } } }, first: 50) {
          nodes { identifier title }
        }
      }
    }`);

    // Get issues in review
    const inReviewData = await linearQuery(`{
      team(id: "${teamId}") {
        issues(filter: { state: { name: { eq: "In Review" } } }, first: 50) {
          nodes { identifier title }
        }
      }
    }`);

    const completed = doneData.team.issues.nodes;
    const inProgress = inProgressData.team.issues.nodes;
    const inReview = inReviewData.team.issues.nodes;

    const completedList = completed.length > 0
      ? completed.map((i: { identifier: string; title: string }) => `- **${i.identifier}**: ${i.title}`).join("\n")
      : "None this week";

    const inProgressList = inProgress.length > 0
      ? inProgress.map((i: { identifier: string; title: string }) => `- **${i.identifier}**: ${i.title}`).join("\n")
      : "Nothing in progress";

    const inReviewList = inReview.length > 0
      ? inReview.map((i: { identifier: string; title: string }) => `- **${i.identifier}**: ${i.title}`).join("\n")
      : "Nothing in review";

    const weekStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
    const weekEnd = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short" });

    await postToBuildsChannel({
      title: `Weekly Digest (${weekStart} - ${weekEnd})`,
      description: [
        `**Completed (${completed.length}):**`,
        completedList,
        "",
        `**In Review (${inReview.length}):**`,
        inReviewList,
        "",
        `**In Progress (${inProgress.length}):**`,
        inProgressList,
      ].join("\n"),
      color: completed.length > 0 ? COLORS.success : COLORS.neutral,
      footer: { text: "VGC Weekly Digest" },
    });

    return NextResponse.json({
      ok: true,
      completed: completed.length,
      inProgress: inProgress.length,
      inReview: inReview.length,
    });
  } catch (e) {
    console.error("Weekly digest failed:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
