import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(),
  clerkClient: vi.fn(),
}));
vi.mock("@/lib/security/api-guard", () => ({ apiGuard: vi.fn(async () => null) }));
vi.mock("@/lib/db", () => ({ getDb: vi.fn() }));
vi.mock("@/lib/cache", () => ({
  cacheInvalidatePrefix: vi.fn(async () => undefined),
}));

import { auth, clerkClient } from "@clerk/nextjs/server";
import { getDb } from "@/lib/db";
import { DELETE } from "@/app/api/user/delete/route";

const USER_ID = "user_abc123";
const SHARE_IDS = ["share-1", "share-2"];

type Statement = { text: string; params: unknown[] };

/**
 * Records every statement the route builds, and what was handed to
 * sql.transaction(). Follows the getDb() mocking pattern used by
 * src/app/api/share/__tests__/route.test.ts — no database required.
 */
function makeSql(shareRows: Record<string, unknown>[]) {
  const transactions: Statement[][] = [];

  const sql = (strings: TemplateStringsArray, ...params: unknown[]) => {
    const text = strings.join(" ? ").replace(/\s+/g, " ").trim();
    const rows = /SELECT id, data/.test(text) ? shareRows : [];
    const promise = Promise.resolve(rows) as Promise<unknown[]> & Statement;
    promise.text = text;
    promise.params = params;
    return promise;
  };
  sql.transaction = async (statements: Statement[]) => {
    transactions.push(statements);
    return [];
  };

  return { sql, transactions };
}

function request() {
  return new Request("https://x.test/api/user/delete", { method: "DELETE" });
}

const deleteUser = vi.fn(async () => undefined);

function shareRows(ids: string[]) {
  return ids.map((id) => ({ id, creator_name: "Trainer" }));
}

async function runDelete(ids: string[]) {
  const { sql, transactions } = makeSql(shareRows(ids));
  vi.mocked(auth).mockResolvedValue({ userId: USER_ID } as never);
  vi.mocked(clerkClient).mockResolvedValue({ users: { deleteUser } } as never);
  vi.mocked(getDb).mockReturnValue(sql as never);

  const response = await DELETE(request());
  expect(response.status).toBe(200);
  expect(transactions).toHaveLength(1);
  return { statements: transactions[0], texts: transactions[0].map((s) => s.text) };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("DELETE /api/user/delete — satellite purge (VGC-288)", () => {
  it("purges every satellite table, including the six the account path used to miss", async () => {
    const { texts } = await runDelete(SHARE_IDS);
    const joined = texts.join("\n");

    // Previously absent entirely from the account path:
    expect(joined).toMatch(/DELETE FROM comment_flags/);
    expect(joined).toMatch(/DELETE FROM match_logs/);
    // Previously only handled by editor_id / user_id / own collections:
    expect(joined).toMatch(/DELETE FROM share_versions WHERE share_id = ANY/);
    expect(joined).toMatch(/DELETE FROM edit_changelog WHERE share_id = ANY/);
    expect(joined).toMatch(/DELETE FROM collection_items WHERE share_id = ANY/);
    expect(joined).toMatch(/DELETE FROM notifications WHERE source_share_id = ANY/);
    // Still-expected pre-existing purges:
    expect(joined).toMatch(/DELETE FROM comments WHERE share_id = ANY/);
    expect(joined).toMatch(/DELETE FROM reactions WHERE share_id = ANY/);
    expect(joined).toMatch(/DELETE FROM saved_reports WHERE share_id = ANY/);
    expect(joined).toMatch(/DELETE FROM collaborators WHERE share_id = ANY/);
    expect(joined).toMatch(/DELETE FROM shares WHERE owner_id/);
  });

  it("purges comment_flags before the comments they reference", async () => {
    const { texts } = await runDelete(SHARE_IDS);
    const flags = texts.findIndex((t) => /DELETE FROM comment_flags/.test(t));
    const comments = texts.findIndex((t) => /DELETE FROM comments WHERE share_id/.test(t));
    expect(flags).toBeGreaterThanOrEqual(0);
    expect(comments).toBeGreaterThanOrEqual(0);
    expect(flags).toBeLessThan(comments);
  });

  it("DELETEs match_logs by user_id instead of NULLing share_id (free-text notes must not survive)", async () => {
    const { statements, texts } = await runDelete(SHARE_IDS);

    const matchLogStatements = statements.filter((s) => /match_logs/.test(s.text));
    expect(matchLogStatements).toHaveLength(1);
    expect(matchLogStatements[0].text).toBe("DELETE FROM match_logs WHERE user_id = ?");
    expect(matchLogStatements[0].params).toEqual([USER_ID]);
    // the cleanup path's share-death behaviour must NOT leak into this path
    expect(texts.join("\n")).not.toMatch(/UPDATE match_logs SET share_id = NULL/);
  });

  it("scopes every statement to the requesting user or their own share ids", async () => {
    const { statements } = await runDelete(SHARE_IDS);
    const allowed = new Set<unknown>([USER_ID, "Trainer"]);

    for (const statement of statements) {
      // no unscoped DELETE/UPDATE may ever reach the database
      expect(statement.text, statement.text).toMatch(/\bWHERE\b/);
      expect(statement.params.length, statement.text).toBeGreaterThan(0);
      for (const param of statement.params) {
        const isOwnShareIds =
          Array.isArray(param) && param.every((id) => SHARE_IDS.includes(id as string));
        expect(allowed.has(param) || isOwnShareIds, `${statement.text} :: ${String(param)}`).toBe(
          true
        );
      }
    }
  });

  it("still runs the user-scoped purge when the account owns no shares", async () => {
    const { statements, texts } = await runDelete([]);

    // no ANY('{}') statements for an empty id list
    expect(texts.filter((t) => /ANY\(/.test(t))).toHaveLength(0);
    expect(texts.join("\n")).toMatch(/DELETE FROM match_logs WHERE user_id/);
    expect(texts.join("\n")).toMatch(/DELETE FROM shares WHERE owner_id/);
    for (const statement of statements) {
      expect(statement.text, statement.text).toMatch(/\bWHERE\b/);
    }
  });

  it("never touches the database when Clerk deletion fails", async () => {
    const { sql, transactions } = makeSql(shareRows(SHARE_IDS));
    vi.mocked(auth).mockResolvedValue({ userId: USER_ID } as never);
    vi.mocked(clerkClient).mockResolvedValue({
      users: {
        deleteUser: vi.fn(async () => {
          throw new Error("clerk down");
        }),
      },
    } as never);
    vi.mocked(getDb).mockReturnValue(sql as never);

    const response = await DELETE(request());
    expect(response.status).toBe(500);
    expect(transactions).toHaveLength(0);
  });

  it("rejects an unauthenticated caller", async () => {
    const { sql, transactions } = makeSql([]);
    vi.mocked(auth).mockResolvedValue({ userId: null } as never);
    vi.mocked(getDb).mockReturnValue(sql as never);

    const response = await DELETE(request());
    expect(response.status).toBe(401);
    expect(transactions).toHaveLength(0);
  });
});
