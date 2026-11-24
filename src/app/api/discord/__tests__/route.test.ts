import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import nacl from "tweetnacl";

vi.mock("@/lib/db", () => ({ getDb: vi.fn() }));
vi.mock("@/lib/linear", () => ({ linearFetch: vi.fn() }));

import { getDb } from "@/lib/db";
import { linearFetch } from "@/lib/linear";
import { POST } from "../route";

// The route hardcodes Discord's published verification key, so a test cannot
// sign for it. We generate our own key pair and swap it in at the one call to
// nacl.sign.detached.verify; the real Ed25519 check still runs on real signatures.
const ROUTE_PUBLIC_KEY_HEX = "44b2cb02932ad5b5eae681352246314ffb23ecd299c2490d7875d5883e5596ae";
const testKeys = nacl.sign.keyPair.fromSeed(new Uint8Array(32).fill(7));
const otherKeys = nacl.sign.keyPair.fromSeed(new Uint8Array(32).fill(9));
const realVerify = nacl.sign.detached.verify;

const toHex = (b: Uint8Array) => Buffer.from(b).toString("hex");
const TIMESTAMP = "1700000000";

function signedRequest(
  body: unknown,
  opts: { secretKey?: Uint8Array; timestamp?: string; sendBody?: string; signTimestamp?: string } = {},
) {
  const raw = JSON.stringify(body);
  const timestamp = opts.timestamp ?? TIMESTAMP;
  const signed = new TextEncoder().encode((opts.signTimestamp ?? timestamp) + raw);
  const signature = nacl.sign.detached(signed, opts.secretKey ?? testKeys.secretKey);
  return new Request("https://x.test/api/discord", {
    method: "POST",
    headers: { "x-signature-ed25519": toHex(signature), "x-signature-timestamp": timestamp },
    body: opts.sendBody ?? raw,
  }) as never;
}

function command(name: string, options: { name: string; value: string }[], invoker: object) {
  return { type: 2, data: { name, options }, ...invoker };
}

const linearJson = (data: unknown) => new Response(JSON.stringify({ data }));

const TEAM_WITH_ISSUE = {
  team: {
    states: { nodes: [{ id: "state_todo", name: "Todo", type: "unstarted" }, { id: "state_wont", name: "Won't Do", type: "canceled" }] },
    issues: { nodes: [{ id: "issue_uuid", identifier: "VGC-10", title: "Some ticket", state: { name: "Backlog" } }] },
  },
};

let verifySpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  vi.mocked(getDb).mockReset();
  vi.mocked(linearFetch).mockReset();
  vi.stubEnv("DISCORD_ADMIN_USER_IDS", "");
  vi.stubEnv("DISCORD_ADMIN_ROLE_IDS", "");
  vi.stubEnv("LINEAR_TEAM_ID", "team_test");
  verifySpy = vi.spyOn(nacl.sign.detached, "verify").mockImplementation((msg, sig, pk) =>
    realVerify(msg, sig, toHex(pk) === ROUTE_PUBLIC_KEY_HEX ? testKeys.publicKey : pk),
  );
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("POST /api/discord — signature verification", () => {
  it("verifies against the hardcoded Discord public key and answers a signed PING with PONG", async () => {
    const res = await POST(signedRequest({ type: 1 }));
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ type: 1 });
    expect(toHex(verifySpy.mock.calls[0][2] as Uint8Array)).toBe(ROUTE_PUBLIC_KEY_HEX);
  });

  it("returns 401 Missing signature when the signature header is absent", async () => {
    const res = await POST(new Request("https://x.test/api/discord", {
      method: "POST",
      headers: { "x-signature-timestamp": TIMESTAMP },
      body: JSON.stringify({ type: 1 }),
    }) as never);
    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ error: "Missing signature" });
  });

  it("returns 401 Missing signature when the timestamp header is absent", async () => {
    const res = await POST(new Request("https://x.test/api/discord", {
      method: "POST",
      headers: { "x-signature-ed25519": "ab".repeat(64) },
      body: JSON.stringify({ type: 1 }),
    }) as never);
    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ error: "Missing signature" });
  });

  it("returns 401 Invalid signature for a tampered body", async () => {
    const res = await POST(signedRequest({ type: 1 }, { sendBody: JSON.stringify({ type: 2 }) }));
    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ error: "Invalid signature" });
  });

  it("returns 401 Invalid signature when the timestamp header differs from the signed one", async () => {
    const res = await POST(signedRequest({ type: 1 }, { signTimestamp: "1700000001" }));
    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ error: "Invalid signature" });
  });

  it("returns 401 Invalid signature for a body signed with a different key", async () => {
    const res = await POST(signedRequest({ type: 1 }, { secretKey: otherKeys.secretKey }));
    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ error: "Invalid signature" });
  });

  it("throws (500 from the framework) instead of 401 when the signature is not 64 bytes", async () => {
    // Documents current behaviour: nacl throws "bad signature size" and the route does not catch it.
    const req = new Request("https://x.test/api/discord", {
      method: "POST",
      headers: { "x-signature-ed25519": "abcd", "x-signature-timestamp": TIMESTAMP },
      body: JSON.stringify({ type: 1 }),
    }) as never;
    await expect(POST(req)).rejects.toThrow("bad signature size");
  });

  it("answers any non-command interaction type with PONG", async () => {
    const res = await POST(signedRequest({ type: 3 }));
    await expect(res.json()).resolves.toEqual({ type: 1 });
  });
});

describe("POST /api/discord — admin allowlist for approve/reject", () => {
  const NOT_AUTHORIZED = { type: 4, data: { content: "You are not authorized to run this command.", flags: 64 } };

  it("rejects approve when no allowlist is configured (fails closed), without calling Linear", async () => {
    const res = await POST(signedRequest(command("approve", [{ name: "issue", value: "vgc-10" }], { member: { user: { id: "111" }, roles: [] } })));
    await expect(res.json()).resolves.toEqual(NOT_AUTHORIZED);
    expect(linearFetch).not.toHaveBeenCalled();
  });

  it("rejects approve and reject from a user who is not on the allowlist", async () => {
    vi.stubEnv("DISCORD_ADMIN_USER_IDS", "111, 222");
    vi.stubEnv("DISCORD_ADMIN_ROLE_IDS", "role_admin");
    for (const name of ["approve", "reject"]) {
      const res = await POST(signedRequest(command(name, [{ name: "issue", value: "VGC-10" }], { member: { user: { id: "999" }, roles: ["role_other"] } })));
      await expect(res.json()).resolves.toEqual(NOT_AUTHORIZED);
    }
    expect(linearFetch).not.toHaveBeenCalled();
  });

  it("lets an allowlisted user approve: looks up the issue, then moves it to the unstarted state", async () => {
    vi.stubEnv("DISCORD_ADMIN_USER_IDS", "111,222");
    vi.mocked(linearFetch)
      .mockResolvedValueOnce(linearJson(TEAM_WITH_ISSUE))
      .mockResolvedValueOnce(linearJson({ issueUpdate: { issue: { identifier: "VGC-10" } } }));

    const res = await POST(signedRequest(command("approve", [{ name: "issue", value: "vgc-10" }], { member: { user: { id: "222" }, roles: [] } })));
    const json = await res.json();

    expect(json.data.embeds[0].title).toBe("✅ Approved: VGC-10");
    expect(linearFetch).toHaveBeenCalledTimes(2);
    expect(vi.mocked(linearFetch).mock.calls[0][1]).toEqual({ teamId: "team_test", issueNum: 10 });
    expect(vi.mocked(linearFetch).mock.calls[1][0]).toContain("issueUpdate");
    expect(vi.mocked(linearFetch).mock.calls[1][1]).toEqual({ issueId: "issue_uuid", stateId: "state_todo" });
  });

  it("authorizes by role when the user id is not listed", async () => {
    vi.stubEnv("DISCORD_ADMIN_ROLE_IDS", "role_admin");
    vi.mocked(linearFetch)
      .mockResolvedValueOnce(linearJson(TEAM_WITH_ISSUE))
      .mockResolvedValueOnce(linearJson({}));
    const res = await POST(signedRequest(command("approve", [{ name: "issue", value: "VGC-10" }], { member: { user: { id: "999" }, roles: ["role_admin"] } })));
    expect((await res.json()).data.embeds[0].title).toBe("✅ Approved: VGC-10");
  });

  it("lets an allowlisted DM user reject: moves the issue to Won't Do and comments the reason", async () => {
    vi.stubEnv("DISCORD_ADMIN_USER_IDS", "333");
    vi.mocked(linearFetch)
      .mockResolvedValueOnce(linearJson(TEAM_WITH_ISSUE))
      .mockResolvedValueOnce(linearJson({}))
      .mockResolvedValueOnce(linearJson({}));

    const res = await POST(signedRequest(command("reject", [{ name: "issue", value: "VGC-10" }, { name: "reason", value: "dupe" }], { user: { id: "333" } })));
    expect((await res.json()).data.embeds[0].title).toBe("❌ Rejected: VGC-10");
    expect(vi.mocked(linearFetch).mock.calls[1][1]).toEqual({ issueId: "issue_uuid", stateId: "state_wont" });
    expect(vi.mocked(linearFetch).mock.calls[2][1]).toEqual({ issueId: "issue_uuid", body: "Rejected via Discord: dupe" });
  });

  it("lets anyone run a read-only command (summary queries the feedback table)", async () => {
    const sql = vi.fn(async (strings: TemplateStringsArray) =>
      strings.join("").includes("status = 'new'") ? [{ c: 2 }] : [{ total: 5, bugs: 1, features: 3, improvements: 1 }],
    );
    vi.mocked(getDb).mockReturnValue(sql as never);

    const res = await POST(signedRequest(command("summary", [], { member: { user: { id: "999" }, roles: [] } })));
    const json = await res.json();
    expect(json.data.embeds[0].description).toContain("**This week:** 5 new submissions");
    expect(sql).toHaveBeenCalledTimes(2);
  });
});
