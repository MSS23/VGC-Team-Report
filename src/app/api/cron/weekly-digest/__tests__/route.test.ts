import { expect, it, vi } from "vitest";
vi.mock("@/lib/cron-auth", () => ({ isCronAuthorized: () => true }));
vi.mock("@/lib/db", () => ({ getDb: vi.fn() }));
vi.mock("@/lib/email", () => ({ sendEmail: vi.fn(), escapeHtml: (s: string) => s }));
vi.mock("@clerk/nextjs/server", () => ({ clerkClient: vi.fn() }));
import { getDb } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { clerkClient } from "@clerk/nextjs/server";
import { GET } from "../route";
it("does not send digests if account opt-outs cannot be read", async () => {
  vi.mocked(getDb).mockReturnValue(vi.fn(async (strings: TemplateStringsArray) => {
    if (strings.join("").includes("user_preferences")) throw new Error("preferences unavailable");
    return [];
  }) as never);
  const log = vi.spyOn(console, "error").mockImplementation(() => {});
  try {
    expect((await GET(new Request("https://example.test/api/cron/weekly-digest"))).status).toBe(500);
    expect(sendEmail).not.toHaveBeenCalled();
    expect(clerkClient).not.toHaveBeenCalled();
  } finally { log.mockRestore(); }
});
