import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const LINEAR_API = "https://api.linear.app/graphql";

const QuickAddBody = z.object({
  type: z.enum(["feature", "bug", "improvement", "other"]),
  priority: z.number().min(1).max(4),
  project: z.string(),
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
});

const TYPE_TO_LABEL: Record<string, string> = {
  feature: "Feature",
  bug: "Bug",
  improvement: "Improvement",
  other: "Other",
};

async function linearQuery(query: string, variables?: Record<string, unknown>) {
  const apiKey = process.env.LINEAR_API_KEY;
  if (!apiKey) throw new Error("LINEAR_API_KEY not set");

  const res = await fetch(LINEAR_API, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: apiKey },
    body: JSON.stringify({ query, variables }),
  });

  const data = await res.json();
  if (data.errors?.length) throw new Error(data.errors[0].message);
  return data.data;
}

export async function POST(request: Request) {
  // Auth required
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const raw = await request.json();
  const parsed = QuickAddBody.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { type, priority, project, title, description } = parsed.data;
  const teamId = process.env.LINEAR_TEAM_ID;
  if (!teamId) {
    return NextResponse.json({ error: "LINEAR_TEAM_ID not set" }, { status: 500 });
  }

  try {
    // Get team data: labels, states, projects
    const teamData = await linearQuery(`
      query($teamId: String!) {
        team(id: $teamId) {
          labels { nodes { id name } }
          states { nodes { id type } }
          projects { nodes { id name } }
        }
      }
    `, { teamId });

    // Find label
    const labels = teamData.team.labels.nodes;
    const labelName = TYPE_TO_LABEL[type] ?? "Other";
    const label = labels.find((l: { name: string }) => l.name.toLowerCase() === labelName.toLowerCase());
    const labelIds = label ? [label.id] : [];

    // Find backlog state
    const states = teamData.team.states.nodes;
    const backlogState = states.find((s: { type: string }) => s.type === "backlog");

    // Find project
    const projects = teamData.team.projects.nodes;
    const targetProject = projects.find((p: { name: string }) => p.name === project);

    // Create issue
    const result = await linearQuery(`
      mutation($teamId: String!, $title: String!, $description: String, $priority: Int!, $labelIds: [String!], $stateId: String, $projectId: String) {
        issueCreate(input: {
          teamId: $teamId
          title: $title
          description: $description
          priority: $priority
          labelIds: $labelIds
          stateId: $stateId
          projectId: $projectId
        }) {
          issue { identifier url }
        }
      }
    `, {
      teamId,
      title,
      description: description || null,
      priority,
      labelIds,
      stateId: backlogState?.id ?? null,
      projectId: targetProject?.id ?? null,
    });

    const issue = result.issueCreate.issue;

    // Fire Discord notification
    const webhook = process.env.DISCORD_BUILDS_WEBHOOK;
    if (webhook) {
      await fetch(webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          embeds: [{
            title: `New ${labelName}: ${issue.identifier}`,
            description: `**${title}**${description ? `\n${description.slice(0, 200)}` : ""}\n\n[Open in Linear](${issue.url})`,
            color: type === "bug" ? 0xed4245 : type === "feature" ? 0x57f287 : 0x5865f2,
            footer: { text: "Quick Add" },
          }],
        }),
      }).catch(() => { /* non-blocking */ });
    }

    return NextResponse.json({ identifier: issue.identifier, url: issue.url });
  } catch (e) {
    console.error("Quick-add failed:", e);
    return NextResponse.json({ error: "Failed to create issue" }, { status: 500 });
  }
}
