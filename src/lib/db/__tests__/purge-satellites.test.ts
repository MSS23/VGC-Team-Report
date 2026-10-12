import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { NeonQueryFunction } from "@neondatabase/serverless";
import { purgeSatellites, satellitePurgeStatements } from "../purge-satellites";

/**
 * VGC-288 — account deletion left the user's satellite rows behind.
 *
 * /api/cleanup was widened (fd0aa6f) but the parallel hard-delete path in
 * /api/user/delete was not, so comment_flags / share_versions /
 * edit_changelog / collection_items / notifications were never purged on
 * account deletion. The sequence now lives here and both routes use it.
 *
 * There is no DATABASE_URL in CI, so these tests assert the SQL *shape* —
 * which tables, by which key column, in which order — against a fake sql tag.
 * FK order matters (comment_flags points at comments by id), hence the
 * order assertion rather than a set comparison.
 */

type BuiltStatement = {
  text: string;
  params: unknown[];
  then: (resolve?: (rows: unknown[]) => unknown, reject?: (e: unknown) => unknown) => Promise<unknown>;
};

function createFakeSql() {
  const built: BuiltStatement[] = [];
  const executed: string[] = [];

  const tag = (strings: TemplateStringsArray, ...params: unknown[]): BuiltStatement => {
    const text = strings
      .reduce((acc, part, i) => acc + part + (i < params.length ? `$${i + 1}` : ""), "")
      .replace(/\s+/g, " ")
      .trim();
    const statement: BuiltStatement = {
      text,
      params,
      then: (resolve, reject) => {
        executed.push(text);
        return Promise.resolve([] as unknown[]).then(resolve, reject);
      },
    };
    built.push(statement);
    return statement;
  };

  return { sql: tag as unknown as NeonQueryFunction<false, false>, built, executed };
}

/** [operation, table, key column] in the exact order the statements must run. */
const EXPECTED_SEQUENCE: Array<[string, string, string]> = [
  ["DELETE", "comment_flags", "comment_id"],
  ["DELETE", "reactions", "share_id"],
  ["DELETE", "comments", "share_id"],
  ["DELETE", "saved_reports", "share_id"],
  ["DELETE", "share_versions", "share_id"],
  ["DELETE", "edit_changelog", "share_id"],
  ["DELETE", "collection_items", "share_id"],
  ["DELETE", "collaborators", "share_id"],
  ["DELETE", "notifications", "source_share_id"],
  ["UPDATE", "match_logs", "share_id"],
];

const IDS = ["share-a", "share-b"];

function shapeOf(text: string): [string, string, string] {
  const match = /^(DELETE FROM|UPDATE) (\w+)/.exec(text);
  if (!match) throw new Error(`Unrecognised statement: ${text}`);
  const key = /WHERE (\w+)/.exec(text);
  if (!key) throw new Error(`Statement has no WHERE key column: ${text}`);
  return [match[1] === "UPDATE" ? "UPDATE" : "DELETE", match[2], key[1]];
}

describe("satellitePurgeStatements", () => {
  it("purges every satellite table by the expected key column, in FK-safe order", () => {
    const { sql, built } = createFakeSql();
    const statements = satellitePurgeStatements(sql, IDS);

    expect(statements).toHaveLength(EXPECTED_SEQUENCE.length);
    expect(built.map((s) => shapeOf(s.text))).toEqual(EXPECTED_SEQUENCE);
  });

  it("deletes comment_flags before the comments they reference (FK order)", () => {
    const { sql, built } = createFakeSql();
    satellitePurgeStatements(sql, IDS);

    const flags = built.findIndex((s) => s.text.startsWith("DELETE FROM comment_flags"));
    const comments = built.findIndex((s) => s.text.startsWith("DELETE FROM comments"));
    expect(flags).toBeGreaterThanOrEqual(0);
    expect(flags).toBeLessThan(comments);
    // comment_flags are reached through the comments of the doomed shares
    expect(built[flags].text).toContain("SELECT id FROM comments WHERE share_id = ANY($1)");
  });

  it("keeps the user's match history rows and only drops the share reference", () => {
    const { sql, built } = createFakeSql();
    satellitePurgeStatements(sql, IDS);

    expect(built.some((s) => /DELETE FROM match_logs/.test(s.text))).toBe(false);
    const matchLogs = built.filter((s) => s.text.startsWith("UPDATE match_logs"));
    expect(matchLogs).toHaveLength(1);
    expect(matchLogs[0].text).toBe(
      "UPDATE match_logs SET share_id = NULL WHERE share_id = ANY($1)"
    );
  });

  it("passes the share ids as a bound parameter in every statement", () => {
    const { sql, built } = createFakeSql();
    satellitePurgeStatements(sql, IDS);

    for (const statement of built) {
      expect(statement.params).toEqual([IDS]);
      expect(statement.text).toContain("ANY($1)");
      expect(statement.text).not.toContain("share-a");
    }
  });

  it("builds statements without executing them, so callers own the transaction semantics", () => {
    const { sql, executed } = createFakeSql();
    satellitePurgeStatements(sql, IDS);

    // /api/user/delete hands these to sql.transaction([...]) un-awaited
    expect(executed).toEqual([]);
  });
});

describe("purgeSatellites", () => {
  it("awaits every statement in sequence (the /api/cleanup behaviour)", async () => {
    const { sql, executed } = createFakeSql();
    await purgeSatellites(sql, IDS);

    expect(executed.map(shapeOf)).toEqual(EXPECTED_SEQUENCE);
  });
});

describe("both hard-delete paths share one purge sequence", () => {
  const APP = join(__dirname, "..", "..", "..", "app");
  const ROUTES = ["api/cleanup/route.ts", "api/user/delete/route.ts"];

  it.each(ROUTES)("%s imports the shared purge module", (route) => {
    const source = readFileSync(join(APP, route), "utf8");
    expect(source).toContain("@/lib/db/purge-satellites");
  });

  it.each(ROUTES)("%s keeps no inline copy of the satellite purge SQL", (route) => {
    const source = readFileSync(join(APP, route), "utf8");
    // Markers unique to the satellite sequence — if either route grows its own
    // copy again, the two paths can drift exactly as they did in VGC-288.
    expect(source).not.toContain("DELETE FROM comment_flags");
    expect(source).not.toContain("source_share_id = ANY");
    expect(source).not.toContain("UPDATE match_logs");
    expect(source).not.toMatch(/DELETE FROM (comments|reactions) WHERE share_id = ANY/);
  });
});
