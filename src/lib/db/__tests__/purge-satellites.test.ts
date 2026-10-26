import { describe, expect, it } from "vitest";
import {
  buildAccountSatellitePurge,
  buildShareSatellitePurge,
} from "@/lib/db/purge-satellites";

type Statement = { text: string; params: unknown[] };

/** Minimal tagged-template stand-in that records text + bound params. */
function makeSql() {
  const sql = (strings: TemplateStringsArray, ...params: unknown[]) => {
    const text = strings.join(" ? ").replace(/\s+/g, " ").trim();
    const promise = Promise.resolve([] as unknown[]) as Promise<unknown[]> & Statement;
    promise.text = text;
    promise.params = params;
    return promise;
  };
  return sql;
}

const SHARE_IDS = ["share-1", "share-2"];
const USER_ID = "user_abc123";

const SHARE_KEYED_TABLES = [
  "comment_flags",
  "reactions",
  "comments",
  "saved_reports",
  "share_versions",
  "edit_changelog",
  "collection_items",
  "collaborators",
  "notifications",
];

function texts(statements: unknown[]) {
  return (statements as Statement[]).map((s) => s.text);
}

describe("buildShareSatellitePurge — a SHARE died", () => {
  it("covers every share-keyed satellite table", () => {
    const all = texts(buildShareSatellitePurge(makeSql() as never, SHARE_IDS)).join("\n");
    for (const table of SHARE_KEYED_TABLES) {
      expect(all, table).toContain(table);
    }
  });

  it("keeps the user's match history and only drops the dangling reference", () => {
    const matchLogs = (
      buildShareSatellitePurge(makeSql() as never, SHARE_IDS) as unknown as Statement[]
    ).filter((s) => /match_logs/.test(s.text));
    expect(matchLogs).toHaveLength(1);
    expect(matchLogs[0].text).toBe("UPDATE match_logs SET share_id = NULL WHERE share_id = ANY( ? ::text[])");
    expect(matchLogs[0].params).toEqual([SHARE_IDS]);
  });

  it("emits nothing for an empty id list (never ANY('{}'))", () => {
    expect(buildShareSatellitePurge(makeSql() as never, [])).toEqual([]);
  });

  it("purges comment_flags before comments", () => {
    const list = texts(buildShareSatellitePurge(makeSql() as never, SHARE_IDS));
    expect(list.findIndex((t) => /^DELETE FROM comment_flags/.test(t))).toBeLessThan(
      list.findIndex((t) => /^DELETE FROM comments/.test(t))
    );
  });
});

describe("buildAccountSatellitePurge — an ACCOUNT died", () => {
  it("covers every share-keyed satellite table plus match_logs", () => {
    const all = texts(
      buildAccountSatellitePurge(makeSql() as never, USER_ID, SHARE_IDS)
    ).join("\n");
    for (const table of [...SHARE_KEYED_TABLES, "match_logs"]) {
      expect(all, table).toContain(table);
    }
  });

  it("DELETEs match_logs by user_id so free-text notes do not survive erasure", () => {
    const statements = buildAccountSatellitePurge(
      makeSql() as never,
      USER_ID,
      SHARE_IDS
    ) as unknown as Statement[];
    const matchLogs = statements.filter((s) => /match_logs/.test(s.text));
    expect(matchLogs).toHaveLength(1);
    expect(matchLogs[0].text).toBe("DELETE FROM match_logs WHERE user_id = ?");
    expect(matchLogs[0].params).toEqual([USER_ID]);
    expect(matchLogs[0].text).not.toMatch(/SET share_id = NULL/);
  });

  it("still purges match_logs for a user who owns no shares", () => {
    const statements = buildAccountSatellitePurge(
      makeSql() as never,
      USER_ID,
      []
    ) as unknown as Statement[];
    expect(statements).toHaveLength(1);
    expect(statements[0].text).toBe("DELETE FROM match_logs WHERE user_id = ?");
  });

  it("scopes every statement — no unscoped DELETE/UPDATE", () => {
    const statements = buildAccountSatellitePurge(
      makeSql() as never,
      USER_ID,
      SHARE_IDS
    ) as unknown as Statement[];
    for (const statement of statements) {
      expect(statement.text, statement.text).toMatch(/\bWHERE\b/);
      expect(statement.params.length, statement.text).toBeGreaterThan(0);
      for (const param of statement.params) {
        expect(param === USER_ID || param === SHARE_IDS, statement.text).toBe(true);
      }
    }
  });
});
