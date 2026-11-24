/**
 * Linear API integration for creating and managing issues.
 * Requires LINEAR_API_KEY and LINEAR_TEAM_ID environment variables.
 */

import { fetchWithTimeout } from "@/lib/fetch-with-timeout";

const LINEAR_API = "https://api.linear.app/graphql";

/** Team label IDs used by the PostHog → Linear sync (cron and webhook). */
export const LINEAR_LABEL_IDS = {
  bug: "bbd03f4e-be6f-4617-ad7d-b9fdc596ce5c",
  improvement: "06d28974-98c3-457a-bbab-ab85456e51f0",
  webApp: "1f355942-6143-47a8-93be-4a5cbe0de0b0",
  mobile: "5389312c-66f8-4ced-a840-ff3cd46b68aa",
  analytics: "a13703f8-0865-4a6d-b74c-56a7abc2f563",
  infrastructure: "a0e2ddf6-557d-4164-b049-a4ee36ee342f",
} as const;

function getConfig() {
  const apiKey = process.env.LINEAR_API_KEY;
  const teamId = process.env.LINEAR_TEAM_ID;
  return { apiKey, teamId, configured: !!(apiKey && teamId) };
}

/**
 * POST one GraphQL request to Linear and return the raw Response. No status
 * or GraphQL-error checks: callers keep their own handling. Sends whatever
 * LINEAR_API_KEY holds (empty string if unset), so check it first if needed.
 * Without `timeoutMs` there is no timeout.
 */
export function linearFetch(
  query: string,
  variables?: Record<string, unknown>,
  timeoutMs?: number,
): Promise<Response> {
  const init: RequestInit = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: process.env.LINEAR_API_KEY ?? "",
    },
    body: JSON.stringify({ query, variables }),
  };
  return timeoutMs === undefined ? fetch(LINEAR_API, init) : fetchWithTimeout(LINEAR_API, init, timeoutMs);
}

async function linearQuery(query: string, variables?: Record<string, unknown>) {
  const { apiKey } = getConfig();
  if (!apiKey) throw new Error("LINEAR_API_KEY not set");

  const res = await linearFetch(query, variables);

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

// Map feedback types to Linear label names and base priorities (1=urgent, 2=high, 3=normal, 4=low)
const FEEDBACK_TO_LINEAR: Record<string, { label: string; priority: number }> = {
  bug: { label: "Bug", priority: 1 },
  feature: { label: "Feature", priority: 3 },
  improvement: { label: "Improvement", priority: 3 },
  other: { label: "Other", priority: 4 },
};

// Keywords that escalate priority (lower number = higher priority)
const ESCALATION_KEYWORDS = [
  "crash", "broken", "can't", "cannot", "error", "fail", "stuck",
  "data loss", "lost my", "deleted", "wrong", "security", "login",
];
const HIGH_VALUE_KEYWORDS = [
  "team builder", "pdf", "export", "share", "mobile", "tournament",
  "payment", "pro", "subscribe",
];

/**
 * Auto-triage: adjust priority based on content keywords.
 * Bugs with crash/error keywords get bumped to urgent.
 * Features mentioning high-value areas get bumped to high.
 */
function triagePriority(type: string, title: string, description: string): number {
  const basePriority = FEEDBACK_TO_LINEAR[type]?.priority ?? 4;
  const text = `${title} ${description}`.toLowerCase();

  // Bugs with escalation keywords -> urgent (1)
  if (type === "bug" && ESCALATION_KEYWORDS.some((kw) => text.includes(kw))) {
    return 1;
  }

  // Features/improvements mentioning high-value areas -> high (2)
  if ((type === "feature" || type === "improvement") && HIGH_VALUE_KEYWORDS.some((kw) => text.includes(kw))) {
    return 2;
  }

  return basePriority;
}

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
  const priority = triagePriority(opts.type, opts.title, opts.description);

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

    // no-claude label — non-bug issues get this by default so Claude skips them until manually removed
    // Bugs are NEVER tagged no-claude — they should be fixed immediately
    if (opts.type !== "bug") {
      const noClaudeLabel = allLabels.find((l) => l.name === "no-claude");
      if (noClaudeLabel) {
        labelIds.push(noClaudeLabel.id);
      }
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
    priority,
    labelIds: labelIds.length > 0 ? labelIds : [],
    stateId: stateId ?? null,
    projectId: projectId ?? null,
  });

  return result.issueCreate.issue;
}

