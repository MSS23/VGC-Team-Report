import { NextRequest, NextResponse } from "next/server";

const LINEAR_API_KEY = process.env.LINEAR_API_KEY;
const BUILDER_SECRET = process.env.BUILDER_SECRET;

/** Known Linear state IDs for this workspace */
const STATES: Record<string, string> = {
  "in-review": "89e58e68-05e3-4dc9-a0e8-20344f1b1a00",
  "in-progress": "0cbef347-0afb-4fa1-8dc2-79e9e04d1abe",
};

/**
 * GET /api/builder/update-status?secret=...&issueId=...&state=in-review
 *
 * Proxy for the cloud builder sandbox. Updates a Linear issue's workflow state.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const secret = params.get("secret");
  if (!BUILDER_SECRET || secret !== BUILDER_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!LINEAR_API_KEY) {
    return NextResponse.json({ error: "LINEAR_API_KEY not configured" }, { status: 500 });
  }

  const issueId = params.get("issueId");
  const state = params.get("state") ?? "in-review";
  const stateId = STATES[state];

  if (!issueId) {
    return NextResponse.json({ error: "Missing issueId parameter" }, { status: 400 });
  }
  if (!stateId) {
    return NextResponse.json({ error: `Unknown state: ${state}. Valid: ${Object.keys(STATES).join(", ")}` }, { status: 400 });
  }

  try {
    const res = await fetch("https://api.linear.app/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: LINEAR_API_KEY,
      },
      body: JSON.stringify({
        query: `mutation { issueUpdate(id: "${issueId}", input: { stateId: "${stateId}" }) { success } }`,
      }),
    });

    const data = await res.json();
    const success = data?.data?.issueUpdate?.success ?? false;

    return NextResponse.json({ ok: true, success, state });
  } catch (e) {
    console.error("Builder update-status error:", e);
    return NextResponse.json({ error: "Failed to update Linear issue" }, { status: 500 });
  }
}
