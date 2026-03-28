/**
 * Linear API integration for creating and managing issues.
 * Requires LINEAR_API_KEY and LINEAR_TEAM_ID environment variables.
 */

const LINEAR_API = "https://api.linear.app/graphql";

function getConfig() {
  const apiKey = process.env.LINEAR_API_KEY;
  const teamId = process.env.LINEAR_TEAM_ID;
  return { apiKey, teamId, configured: !!(apiKey && teamId) };
}

async function linearQuery(query: string, variables?: Record<string, unknown>) {
  const { apiKey } = getConfig();
  if (!apiKey) throw new Error("LINEAR_API_KEY not set");

  const res = await fetch(LINEAR_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: apiKey,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Linear API error ${res.status}: ${text}`);
  }

  const data = await res.json();
  if (data.errors?.length) {
    throw new Error(`Linear GraphQL error: ${data.errors[0].message}`);
  }

  return data.data;
}

// Map feedback types to Linear label names and priorities (1=urgent, 2=high, 3=normal, 4=low)
const FEEDBACK_TO_LINEAR: Record<string, { label: string; priority: number }> = {
  bug: { label: "Bug", priority: 1 },
  feature: { label: "Feature", priority: 3 },
  improvement: { label: "Improvement", priority: 3 },
  other: { label: "Other", priority: 4 },
};

/**
 * Create a Linear issue from a feedback submission.
 * Returns the issue identifier (e.g., "VGC-42") or null if Linear is not configured.
 */
export async function createLinearIssue(opts: {
  type: string;
  title: string;
  description: string;
  submitterName: string;
  submitterEmail?: string;
  device?: string;
  browser?: string;
  screenSize?: string;
  contact?: string;
}): Promise<{ id: string; identifier: string; url: string } | null> {
  const { configured, teamId } = getConfig();
  if (!configured) {
    console.warn("Linear not configured, skipping issue creation");
    return null;
  }

  const mapping = FEEDBACK_TO_LINEAR[opts.type] ?? FEEDBACK_TO_LINEAR.other;

  // Build rich description with metadata
  const sections: string[] = [
    opts.description,
    "",
    "---",
    `**Submitted by:** ${opts.submitterName}`,
  ];

  if (opts.submitterEmail) sections.push(`**Email:** ${opts.submitterEmail}`);
  if (opts.contact) sections.push(`**Contact:** ${opts.contact}`);
  if (opts.device || opts.browser || opts.screenSize) {
    sections.push("");
    sections.push("**Device Info:**");
    if (opts.device) sections.push(`- Device: ${opts.device}`);
    if (opts.browser) sections.push(`- Browser: ${opts.browser}`);
    if (opts.screenSize) sections.push(`- Screen: ${opts.screenSize}`);
  }

  sections.push("", `*Source: VGC Team Report feedback form*`);

  // Find or create labels (type label + no-claude default)
  const labelIds: string[] = [];
  try {
    const labelsData = await linearQuery(`
      query($teamId: String!) {
        team(id: $teamId) {
          labels { nodes { id name } }
        }
      }
    `, { teamId });

    const allLabels: { id: string; name: string }[] = labelsData.team.labels.nodes;

    // Type label (Bug, Feature, etc.)
    const existingLabel = allLabels.find(
      (l) => l.name.toLowerCase() === mapping.label.toLowerCase()
    );
    if (existingLabel) {
      labelIds.push(existingLabel.id);
    } else {
      const createLabel = await linearQuery(`
        mutation($teamId: String!, $name: String!) {
          issueLabelCreate(input: { teamId: $teamId, name: $name }) {
            issueLabel { id }
          }
        }
      `, { teamId, name: mapping.label });
      labelIds.push(createLabel.issueLabelCreate.issueLabel.id);
    }

    // no-claude label — all new issues get this by default so Claude skips them until manually removed
    const noClaudeLabel = allLabels.find((l) => l.name === "no-claude");
    if (noClaudeLabel) {
      labelIds.push(noClaudeLabel.id);
    }
  } catch {
    // Label creation is non-critical
  }

  // Find the Backlog state (triage entry point) and Community Feedback project
  let stateId: string | undefined;
  let projectId: string | undefined;
  try {
    const teamData = await linearQuery(`
      query($teamId: String!) {
        team(id: $teamId) {
          states { nodes { id name type } }
          projects { nodes { id name } }
        }
      }
    `, { teamId });

    stateId = teamData.team.states.nodes.find(
      (s: { type: string }) => s.type === "backlog"
    )?.id;

    projectId = teamData.team.projects.nodes.find(
      (p: { name: string }) => p.name === "Community Feedback"
    )?.id;
  } catch {
    // Non-critical — issue will use defaults
  }

  // Create the issue in Backlog → Community Feedback project
  const result = await linearQuery(`
    mutation($teamId: String!, $title: String!, $description: String!, $priority: Int!, $labelIds: [String!], $stateId: String, $projectId: String) {
      issueCreate(input: {
        teamId: $teamId
        title: $title
        description: $description
        priority: $priority
        labelIds: $labelIds
        stateId: $stateId
        projectId: $projectId
      }) {
        issue {
          id
          identifier
          url
        }
      }
    }
  `, {
    teamId,
    title: `${opts.title}`,
    description: sections.join("\n"),
    priority: mapping.priority,
    labelIds: labelIds.length > 0 ? labelIds : [],
    stateId: stateId ?? null,
    projectId: projectId ?? null,
  });

  return result.issueCreate.issue;
}

/**
 * Check if Linear is configured.
 */
export function isLinearConfigured(): boolean {
  return getConfig().configured;
}
