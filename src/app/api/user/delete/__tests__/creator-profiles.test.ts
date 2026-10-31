import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock every external boundary so we exercise the real statement-building logic.
vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(),
  clerkClient: vi.fn(),
}));
vi.mock("@/lib/security/api-guard", () => ({ apiGuard: vi.fn(async () => null) }));
vi.mock("@/lib/cache", () => ({ cacheInvalidatePrefix: vi.fn(async () => undefined) }));
vi.mock("@/lib/db", () => ({ getDb: vi.fn() }));

import { auth, clerkClient } from "@clerk/nextjs/server";
import { getDb } from "@/lib/db";
import { DELETE } from "@/app/api/user/delete/route";

type ShareRow = { id: string; creator_name: string | null };

/**
 * A tagged-template `sql` stand-in that records every query it is handed, so a
 * test can assert on the statements queued into `sql.transaction([...])`.
 * Interpolated values are captured alongside the flattened query text.
 */
function makeSql(shares: ShareRow[]) {
  const calls: { q: string; vals: unknown[] }[] = [];
  const sql = ((strings: TemplateStringsArray, ...vals: unknown[]) => {
    const q = strings.join(" ? ");
    calls.push({ q, vals });
    if (/FROM shares WHERE owner_id/.test(q)) return Promise.resolve(shares);
    return Promise.resolve([]);
  }) as unknown as ReturnType<typeof getDb> & {
    transaction: ReturnType<typeof vi.fn>;
  };
  sql.transaction = vi.fn(async () => []);
  return { sql, calls };
}

/** The creator_profiles DELETE statements queued for the transaction. */
function profileDeletes(calls: { q: string; vals: unknown[] }[]) {
  return calls.filter((c) => /DELETE FROM creator_profiles/.test(c.q));
}

const USER = "user_attacker";

beforeEach(() => {
  vi.mocked(auth).mockReset();
  vi.mocked(getDb).mockReset();
  vi.mocked(clerkClient).mockReset();

  vi.mocked(auth).mockResolvedValue({ userId: USER } as never);
  vi.mocked(clerkClient).mockResolvedValue({
    users: { deleteUser: vi.fn(async () => undefined) },
  } as never);
});

function req() {
  return new Request("https://x.test/api/user/delete", { method: "DELETE" });
}

describe("DELETE /api/user/delete — auth", () => {
  it("returns 401 when not signed in", async () => {
    vi.mocked(auth).mockResolvedValue({ userId: null } as never);
    const res = await DELETE(req());
    expect(res.status).toBe(401);
  });
});

describe("DELETE /api/user/delete — creator_profiles removal (regression: deleting by creatorName alone let one account destroy another creator's profile)", () => {
  /**
   * `creatorName` is unbound free text on the share payload, and
   * creator_profiles is keyed on the name with no owner column. Publishing a
   * share carrying a victim's creator name and then deleting your own account
   * ran `DELETE FROM creator_profiles WHERE LOWER(name) = LOWER(<victim>)`.
   * The delete must now be guarded by a NOT EXISTS on surviving shares.
   */
  it("guards the profile delete with a NOT EXISTS on shares owned by anyone else", async () => {
    const { sql, calls } = makeSql([{ id: "s1", creator_name: "VictimCreator" }]);
    vi.mocked(getDb).mockReturnValue(sql);

    const res = await DELETE(req());
    expect(res.status).toBe(200);

    const deletes = profileDeletes(calls);
    expect(deletes).toHaveLength(1);
    expect(deletes[0].q).toMatch(/NOT EXISTS/);
    expect(deletes[0].q).toMatch(/FROM shares/);
    expect(deletes[0].q).toMatch(/owner_id IS DISTINCT FROM/);
    // The unguarded form must be gone.
    expect(deletes[0].q).not.toMatch(/WHERE LOWER\(name\) = LOWER\( \? \)\s*$/);
  });

  it("queues one guarded delete per DISTINCT creator name, not just the first row", async () => {
    const { sql, calls } = makeSql([
      { id: "s1", creator_name: "AliasOne" },
      { id: "s2", creator_name: "AliasTwo" },
      { id: "s3", creator_name: "aliasone" }, // same name, different case
    ]);
    vi.mocked(getDb).mockReturnValue(sql);

    await DELETE(req());

    const deletes = profileDeletes(calls);
    expect(deletes).toHaveLength(2);
    const names = deletes.flatMap((d) => d.vals.map(String));
    expect(names).toContain("AliasOne");
    expect(names).toContain("AliasTwo");
    // Every one of them carries the guard.
    for (const d of deletes) expect(d.q).toMatch(/NOT EXISTS/);
  });

  it("queues no profile delete when the user published under no creator name", async () => {
    const { sql, calls } = makeSql([{ id: "s1", creator_name: null }]);
    vi.mocked(getDb).mockReturnValue(sql);

    await DELETE(req());
    expect(profileDeletes(calls)).toHaveLength(0);
  });

  it("ignores a blank / whitespace-only creator name", async () => {
    const { sql, calls } = makeSql([{ id: "s1", creator_name: "   " }]);
    vi.mocked(getDb).mockReturnValue(sql);

    await DELETE(req());
    expect(profileDeletes(calls)).toHaveLength(0);
  });

  it("still deletes the user's own shares and runs one transaction", async () => {
    const { sql, calls } = makeSql([{ id: "s1", creator_name: "Me" }]);
    vi.mocked(getDb).mockReturnValue(sql);

    await DELETE(req());

    expect(calls.some((c) => /DELETE FROM shares WHERE owner_id/.test(c.q))).toBe(true);
    expect(
      (sql as unknown as { transaction: ReturnType<typeof vi.fn> }).transaction,
    ).toHaveBeenCalledTimes(1);
  });

  it("queues the shares delete BEFORE the creator_profiles delete, so the guard only sees other owners' rows", async () => {
    const { sql, calls } = makeSql([{ id: "s1", creator_name: "Me" }]);
    vi.mocked(getDb).mockReturnValue(sql);

    await DELETE(req());

    const sharesIdx = calls.findIndex((c) => /DELETE FROM shares WHERE owner_id/.test(c.q));
    const profileIdx = calls.findIndex((c) => /DELETE FROM creator_profiles/.test(c.q));
    expect(sharesIdx).toBeGreaterThanOrEqual(0);
    expect(profileIdx).toBeGreaterThan(sharesIdx);
  });
});
