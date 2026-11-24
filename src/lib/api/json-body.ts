import { NextResponse } from "next/server";

/**
 * Reads a route handler's JSON body. Malformed or empty JSON yields a 400
 * response instead of throwing into the route's catch-all 500:
 *   const parsed = await readJsonBody(request);
 *   if ("error" in parsed) return parsed.error;
 *   const raw = parsed.body;
 */
export async function readJsonBody(request: Request): Promise<{ body: unknown } | { error: NextResponse }> {
  try {
    return { body: await request.json() };
  } catch {
    return { error: NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }) };
  }
}
