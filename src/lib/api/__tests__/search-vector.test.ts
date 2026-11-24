import { describe, expect, it } from "vitest";
import { neon, type SqlTemplate } from "@neondatabase/serverless";
import { weightedSearchVector } from "@/lib/api/search-vector";

// Building a query does not touch the network; only awaiting it would.
const sql = neon("postgresql://user:pass@example.invalid/db");
const compile = (q: { queryData: unknown }) => {
  const { query, params } = (q.queryData as SqlTemplate).toParameterizedQuery();
  return { query: query.replace(/\s+/g, " ").trim(), params };
};

describe("weightedSearchVector", () => {
  it("compiles to the same SQL and params as the inline route copy", () => {
    const f = { creator: "Ash", tournament: "Worlds", paste: "Pikachu", summary: "Rain" };
    const viaHelper = sql`UPDATE shares SET search_vector = ${weightedSearchVector(sql, f)} WHERE id = ${"abcd1234"}`;
    const inline = sql`UPDATE shares SET search_vector =
              setweight(to_tsvector('english', ${f.creator}), 'A') ||
              setweight(to_tsvector('english', ${f.tournament}), 'A') ||
              setweight(to_tsvector('english', ${f.paste}), 'B') ||
              setweight(to_tsvector('english', ${f.summary}), 'C')
        WHERE id = ${"abcd1234"}`;
    expect(compile(viaHelper)).toEqual(compile(inline));
    expect(compile(viaHelper).params).toEqual(["Ash", "Worlds", "Pikachu", "Rain", "abcd1234"]);
  });
});
