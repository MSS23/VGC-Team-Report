import { afterAll, beforeAll, beforeEach, expect, it, vi } from "vitest";
import { PGlite } from "@electric-sql/pglite";
vi.mock("@/lib/db", () => ({ getDb: vi.fn() }));
vi.mock("@/lib/security/api-guard", () => ({ apiGuard: vi.fn(async () => null) }));
vi.mock("@clerk/nextjs/server", () => ({ auth: vi.fn(), currentUser: vi.fn(async () => ({ firstName: "Trainer" })) }));
vi.mock("@/lib/notifications", () => ({ notifyFollowers: vi.fn() }));
vi.mock("@/lib/utils/diff-state", () => ({ detectChangedSections: () => [] }));
vi.mock("@/lib/cache", () => ({ cacheDel: vi.fn(), cacheInvalidatePrefix: vi.fn(), CacheKeys: { share: (id: string) => id } }));
vi.mock("@/lib/posthog-server", () => ({ captureServerEvent: vi.fn() }));
import { auth } from "@clerk/nextjs/server";
import { getDb } from "@/lib/db";
import { POST, GET } from "../[id]/route";
import { POST as save } from "@/app/api/share/route";
const db = new PGlite();
const state = { paste: "Pikachu\n- Protect", creatorName: "Trainer", matchupPlans: [] };
const ctx = { params: Promise.resolve({ id: "abcd1234" }) };
const request = (body: unknown) => new Request("https://example.test/api/collaboration/abcd1234", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
beforeAll(async () => {
  await db.exec(`CREATE TABLE shares (id TEXT PRIMARY KEY, owner_id TEXT, edit_token TEXT, data JSONB, version INTEGER DEFAULT 1, is_public BOOLEAN DEFAULT FALSE, is_unlisted BOOLEAN DEFAULT TRUE, deleted_at TIMESTAMPTZ, updated_at TIMESTAMPTZ DEFAULT NOW(), search_vector TSVECTOR);
    CREATE TABLE collaborators (share_id TEXT, user_id TEXT, status TEXT);
    CREATE TABLE collaboration_presence (share_id TEXT, user_id TEXT, display_name TEXT, section TEXT, field TEXT, caret INTEGER, seen_at TIMESTAMPTZ, PRIMARY KEY (share_id, user_id));
    CREATE TABLE collaboration_comments (id SERIAL PRIMARY KEY, share_id TEXT, section TEXT, body TEXT, user_id TEXT, display_name TEXT, parent_id INTEGER, created_at TIMESTAMPTZ DEFAULT NOW());`);
}, 30000);
beforeEach(async () => {
  await db.exec("TRUNCATE shares, collaborators, collaboration_presence, collaboration_comments RESTART IDENTITY");
  await db.query("INSERT INTO shares(id,owner_id,edit_token,data) VALUES ('abcd1234','owner','token',$1)", [JSON.stringify(state)]);
  vi.mocked(auth).mockResolvedValue({ userId: "owner" } as never);
  vi.mocked(getDb).mockReturnValue((async (strings: TemplateStringsArray, ...values: unknown[]) => {
    const query = strings.reduce((sql, fragment, i) => sql + (i ? `$${i}` : "") + fragment, "");
    return (await db.query(query, values)).rows;
  }) as never);
});
afterAll(async () => { await db.close(); });
it("allows exactly one simultaneous save against the same report version", async () => {
  const responses = await Promise.all(["A", "B"].map(teamSummary => save(request({ state: { ...state, teamSummary }, existingId: "abcd1234", editToken: "token", expectedVersion: 1 }))));
  expect(responses.map(response => response.status).sort()).toEqual([200, 409]);
  const rows = await db.query<{ version: number }>("SELECT version FROM shares");
  expect(rows.rows[0].version).toBe(2);
});
it("protects preference-only changes with a version bump", async () => {
  expect((await save(request({ state: { ...state, privateFields: ["notes"] }, existingId: "abcd1234", editToken: "token", expectedVersion: 1 }))).status).toBe(200);
  const stale = await save(request({ state, existingId: "abcd1234", editToken: "token", expectedVersion: 1 }));
  expect(stale.status).toBe(409);
  expect((await stale.json()).state.privateFields).toEqual(["notes"]);
});
it("keeps comment replies in the same section and blocks outsiders", async () => {
  expect((await POST(request({ kind: "comment", section: "pokemon:Pikachu", body: "Keep Protect" }), ctx)).status).toBe(200);
  expect((await POST(request({ kind: "comment", section: "overview", body: "Wrong section", parentId: 1 }), ctx)).status).toBe(400);
  expect((await POST(request({ kind: "comment", section: "pokemon:Pikachu", body: "Agreed", parentId: 1 }), ctx)).status).toBe(200);
  const response = await GET(new Request("https://example.test?section=pokemon:Pikachu"), ctx);
  expect((await response.json()).comments).toHaveLength(2);
  const incremental = await GET(new Request("https://example.test?section=pokemon:Pikachu&after=1"), ctx);
  expect((await incremental.json()).comments.map((item: { id: number }) => item.id)).toEqual([2]);
  vi.mocked(auth).mockResolvedValue({ userId: "outsider" } as never);
  expect((await GET(new Request("https://example.test?section=pokemon:Pikachu"), ctx)).status).toBe(403);
  expect((await POST(request({ kind: "comment", section: "overview", body: "No access" }), ctx)).status).toBe(403);
});
it("upserts presence without accumulating heartbeats and hides stale cursors", async () => {
  for (const caret of [2, 8]) expect((await POST(request({ kind: "presence", section: "pokemon:Pikachu", field: "Notes", caret }), ctx)).status).toBe(200);
  const rows = await db.query<{ caret: number }>("SELECT * FROM collaboration_presence");
  expect(rows.rows).toHaveLength(1); expect(rows.rows[0].caret).toBe(8);
  await db.exec("INSERT INTO collaborators VALUES ('abcd1234','teammate','accepted'); UPDATE collaboration_presence SET seen_at=NOW()-INTERVAL '50 seconds'");
  vi.mocked(auth).mockResolvedValue({ userId: "teammate" } as never);
  expect((await (await GET(new Request("https://example.test?section=overview"), ctx)).json()).presence).toHaveLength(0);
  await db.exec("UPDATE collaborators SET status='pending'");
  expect((await GET(new Request("https://example.test?section=overview"), ctx)).status).toBe(403);
});
