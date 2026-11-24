import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/discord-webhook", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/discord-webhook")>()),
  postToBuildsChannel: vi.fn(async () => {}),
}));

import { COLORS, postToBuildsChannel } from "@/lib/discord-webhook";
import { LINEAR_LABEL_IDS } from "@/lib/linear";
import { GET } from "../route";

const CRON = "cron-secret-for-tests";
const NOW = new Date("2026-11-24T08:00:00.000Z");
const fetchMock = vi.fn();
const linearBodies: { query: string; variables: Record<string, unknown> }[] = [];

const group = (fingerprint: string, description: string, occurrences: number, users = 1) => ({
  fingerprint, description, occurrences, users, status: "active", assignee: null,
  first_seen: "2026-11-20", last_seen: "2026-11-23", sessions: 1, volume: null,
});

function routeFetch(posthog: Response | (() => Response), tracked: { title: string; description: string }[] = []) {
  fetchMock.mockImplementation(async (url: string, init: RequestInit) => {
    if (url === "https://api.linear.app/graphql") {
      const body = JSON.parse(String(init.body));
      linearBodies.push(body);
      if (body.query.includes("issueCreate")) {
        return Response.json({ data: { issueCreate: { success: true, issue: { identifier: "VGC-50", url: "https://linear.test/VGC-50" } } } });
      }
      return Response.json({ data: { team: { issues: { nodes: tracked } } } });
    }
    if (url.startsWith("https://eu.posthog.com/")) return typeof posthog === "function" ? posthog() : posthog;
    throw new Error(`unexpected fetch ${url}`);
  });
}

const req = (auth?: string) =>
  new Request("https://x.test/api/cron/posthog-errors", { headers: auth ? { authorization: auth } : {} });

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(NOW);
  vi.mocked(postToBuildsChannel).mockClear();
  fetchMock.mockReset();
  linearBodies.length = 0;
  vi.stubGlobal("fetch", fetchMock);
  vi.stubEnv("CRON_SECRET", CRON);
  vi.stubEnv("POSTHOG_PERSONAL_API_KEY", "posthog-personal-key-for-tests");
  vi.stubEnv("POSTHOG_API_KEY", undefined);
  vi.stubEnv("POSTHOG_PROJECT_ID", "4242");
  vi.stubEnv("NEXT_PUBLIC_POSTHOG_HOST", undefined);
  vi.stubEnv("LINEAR_API_KEY", "linear-key-for-tests");
  vi.stubEnv("LINEAR_TEAM_ID", "team_test");
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("GET /api/cron/posthog-errors — auth", () => {
  it.each([["no header", undefined], ["wrong secret", "Bearer nope"]])("returns 401 with %s and does no work", async (_l, auth) => {
    const res = await GET(req(auth));
    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ error: "Unauthorized" });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(postToBuildsChannel).not.toHaveBeenCalled();
  });

  it("returns 401 when CRON_SECRET is unset", async () => {
    vi.stubEnv("CRON_SECRET", undefined);
    expect((await GET(req(`Bearer ${CRON}`))).status).toBe(401);
  });
});

describe("GET /api/cron/posthog-errors — authorised run", () => {
  const auth = `Bearer ${CRON}`;

  it.each([
    ["POSTHOG_PERSONAL_API_KEY", "POSTHOG_PERSONAL_API_KEY"],
    ["POSTHOG_PROJECT_ID", "POSTHOG_PROJECT_ID"],
  ])("skips with 200 when %s is missing", async (envVar, missing) => {
    vi.stubEnv(envVar, undefined);
    const res = await GET(req(auth));
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: true, skipped: true, reason: `${missing} is not configured` });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("creates a Linear ticket only for untracked error groups and posts the digest", async () => {
    routeFetch(
      Response.json({ results: [group("fp-old", "Old error", 5), group("fp-new", "TypeError: x is undefined", 60)] }),
      [{ title: "[PostHog] something else", description: "| **Fingerprint** | `fp-old` |" }],
    );

    const res = await GET(req(auth));
    await expect(res.json()).resolves.toEqual({ ok: true, errorGroups: 2, created: 1, skipped: 1 });

    const posthogCall = fetchMock.mock.calls.find(([u]) => u.startsWith("https://eu.posthog.com/"));
    const url = new URL(posthogCall![0]);
    expect(url.pathname).toBe("/api/projects/4242/error_tracking/");
    expect(url.searchParams.get("status")).toBe("active");
    expect(url.searchParams.get("date_from")).toBe("2026-11-17T08:00:00.000Z");
    expect(posthogCall![1].headers.Authorization).toBe("Bearer posthog-personal-key-for-tests");

    const creates = linearBodies.filter((b) => b.query.includes("issueCreate"));
    expect(creates).toHaveLength(1);
    expect(creates[0].variables).toMatchObject({
      teamId: "team_test",
      title: "[PostHog] TypeError: x is undefined",
      priority: 2,
      labelIds: [LINEAR_LABEL_IDS.bug, LINEAR_LABEL_IDS.analytics, LINEAR_LABEL_IDS.webApp],
    });

    expect(postToBuildsChannel).toHaveBeenCalledTimes(1);
    const embed = vi.mocked(postToBuildsChannel).mock.calls[0][0];
    expect(embed.color).toBe(COLORS.warning);
    expect(embed.description).toContain("**Total Occurrences:** 65");
  });

  it("returns 500 and posts a failure embed when PostHog errors", async () => {
    routeFetch(() => new Response("oops", { status: 503 }));

    const res = await GET(req(auth));

    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: "PostHog API 503: oops" });
    expect(linearBodies.some((b) => b.query.includes("issueCreate"))).toBe(false);
    expect(vi.mocked(postToBuildsChannel).mock.calls[0][0]).toMatchObject({ title: "PostHog Error Sync — Failed", color: COLORS.error });
  });
});
