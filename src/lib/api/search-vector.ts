import type { getDb } from "@/lib/db";

type Sql = ReturnType<typeof getDb>;

export interface SearchVectorFields {
  creator: string;
  tournament: string;
  paste: string;
  summary: string;
}

/**
 * Weighted `search_vector` value (creator/tournament A, paste B, summary C),
 * as a fragment to interpolate into an INSERT or UPDATE:
 *   sql`UPDATE shares SET search_vector = ${weightedSearchVector(sql, f)} WHERE ...`
 *
 * Not for the quick-share claim route, which writes an unweighted
 * `to_tsvector('english', creator || ' ' || paste)` on purpose, nor for the
 * column-based backfill in `ensureTable`.
 */
export function weightedSearchVector(sql: Sql, { creator, tournament, paste, summary }: SearchVectorFields) {
  return sql`setweight(to_tsvector('english', ${creator}), 'A') ||
    setweight(to_tsvector('english', ${tournament}), 'A') ||
    setweight(to_tsvector('english', ${paste}), 'B') ||
    setweight(to_tsvector('english', ${summary}), 'C')`;
}
