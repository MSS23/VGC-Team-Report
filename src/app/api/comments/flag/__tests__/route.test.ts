import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@clerk/nextjs/server", () => ({ auth: vi.fn() }));
vi.mock("@/lib/security/api-guard", () => ({ apiGuard: vi.fn(async () => null) }));
vi.mock("@/lib/security/input-validation", () => ({ getClientIp: vi.fn(() => "2001:db8::1") }));
vi.mock("@/lib/posthog-server", () => ({ captureServerEvent: vi.fn() }));
vi.mock("@/lib/db", () => ({ getDb: vi.fn() }));

import { auth } from "@clerk/nextjs/server";
import { getDb } from "@/lib/db";
import { POST } from "@/app/api/comments/flag/route";

/**
 * `sql` stand-in. The comment-exists check returns one row; the count query
 * returns the supplied total/authenticated tallies. Every query is recorded so a
 * test can assert whether the hard DELETE was issued.
 */
function makeSql(counts: { total: number; authenticated: number }) {
  const calls: string[] = [];
  const sql = ((strings: TemplateStringsArray) => {
    const q = strings.join(" ? ");
    calls.push(q);
    if (/FROM comments c/.test(q)) return Promise.resolve([{ id: 1 }]);
    if (/FROM comment_flags WHERE comment_id/.test(q)) return Promise.resolve([counts]);
    return Promise.resolve([]);
  }) as unknown as ReturnType<typeof getDb>;
  return { sql, calls };
}

const deleted = (calls: string[]) => calls.some((q) => /DELETE FROM comments WHERE id/.test(q));

function req(body: unknown = { commentId: 1, sessionId: "s" }) {
  return new Request("https://x.test/api/comments/flag", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.mocked(auth).mockReset();
  vi.mocked(getDb).mockReset();
  vi.mocked(auth).mockResolvedValue({ userId: null } as never);
});

describe("POST /api/comments/flag — validation", () => {
  it("rejects a malformed body with 400", async () => {
    const { sql } = makeSql({ total: 0, authenticated: 0 });
    vi.mocked(getDb).mockReturnValue(sql);
    const res = await POST(req({ commentId: "not-a-number" }));
    expect(res.status).toBe(400);
  });

  it("returns 404 for a comment that is not on a live public share", async () => {
    const calls: string[] = [];
    const sql = ((strings: TemplateStringsArray) => {
      calls.push(strings.join(" ? "));
      return Promise.resolve([]); // comment-exists check finds nothing
    }) as unknown as ReturnType<typeof getDb>;
    vi.mocked(getDb).mockReturnValue(sql);

    const res = await POST(req());
    expect(res.status).toBe(404);
    expect(deleted(calls)).toBe(false);
  });
});

describe("POST /api/comments/flag — auto-removal threshold (regression: anonymous IP-keyed flags could hard-delete any comment via IPv6 /64 rotation)", () => {
  /**
   * For an anonymous flagger the dedupe identity is the request IP, and a /64
   * IPv6 allocation yields effectively unlimited distinct IPs. Three cheap
   * requests therefore hard-deleted any comment on any public report. Removal
   * must now require FLAG_THRESHOLD distinct SIGNED-IN flaggers.
   */
  it("does NOT delete when the threshold is met by anonymous flags alone", async () => {
    const { sql, calls } = makeSql({ total: 5, authenticated: 0 });
    vi.mocked(getDb).mockReturnValue(sql);

    const res = await POST(req());
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ flagged: true, autoRemoved: false });
    expect(deleted(calls)).toBe(false);
  });

  it("does NOT delete on two authenticated flags (below threshold)", async () => {
    const { sql, calls } = makeSql({ total: 9, authenticated: 2 });
    vi.mocked(getDb).mockReturnValue(sql);

    const res = await POST(req());
    await expect(res.json()).resolves.toEqual({ flagged: true, autoRemoved: false });
    expect(deleted(calls)).toBe(false);
  });

  it("DOES delete once three distinct signed-in flaggers are reached", async () => {
    vi.mocked(auth).mockResolvedValue({ userId: "user_3" } as never);
    const { sql, calls } = makeSql({ total: 3, authenticated: 3 });
    vi.mocked(getDb).mockReturnValue(sql);

    const res = await POST(req());
    await expect(res.json()).resolves.toEqual({ flagged: true, autoRemoved: true });
    expect(deleted(calls)).toBe(true);
  });

  it("counts authenticated flags via a session_id LIKE 'user:%' filter", async () => {
    const { sql, calls } = makeSql({ total: 1, authenticated: 1 });
    vi.mocked(getDb).mockReturnValue(sql);

    await POST(req());
    const countQuery = calls.find((q) => /FROM comment_flags WHERE comment_id/.test(q));
    expect(countQuery).toMatch(/FILTER \(WHERE session_id LIKE 'user:%'\)/);
  });
});

describe("POST /api/comments/flag — flag identity", () => {
  it("keys an anonymous flag on the request IP, not the client sessionId", async () => {
    const { sql, calls } = makeSql({ total: 1, authenticated: 0 });
    vi.mocked(getDb).mockReturnValue(sql);

    await POST(req({ commentId: 1, sessionId: "client-forged-value" }));
    const insert = calls.find((q) => /INSERT INTO comment_flags/.test(q));
    expect(insert).toBeDefined();
    // The forged sessionId must never become the dedupe key.
    expect(insert).not.toMatch(/client-forged-value/);
  });

  it("still records the anonymous flag even though it cannot trigger removal", async () => {
    const { sql, calls } = makeSql({ total: 2, authenticated: 0 });
    vi.mocked(getDb).mockReturnValue(sql);

    await POST(req());
    expect(calls.some((q) => /INSERT INTO comment_flags/.test(q))).toBe(true);
  });
});
