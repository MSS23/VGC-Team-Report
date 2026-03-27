import { NextResponse } from "next/server";

/**
 * POST /api/webhooks/linear
 *
 * Receives Linear webhook events. When an issue moves to "In Progress",
 * triggers the GitHub Actions linear-builder workflow via repository_dispatch.
 */

const IN_PROGRESS_STATE_ID = "0cbef347-0afb-4fa1-8dc2-79e9e04d1abe";
const GITHUB_REPO = "MSS23/VGC-Team-Report";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Linear sends a verification request on webhook creation
    if (body.type === "url_verification") {
      return NextResponse.json({ challenge: body.challenge });
    }

    // Only handle issue updates
    if (body.action !== "update" || body.type !== "Issue") {
      return NextResponse.json({ ok: true });
    }

    const issue = body.data;
    const stateId = issue?.stateId ?? issue?.state?.id;

    // Only trigger when moved TO "In Progress"
    if (stateId !== IN_PROGRESS_STATE_ID) {
      return NextResponse.json({ ok: true, skipped: "not in-progress" });
    }

    // Check that it was actually moved (not just edited while in-progress)
    const previousStateId = body.updatedFrom?.stateId;
    if (previousStateId === IN_PROGRESS_STATE_ID) {
      return NextResponse.json({ ok: true, skipped: "already in-progress" });
    }

    // Trigger GitHub Actions workflow via repository_dispatch
    const ghToken = process.env.GH_DISPATCH_TOKEN;
    if (!ghToken) {
      console.warn("GH_DISPATCH_TOKEN not set, skipping workflow trigger");
      return NextResponse.json({ ok: true, skipped: "no github token" });
    }

    const dispatchRes = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/dispatches`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${ghToken}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
        body: JSON.stringify({
          event_type: "linear-builder",
          client_payload: {
            issue_id: issue.id,
            issue_identifier: issue.identifier,
            issue_title: issue.title,
            issue_description: issue.description ?? "",
          },
        }),
      },
    );

    if (!dispatchRes.ok) {
      const text = await dispatchRes.text();
      console.error(`GitHub dispatch failed for ${issue.identifier}: ${dispatchRes.status} ${text}`);
      return NextResponse.json({ error: "GitHub dispatch failed", status: dispatchRes.status }, { status: 502 });
    }

    console.log(`GitHub Actions triggered for ${issue.identifier}: ${issue.title}`);

    return NextResponse.json({
      ok: true,
      triggered: true,
      issue: issue.identifier,
      title: issue.title,
    });
  } catch (e) {
    console.error("Linear webhook error:", e);
    return NextResponse.json({ error: "Webhook failed" }, { status: 500 });
  }
}
