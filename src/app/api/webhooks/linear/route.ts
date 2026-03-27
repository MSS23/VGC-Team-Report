import { NextResponse } from "next/server";

/**
 * POST /api/webhooks/linear
 *
 * Receives Linear webhook events. When an issue moves to "In Progress",
 * pokes the Claude Code remote trigger to start implementation.
 *
 * Linear webhook payload shape:
 * {
 *   action: "update",
 *   type: "Issue",
 *   data: { id, identifier, title, state: { name, type } },
 *   updatedFrom: { stateId: "..." }
 * }
 */

const IN_PROGRESS_STATE_ID = "0cbef347-0afb-4fa1-8dc2-79e9e04d1abe";
const CLAUDE_TRIGGER_ID = "trig_014XtCU4RkWvtTJvkXo4Wicj";

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

    // Poke the Claude Code trigger with issue context
    const pokeToken = process.env.CLAUDE_TRIGGER_POKE_TOKEN;
    if (!pokeToken) {
      console.warn("CLAUDE_TRIGGER_POKE_TOKEN not set, skipping trigger poke");
      return NextResponse.json({ ok: true, skipped: "no poke token" });
    }

    const pokeRes = await fetch(
      `https://api.claude.ai/v1/code/triggers/${CLAUDE_TRIGGER_ID}/run`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${pokeToken}`,
        },
        body: JSON.stringify({
          env: {
            LINEAR_ISSUE_ID: issue.id,
            LINEAR_ISSUE_IDENTIFIER: issue.identifier,
            LINEAR_ISSUE_TITLE: issue.title,
          },
        }),
      },
    );

    const result = await pokeRes.text();
    console.log(`Claude trigger poked for ${issue.identifier}: ${pokeRes.status} ${result}`);

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
