import { afterAll, beforeAll, beforeEach, expect, it, vi } from "vitest";
import { PGlite } from "@electric-sql/pglite";
vi.mock("@/lib/db", () => ({ getDb: vi.fn() }));
vi.mock("@/lib/security/api-guard", () => ({ apiGuard: vi.fn(async () => null) }));
vi.mock("@/lib/rate-limit", () => ({ isRateLimitedAsync: vi.fn(async () => false) }));
vi.mock("@clerk/nextjs/server", () => ({ auth: vi.fn(), currentUser: vi.fn(async () => ({ fullName: "Trainer" })) }));
import { auth } from "@clerk/nextjs/server";
import { getDb } from "@/lib/db";
import { POST } from "../route";
import { POST as claim } from "../[id]/claim/route";

const db = new PGlite();
beforeAll(async () => {
  await db.exec(`
    CREATE TABLE quick_shares (id TEXT PRIMARY KEY, owner_hash TEXT NOT NULL, paste TEXT NOT NULL, expires_at TIMESTAMPTZ, claimed_by TEXT, claimed_share_id TEXT);
    CREATE TABLE shares (id TEXT PRIMARY KEY, edit_token TEXT NOT NULL, data JSONB NOT NULL, version INTEGER, is_public BOOLEAN, is_unlisted BOOLEAN, owner_id TEXT CHECK (owner_id <> 'reject-account'), search_vector TSVECTOR);
  `);
}, 30_000);
beforeEach(async () => {
  await db.exec("TRUNCATE quick_shares, shares");
  vi.mocked(auth).mockResolvedValue({ userId: "creator" } as never);
  vi.mocked(getDb).mockReturnValue((async (strings: TemplateStringsArray, ...values: unknown[]) => {
    const query = strings.reduce((sql, fragment, i) => sql + (i ? `$${i}` : "") + fragment, "");
    return (await db.query(query, values)).rows;
  }) as never);
});
afterAll(async () => { await db.close(); });

async function create() {
  const response = await POST(new Request("https://example.test/api/quick-share", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ paste: "Incineroar\n- Protect" }) }));
  expect(response.status).toBe(201);
  const data = await response.json();
  return { id: data.url.split("/").pop() as string, cookie: response.headers.get("set-cookie")!.split(";")[0], expiresAt: data.expiresAt };
}
function claimRequest(cookie: string) { return new Request("https://example.test/api/quick-share/claim", { method: "POST", headers: { cookie } }); }

it("executes anonymous creation and simultaneous claims in Postgres with one permanent report", async () => {
  const guest = await create();
  expect(new Date(guest.expiresAt).getTime() - Date.now()).toBeGreaterThan(29 * 86_400_000);
  const context = { params: Promise.resolve({ id: guest.id }) };
  const responses = await Promise.all([claim(claimRequest(guest.cookie), context), claim(claimRequest(guest.cookie), context)]);
  expect(responses.every((response) => [200, 409].includes(response.status))).toBe(true);
  const shares = await db.query<{ owner_id: string; is_unlisted: boolean; data: { paste: string } }>("SELECT * FROM shares");
  expect(shares.rows).toHaveLength(1);
  expect(shares.rows[0].owner_id).toBe("creator");
  expect(shares.rows[0].is_unlisted).toBe(true);
  expect(shares.rows[0].data.paste).toContain("Incineroar");
  const rows = await db.query<{ paste: string; expires_at: string | null; claimed_share_id: string }>("SELECT * FROM quick_shares");
  expect(rows.rows[0].paste).toBe("");
  expect(rows.rows[0].expires_at).toBeNull();
  expect(rows.rows[0].claimed_share_id).toHaveLength(8);
}, 15_000);

it("rolls ownership back if report insertion fails, allowing a later successful claim", async () => {
  const guest = await create();
  const context = { params: Promise.resolve({ id: guest.id }) };
  vi.mocked(auth).mockResolvedValue({ userId: "reject-account" } as never);
  expect((await claim(claimRequest(guest.cookie), context)).status).toBe(503);
  const rows = await db.query<{ claimed_by: string | null; paste: string }>("SELECT claimed_by, paste FROM quick_shares");
  expect(rows.rows[0].claimed_by).toBeNull();
  expect(rows.rows[0].paste).toContain("Incineroar");
  vi.mocked(auth).mockResolvedValue({ userId: "creator" } as never);
  expect((await claim(claimRequest(guest.cookie), context)).status).toBe(200);
});

it("cannot claim after expiry even with the correct browser cookie", async () => {
  const guest = await create();
  await db.exec("UPDATE quick_shares SET expires_at = NOW() - INTERVAL '1 second'");
  expect((await claim(claimRequest(guest.cookie), { params: Promise.resolve({ id: guest.id }) })).status).toBe(410);
  expect((await db.query("SELECT * FROM shares")).rows).toHaveLength(0);
});
