import { isRateLimited } from "@/lib/rate-limit";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

/**
 * GET /api/user/search?q=name
 * Search Clerk users by display name. Authenticated users only.
 */
export async function GET(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    if (isRateLimited(`user-search:${ip}`, 20, 60_000)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

    const url = new URL(request.url);
    const q = url.searchParams.get("q")?.trim() ?? "";
    if (q.length < 2) {
      return NextResponse.json({ users: [] });
    }

    const client = await clerkClient();
    const result = await client.users.getUserList({ query: q, limit: 8 });

    const users = result.data
      .filter((u) => u.id !== userId) // Exclude self
      .map((u) => ({
        id: u.id,
        name: u.firstName
          ? `${u.firstName}${u.lastName ? ` ${u.lastName}` : ""}`
          : u.username ?? "Unknown",
        imageUrl: u.imageUrl,
      }));

    return NextResponse.json({ users });
  } catch (e) {
    console.error("User search error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
