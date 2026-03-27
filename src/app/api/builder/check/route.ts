import { NextRequest, NextResponse } from "next/server";

const LINEAR_API_KEY = process.env.LINEAR_API_KEY;
const LINEAR_TEAM_ID = process.env.LINEAR_TEAM_ID || "06531926-0387-4a3e-8325-8b7be754ced5";
const BUILDER_SECRET = process.env.BUILDER_SECRET;

/**
 * GET /api/builder/check?secret=...
 *
 * Proxy for the cloud builder sandbox. Queries Linear for In Progress issues
 * and returns them as JSON so the builder can decide what to work on.
 */
export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");
  if (!BUILDER_SECRET || secret !== BUILDER_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!LINEAR_API_KEY) {
    return NextResponse.json({ error: "LINEAR_API_KEY not configured" }, { status: 500 });
  }

  try {
    const res = await fetch("https://api.linear.app/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: LINEAR_API_KEY,
      },
      body: JSON.stringify({
        query: `{
          team(id: "${LINEAR_TEAM_ID}") {
            issues(
              filter: { state: { name: { eq: "In Progress" } } }
              orderBy: updatedAt
              first: 5
            ) {
              nodes {
                id
                identifier
                title
                description
                labels { nodes { name } }
              }
            }
          }
        }`,
      }),
    });

    const data = await res.json();
    const issues = data?.data?.team?.issues?.nodes ?? [];

    return NextResponse.json({ issues });
  } catch (e) {
    console.error("Builder check error:", e);
    return NextResponse.json({ error: "Failed to query Linear" }, { status: 500 });
  }
}
