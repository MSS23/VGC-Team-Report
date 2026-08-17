/**
 * Linear API integration for creating and managing issues.
 * Requires LINEAR_API_KEY and LINEAR_TEAM_ID environment variables.
 */

import { fetchWithTimeout } from "@/lib/fetch-with-timeout";

const LINEAR_API = "https://api.linear.app/graphql";

function getConfig() {
  const apiKey = process.env.LINEAR_API_KEY;
  const teamId = process.env.LINEAR_TEAM_ID;
  return { apiKey, teamId, configured: !!(apiKey && teamId) };
}

/** A GraphQL response envelope from the Linear API. */
export interface LinearGraphQLResponse<T> {
  data?: T;
  errors?: Array<{ message: string }>;
}

/**
 * The single Linear GraphQL client for the whole app (VGC-273).
 *
 * `src/app/api/discord/route.ts` used to carry a second, near-identical copy of
 * this function; both returned `any`. This is now the only implementation and
 * it is generic over the caller's expected `data` shape, so the 11 call sites
 * type-check their own selection sets instead of dotting through `any`.
 *
 * Returns the raw envelope so callers that treat a GraphQL-level error as a
 * miss rather than a failure (e.g. the Discord `/status` command, which probes
 * by issue id and falls back to a search) can inspect `errors` themselves.
 * Prefer `linearQuery` unless you need that.
 *
 * The 10s timeout matters: these run inside serverless handlers, and an
 * un-aborted fetch to a hung Linear would burn the whole function budget.
 */
export async function linearRequest<T>(
  query: string,
  variables?: Record<string, unknown>,
  timeoutMs = 10_000,
): Promise<LinearGraphQLResponse<T>> {
  const { apiKey } = getConfig();
  if (!apiKey) throw new Error("LINEAR_API_KEY not set");

  const res = await fetchWithTimeout(
    LINEAR_API,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: apiKey,
      },
      body: JSON.stringify({ query, ...(variables ? { variables } : {}) }),
    },
    timeoutMs,
  );

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Linear API error ${res.status}: ${text}`);
  }

  return (await res.json()) as LinearGraphQLResponse<T>;
}

/**
 * `linearRequest` + unwrap: throws on any GraphQL error, otherwise returns the
 * `data` payload typed as `T`.
 */
export async function linearQuery<T>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const body = await linearRequest<T>(query, variables);

  if (body.errors?.length) {
    throw new Error(`Linear GraphQL error: ${body.errors[0].message}`);
  }
  if (!body.data) {
    throw new Error("Linear GraphQL response contained no data");
  }

  return body.data;
}

// ── Selection-set shapes for the queries issued below ────────────────────────

/** A Linear workflow state (Backlog / Todo / In Progress / …). */
export interface LinearStateNode {
  id: string;
  name: string;
  type: string;
}

/** A minimally-selected issue: enough to identify and link to it. */
export interface LinearIssueRef {
  id: string;
  identifier: string;
  url: string;
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
    const labelsData = await linearQuery<{
      team: { labels: { nodes: { id: string; name: string }[] } };
    }>(`
      query($teamId: String!) {
        team(id: $teamId) {
          labels { nodes { id name } }
        }
      }
    `, { teamId });

    const allLabels = labelsData.team.labels.nodes;

    // Type label (Bug, Feature, etc.)
    const existingLabel = allLabels.find(
      (l) => l.name.toLowerCase() === mapping.label.toLowerCase()
    );
    if (existingLabel) {
      labelIds.push(existingLabel.id);
    } else {
      const createLabel = await linearQuery<{
        issueLabelCreate: { issueLabel: { id: string } };
      }>(`
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
    const teamData = await linearQuery<{
      team: {
        states: { nodes: LinearStateNode[] };
        projects: { nodes: { id: string; name: string }[] };
      };
    }>(`
      query($teamId: String!) {
        team(id: $teamId) {
          states { nodes { id name type } }
          projects { nodes { id name } }
        }
      }
    `, { teamId });

    stateId = teamData.team.states.nodes.find((s) => s.type === "backlog")?.id;

    projectId = teamData.team.projects.nodes.find(
      (p) => p.name === "Community Feedback"
    )?.id;
  } catch {
    // Non-critical — issue will use defaults
  }

  // Create the issue in Backlog → Community Feedback project
  const result = await linearQuery<{
    issueCreate: { issue: LinearIssueRef };
  }>(`
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

