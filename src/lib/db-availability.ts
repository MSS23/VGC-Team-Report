/**
 * Cheap, side-effect-free checks for whether a Neon connection is even
 * possible, plus a process-wide "say it once" warning.
 *
 * Why this exists: `getDb()` calls `neon(process.env.DATABASE_URL!)`, which
 * throws `No database connection string was provided to neon()` when the var
 * is missing. Every SSG page that swallowed that error logged its own copy, so
 * a local `next build` printed 82 error lines (81 Mega guide pages + the
 * sitemap) for one single fact: there is no database here. That volume of
 * expected noise is exactly what hides a genuine pre-render failure, so
 * callers should ask *before* querying and let one warning stand for all of
 * them.
 */

/** Whether a connection string exists at all. Does not prove reachability. */
export function isDatabaseConfigured(): boolean {
  const url = process.env.DATABASE_URL;
  return typeof url === "string" && url.trim().length > 0;
}

let warned = false;

/**
 * Log at most one "no database" warning per process, naming the first caller
 * that noticed. Deliberately `warn`, not `error`: during a local build or a
 * preview without secrets this is the expected state, and the pages have a
 * defined empty fallback.
 */
export function warnDatabaseUnavailableOnce(context: string): void {
  if (warned) return;
  warned = true;
  console.warn(
    `[db] DATABASE_URL is not set — skipping database reads (first noticed by ${context}). ` +
      `Affected pages render their empty fallback. This warning is logged once per process.`,
  );
}

/** Test-only: forget that the warning was already emitted. */
export function __resetDatabaseUnavailableWarning(): void {
  warned = false;
}
